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

	"github.com/nnavales/quant/api/timeutils"
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

func FetchCryptoSeries(cryptoCurrency CryptoCurrency) (TimeSeries, error) {
	points, err := fetchCryptoPoints(cryptoCurrency)
	if err != nil {
		return TimeSeries{}, err
	}

	return TimeSeries{
		Name:   fmt.Sprintf("Crypto %s", cryptoCurrency),
		Unit:   "index",
		Points: points,
	}, nil
}

func fetchCryptoPoints(c CryptoCurrency) ([]TimeSeriesPoint, error) {
	ctx := context.Background()
	url, err := cryptoURL(c)
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
		var netErr net.Error
		if errors.As(err, &netErr) && netErr.Timeout() {
			return nil, fmt.Errorf("crypto API timeout: %w", ErrTimeout)
		}
		if errors.Is(err, context.Canceled) {
			return nil, fmt.Errorf("crypto API cancelled: %w", err)
		}
		return nil, fmt.Errorf("crypto API network: %w", ErrNetworkError)
	}

	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, fmt.Errorf("crypto API HTTP %d: %w", res.StatusCode, &HTTPError{
			StatusCode: res.StatusCode,
			URL:        url,
		})
	}

	var rawKlines [][]any
	if err := json.NewDecoder(res.Body).Decode(&rawKlines); err != nil {
		return nil, fmt.Errorf("decode error: %w", err)
	}

	series := make([]TimeSeriesPoint, 0)
	for _, candle := range rawKlines {
		closeTime := time.UnixMilli(int64(candle[6].(float64)))
		date := timeutils.NewDate(closeTime)
		valueStr := candle[4].(string)
		value, err := strconv.ParseFloat(valueStr, 64)
		if err != nil {
			return nil, fmt.Errorf("crypto parsing value err: %w", err)
		}
		series = append(series, TimeSeriesPoint{Date: date, Value: value})

	}

	sort.Slice(series, func(i, j int) bool {
		return series[i].Date.Before(series[j].Date.Time)
	})

	return series, nil
}
