package timeutils

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

type YearMonth struct {
	time.Time
}

func NewYearMonth(year int, month time.Month) YearMonth {
	return YearMonth{
		Time: time.Date(year, month, 1, 0, 0, 0, 0, time.UTC),
	}
}

func ParseYearMonth(s string) (YearMonth, error) {
	t, err := time.Parse("2006-01", s)
	if err != nil {
		return YearMonth{}, fmt.Errorf("invalid year-month format %q, expected YYYY-MM: %w", s, err)
	}
	return YearMonth{Time: t}, nil
}

func (ym YearMonth) Year() int {
	return ym.Time.Year()
}

func (ym YearMonth) Month() time.Month {
	return ym.Time.Month()
}

func (ym YearMonth) String() string {
	return ym.Format("2006-01")
}

func (ym YearMonth) IsZero() bool {
	return ym.Time.IsZero()
}

func (ym YearMonth) MarshalJSON() ([]byte, error) {
	return json.Marshal(ym.String())
}

func (ym *YearMonth) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}
	parsed, err := ParseYearMonth(s)
	if err != nil {
		return err
	}
	*ym = parsed
	return nil
}

func (ym YearMonth) Value() (driver.Value, error) {
	return ym.String(), nil
}

func (ym *YearMonth) Scan(value any) error {
	if value == nil {
		return fmt.Errorf("cannot scan nil into YearMonth")
	}
	s, ok := value.(string)
	if !ok {
		b, ok := value.([]byte)
		if !ok {
			return fmt.Errorf("cannot scan type %T into YearMonth", value)
		}
		s = string(b)
	}
	s = strings.TrimSpace(s)
	parsed, err := ParseYearMonth(s)
	if err != nil {
		return err
	}
	*ym = parsed
	return nil
}
