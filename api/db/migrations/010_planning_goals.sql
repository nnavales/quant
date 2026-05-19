-- +goose Up
CREATE TABLE planning_goals (
    id TEXT PRIMARY KEY,
    year INTEGER NOT NULL,
    metric TEXT NOT NULL,        -- income, expense
    january INTEGER NOT NULL DEFAULT 0,
    february INTEGER NOT NULL DEFAULT 0,
    march INTEGER NOT NULL DEFAULT 0,
    april INTEGER NOT NULL DEFAULT 0,
    may INTEGER NOT NULL DEFAULT 0,
    june INTEGER NOT NULL DEFAULT 0,
    july INTEGER NOT NULL DEFAULT 0,
    august INTEGER NOT NULL DEFAULT 0,
    september INTEGER NOT NULL DEFAULT 0,
    october INTEGER NOT NULL DEFAULT 0,
    november INTEGER NOT NULL DEFAULT 0,
    december INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT,

    UNIQUE(year, metric)
);

-- +goose Down
DROP TABLE planning_goals;
