package daemon

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"

	"github.com/kardianos/service"
	"github.com/nnavales/quant/api/config"
)

func Install() error {
	if os.Getenv("APP_ENV") == "dev" {
		return fmt.Errorf("daemon install is not available in dev mode")
	}

	svc, err := openService()
	if err != nil {
		return fmt.Errorf("failed to create service: %w", err)
	}

	if err := svc.Install(); err != nil {
		return fmt.Errorf("failed to install service: %w", err)
	}

	if err := svc.Start(); err != nil {
		return fmt.Errorf("failed to start service: %w", err)
	}

	if err := setMode("service"); err != nil {
		return fmt.Errorf("service installed but failed to update config: %w", err)
	}

	fmt.Println("Quant service installed and started.")
	fmt.Println("Mode set to 'service'.")
	return nil
}

func Uninstall() error {
	svc, err := openService()
	if err != nil {
		return fmt.Errorf("failed to create service: %w", err)
	}

	// Stop first, ignore errors (may already be stopped)
	_ = svc.Stop()

	if err := svc.Uninstall(); err != nil {
		return fmt.Errorf("failed to uninstall service: %w", err)
	}

	fmt.Println("Quant service uninstalled.")
	fmt.Println("Note: config and data were not removed.")
	return nil
}

func Start() error {
	svc, err := openService()
	if err != nil {
		return fmt.Errorf("failed to create service: %w", err)
	}

	if err := svc.Start(); err != nil {
		return fmt.Errorf("failed to start service: %w", err)
	}

	fmt.Println("Quant service started.")
	return nil
}

func Stop() error {
	svc, err := openService()
	if err != nil {
		return fmt.Errorf("failed to create service: %w", err)
	}

	if err := svc.Stop(); err != nil {
		return fmt.Errorf("failed to stop service: %w", err)
	}

	fmt.Println("Quant service stopped.")
	return nil
}

func Status() error {
	svc, err := openService()
	if err != nil {
		return fmt.Errorf("failed to create service: %w", err)
	}

	status, err := svc.Status()
	if err != nil {
		return fmt.Errorf("failed to get status: %w", err)
	}

	switch status {
	case service.StatusRunning:
		fmt.Println("Status: running")
	case service.StatusStopped:
		fmt.Println("Status: stopped")
	default:
		fmt.Println("Status: unknown")
	}
	return nil
}

func Logs() error {
	dir, err := config.AppDataDir()
	if err != nil {
		return fmt.Errorf("failed to get app data dir: %w", err)
	}

	path := filepath.Join(dir, "log.json")
	f, err := os.Open(path)
	if err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("no logs found at %s", path)
		}
		return fmt.Errorf("failed to open log file: %w", err)
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		fmt.Println(scanner.Text())
	}
	return scanner.Err()
}
