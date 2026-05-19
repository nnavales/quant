package daemon

import (
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	"github.com/kardianos/service"
)

type QuantService struct {
	stopCh chan struct{}
	doneCh chan struct{}
}

func (s *QuantService) Start(svc service.Service) error {
	s.stopCh = make(chan struct{})
	s.doneCh = make(chan struct{})

	go func() {
		defer close(s.doneCh)

		if err := Run(s.stopCh); err != nil {
			// logged internally
		}
	}()

	return nil
}

func (s *QuantService) Stop(svc service.Service) error {
	if s.stopCh != nil {
		close(s.stopCh)
	}

	if s.doneCh != nil {
		<-s.doneCh
	}

	return nil
}

func findAPIExecutable() string {
	if path := os.Getenv("QUANT_API_PATH"); path != "" {
		return path
	}

	bin := "quant-api"

	if runtime.GOOS == "windows" {
		bin += ".exe"
	}

	exe, err := os.Executable()
	if err == nil {
		dir := filepath.Dir(exe)

		path := filepath.Join(dir, bin)

		info, err := os.Stat(path)
		if err == nil && !info.IsDir() {
			return path
		}
	}

	path, err := exec.LookPath(bin)
	if err == nil {
		return path
	}

	return bin
}

func newServiceConfig() *service.Config {
	cfg := &service.Config{
		Name:        "quant",
		DisplayName: "Quant API",
		Description: "Quant personal finance API background service",
		Executable:  findAPIExecutable(),
		Option:      make(map[string]any),
	}

	cfg.Option["UserService"] = true
	cfg.Option["SystemdScript"] = systemdTemplate

	return cfg
}

func openService() (service.Service, error) {
	return service.New(
		&QuantService{},
		newServiceConfig(),
	)
}

const systemdTemplate = `[Unit]
Description={{.Description}}
ConditionFileIsExecutable={{.Path|cmdEscape}}

{{range $i, $dep := .Dependencies}}
{{$dep}}
{{end}}

[Service]
Type=simple

ExecStart={{.Path|cmdEscape}}{{range .Arguments}} {{.|cmd}}{{end}}

{{if .WorkingDirectory}}
WorkingDirectory={{.WorkingDirectory|cmdEscape}}
{{end}}

{{if .UserName}}
User={{.UserName}}
{{end}}

{{if .EnvVars}}
{{range $k, $v := .EnvVars}}
Environment={{$k}}={{$v}}
{{end}}
{{end}}

Restart=on-failure
RestartSec=2

StartLimitIntervalSec=5
StartLimitBurst=10

NoNewPrivileges=true

{{if gt .LimitNOFILE -1}}
LimitNOFILE={{.LimitNOFILE}}
{{end}}

[Install]
WantedBy=default.target
`
