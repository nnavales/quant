package backup

import (
	"archive/zip"
	"encoding/csv"
	"io"
	"strconv"

	"github.com/nnavales/quant/api/finance"
	"github.com/nnavales/quant/api/networth"
	"github.com/nnavales/quant/api/planning"
	"github.com/nnavales/quant/api/presets"
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

		switch tx.Currency {
		case "ARS":
			transaction.AmountARS = tx.Amount
			transaction.AmountUSD = tx.Amount.Div(int64(tx.ExchangeRate))
		case "USD":

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

func toPreset(data []presets.Preset) []Preset {
	if len(data) == 0 {
		return nil
	}

	var out []Preset
	for _, p := range data {
		preset := Preset{
			Name:      p.Name,
			Type:      p.Type,
			Frequency: safeStr(p.Frequency),
			IsDone:    safeBool(p.IsPaid),
			Currency:  safeStr(p.Currency),
		}
		if p.Description != nil {
			preset.Desription = *p.Description
		}
		out = append(out, preset)
	}
	return out
}

func safeStr(s *string) string {
	if s != nil {
		return *s
	}
	return ""
}

func safeBool(b *bool) bool {
	if b != nil {
		return *b
	}
	return false
}

func toPlanningInput(data []planning.PlanningInput) []PlanningInputBackup {
	if len(data) == 0 {
		return nil
	}
	var out []PlanningInputBackup
	for _, p := range data {
		out = append(out, PlanningInputBackup{
			Year:        p.Year,
			Description: p.Description,
			Type:        string(p.Type),
			Currency:    string(p.Currency),
			January:     p.January,
			February:    p.February,
			March:       p.March,
			April:       p.April,
			May:         p.May,
			June:        p.June,
			July:        p.July,
			August:      p.August,
			September:   p.September,
			October:     p.October,
			November:    p.November,
			December:    p.December,
		})
	}
	return out
}

func toPlanningGoal(data []planning.PlanningGoal) []PlanningGoalBackup {
	if len(data) == 0 {
		return nil
	}
	var out []PlanningGoalBackup
	for _, p := range data {
		out = append(out, PlanningGoalBackup{
			Year:      p.Year,
			Metric:    string(p.Metric),
			January:   p.January,
			February:  p.February,
			March:     p.March,
			April:     p.April,
			May:       p.May,
			June:      p.June,
			July:      p.July,
			August:    p.August,
			September: p.September,
			October:   p.October,
			November:  p.November,
			December:  p.December,
		})
	}
	return out
}

func toPlanningExchangeRate(data []planning.ExchangeRateInput) []PlanningExchangeRateBackup {
	if len(data) == 0 {
		return nil
	}
	var out []PlanningExchangeRateBackup
	for _, p := range data {
		out = append(out, PlanningExchangeRateBackup{
			Month: p.Month.String(),
			Rate:  p.Rate,
		})
	}
	return out
}

func toPlanningConfig(data []planning.PlanningConfig) []PlanningConfigBackup {
	if len(data) == 0 {
		return nil
	}
	var out []PlanningConfigBackup
	for _, p := range data {
		out = append(out, PlanningConfigBackup{
			Year:           p.Year,
			InitialCapital: p.InitialCapital,
		})
	}
	return out
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
			row.AmountARS.StringESAr(),
			row.AmountUSD.StringESAr(),
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
			row.Income.StringESAr(),
			row.IncomeVariable.StringESAr(),
			row.IncomeFixed.StringESAr(),
			row.Expense.StringESAr(),
			row.ExpenseFixed.StringESAr(),
			row.ExpenseVariable.StringESAr(),
			strconv.FormatFloat(row.ExchangeRate, 'f', 2, 64),
			row.Savings.StringESAr(),
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
			row.Amount.StringESAr(),
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

func writePresetsCSV(data []Preset, w io.Writer) error {
	csvW := csv.NewWriter(w)
	csvW.Write([]string{
		"name", "description", "type", "frequency",
		"category", "subcategory", "channel", "account",
		"is_done", "currency",
	})

	var records [][]string
	for _, row := range data {
		record := []string{
			row.Name,
			row.Desription,
			row.Type,
			row.Frequency,
			row.Category,
			row.Subcategory,
			row.Channel,
			row.Account,
			strconv.FormatBool(row.IsDone),
			row.Currency,
		}
		records = append(records, record)
	}

	return csvW.WriteAll(records)
}

func writePlanningInputsCSV(data []PlanningInputBackup, w io.Writer) error {
	csvW := csv.NewWriter(w)
	csvW.Write([]string{
		"year", "description", "type", "currency",
		"january", "february", "march", "april",
		"may", "june", "july", "august",
		"september", "october", "november", "december",
	})

	var records [][]string
	for _, row := range data {
		records = append(records, []string{
			strconv.Itoa(row.Year),
			row.Description,
			row.Type,
			row.Currency,
			row.January.StringESAr(),
			row.February.StringESAr(),
			row.March.StringESAr(),
			row.April.StringESAr(),
			row.May.StringESAr(),
			row.June.StringESAr(),
			row.July.StringESAr(),
			row.August.StringESAr(),
			row.September.StringESAr(),
			row.October.StringESAr(),
			row.November.StringESAr(),
			row.December.StringESAr(),
		})
	}
	return csvW.WriteAll(records)
}

func writePlanningGoalsCSV(data []PlanningGoalBackup, w io.Writer) error {
	csvW := csv.NewWriter(w)
	csvW.Write([]string{
		"year", "metric",
		"january", "february", "march", "april",
		"may", "june", "july", "august",
		"september", "october", "november", "december",
	})

	var records [][]string
	for _, row := range data {
		records = append(records, []string{
			strconv.Itoa(row.Year),
			row.Metric,
			row.January.StringESAr(),
			row.February.StringESAr(),
			row.March.StringESAr(),
			row.April.StringESAr(),
			row.May.StringESAr(),
			row.June.StringESAr(),
			row.July.StringESAr(),
			row.August.StringESAr(),
			row.September.StringESAr(),
			row.October.StringESAr(),
			row.November.StringESAr(),
			row.December.StringESAr(),
		})
	}
	return csvW.WriteAll(records)
}

func writePlanningExchangeRatesCSV(data []PlanningExchangeRateBackup, w io.Writer) error {
	csvW := csv.NewWriter(w)
	csvW.Write([]string{"month", "rate"})

	var records [][]string
	for _, row := range data {
		records = append(records, []string{
			row.Month,
			strconv.FormatFloat(row.Rate, 'f', 2, 64),
		})
	}
	return csvW.WriteAll(records)
}

func writePlanningConfigsCSV(data []PlanningConfigBackup, w io.Writer) error {
	csvW := csv.NewWriter(w)
	csvW.Write([]string{"year", "initial_capital"})

	var records [][]string
	for _, row := range data {
		records = append(records, []string{
			strconv.Itoa(row.Year),
			row.InitialCapital.StringESAr(),
		})
	}
	return csvW.WriteAll(records)
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

	pw, err := zw.Create("presets.csv")
	if err != nil {
		return err
	}
	if err = writePresetsCSV(data.Presets, pw); err != nil {
		return err
	}

	piw, err := zw.Create("planning_inputs.csv")
	if err != nil {
		return err
	}
	if err = writePlanningInputsCSV(data.PlanningInputs, piw); err != nil {
		return err
	}

	pgw, err := zw.Create("planning_goals.csv")
	if err != nil {
		return err
	}
	if err = writePlanningGoalsCSV(data.PlanningGoals, pgw); err != nil {
		return err
	}

	perw, err := zw.Create("planning_exchange_rates.csv")
	if err != nil {
		return err
	}
	if err = writePlanningExchangeRatesCSV(data.PlanningExchangeRates, perw); err != nil {
		return err
	}

	pcw, err := zw.Create("planning_config.csv")
	if err != nil {
		return err
	}
	if err = writePlanningConfigsCSV(data.PlanningConfigs, pcw); err != nil {
		return err
	}

	return nil
}
