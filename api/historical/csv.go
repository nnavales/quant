package historical

import (
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"strconv"

	"github.com/nnavales/quant/api/timeutils"
)

var ErrInvalidCSV = errors.New("invalid csv")

type HistoricalCSV struct {
	Date               string `csv:"date"`
	ExchangeRate       string `csv:"exchange_rate"`
	IncomeUSD          string `csv:"income_usd"`
	IncomeFixedUSD     string `csv:"income_fixed_usd"`
	IncomeVariableUSD  string `csv:"income_variable_usd"`
	ExpenseUSD         string `csv:"expense_usd"`
	ExpenseFixedUSD    string `csv:"expense_fixed_usd"`
	ExpenseVariableUSD string `csv:"expense_variable_usd"`
}

func (h *Handler) ParseHistoricalCSV(body io.Reader) ([]HistoricalFinanceReq, error) {
	reader := csv.NewReader(body)

	header, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("%w: missing header", ErrInvalidCSV)
	}

	headerMap := make(map[string]int)
	for i, col := range header {
		headerMap[col] = i
	}

	requiredCols := []string{"date", "income_usd", "expense_usd"}
	for _, col := range requiredCols {
		if _, ok := headerMap[col]; !ok {
			return nil, fmt.Errorf("%w: missing column %q", ErrInvalidCSV, col)
		}
	}

	var reqs []HistoricalFinanceReq

	for lineNum := 2; ; lineNum++ {
		row, err := reader.Read()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("%w: line %d: %v", ErrInvalidCSV, lineNum, err)
		}

		req, err := parseHistoricalRow(row, headerMap, lineNum)
		if err != nil {
			return nil, err
		}

		reqs = append(reqs, req)
	}

	return reqs, nil
}

func parseHistoricalRow(row []string, headerMap map[string]int, lineNum int) (HistoricalFinanceReq, error) {
	getVal := func(col string) string {
		if idx, ok := headerMap[col]; ok && idx < len(row) {
			return row[idx]
		}
		return ""
	}

	dateStr := getVal("date")
	if dateStr == "" {
		return HistoricalFinanceReq{}, fmt.Errorf("%w: line %d: date is required", ErrInvalidCSV, lineNum)
	}

	date, err := timeutils.ParseDate(dateStr)
	if err != nil {
		return HistoricalFinanceReq{}, fmt.Errorf("%w: line %d: invalid date format", ErrInvalidCSV, lineNum)
	}

	req := HistoricalFinanceReq{
		Date: &date,
	}

	if val := getVal("exchange_rate"); val != "" {
		rate, err := strconv.ParseFloat(val, 64)
		if err != nil || rate <= 0 {
			return HistoricalFinanceReq{}, fmt.Errorf("%w: line %d: invalid exchange_rate", ErrInvalidCSV, lineNum)
		}
		req.ExchangeRate = &rate
	}

	incomeUSD := getVal("income_usd")
	if incomeUSD == "" {
		return HistoricalFinanceReq{}, fmt.Errorf("%w: line %d: income_usd is required", ErrInvalidCSV, lineNum)
	}
	req.IncomeUSD = &incomeUSD

	if val := getVal("income_fixed_usd"); val != "" {
		req.IncomeFixedUSD = &val
	}
	if val := getVal("income_variable_usd"); val != "" {
		req.IncomeVariableUSD = &val
	}

	expenseUSD := getVal("expense_usd")
	if expenseUSD == "" {
		return HistoricalFinanceReq{}, fmt.Errorf("%w: line %d: expense_usd is required", ErrInvalidCSV, lineNum)
	}
	req.ExpenseUSD = &expenseUSD

	if val := getVal("expense_fixed_usd"); val != "" {
		req.ExpenseFixedUSD = &val
	}
	if val := getVal("expense_variable_usd"); val != "" {
		req.ExpenseVariableUSD = &val
	}

	return req, nil
}
