package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"

	"github.com/joho/godotenv"
)

type Config struct {
	Name    string `json:"name"`
	Port    int    `json:"port"`
	Version string `json:"version"`
	Mode    string `json:"mode"`
}

type Runtime struct {
	Config
	AppDataDir   string
	DatabaseFile string
}

func isDev() bool {
	if _, err := os.Stat(".env"); err == nil {
		godotenv.Load()
	}
	return os.Getenv("APP_ENV") == "dev"
}

func defaultConfig() Config {
	return Config{
		Name:    "summit",
		Port:    43123,
		Mode:    "user",
		Version: "dev",
	}
}

func merge(cfg Config) Config {
	def := defaultConfig()

	if cfg.Port == 0 {
		cfg.Port = def.Port
	}
	if cfg.Name == "" {
		cfg.Name = def.Name
	}
	if cfg.Version == "" {
		cfg.Version = def.Version
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
	const app = "summit"

	if isDev() {
		return "./data", nil
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
