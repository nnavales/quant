-- +goose Up
CREATE TABLE user_config (
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);

-- +goose Down
DROP TABLE user_config;
