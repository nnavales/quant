package macro

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"time"

	"github.com/nnavales/summit/api/timeutils"
)

// const (
// 	UalaBuyURL     = "https://www.uala.com.ar/api/currency/api/v1/buy-rate"
// 	UalaSellURL    = "https://www.uala.com.ar/api/currency/api/v1/sell-rate"
// 	BNAURL         = "https://api.errepar.com/syserrepar/apidolar/api/CotizacionesBNAII/day"
// 	BBVAURL        = "https://servicios.bbva.com.ar/openmarket/servicios/cotizaciones/monedaExtranjera"
// 	ProvinciaURL   = "https://www.bancoprovincia.com.ar/Principal/Dolar"
// 	BruBankURL     = "https://sheets.googleapis.com/v4/spreadsheets/1KG0uD9hojsYyRY4BltuNJByUwygHUBuo5dWdm5uIbrw/values/143BBK!A1:B1?key=AIzaSyC8EJidQr3CidEdb-1xfqS2XsHDuJeKWeA"
// 	SupervielleURL = "https://www.supervielle.com.ar/api/cotizaciones"
// 	GaliciaURL     = "https://api.comparadolar.ar/usd"
// 	NaranjaXURL    = "https://api.comparadolar.ar/usd"
// 	SantanderURL   = "https://api.comparadolar.ar/usd"
// 	CocosURL       = "https://api.comparadolar.ar/usd"
// )

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
var dollarLast = "https://api.errepar.com/syserrepar/apidolar/api/CotizacionesBNAII/last"

type dollarSeriesRaw struct {
	Buy  string `json:"billeteCompra"`
	Sell string `json:"billeteVenta"`
	Date string `json:"fecha"`
}

type DollarSeries struct {
	Date  timeutils.Date `json:"date"`
	Value float64        `json:"value"`
}

func FetchDollarHistoricSeries(c DollarQuotation) ([]DollarSeries, error) {
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
		return nil, err
	}

	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, fmt.Errorf("status code isnt 200, something went wrong with the dolarAPI: <statuscode: %d>", res.StatusCode)
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

	series := make([]DollarSeries, 0)
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
			series = append(series, DollarSeries{Date: date, Value: buy})
		case QuotationSell:
			sell, err := strconv.ParseFloat(s.Sell, 64)
			if err != nil {
				return nil, fmt.Errorf("buy parsing failed for the dollar series: %w", err)
			}
			series = append(series, DollarSeries{Date: date, Value: sell})
		default:
			return nil, fmt.Errorf("dollar series: not valid quotation")
		}
	}

	sort.Slice(series, func(i, j int) bool {
		return series[i].Date.Before(series[j].Date.Time)
	})

	return series, nil
}

func DollarToTimeSeries(data []DollarSeries, c DollarQuotation) TimeSeries {
	points := make([]TimeSeriesPoint, len(data))

	for i, v := range data {
		points[i] = TimeSeriesPoint{
			Date:  v.Date,
			Value: v.Value,
		}
	}

	cot := "venta"
	if c == QuotationBuy {
		cot = "compra"
	}

	return TimeSeries{
		Name:   fmt.Sprintf("Dolar Oficial (%s)", cot),
		Unit:   "index",
		Points: points,
	}
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

func FetchDolarCotization() ([]DollarValue, error) {
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
		return nil, err
	}

	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, fmt.Errorf("status code isnt 200, something went wrong with the dolarAPI: <statuscode: %d>", res.StatusCode)
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
