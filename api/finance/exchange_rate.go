package finance

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

var url = "https://api.comparadolar.ar/usd"

type Dolar struct {
	Type      string    `json:"casa"`
	Buy       float64   `json:"compra"`
	Sell      float64   `json:"venta"`
	UpdatedAt time.Time `json:"fechaActualizacion"`
}

type Rate struct {
	Type      RateType  `json:"type"`
	Buy       float64   `json:"buy"`
	Sell      float64   `json:"sell"`
	UpdatedAt time.Time `json:"updated_at"`
}

func ToRateSlice(dolars []Dolar) []Rate {
	r := make([]Rate, 0)

	for _, d := range dolars {
		rate := Rate{
			Type:      RateType(d.Type),
			Buy:       d.Buy,
			Sell:      d.Sell,
			UpdatedAt: d.UpdatedAt,
		}

		r = append(r, rate)

	}
	return r
}

func ToRateMap(dolars []Dolar) Rates {
	m := make(map[RateType]Rate, len(dolars))

	for _, d := range dolars {
		if d.Type == "" {
			continue
		}

		t := RateType(d.Type)
		m[t] = Rate{
			Type:      t,
			Buy:       d.Buy,
			Sell:      d.Sell,
			UpdatedAt: d.UpdatedAt,
		}
	}

	return m
}

type RateType string

const (
	RateOficial RateType = "oficial"
	RateBlue    RateType = "blue"
	RateBolsa   RateType = "bolsa"
	RateCCL     RateType = "contadoconliqui"
	RateCripto  RateType = "cripto"
	RateTarjeta RateType = "tarjeta"
)

type Rates map[RateType]Rate

func (r Rates) Get(t RateType) (Rate, bool) {
	v, ok := r[t]
	return v, ok
}

var httpClient = &http.Client{
	Timeout: 30 * time.Second,
}

func GetExchangeRate() ([]Dolar, error) {
	ctx := context.Background()

	req, err := http.NewRequestWithContext(
		ctx,
		"GET",
		"https://dolarapi.com/v1/dolares",
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

	if res.StatusCode != 200 {
		return nil, fmt.Errorf("status code isnt 200, something went wrong with the dolarAPI: <statuscode: %d>", res.StatusCode)
	}

	var rates []Dolar
	if err := json.NewDecoder(res.Body).Decode(&rates); err != nil {
		return nil, fmt.Errorf("decode error: %w", err)
	}

	return rates, nil
}
