package dashboard

import "context"

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{
		repo: repo,
	}
}

func (s *Service) GetKPIs(ctx context.Context) (KPIResponse, error) {
	tbl, err := s.repo.GetFinanceSummary(ctx, nil)
	if err != nil {
		return KPIResponse{}, nil
	}

	KPIRes := BuildKPIs(tbl)
	return KPIRes, nil
}
