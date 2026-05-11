package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"sync"
)

var (
	muListeners sync.Mutex
	listeners   []chan struct{}
)

func Watch() <-chan struct{} {
	ch := make(chan struct{}, 1)
	muListeners.Lock()
	listeners = append(listeners, ch)
	muListeners.Unlock()
	return ch
}

type Config struct {
	Name          string `json:"name"`
	Port          int    `json:"port"`
	Mode          string `json:"mode"`
	TelegramToken string `json:"telegram_token"`
	TelegramID    int64  `json:"telegram_id"`
	APIKeyAI      string `json:"api_key_ia"`
	ModelID       string `json:"model_id"`
	BaseURL       string `json:"base_url"`
}

type Runtime struct {
	Config
	Env        string
	AppDataDir string
}

// initializes new config
func New() (Runtime, error) {
	dir, err := AppDataDir()
	if err != nil {
		return Runtime{}, err
	}

	cfg, err := ReadConfigFile()
	if err != nil {
		return Runtime{}, err
	}

	// set defaults
	if cfg.Port == 0 {
		cfg.Port = 43123
	}
	if cfg.Name == "" {
		cfg.Name = "Quant"
	}

	if cfg.Mode == "" {
		cfg.Mode = "user"
	}

	if err := writeConfigFile(cfg); err != nil {
		return Runtime{}, err
	}

	return Runtime{
		Config:     cfg,
		AppDataDir: dir,
		Env:        os.Getenv("APP_ENV"),
	}, nil
}

// reads config and returns the new one
func ReadConfigFile() (Config, error) {
	path, err := configFilePath()
	if err != nil {
		return Config{}, err
	}

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

// edits configuration changing old values for new ones
func EditConfigFile(newCfg Config) error {
	cfg, err := ReadConfigFile()
	if err != nil {
		return err
	}

	if newCfg.Name != "" {
		cfg.Name = newCfg.Name
	}
	if newCfg.Port != 0 {
		cfg.Port = newCfg.Port
	}
	if newCfg.Mode != "" {
		cfg.Mode = newCfg.Mode
	}

	if newCfg.TelegramToken != "" {
		cfg.TelegramToken = newCfg.TelegramToken
	}

	if newCfg.TelegramID != 0 {
		cfg.TelegramID = newCfg.TelegramID
	}

	if newCfg.APIKeyAI != "" {
		cfg.APIKeyAI = newCfg.APIKeyAI
	}

	if newCfg.ModelID != "" {
		cfg.ModelID = newCfg.ModelID
	}

	if newCfg.BaseURL != "" {
		cfg.BaseURL = newCfg.BaseURL
	}

	return writeConfigFile(cfg)
}

// helper to write to config file
func writeConfigFile(cfg Config) error {
	path, err := configFilePath()
	if err != nil {
		return err
	}

	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}

	tmp := path + ".tmp"

	b, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}

	if err := os.WriteFile(tmp, b, 0644); err != nil {
		return err
	}

	if err := os.Rename(tmp, path); err != nil {
		return err
	}

	notifyListeners()
	return nil
}

func notifyListeners() {
	muListeners.Lock()
	defer muListeners.Unlock()
	for _, ch := range listeners {
		select {
		case ch <- struct{}{}:
		default:
		}
	}
}

// determines the path for the config.json (config file)
func configFilePath() (string, error) {
	dir, err := AppDataDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "config.json"), nil
}

// gets the AppData directory depending on running OS
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
