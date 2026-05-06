package dashboard

import (
	"context"
	"database/sql"

	"github.com/nnavales/quant/api/money"
)

type SQLiteRepo struct {
	db *sql.DB
}

func NewSQLiteRepo(db *sql.DB) *SQLiteRepo {
	return &SQLiteRepo{db: db}
}

func (r *SQLiteRepo) GetFinanceSummary(ctx context.Context, filter *Filter) ([]FinanceSummaryRow, error) {
	rows, err := r.db.QueryContext(ctx, GetFinanceSummary)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tbl := make([]FinanceSummaryRow, 0)
	for rows.Next() {
		row := FinanceSummaryRow{}
		var income, expense, savings, incomeFixed, expenseFixed, incomeVariable, expenseVariable money.Money
		var exchangeRate float64

		err := rows.Scan(
			&row.Month,
			&income,
			&expense,
			&savings,
			&incomeFixed,
			&expenseFixed,
			&incomeVariable,
			&expenseVariable,
			&exchangeRate,
		)
		if err != nil {
			return nil, err
		}

		row.Income = income
		row.Expense = expense
		row.Savings = savings
		row.IncomeFixed = incomeFixed
		row.ExpenseFixed = expenseFixed
		row.IncomeVariable = incomeVariable
		row.ExpenseVariable = expenseVariable
		row.ExchangeRate = exchangeRate

		tbl = append(tbl, row)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	for i := range tbl {
		var capital money.Money
		for j := 0; j <= i; j++ {
			capital = capital.Add(tbl[j].Savings)
		}
		tbl[i].Capital = capital
	}

	return tbl, nil
}

func (r *SQLiteRepo) GetDimensionSeries(ctx context.Context, filter DimensionFilter) ([]DimensionRow, error) {
	query, args := BuildDimensionQuery(filter)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tbl := make([]DimensionRow, 0)
	for rows.Next() {
		var row DimensionRow
		var amount money.Money
		var categoryName, subcategoryName, accountName, channelName sql.NullString

		err := rows.Scan(
			&row.Month,
			&row.Type,
			&amount,
			&row.CategoryID,
			&row.SubcategoryID,
			&row.AccountID,
			&row.ChannelID,
			&categoryName,
			&subcategoryName,
			&accountName,
			&channelName,
		)
		if err != nil {
			return nil, err
		}

		row.Amount = amount
		row.CategoryName = categoryName.String
		row.SubcategoryName = subcategoryName.String
		row.AccountName = accountName.String
		row.ChannelName = channelName.String

		tbl = append(tbl, row)
	}

	return tbl, rows.Err()
}
