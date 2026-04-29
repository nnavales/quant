package macro

import (
	"errors"
	"fmt"
	"net"
	"net/http"
	"time"

	"github.com/nnavales/summit/api/timeutils"
)

type HTTPError struct {
	StatusCode int
	URL        string
}

func (e *HTTPError) Error() string {
	return fmt.Sprintf("HTTP %d: %s", e.StatusCode, e.URL)
}

var httpClient = &http.Client{
	Timeout: 10 * time.Second,
	Transport: &http.Transport{
		DialContext: (&net.Dialer{
			Timeout: 1 * time.Second,
		}).DialContext,
		ResponseHeaderTimeout: 4 * time.Second,
	},
}

var (
	ErrThirdParty   = errors.New("third party error")
	ErrNetworkError = errors.New("network error")
	ErrTimeout      = errors.New("timeout")
	ErrBadRequest   = errors.New("bad request")
)

// For dashboard
type TimeSeriesPoint struct {
	Date  timeutils.Date `json:"date"`
	Value float64        `json:"value"`
}

type TimeSeries struct {
	Name   string            `json:"name"` // "IPC", "Inflación mensual", "Dólar blue"
	Unit   string            `json:"unit"` // "%", "ARS", "index"
	Points []TimeSeriesPoint `json:"points"`
}

type TimeSeriesDelta struct {
	Diff float64 `json:"diff"`
	Pct  float64 `json:"pct"`
}

type EconomicSeriesResponse struct {
	Series TimeSeries       `json:"series"`
	Last   *TimeSeriesPoint `json:"last,omitempty"`
	Delta  *TimeSeriesDelta `json:"delta,omitempty"`
}

func BuildEconomicResponse(series TimeSeries) EconomicSeriesResponse {
	var last *TimeSeriesPoint
	var delta *TimeSeriesDelta

	if len(series.Points) > 0 {
		last = &series.Points[len(series.Points)-1]
	}

	if len(series.Points) > 1 {
		prev := series.Points[len(series.Points)-2]
		curr := series.Points[len(series.Points)-1]

		diff := curr.Value - prev.Value
		pct := (diff / prev.Value) * 100

		delta = &TimeSeriesDelta{
			Diff: diff,
			Pct:  pct,
		}
	}

	return EconomicSeriesResponse{
		Series: series,
		Last:   last,
		Delta:  delta,
	}
}
