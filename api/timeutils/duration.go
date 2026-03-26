package timeutils

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

type Duration struct {
	time.Duration
}

func FromSeconds(sec int) Duration {
	return Duration{Duration: time.Duration(sec) * time.Second}
}

func (d Duration) Seconds() int {
	return int(d.Duration.Seconds())
}

// JSON (segundos)
func (d Duration) MarshalJSON() ([]byte, error) {
	return json.Marshal(d.Seconds())
}

func (d *Duration) UnmarshalJSON(data []byte) error {
	var sec int
	if err := json.Unmarshal(data, &sec); err != nil {
		return err
	}
	d.Duration = time.Duration(sec) * time.Second
	return nil
}

// SQLite (INTEGER)
func (d Duration) Value() (driver.Value, error) {
	return int64(d.Seconds()), nil
}

func (d *Duration) Scan(value any) error {
	v, ok := value.(int64)
	if !ok {
		return fmt.Errorf("invalid duration type")
	}
	d.Duration = time.Duration(v) * time.Second
	return nil
}
