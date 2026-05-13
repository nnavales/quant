
-- +goose Up
CREATE TABLE planning_exchange_rates (
    month TEXT PRIMARY KEY, 
    rate REAL NOT NULL,
    updated_at DATETIME
);

-- +goose Down
DROP TABLE planning_exchange_rates;
