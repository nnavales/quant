package macro

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"sort"
	"strconv"
	"time"

	"github.com/nnavales/summit/api/timeutils"
)

type DollarType string

type DollarQuotation string

const (
	QuotationBuy  DollarQuotation = "buy"
	QuotationSell DollarQuotation = "sell"
)

func (q DollarQuotation) IsValid() bool {
	switch q {
	case QuotationBuy, QuotationSell:
		return true
	}
	return false
}

var dollarURL = "https://api.comparadolar.ar/usd"
var dollarMonthURL = "https://api.errepar.com/syserrepar/apidolar/api/CotizacionesBNAII/month"

// var dollarLast = "https://api.errepar.com/syserrepar/apidolar/api/CotizacionesBNAII/last"

type dollarSeriesRaw struct {
	Buy  string `json:"billeteCompra"`
	Sell string `json:"billeteVenta"`
	Date string `json:"fecha"`
}

func FetchDollarHistoricSeries(c DollarQuotation) (TimeSeries, error) {
	points, err := fetchDollarHistoricPoints(c)
	if err != nil {
		return TimeSeries{}, err
	}

	cot := "venta"
	if c == QuotationBuy {
		cot = "compra"
	}

	return TimeSeries{
		Name:   fmt.Sprintf("Dolar Oficial (%s)", cot),
		Unit:   "index",
		Points: points,
	}, nil
}

func fetchDollarHistoricPoints(c DollarQuotation) ([]TimeSeriesPoint, error) {
	ctx := context.Background()

	req, err := http.NewRequestWithContext(
		ctx,
		"GET",
		dollarMonthURL,
		nil,
	)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Accept", "application/json")

	res, err := httpClient.Do(req)
	if err != nil {
		var netErr net.Error
		if errors.As(err, &netErr) && netErr.Timeout() {
			return nil, fmt.Errorf("dollar historic API timeout: %w", ErrTimeout)
		}
		if errors.Is(err, context.Canceled) {
			return nil, fmt.Errorf("dollar historic API cancelled: %w", err)
		}
		return nil, fmt.Errorf("dollar historic API network: %w", ErrNetworkError)
	}

	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, fmt.Errorf("dollar historic API HTTP %d: %w", res.StatusCode, &HTTPError{
			StatusCode: res.StatusCode,
			URL:        dollarMonthURL,
		})
	}

	seriesRaw := make([]dollarSeriesRaw, 0)
	data := struct {
		Data []dollarSeriesRaw `json:"data"`
	}{
		Data: seriesRaw,
	}

	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("decode error: %w", err)
	}

	series := make([]TimeSeriesPoint, 0)
	for _, s := range data.Data {
		date, err := timeutils.ParseDateFromTime(s.Date)
		if err != nil {
			return nil, fmt.Errorf("date parsing failed for the dollar series: %w", err)
		}

		switch c {
		case QuotationBuy:
			buy, err := strconv.ParseFloat(s.Buy, 64)
			if err != nil {
				return nil, fmt.Errorf("buy parsing failed for the dollar series: %w", err)
			}
			series = append(series, TimeSeriesPoint{Date: date, Value: buy})
		case QuotationSell:
			sell, err := strconv.ParseFloat(s.Sell, 64)
			if err != nil {
				return nil, fmt.Errorf("buy parsing failed for the dollar series: %w", err)
			}
			series = append(series, TimeSeriesPoint{Date: date, Value: sell})
		default:
			return nil, fmt.Errorf("dollar series: not valid quotation")
		}
	}

	sort.Slice(series, func(i, j int) bool {
		return series[i].Date.Before(series[j].Date.Time)
	})

	return series, nil
}

type dollarRaw struct {
	Name      string  `json:"prettyName"`
	Slug      string  `json:"slug"`
	Buy       float64 `json:"bid"`
	Sell      float64 `json:"ask"`
	LogoURL   string  `json:"logoUrl"`
	Variation float64 `json:"pct_variation"`
	IsBank    bool    `json:"isBank"`
}

type DollarValue struct {
	Entity        string    `json:"entity"`
	Slug          string    `json:"slug,omitempty"`
	EntityLogoURL string    `json:"logo_url"`
	Buy           float64   `json:"buy"`
	Sell          float64   `json:"sell"`
	PCTVariation  float64   `json:"pct_variation"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func FetchDollarCotization() ([]DollarValue, error) {
	ctx := context.Background()
	req, err := http.NewRequestWithContext(
		ctx,
		"GET",
		dollarURL,
		nil,
	)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Accept", "application/json")

	res, err := httpClient.Do(req)
	if err != nil {
		var netErr net.Error
		if errors.As(err, &netErr) && netErr.Timeout() {
			return nil, fmt.Errorf("dollar cotization API timeout: %w", ErrTimeout)
		}
		if errors.Is(err, context.Canceled) {
			return nil, fmt.Errorf("dollar cotization API cancelled: %w", err)
		}
		return nil, fmt.Errorf("dollar cotization API network: %w", ErrNetworkError)
	}

	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, fmt.Errorf("dollar cotization API HTTP %d: %w", res.StatusCode, &HTTPError{
			StatusCode: res.StatusCode,
			URL:        dollarURL,
		})
	}

	dollarRaw := make([]dollarRaw, 0)
	if err := json.NewDecoder(res.Body).Decode(&dollarRaw); err != nil {
		return nil, fmt.Errorf("decode error: %w", err)
	}

	values := make([]DollarValue, 0, len(dollarRaw)-1)
	for _, d := range dollarRaw {
		if d.Name == "" || d.Buy <= 0 || d.Sell <= 0 {
			continue
		}
		updatedAt := time.Now()
		values = append(values, DollarValue{
			Entity:        d.Name,
			Buy:           d.Buy,
			Sell:          d.Sell,
			EntityLogoURL: d.LogoURL,
			PCTVariation:  d.Variation,
			Slug:          d.Slug,
			UpdatedAt:     updatedAt,
		})
	}

	return values, nil
}

type DollarMap map[string]DollarValue

func DollarCotizationToMap(dolars []DollarValue) DollarMap {
	m := make(map[string]DollarValue, len(dolars))

	mids := make([]float64, 0, len(dolars))
	for _, d := range dolars {
		if d.Buy > 0 && d.Sell > 0 {
			mids = append(mids, (d.Buy+d.Sell)/2)
		}
	}

	if len(mids) == 0 {
		return m
	}

	sort.Float64s(mids)

	var median float64
	n := len(mids)
	if n%2 == 1 {
		median = mids[n/2]
	} else {
		median = (mids[n/2-1] + mids[n/2]) / 2
	}

	for _, d := range dolars {
		if d.Entity == "" || d.Slug == "" {
			continue
		}
		if d.Buy <= 0 || d.Sell <= 0 {
			continue
		}

		mid := (d.Buy + d.Sell) / 2

		if mid < median*0.5 || mid > median*1.5 {
			continue
		}

		m[d.Slug] = d
	}

	return m
}

func (d DollarMap) Get(entity string) (DollarValue, bool) {
	v, ok := d[entity]
	return v, ok
}
