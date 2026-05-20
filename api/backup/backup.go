package backup

import (
	"github.com/nnavales/quant/api/money"
)

type Data struct {
	Transactions             []Transaction
	HistoricalEntries        []HistoricalEntry
	NetWorth                 []Asset
	Presets                  []Preset
	PlanningInputs           []PlanningInputBackup
	PlanningGoals            []PlanningGoalBackup
	PlanningExchangeRates    []PlanningExchangeRateBackup
	PlanningConfigs          []PlanningConfigBackup
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

type EntityRef struct {
	Category    string
	Subcategory string
	Channel     string
	Account     string
}

func (t Transaction) EntityRef() EntityRef {
	return EntityRef{
		Category:    t.Category,
		Subcategory: t.Subcategory,
		Channel:     t.Channel,
		Account:     t.Account,
	}
}

func (p Preset) EntityRef() EntityRef {
	return EntityRef{
		Category:    p.Category,
		Subcategory: p.Subcategory,
		Channel:     p.Channel,
		Account:     p.Account,
	}
}

type Preset struct {
	Name        string `json:"name" csv:"name"`
	Desription  string `json:"Description" csv:"description"`
	Type        string `json:"type" csv:"type"`
	Frequency   string `json:"frequency" csv:"frequency"`
	Category    string `json:"category" csv:"category"`
	Subcategory string `json:"subcategory" csv:"subcategory"`
	Channel     string `json:"channel" csv:"channel"`
	Account     string `json:"account" csv:"account"`
	IsDone      bool   `json:"is_done" csv:"is_done"`
	Currency    string `json:"currency" csv:"currency"`
}

type PlanningInputBackup struct {
	Year        int         `json:"year" csv:"year"`
	Description string      `json:"description" csv:"description"`
	Type        string      `json:"type" csv:"type"`
	Currency    string      `json:"currency" csv:"currency"`
	January     money.Money `json:"january" csv:"january"`
	February    money.Money `json:"february" csv:"february"`
	March       money.Money `json:"march" csv:"march"`
	April       money.Money `json:"april" csv:"april"`
	May         money.Money `json:"may" csv:"may"`
	June        money.Money `json:"june" csv:"june"`
	July        money.Money `json:"july" csv:"july"`
	August      money.Money `json:"august" csv:"august"`
	September   money.Money `json:"september" csv:"september"`
	October     money.Money `json:"october" csv:"october"`
	November    money.Money `json:"november" csv:"november"`
	December    money.Money `json:"december" csv:"december"`
}

type PlanningGoalBackup struct {
	Year      int         `json:"year" csv:"year"`
	Metric    string      `json:"metric" csv:"metric"`
	January   money.Money `json:"january" csv:"january"`
	February  money.Money `json:"february" csv:"february"`
	March     money.Money `json:"march" csv:"march"`
	April     money.Money `json:"april" csv:"april"`
	May       money.Money `json:"may" csv:"may"`
	June      money.Money `json:"june" csv:"june"`
	July      money.Money `json:"july" csv:"july"`
	August    money.Money `json:"august" csv:"august"`
	September money.Money `json:"september" csv:"september"`
	October   money.Money `json:"october" csv:"october"`
	November  money.Money `json:"november" csv:"november"`
	December  money.Money `json:"december" csv:"december"`
}

type PlanningExchangeRateBackup struct {
	Month string  `json:"month" csv:"month"`
	Rate  float64 `json:"rate" csv:"rate"`
}

type PlanningConfigBackup struct {
	Year           int         `json:"year" csv:"year"`
	InitialCapital money.Money `json:"initial_capital" csv:"initial_capital"`
}
