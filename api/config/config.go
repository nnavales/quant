package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
)

type Config struct {
	Name string `json:"name"`
	Port int    `json:"port"`
	Mode string `json:"mode"`
}

type Runtime struct {
	Config
	Env          string
	AppDataDir   string
	DatabaseFile string
}

func Default() Config {
	return Config{
		Name:    "Quant",
		Port: 43123,
		Mode: "user",
	}
}

func merge(cfg Config) Config {
	def := Default()

	if cfg.Port == 0 {
		cfg.Port = def.Port
	}
	if cfg.Name == "" {
		cfg.Name = def.Name
	}

	if cfg.Mode == "" {
		cfg.Mode = def.Mode
	}

	return cfg
}

func New() (Runtime, error) {
	dir, err := AppDataDir()
	if err != nil {
		return Runtime{}, err
	}

	if err := os.MkdirAll(dir, 0755); err != nil {
		return Runtime{}, err
	}

	path := filepath.Join(dir, "config.json")

	cfg, err := ReadConfigFile(path)
	if err != nil {
		return Runtime{}, err
	}

	cfg = merge(cfg)

	if _, err := os.Stat(path); os.IsNotExist(err) {
		if err := writeConfigFile(path, cfg); err != nil {
			return Runtime{}, err
		}
	}

	return Runtime{
		Config:       cfg,
		AppDataDir:   dir,
		Env:          os.Getenv("APP_ENV"),
		DatabaseFile: filepath.Join(dir, "db.sqlite"),
	}, nil
}

func ReadConfigFile(path string) (Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return Config{}, nil
		}
		return Config{}, err
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return Config{}, err
	}

	return cfg, nil
}

func writeConfigFile(path string, cfg Config) error {
	tmp := path + ".tmp"

	b, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}

	if err := os.WriteFile(tmp, b, 0644); err != nil {
		return err
	}

	return os.Rename(tmp, path)
}

func AppDataDir() (string, error) {
	const app = "quant"

	if os.Getenv("APP_ENV") == "dev" {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}

		return filepath.Join(homeDir, "."+app), nil
	}

	// Linux
	if runtime.GOOS == "linux" {
		if dir := os.Getenv("XDG_DATA_HOME"); dir != "" {
			return filepath.Join(dir, app), nil
		}
		home, _ := os.UserHomeDir()
		return filepath.Join(home, ".local", "share", app), nil
	}

	// macOS
	if runtime.GOOS == "darwin" {
		home, _ := os.UserHomeDir()
		return filepath.Join(home, "Library", "Application Support", app), nil
	}

	// Windows
	if runtime.GOOS == "windows" {
		if dir := os.Getenv("LOCALAPPDATA"); dir != "" {
			return filepath.Join(dir, app), nil
		}
		home, _ := os.UserHomeDir()
		return filepath.Join(home, "AppData", "Local", app), nil
	}

	return "", fmt.Errorf("unsupported OS")
}

func SavePort(port int) error {
	dir, err := AppDataDir()
	if err != nil {
		return err
	}

	path := filepath.Join(dir, "config.json")

	cfg, err := ReadConfigFile(path)
	if err != nil {
		return err
	}

	cfg.Port = port

	return writeConfigFile(path, cfg)
}
