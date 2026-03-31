package macro

type Service struct{}

func NewService() *Service {
	return &Service{}
}

func (s *Service) FetchIPC() (EconomicSeriesResponse, error) {
	series, err := FetchIPCFromAPI()
	if err != nil {
		return EconomicSeriesResponse{}, err
	}

	ts := IPCToTimeSeries(series)
	res := BuildEconomicResponse(ts)
	return res, nil

}

func (s *Service) FetchInflation() (EconomicSeriesResponse, error) {
	series, err := FetchIPCFromAPI()
	if err != nil {
		return EconomicSeriesResponse{}, err
	}

	ts := IPCToInflationSeries(series)
	res := BuildEconomicResponse(ts)
	return res, nil
}

func (s *Service) FetchDollarHistoric(quotation string) (EconomicSeriesResponse, error) {

	c := DollarQuotation(quotation)
	if !c.IsValid() {
		c = QuotationSell
	}

	series, err := FetchDollarHistoricSeries(c)
	if err != nil {
		return EconomicSeriesResponse{}, err
	}

	ts := DollarToTimeSeries(series, c)
	res := BuildEconomicResponse(ts)
	return res, nil
}

func (s *Service) FetchDollarCotization(quotation string) (DollarMap, error) {
	c := DollarQuotation(quotation)
	if !c.IsValid() {
		c = QuotationSell
	}

	values, err := FetchDolarCotization()
	if err != nil {
		return DollarMap{}, err
	}

	dollarMap := DollarCotizationToMap(values)

	return dollarMap, nil
}

func (s *Service) FetchCryptoCurrency(cryptoCurrency string) (EconomicSeriesResponse, error) {
	c := CryptoCurrency(cryptoCurrency)
	if !c.IsValid() {
		c = CryptoUSDT
	}

	series, err := FetchCryptoSeries(c)
	if err != nil {
		return EconomicSeriesResponse{}, err
	}

	ts := CryptoToTimeSeries(series, c)
	res := BuildEconomicResponse(ts)
	return res, nil
}

func (s *Service) FetchCountryRisk() (CountryRiskValue, error) {
	countryRisk, err := FetchCountryRiskFromAPI()
	if err != nil {
		return CountryRiskValue{}, err
	}

	return countryRisk, nil
}

func (s *Service) FetchFixedDeposits() (FixedDepositsMap, error) {
	values, err := FetchFixedDeposits()
	if err != nil {
		return FixedDepositsMap{}, err
	}

	fixedDepositsMap := FixedDepositsToMap(values)
	return fixedDepositsMap, nil
}

func (s *Service) FetchYieldAccounts() (YieldMap, error) {
	values, err := FetchYieldAccounts()
	if err != nil {
		return YieldMap{}, err
	}

	yieldMap := YieldToMap(values)
	return yieldMap, nil
}

func (s *Service) FetchLoanRates() (LoanMap, error) {
	values, err := FetchLoans()
	if err != nil {
		return LoanMap{}, err
	}

	loanMap := LoanToMap(values)
	return loanMap, nil
}
