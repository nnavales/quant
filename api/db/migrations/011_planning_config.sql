-- +goose Up
CREATE TABLE planning_config (
    year INTEGER PRIMARY KEY,
    initial_capital INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT
);

-- +goose Down
DROP TABLE planning_config;
