package timeutils

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

type Weekday time.Weekday

func ParseWeekday(day string) (Weekday, error) {
	switch strings.ToLower(day) {
	case "sunday":
		return Weekday(time.Sunday), nil
	case "monday":
		return Weekday(time.Monday), nil
	case "tuesday":
		return Weekday(time.Tuesday), nil
	case "wednesday":
		return Weekday(time.Wednesday), nil
	case "thursday":
		return Weekday(time.Thursday), nil
	case "friday":
		return Weekday(time.Friday), nil
	case "saturday":
		return Weekday(time.Saturday), nil
	default:
		return 0, fmt.Errorf("invalid weekday: %s", day)
	}
}

func ParseWeekdays(days []string) ([]Weekday, error) {
	result := make([]Weekday, len(days))
	for i, day := range days {
		parsed, err := ParseWeekday(day)
		if err != nil {
			return nil, err
		}
		result[i] = parsed
	}
	return result, nil
}

func (w Weekday) String() string {
	return strings.ToLower(time.Weekday(w).String())
}

func (w Weekday) MarshalJSON() ([]byte, error) {
	return json.Marshal(w.String())
}

func (w *Weekday) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}
	parsed, err := ParseWeekday(s)
	if err != nil {
		return err
	}
	*w = parsed
	return nil
}

// SQLite support
func (w Weekday) Value() (driver.Value, error) {
	return int64(w), nil
}

func (w *Weekday) Scan(value any) error {
	v, ok := value.(int64)
	if !ok {
		return fmt.Errorf("invalid weekday type")
	}
	*w = Weekday(v)
	return nil
}

type Weekdays []Weekday

func (w Weekdays) Value() (driver.Value, error) {
	data, err := json.Marshal(w)
	if err != nil {
		return nil, err
	}
	return string(data), nil
}

func (w *Weekdays) Scan(value any) error {
	if value == nil {
		*w = nil
		return nil
	}

	var data []byte

	switch v := value.(type) {
	case string:
		data = []byte(v)
	case []byte:
		data = v
	default:
		return fmt.Errorf("invalid type for weekdays: %T", value)
	}

	return json.Unmarshal(data, w)
}
