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

type CryptoCurrency string

const (
	CryptoBTC  CryptoCurrency = "btc"
	CryptoUSDT CryptoCurrency = "usdt"
	CryptoETH  CryptoCurrency = "eth"
)

func (c CryptoCurrency) IsValid() bool {
	switch c {
	case CryptoBTC, CryptoETH, CryptoUSDT:
		return true
	}
	return false
}

type CryptoSeries struct {
	Date  timeutils.Date `json:"date"`
	Value float64        `json:"value"`
}

func cryptoURL(c CryptoCurrency) (string, error) {
	switch c {
	case CryptoBTC:
		return fmt.Sprintf("https://api.binance.com/api/v3/klines?symbol=%s&interval=1d&limit=30", "BTCUSDT"), nil
	case CryptoETH:
		return fmt.Sprintf("https://api.binance.com/api/v3/klines?symbol=%s&interval=1d&limit=30", "ETHUSDT"), nil
	case CryptoUSDT:
		return fmt.Sprintf("https://api.binance.com/api/v3/klines?symbol=%s&interval=1d&limit=30", "USDTARS"), nil
	default:
		return "", fmt.Errorf("invalid cryptocurrency")
	}
}

func FetchCryptoSeries(cryptoCurrency CryptoCurrency) ([]CryptoSeries, error) {
	ctx := context.Background()
	url, err := cryptoURL(cryptoCurrency)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(
		ctx,
		"GET",
		url,
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

	var rawKlines [][]interface{}
	if err := json.NewDecoder(res.Body).Decode(&rawKlines); err != nil {
		return nil, fmt.Errorf("decode error: %w", err)
	}

	series := make([]CryptoSeries, 0)
	for _, candle := range rawKlines {
		openTime := time.UnixMilli(int64(candle[0].(float64)))
		date := timeutils.NewDate(openTime)
		valueStr := candle[4].(string)
		value, err := strconv.ParseFloat(valueStr, 64)
		if err != nil {
			return nil, fmt.Errorf("crypto parsing value err: %w", err)
		}
		series = append(series, CryptoSeries{Date: date, Value: value})

	}

	sort.Slice(series, func(i, j int) bool {
		return series[i].Date.Before(series[j].Date.Time)
	})

	return series, nil
}

func CryptoToTimeSeries(data []CryptoSeries, c CryptoCurrency) TimeSeries {
	points := make([]TimeSeriesPoint, len(data))

	for i, v := range data {
		points[i] = TimeSeriesPoint{
			Date:  v.Date,
			Value: v.Value,
		}
	}

	return TimeSeries{
		Name:   fmt.Sprintf("Crypto %s", c),
		Unit:   "index",
		Points: points,
	}
}
