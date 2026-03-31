package macro

// Plazos fijos - FCI - Cuentas remuneradas - Crypto
// Actividad economica
// galicia plazo fijo (tna):  https://www.galicia.ar/services/plazofijo body {currencyCode: "01", channel: "HB", amount: 112312, term: 30}
// bbvva plazo fijo: https://www.bbva.com.ar/openmarket/servicios/plazoFijo/simularIndividuo  body {plazo: "30", monto: 10000, fechaHasta: "29/04/2026", cliente: "si", moneda: "pesos"}
// bna plazo fijo:  https://www.bna.com.ar/SimuladorPlazoFijo/_CalcularPlazoFijo formdata personaFisica=true&cantidadTitulares=1&capital=123123&plazoEnDias=30 (devuelve html)
// bapro plazo fijo https://www.bancoprovincia.com.ar/plazofijo/SimularPlazoFijoConvenio {"lista":[{"nombre":"dias","tipo":"dias","valor":"30"},{"nombre":"monto","tipo":"monto","valor":"1000"},{"nombre":"tipo","tipo":"tipo","valor":"COMUN"},{"nombre":"convenio","tipo":"convenio","valor":""}]}
// falta santander / uala

// plazo fijo  https://prestamos.ikiwi.net.ar/api/fixed_term_deposits
// plazo fijo general https://api.argentinadatos.com/v1/finanzas/tasas/plazoFijo
// creditos hipotecarios https://api.argentinadatos.com/v1/finanzas/creditos/hipotecariosUva/
// cuentas remuneradas usd:  https://api.argentinadatos.com/v1/finanzas/cuentas-remuneradas-usd/
// cuentas remuneradas:  https://prestamos.ikiwi.net.ar/api/paid_accounts
// rendimientos?  https://api.argentinadatos.com/v1/finanzas/fci/otros/ultimo

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type yieldRaw struct {
	Bank       string  `json:"bank"`
	Conditions string  `json:"conditions"`
	Limit      float64 `json:"limit"`

	Logo      string  `json:"img"`
	Tem       float64 `json:"tem"`
	Tna       float64 `json:"tna"`
	Tea       float64 `json:"tea"`
	DailyRate float64 `json:"daily_rate"`

	IsFund        int `json:"is_fund"`
	IsEnabled     int `json:"is_enabled"`
	IsBusinessAcc int `json:"is_business_account"`
}

type YieldValue struct {
	Entity        string `json:"entity"`
	EntityLogoURL string `json:"logo_url"`
	Slug          string `json:"slug,omitempty"`
	Conditions    string `json:"conditions"`

	Tem       float64 `json:"tem"`
	Tea       float64 `json:"tea"`
	Tna       float64 `json:"tna"`
	DailyRate float64 `json:"daily_rate"`
	Limit     float64 `json:"limit"`

	UpdatedAt time.Time `json:"updated_at"`
}

var yieldAccountsURL = "https://prestamos.ikiwi.net.ar/api/paid_accounts"

func FetchYieldAccounts() ([]YieldValue, error) {
	ctx := context.Background()
	req, err := http.NewRequestWithContext(
		ctx,
		"GET",
		yieldAccountsURL,
		nil,
	)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Accept", "application/json")

	res, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}

	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, fmt.Errorf("status code isnt 200, something went wrong with the dolarAPI: <statuscode: %d>", res.StatusCode)
	}

	yieldRaw := make([]yieldRaw, 0)
	if err := json.NewDecoder(res.Body).Decode(&yieldRaw); err != nil {
		return nil, fmt.Errorf("decode error: %w", err)
	}

	values := make([]YieldValue, 0, len(yieldRaw)-1)
	for _, y := range yieldRaw {

		updatedAt := time.Now()
		if y.IsEnabled != 1 {
			continue
		}

		values = append(values, YieldValue{
			Entity:        y.Bank,
			EntityLogoURL: y.Logo,
			Slug:          strings.ToLower(y.Bank),
			Tem:           y.Tem,
			Tea:           y.Tea,
			Tna:           y.Tna,
			Conditions:    y.Conditions,
			DailyRate:     y.DailyRate,
			Limit:         y.Limit,
			UpdatedAt:     updatedAt,
		})
	}

	return values, nil
}

type YieldMap map[string]YieldValue

func YieldToMap(yield []YieldValue) YieldMap {
	m := make(map[string]YieldValue, len(yield))

	if len(yield) == 0 {
		return m
	}
	for _, y := range yield {
		m[y.Slug] = y
	}

	return m
}

func (d YieldMap) Get(entity string) (YieldValue, bool) {
	v, ok := d[entity]
	return v, ok
}
