package macro

import "context"

type Service struct {
	provider *Provider
}

func NewService(provider *Provider) *Service {
	return &Service{
		provider: provider,
	}
}

func (s *Service) FetchIPC(ctx context.Context, refresh bool) (EconomicSeriesResponse, error) {
	ts, err := FetchIPCFromAPI()
	if err != nil {
		return EconomicSeriesResponse{}, err
	}

	res := BuildEconomicResponse(ts)
	return res, nil
}

func (s *Service) FetchInflation(ctx context.Context, refresh bool) (EconomicSeriesResponse, error) {
	var ts TimeSeries
	var err error

	if refresh {
		ts, err = s.provider.inflation.Refresh(ctx)
	} else {
		ts, err = s.provider.inflation.Get(ctx)
	}
	if err != nil {
		return EconomicSeriesResponse{}, err
	}

	res := BuildEconomicResponse(ts)
	return res, nil
}

func (s *Service) FetchDollarHistoric(ctx context.Context, quotation string, refresh bool) (EconomicSeriesResponse, error) {
	c := DollarQuotation(quotation)
	if !c.IsValid() {
		c = QuotationSell
	}

	var ts TimeSeries
	var err error

	if c == QuotationSell {
		if refresh {
			ts, err = s.provider.dollarSeriesSell.Refresh(ctx)
		} else {
			ts, err = s.provider.dollarSeriesSell.Get(ctx)
		}
	} else {
		if refresh {
			ts, err = s.provider.dollarSeriesBuy.Refresh(ctx)
		} else {
			ts, err = s.provider.dollarSeriesBuy.Get(ctx)
		}
	}
	if err != nil {
		return EconomicSeriesResponse{}, err
	}

	res := BuildEconomicResponse(ts)
	return res, nil
}

func (s *Service) FetchDollarCotization(ctx context.Context, refresh bool) (DollarMap, error) {
	if refresh {
		return s.provider.dollarsBankMap.Refresh(ctx)
	}
	return s.provider.dollarsBankMap.Get(ctx)
}

func (s *Service) FetchCryptoCurrency(ctx context.Context, cryptoCurrency string, refresh bool) (EconomicSeriesResponse, error) {
	c := CryptoCurrency(cryptoCurrency)
	if !c.IsValid() {
		c = CryptoUSDT
	}

	var ts TimeSeries
	var err error

	switch c {
	case CryptoBTC:
		if refresh {
			ts, err = s.provider.btcSeries.Refresh(ctx)
		} else {
			ts, err = s.provider.btcSeries.Get(ctx)
		}
	case CryptoETH:
		if refresh {
			ts, err = s.provider.ethSeries.Refresh(ctx)
		} else {
			ts, err = s.provider.ethSeries.Get(ctx)
		}
	case CryptoUSDT:
		if refresh {
			ts, err = s.provider.usdtSeries.Refresh(ctx)
		} else {
			ts, err = s.provider.usdtSeries.Get(ctx)
		}
	}
	if err != nil {
		return EconomicSeriesResponse{}, err
	}

	res := BuildEconomicResponse(ts)
	return res, nil
}

func (s *Service) FetchCountryRisk(ctx context.Context, refresh bool) (CountryRiskValue, error) {
	if refresh {
		return s.provider.countryRisk.Refresh(ctx)
	}
	return s.provider.countryRisk.Get(ctx)
}

func (s *Service) FetchFixedDeposits(ctx context.Context, refresh bool) (FixedDepositsMap, error) {
	if refresh {
		return s.provider.fixedDepositsMap.Refresh(ctx)
	}
	return s.provider.fixedDepositsMap.Get(ctx)
}

func (s *Service) FetchYieldAccounts(ctx context.Context, refresh bool) (YieldMap, error) {
	if refresh {
		return s.provider.yieldsMap.Refresh(ctx)
	}
	return s.provider.yieldsMap.Get(ctx)
}

func (s *Service) FetchLoanRates(ctx context.Context, refresh bool) (LoanMap, error) {
	if refresh {
		return s.provider.loansMap.Refresh(ctx)
	}
	return s.provider.loansMap.Get(ctx)
}
