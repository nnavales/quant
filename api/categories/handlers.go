package categories

import (
	"errors"
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

func (h *Handler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[CategoryReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	c, err := h.service.CreateCategory(r.Context(), req)
	if err != nil {
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		if errors.Is(err, ErrDuplicate) {
			httpx.WriteError(w, r, 409, "category already exists", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to create category", err)
		return
	}
	httpx.WriteJSON(w, 201, c)
}

func (h *Handler) GetCategory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	c, err := h.service.GetCategory(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "category not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to get category", err)
		return
	}
	httpx.WriteJSON(w, 200, c)
}

func (h *Handler) ListCategories(w http.ResponseWriter, r *http.Request) {
	del := r.URL.Query().Get("deleted")
	filter := Filter{}
	if del == "true" {
		filter.Deleted = true
	} else {
		filter.Deleted = false
	}

	categories, err := h.service.ListCategories(r.Context(), filter)
	if err != nil {
		httpx.WriteError(w, r, 500, "failed to list categories", err)
		return
	}
	httpx.WriteJSON(w, 200, categories)
}

func (h *Handler) ListCategoriesWithSubcategories(w http.ResponseWriter, r *http.Request) {
	include := r.URL.Query().Get("include")
	if include != "subcategories" {
		h.ListCategories(w, r)
		return
	}

	del := r.URL.Query().Get("deleted")
	filter := Filter{}
	if del == "true" {
		filter.Deleted = true
	} else {
		filter.Deleted = false
	}

	categories, err := h.service.ListCategoriesWithSubcategories(r.Context(), filter)
	if err != nil {
		httpx.WriteError(w, r, 500, "failed to list categories", err)
		return
	}
	httpx.WriteJSON(w, 200, categories)
}

func (h *Handler) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	req, err := httpx.DecodeJSON[CategoryReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	c, err := h.service.UpdateCategory(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "category not found", err)
			return
		}
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to update category", err)
		return
	}
	httpx.WriteJSON(w, 200, c)
}

func (h *Handler) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	err := h.service.DeleteCategory(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "category not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to delete category", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) CreateSubcategory(w http.ResponseWriter, r *http.Request) {
	req, err := httpx.DecodeJSON[SubcategoryReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	sd, err := h.service.CreateSubcategory(r.Context(), req)
	if err != nil {
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		if errors.Is(err, ErrDuplicate) {
			httpx.WriteError(w, r, 409, "subcategory already exists", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to create subcategory", err)
		return
	}
	httpx.WriteJSON(w, 201, sd)
}

func (h *Handler) GetSubcategory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	sd, err := h.service.GetSubcategory(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "subcategory not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to get subcategory", err)
		return
	}
	httpx.WriteJSON(w, 200, sd)
}

func (h *Handler) ListSubcategories(w http.ResponseWriter, r *http.Request) {
	del := r.URL.Query().Get("deleted")
	filter := Filter{}
	if del == "true" {
		filter.Deleted = true
	} else {
		filter.Deleted = false
	}
	subcategories, err := h.service.ListSubcategories(r.Context(), filter)
	if err != nil {
		httpx.WriteError(w, r, 500, "failed to list subcategories", err)
		return
	}
	httpx.WriteJSON(w, 200, subcategories)
}

func (h *Handler) UpdateSubcategory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	req, err := httpx.DecodeJSON[SubcategoryReq](r.Body)
	if err != nil {
		httpx.WriteError(w, r, 400, "invalid request", err)
		return
	}

	sd, err := h.service.UpdateSubcategory(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "subcategory not found", err)
			return
		}
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to update subcategory", err)
		return
	}
	httpx.WriteJSON(w, 200, sd)
}

func (h *Handler) DeleteSubcategory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	err := h.service.DeleteSubcategory(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "subcategory not found", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to delete subcategory", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) RestoreCategory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	err := h.service.RestoreCategory(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "category not found", err)
			return
		}
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to restore category", err)
		return
	}
	httpx.WriteJSON(w, 200, "ok")
}

func (h *Handler) RestoreSubcategory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httpx.WriteError(w, r, 400, "id required", nil)
		return
	}

	err := h.service.RestoreSubcategory(r.Context(), id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			httpx.WriteError(w, r, 404, "subcategory not found", err)
			return
		}
		if errors.Is(err, ErrInvalidField) {
			httpx.WriteError(w, r, 400, "invalid field", err)
			return
		}
		httpx.WriteError(w, r, 500, "failed to restore subcategory", err)
		return
	}
	httpx.WriteJSON(w, 200, "ok")
}
