package finance

import (
	"fmt"
	"math"
	"strconv"
	"strings"
)

func ParseAmountToCents(input string) (int64, error) {
	input = strings.TrimSpace(input)

	if input == "" {
		return 0, fmt.Errorf("empty amount")
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
			return 0, fmt.Errorf("invalid amount format")
		}
		intPart = parts[0]
		decPart = parts[1]
	} else {
		intPart = input
		decPart = ""
	}

	intPart = strings.ReplaceAll(intPart, ".", "")
	intPart = strings.ReplaceAll(intPart, ",", "")

	// Normalize decimals
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

func USDToARS(usdCents int64, rate float64) int64 {
	return int64(math.Round(float64(usdCents) * rate))
}

func ARSToUSD(arsCents int64, rate float64) int64 {
	return int64(math.Round(float64(arsCents) / rate))
}
