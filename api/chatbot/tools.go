package chatbot

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/nnavales/quant/api/categories"
	"github.com/nnavales/quant/api/channels"
	"github.com/nnavales/quant/api/dashboard"
	"github.com/nnavales/quant/api/finance"
	"github.com/nnavales/quant/api/historical"
	"github.com/nnavales/quant/api/macro"
	"github.com/nnavales/quant/api/networth"
	"github.com/nnavales/quant/api/users"
	"github.com/openai/openai-go/v3"
)

type Tool struct {
	Name        string
	Description string
	Parameters  openai.FunctionParameters
	Execute     func(ctx context.Context, args json.RawMessage) (string, error)
}

type ServiceTools struct {
	FinanceSvc    *finance.Service
	CategorySvc   *categories.Service
	ChannelSvc    *channels.Service
	MacroSvc      *macro.Service
	DashboardSvc  *dashboard.Service
	UserSvc       *users.Service
	HistoricalSvc *historical.Service
	NetWorthSvc   *networth.Service
}

func NewTools(s *ServiceTools) []Tool {
	return []Tool{
		{
			Name:        "get_rate",
			Description: "Get current valid exchange_rate",
			Parameters: openai.FunctionParameters{
				"type":                 "object",
				"additionalProperties": false,
				"properties":           map[string]any{},
			},

			Execute: func(ctx context.Context, _ json.RawMessage) (string, error) {
				dollarSrcRaw, err := s.UserSvc.Get(ctx, "dollar_source")
				if err == nil {
					if dollarSrc, ok := dollarSrcRaw.(string); ok && dollarSrc != "" {
						rates, err := s.MacroSvc.FetchDollarCotization(ctx, true)
						if err == nil {
							if v, ok := rates[dollarSrc]; ok {
								return fmt.Sprintf("%f", v.Sell), nil
							}
						}
					}
				}

				defaultRaw, err := s.UserSvc.Get(ctx, "default_rate")
				if err == nil && defaultRaw != nil {
					rate, err := strconv.ParseFloat(fmt.Sprintf("%v", defaultRaw), 64)
					if err == nil {
						return fmt.Sprintf("%f", rate), nil
					}
				}

				series, err := s.MacroSvc.FetchDollarHistoric(ctx, "sell", true)
				if err == nil {
					return fmt.Sprintf("%f", series.Last.Value), nil
				}
				return "", fmt.Errorf("could not resolve exchange rate")
			},
		},
		{
			Name: "create_transaction",

			Description: `
Create a financial transaction.

Requires:
- category_id
- subcategory_id
- channel_id
- account_id

Use list_categories, list_subcategories,
list_channels and list_accounts first if IDs are unknown.
`,

			Parameters: openai.FunctionParameters{
				"type":                 "object",
				"additionalProperties": false,

				"properties": map[string]any{
					"description": map[string]any{
						"type":        "string",
						"description": "Transaction description",
					},

					"date": map[string]any{
						"type":        "string",
						"description": "YYYY-MM-DD",
					},

					"amount": map[string]any{
						"type":        "string",
						"description": "Transaction amount as string (e.g. '1500.50')",
					},

					"type": map[string]any{
						"type": "string",
						"enum": []string{"expense", "income"},
					},

					"frequency": map[string]any{
						"type": "string",
						"enum": []string{"fixed", "variable"},
					},

					"currency": map[string]any{
						"type": "string",
						"enum": []string{"ARS", "USD"},
					},

					"category_id": map[string]any{
						"type":        "string",
						"description": "Category ID from list_categories",
					},

					"subcategory_id": map[string]any{
						"type":        "string",
						"description": "Subcategory ID from list_subcategories",
					},

					"channel_id": map[string]any{
						"type":        "string",
						"description": "Channel ID from list_channels",
					},

					"account_id": map[string]any{
						"type":        "string",
						"description": "Account ID from list_accounts",
					},

					"exchange_rate": map[string]any{
						"type":        "number",
						"description": "Exchange rate from get_rate",
					},

					"installment_number": map[string]any{
						"type":        "integer",
						"description": "Installment count if applicable",
					},

					"is_paid": map[string]any{
						"type":        "boolean",
						"description": "State of the transaction",
					},
				},

				"required": []string{
					"description",
					"date",
					"amount",
					"type",
					"frequency",
					"currency",
					"category_id",
					"subcategory_id",
					"channel_id",
					"account_id",
					"exchange_rate",
				},
			},

			Execute: func(ctx context.Context, args json.RawMessage) (string, error) {
				var req finance.TransactionAggregateReq

				if err := json.Unmarshal(args, &req); err != nil {
					return "", err
				}

				result, err := s.FinanceSvc.CreateTransactionAggregate(ctx, req)
				if err != nil {
					return "", err
				}

				b, err := json.Marshal(result)
				if err != nil {
					return "", err
				}

				return string(b), nil
			},
		},

		{
			Name: "list_transactions",

			Description: `
List transactions using optional filters.
Returns newest transactions first.
`,

			Parameters: openai.FunctionParameters{
				"type":                 "object",
				"additionalProperties": false,

				"properties": map[string]any{
					"search": map[string]any{
						"type": "string",
					},

					"type": map[string]any{
						"type": "string",
						"enum": []string{"expense", "income"},
					},

					"frequency": map[string]any{
						"type": "string",
						"enum": []string{"fixed", "variable"},
					},

					"category": map[string]any{
						"type":        "string",
						"description": "Category ID",
					},

					"subcategory": map[string]any{
						"type":        "string",
						"description": "Subcategory ID",
					},

					"channel": map[string]any{
						"type":        "string",
						"description": "Channel ID",
					},

					"account": map[string]any{
						"type":        "string",
						"description": "Account ID",
					},

					"date_from": map[string]any{
						"type":        "string",
						"description": "YYYY-MM-DD",
					},

					"date_to": map[string]any{
						"type":        "string",
						"description": "YYYY-MM-DD",
					},

					"limit": map[string]any{
						"type":        "integer",
						"description": "Maximum results. Default 20",
					},
				},
			},

			Execute: func(ctx context.Context, args json.RawMessage) (string, error) {
				var params finance.FilterParams

				if len(args) > 0 {
					if err := json.Unmarshal(args, &params); err != nil {
						return "", err
					}
				}

				filter, err := finance.NewFilter(params)
				if err != nil {
					return "", err
				}

				result, err := s.FinanceSvc.ListTransactionsAggregate(ctx, filter)
				if err != nil {
					return "", err
				}

				b, err := json.Marshal(result)
				if err != nil {
					return "", err
				}

				return string(b), nil
			},
		},

		{
			Name: "bulk_create_transactions",

			Description: `
Create multiple transactions at once.
Each item uses same fields as create_transaction.
Maximum 50 items.
`,

			Parameters: openai.FunctionParameters{
				"type":                 "object",
				"additionalProperties": false,

				"properties": map[string]any{
					"data": map[string]any{
						"type":     "array",
						"minItems": 1,
						"maxItems": 50,

						"items": map[string]any{
							"type":                 "object",
							"additionalProperties": false,

							"properties": map[string]any{
								"description": map[string]any{
									"type":        "string",
									"description": "Transaction description",
								},

								"date": map[string]any{
									"type":        "string",
									"description": "YYYY-MM-DD",
								},

								"amount": map[string]any{
									"type":        "string",
									"description": "Transaction amount as string (e.g. '1500.50')",
								},

								"type": map[string]any{
									"type": "string",
									"enum": []string{"expense", "income"},
								},

								"frequency": map[string]any{
									"type": "string",
									"enum": []string{"fixed", "variable"},
								},

								"currency": map[string]any{
									"type": "string",
									"enum": []string{"ARS", "USD"},
								},

								"category_id": map[string]any{
									"type":        "string",
									"description": "Category ID from list_categories",
								},

								"subcategory_id": map[string]any{
									"type":        "string",
									"description": "Subcategory ID from list_subcategories",
								},

								"channel_id": map[string]any{
									"type":        "string",
									"description": "Channel ID from list_channels",
								},

								"account_id": map[string]any{
									"type":        "string",
									"description": "Account ID from list_accounts",
								},

								"exchange_rate": map[string]any{
									"type":        "number",
									"description": "Exchange rate from get_rate",
								},

								"installment_number": map[string]any{
									"type":        "integer",
									"description": "Installment count if applicable",
								},

								"is_paid": map[string]any{
									"type":        "boolean",
									"description": "State of the transaction",
								},
							},

							"required": []string{
								"description",
								"date",
								"amount",
								"type",
								"frequency",
								"currency",
								"category_id",
								"subcategory_id",
								"channel_id",
								"account_id",
								"exchange_rate",
							},
						},
					},
				},

				"required": []string{"data"},
			},

			Execute: func(ctx context.Context, args json.RawMessage) (string, error) {
				var req finance.BulkTransactionReq

				if err := json.Unmarshal(args, &req); err != nil {
					return "", err
				}

				if err := s.FinanceSvc.BulkCreateTransactionAggregate(ctx, req); err != nil {
					return "", err
				}

				return `{"status":"created"}`, nil
			},
		},

		{
			Name:        "list_categories",
			Description: "List all categories with IDs.",

			Parameters: openai.FunctionParameters{
				"type":                 "object",
				"additionalProperties": false,
				"properties":           map[string]any{},
			},

			Execute: func(ctx context.Context, _ json.RawMessage) (string, error) {
				result, err := s.CategorySvc.ListCategories(ctx, categories.Filter{})
				if err != nil {
					return "", err
				}

				b, err := json.Marshal(result)
				if err != nil {
					return "", err
				}

				return string(b), nil
			},
		},

		{
			Name:        "list_subcategories",
			Description: "List all subcategories with IDs.",

			Parameters: openai.FunctionParameters{
				"type":                 "object",
				"additionalProperties": false,
				"properties":           map[string]any{},
			},

			Execute: func(ctx context.Context, _ json.RawMessage) (string, error) {
				result, err := s.CategorySvc.ListSubcategories(ctx, categories.Filter{})
				if err != nil {
					return "", err
				}

				b, err := json.Marshal(result)
				if err != nil {
					return "", err
				}

				return string(b), nil
			},
		},

		{
			Name:        "list_channels",
			Description: "List all payment channels with IDs.",

			Parameters: openai.FunctionParameters{
				"type":                 "object",
				"additionalProperties": false,
				"properties":           map[string]any{},
			},

			Execute: func(ctx context.Context, _ json.RawMessage) (string, error) {
				result, err := s.ChannelSvc.ListChannels(ctx, channels.Filter{})
				if err != nil {
					return "", err
				}

				b, err := json.Marshal(result)
				if err != nil {
					return "", err
				}

				return string(b), nil
			},
		},

		{
			Name:        "list_accounts",
			Description: "List all accounts with IDs.",

			Parameters: openai.FunctionParameters{
				"type":                 "object",
				"additionalProperties": false,
				"properties":           map[string]any{},
			},

			Execute: func(ctx context.Context, _ json.RawMessage) (string, error) {
				result, err := s.ChannelSvc.ListAccounts(ctx, channels.Filter{})
				if err != nil {
					return "", err
				}

				b, err := json.Marshal(result)
				if err != nil {
					return "", err
				}

				return string(b), nil
			},
		},

		{
			Name:        "get_networth",
			Description: "Get current net worth summary.",

			Parameters: openai.FunctionParameters{
				"type":                 "object",
				"additionalProperties": false,
				"properties":           map[string]any{},
			},

			Execute: func(ctx context.Context, _ json.RawMessage) (string, error) {
				result, err := s.NetWorthSvc.GetNetWorth(ctx)
				if err != nil {
					return "", err
				}

				b, err := json.Marshal(result)
				if err != nil {
					return "", err
				}

				return string(b), nil
			},
		},

		{
			Name:        "list_historical_entries",
			Description: "List historical financial entries.",

			Parameters: openai.FunctionParameters{
				"type":                 "object",
				"additionalProperties": false,
				"properties":           map[string]any{},
			},

			Execute: func(ctx context.Context, _ json.RawMessage) (string, error) {
				result, err := s.HistoricalSvc.ListHistoricalEntries(ctx)
				if err != nil {
					return "", err
				}

				b, err := json.Marshal(result)
				if err != nil {
					return "", err
				}

				return string(b), nil
			},
		},

		{
			Name:        "get_dollar_rates",
			Description: "Get current dollar exchange rates.",

			Parameters: openai.FunctionParameters{
				"type":                 "object",
				"additionalProperties": false,
				"properties":           map[string]any{},
			},

			Execute: func(ctx context.Context, _ json.RawMessage) (string, error) {
				result, err := s.MacroSvc.FetchDollarCotization(ctx, false)
				if err != nil {
					return "", err
				}

				b, err := json.Marshal(result)
				if err != nil {
					return "", err
				}

				return string(b), nil
			},
		},

		{
			Name:        "get_kpis",
			Description: "Get dashboard KPIs and financial metrics.",

			Parameters: openai.FunctionParameters{
				"type":                 "object",
				"additionalProperties": false,
				"properties":           map[string]any{},
			},

			Execute: func(ctx context.Context, _ json.RawMessage) (string, error) {
				result, err := s.DashboardSvc.GetKPIs(ctx)
				if err != nil {
					return "", err
				}

				b, err := json.Marshal(result)
				if err != nil {
					return "", err
				}

				return string(b), nil
			},
		},

		{
			Name:        "list_config",
			Description: "List user configuration values.",

			Parameters: openai.FunctionParameters{
				"type":                 "object",
				"additionalProperties": false,
				"properties":           map[string]any{},
			},

			Execute: func(ctx context.Context, _ json.RawMessage) (string, error) {
				result, err := s.UserSvc.List(ctx)
				if err != nil {
					return "", err
				}

				b, err := json.Marshal(result)
				if err != nil {
					return "", err
				}

				return string(b), nil
			},
		},
	}
}
