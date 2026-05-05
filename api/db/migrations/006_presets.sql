-- +goose Up
CREATE TABLE presets (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL UNIQUE,
    description     TEXT,
    type            TEXT NOT NULL,
    frequency       TEXT,
    category_id     TEXT,
    subcategory_id  TEXT,
    channel_id      TEXT,
    account_id      TEXT,
    is_paid         INTEGER,
    currency        TEXT,
    created_at      DATETIME NOT NULL,
    updated_at      DATETIME,
    deleted_at      DATETIME,
    FOREIGN KEY(category_id)    REFERENCES categories(id)    ON DELETE SET NULL,
    FOREIGN KEY(subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL,
    FOREIGN KEY(channel_id)     REFERENCES channels(id)      ON DELETE SET NULL,
    FOREIGN KEY(account_id)      REFERENCES accounts(id)     ON DELETE SET NULL
);

CREATE INDEX idx_presets_name ON presets(name);

-- +goose Down
DROP INDEX idx_presets_name;
DROP TABLE presets;