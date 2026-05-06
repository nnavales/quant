package macro

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/nnavales/quant/api/cache"
)

type Provider struct {
	dollarSeriesSell *cache.Resource[TimeSeries]
	dollarSeriesBuy  *cache.Resource[TimeSeries]

	inflation   *cache.Resource[TimeSeries]
	countryRisk *cache.Resource[CountryRiskValue]

	btcSeries  *cache.Resource[TimeSeries]
	usdtSeries *cache.Resource[TimeSeries]
	ethSeries  *cache.Resource[TimeSeries]

	dollarsBankMap   *cache.Resource[DollarMap]
	fixedDepositsMap *cache.Resource[FixedDepositsMap]
	yieldsMap        *cache.Resource[YieldMap]
	loansMap         *cache.Resource[LoanMap]
}

func NewEconomicProvider(ctx context.Context) (*Provider, error) {
	p := &Provider{
		dollarSeriesSell: cache.New(cache.Options{
			TTL:             15 * time.Minute,
			RefreshInterval: 5 * time.Minute,
			AllowStale:      true,
		}, func(ctx context.Context) (TimeSeries, error) {
			return FetchDollarHistoricSeries(QuotationSell)
		}),

		dollarSeriesBuy: cache.New(cache.Options{
			TTL:             15 * time.Minute,
			RefreshInterval: 5 * time.Minute,
			AllowStale:      true,
		}, func(ctx context.Context) (TimeSeries, error) {
			return FetchDollarHistoricSeries(QuotationBuy)
		}),

		inflation: cache.New(cache.Options{
			TTL:             24 * time.Hour,
			RefreshInterval: 12 * time.Hour,
			AllowStale:      true,
		}, func(ctx context.Context) (TimeSeries, error) {
			ts, err := FetchIPCFromAPI()
			if err != nil {
				return TimeSeries{}, err
			}
			return IPCToInflationSeries(ts.Points), nil
		}),

		countryRisk: cache.New(cache.Options{
			TTL:             180 * time.Minute,
			RefreshInterval: 60 * time.Minute,
			AllowStale:      true,
		}, func(ctx context.Context) (CountryRiskValue, error) {
			return FetchCountryRiskFromAPI()
		}),

		btcSeries: cache.New(cache.Options{
			TTL:             15 * time.Minute,
			RefreshInterval: 5 * time.Minute,
			AllowStale:      false,
		}, func(ctx context.Context) (TimeSeries, error) {
			return FetchCryptoSeries(CryptoBTC)
		}),

		ethSeries: cache.New(cache.Options{
			TTL:             15 * time.Minute,
			RefreshInterval: 5 * time.Minute,
			AllowStale:      false,
		}, func(ctx context.Context) (TimeSeries, error) {
			return FetchCryptoSeries(CryptoETH)
		}),

		usdtSeries: cache.New(cache.Options{
			TTL:             15 * time.Minute,
			RefreshInterval: 5 * time.Minute,
			AllowStale:      false,
		}, func(ctx context.Context) (TimeSeries, error) {
			return FetchCryptoSeries(CryptoUSDT)
		}),

		fixedDepositsMap: cache.New(cache.Options{
			TTL:             300 * time.Minute,
			RefreshInterval: 180 * time.Minute,
			AllowStale:      true,
		}, func(ctx context.Context) (FixedDepositsMap, error) {
			values, err := FetchFixedDeposits()
			if err != nil {
				return nil, err
			}
			return FixedDepositsToMap(values), nil
		}),

		yieldsMap: cache.New(cache.Options{
			TTL:             300 * time.Minute,
			RefreshInterval: 180 * time.Minute,
			AllowStale:      true,
		}, func(ctx context.Context) (YieldMap, error) {
			values, err := FetchYieldAccounts()
			if err != nil {
				return nil, err
			}
			return YieldToMap(values), nil
		}),

		loansMap: cache.New(cache.Options{
			TTL:             300 * time.Minute,
			RefreshInterval: 180 * time.Minute,
			AllowStale:      true,
		}, func(ctx context.Context) (LoanMap, error) {
			values, err := FetchLoans()
			if err != nil {
				return nil, err
			}
			return LoanToMap(values), nil
		}),

		dollarsBankMap: cache.New(cache.Options{
			TTL:             30 * time.Second,
			RefreshInterval: 15 * time.Second,
			AllowStale:      false,
		}, func(ctx context.Context) (DollarMap, error) {
			values, err := FetchDollarCotization()
			if err != nil {
				return nil, err
			}
			return DollarCotizationToMap(values), nil
		}),
	}

	if err := p.warmup(ctx); err != nil {
		slog.Error("provider error", "error", err)
	}

	p.startRefresh(ctx)
	return p, nil
}

func (p *Provider) warmup(ctx context.Context) error {
	for _, w := range []func(context.Context) error{
		p.dollarSeriesSell.Warmup,
		p.dollarSeriesBuy.Warmup,
		p.inflation.Warmup,
		p.countryRisk.Warmup,
		p.btcSeries.Warmup,
		p.ethSeries.Warmup,
		p.usdtSeries.Warmup,
		p.dollarsBankMap.Warmup,
		p.fixedDepositsMap.Warmup,
		p.yieldsMap.Warmup,
		p.loansMap.Warmup,
	} {
		if err := w(ctx); err != nil {
			return err
		}
	}
	return nil
}

func (p *Provider) startRefresh(ctx context.Context) {
	p.dollarSeriesSell.StartRefresh(ctx)
	p.dollarSeriesBuy.StartRefresh(ctx)
	p.inflation.StartRefresh(ctx)
	p.countryRisk.StartRefresh(ctx)
	p.btcSeries.StartRefresh(ctx)
	p.ethSeries.StartRefresh(ctx)
	p.usdtSeries.StartRefresh(ctx)
	p.dollarsBankMap.StartRefresh(ctx)
	p.fixedDepositsMap.StartRefresh(ctx)
	p.yieldsMap.StartRefresh(ctx)
	p.loansMap.StartRefresh(ctx)
}

func (p *Provider) LastSell(ctx context.Context) (float64, error) {
	series, err := p.dollarSeriesSell.Get(ctx)
	if err != nil {
		return 0, err
	}
	n := len(series.Points)
	if n == 0 {
		return 0, fmt.Errorf("no dollar data")
	}

	return series.Points[n-1].Value, nil

}
