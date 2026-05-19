package money

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
)

var (
	ErrInvalidFormat = errors.New("invalid money format")
	ErrEmptyAmount   = errors.New("empty amount")
)

type Money int64

func ParseAmountToCents(input string) (int64, error) {
	input = strings.TrimSpace(input)

	if input == "" {
		return 0, ErrEmptyAmount
	}

	lastDot := strings.LastIndex(input, ".")
	lastComma := strings.LastIndex(input, ",")

	decimalSep := ""
	if lastDot > lastComma {
		decimalSep = "."
	} else if lastComma > lastDot {
		decimalSep = ","
	}

	var intPart, decPart string

	if decimalSep != "" {
		parts := strings.Split(input, decimalSep)
		if len(parts) != 2 {
			return 0, ErrInvalidFormat
		}
		intPart = parts[0]
		decPart = parts[1]
	} else {
		intPart = input
		decPart = ""
	}

	intPart = strings.ReplaceAll(intPart, ".", "")
	intPart = strings.ReplaceAll(intPart, ",", "")

	if decPart == "" {
		decPart = "00"
	} else if len(decPart) == 1 {
		decPart += "0"
	} else if len(decPart) > 2 {
		decPart = decPart[:2]
	}

	full := intPart + decPart

	return strconv.ParseInt(full, 10, 64)
}

func FormatAmount(cents int64) string {
	sign := ""
	if cents < 0 {
		sign = "-"
		cents = -cents
	}

	if cents%100 == 0 {
		return fmt.Sprintf("%s%d", sign, cents/100)
	}
	return fmt.Sprintf("%s%d.%02d", sign, cents/100, cents%100)
}

func (m *Money) USDToARS(rate float64) Money {
	return Money(math.Round(float64(*m) * rate))
}

func (m *Money) ARSToUSD(rate float64) Money {
	return Money(math.Round(float64(*m) / rate))
}

func FromCents(cents int64) Money {
	return Money(cents)
}

func FromString(s string) (Money, error) {
	cents, err := ParseAmountToCents(s)
	if err != nil {
		return 0, err
	}
	return Money(cents), nil
}

func (m Money) Cents() int64 {
	return int64(m)
}

func (m Money) String() string {
	return FormatAmount(int64(m))
}

func (m Money) IsZero() bool {
	return m == 0
}

func (m Money) IsNegative() bool {
	return m < 0
}

func (m Money) IsPositive() bool {
	return m > 0
}

func (m Money) Abs() Money {
	if m < 0 {
		return -m
	}
	return m
}

func (m Money) Add(n Money) Money {
	return m + n
}

func (m Money) Sub(n Money) Money {
	return m - n
}

func (m Money) Mul(factor int64) Money {
	return m * Money(factor)
}

func (m Money) Div(divisor int64) Money {
	if divisor == 0 {
		return 0
	}
	return m / Money(divisor)
}

func (m *Money) UnmarshalJSON(data []byte) error {
	if string(data) == "null" {
		return nil
	}

	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return fmt.Errorf("failed to unmarshal money: %w", err)
	}

	if s == "" {
		return nil
	}

	cents, err := ParseAmountToCents(s)
	if err != nil {
		return fmt.Errorf("failed to parse money: %w", err)
	}

	*m = Money(cents)
	return nil
}

func (m Money) MarshalJSON() ([]byte, error) {
	if m == 0 {
		return []byte("\"0\""), nil
	}
	return []byte(fmt.Sprintf("\"%s\"", m.String())), nil
}

func (m Money) ToFloat() float64 {
	return float64(m) / 100.0
}

func FromFloat(f float64) Money {
	return Money(math.Round(f * 100))
}

func (m *Money) Scan(src any) error {
	if src == nil {
		*m = 0
		return nil
	}

	switch v := src.(type) {
	case int64:
		*m = Money(v)
	case int:
		*m = Money(int64(v))
	case float64:
		*m = Money(math.Round(v))
	case []byte:
		parsed, err := ParseAmountToCents(string(v))
		if err != nil {
			return err
		}
		*m = Money(parsed)
	case string:
		if v == "" {
			return nil
		}
		parsed, err := ParseAmountToCents(v)
		if err != nil {
			return err
		}
		*m = Money(parsed)
	default:
		return fmt.Errorf("cannot scan type %T into Money", src)
	}

	return nil
}

func (m Money) Value() (driver.Value, error) {
	return int64(m), nil
}
