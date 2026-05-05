package backup

import (
	"io"
	"mime"
	"net/http"

	"github.com/nnavales/summit/api/transport/httpx"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Export(w http.ResponseWriter, r *http.Request) {
	buf, err := h.service.Export(r.Context())
	if err != nil {
		httpx.WriteError(w, r, 500, "internal error", err)
		return
	}

	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", "attachment; filename=backup.zip")
	w.Write(buf)
}

func (h *Handler) Import(w http.ResponseWriter, r *http.Request) {
	resource := r.PathValue("resource")
	if resource == "" {
		httpx.WriteError(w, r, 400, "you need to specify the resource you want to import", nil)
		return
	}

	ct := r.Header.Get("Content-Type")
	mt, _, err := mime.ParseMediaType(ct)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid Content-Type", nil)
		return
	}

	var reader io.Reader

	switch mt {
	case "multipart/form-data":
		if err := r.ParseMultipartForm(10 << 20); err != nil {
			httpx.WriteError(w, r, 400, "invalid multipart form", nil)
			return
		}
		file, _, err := r.FormFile("file")
		if err != nil {
			httpx.WriteError(w, r, 400, "file field required", nil)
			return
		}
		defer file.Close()

		reader = file

	case "text/csv":
		defer r.Body.Close()
		reader = r.Body

	default:
		httpx.WriteError(w, r, 400, "Content-Type must be multipart/form-data or text/csv", nil)
		return
	}

	switch resource {
	case "transactions":
		if err := h.service.ImportTransactions(r.Context(), reader); err != nil {
			httpx.WriteServiceError(w, r, err)
			return
		}
	case "historical":
		if err := h.service.ImportHistoricalEntries(r.Context(), reader); err != nil {
			httpx.WriteServiceError(w, r, err)
			return
		}
	case "networth":
		if err := h.service.ImportNetworth(r.Context(), reader); err != nil {
			httpx.WriteServiceError(w, r, err)
			return
		}
	}

	httpx.WriteJSON(w, 201, nil)
}
