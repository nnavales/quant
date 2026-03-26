package timeutils

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"time"
)

type TimeOfDay struct {
	Hour   int
	Minute int
	Second int
}

func (t TimeOfDay) Validate() error {
	if t.Hour < 0 || t.Hour > 23 {
		return errors.New("invalid hour")
	}
	if t.Minute < 0 || t.Minute > 59 {
		return errors.New("invalid minute")
	}
	if t.Second < 0 || t.Second > 59 {
		return errors.New("invalid second")
	}
	return nil
}

func ParseTimeOfDay(s string) (TimeOfDay, error) {
	parsed, err := time.Parse("15:04:05", s)
	if err != nil {
		return TimeOfDay{}, err
	}
	return TimeOfDay{
		Hour:   parsed.Hour(),
		Minute: parsed.Minute(),
		Second: parsed.Second(),
	}, nil
}

func (t TimeOfDay) String() string {
	return fmt.Sprintf("%02d:%02d:%02d", t.Hour, t.Minute, t.Second)
}

// JSON
func (t TimeOfDay) MarshalJSON() ([]byte, error) {
	return json.Marshal(t.String())
}

func (t *TimeOfDay) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}
	parsed, err := ParseTimeOfDay(s)
	if err != nil {
		return err
	}
	*t = parsed
	return nil
}

// SQLite (TEXT)
func (t TimeOfDay) Value() (driver.Value, error) {
	return t.String(), nil
}

func (t *TimeOfDay) Scan(value any) error {
	s, ok := value.(string)
	if !ok {
		return fmt.Errorf("invalid TimeOfDay type")
	}
	parsed, err := ParseTimeOfDay(s)
	if err != nil {
		return err
	}
	*t = parsed
	return nil
}
