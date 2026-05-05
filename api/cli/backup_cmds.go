package cli

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/nnavales/summit/api/config"
)

// TODO:
// URLS with correct host

func expandPath(path string) string {
	if strings.HasPrefix(path, "~") {
		home, _ := os.UserHomeDir()
		path = home + path[1:]
	}
	return path
}

func backupExportRun(cfg config.Config, args []string) error {
	output := "backup.zip"

	fs := newFlagSet()
	fs.StringVar(&output, "output", "backup.zip", "output file path")
	fs.Parse(args)
	output = expandPath(output)

	url := fmt.Sprintf("http://127.0.0.1:%d/api/backup/export", cfg.Port)
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return fmt.Errorf("Error: could not connect to API at %s. Is the server running?\n\n(%w)", url, err)
	}

	res, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("Error: could not connect to API at %s. Is the server running?\n\n(%w)", url, err)
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		b, _ := io.ReadAll(res.Body)
		return formatAPIError(res.StatusCode, b)
	}

	b, err := io.ReadAll(res.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	if err := os.MkdirAll(filepath.Dir(output), 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}
	if err := os.WriteFile(output, b, 0644); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	fmt.Printf("Backup exported to %s\n", output)
	return nil
}

func backupImportRun(cfg config.Config, args []string) error {
	endpoint := "/backup/import/{resource}"
	endpoint, args = extractArgs(endpoint, args)

	if missing := unresolvedParams(endpoint); len(missing) > 0 {
		return fmt.Errorf("Error: missing required parameter\n\nUsage:  summit backup import resource=<type> --file <csv>\n\nResources: transactions, historical, networth")
	}

	fs := newFlagSet()
	file := fs.String("file", "", "CSV file to import")
	body := fs.String("body", "", "CSV body string")
	fs.Parse(args)

	url := fmt.Sprintf("http://127.0.0.1:%d/api%s", cfg.Port, endpoint)

	switch {
	case *file != "":
		if strings.ToLower(filepath.Ext(*file)) != ".csv" {
			return fmt.Errorf("Error: file must be a .csv file")
		}
		b, err := os.ReadFile(expandPath(*file))
		if err != nil {
			return fmt.Errorf("failed to read file: %w", err)
		}
		return sendCSVImport(url, bytes.NewReader(b))

	case *body != "":
		return sendCSVImport(url, strings.NewReader(*body))

	default:
		return fmt.Errorf("Error: --file or --body is required\n\nUsage:  summit backup import resource=<type> --file <csv>\n\nOr:\n  summit backup import resource=<type> --body <csv>")
	}
}

func sendCSVImport(url string, reader io.Reader) error {
	req, err := http.NewRequest(http.MethodPost, url, reader)
	if err != nil {
		return fmt.Errorf("Error: could not connect to API at %s. Is the server running?\n\n(%w)", url, err)
	}
	req.Header.Set("Content-Type", "text/csv")

	res, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("Error: could not connect to API at %s. Is the server running?\n\n(%w)", url, err)
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		b, _ := io.ReadAll(res.Body)
		return formatAPIError(res.StatusCode, b)
	}

	fmt.Println("Import successful")
	return nil
}
