package transport

import (
	"net/http"

	"github.com/nnavales/quant/api/backup"
	"github.com/nnavales/quant/api/categories"
	"github.com/nnavales/quant/api/channels"
	"github.com/nnavales/quant/api/chatbot"
	"github.com/nnavales/quant/api/dashboard"
	"github.com/nnavales/quant/api/entries"
	"github.com/nnavales/quant/api/finance"
	"github.com/nnavales/quant/api/historical"
	"github.com/nnavales/quant/api/installments"
	"github.com/nnavales/quant/api/macro"
	"github.com/nnavales/quant/api/networth"
	"github.com/nnavales/quant/api/presets"
	"github.com/nnavales/quant/api/transactions"
	"github.com/nnavales/quant/api/transport/httpx"
	"github.com/nnavales/quant/api/users"
)

func addRoutes(mux *http.ServeMux,
	h *finance.Handler, th *transactions.Handler, eh *entries.Handler,
	ih *installments.Handler, ch *channels.Handler, cat *categories.Handler,
	hm *macro.Handler, uh *users.Handler, hh *historical.Handler,
	dh *dashboard.Handler, nw *networth.Handler, ph *presets.Handler,
	bh *backup.Handler, cbh *chatbot.Handler,
) {
	mux.HandleFunc("GET /healthz", handlerHealthz)

	mux.HandleFunc("POST /users/config/agent", cbh.SetAgentCFG)
	mux.HandleFunc("POST /users/config/chat", cbh.SetChatCFG)
	mux.HandleFunc("GET /users/config", uh.GetConfig)
	mux.HandleFunc("GET /users/config/{key}", uh.GetConfigByKey)
	mux.HandleFunc("PATCH /users/config", uh.SetConfig)

	mux.HandleFunc("GET /economic/ipc", hm.GetIPC)
	mux.HandleFunc("GET /economic/inflation", hm.GetInflation)
	mux.HandleFunc("GET /economic/dollar", hm.GetDollarHistoric)
	mux.HandleFunc("GET /economic/dollar/banks", hm.GetDollarValue)
	mux.HandleFunc("GET /economic/crypto", hm.GetCryptoCurrency)
	mux.HandleFunc("GET /economic/country-risk", hm.GetCountryRisk)
	mux.HandleFunc("GET /economic/fixed-deposits", hm.GetFixedDeposits)
	mux.HandleFunc("GET /economic/yield-accounts", hm.GetYieldAccounts)
	mux.HandleFunc("GET /economic/loans", hm.GetLoanRates)

	mux.HandleFunc("GET /transactions/{id}", th.GetTransaction)
	mux.HandleFunc("GET /transactions", th.ListTransactions)
	mux.HandleFunc("PATCH /transactions/{id}", th.UpdateTransaction)
	mux.HandleFunc("DELETE /transactions/{id}", th.DeleteTransaction)
	mux.HandleFunc("PATCH /transaction/{id}/paid", th.UpdateTransactionPaid)

	mux.HandleFunc("GET /entries/{id}", eh.GetEntry)
	mux.HandleFunc("GET /entries", eh.ListEntries)
	mux.HandleFunc("PATCH /entries/{id}", eh.UpdateEntry)
	mux.HandleFunc("DELETE /entries/{id}", eh.DeleteEntry)

	mux.HandleFunc("POST /channels", ch.CreateChannel)
	mux.HandleFunc("GET /channels/{id}", ch.GetChannel)
	mux.HandleFunc("GET /channels", ch.ListChannels)
	mux.HandleFunc("PATCH /channels/{id}", ch.UpdateChannel)
	mux.HandleFunc("DELETE /channels/{id}", ch.DeleteChannel)
	mux.HandleFunc("POST /channels/{id}/restore", ch.RestoreChannel)
	mux.HandleFunc("DELETE /channels/{id}/hard", ch.HardDeleteChannel)

	mux.HandleFunc("POST /accounts", ch.CreateAccount)
	mux.HandleFunc("GET /accounts/{id}", ch.GetAccount)
	mux.HandleFunc("GET /accounts", ch.ListAccounts)
	mux.HandleFunc("PATCH /accounts/{id}", ch.UpdateAccount)
	mux.HandleFunc("DELETE /accounts/{id}", ch.DeleteAccount)
	mux.HandleFunc("POST /accounts/{id}/restore", ch.RestoreAccount)
	mux.HandleFunc("DELETE /accounts/{id}/hard", ch.HardDeleteAccount)

	mux.HandleFunc("POST /categories", cat.CreateCategory)
	mux.HandleFunc("GET /categories/{id}", cat.GetCategory)
	mux.HandleFunc("GET /categories", cat.ListCategoriesWithSubcategories)
	mux.HandleFunc("PATCH /categories/{id}", cat.UpdateCategory)
	mux.HandleFunc("DELETE /categories/{id}", cat.DeleteCategory)
	mux.HandleFunc("POST /categories/{id}/restore", cat.RestoreCategory)
	mux.HandleFunc("DELETE /categories/{id}/hard", cat.HardDeleteCategory)

	mux.HandleFunc("POST /subcategories", cat.CreateSubcategory)
	mux.HandleFunc("GET /subcategories/{id}", cat.GetSubcategory)
	mux.HandleFunc("GET /subcategories", cat.ListSubcategories)
	mux.HandleFunc("PATCH /subcategories/{id}", cat.UpdateSubcategory)
	mux.HandleFunc("DELETE /subcategories/{id}", cat.DeleteSubcategory)
	mux.HandleFunc("POST /subcategories/{id}/restore", cat.RestoreSubcategory)
	mux.HandleFunc("DELETE /subcategories/{id}/hard", cat.HardDeleteSubcategory)

	mux.HandleFunc("GET /installment-groups/{id}", ih.GetInstallmentGroup)
	mux.HandleFunc("GET /installment-groups", ih.ListInstallmentGroups)
	mux.HandleFunc("PATCH /installment-groups/{id}", ih.UpdateInstallmentGroup)
	mux.HandleFunc("DELETE /installment-groups/{id}", ih.DeleteInstallmentGroup)

	mux.HandleFunc("GET /installment-groups/transactions", h.ListTransactionsByInstallmentGroup)

	mux.HandleFunc("GET /installment-groups/{id}/transactions", h.GetTransactionsByInstallmentGroup)
	mux.HandleFunc("POST /transaction-aggregates", h.CreateTransactionAggregate)
	mux.HandleFunc("POST /transaction-aggregates/bulk", h.CreateBulkTransactionAggregate)
	mux.HandleFunc("GET /transaction-aggregates", h.ListTransactionsAggregate)
	mux.HandleFunc("GET /transaction-aggregates/{id}", h.GetTransactionAggregate)
	mux.HandleFunc("PATCH /transaction-aggregates/{id}", h.UpdateTransactionAggregate)
	mux.HandleFunc("DELETE /transaction-aggregates/{id}", h.DeleteTransactionAggregate)
	mux.HandleFunc("POST /transaction-aggregates/cancel-installments", h.CancelInstallments)
	mux.HandleFunc("GET /historical-entries", h.ListHistoricalEntries)

	mux.HandleFunc("GET /dashboard", dh.GetKPIs)
	mux.HandleFunc("GET /dashboard/kpi/{kpi}/evolution", dh.GetKPIEvolution)
	mux.HandleFunc("GET /dashboard/dimension/{dimension}", dh.GetDimensionSeries)

	mux.HandleFunc("POST /historical", hh.CreateHistoricalEntry)
	mux.HandleFunc("GET /historical", hh.ListHistoricalEntries)
	mux.HandleFunc("GET /historical/{date}", hh.GetHistoricalEntryByDate)
	mux.HandleFunc("PATCH /historical/{date}", hh.UpdateHistoricalEntry)
	mux.HandleFunc("DELETE /historical/{date}", hh.DeleteHistoricalEntry)
	mux.HandleFunc("POST /historical/bulk", hh.BulkCreateHistoricalEntries)
	mux.HandleFunc("POST /historical/bulk/csv", hh.BulkCreateHistoricalEntriesCSV)

	mux.HandleFunc("POST /assets", nw.CreateAsset)
	mux.HandleFunc("GET /assets/{id}", nw.GetAsset)
	mux.HandleFunc("GET /assets", nw.ListAssets)
	mux.HandleFunc("PATCH /assets/{id}", nw.UpdateAsset)
	mux.HandleFunc("DELETE /assets/{id}", nw.DeleteAsset)
	mux.HandleFunc("GET /networth", nw.GetNetWorth)

	mux.HandleFunc("POST /presets", ph.CreatePreset)
	mux.HandleFunc("GET /presets/{id}", ph.GetPreset)
	mux.HandleFunc("GET /presets", ph.ListPresets)
	mux.HandleFunc("PATCH /presets/{id}", ph.UpdatePreset)
	mux.HandleFunc("DELETE /presets/{id}", ph.DeletePreset)
	mux.HandleFunc("POST /presets/{id}/restore", ph.RestorePreset)

	mux.HandleFunc("GET /backup/export", bh.Export)
	mux.HandleFunc("POST /backup/import/{resource}", bh.Import)
}

func handlerHealthz(w http.ResponseWriter, r *http.Request) {
	httpx.WriteJSON(w, 200, "ok")
}
