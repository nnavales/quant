# AGENTS.md - Summit Development Guide

## 1. Project Overview

Summit is a local-first personal finances dashboard with a Go backend and SQLite database.

Focus:
* Privacy
* Local-first data
* No cloud dependency

**Tech Stack:**
* Go
* SQLite3
* Goose (migrations)
* REST API
* React Native
* Modular Monolith architecture

---

## 2. Project Structure
* `api/` → Backend (Go)
* `app/` → Frontend (React Native + Expo)
* `migrations/` → Database migrations
* `scripts/` → Utility scripts

---

# ========================

# BACKEND (Go)

# ========================

## 3. Core Conventions

### Types and Structs

* Use pointers for optional values: `*string`
* Use ULIDs for all IDs:
  `github.com/oklog/ulid/v2`

---

### Error Handling

* Return errors instead of logging (except top-level handlers)
* Wrap errors with context:
  `fmt.Errorf("failed to create task: %w", err)`

```go
var (
    ErrNotFound     = errors.New("resource not found")
    ErrInvalidInput = errors.New("invalid input")
)
```

* Return consistent JSON error format (`./api/transport/httpx/httpx.go`)
 
---

### API Design

* RESTful conventions:
  `GET /api/tasks`
* Plural nouns
* Proper HTTP methods
* Status codes:

  * 200, 201, 204
  * 400, 404, 500

---

### Database

Inspect schema:

```bash
sqlite3 ./summit.db ".schema"
```

---

## 4. Component Creation Rules
When creating a new resource (Notes, Tasks, etc):

### 4.1 Domain (`domain.go`)
* Define entity struct
* Define errors
* Define repository interface
* Define DTOs if needed

---

### 4.2 Repository (`repository.go`)
* Implement interface
* Use `context.Context`
* Use `ExecContext`, `QueryContext`
* Handle `sql.ErrNoRows`

---

### 4.3 Service (`service.go`)
* Business logic layer
* Use context
* Wrap errors
* Support partial updates

---

### 4.4 Handler (`handler.go`)
* HTTP layer
* Use `r.Context()`
* Return proper status codes
* Use `httpx.WriteJSON` / `WriteError`
* Return generic error messages

---

### 4.5 Routes (`routes.go`)
* Register routes
* Use plural naming
* Use path params (`/tasks/{id}`)

---

### 4.6 Request/Response
```go
type noteReq struct {
    Title   *string `json:"title,omitempty"`
    Content *string `json:"content,omitempty"`
}
```

* Support partial updates

---

Perfecto. Te dejo una versión **refinada, consistente y orientada a agentes**, eliminando ambigüedad y cubriendo los huecos críticos.

---

# ========================

# FRONTEND (React - Tauri - Bun)

# ========================

## 5. Tech Stack

* React + Vite
* TypeScript
* Axios (HTTP client)
* React Query (**REQUIRED** for client-side data fetching)
* CSS Variables (via centralized theme system)

---

## 6. Project Structure

```
app/src/
├── api_client/          # Axios client + endpoints + types
│   ├── client.ts        # Axios instance (baseURL, interceptors)
│   ├── endpoints.ts     # API endpoint functions grouped by resource
│   ├── types.ts         # Shared API types ONLY
│   └── index.ts         # Public exports
├── hooks/               # React Query hooks (useX pattern)
├── components/          # React components
│   └── ui/              # Generic reusable UI components
├── pages/               # Page-level components
├── styles/              # Theme system
│   ├── colors.ts
│   ├── fonts.ts
│   ├── theme.ts
│   └── index.ts
└── App.tsx
```

---

## 7. API Layer (STRICT)

### 7.1 Rules

* All HTTP requests **MUST** use Axios
* `fetch` is **FORBIDDEN**
* API logic **MUST NOT** exist outside `api_client/`
* Endpoints **MUST** be grouped by resource

---

### 7.2 Client (`api_client/client.ts`)

