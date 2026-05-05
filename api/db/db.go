package db

import (
	"database/sql"
	"embed"
	"fmt"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
	"github.com/nnavales/summit/api/config"
	"github.com/pressly/goose/v3"
)

//go:embed migrations/*.sql
var embedMigrations embed.FS

type DB struct {
	*sql.DB
}

func New(cfg config.Runtime) (*DB, error) {
	if err := os.MkdirAll(filepath.Dir(cfg.DatabaseFile), 0755); err != nil {
		return nil, fmt.Errorf("mkdir: %w", err)
	}

	db, err := sql.Open("sqlite3", cfg.DatabaseFile)
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

	goose.SetBaseFS(embedMigrations)
	if err := goose.SetDialect("sqlite3"); err != nil {
		return nil, err
	}

	if err := goose.Up(db, "migrations"); err != nil {
		return nil, err
	}

	return &DB{db}, nil
}

func (db *DB) Health() error {
	if err := db.Ping(); err != nil {
		return fmt.Errorf("sqlite3 ping: %w", err)
	}

	return nil
}
