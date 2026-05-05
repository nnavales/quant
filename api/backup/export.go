package backup

import (
	"archive/zip"
	"encoding/csv"
	"io"
	"strconv"

	"github.com/nnavales/summit/api/finance"
	"github.com/nnavales/summit/api/networth"
)

func toTransaction(data []finance.TransactionRowDTO) []Transaction {
	if len(data) == 0 {
		return nil
	}

	// Assign synthetic group IDs for installment groups
	groupCounter := 0
	dbGroupToBackupGroup := make(map[string]int)

	var transactions []Transaction
	for _, tx := range data {
		var transaction Transaction
		transaction.Date = tx.Date.String()
		if tx.Description != nil {
			transaction.Description = *tx.Description
		}
		if tx.InstallmentNumber != nil {
			transaction.InstallmentNumber = *tx.InstallmentNumber
		}

		if tx.TotalInstallments != nil {
			transaction.TotalInstallments = *tx.TotalInstallments
		}
		transaction.Type = string(tx.Type)
		if tx.Frequency != nil {
			transaction.Frequency = string(*tx.Frequency)
		}
		transaction.IsDone = tx.IsPaid
		transaction.ExchangeRate = tx.ExchangeRate

		transaction.Currency = string(tx.Currency)
		if tx.Currency == "ARS" {
			transaction.AmountARS = tx.Amount
			transaction.AmountUSD = tx.Amount.Div(int64(tx.ExchangeRate))
		} else if tx.Currency == "USD" {
			transaction.AmountUSD = tx.Amount
			transaction.AmountARS = tx.Amount.Mul(int64(tx.ExchangeRate))
		}

		if tx.CategoryName != nil {
			transaction.Category = *tx.CategoryName
		}
		if tx.SubcategoryName != nil {
			transaction.Subcategory = *tx.SubcategoryName
		}
		transaction.Channel = tx.ChannelName
		if tx.AccountName != nil {
			transaction.Account = *tx.AccountName
		}

		// Assign synthetic GroupID for installments
		if tx.InstallmentGroupID != nil && *tx.InstallmentGroupID != "" {
			if gid, ok := dbGroupToBackupGroup[*tx.InstallmentGroupID]; ok {
				transaction.GroupID = gid
			} else {
				groupCounter++
				dbGroupToBackupGroup[*tx.InstallmentGroupID] = groupCounter
				transaction.GroupID = groupCounter
			}
		}

		transactions = append(transactions, transaction)
	}

	return transactions
}

func toHistoricalEntry(data []finance.HistoricalRowDTO) []HistoricalEntry {
	if len(data) == 0 {
		return nil
	}
	var historicalEntries []HistoricalEntry
	for _, h := range data {
		var historical HistoricalEntry
		historical.Month = h.Month
		historical.Expense = h.Expense
		historical.ExpenseFixed = h.ExpenseFixed
		historical.ExpenseVariable = h.ExpenseVariable
		historical.Income = h.Income
		historical.IncomeFixed = h.IncomeFixed
		historical.IncomeVariable = h.IncomeVariable
		historical.ExchangeRate = h.ExchangeRate
		historical.Savings = h.Savings
		historical.Source = h.Source

		historicalEntries = append(historicalEntries, historical)
	}
	return historicalEntries
}

func toAsset(data []networth.Asset) []Asset {
	if len(data) == 0 {
		return nil
	}

	var assets []Asset
	for _, a := range data {
		var asset Asset
		asset.Amount = a.Amount
		asset.Currency = string(a.Currency)
		asset.Name = a.Name
		asset.Type = string(a.Type)

		assets = append(assets, asset)
	}

	return assets
}

func writeTransactionsCSV(data []Transaction, w io.Writer) error {
	csvW := csv.NewWriter(w)
	csvW.Write([]string{
		"date", "description", "installment_number",
		"total_installments", "group_id", "type", "frequency", "is_done",
		"exchange_rate", "amount_ars", "amount_usd", "currency",
		"category", "subcategory", "channel", "account",
	})

	var txRecords [][]string
	for _, row := range data {
		record := []string{
			row.Date,
			row.Description,
			strconv.Itoa(row.InstallmentNumber),
			strconv.Itoa(row.TotalInstallments),
			strconv.Itoa(row.GroupID),
			row.Type,
			row.Frequency,
			strconv.FormatBool(row.IsDone),
			strconv.FormatFloat(row.ExchangeRate, 'f', 2, 64),
			row.AmountARS.String(),
			row.AmountUSD.String(),
			row.Currency,
			row.Category,
			row.Subcategory,
			row.Channel,
			row.Account,
		}
		txRecords = append(txRecords, record)
	}

	err := csvW.WriteAll(txRecords)
	if err != nil {
		return err
	}
	return nil
}

func writeHistoricalCSV(data []HistoricalEntry, w io.Writer) error {
	csvW := csv.NewWriter(w)
	csvW.Write([]string{
		"month", "income", "income_variable",
		"income_fixed", "expense", "expense_fixed",
		"expense_variable", "exchange_rate", "savings",
		"source",
	})

	var histRecords [][]string
	for _, row := range data {
		record := []string{
			row.Month,
			row.Income.String(),
			row.IncomeVariable.String(),
			row.IncomeFixed.String(),
			row.Expense.String(),
			row.ExpenseFixed.String(),
			row.ExpenseVariable.String(),
			strconv.FormatFloat(row.ExchangeRate, 'f', 2, 64),
			row.Savings.String(),
			row.Source,
		}
		histRecords = append(histRecords, record)
	}

	err := csvW.WriteAll(histRecords)
	if err != nil {
		return err
	}
	return nil
}

func writeNetWorthCSV(data []Asset, w io.Writer) error {
	csvW := csv.NewWriter(w)
	csvW.Write([]string{
		"name", "amount", "currency", "type",
	})

	var nwRecords [][]string
	for _, row := range data {
		record := []string{
			row.Name,
			row.Amount.String(),
			row.Currency,
			row.Type,
		}
		nwRecords = append(nwRecords, record)
	}

	err := csvW.WriteAll(nwRecords)
	if err != nil {
		return err
	}
	return nil
}

func WriteZip(data Data, out io.Writer) error {
	zw := zip.NewWriter(out)
	defer zw.Close()

	txw, err := zw.Create("transactions.csv")
	if err != nil {
		return err
	}
	if err = writeTransactionsCSV(data.Transactions, txw); err != nil {
		return err
	}

	hw, err := zw.Create("historical.csv")
	if err != nil {
		return err
	}
	if err = writeHistoricalCSV(data.HistoricalEntries, hw); err != nil {
		return err
	}

	nww, err := zw.Create("networth.csv")
	if err != nil {
		return err
	}
	if err = writeNetWorthCSV(data.NetWorth, nww); err != nil {
		return err
	}

	return nil
}
