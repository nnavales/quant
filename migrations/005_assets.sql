-- +goose Up
CREATE TABLE assets(
    id TEXT PRIMARY KEY,
	name TEXT NOT NULL UNIQUE,
	amount INTEGER NOT NULL,
	currency TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME
);

-- +goose Down
DROP TABLE assets;
