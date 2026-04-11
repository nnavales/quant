package dashboard

import (
	"net/http"

	"github.com/nnavales/summit/api/transport/httpx"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{
		service: service,
	}
}

func (h *Handler) GetKPIs(w http.ResponseWriter, r *http.Request) {
	res, err := h.service.GetKPIs(r.Context())
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}
	httpx.WriteJSON(w, 200, res)
}
