package cli

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/nnavales/quant/api/config"
)

type CommandSpec struct {
	Resource    string
	Action      string
	Description string
	Flags       string
	Endpoint    string
	Method      string
	BuildInput  func([]string) (Input, error)
	HasBody     bool
	RunFunc     func(config.Config, []string) error
}

var Commands = map[string]CommandSpec{
	"transaction:create": {
		Resource: "transaction", Action: "create",
		Description: "Create a new transaction",
		Endpoint:    "/transaction-aggregates", Method: http.MethodPost,
		HasBody: true,
		BuildInput: func(args []string) (Input, error) {
			return parseInput(args, newCreateTransactionInput)
		},
	},
	"transaction:list": {
		Resource: "transaction", Action: "list",
		Description: "List all transactions",
		Endpoint:    "/transaction-aggregates", Method: http.MethodGet,
	},
	"transaction:get": {
		Resource: "transaction", Action: "get",
		Description: "Get a transaction by ID",
		Endpoint:    "/transaction-aggregates/{id}", Method: http.MethodGet,
	},
	"transaction:update": {
		Resource: "transaction", Action: "update",
		Description: "Update a transaction",
		Endpoint:    "/transaction-aggregates/{id}", Method: http.MethodPut,
		HasBody: true,
		BuildInput: func(args []string) (Input, error) {
			return parseInput(args, newUpdateTransactionInput)
		},
	},
	"transaction:delete": {
		Resource: "transaction", Action: "delete",
		Description: "Delete a transaction",
		Endpoint:    "/transaction-aggregates/{id}", Method: http.MethodDelete,
	},
	"transaction:bulk": {
		Resource: "transaction", Action: "bulk",
		Description: "Bulk create transactions from JSON file or body",
		Flags:       "--file <json> | --body <json>",
		Endpoint:    "/transaction-aggregates/bulk", Method: http.MethodPost,
		RunFunc: transactionBulkRun,
	},
	"transaction:cancel-installments": {
		Resource: "transaction", Action: "cancel-installments",
		Description: "Cancel installments from a given number",
		Endpoint:    "/transaction-aggregates/cancel-installments", Method: http.MethodPost,
		HasBody: true,
		BuildInput: func(args []string) (Input, error) {
			return parseInput(args, newCancelInstallmentsInput)
		},
	},
	"category:create": {
		Resource: "category", Action: "create",
		Description: "Create a new category",
		Endpoint:    "/categories", Method: http.MethodPost,
		HasBody: true,
		BuildInput: func(args []string) (Input, error) {
			return parseInput(args, newCreateCategoryInput)
		},
	},
	"category:list": {
		Resource: "category", Action: "list",
		Description: "List all categories",
		Endpoint:    "/categories", Method: http.MethodGet,
	},
	"category:get": {
		Resource: "category", Action: "get",
		Description: "Get a category by ID",
		Endpoint:    "/categories/{id}", Method: http.MethodGet,
	},
	"category:update": {
		Resource: "category", Action: "update",
		Description: "Update a category",
		Endpoint:    "/categories/{id}", Method: http.MethodPut,
		HasBody: true,
		BuildInput: func(args []string) (Input, error) {
			return parseInput(args, newUpdateCategoryInput)
		},
	},
	"category:delete": {
		Resource: "category", Action: "delete",
		Description: "Delete a category",
		Endpoint:    "/categories/{id}", Method: http.MethodDelete,
	},
	"subcategory:create": {
		Resource: "subcategory", Action: "create",
		Description: "Create a new subcategory",
		Endpoint:    "/subcategories", Method: http.MethodPost,
		HasBody: true,
		BuildInput: func(args []string) (Input, error) {
			return parseInput(args, newCreateSubcategoryInput)
		},
	},
	"subcategory:list": {
		Resource: "subcategory", Action: "list",
		Description: "List all subcategories",
		Endpoint:    "/subcategories", Method: http.MethodGet,
	},
	"subcategory:get": {
		Resource: "subcategory", Action: "get",
		Description: "Get a subcategory by ID",
		Endpoint:    "/subcategories/{id}", Method: http.MethodGet,
	},
	"subcategory:update": {
		Resource: "subcategory", Action: "update",
		Description: "Update a subcategory",
		Endpoint:    "/subcategories/{id}", Method: http.MethodPut,
		HasBody: true,
		BuildInput: func(args []string) (Input, error) {
			return parseInput(args, newUpdateSubcategoryInput)
		},
	},
	"subcategory:delete": {
		Resource: "subcategory", Action: "delete",
		Description: "Delete a subcategory",
		Endpoint:    "/subcategories/{id}", Method: http.MethodDelete,
	},
	"channel:create": {
		Resource: "channel", Action: "create",
		Description: "Create a new channel",
		Endpoint:    "/channels", Method: http.MethodPost,
		HasBody: true,
		BuildInput: func(args []string) (Input, error) {
			return parseInput(args, newCreateChannelInput)
		},
	},
	"channel:list": {
		Resource: "channel", Action: "list",
		Description: "List all channels",
		Endpoint:    "/channels", Method: http.MethodGet,
	},
	"channel:get": {
		Resource: "channel", Action: "get",
		Description: "Get a channel by ID",
		Endpoint:    "/channels/{id}", Method: http.MethodGet,
	},
	"channel:update": {
		Resource: "channel", Action: "update",
		Description: "Update a channel",
		Endpoint:    "/channels/{id}", Method: http.MethodPut,
		HasBody: true,
		BuildInput: func(args []string) (Input, error) {
			return parseInput(args, newUpdateChannelInput)
		},
	},
	"channel:delete": {
		Resource: "channel", Action: "delete",
		Description: "Delete a channel",
		Endpoint:    "/channels/{id}", Method: http.MethodDelete,
	},
	"account:create": {
		Resource: "account", Action: "create",
		Description: "Create a new account",
		Endpoint:    "/accounts", Method: http.MethodPost,
		HasBody: true,
		BuildInput: func(args []string) (Input, error) {
			return parseInput(args, newCreateAccountInput)
		},
	},
	"account:list": {
		Resource: "account", Action: "list",
		Description: "List all accounts",
		Endpoint:    "/accounts", Method: http.MethodGet,
	},
	"account:get": {
		Resource: "account", Action: "get",
		Description: "Get an account by ID",
		Endpoint:    "/accounts/{id}", Method: http.MethodGet,
	},
	"account:update": {
		Resource: "account", Action: "update",
		Description: "Update an account",
		Endpoint:    "/accounts/{id}", Method: http.MethodPut,
		HasBody: true,
		BuildInput: func(args []string) (Input, error) {
			return parseInput(args, newUpdateAccountInput)
		},
	},
	"account:delete": {
		Resource: "account", Action: "delete",
		Description: "Delete an account",
		Endpoint:    "/accounts/{id}", Method: http.MethodDelete,
	},
	"asset:create": {
		Resource: "asset", Action: "create",
		Description: "Create a new asset",
		Endpoint:    "/assets", Method: http.MethodPost,
		HasBody: true,
		BuildInput: func(args []string) (Input, error) {
			return parseInput(args, newCreateAssetInput)
		},
	},
	"asset:list": {
		Resource: "asset", Action: "list",
		Description: "List all assets",
		Endpoint:    "/assets", Method: http.MethodGet,
	},
	"asset:get": {
		Resource: "asset", Action: "get",
		Description: "Get an asset by ID",
		Endpoint:    "/assets/{id}", Method: http.MethodGet,
	},
	"asset:update": {
		Resource: "asset", Action: "update",
		Description: "Update an asset",
		Endpoint:    "/assets/{id}", Method: http.MethodPut,
		HasBody: true,
		BuildInput: func(args []string) (Input, error) {
			return parseInput(args, newUpdateAssetInput)
		},
	},
	"asset:delete": {
		Resource: "asset", Action: "delete",
		Description: "Delete an asset",
		Endpoint:    "/assets/{id}", Method: http.MethodDelete,
	},
	"networth:get": {
		Resource: "networth", Action: "get",
		Description: "Get net worth summary",
		Endpoint:    "/networth", Method: http.MethodGet,
	},
	"historical:create": {
		Resource: "historical", Action: "create",
		Description: "Create a historical entry",
		Endpoint:    "/historical", Method: http.MethodPost,
		HasBody: true,
		BuildInput: func(args []string) (Input, error) {
			return parseInput(args, newCreateHistoricalEntryInput)
		},
	},
	"historical:list": {
		Resource: "historical", Action: "list",
		Description: "List historical entries",
		Endpoint:    "/historical", Method: http.MethodGet,
	},
	"historical:get": {
		Resource: "historical", Action: "get",
		Description: "Get a historical entry by date",
		Endpoint:    "/historical/{date}", Method: http.MethodGet,
	},
	"historical:update": {
		Resource: "historical", Action: "update",
		Description: "Update a historical entry",
		Endpoint:    "/historical/{date}", Method: http.MethodPut,
		HasBody: true,
		BuildInput: func(args []string) (Input, error) {
			return parseInput(args, newUpdateHistoricalEntryInput)
		},
	},
	"historical:delete": {
		Resource: "historical", Action: "delete",
		Description: "Delete a historical entry",
		Endpoint:    "/historical/{date}", Method: http.MethodDelete,
	},
	"installment:list": {
		Resource: "installment", Action: "list",
		Description: "List installment groups",
		Endpoint:    "/installment-groups", Method: http.MethodGet,
	},
	"installment:get": {
		Resource: "installment", Action: "get",
		Description: "Get an installment group by ID",
		Endpoint:    "/installment-groups/{id}", Method: http.MethodGet,
	},
	"economic:ipc": {
		Resource: "economic", Action: "ipc",
		Description: "Get IPC (Consumer Price Index)",
		Endpoint:    "/economic/ipc", Method: http.MethodGet,
	},
	"economic:inflation": {
		Resource: "economic", Action: "inflation",
		Description: "Get inflation data",
		Endpoint:    "/economic/inflation", Method: http.MethodGet,
	},
	"economic:dollar": {
		Resource: "economic", Action: "dollar",
		Description: "Get dollar exchange rates",
		Endpoint:    "/economic/dollar", Method: http.MethodGet,
	},
	"economic:dollar-banks": {
		Resource: "economic", Action: "dollar-banks",
		Description: "Get bank dollar rates",
		Endpoint:    "/economic/dollar/banks", Method: http.MethodGet,
	},
	"economic:crypto": {
		Resource: "economic", Action: "crypto",
		Description: "Get cryptocurrency data",
		Endpoint:    "/economic/crypto", Method: http.MethodGet,
	},
	"economic:country-risk": {
		Resource: "economic", Action: "country-risk",
		Description: "Get country risk index",
		Endpoint:    "/economic/country-risk", Method: http.MethodGet,
	},
	"economic:fixed-deposits": {
		Resource: "economic", Action: "fixed-deposits",
		Description: "Get fixed deposit rates",
		Endpoint:    "/economic/fixed-deposits", Method: http.MethodGet,
	},
	"economic:yield-accounts": {
		Resource: "economic", Action: "yield-accounts",
		Description: "Get yield account rates",
		Endpoint:    "/economic/yield-accounts", Method: http.MethodGet,
	},
	"economic:loans": {
		Resource: "economic", Action: "loans",
		Description: "Get loan rates",
		Endpoint:    "/economic/loans", Method: http.MethodGet,
	},
	"dashboard:kpis": {
		Resource: "dashboard", Action: "kpis",
		Description: "Get all KPIs",
		Endpoint:    "/dashboard", Method: http.MethodGet,
	},
	"dashboard:kpi": {
		Resource: "dashboard", Action: "kpi",
		Description: "Get a specific KPI evolution",
		Endpoint:    "/dashboard/kpi/{kpi}/evolution", Method: http.MethodGet,
	},
	"dashboard:dimension": {
		Resource: "dashboard", Action: "dimension",
		Description: "Get dashboard dimension data",
		Endpoint:    "/dashboard/dimension/{dimension}", Method: http.MethodGet,
	},
	"config:list": {
		Resource: "config", Action: "list",
		Description: "List all configuration",
		Endpoint:    "/users/config", Method: http.MethodGet,
	},
	"config:get": {
		Resource: "config", Action: "get",
		Description: "Get a configuration value",
		Endpoint:    "/users/config/{key}", Method: http.MethodGet,
	},
	"config:update": {
		Resource: "config", Action: "update",
		Description: "Update configuration",
		Endpoint:    "/users/config/{key}", Method: http.MethodPatch,
		HasBody: true,
		BuildInput: func(args []string) (Input, error) {
			return parseInput(args, newConfigSetInput)
		},
	},
	"backup:export": {
		Resource: "backup", Action: "export",
		Description: "Export backup to ZIP file",
		Flags:       "--output <path>",
		Endpoint:    "/backup/export", Method: http.MethodGet,
		RunFunc: backupExportRun,
	},
	"backup:import": {
		Resource: "backup", Action: "import",
		Description: "Import data from CSV file",
		Flags:       "--file <csv> | --body <csv>",
		Endpoint:    "/backup/import/{resource}", Method: http.MethodPost,
		RunFunc: backupImportRun,
	},
}

