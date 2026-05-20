package backup

import (
	"bytes"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/nnavales/quant/api/categories"
	"github.com/nnavales/quant/api/channels"
	"github.com/nnavales/quant/api/finance"
	"github.com/nnavales/quant/api/historical"
	"github.com/nnavales/quant/api/networth"
	"github.com/nnavales/quant/api/planning"
	"github.com/nnavales/quant/api/presets"
)

type Service struct {
	db          *sql.DB
	financeRepo finance.Repository
	histRepo    historical.Repository
	nwRepo      networth.Repository
	catRepo     categories.Repository
	chRepo      channels.Repository
	prRepo      presets.Repository
	plRepo      planning.Repository
}

func NewService(db *sql.DB, financeRepo finance.Repository, nwRepo networth.Repository, histRepo historical.Repository, catRepo categories.Repository, chRepo channels.Repository, prRepo presets.Repository, plRepo planning.Repository) *Service {
	return &Service{
		db:          db,
		financeRepo: financeRepo,
		nwRepo:      nwRepo,
		histRepo:    histRepo,
		catRepo:     catRepo,
		chRepo:      chRepo,
		prRepo:      prRepo,
		plRepo:      plRepo,
	}
}

func (s *Service) Export(ctx context.Context) ([]byte, error) {
	historicalData, err := s.financeRepo.ListHistoricalEntriesRaw(ctx)
	if err != nil {
		return nil, fmt.Errorf("unable to list historical entries from database: %w", err)
	}

	transactionsData, err := s.financeRepo.ListTransactionsAggRaw(ctx)
	if err != nil {
		return nil, fmt.Errorf("unable to list transactions from database: %w", err)
	}

	netWorthData, err := s.nwRepo.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("unable to list networth assets from database: %w", err)
	}

	presetsData, err := s.prRepo.ListPresets(ctx, presets.Filter{})
	if err != nil {
		return nil, fmt.Errorf("unable to list presets from database: %w", err)
	}

	planningInputsData, err := s.plRepo.ListInputs(ctx)
	if err != nil {
		return nil, fmt.Errorf("unable to list planning inputs: %w", err)
	}

	planningGoalsData, err := s.plRepo.ListGoals(ctx)
	if err != nil {
		return nil, fmt.Errorf("unable to list planning goals: %w", err)
	}

	planningRatesData, err := s.plRepo.ListRates(ctx)
	if err != nil {
		return nil, fmt.Errorf("unable to list planning exchange rates: %w", err)
	}

	planningConfigsData, err := s.plRepo.ListPlanningConfigs(ctx)
	if err != nil {
		return nil, fmt.Errorf("unable to list planning configs: %w", err)
	}

	catNames, subNames, chNames, accNames, err := s.buildNameMaps(ctx)
	if err != nil {
		return nil, fmt.Errorf("unable to build name maps: %w", err)
	}

	historicalEntries := toHistoricalEntry(historicalData)
	transactions := toTransaction(transactionsData)
	networth := toAsset(netWorthData)
	presets := toPreset(presetsData)
	for i := range presets {
		p := &presets[i]
		id := presetsData[i]
		if id.CategoryID != nil {
			p.Category = catNames[*id.CategoryID]
		}
		if id.SubcategoryID != nil {
			p.Subcategory = subNames[*id.SubcategoryID]
		}
		if id.ChannelID != nil {
			p.Channel = chNames[*id.ChannelID]
		}
		if id.AccountID != nil {
			p.Account = accNames[*id.AccountID]
		}
	}

	planningInputs := toPlanningInput(planningInputsData)
	planningGoals := toPlanningGoal(planningGoalsData)
	planningExchangeRates := toPlanningExchangeRate(planningRatesData)
	planningConfigs := toPlanningConfig(planningConfigsData)

	exportData := Data{
		Transactions:             transactions,
		HistoricalEntries:        historicalEntries,
		NetWorth:                 networth,
		Presets:                  presets,
		PlanningInputs:           planningInputs,
		PlanningGoals:            planningGoals,
		PlanningExchangeRates:    planningExchangeRates,
		PlanningConfigs:          planningConfigs,
	}

	var buf bytes.Buffer
	if err := WriteZip(exportData, &buf); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func (s *Service) buildNameMaps(ctx context.Context) (map[string]string, map[string]string, map[string]string, map[string]string, error) {
	cats, err := s.catRepo.ListCategories(ctx, categories.Filter{})
	if err != nil {
		return nil, nil, nil, nil, fmt.Errorf("unable to list categories: %w", err)
	}
	subs, err := s.catRepo.ListSubcategories(ctx, categories.Filter{})
	if err != nil {
		return nil, nil, nil, nil, fmt.Errorf("unable to list subcategories: %w", err)
	}
	chs, err := s.chRepo.ListChannels(ctx, channels.Filter{})
	if err != nil {
		return nil, nil, nil, nil, fmt.Errorf("unable to list channels: %w", err)
	}
	accs, err := s.chRepo.ListAccounts(ctx, channels.Filter{})
	if err != nil {
		return nil, nil, nil, nil, fmt.Errorf("unable to list accounts: %w", err)
	}

	catNames := make(map[string]string, len(cats))
	for _, c := range cats {
		catNames[c.ID] = c.Name
	}
	subNames := make(map[string]string, len(subs))
	for _, s := range subs {
		subNames[s.ID] = s.Name
	}
	chNames := make(map[string]string, len(chs))
	for _, c := range chs {
		chNames[c.ID] = c.Name
	}
	accNames := make(map[string]string, len(accs))
	for _, a := range accs {
		accNames[a.ID] = a.Name
	}
	return catNames, subNames, chNames, accNames, nil
}

