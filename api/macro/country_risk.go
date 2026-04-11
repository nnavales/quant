package macro

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/nnavales/summit/api/timeutils"
)

var riskURL = "https://mercados.ambito.com//riesgopais/variacion-ultimo"

type riskRaw struct {
	Value     string `json:"ultimo"`
	Date      string `json:"fecha"`
	Variation string `json:"variacion"`
}

type CountryRiskValue struct {
	Date      timeutils.Date `json:"date"`
	Value     int            `json:"value"`
	Variation float64        `json:"variation"`
}

func FetchCountryRiskFromAPI() (CountryRiskValue, error) {
	ctx := context.Background()
	req, err := http.NewRequestWithContext(
		ctx,
		"GET",
		riskURL,
		nil,
	)
	if err != nil {
		return CountryRiskValue{}, err
	}

	req.Header.Set("Accept", "application/csv")

	res, err := httpClient.Do(req)
	if err != nil {
		return CountryRiskValue{}, err
	}
	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return CountryRiskValue{}, fmt.Errorf("status code isnt 200: %d", res.StatusCode)
	}

	riskRaw := riskRaw{}
	if err := json.NewDecoder(res.Body).Decode(&riskRaw); err != nil {
		return CountryRiskValue{}, fmt.Errorf("decode error: %w", err)
	}

	dateParsed, err := time.Parse("02-01-2006", riskRaw.Date)
	if err != nil {
		return CountryRiskValue{}, fmt.Errorf("parsing error: %w", err)
	}

	date := timeutils.NewDate(dateParsed)
	if err != nil {
		return CountryRiskValue{}, fmt.Errorf("parsing error: %w", err)
	}

	value, err := strconv.Atoi(riskRaw.Value)
	if err != nil {
		return CountryRiskValue{}, fmt.Errorf("parsing error: %w", err)
	}

	var variationStr = riskRaw.Variation
	variationStr = strings.ReplaceAll(variationStr, "%", "")
	variationStr = strings.ReplaceAll(variationStr, ",", ".")

	variation, err := strconv.ParseFloat(variationStr, 64)
	if err != nil {
		return CountryRiskValue{}, fmt.Errorf("parsing error: %w", err)
	}

	cr := CountryRiskValue{
		Date:      date,
		Value:     value,
		Variation: variation,
	}

	return cr, nil

}
