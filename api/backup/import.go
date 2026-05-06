package backup

import (
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"sort"
	"strconv"
	"time"

	"github.com/nnavales/quant/api/entries"
	"github.com/nnavales/quant/api/finance"
	"github.com/nnavales/quant/api/historical"
	"github.com/nnavales/quant/api/installments"
	"github.com/nnavales/quant/api/money"
	"github.com/nnavales/quant/api/networth"
	"github.com/nnavales/quant/api/timeutils"
	"github.com/nnavales/quant/api/transactions"
	"github.com/oklog/ulid/v2"
)

/*
This file contains the functions for transforming the data:
	- Importing all the transactions from a CSV
		- It should create categories -> subcateogories and channels -> accounts
	- Importing all the historical entries from a CSV
	- Importing all the networth assets from a CSV

	assets.csv format:
		"name", "amount", "currency", "type",

	transactions.csv format:
		"date", "description", "installment_number",
		"total_installments", "group_id", "type", "frequency", "is_done",
		"exchange_rate", "amount_ars", "amount_usd", "currency",
		"category", "subcategory", "channel", "account",

	historical.csv format:
		"month", "income", "income_variable",
		"income_fixed", "expense", "expense_fixed",
		"expense_variable", "exchange_rate", "savings",
		"source",
*/

var ErrInvalidCSV = errors.New("invalid csv")

func fromCSVtoTransactions(r io.Reader) ([]Transaction, error) {
	csvr := csv.NewReader(r)
	records, err := csvr.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to read csv: %w", err)
	}

	var transactions []Transaction
	for i, row := range records {
		if i == 0 {
			continue
		}

		if len(row) != 16 {
			return nil, fmt.Errorf("row %d: expected 16 columns, got %d: %w", i+1, len(row), ErrInvalidCSV)
		}

		tx := Transaction{
			Date:        row[0],
			Description: row[1],
			Type:        row[5],
			Frequency:   row[6],
			Currency:    row[11],
			Category:    row[12],
			Subcategory: row[13],
			Channel:     row[14],
			Account:     row[15],
		}

		if row[2] != "" {
			n, err := strconv.Atoi(row[2])
			if err != nil {
				return nil, fmt.Errorf("row %d: invalid installment_number: %w", i+1, err)
			}
			tx.InstallmentNumber = n
		}

		if row[3] != "" {
			n, err := strconv.Atoi(row[3])
			if err != nil {
				return nil, fmt.Errorf("row %d: invalid total_installments: %w", i+1, err)
			}
			tx.TotalInstallments = n
		}

		if row[4] != "" {
			n, err := strconv.Atoi(row[4])
			if err != nil {
				return nil, fmt.Errorf("row %d: invalid group_id: %w", i+1, err)
			}
			tx.GroupID = n
		}

		if row[7] != "" {
			b, err := strconv.ParseBool(row[7])
			if err != nil {
				return nil, fmt.Errorf("row %d: invalid is_done: %w", i+1, err)
			}
			tx.IsDone = b
		}

		if row[8] != "" {
			f, err := strconv.ParseFloat(row[8], 64)
			if err != nil {
				return nil, fmt.Errorf("row %d: invalid exchange_rate: %w", i+1, err)
			}
			tx.ExchangeRate = f
		}

		if row[9] != "" {
			m, err := money.FromString(row[9])
			if err != nil {
				return nil, fmt.Errorf("row %d: invalid amount_ars: %w", i+1, err)
			}
			tx.AmountARS = m
		}

		if row[10] != "" {
			m, err := money.FromString(row[10])
			if err != nil {
				return nil, fmt.Errorf("row %d: invalid amount_usd: %w", i+1, err)
			}
			tx.AmountUSD = m
		}

		transactions = append(transactions, tx)
	}

	return transactions, nil
}

func fromCSVtoAssets(r io.Reader) ([]Asset, error) {
	csvr := csv.NewReader(r)
	records, err := csvr.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to read csv: %w", err)
	}

	var assets []Asset
	for i, row := range records {
		if i == 0 {
			continue
		}

		if len(row) != 4 {
			return nil, fmt.Errorf("row %d: expected 4 columns, got %d: %w", i+1, len(row), ErrInvalidCSV)
		}

		asset := Asset{
			Name:     row[0],
			Currency: row[2],
			Type:     row[3],
		}

		if row[1] != "" {
			m, err := money.FromString(row[1])
			if err != nil {
				return nil, fmt.Errorf("row %d: invalid amount: %w", i+1, err)
			}
			asset.Amount = m
		}

		assets = append(assets, asset)
	}

	return assets, nil
}