func (s *Service) ImportTransactions(ctx context.Context, r io.Reader) error {
	txs, err := fromCSVtoTransactions(r)
	if err != nil {
		return fmt.Errorf("unable to convert body into transactions: %w", err)
	}

	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("unable to begin transaction: %w", err)
	}
	defer tx.Rollback()

	catMap, subMap, chMap, accMap, err := s.resolveEntities(ctx, tx, refsFromTransactions(txs))
	if err != nil {
		return fmt.Errorf("unable to resolve entities: %w", err)
	}

	aggs, err := toTransactionAgg(txs, catMap, subMap, chMap, accMap)
	if err != nil {
		return fmt.Errorf("unable to map transactions: %w", err)
	}

	if err := s.financeRepo.BulkCreateTransactionAggregateTx(ctx, tx, aggs); err != nil {
		return fmt.Errorf("unable to bulk create transactions: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("unable to commit transaction: %w", err)
	}

	return nil
}

func (s *Service) resolveEntities(ctx context.Context, tx *sql.Tx, refs []EntityRef) (catMap, subMap, chMap, accMap map[string]string, err error) {
	now := time.Now()
	catMap = make(map[string]string)
	subMap = make(map[string]string)
	chMap = make(map[string]string)
	accMap = make(map[string]string)

	for _, r := range refs {
		if r.Category != "" {
			if _, ok := catMap[r.Category]; !ok {
				id, err := s.resolveCategory(ctx, tx, now, r.Category)
				if err != nil {
					return nil, nil, nil, nil, fmt.Errorf("category %q: %w", r.Category, err)
				}
				catMap[r.Category] = id
			}
		}

		if r.Subcategory != "" && r.Category != "" {
			key := catMap[r.Category] + "|" + r.Subcategory
			if _, ok := subMap[key]; !ok {
				id, err := s.resolveSubcategory(ctx, tx, now, catMap[r.Category], r.Subcategory)
				if err != nil {
					return nil, nil, nil, nil, fmt.Errorf("subcategory %q: %w", r.Subcategory, err)
				}
				subMap[key] = id
			}
		}

		if r.Channel != "" {
			if _, ok := chMap[r.Channel]; !ok {
				id, err := s.resolveChannel(ctx, tx, now, r.Channel)
				if err != nil {
					return nil, nil, nil, nil, fmt.Errorf("channel %q: %w", r.Channel, err)
				}
				chMap[r.Channel] = id
			}
		}

		if r.Account != "" && r.Channel != "" {
			key := chMap[r.Channel] + "|" + r.Account
			if _, ok := accMap[key]; !ok {
				id, err := s.resolveAccount(ctx, tx, now, chMap[r.Channel], r.Account)
				if err != nil {
					return nil, nil, nil, nil, fmt.Errorf("account %q: %w", r.Account, err)
				}
				accMap[key] = id
			}
		}
	}

	return catMap, subMap, chMap, accMap, nil
}

func refsFromTransactions(txs []Transaction) []EntityRef {
	refs := make([]EntityRef, len(txs))
	for i, t := range txs {
		refs[i] = t.EntityRef()
	}
	return refs
}

func refsFromPresets(ps []Preset) []EntityRef {
	refs := make([]EntityRef, len(ps))
	for i, p := range ps {
		refs[i] = p.EntityRef()
	}
	return refs
}

