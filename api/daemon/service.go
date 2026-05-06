package daemon

import (
	"os"
	"path/filepath"

	"github.com/kardianos/service"
)

type QuantService struct {
	stopCh chan struct{}
}

func (s *QuantService) Start(svc service.Service) error {
	s.stopCh = make(chan struct{})
	go func() {
		if err := Run(s.stopCh); err != nil {
			// Error is logged inside Run via slog
		}
	}()
	return nil
}

func (s *QuantService) Stop(svc service.Service) error {
	if s.stopCh != nil {
		close(s.stopCh)
	}
	return nil
}

func findAPIExecutable() string {
	// If QUANT_API_PATH is set, use it
	if path := os.Getenv("QUANT_API_PATH"); path != "" {
		return path
	}

	// Try to find quant-api next to the current executable (quant-cli)
	exe, err := os.Executable()
	if err == nil {
		dir := filepath.Dir(exe)
		apiPath := filepath.Join(dir, "quant-api")
		if _, err := os.Stat(apiPath); err == nil {
			return apiPath
		}
	}

	// Fallback: search in PATH
	if path, err := execLookPath("quant-api"); err == nil {
		return path
	}

	return "quant-api"
}

func execLookPath(file string) (string, error) {
	// Simple PATH lookup
	paths := filepath.SplitList(os.Getenv("PATH"))
	for _, dir := range paths {
		path := filepath.Join(dir, file)
		if _, err := os.Stat(path); err == nil {
			return path, nil
		}
	}
	return "", os.ErrNotExist
}

func newServiceConfig() *service.Config {
	cfg := &service.Config{
		Name:        "quant",
		DisplayName: "Quant API",
		Description: "Quant personal finance API background service",
		Executable:  findAPIExecutable(),
		Option:      make(map[string]interface{}),
	}
	cfg.Option["UserService"] = true
	return cfg
}

func openService() (service.Service, error) {
	s := &QuantService{}
	return service.New(s, newServiceConfig())
}