```ts
import axios from "axios";

export const api = axios.create({
    baseURL: "http://localhost:3000",
});
```

* Interceptors MUST be defined here (auth, error normalization, etc.)

---

### 7.3 Endpoints (`api_client/endpoints.ts`)

```ts
export const transactions = {
    list: (filters) => api.get("/transactions", { params: filters }),
    get: (id: string) => api.get(`/transactions/${id}`),
    create: (data) => api.post("/transactions", data),
    update: (id: string, data) => api.patch(`/transactions/${id}`, data),
    delete: (id: string) => api.delete(`/transactions/${id}`),
};
```

---

### 7.4 Types (`api_client/types.ts`)

* All API-related types MUST live here
* Creating a global `types/` folder is **FORBIDDEN**

---

## 8. Data Fetching (STRICT)

### 8.1 Core Rule

* All client-side data fetching **MUST** use React Query

---

### 8.2 Architecture

```
Components → Hooks (React Query) → API Layer (Axios)
```

---

### 8.3 Forbidden Patterns

* Using `fetch`
* Using `axios` inside components
* Using `axios` or `fetch` inside `useEffect`
* Fetching data directly in components
* Managing loading/error state manually with `useState`

---

### 8.4 Exceptions (ONLY these)

React Query is NOT required for:

* Non-HTTP async logic (WebSockets, Tauri APIs, event listeners)
* One-off side effects not tied to UI state
* App initialization outside React lifecycle

---

### 8.5 Query Key Convention

All query keys MUST follow:

```
["resource"]
["resource", params]
["resource", id]
```

Examples:

```ts
["transactions"]
["transactions", filters]
["transaction", id]
```

* Keys MUST be stable and serializable
* Objects in keys MUST NOT be recreated unnecessarily

---

### 8.6 Hooks Pattern

```ts
// hooks/useTransactions.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactions } from "@/api_client";

export function useTransactions(filters) {
    return useQuery({
        queryKey: ["transactions", filters],
        queryFn: () => transactions.list(filters).then(r => r.data),
    });
}

export function useCreateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => transactions.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
        },
    });
}
```

---

### 8.7 Naming Rules

* Endpoint group: `transactions`
* Hook: `useTransactions`
* Single resource: `useTransaction`

Names MUST stay consistent across layers.

---

### 8.8 Error Handling

* Errors MUST be handled via React Query
* Components MUST use:

  * `isLoading`
  * `isError`
  * `error`
* `try/catch` inside components is **FORBIDDEN**

---

## 9. Styling (STRICT)

### 9.1 Theme Usage

* ALWAYS import from `@/styles/`
* NEVER use raw CSS variables

```ts
// ✓ CORRECT
import { colors, spacing } from "@/styles";

<div style={{ color: colors.fg.default, padding: spacing[4] }} />
```

```ts
// ✗ FORBIDDEN
<div style={{ color: "var(--fg-default)" }} />
```

---

### 9.2 Inline Styles

Allowed ONLY if:

* Style is component-specific
* Value does not exist in theme

---

### 9.3 Style Imports

```ts
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { theme, spacing, radius, shadows } from "@/styles/theme";
```

---

## 10. UI Components

* Located ONLY in `@/components/ui/`
* Must be **highly reusable and generic**

Examples:

* Button
* Input
* Modal
* Card
* Select

---

## 11. Components (STRICT)

```ts
export function TransactionsPage() {
    const { data, isLoading, isError } = useTransactions(filters);
    const createMutation = useCreateTransaction();

    if (isLoading) return <Loading />;
    if (isError) return <ErrorState />;

    return (
        <TransactionList
            data={data}
            onCreate={createMutation.mutate}
        />
    );
}
```

---

### Rules

* Components MUST NOT fetch data
* Components MUST receive data via props or hooks
* Mutations MUST be handled via hooks
* No business logic inside UI components


