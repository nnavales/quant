-- +goose Up
CREATE TABLE channels (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    deleted_at DATETIME
);

CREATE TABLE accounts (
    id         TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    name       TEXT NOT NULL UNIQUE,
    instrument TEXT NOT NULL,
    last_four  TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    deleted_at DATETIME,
    FOREIGN KEY(channel_id) REFERENCES channels(id) ON DELETE RESTRICT
);

CREATE TABLE categories (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    deleted_at DATETIME
);

CREATE TABLE subcategories (
    id          TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    name        TEXT NOT NULL UNIQUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    deleted_at DATETIME,
    FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE TABLE installment_groups (
    id                 TEXT PRIMARY KEY,
    total_installments INTEGER NOT NULL,
    start_date         TEXT NOT NULL,
    original_amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    currency TEXT NOT NULL,
    is_canceled INTEGER NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    deleted_at DATETIME
);

CREATE TABLE transactions (
    id                   TEXT PRIMARY KEY,
    date                 TEXT NOT NULL,
    description          TEXT,
    type                 TEXT NOT NULL,
    frequency            TEXT,
    installment_group_id TEXT,
    installment_number   INTEGER,
    is_paid INTEGER NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    deleted_at DATETIME,
    FOREIGN KEY(installment_group_id) REFERENCES installment_groups(id) ON DELETE CASCADE
);


CREATE TABLE entries (
    id               TEXT PRIMARY KEY,
    transaction_id   TEXT NOT NULL,
	channel_id       TEXT NOT NULL,
    account_id       TEXT, 
    amount       INTEGER NOT NULL,
    currency TEXT NOT NULL,
    exchange_rate    REAL NOT NULL,
    category_id      TEXT,
    subcategory_id   TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    deleted_at DATETIME,
    FOREIGN KEY(transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY(account_id)     REFERENCES accounts(id) ON DELETE RESTRICT,
    FOREIGN KEY(channel_id) REFERENCES channels(id) ON DELETE RESTRICT,
    FOREIGN KEY(category_id)    REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY(subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
);

CREATE INDEX idx_transactions_date        ON transactions(date);
CREATE INDEX idx_transactions_installment ON transactions(installment_group_id);
CREATE INDEX idx_entries_transaction      ON entries(transaction_id);
CREATE INDEX idx_entries_account          ON entries(account_id);
CREATE INDEX idx_entries_category         ON entries(category_id);
CREATE INDEX idx_accounts_channel         ON accounts(channel_id);

-- +goose Down
DROP INDEX idx_accounts_channel;
DROP INDEX idx_entries_category;
DROP INDEX idx_entries_account;
DROP INDEX idx_entries_transaction;
DROP INDEX idx_transactions_installment;
DROP INDEX idx_transactions_date;
DROP TABLE entries;
DROP TABLE transactions;
DROP TABLE installment_groups;
DROP TABLE subcategories;
DROP TABLE categories;
DROP TABLE accounts;
DROP TABLE channels;
