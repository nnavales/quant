package dashboard

import (
	"context"
	"fmt"
	"sort"
	"time"

	"github.com/nnavales/summit/api/timeutils"
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{
		repo: repo,
	}
}

func (s *Service) GetKPIs(ctx context.Context) (DashboardResponse, error) {
	tbl, err := s.repo.GetFinanceSummary(ctx, nil)
	if err != nil {
		return DashboardResponse{}, fmt.Errorf("failed to get finance summary: %w", err)
	}
	currentDate := time.Now()
	currentYear := currentDate.Year()
	previousYear := currentYear - 1

	var currentRows []MonthlyData
	var previousRows []MonthlyData
	var monthlySeries []MonthlyData

	for _, r := range tbl {
		monthlySeries = append(monthlySeries, rowToMonthlyData(r))
		year, month, err := timeutils.ParseYearAndMonth(r.Month)
		if err != nil {
			continue
		}

		if year == currentYear {
			currentRows = append(currentRows, rowToMonthlyData(r))
		} else if year == previousYear && month <= int(currentDate.Month()) {
			previousRows = append(previousRows, rowToMonthlyData(r))
		}
	}

	res := DashboardResponse{
		CurrentYTD:    BuildKPIs(currentRows),
		PreviousYTD:   BuildKPIs(previousRows),
		MonthlySeries: monthlySeries,
	}
	return res, nil
}

func (s *Service) GetKPIEvolution(ctx context.Context, kpi string) (KPIEvolutionResponse, error) {
	if !IsValidKPI(kpi) {
		return KPIEvolutionResponse{}, ErrInvalidKPI
	}

	tbl, err := s.repo.GetFinanceSummary(ctx, nil)
	if err != nil {
		return KPIEvolutionResponse{}, fmt.Errorf("failed to get finance summary: %w", err)
	}

	yearMap := make(map[int][]MonthlyData)

	for _, r := range tbl {
		year, err := timeutils.ParseYear(r.Month)
		if err != nil {
			continue
		}

		yearMap[year] = append(yearMap[year], rowToMonthlyData(r))
	}

	points := make([]KPIDataPoint, 0, len(yearMap))

	for year, rows := range yearMap {
		kpis := BuildKPIs(rows)
		value := extractKPI(kpis, kpi)

		points = append(points, KPIDataPoint{
			Year:  year,
			Value: value,
		})
	}

	// ordenar por año
	sort.Slice(points, func(i, j int) bool {
		return points[i].Year < points[j].Year
	})

	return KPIEvolutionResponse{
		KPI:  kpi,
		Data: points,
	}, nil
}

func (s *Service) GetDimensionSeries(ctx context.Context, dimension string, filter DimensionFilter) (DimensionSeriesResponse, error) {
	if !IsValidDimension(dimension) {
		return DimensionSeriesResponse{}, ErrInvalidDimension
	}

	tbl, err := s.repo.GetDimensionSeries(ctx, filter)
	if err != nil {
		return DimensionSeriesResponse{}, fmt.Errorf("failed to get dimension series: %w", err)
	}

	isSpecific := hasDimensionFilter(dimension, filter)

	if isSpecific {
		return buildSpecificDimensionResponse(dimension, tbl, filter)
	}

	return buildAllDimensionResponse(dimension, tbl, filter)
}

func hasDimensionFilter(dim string, filter DimensionFilter) bool {
	switch dim {
	case DimensionCategory:
		return filter.CategoryID != nil
	case DimensionSubcategory:
		return filter.SubcategoryID != nil
	case DimensionAccount:
		return filter.AccountID != nil
	case DimensionChannel:
		return filter.ChannelID != nil
	}
	return false
}

func buildSpecificDimensionResponse(dimension string, tbl []DimensionRow, filter DimensionFilter) (DimensionSeriesResponse, error) {
	var points []TimeSeriesPoint
	monthMap := make(map[string]float64)

	for _, r := range tbl {
		if matchesDimensionFilter(dimension, r, filter) {
			monthMap[r.Month] += r.Amount.ToFloat()
		}
	}

	for month, value := range monthMap {
		points = append(points, TimeSeriesPoint{
			Month: month,
			Value: value,
		})
	}

	sort.Slice(points, func(i, j int) bool {
		return points[i].Month < points[j].Month
	})

	var seriesType string
	if filter.Type != "" {
		seriesType = filter.Type
	} else {
		seriesType = "expense"
	}

	return DimensionSeriesResponse{
		Dimension: dimension,
		Type:      seriesType,
		Data: []DimensionSeries{
			{Key: getDimensionKeyName(dimension, filter), Data: points},
		},
	}, nil
}

