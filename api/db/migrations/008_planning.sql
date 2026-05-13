-- +goose Up
CREATE TABLE planning_inputs (
    id TEXT PRIMARY KEY,
    month TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);

-- +goose Down
DROP TABLE planning_inputs;
