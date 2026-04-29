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

type fixedDepositRaw struct {
	Bank      string  `json:"bank"`
	Logo      string  `json:"bank_logo"`
	Tem       float64 `json:"tem"`
	Tna       float64 `json:"tna"`
	Tea       float64 `json:"tea"`
	MinTerm   int     `json:"min_term"`
	MaxTerm   int     `json:"max_term"`
	IsEnabled int     `json:"is_enabled"`
}

type FixedDepositValue struct {
	Entity        string    `json:"entity"`
	EntityLogoURL string    `json:"logo_url"`
	Slug          string    `json:"slug,omitempty"`
	Tem           float64   `json:"tem"`
	Tea           float64   `json:"tea"`
	Tna           float64   `json:"tna"`
	MinTerm       int       `json:"min_term"`
	MaxTerm       int       `json:"max_term"`
	UpdatedAt     time.Time `json:"updated_at"`
}

var fixedDepositsURL = "https://prestamos.ikiwi.net.ar/api/fixed_term_deposits"

func FetchFixedDeposits() ([]FixedDepositValue, error) {
	ctx := context.Background()
	req, err := http.NewRequestWithContext(
		ctx,
		"GET",
		fixedDepositsURL,
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
			return nil, fmt.Errorf("fixed deposits API timeout: %w", ErrTimeout)
		}
		if errors.Is(err, context.Canceled) {
			return nil, fmt.Errorf("fixed deposits API cancelled: %w", err)
		}
		return nil, fmt.Errorf("fixed deposits API network: %w", ErrNetworkError)
	}

	defer res.Body.Close()

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, fmt.Errorf("fixed deposits API HTTP %d: %w", res.StatusCode, &HTTPError{
			StatusCode: res.StatusCode,
			URL:        fixedDepositsURL,
		})
	}

	fixedDepositRaw := make([]fixedDepositRaw, 0)
	if err := json.NewDecoder(res.Body).Decode(&fixedDepositRaw); err != nil {
		return nil, fmt.Errorf("decode error: %w", err)
	}

	values := make([]FixedDepositValue, 0, len(fixedDepositRaw)-1)
	for _, fd := range fixedDepositRaw {

		updatedAt := time.Now()
		if fd.IsEnabled != 1 {
			continue
		}

		values = append(values, FixedDepositValue{
			Entity:        fd.Bank,
			EntityLogoURL: fd.Logo,
			Slug:          strings.ToLower(fd.Bank),
			Tem:           fd.Tem,
			Tea:           fd.Tea,
			Tna:           fd.Tna,
			MinTerm:       fd.MinTerm,
			MaxTerm:       fd.MaxTerm,
			UpdatedAt:     updatedAt,
		})
	}

	return values, nil
}

type FixedDepositsMap map[string]FixedDepositValue

func FixedDepositsToMap(yield []FixedDepositValue) FixedDepositsMap {
	m := make(map[string]FixedDepositValue, len(yield))

	if len(yield) == 0 {
		return m
	}
	for _, fd := range yield {
		m[fd.Slug] = fd
	}

	return m
}

func (d FixedDepositsMap) Get(entity string) (FixedDepositValue, bool) {
	v, ok := d[entity]
	return v, ok
}
