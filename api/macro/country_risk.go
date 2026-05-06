package macro

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/nnavales/quant/api/timeutils"
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
		var netErr net.Error
		if errors.As(err, &netErr) && netErr.Timeout() {
			return CountryRiskValue{}, fmt.Errorf("country_risk API timeout: %w", ErrTimeout)
		}
		if errors.Is(err, context.Canceled) {
			return CountryRiskValue{}, fmt.Errorf("country_risk API cancelled: %w", err)
		}
		return CountryRiskValue{}, fmt.Errorf("country_risk API network: %w", ErrNetworkError)
	}

	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return CountryRiskValue{}, fmt.Errorf("country_risk API HTTP %d: %w", res.StatusCode, &HTTPError{
			StatusCode: res.StatusCode,
			URL:        riskURL,
		})
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
