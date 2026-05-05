-- +goose Up
CREATE VIEW finance_summary AS

SELECT
    substr(date, 1, 7) AS month,

    CAST(ROUND(AVG(exchange_rate), 0) AS INTEGER) AS exchange_rate,

    income_total_usd AS income,
    income_fixed_usd AS income_fixed,
    income_variable_usd AS income_variable,

    expense_total_usd AS expense,
    expense_fixed_usd AS expense_fixed,
    expense_variable_usd AS expense_variable,

    (income_total_usd - expense_total_usd) AS savings,

    'historical' AS source

FROM historical_entries
GROUP BY substr(date, 1, 7)

UNION ALL

SELECT
    substr(t.date, 1, 7) AS month,

    CAST(ROUND(AVG(e.exchange_rate), 0) AS INTEGER) AS exchange_rate,

    SUM(
        CASE WHEN t.type = 'income' THEN
            CAST(ROUND(
                CASE 
                    WHEN e.currency = 'USD' THEN e.amount
                    ELSE e.amount / e.exchange_rate
                END
            , 0) AS INTEGER)
        ELSE 0 END
    ) AS income,

    SUM(
        CASE WHEN t.type = 'income' AND t.frequency = 'fixed' THEN
            CAST(ROUND(
                CASE 
                    WHEN e.currency = 'USD' THEN e.amount
                    ELSE e.amount / e.exchange_rate
                END
            , 0) AS INTEGER)
        ELSE 0 END
    ) AS income_fixed,

    SUM(
        CASE WHEN t.type = 'income' AND t.frequency = 'variable' THEN
            CAST(ROUND(
                CASE 
                    WHEN e.currency = 'USD' THEN e.amount
                    ELSE e.amount / e.exchange_rate
                END
            , 0) AS INTEGER)
        ELSE 0 END
    ) AS income_variable,

    SUM(
        CASE WHEN t.type = 'expense' THEN
            CAST(ROUND(
                CASE 
                    WHEN e.currency = 'USD' THEN e.amount
                    ELSE e.amount / e.exchange_rate
                END
            , 0) AS INTEGER)
        ELSE 0 END
    ) AS expense,

    SUM(
        CASE WHEN t.type = 'expense' AND t.frequency = 'fixed' THEN
            CAST(ROUND(
                CASE 
                    WHEN e.currency = 'USD' THEN e.amount
                    ELSE e.amount / e.exchange_rate
                END
            , 0) AS INTEGER)
        ELSE 0 END
    ) AS expense_fixed,

    SUM(
        CASE WHEN t.type = 'expense' AND t.frequency = 'variable' THEN
            CAST(ROUND(
                CASE 
                    WHEN e.currency = 'USD' THEN e.amount
                    ELSE e.amount / e.exchange_rate
                END
            , 0) AS INTEGER)
        ELSE 0 END
    ) AS expense_variable,

    (
        SUM(
            CASE WHEN t.type = 'income' THEN
                CAST(ROUND(
                    CASE 
                        WHEN e.currency = 'USD' THEN e.amount
                        ELSE e.amount / e.exchange_rate
                    END
                , 0) AS INTEGER)
            ELSE 0 END
        )
        -
        SUM(
            CASE WHEN t.type = 'expense' THEN
                CAST(ROUND(
                    CASE 
                        WHEN e.currency = 'USD' THEN e.amount
                        ELSE e.amount / e.exchange_rate
                    END
                , 0) AS INTEGER)
            ELSE 0 END
        )
    ) AS savings,

    'transactions' AS source

FROM transactions t
JOIN entries e ON e.transaction_id = t.id

WHERE t.date > COALESCE(
    (SELECT MAX(date) FROM historical_entries),
    '1900-01-01'
)

GROUP BY substr(t.date, 1, 7);

-- +goose Down
DROP VIEW finance_summary;
