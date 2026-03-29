package transport

import (
	"net/http"

	"github.com/nnavales/summit/api/finance"
	"github.com/nnavales/summit/api/transport/httpx"
)

func addRoutes(mux *http.ServeMux, h *finance.Handler) {
	mux.HandleFunc("GET /healthz", handlerHealthz)
	mux.HandleFunc("GET /rates", h.GetRates)

	mux.HandleFunc("GET /transactions/{id}", h.GetTransaction)
	mux.HandleFunc("GET /transactions", h.ListTransactions)
	mux.HandleFunc("PATCH /transactions/{id}", h.UpdateTransaction)
	mux.HandleFunc("DELETE /transactions/{id}", h.DeleteTransaction)

	mux.HandleFunc("GET /entries/{id}", h.GetEntry)
	mux.HandleFunc("GET /entries", h.ListEntries)
	mux.HandleFunc("PATCH /entries/{id}", h.UpdateEntry)
	mux.HandleFunc("DELETE /entries/{id}", h.DeleteEntry)

	mux.HandleFunc("POST /channels", h.CreateChannel)
	mux.HandleFunc("GET /channels/{id}", h.GetChannel)
	mux.HandleFunc("GET /channels", h.ListChannels)
	mux.HandleFunc("PATCH /channels/{id}", h.UpdateChannel)
	mux.HandleFunc("DELETE /channels/{id}", h.DeleteChannel)

	mux.HandleFunc("POST /accounts", h.CreateAccount)
	mux.HandleFunc("GET /accounts/{id}", h.GetAccount)
	mux.HandleFunc("GET /accounts", h.ListAccounts)
	mux.HandleFunc("PATCH /accounts/{id}", h.UpdateAccount)
	mux.HandleFunc("DELETE /accounts/{id}", h.DeleteAccount)

	mux.HandleFunc("POST /categories", h.CreateCategory)
	mux.HandleFunc("GET /categories/{id}", h.GetCategory)
	mux.HandleFunc("GET /categories", h.ListCategoriesWithSubcategories)
	mux.HandleFunc("PATCH /categories/{id}", h.UpdateCategory)
	mux.HandleFunc("DELETE /categories/{id}", h.DeleteCategory)

	mux.HandleFunc("POST /subcategories", h.CreateSubcategory)
	mux.HandleFunc("GET /subcategories/{id}", h.GetSubcategory)
	mux.HandleFunc("GET /subcategories", h.ListSubcategories)
	mux.HandleFunc("PATCH /subcategories/{id}", h.UpdateSubcategory)
	mux.HandleFunc("DELETE /subcategories/{id}", h.DeleteSubcategory)

	mux.HandleFunc("GET /installment-groups/{id}", h.GetInstallmentGroup)
	mux.HandleFunc("GET /installment-groups", h.ListInstallmentGroups)
	mux.HandleFunc("PATCH /installment-groups/{id}", h.UpdateInstallmentGroup)
	mux.HandleFunc("DELETE /installment-groups/{id}", h.DeleteInstallmentGroup)

	mux.HandleFunc("POST /transaction-aggregates", h.CreateTransactionAggregate)
	mux.HandleFunc("GET /transaction-aggregates", h.ListTransactionsAggregate)
	mux.HandleFunc("GET /transaction-aggregates/{id}", h.GetTransactionAggregate)
	mux.HandleFunc("PATCH /transaction-aggregates/{id}", h.UpdateTransactionAggregate)
	mux.HandleFunc("DELETE /transaction-aggregates/{id}", h.DeleteTransactionAggregate)
	mux.HandleFunc("POST /transaction-aggregates/cancel-installments", h.CancelInstallments)
}

func handlerHealthz(w http.ResponseWriter, r *http.Request) {
	httpx.WriteJSON(w, 200, "ok")
}
