package daemon

import (
	"encoding/json"
	"os"
	"path/filepath"

	"github.com/nnavales/summit/api/config"
)

func setMode(mode string) error {
	dir, err := config.AppDataDir()
	if err != nil {
		return err
	}

	path := filepath.Join(dir, "config.json")

	cfg, err := config.ReadConfigFile(path)
	if err != nil {
		return err
	}

	cfg.Mode = mode

	return writeConfig(path, cfg)
}

func GetMode() string {
	dir, err := config.AppDataDir()
	if err != nil {
		return "user"
	}

	path := filepath.Join(dir, "config.json")

	cfg, err := config.ReadConfigFile(path)
	if err != nil {
		return "user"
	}

	if cfg.Mode == "" {
		return "user"
	}

	return cfg.Mode
}

func writeConfig(path string, cfg config.Config) error {
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