func (s *Service) resolveCategory(ctx context.Context, tx *sql.Tx, now time.Time, name string) (string, error) {
	c, err := s.catRepo.GetCategoryByNameTx(ctx, tx, name)
	if err == nil {
		return c.ID, nil
	}
	if !errors.Is(err, categories.ErrNotFound) {
		return "", err
	}

	newCat := categories.NewCategory(now, name)
	created, err := s.catRepo.CreateCategoryTx(ctx, tx, *newCat)
	if err == nil {
		return created.ID, nil
	}
	if !errors.Is(err, categories.ErrDuplicate) {
		return "", err
	}

	var id string
	err = tx.QueryRowContext(ctx, "SELECT id FROM categories WHERE name = ? AND deleted_at IS NOT NULL", name).Scan(&id)
	if err != nil {
		return "", fmt.Errorf("failed to find soft-deleted category: %w", err)
	}

	_, err = tx.ExecContext(ctx, "UPDATE categories SET deleted_at = NULL WHERE id = ?", id)
	if err != nil {
		return "", fmt.Errorf("failed to restore category: %w", err)
	}

	return id, nil
}

func (s *Service) resolveSubcategory(ctx context.Context, tx *sql.Tx, now time.Time, categoryID, name string) (string, error) {
	sc, err := s.catRepo.GetSubcategoryByCategoryAndNameTx(ctx, tx, categoryID, name)
	if err == nil {
		return sc.ID, nil
	}
	if !errors.Is(err, categories.ErrNotFound) {
		return "", err
	}

	newSc := categories.NewSubcategory(now, categoryID, name)
	created, err := s.catRepo.CreateSubcategoryTx(ctx, tx, *newSc)
	if err == nil {
		return created.ID, nil
	}
	if !errors.Is(err, categories.ErrDuplicate) {
		return "", err
	}

	var id string
	err = tx.QueryRowContext(ctx, "SELECT id FROM subcategories WHERE category_id = ? AND name = ? AND deleted_at IS NOT NULL", categoryID, name).Scan(&id)
	if err != nil {
		return "", fmt.Errorf("failed to find soft-deleted subcategory: %w", err)
	}

	_, err = tx.ExecContext(ctx, "UPDATE subcategories SET deleted_at = NULL WHERE id = ?", id)
	if err != nil {
		return "", fmt.Errorf("failed to restore subcategory: %w", err)
	}

	return id, nil
}

func (s *Service) resolveChannel(ctx context.Context, tx *sql.Tx, now time.Time, name string) (string, error) {
	ch, err := s.chRepo.GetChannelByNameTx(ctx, tx, name)
	if err == nil {
		return ch.ID, nil
	}
	if !errors.Is(err, channels.ErrNotFound) {
		return "", err
	}

	newCh := channels.NewChannel(now, name)
	created, err := s.chRepo.CreateChannelTx(ctx, tx, *newCh)
	if err == nil {
		return created.ID, nil
	}
	if !errors.Is(err, channels.ErrDuplicate) {
		return "", err
	}

	var id string
	err = tx.QueryRowContext(ctx, "SELECT id FROM channels WHERE name = ? AND deleted_at IS NOT NULL", name).Scan(&id)
	if err != nil {
		return "", fmt.Errorf("failed to find soft-deleted channel: %w", err)
	}

	_, err = tx.ExecContext(ctx, "UPDATE channels SET deleted_at = NULL WHERE id = ?", id)
	if err != nil {
		return "", fmt.Errorf("failed to restore channel: %w", err)
	}

	return id, nil
}

func (s *Service) resolveAccount(ctx context.Context, tx *sql.Tx, now time.Time, channelID, name string) (string, error) {
	acc, err := s.chRepo.GetAccountByChannelAndNameTx(ctx, tx, channelID, name)
	if err == nil {
		return acc.ID, nil
	}
	if !errors.Is(err, channels.ErrNotFound) {
		return "", err
	}

	newAcc := channels.NewAccount(now, channelID, name, "transfer")
	created, err := s.chRepo.CreateAccountTx(ctx, tx, *newAcc)
	if err == nil {
		return created.ID, nil
	}
	if !errors.Is(err, channels.ErrDuplicate) {
		return "", err
	}

	var id string
	err = tx.QueryRowContext(ctx, "SELECT id FROM accounts WHERE channel_id = ? AND name = ? AND deleted_at IS NOT NULL", channelID, name).Scan(&id)
	if err != nil {
		return "", fmt.Errorf("failed to find soft-deleted account: %w", err)
	}

	_, err = tx.ExecContext(ctx, "UPDATE accounts SET deleted_at = NULL WHERE id = ?", id)
	if err != nil {
		return "", fmt.Errorf("failed to restore account: %w", err)
	}

	return id, nil
}

