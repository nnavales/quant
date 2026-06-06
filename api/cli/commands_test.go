package cli

import (
	"fmt"
	"net/http"
	"strings"
	"testing"

	"github.com/nnavales/quant/api/entries"
	"github.com/nnavales/quant/api/money"
	"github.com/nnavales/quant/api/networth"
)

// ========================
// Commands map consistency
// ========================

func TestCommandsMap_AllHaveValidEndpoints(t *testing.T) {
	for key, cmd := range Commands {
		if !strings.HasPrefix(cmd.Endpoint, "/") {
			t.Errorf("%q: endpoint %q must start with /", key, cmd.Endpoint)
		}
	}
}

func TestCommandsMap_HasBodyRequiresBuildInput(t *testing.T) {
	for key, cmd := range Commands {
		if cmd.RunFunc != nil {
			continue
		}
		if cmd.HasBody && cmd.BuildInput == nil {
			t.Errorf("%q: HasBody=true but BuildInput is nil", key)
		}
		if cmd.HasBody && cmd.Method == http.MethodGet {
			t.Errorf("%q: HasBody=true but method is GET", key)
		}
	}
}

func TestCommandsMap_ValidHTTPMethods(t *testing.T) {
	valid := map[string]bool{
		http.MethodGet:     true,
		http.MethodPost:    true,
		http.MethodPut:     true,
		http.MethodPatch:   true,
		http.MethodDelete:  true,
	}
	for key, cmd := range Commands {
		if !valid[cmd.Method] {
			t.Errorf("%q: invalid HTTP method %q", key, cmd.Method)
		}
	}
}

func TestCommandsMap_NoDuplicateKeys(t *testing.T) {
	seen := make(map[string]bool)
	for key := range Commands {
		if seen[key] {
			t.Errorf("duplicate command key: %q", key)
		}
		seen[key] = true
	}
}

func TestCommandsMap_GetAndDeleteHaveNoBody(t *testing.T) {
	for key, cmd := range Commands {
		if cmd.RunFunc != nil {
			continue
		}
		if (cmd.Method == http.MethodGet || cmd.Method == http.MethodDelete) && cmd.HasBody {
			t.Errorf("%q: GET/DELETE with HasBody=true is unusual", key)
		}
	}
}

// ========================
// extractArgs
// ========================

func TestExtractArgs(t *testing.T) {
	tests := []struct {
		name     string
		endpoint string
		args     []string
		wantEP   string
		wantArgs []string
	}{
		{
			name:     "no params",
			endpoint: "/assets",
			args:     []string{},
			wantEP:   "/assets",
			wantArgs: []string{},
		},
		{
			name:     "single id param",
			endpoint: "/assets/{id}",
			args:     []string{"id=abc123"},
			wantEP:   "/assets/abc123",
			wantArgs: []string{},
		},
		{
			name:     "id extracted from mixed args",
			endpoint: "/categories/{id}",
			args:     []string{"id=cat1", "name=foo"},
			wantEP:   "/categories/cat1",
			wantArgs: []string{"name=foo"},
		},
		{
			name:     "kpi param",
			endpoint: "/dashboard/kpi/{kpi}/evolution",
			args:     []string{"kpi=my-kpi"},
			wantEP:   "/dashboard/kpi/my-kpi/evolution",
			wantArgs: []string{},
		},
		{
			name:     "date param",
			endpoint: "/historical/{date}",
			args:     []string{"date=2024-01-15"},
			wantEP:   "/historical/2024-01-15",
			wantArgs: []string{},
		},
		{
			name:     "key param",
			endpoint: "/users/config/{key}",
			args:     []string{"key=default_rate"},
			wantEP:   "/users/config/default_rate",
			wantArgs: []string{},
		},
		{
			name:     "dimension param",
			endpoint: "/dashboard/dimension/{dimension}",
			args:     []string{"dimension=ingresos"},
			wantEP:   "/dashboard/dimension/ingresos",
			wantArgs: []string{},
		},
		{
			name:     "multiple params",
			endpoint: "/a/{x}/b/{y}/c",
			args:     []string{"x=1", "y=2"},
			wantEP:   "/a/1/b/2/c",
			wantArgs: []string{},
		},
		{
			name:     "param missing from args (stays as template)",
			endpoint: "/assets/{id}",
			args:     []string{"other=val"},
			wantEP:   "/assets/{id}",
			wantArgs: []string{"other=val"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotEP, gotArgs := extractArgs(tt.endpoint, append([]string{}, tt.args...))
			if gotEP != tt.wantEP {
				t.Errorf("endpoint = %q, want %q", gotEP, tt.wantEP)
			}
			if !equalSlice(gotArgs, tt.wantArgs) {
				t.Errorf("args = %v, want %v", gotArgs, tt.wantArgs)
			}
		})
	}
}

