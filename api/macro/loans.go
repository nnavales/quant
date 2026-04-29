package macro

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"
)

var loanURL = "https://api.argentinadatos.com/v1/finanzas/creditos/hipotecariosUva/"

type loanRaw struct {
	Entity        string  `json:"entidad"`
	ComercialName string  `json:"nombreComercial"`
	TNA           float64 `json:"tna"`
}

type LoanValue struct {
	Entity    string    `json:"entity"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug,omitempty"`
	TNA       float64   `json:"tna"`
	UpdatedAt time.Time `json:"updated_at"`
}

func FetchLoans() ([]LoanValue, error) {
	ctx := context.Background()
	req, err := http.NewRequestWithContext(
		ctx,
		"GET",
		loanURL,
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
			return nil, fmt.Errorf("loans API timeout: %w", ErrTimeout)
		}
		if errors.Is(err, context.Canceled) {
			return nil, fmt.Errorf("loans API cancelled: %w", err)
		}
		return nil, fmt.Errorf("loans API network: %w", ErrNetworkError)
	}

	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, fmt.Errorf("loans API HTTP %d: %w", res.StatusCode, &HTTPError{
			StatusCode: res.StatusCode,
			URL:        loanURL,
		})
	}

	loanRaw := make([]loanRaw, 0)
	if err := json.NewDecoder(res.Body).Decode(&loanRaw); err != nil {
		return nil, fmt.Errorf("decode error: %w", err)
	}

	values := make([]LoanValue, 0, len(loanRaw)-1)
	for _, l := range loanRaw {
		updatedAt := time.Now()
		values = append(values, LoanValue{
			Entity:    l.Entity,
			Name:      l.ComercialName,
			Slug:      strings.ToLower(l.ComercialName),
			TNA:       l.TNA,
			UpdatedAt: updatedAt,
		})
	}

	return values, nil
}

type LoanMap map[string]LoanValue

func LoanToMap(loans []LoanValue) LoanMap {
	m := make(map[string]LoanValue, len(loans))
	for _, l := range loans {
		m[l.Slug] = l
	}

	return m
}

func (l LoanMap) Get(entity string) (LoanValue, bool) {
	v, ok := l[entity]
	return v, ok
}
