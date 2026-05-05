package backup

import (
	"github.com/nnavales/summit/api/money"
)

type Data struct {
	Transactions      []Transaction
	HistoricalEntries []HistoricalEntry
	NetWorth          []Asset
}

type Transaction struct {
	Date              string      `json:"date" csv:"date"`
	Description       string      `json:"description" csv:"description"`
	InstallmentNumber int         `json:"installment_number" csv:"installment_number"`
	TotalInstallments int         `json:"total_installments" csv:"total_installments"`
	GroupID           int         `json:"group_id" csv:"group_id"`
	Type              string      `json:"type" csv:"type"`
	Frequency         string      `json:"frequency" csv:"frequency"`
	IsDone            bool        `json:"is_done" csv:"is_done"`
	ExchangeRate      float64     `json:"exchange_rate" csv:"exchange_rate"`
	AmountARS         money.Money `json:"amount_ars" csv:"amount_ars"`
	AmountUSD         money.Money `json:"amount_usd" csv:"amount_usd"`
	Currency          string      `json:"currency" csv:"currency"`
	Category          string      `json:"category" csv:"category"`
	Subcategory       string      `json:"subcategory" csv:"subcategory"`
	Channel           string      `json:"channel" csv:"channel"`
	Account           string      `json:"account" csv:"account"`
}

type HistoricalEntry struct {
	Month           string      `json:"month" csv:"month"`
	Income          money.Money `json:"income" csv:"income"`
	IncomeFixed     money.Money `json:"income_fixed" csv:"income_fixed"`
	IncomeVariable  money.Money `json:"income_variable" csv:"income_variable"`
	Expense         money.Money `json:"expense" csv:"expense"`
	ExpenseFixed    money.Money `json:"expense_fixed" csv:"expense_fixed"`
	ExpenseVariable money.Money `json:"expense_variable" csv:"expense_variable"`
	ExchangeRate    float64     `json:"exchange_rate" csv:"exchange_rate"`
	Savings         money.Money `json:"savings" csv:"savings"`
	Source          string      `json:"source" csv:"source"`
}

type Asset struct {
	Name     string      `json:"name" csv:"name"`
	Amount   money.Money `json:"amount" csv:"amount"`
	Currency string      `json:"currency" csv:"currency"`
	Type     string      `json:"type" csv:"type"`
}
