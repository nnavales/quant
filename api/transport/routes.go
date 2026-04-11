package transport

import (
	"net/http"

	"github.com/nnavales/summit/api/categories"
	"github.com/nnavales/summit/api/channels"
	"github.com/nnavales/summit/api/dashboard"
	"github.com/nnavales/summit/api/entries"
	"github.com/nnavales/summit/api/finance"
	"github.com/nnavales/summit/api/historical"
	"github.com/nnavales/summit/api/installments"
	"github.com/nnavales/summit/api/macro"
	"github.com/nnavales/summit/api/transactions"
	"github.com/nnavales/summit/api/transport/httpx"
	"github.com/nnavales/summit/api/users"
)

func addRoutes(mux *http.ServeMux,
	h *finance.Handler, th *transactions.Handler, eh *entries.Handler,
	ih *installments.Handler, ch *channels.Handler, cat *categories.Handler,
	hm *macro.Handler, uh *users.Handler, hh *historical.Handler,
	dh *dashboard.Handler,
) {
	mux.HandleFunc("GET /healthz", handlerHealthz)

	mux.HandleFunc("GET /economic/ipc", hm.GetIPC)
	mux.HandleFunc("GET /economic/inflation", hm.GetInflation)
	mux.HandleFunc("GET /economic/dollar", hm.GetDollarHistoric)
	mux.HandleFunc("GET /economic/dollar/banks", hm.GetDollarValue)
	mux.HandleFunc("GET /economic/crypto", hm.GetCryptoCurrency)
	mux.HandleFunc("GET /economic/country-risk", hm.GetCountryRisk)
	mux.HandleFunc("GET /economic/fixed-deposits", hm.GetFixedDeposits)
	mux.HandleFunc("GET /economic/yield-accounts", hm.GetYieldAccounts)
	mux.HandleFunc("GET /economic/loans", hm.GetLoanRates)

	mux.HandleFunc("GET /users/config", uh.GetConfig)
	mux.HandleFunc("GET /users/config/{key}", uh.GetConfigByKey)
	mux.HandleFunc("PATCH /users/config", uh.SetConfig)

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

	mux.HandleFunc("POST /accounts", ch.CreateAccount)
	mux.HandleFunc("GET /accounts/{id}", ch.GetAccount)
	mux.HandleFunc("GET /accounts", ch.ListAccounts)
	mux.HandleFunc("PATCH /accounts/{id}", ch.UpdateAccount)
	mux.HandleFunc("DELETE /accounts/{id}", ch.DeleteAccount)
	mux.HandleFunc("POST /accounts/{id}/restore", ch.RestoreAccount)

	mux.HandleFunc("POST /categories", cat.CreateCategory)
	mux.HandleFunc("GET /categories/{id}", cat.GetCategory)
	mux.HandleFunc("GET /categories", cat.ListCategoriesWithSubcategories)
	mux.HandleFunc("PATCH /categories/{id}", cat.UpdateCategory)
	mux.HandleFunc("DELETE /categories/{id}", cat.DeleteCategory)
	mux.HandleFunc("POST /categories/{id}/restore", cat.RestoreCategory)

	mux.HandleFunc("POST /subcategories", cat.CreateSubcategory)
	mux.HandleFunc("GET /subcategories/{id}", cat.GetSubcategory)
	mux.HandleFunc("GET /subcategories", cat.ListSubcategories)
	mux.HandleFunc("PATCH /subcategories/{id}", cat.UpdateSubcategory)
	mux.HandleFunc("DELETE /subcategories/{id}", cat.DeleteSubcategory)
	mux.HandleFunc("POST /subcategories/{id}/restore", cat.RestoreSubcategory)

	mux.HandleFunc("GET /installment-groups/{id}", ih.GetInstallmentGroup)
	mux.HandleFunc("GET /installment-groups", ih.ListInstallmentGroups)
	mux.HandleFunc("PATCH /installment-groups/{id}", ih.UpdateInstallmentGroup)
	mux.HandleFunc("DELETE /installment-groups/{id}", ih.DeleteInstallmentGroup)

	mux.HandleFunc("POST /transaction-aggregates", h.CreateTransactionAggregate)
	mux.HandleFunc("GET /transaction-aggregates", h.ListTransactionsAggregate)
	mux.HandleFunc("GET /transaction-aggregates/{id}", h.GetTransactionAggregate)
	mux.HandleFunc("PATCH /transaction-aggregates/{id}", h.UpdateTransactionAggregate)
	mux.HandleFunc("DELETE /transaction-aggregates/{id}", h.DeleteTransactionAggregate)
	mux.HandleFunc("POST /transaction-aggregates/cancel-installments", h.CancelInstallments)
	mux.HandleFunc("GET /historical-entries", h.ListHistoricalEntries)

	mux.HandleFunc("GET /dashboard/kpis", dh.GetKPIs)

	mux.HandleFunc("POST /historical", hh.CreateHistoricalEntry)
	mux.HandleFunc("GET /historical", hh.ListHistoricalEntries)
	mux.HandleFunc("GET /historical/{date}", hh.GetHistoricalEntryByDate)
	mux.HandleFunc("PATCH /historical/{date}", hh.UpdateHistoricalEntry)
	mux.HandleFunc("DELETE /historical/{date}", hh.DeleteHistoricalEntry)
	mux.HandleFunc("POST /historical/bulk", hh.BulkCreateHistoricalEntries)
}

func handlerHealthz(w http.ResponseWriter, r *http.Request) {
	httpx.WriteJSON(w, 200, "ok")
}
