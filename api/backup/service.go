package backup

import (
	"bytes"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/nnavales/summit/api/categories"
	"github.com/nnavales/summit/api/channels"
	"github.com/nnavales/summit/api/finance"
	"github.com/nnavales/summit/api/historical"
	"github.com/nnavales/summit/api/networth"
)

type Service struct {
	db          *sql.DB
	financeRepo finance.Repository
	histRepo    historical.Repository
	nwRepo      networth.Repository
	catRepo     categories.Repository
	chRepo      channels.Repository
}

func NewService(db *sql.DB, financeRepo finance.Repository, nwRepo networth.Repository, histRepo historical.Repository, catRepo categories.Repository, chRepo channels.Repository) *Service {
	return &Service{
		db:          db,
		financeRepo: financeRepo,
		nwRepo:      nwRepo,
		histRepo:    histRepo,
		catRepo:     catRepo,
		chRepo:      chRepo,
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

	historicalEntries := toHistoricalEntry(historicalData)
	transactions := toTransaction(transactionsData)
	networth := toAsset(netWorthData)

	exportData := Data{
		Transactions:      transactions,
		HistoricalEntries: historicalEntries,
		NetWorth:          networth,
	}

	var buf bytes.Buffer
	if err := WriteZip(exportData, &buf); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
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

	catMap, subMap, chMap, accMap, err := s.resolveEntities(ctx, tx, txs)
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

func (s *Service) resolveEntities(ctx context.Context, tx *sql.Tx, txs []Transaction) (catMap, subMap, chMap, accMap map[string]string, err error) {
	now := time.Now()
	catMap = make(map[string]string)
	subMap = make(map[string]string)
	chMap = make(map[string]string)
	accMap = make(map[string]string)

	for _, t := range txs {
		if t.Category != "" {
			if _, ok := catMap[t.Category]; !ok {
				id, err := s.resolveCategory(ctx, tx, now, t.Category)
				if err != nil {
					return nil, nil, nil, nil, fmt.Errorf("category %q: %w", t.Category, err)
				}
				catMap[t.Category] = id
			}
		}

		if t.Subcategory != "" && t.Category != "" {
			key := catMap[t.Category] + "|" + t.Subcategory
			if _, ok := subMap[key]; !ok {
				id, err := s.resolveSubcategory(ctx, tx, now, catMap[t.Category], t.Subcategory)
				if err != nil {
					return nil, nil, nil, nil, fmt.Errorf("subcategory %q: %w", t.Subcategory, err)
				}
				subMap[key] = id
			}
		}

		if t.Channel != "" {
			if _, ok := chMap[t.Channel]; !ok {
				id, err := s.resolveChannel(ctx, tx, now, t.Channel)
				if err != nil {
					return nil, nil, nil, nil, fmt.Errorf("channel %q: %w", t.Channel, err)
				}
				chMap[t.Channel] = id
			}
		}

		if t.Account != "" && t.Channel != "" {
			key := chMap[t.Channel] + "|" + t.Account
			if _, ok := accMap[key]; !ok {
				id, err := s.resolveAccount(ctx, tx, now, chMap[t.Channel], t.Account)
				if err != nil {
					return nil, nil, nil, nil, fmt.Errorf("account %q: %w", t.Account, err)
				}
				accMap[key] = id
			}
		}
	}

	return catMap, subMap, chMap, accMap, nil
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
