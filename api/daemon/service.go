package daemon

import (
	"os"
	"path/filepath"

	"github.com/kardianos/service"
)

type SummitService struct {
	stopCh chan struct{}
}

func (s *SummitService) Start(svc service.Service) error {
	s.stopCh = make(chan struct{})
	go func() {
		if err := Run(s.stopCh); err != nil {
			// Error is logged inside Run via slog
		}
	}()
	return nil
}

func (s *SummitService) Stop(svc service.Service) error {
	if s.stopCh != nil {
		close(s.stopCh)
	}
	return nil
}

func findAPIExecutable() string {
	// If SUMMIT_API_PATH is set, use it
	if path := os.Getenv("SUMMIT_API_PATH"); path != "" {
		return path
	}

	// Try to find summit-api next to the current executable (summit-cli)
	exe, err := os.Executable()
	if err == nil {
		dir := filepath.Dir(exe)
		apiPath := filepath.Join(dir, "summit-api")
		if _, err := os.Stat(apiPath); err == nil {
			return apiPath
		}
	}

	// Fallback: search in PATH
	if path, err := execLookPath("summit-api"); err == nil {
		return path
	}

	return "summit-api"
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
		Name:        "summit",
		DisplayName: "Summit API",
		Description: "Summit personal finance API background service",
		Executable:  findAPIExecutable(),
		Option:      make(map[string]interface{}),
	}
	// Force user-level service on Linux (systemd --user)
	cfg.Option["UserService"] = true
	return cfg
}

func openService() (service.Service, error) {
	s := &SummitService{}
	return service.New(s, newServiceConfig())
}