func (s *Service) ImportPresets(ctx context.Context, r io.Reader) error {
	presets, err := fromCSVtoPresets(r)
	if err != nil {
		return fmt.Errorf("unable to convert body into presets: %w", err)
	}

	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("unable to begin transaction: %w", err)
	}
	defer tx.Rollback()

	catMap, subMap, chMap, accMap, err := s.resolveEntities(ctx, tx, refsFromPresets(presets))
	if err != nil {
		return fmt.Errorf("unable to resolve entities: %w", err)
	}

	domPresets, err := toDomainPreset(presets, catMap, subMap, chMap, accMap)
	if err != nil {
		return fmt.Errorf("unable to map presets: %w", err)
	}

	for _, p := range domPresets {
		if _, err := s.prRepo.CreatePresetTx(ctx, tx, p); err != nil {
			return fmt.Errorf("unable to create preset: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("unable to commit transaction: %w", err)
	}

	return nil
}

func (s *Service) ImportHistoricalEntries(ctx context.Context, r io.Reader) error {
	hist, err := fromCSVtoHistorical(r)
	if err != nil {
		return fmt.Errorf("unable to convert body into historical entries: %w", err)
	}

	histEntries, err := toDomainHistoricalEntry(hist)
	if err != nil {
		return fmt.Errorf("unable to map historical entries: %w", err)
	}

	if err := s.histRepo.BulkCreateHistoricalEntries(ctx, histEntries); err != nil {
		return fmt.Errorf("unable to bulk create historical entries: %w", err)
	}
	return nil
}

func (s *Service) ImportNetworth(ctx context.Context, r io.Reader) error {
	assets, err := fromCSVtoAssets(r)
	if err != nil {
		return fmt.Errorf("unable to convert body into assets: %w", err)
	}

	assetsD, err := toDomainAsset(assets)
	if err != nil {
		return fmt.Errorf("unable to map assets: %w", err)
	}

	if err := s.nwRepo.BulkCreateAssets(ctx, assetsD); err != nil {
		return fmt.Errorf("unable to bulk create networth assets: %w", err)
	}
	return nil
}

func (s *Service) ImportPlanningInputs(ctx context.Context, r io.Reader) error {
	inputs, err := fromCSVtoPlanningInputs(r)
	if err != nil {
		return fmt.Errorf("unable to parse planning inputs: %w", err)
	}

	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("unable to begin transaction: %w", err)
	}
	defer tx.Rollback()

	for _, input := range inputs {
		if _, err := s.plRepo.CreateInputTx(ctx, tx, input); err != nil {
			return fmt.Errorf("unable to create planning input: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("unable to commit transaction: %w", err)
	}
	return nil
}

func (s *Service) ImportPlanningGoals(ctx context.Context, r io.Reader) error {
	goals, err := fromCSVtoPlanningGoals(r)
	if err != nil {
		return fmt.Errorf("unable to parse planning goals: %w", err)
	}

	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("unable to begin transaction: %w", err)
	}
	defer tx.Rollback()

	for _, g := range goals {
		if _, err := s.plRepo.CreateGoalTx(ctx, tx, g); err != nil {
			return fmt.Errorf("unable to create planning goal: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("unable to commit transaction: %w", err)
	}
	return nil
}

func (s *Service) ImportPlanningExchangeRates(ctx context.Context, r io.Reader) error {
	rates, err := fromCSVtoPlanningExchangeRates(r)
	if err != nil {
		return fmt.Errorf("unable to parse planning exchange rates: %w", err)
	}

	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("unable to begin transaction: %w", err)
	}
	defer tx.Rollback()

	for _, rate := range rates {
		if _, err := s.plRepo.CreateRateTx(ctx, tx, rate); err != nil {
			return fmt.Errorf("unable to create exchange rate: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("unable to commit transaction: %w", err)
	}
	return nil
}

func (s *Service) ImportPlanningConfigs(ctx context.Context, r io.Reader) error {
	configs, err := fromCSVtoPlanningConfigs(r)
	if err != nil {
		return fmt.Errorf("unable to parse planning configs: %w", err)
	}

	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("unable to begin transaction: %w", err)
	}
	defer tx.Rollback()

	for _, c := range configs {
		if _, err := s.plRepo.UpsertPlanningConfigTx(ctx, tx, c); err != nil {
			return fmt.Errorf("unable to upsert planning config: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("unable to commit transaction: %w", err)
	}
	return nil
}