func fromCSVtoHistorical(r io.Reader) ([]HistoricalEntry, error) {
	csvr := csv.NewReader(r)
	records, err := csvr.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to read csv: %w", err)
	}

	var entries []HistoricalEntry
	for i, row := range records {
		if i == 0 {
			continue
		}

		if len(row) != 10 {
			return nil, fmt.Errorf("row %d: expected 10 columns, got %d: %w", i+1, len(row), ErrInvalidCSV)
		}

		entry := HistoricalEntry{
			Month:  row[0],
			Source: row[9],
		}

		if entry.Source != "historical" {
			continue
		}

		if row[1] != "" {
			m, err := money.FromString(row[1])
			if err != nil {
				return nil, fmt.Errorf("row %d: invalid income: %w", i+1, err)
			}
			entry.Income = m
		}

		if row[2] != "" {
			m, err := money.FromString(row[2])
			if err != nil {
				return nil, fmt.Errorf("row %d: invalid income_variable: %w", i+1, err)
			}
			entry.IncomeVariable = m
		}

		if row[3] != "" {
			m, err := money.FromString(row[3])
			if err != nil {
				return nil, fmt.Errorf("row %d: invalid income_fixed: %w", i+1, err)
			}
			entry.IncomeFixed = m
		}

		if row[4] != "" {
			m, err := money.FromString(row[4])
			if err != nil {
				return nil, fmt.Errorf("row %d: invalid expense: %w", i+1, err)
			}
			entry.Expense = m
		}

		if row[5] != "" {
			m, err := money.FromString(row[5])
			if err != nil {
				return nil, fmt.Errorf("row %d: invalid expense_fixed: %w", i+1, err)
			}
			entry.ExpenseFixed = m
		}

		if row[6] != "" {
			m, err := money.FromString(row[6])
			if err != nil {
				return nil, fmt.Errorf("row %d: invalid expense_variable: %w", i+1, err)
			}
			entry.ExpenseVariable = m
		}

		if row[7] != "" {
			f, err := strconv.ParseFloat(row[7], 64)
			if err != nil {
				return nil, fmt.Errorf("row %d: invalid exchange_rate: %w", i+1, err)
			}
			entry.ExchangeRate = f
		}

		if row[8] != "" {
			m, err := money.FromString(row[8])
			if err != nil {
				return nil, fmt.Errorf("row %d: invalid savings: %w", i+1, err)
			}
			entry.Savings = m
		}

		entries = append(entries, entry)
	}

	return entries, nil
}

