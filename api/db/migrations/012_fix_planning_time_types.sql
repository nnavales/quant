-- +goose Up
ALTER TABLE planning_inputs RENAME TO planning_inputs_old;

CREATE TABLE planning_inputs (
    id TEXT PRIMARY KEY,
    year INTEGER NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    currency TEXT NOT NULL,
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
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);

INSERT INTO planning_inputs SELECT * FROM planning_inputs_old;
DROP TABLE planning_inputs_old;

ALTER TABLE planning_goals RENAME TO planning_goals_old;

CREATE TABLE planning_goals (
    id TEXT PRIMARY KEY,
    year INTEGER NOT NULL,
    metric TEXT NOT NULL,
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
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);

INSERT INTO planning_goals SELECT * FROM planning_goals_old;
DROP TABLE planning_goals_old;

ALTER TABLE planning_config RENAME TO planning_config_old;

CREATE TABLE planning_config (
    year INTEGER PRIMARY KEY,
    initial_capital INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME
);

INSERT INTO planning_config SELECT * FROM planning_config_old;
DROP TABLE planning_config_old;

-- +goose Down
-- Keep old TEXT columns for rollback
ALTER TABLE planning_inputs RENAME TO planning_inputs_new;

CREATE TABLE planning_inputs (
    id TEXT PRIMARY KEY,
    year INTEGER NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    currency TEXT NOT NULL,
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
    updated_at TEXT
);

INSERT INTO planning_inputs SELECT * FROM planning_inputs_new;
DROP TABLE planning_inputs_new;

ALTER TABLE planning_goals RENAME TO planning_goals_new;

CREATE TABLE planning_goals (
    id TEXT PRIMARY KEY,
    year INTEGER NOT NULL,
    metric TEXT NOT NULL,
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
    updated_at TEXT
);

INSERT INTO planning_goals SELECT * FROM planning_goals_new;
DROP TABLE planning_goals_new;

ALTER TABLE planning_config RENAME TO planning_config_new;

CREATE TABLE planning_config (
    year INTEGER PRIMARY KEY,
    initial_capital INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT
);

INSERT INTO planning_config SELECT * FROM planning_config_new;
DROP TABLE planning_config_new;
