package db

import (
	"database/sql"
	"fmt"

	_ "github.com/mattn/go-sqlite3"
	"github.com/nnavales/summit/api/config"
)

type DB struct {
	*sql.DB
}

func New(cfg config.Config) (*DB, error) {
	db, err := sql.Open("sqlite3", cfg.DBString)
	if err != nil {
		return nil, fmt.Errorf("sqlite3 conn: %w", err)
	}

	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("sqlite3 ping: %w", err)
	}

	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		return nil, fmt.Errorf("failed to enable foreign keys: %w", err)
	}

	return &DB{db}, nil
}

func (db *DB) Health() error {
	if err := db.Ping(); err != nil {
		return fmt.Errorf("sqlite3 ping: %w", err)
	}

	return nil
}