func matchesDimensionFilter(dim string, row DimensionRow, filter DimensionFilter) bool {
	switch dim {
	case DimensionCategory:
		return filter.CategoryID != nil && row.CategoryID != nil && *filter.CategoryID == *row.CategoryID
	case DimensionSubcategory:
		return filter.SubcategoryID != nil && row.SubcategoryID != nil && *filter.SubcategoryID == *row.SubcategoryID
	case DimensionAccount:
		return filter.AccountID != nil && row.AccountID != nil && *filter.AccountID == *row.AccountID
	case DimensionChannel:
		return filter.ChannelID != nil && row.ChannelID != nil && *filter.ChannelID == *row.ChannelID
	}
	return false
}

func getDimensionKeyName(dim string, filter DimensionFilter) string {
	switch dim {
	case DimensionCategory:
		if filter.CategoryID != nil {
			return *filter.CategoryID
		}
	case DimensionSubcategory:
		if filter.SubcategoryID != nil {
			return *filter.SubcategoryID
		}
	case DimensionAccount:
		if filter.AccountID != nil {
			return *filter.AccountID
		}
	case DimensionChannel:
		if filter.ChannelID != nil {
			return *filter.ChannelID
		}
	}
	return ""
}

func buildAllDimensionResponse(dimension string, tbl []DimensionRow, filter DimensionFilter) (DimensionSeriesResponse, error) {
	keyMap := make(map[string]map[string]float64)
	compositionMap := make(map[string]map[string]map[string]float64)

	for _, r := range tbl {
		var key string
		var subKey string

		switch dimension {
		case DimensionCategory:
			key = r.CategoryName
			subKey = r.SubcategoryName
		case DimensionSubcategory:
			key = r.SubcategoryName
		case DimensionAccount:
			key = r.AccountName
		case DimensionChannel:
			key = r.ChannelName
			subKey = r.AccountName
		}

		if key == "" {
			key = "Sin asignar"
		}

		if keyMap[key] == nil {
			keyMap[key] = make(map[string]float64)
		}

		keyMap[key][r.Month] += r.Amount.ToFloat()

		if (dimension == DimensionCategory || dimension == DimensionChannel) && subKey != "" {
			if compositionMap[key] == nil {
				compositionMap[key] = make(map[string]map[string]float64)
			}
			if compositionMap[key][r.Month] == nil {
				compositionMap[key][r.Month] = make(map[string]float64)
			}
			compositionMap[key][r.Month][subKey] += r.Amount.ToFloat()
		}
	}

	data := make([]DimensionSeries, 0, len(keyMap))
	for key, monthData := range keyMap {
		points := make([]TimeSeriesPoint, 0)
		for month, value := range monthData {
			point := TimeSeriesPoint{
				Month: month,
				Value: value,
			}

			if compByMonth, ok := compositionMap[key]; ok {
				if subByMonth, ok := compByMonth[month]; ok {
					compositions := make([]Composition, 0, len(subByMonth))
					for subKey, subValue := range subByMonth {
						compositions = append(compositions, Composition{
							Key:   subKey,
							Value: subValue,
						})
					}
					point.Composition = compositions
				}
			}

			points = append(points, point)
		}

		sort.Slice(points, func(i, j int) bool {
			return points[i].Month < points[j].Month
		})

		data = append(data, DimensionSeries{
			Key:  key,
			Data: points,
		})
	}

	sort.Slice(data, func(i, j int) bool {
		return data[i].Key < data[j].Key
	})

	var seriesType string
	if filter.Type != "" {
		seriesType = filter.Type
	} else {
		seriesType = "expense"
	}

	return DimensionSeriesResponse{
		Dimension: dimension,
		Type:      seriesType,
		Data:      data,
	}, nil
}
