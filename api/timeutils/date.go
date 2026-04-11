package timeutils

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

type Date struct {
	time.Time
}

func NewDate(t time.Time) Date {
	y, m, d := t.Date()
	return Date{
		Time: time.Date(y, m, d, 0, 0, 0, 0, time.UTC),
	}
}

func (d Date) AddMonths(n int) (Date, error) {
	t, err := time.Parse("2006-01-02", d.String())
	if err != nil {
		return Date{}, err
	}

	t = t.AddDate(0, n, 0)

	return NewDate(t), nil
}

func ParseDate(s string) (Date, error) {
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return Date{}, err
	}
	return NewDate(t), nil
}

func ParseDateFromTime(s string) (Date, error) {
	if i := strings.Index(s, "T"); i != -1 {
		s = s[:i]
	}

	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return Date{}, err
	}
	return NewDate(t), nil
}

func (d Date) String() string {
	return d.Format("2006-01-02")
}

// JSON
func (d Date) MarshalJSON() ([]byte, error) {
	return json.Marshal(d.String())
}

func (d *Date) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}
	parsed, err := ParseDate(s)
	if err != nil {
		return err
	}
	*d = parsed
	return nil
}

// SQLite
func (d Date) Value() (driver.Value, error) {
	return d.String(), nil
}

func (d *Date) Scan(value any) error {
	s, ok := value.(string)
	if !ok {
		return fmt.Errorf("invalid date type")
	}
	parsed, err := ParseDate(s)
	if err != nil {
		return err
	}
	*d = parsed
	return nil
}

func IsSameOrBeforeMonth(a, b time.Time) bool {
	ay, am, _ := a.Date()
	by, bm, _ := b.Date()

	return ay < by || (ay == by && am <= bm)
}

func IsSameOrAfterMonth(a, b time.Time) bool {
	ay, am, _ := a.Date()
	by, bm, _ := b.Date()

	return ay > by || (ay == by && am >= bm)
}
