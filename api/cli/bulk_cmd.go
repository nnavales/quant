package cli

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/nnavales/quant/api/config"
)

func transactionBulkRun(cfg config.Config, args []string) error {
	endpoint := "/transaction-aggregates/bulk"

	fs := newFlagSet()
	file := fs.String("file", "", "JSON file to import")
	body := fs.String("body", "", "JSON body string")
	fs.Parse(args)

	var reader io.Reader
	switch {
	case *file != "":
		b, err := os.ReadFile(expandPath(*file))
		if err != nil {
			return fmt.Errorf("failed to read file: %w", err)
		}
		reader = bytes.NewReader(b)
	case *body != "":
		reader = strings.NewReader(*body)
	default:
		return fmt.Errorf("Error: --file or --body is required\n\nUsage:  quant transaction bulk --file <json>\n\nOr:\n  quant transaction bulk --body <json>")
	}

	url := fmt.Sprintf("http://127.0.0.1:%d/api%s", cfg.Port, endpoint)
	code, res, err := requestToAPI(http.MethodPost, url, reader)
	if err != nil {
		return fmt.Errorf("Error: could not connect to API at %s.\n\nThe server is not running.\nOptions:\n  - Open the Quant app\n\n(%w)", url, err)
	}
	defer res.Close()

	if code >= 400 {
		b, _ := io.ReadAll(res)
		return formatAPIError(code, b)
	}

	_, err = io.Copy(os.Stdout, res)
	return err
}
