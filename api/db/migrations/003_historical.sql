-- +goose Up
CREATE TABLE historical_entries (
    date TEXT PRIMARY KEY, 
    exchange_rate REAL NOT NULL, 

    income_total_usd INTEGER NOT NULL,
    income_fixed_usd INTEGER,
    income_variable_usd INTEGER,

    expense_total_usd INTEGER NOT NULL,
    expense_fixed_usd INTEGER,
    expense_variable_usd INTEGER,

    savings_usd INTEGER,

    created_at DATETIME
);

-- +goose Down
DROP TABLE historical_entries;