// ========================
// parseKV
// ========================

func TestParseKV(t *testing.T) {
	tests := []struct {
		args []string
		want map[string]string
	}{
		{[]string{}, map[string]string{}},
		{[]string{"a=1"}, map[string]string{"a": "1"}},
		{[]string{"a=1", "b=2"}, map[string]string{"a": "1", "b": "2"}},
		{[]string{"a=1", "noequal"}, map[string]string{"a": "1"}},
		{[]string{"=val"}, map[string]string{}},
	}
	for _, tt := range tests {
		t.Run(strings.Join(tt.args, " "), func(t *testing.T) {
			got := parseKV(tt.args)
			if len(got) != len(tt.want) {
				t.Errorf("got %v, want %v", got, tt.want)
			}
			for k, v := range tt.want {
				if got[k] != v {
					t.Errorf("got %v, want %v", got, tt.want)
				}
			}
		})
	}
}

// ========================
// Transaction inputs
// ========================

func validCreateTxMap() map[string]string {
	return map[string]string{
		"description":   "test tx",
		"date":          "2024-06-01",
		"type":          "expense",
		"frequency":     "variable",
		"amount":        "100.50",
		"currency":      "ARS",
		"exchange_rate": "1",
		"category_id":   "cat1",
		"subcategory_id": "sub1",
		"channel_id":    "ch1",
		"account_id":    "acc1",
	}
}

func TestCreateTransactionInput_Valid(t *testing.T) {
	in, err := newCreateTransactionInput(validCreateTxMap())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := in.Validate(); err != nil {
		t.Fatalf("validation failed: %v", err)
	}
}

func TestCreateTransactionInput_MissingRequired(t *testing.T) {
	fields := []string{"description", "date", "type", "frequency", "amount", "currency", "category_id", "subcategory_id", "channel_id", "account_id"}
	for _, field := range fields {
		t.Run("missing_"+field, func(t *testing.T) {
			m := validCreateTxMap()
			delete(m, field)
			in, err := newCreateTransactionInput(m)
			if err != nil {
				return // parsing error is fine
			}
			if err := in.Validate(); err == nil {
				t.Errorf("expected validation error for missing %q", field)
			}
		})
	}
}

func TestCreateTransactionInput_InvalidType(t *testing.T) {
	m := validCreateTxMap()
	m["type"] = "invalid"
	in, err := newCreateTransactionInput(m)
	if err != nil {
		return
	}
	if err := in.Validate(); err == nil {
		t.Error("expected validation error for invalid type")
	}
}

func TestCreateTransactionInput_InvalidCurrency(t *testing.T) {
	m := validCreateTxMap()
	m["currency"] = "EUR"
	in, err := newCreateTransactionInput(m)
	if err != nil {
		return
	}
	if err := in.Validate(); err == nil {
		t.Error("expected validation error for invalid currency")
	}
}

func TestCreateTransactionInput_NegativeExchangeRate(t *testing.T) {
	m := validCreateTxMap()
	m["exchange_rate"] = "0"
	in, err := newCreateTransactionInput(m)
	if err != nil {
		return
	}
	if err := in.Validate(); err == nil {
		t.Error("expected validation error for zero exchange_rate")
	}
}

func TestCreateTransactionInput_Usage(t *testing.T) {
	u := CreateTransactionInput{}.Usage()
	if !strings.Contains(u, "description") {
		t.Errorf("usage should mention description")
	}
}

