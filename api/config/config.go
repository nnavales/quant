package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

const (
	ENV_DEVELOPMENT = "development"
	ENV_PRODUCTION  = "production"
)

type Config struct {
	Name       string
	ApiVersion string
	Addr       string
	DBString   string
	Env        string
}

// env vars that cannot be empty are in this slice
var required = []string{"DB_STRING", "APP_VERSION"}

func New() (Config, error) {
	godotenv.Load()

	for _, key := range required {
		if _, ok := os.LookupEnv(key); !ok {
			return Config{}, fmt.Errorf("missing required env var: %s", key)
		}
	}

	dbString, err := filepath.Abs(os.Getenv("DB_STRING"))
	if err != nil {
		return Config{}, fmt.Errorf("resolve db path: %w", err)
	}

	return Config{
		Env:        getEnv("ENV", ENV_DEVELOPMENT),
		Name:       getEnv("APP_NAME", "Summit"),
		ApiVersion: os.Getenv("APP_VERSION"),
		Addr:       getEnv("API_ADDR", "localhost:6969"),
		DBString:   dbString,
	}, nil
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