func toTransactionAgg(data []Transaction, catMap, subMap, chMap, accMap map[string]string) ([]finance.TransactionAggregate, error) {
	if len(data) == 0 {
		return nil, nil
	}

	now := time.Now()
	groups := make(map[int][]Transaction)
	var singles []Transaction

	for _, tx := range data {
		if tx.GroupID > 0 {
			groups[tx.GroupID] = append(groups[tx.GroupID], tx)
		} else {
			singles = append(singles, tx)
		}
	}

	var aggs []finance.TransactionAggregate

	for _, tx := range singles {
		date, err := timeutils.ParseDate(tx.Date)
		if err != nil {
			return nil, fmt.Errorf("invalid date %q: %w", tx.Date, err)
		}

		tType := transactions.TransactionType(tx.Type)
		var freq *transactions.TransactionFrequency
		if tx.Frequency != "" {
			f := transactions.TransactionFrequency(tx.Frequency)
			freq = &f
		}

		var desc *string
		if tx.Description != "" {
			desc = &tx.Description
		}

		t := transactions.Transaction{
			ID:          ulid.Make().String(),
			Date:        date,
			Description: desc,
			Type:        tType,
			Frequency:   freq,
			IsPaid:      tx.IsDone,
			CreatedAt:   now,
		}

		currency := entries.Currency(tx.Currency)
		if currency != entries.CurrencyARS {
			currency = entries.CurrencyUSD
		}
		amount := tx.AmountUSD
		if currency == entries.CurrencyARS {
			amount = tx.AmountARS
		}
		var accountID *string
		if tx.Account != "" {
			if id, ok := accMap[chMap[tx.Channel]+"|"+tx.Account]; ok {
				accountID = &id
			}
		}
		var categoryID *string
		if tx.Category != "" {
			if id, ok := catMap[tx.Category]; ok {
				categoryID = &id
			}
		}
		var subcategoryID *string
		if tx.Subcategory != "" {
			if id, ok := subMap[catMap[tx.Category]+"|"+tx.Subcategory]; ok {
				subcategoryID = &id
			}
		}

		channelID := tx.Channel
		if id, ok := chMap[tx.Channel]; ok {
			channelID = id
		}

		e := entries.Entry{
			ID:            ulid.Make().String(),
			TransactionID: t.ID,
			ChannelID:     channelID,
			AccountID:     accountID,
			Amount:        amount,
			Currency:      currency,
			ExchangeRate:  tx.ExchangeRate,
			CategoryID:    categoryID,
			SubcategoryID: subcategoryID,
			CreatedAt:     now,
		}

		aggs = append(aggs, finance.TransactionAggregate{
			Group: nil,
			Items: []struct {
				Transaction transactions.Transaction
				Entry       entries.Entry
			}{{Transaction: t, Entry: e}},
		})
	}

	for _, txs := range groups {
		sort.Slice(txs, func(i, j int) bool {
			return txs[i].InstallmentNumber < txs[j].InstallmentNumber
		})

		var startDate timeutils.Date
		var currency entries.Currency
		var totalAmount money.Money
		var desc string
		var totalInstallments int

		items := make([]struct {
			Transaction transactions.Transaction
			Entry       entries.Entry
		}, 0, len(txs))

		for i, tx := range txs {
			date, err := timeutils.ParseDate(tx.Date)
			if err != nil {
				return nil, fmt.Errorf("invalid date %q: %w", tx.Date, err)
			}
			if i == 0 {
				startDate = date
				desc = tx.Description
				totalInstallments = tx.TotalInstallments
			}

			tType := transactions.TransactionType(tx.Type)
			var freq *transactions.TransactionFrequency
			if tx.Frequency != "" {
				f := transactions.TransactionFrequency(tx.Frequency)
				freq = &f
			}

			var txDesc *string
			if tx.Description != "" {
				txDesc = &tx.Description
			}

			t := transactions.Transaction{
				ID:          ulid.Make().String(),
				Date:        date,
				Description: txDesc,
				Type:        tType,
				Frequency:   freq,
				IsPaid:      tx.IsDone,
				CreatedAt:   now,
			}

			c := entries.Currency(tx.Currency)
			if c != entries.CurrencyARS {
				c = entries.CurrencyUSD
			}
			amount := tx.AmountUSD
			if c == entries.CurrencyARS {
				amount = tx.AmountARS
			}
			if i == 0 {
				currency = c
			}

			var accountID *string
			if tx.Account != "" {
				if id, ok := accMap[chMap[tx.Channel]+"|"+tx.Account]; ok {
					accountID = &id
				}
			}
			var categoryID *string
			if tx.Category != "" {
				if id, ok := catMap[tx.Category]; ok {
					categoryID = &id
				}
			}
			var subcategoryID *string
			if tx.Subcategory != "" {
				if id, ok := subMap[catMap[tx.Category]+"|"+tx.Subcategory]; ok {
					subcategoryID = &id
				}
			}

			channelID := tx.Channel
			if id, ok := chMap[tx.Channel]; ok {
				channelID = id
			}

			e := entries.Entry{
				ID:            ulid.Make().String(),
				TransactionID: t.ID,
				ChannelID:     channelID,
				AccountID:     accountID,
				Amount:        amount,
				Currency:      c,
				ExchangeRate:  tx.ExchangeRate,
				CategoryID:    categoryID,
				SubcategoryID: subcategoryID,
				CreatedAt:     now,
			}

			totalAmount = totalAmount.Add(amount)
			items = append(items, struct {
				Transaction transactions.Transaction
				Entry       entries.Entry
			}{Transaction: t, Entry: e})
		}

		ig := installments.InstallmentGroup{
			ID:                ulid.Make().String(),
			TotalInstallments: totalInstallments,
			Description:       desc,
			OriginalAmount:    totalAmount,
			Currency:          currency,
			StartDate:         startDate,
			IsCanceled:        false,
			CreatedAt:         now,
		}

		for i := range items {
			items[i].Transaction.SetInstallmentGroupID(ig.ID)
			items[i].Transaction.SetInstallmentNumber(i + 1)
		}

		aggs = append(aggs, finance.TransactionAggregate{
			Group: &ig,
			Items: items,
		})
	}

	return aggs, nil
}

func toDomainHistoricalEntry(data []HistoricalEntry) ([]historical.HistoricalEntry, error) {
	if len(data) == 0 {
		return nil, nil
	}
	var historicalEntries []historical.HistoricalEntry
	for _, h := range data {
		t, err := time.Parse("2006-01", h.Month)
		if err != nil {
			return nil, fmt.Errorf("invalid month %q: %w", h.Month, err)
		}
		historicalEntries = append(historicalEntries, historical.HistoricalEntry{
			Date:               timeutils.NewDate(t),
			ExchangeRate:       h.ExchangeRate,
			IncomeUSD:          h.Income,
			IncomeFixedUSD:     h.IncomeFixed,
			IncomeVariableUSD:  h.IncomeVariable,
			ExpenseUSD:         h.Expense,
			ExpenseFixedUSD:    h.ExpenseFixed,
			ExpenseVariableUSD: h.ExpenseVariable,
			SavingsUSD:         h.Savings,
			CreatedAt:          time.Now(),
		})
	}
	return historicalEntries, nil
}

func toDomainAsset(data []Asset) ([]networth.Asset, error) {
	if len(data) == 0 {
		return nil, nil
	}

	var assets []networth.Asset
	for _, a := range data {
		assets = append(assets, networth.Asset{
			ID:        ulid.Make().String(),
			Name:      a.Name,
			Amount:    a.Amount,
			Currency:  entries.Currency(a.Currency),
			Type:      networth.AssetType(a.Type),
			CreatedAt: time.Now(),
		})
	}

	return assets, nil
}