func TestUpdateTransactionInput_AllNil(t *testing.T) {
	in, err := newUpdateTransactionInput(map[string]string{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := in.Validate(); err != nil {
		t.Fatalf("validation failed with all nil: %v", err)
	}
}

func TestUpdateTransactionInput_InvalidType(t *testing.T) {
	m := map[string]string{"type": "bad"}
	in, err := newUpdateTransactionInput(m)
	if err != nil {
		return
	}
	if err := in.Validate(); err == nil {
		t.Error("expected validation error for invalid type")
	}
}

func TestUpdateTransactionInput_Usage(t *testing.T) {
	u := UpdateTransactionInput{}.Usage()
	if !strings.Contains(u, "description") {
		t.Errorf("usage should mention description")
	}
}

// ========================
// Category / Subcategory
// ========================

func TestCreateCategoryInput_Valid(t *testing.T) {
	in, err := newCreateCategoryInput(map[string]string{"name": "Food"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := in.Validate(); err != nil {
		t.Fatalf("validation failed: %v", err)
	}
}

func TestCreateCategoryInput_MissingName(t *testing.T) {
	in, _ := newCreateCategoryInput(map[string]string{})
	if err := in.Validate(); err == nil {
		t.Error("expected validation error for missing name")
	}
}

func TestCreateCategoryInput_TooLong(t *testing.T) {
	long := strings.Repeat("a", 101)
	_, err := newCreateCategoryInput(map[string]string{"name": long})
	if err == nil {
		// KV builder doesn't validate length, only Validate does
		in, _ := newCreateCategoryInput(map[string]string{"name": long})
		if err := in.Validate(); err == nil {
			t.Error("expected validation error for long name")
		}
	}
}

func TestUpdateCategoryInput_Valid(t *testing.T) {
	in, err := newUpdateCategoryInput(map[string]string{"name": "NewName"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := in.Validate(); err != nil {
		t.Fatalf("validation failed: %v", err)
	}
}

func TestUpdateCategoryInput_EmptyName(t *testing.T) {
	n := ""
	in := UpdateCategoryInput{Name: &n}
	if err := in.Validate(); err == nil {
		t.Error("expected validation error for empty name")
	}
}

func TestCreateSubcategoryInput_Valid(t *testing.T) {
	in, err := newCreateSubcategoryInput(map[string]string{
		"category_id": "cat1",
		"name":        "Sub",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := in.Validate(); err != nil {
		t.Fatalf("validation failed: %v", err)
	}
}

func TestCreateSubcategoryInput_MissingFields(t *testing.T) {
	t.Run("missing category_id", func(t *testing.T) {
		in, _ := newCreateSubcategoryInput(map[string]string{"name": "Sub"})
		if err := in.Validate(); err == nil {
			t.Error("expected error")
		}
	})
	t.Run("missing name", func(t *testing.T) {
		in, _ := newCreateSubcategoryInput(map[string]string{"category_id": "cat1"})
		if err := in.Validate(); err == nil {
			t.Error("expected error")
		}
	})
}

func TestUpdateSubcategoryInput_Valid(t *testing.T) {
	in, err := newUpdateSubcategoryInput(map[string]string{"name": "New"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := in.Validate(); err != nil {
		t.Fatalf("validation failed: %v", err)
	}
}

func TestCategoryUsage(t *testing.T) {
	if !strings.Contains(CreateCategoryInput{}.Usage(), "name") {
		t.Error("CreateCategoryInput usage missing name")
	}
	if !strings.Contains(UpdateCategoryInput{}.Usage(), "name") {
		t.Error("UpdateCategoryInput usage missing name")
	}
}

// ========================
// Channel / Account
// ========================

func TestCreateChannelInput_Valid(t *testing.T) {
	in, err := newCreateChannelInput(map[string]string{"name": "Bank"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := in.Validate(); err != nil {
		t.Fatalf("validation failed: %v", err)
	}
}

func TestCreateChannelInput_MissingName(t *testing.T) {
	in, _ := newCreateChannelInput(map[string]string{})
	if err := in.Validate(); err == nil {
		t.Error("expected validation error")
	}
}

func TestUpdateChannelInput_AllNil(t *testing.T) {
	in, err := newUpdateChannelInput(map[string]string{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := in.Validate(); err != nil {
		t.Fatalf("validation failed: %v", err)
	}
}

func TestCreateAccountInput_Valid(t *testing.T) {
	in, err := newCreateAccountInput(map[string]string{
		"channel_id": "ch1",
		"name":       "My Account",
		"instrument": "debit_card",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := in.Validate(); err != nil {
		t.Fatalf("validation failed: %v", err)
	}
}

func TestCreateAccountInput_InvalidInstrument(t *testing.T) {
	in, err := newCreateAccountInput(map[string]string{
		"channel_id": "ch1",
		"name":       "A",
		"instrument": "invalid",
	})
	if err != nil {
		return
	}
	if err := in.Validate(); err == nil {
		t.Error("expected error for invalid instrument")
	}
}

func TestCreateAccountInput_MissingChannelID(t *testing.T) {
	in, _ := newCreateAccountInput(map[string]string{"name": "A", "instrument": "cash"})
	if err := in.Validate(); err == nil {
		t.Error("expected error")
	}
}

func TestUpdateAccountInput_AllNil(t *testing.T) {
	in, err := newUpdateAccountInput(map[string]string{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := in.Validate(); err != nil {
		t.Fatalf("validation failed: %v", err)
	}
}

// ========================
// Asset inputs
// ========================

func TestCreateAssetInput_Valid(t *testing.T) {
	in, err := newCreateAssetInput(map[string]string{
		"name":     "Car",
		"amount":   "15000000",
		"currency": "ARS",
		"type":     "physical",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := in.Validate(); err != nil {
		t.Fatalf("validation failed: %v", err)
	}
	if in.Name != "Car" {
		t.Errorf("name = %q, want Car", in.Name)
	}
	if in.Currency != entries.CurrencyARS {
		t.Errorf("currency = %q, want ARS", in.Currency)
	}
	if in.Type != networth.AssetPhysical {
		t.Errorf("type = %q, want physical", in.Type)
	}
}

func TestCreateAssetInput_MissingName(t *testing.T) {
	in, _ := newCreateAssetInput(map[string]string{"amount": "100", "currency": "USD", "type": "liquid"})
	if err := in.Validate(); err == nil {
		t.Error("expected validation error")
	}
}

func TestCreateAssetInput_InvalidCurrency(t *testing.T) {
	m := map[string]string{"name": "X", "amount": "100", "currency": "EUR", "type": "liquid"}
	in, err := newCreateAssetInput(m)
	if err != nil {
		return
	}
	if err := in.Validate(); err == nil {
		t.Error("expected validation error")
	}
}

func TestCreateAssetInput_InvalidType(t *testing.T) {
	m := map[string]string{"name": "X", "amount": "100", "currency": "USD", "type": "crypto"}
	in, err := newCreateAssetInput(m)
	if err != nil {
		return
	}
	if err := in.Validate(); err == nil {
		t.Error("expected validation error")
	}
}

func TestUpdateAssetInput_Valid(t *testing.T) {
	n := "NewName"
	in := UpdateAssetInput{Name: &n}
	if err := in.Validate(); err != nil {
		t.Fatalf("validation failed: %v", err)
	}
}

func TestUpdateAssetInput_AllNil(t *testing.T) {
	in, err := newUpdateAssetInput(map[string]string{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := in.Validate(); err != nil {
		t.Fatalf("validation failed: %v", err)
	}
}

func TestAssetUsage(t *testing.T) {
	if !strings.Contains(CreateAssetInput{}.Usage(), "amount") {
		t.Error("CreateAssetInput usage missing amount")
	}
}

// ========================
// Historical inputs
// ========================

func validCreateHistMap() map[string]string {
	return map[string]string{
		"date":                "2024-06-01",
		"exchange_rate":       "1",
		"income_usd":          "1000",
		"income_fixed_usd":    "500",
		"income_variable_usd": "500",
		"expense_usd":         "800",
		"expense_fixed_usd":   "300",
		"expense_variable_usd":"500",
	}
}

func TestCreateHistoricalEntryInput_Valid(t *testing.T) {
	in, err := newCreateHistoricalEntryInput(validCreateHistMap())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := in.Validate(); err != nil {
		t.Fatalf("validation failed: %v", err)
	}
}

func TestCreateHistoricalEntryInput_MissingDate(t *testing.T) {
	m := validCreateHistMap()
	delete(m, "date")
	in, err := newCreateHistoricalEntryInput(m)
	if err != nil {
		return
	}
	if err := in.Validate(); err == nil {
		t.Error("expected error for missing date")
	}
}

func TestCreateHistoricalEntryInput_NegativeAmount(t *testing.T) {
	m := validCreateHistMap()
	m["income_usd"] = "-100"
	in, err := newCreateHistoricalEntryInput(m)
	if err != nil {
		return
	}
	if err := in.Validate(); err == nil {
		t.Error("expected error for negative income")
	}
}

func TestCreateHistoricalEntryInput_InvalidBreakdown(t *testing.T) {
	m := validCreateHistMap()
	m["income_fixed_usd"] = "100"
	m["income_variable_usd"] = "100"
	in, err := newCreateHistoricalEntryInput(m)
	if err != nil {
		return
	}
	if err := in.Validate(); err == nil {
		t.Error("expected error for income breakdown mismatch")
	}
}

func TestCreateHistoricalEntryInput_InvalidAmount(t *testing.T) {
	m := validCreateHistMap()
	m["income_usd"] = "not-a-number"
	in, _ := newCreateHistoricalEntryInput(m)
	if err := in.Validate(); err == nil {
		t.Error("expected validation error for invalid amount")
	}
}

func TestUpdateHistoricalEntryInput_AllNil(t *testing.T) {
	in, err := newUpdateHistoricalEntryInput(map[string]string{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := in.Validate(); err != nil {
		t.Fatalf("validation failed: %v", err)
	}
}

func TestUpdateHistoricalEntryInput_NegativeAmount(t *testing.T) {
	in, err := newUpdateHistoricalEntryInput(map[string]string{"income_usd": "-50"})
	if err != nil {
		return
	}
	if err := in.Validate(); err == nil {
		t.Error("expected error for negative income")
	}
}

func TestHistoricalUsage(t *testing.T) {
	if !strings.Contains(CreateHistoricalEntryInput{}.Usage(), "date") {
		t.Error("usage missing date")
	}
}

// ========================
// Config input
// ========================

func TestConfigSetInput_Valid(t *testing.T) {
	in, err := newConfigSetInput(map[string]string{"default_rate": "1000"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := in.Validate(); err != nil {
		t.Fatalf("validation failed: %v", err)
	}
	if in.Key != "default_rate" {
		t.Errorf("key = %q, want default_rate", in.Key)
	}
	if in.Value != "1000" {
		t.Errorf("value = %q, want 1000", in.Value)
	}
}

func TestConfigSetInput_Empty(t *testing.T) {
	_, err := newConfigSetInput(map[string]string{})
	if err == nil {
		t.Error("expected error for empty config")
	}
}

func TestConfigSetInput_MultipleKeys(t *testing.T) {
	_, err := newConfigSetInput(map[string]string{
		"key1": "val1",
		"key2": "val2",
	})
	if err == nil {
		t.Error("expected error for multiple keys")
	}
}

func TestConfigSetInput_Usage(t *testing.T) {
	u := ConfigSetInput{}.Usage()
	if !strings.Contains(u, "key=value") {
		t.Error("usage missing key=value")
	}
}

// ========================
// Extract args edge cases
// ========================

func TestExtractArgs_NoReplacementForMissingParam(t *testing.T) {
	ep, args := extractArgs("/test/{id}", []string{"name=foo"})
	if ep != "/test/{id}" {
		t.Errorf("endpoint = %q, want /test/{id}", ep)
	}
	if len(args) != 1 || args[0] != "name=foo" {
		t.Errorf("args = %v, want [name=foo]", args)
	}
}

func TestExtractArgs_MultipleSameParam(t *testing.T) {
	ep, args := extractArgs("/{x}/a/{x}", []string{"x=1"})
	// first {x} replaced, second stays because only 1 replacement per iteration
	want := "/1/a/{x}"
	if ep != want {
		t.Errorf("endpoint = %q, want %q", ep, want)
	}
	if len(args) != 0 {
		t.Errorf("args = %v, want []", args)
	}
}

func TestExtractArgs_SkipsUnknownFormat(t *testing.T) {
	ep, args := extractArgs("/test/{unclosed", []string{"x=1"})
	if ep != "/test/{unclosed" {
		t.Errorf("endpoint unchanged = %q", ep)
	}
	if len(args) != 1 {
		t.Errorf("args = %v, want [x=1]", args)
	}
}

// ========================
// Input type conversions
// ========================

func TestCreateTransactionInput_ParsesInstallmentNumber(t *testing.T) {
	m := validCreateTxMap()
	m["installment_number"] = "3"
	in, err := newCreateTransactionInput(m)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if in.InstallmentNumber == nil || *in.InstallmentNumber != 3 {
		t.Errorf("installment_number = %v, want 3", in.InstallmentNumber)
	}
}

func TestCreateTransactionInput_InvalidInstallmentNumber(t *testing.T) {
	m := validCreateTxMap()
	m["installment_number"] = "abc"
	_, err := newCreateTransactionInput(m)
	if err == nil {
		t.Error("expected error for invalid installment_number")
	}
}

func TestCreateTransactionInput_ParsesIsPaid(t *testing.T) {
	m := validCreateTxMap()
	m["is_paid"] = "true"
	in, err := newCreateTransactionInput(m)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if in.IsPaid == nil || !*in.IsPaid {
		t.Errorf("is_paid = %v, want true", in.IsPaid)
	}
}

func TestCreateTransactionInput_InvalidIsPaid(t *testing.T) {
	m := validCreateTxMap()
	m["is_paid"] = "notbool"
	_, err := newCreateTransactionInput(m)
	if err == nil {
		t.Error("expected error for invalid is_paid")
	}
}

// ========================
// Breakdown matches helper
// ========================

func TestBreakdownMatches(t *testing.T) {
	tests := []struct {
		total, fixed, variable int64
		want                   bool
	}{
		{100, 50, 50, true},
		{100, 60, 40, true},
		{100, 100, 0, true},
		{100, 0, 100, true},
		{100, 50, 47, true},  // diff=3, within margin
		{100, 50, 46, false}, // diff=4, outside margin
		{0, 0, 0, true},
	}
	for _, tt := range tests {
		t.Run(fmt.Sprintf("%d_%d_%d", tt.total, tt.fixed, tt.variable), func(t *testing.T) {
			got := breakdownMatches(tt.total, tt.fixed, tt.variable)
			if got != tt.want {
				t.Errorf("breakdownMatches(%d, %d, %d) = %v, want %v", tt.total, tt.fixed, tt.variable, got, tt.want)
			}
		})
	}
}

// ========================
// isValidInstrument
// ========================

func TestIsValidInstrument(t *testing.T) {
	valid := []string{"credit_card", "debit_card", "transfer", "cash"}
	for _, v := range valid {
		if !isValidInstrument(v) {
			t.Errorf("%q should be valid", v)
		}
	}
	if isValidInstrument("invalid") {
		t.Error("invalid should not be valid")
	}
}

// ========================
// parseInput scenarios
// ========================

func TestParseInput_KV(t *testing.T) {
	in, err := parseInput([]string{"name=Food"}, newCreateCategoryInput)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if in.Name != "Food" {
		t.Errorf("name = %q, want Food", in.Name)
	}
}

func TestParseInput_NoArgsFailsValidation(t *testing.T) {
	_, err := parseInput([]string{}, newCreateCategoryInput)
	if err == nil {
		t.Error("expected validation error with no args")
	}
}

func verifyNumberConversion(t *testing.T, val string, expected money.Money) {
	m := validCreateTxMap()
	m["amount"] = val
	in, err := newCreateTransactionInput(m)
	if err != nil {
		return
	}
	cents, err := money.ParseAmountToCents(in.Amount)
	if err != nil {
		t.Fatalf("ParseAmountToCents(%q) failed: %v", in.Amount, err)
	}
	if cents != int64(expected) {
		t.Errorf("cents = %d, want %d", cents, expected)
	}
}

func TestMoneyParsing(t *testing.T) {
	verifyNumberConversion(t, "100", money.Money(10000))
	verifyNumberConversion(t, "100.50", money.Money(10050))
	verifyNumberConversion(t, "0.01", money.Money(1))
}

// ========================
// helpers
// ========================

func equalSlice(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

// Ensure all types implement Input (compile-time check)
var _ Input = CreateTransactionInput{}
var _ Input = UpdateTransactionInput{}
var _ Input = CreateCategoryInput{}
var _ Input = UpdateCategoryInput{}
var _ Input = CreateSubcategoryInput{}
var _ Input = UpdateSubcategoryInput{}
var _ Input = CreateChannelInput{}
var _ Input = UpdateChannelInput{}
var _ Input = CreateAccountInput{}
var _ Input = UpdateAccountInput{}
var _ Input = CreateAssetInput{}
var _ Input = UpdateAssetInput{}
var _ Input = CreateHistoricalEntryInput{}
var _ Input = UpdateHistoricalEntryInput{}
var _ Input = CancelInstallmentsInput{}

