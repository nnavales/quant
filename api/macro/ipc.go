package macro

import (
	"context"
	"encoding/csv"
	"errors"
	"fmt"
	"net"
	"net/http"
	"sort"
	"strconv"

	"github.com/nnavales/quant/api/timeutils"
)

func FetchIPCFromAPI() (TimeSeries, error) {
	points, err := fetchIPCPoints()
	if err != nil {
		return TimeSeries{}, err
	}

	return TimeSeries{
		Name:   "IPC",
		Unit:   "index",
		Points: points,
	}, nil
}

func fetchIPCPoints() ([]TimeSeriesPoint, error) {
	ctx := context.Background()
	ipcURL := "https://infra.datos.gob.ar/catalog/sspm/dataset/145/distribution/145.3/download/indice-precios-al-consumidor-nivel-general-base-diciembre-2016-mensual.csv"

	req, err := http.NewRequestWithContext(
		ctx,
		"GET",
		ipcURL,
		nil,
	)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Accept", "application/csv")

	res, err := httpClient.Do(req)
	if err != nil {
		var netErr net.Error
		if errors.As(err, &netErr) && netErr.Timeout() {
			return nil, fmt.Errorf("IPC API timeout: %w", ErrTimeout)
		}
		if errors.Is(err, context.Canceled) {
			return nil, fmt.Errorf("IPC API cancelled: %w", err)
		}
		return nil, fmt.Errorf("IPC API network: %w", ErrNetworkError)
	}
	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, fmt.Errorf("IPC API HTTP %d: %w", res.StatusCode, &HTTPError{
			StatusCode: res.StatusCode,
			URL:        ipcURL,
		})
	}

	records, err := csv.NewReader(res.Body).ReadAll()
	if err != nil {
		return nil, fmt.Errorf("decode error: %w", err)
	}

	series := make([]TimeSeriesPoint, 0, len(records)-1)
	for i, record := range records {
		if i == 0 {
			continue
		}

		if len(record) < 2 {
			continue
		}

		val, err := strconv.ParseFloat(record[1], 64)
		if err != nil {
			return nil, fmt.Errorf("invalid value format")
		}

		date, err := timeutils.ParseDate(record[0])
		if err != nil {
			return nil, fmt.Errorf("date parse error: %w", err)
		}

		series = append(series, TimeSeriesPoint{
			Date:  date,
			Value: val,
		})
	}

	sort.Slice(series, func(i, j int) bool {
		return series[i].Date.Before(series[j].Date.Time)
	})

	return series, nil
}

func IPCToTimeSeries(data []TimeSeriesPoint) TimeSeries {
	points := make([]TimeSeriesPoint, len(data))

	for i, v := range data {
		points[i] = TimeSeriesPoint{
			Date:  v.Date,
			Value: v.Value,
		}
	}

	return TimeSeries{
		Name:   "IPC",
		Unit:   "index",
		Points: points,
	}
}

func IPCToInflationSeries(data []TimeSeriesPoint) TimeSeries {
	points := make([]TimeSeriesPoint, 0, len(data)-1)
	for i := 1; i < len(data); i++ {
		prev := data[i-1]
		curr := data[i]

		pct := (curr.Value - prev.Value) / prev.Value * 100

		points = append(points, TimeSeriesPoint{
			Date:  curr.Date,
			Value: pct,
		})
	}

	return TimeSeries{
		Name:   "Inflación mensual",
		Unit:   "%",
		Points: points,
	}
}