func (c CommandSpec) Run(cfg config.Config, args []string) error {
	if c.RunFunc != nil {
		return c.RunFunc(cfg, args)
	}

	endpoint := c.Endpoint

	endpoint, args = extractArgs(endpoint, args)

	if missing := unresolvedParams(endpoint); len(missing) > 0 {
		return fmt.Errorf("Error: missing required parameter\n\nUsage:  quant %s %s %s",
			c.Resource, c.Action, formatParamsUsage(missing))
	}

	if c.HasBody {
		input, err := c.BuildInput(args)
		if err != nil {
			return fmt.Errorf("Error: %w\n\nUsage:  %s %s %s %s", err, cfg.Name+"-cli", c.Resource, c.Action, input.Usage())
		}
		b, err := json.Marshal(input)
		if err != nil {
			return fmt.Errorf("failed to marshal request body: %w", err)
		}
		body := bytes.NewReader(b)

		url := fmt.Sprintf("http://127.0.0.1:%d/api%s", cfg.Port, endpoint)
		code, res, err := requestToAPI(c.Method, url, body)
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

	url := fmt.Sprintf("http://127.0.0.1:%d/api%s", cfg.Port, endpoint)
	code, res, err := requestToAPI(c.Method, url, nil)
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

func extractArgs(endpoint string, args []string) (string, []string) {
	result := endpoint
	for {
		start := strings.Index(result, "{")
		if start == -1 {
			break
		}
		end := strings.Index(result[start:], "}")
		if end == -1 {
			break
		}
		param := result[start+1 : start+end]

		found := false
		for i, arg := range args {
			prefix := param + "="
			if strings.HasPrefix(arg, prefix) {
				result = strings.Replace(result, "{"+param+"}", arg[len(prefix):], 1)
				args = append(args[:i], args[i+1:]...)
				found = true
				break
			}
		}
		if !found {
			break
		}
	}
	return result, args
}

func unresolvedParams(endpoint string) []string {
	var params []string
	for {
		start := strings.Index(endpoint, "{")
		if start == -1 {
			break
		}
		end := strings.Index(endpoint[start:], "}")
		if end == -1 {
			break
		}
		params = append(params, endpoint[start+1:start+end])
		endpoint = endpoint[start+end+1:]
	}
	return params
}

func formatParamsUsage(params []string) string {
	parts := make([]string, len(params))
	for i, p := range params {
		parts[i] = fmt.Sprintf("%s=<%s>", p, p)
	}
	return strings.Join(parts, " ")
}

func formatAPIError(code int, body []byte) error {
	var parsed struct {
		Error string `json:"error"`
	}
	if err := json.Unmarshal(body, &parsed); err == nil && parsed.Error != "" {
		return fmt.Errorf("Error: %s (status %d)", parsed.Error, code)
	}
	return fmt.Errorf("Error: request failed (status %d)", code)
}
