package cache

import (
	"context"
	"sync"
	"time"
)

// FetchFunc obtiene el valor del recurso.
type FetchFunc[T any] func(ctx context.Context) (T, error)

// Options configura el comportamiento del recurso.
type Options struct {
	TTL             time.Duration
	RefreshInterval time.Duration
	AllowStale      bool
}

// Resource es una entrada de caché genérica, auto-refrescable.
type Resource[T any] struct {
	opts  Options
	fetch FetchFunc[T]

	mu        sync.Mutex
	value     T
	fetchedAt time.Time
	expiresAt time.Time
	lastErr   error
}

func New[T any](opts Options, fetch FetchFunc[T]) *Resource[T] {
	return &Resource[T]{opts: opts, fetch: fetch}
}

// Get devuelve el valor, refrescando si es necesario.
func (r *Resource[T]) Get(ctx context.Context) (T, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if time.Now().Before(r.expiresAt) {
		return r.value, nil // válido
	}
	if r.opts.AllowStale && !r.fetchedAt.IsZero() {
		go r.doFetch(context.Background()) // refrescar sin bloquear
		return r.value, nil
	}
	return r.doFetch(ctx)
}

// Warmup precarga el valor bloqueando hasta obtenerlo.
func (r *Resource[T]) Warmup(ctx context.Context) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	_, err := r.doFetch(ctx)
	return err
}

// StartRefresh lanza un goroutine que refresca según RefreshInterval.
func (r *Resource[T]) StartRefresh(ctx context.Context) {
	if r.opts.RefreshInterval <= 0 {
		return
	}
	go func() {
		ticker := time.NewTicker(r.opts.RefreshInterval)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				r.mu.Lock()
				r.doFetch(context.Background()) //nolint:errcheck
				r.mu.Unlock()
			case <-ctx.Done():
				return
			}
		}
	}()
}

// Invalidate fuerza un nuevo fetch en la próxima llamada.
func (r *Resource[T]) Invalidate() {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.expiresAt = time.Time{}
}

// Refresh fuerza un fetch inmediato y devuelve el nuevo valor.
func (r *Resource[T]) Refresh(ctx context.Context) (T, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.expiresAt = time.Time{} // forzar expiración para evitar re-check
	return r.doFetch(ctx)
}

// doFetch llama a fetch y actualiza el estado. Debe llamarse con mu tomado.
func (r *Resource[T]) doFetch(ctx context.Context) (T, error) {
	// re-check dentro del lock (evita thundering herd)
	if time.Now().Before(r.expiresAt) {
		return r.value, nil
	}

	value, err := r.fetch(ctx)
	if err != nil {
		r.lastErr = err
		if r.opts.AllowStale && !r.fetchedAt.IsZero() {
			return r.value, nil // stale preferible a error
		}
		var zero T
		return zero, err
	}

	now := time.Now()
	r.value, r.fetchedAt, r.expiresAt, r.lastErr =
		value, now, now.Add(r.opts.TTL), nil
	return value, nil
}
