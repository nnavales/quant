package dashboard

import (
	"context"
	"database/sql"
	"strconv"
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
		var (
			expenseStr         sql.NullString
			incomeStr          sql.NullString
			incomeFixedStr     sql.NullString
			expenseFixedStr    sql.NullString
			incomeVariableStr  sql.NullString
			expenseVariableStr sql.NullString
			savingsStr         sql.NullString
		)
		err := rows.Scan(
			&row.Month,
			&incomeStr,
			&expenseStr,
			&savingsStr,
			&incomeFixedStr,
			&expenseFixedStr,
			&incomeVariableStr,
			&expenseVariableStr,
			&row.ExchangeRate,
		)
		if err != nil {
			return nil, err
		}
		if incomeStr.Valid {
			v, err := strconv.ParseFloat(incomeStr.String, 64)
			if err != nil {
				return nil, err
			}
			row.Income = v
		}
		if expenseStr.Valid {
			v, err := strconv.ParseFloat(expenseStr.String, 64)
			if err != nil {
				return nil, err
			}
			row.Expense = v
		}
		if savingsStr.Valid {
			v, err := strconv.ParseFloat(savingsStr.String, 64)
			if err != nil {
				return nil, err
			}
			row.Savings = v
		}
		if incomeFixedStr.Valid {
			v, err := strconv.ParseFloat(incomeFixedStr.String, 64)
			if err != nil {
				return nil, err
			}
			row.IncomeFixed = v
		}
		if expenseFixedStr.Valid {
			v, err := strconv.ParseFloat(expenseFixedStr.String, 64)
			if err != nil {
				return nil, err
			}
			row.ExpenseFixed = v
		}
		if incomeVariableStr.Valid {
			v, err := strconv.ParseFloat(incomeVariableStr.String, 64)
			if err != nil {
				return nil, err
			}
			row.IncomeVariable = v
		}
		if expenseVariableStr.Valid {
			v, err := strconv.ParseFloat(expenseVariableStr.String, 64)
			if err != nil {
				return nil, err
			}
			row.ExpenseVariable = v
		}

		tbl = append(tbl, row)
	}

	return tbl, rows.Err()
}
