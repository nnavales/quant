# API Macro - Documentación de Endpoints

## Sistema de Cache

Todos los endpoints (excepto IPC) utilizan un sistema de cache en memoria conTTL y auto-refresh.

### TTL por Recurso

| Recurso | TTL | Refresh Interval |
|---------|-----|------------------|
| dollarSeriesSell | 15 min | 5 min |
| dollarSeriesBuy | 15 min | 5 min |
| inflation | 24h | 12h |
| countryRisk | 180 min | 60 min |
| btcSeries | 15 min | 5 min |
| ethSeries | 15 min | 5 min |
| usdtSeries | 15 min | 5 min |
| dollarsBankMap | 15 min | 5 min |
| fixedDepositsMap | 300 min | 180 min |
| yieldsMap | 300 min | 180 min |
| loansMap | 300 min | 180 min |

### Forzar Refresh

Todos los endpoints aceptan el parámetro `refresh` para forzar una actualización inmediata:

```
GET /api/macro/inflation?refresh=true
```

Si `refresh=true`, el servidor realizará un fetch fresco de la API ignorando el cache.

---

## Endpoints

### 1. IPC (Índice de Precios al Consumidor)

- **Endpoint**: `GET /economic/ipc`
- **Descripción**: Obtiene la serie histórica del IPC (Índice de Precios al Consumidor) de Argentina.
- **Query Params**: Ninguno.
- **Body**: No requiere.
- **Respuesta**:
```json
{
  "series": {
    "name": "IPC",
    "unit": "index",
    "points": [
      {
        "date": "2016-12-01",
        "value": 100.0
      }
    ]
  },
  "last": {
    "date": "2024-03-01",
    "value": 850.5
  },
  "delta": {
    "diff": 15.2,
    "pct": 1.82
  }
}
```

---

### 2. Inflación Mensual

- **Endpoint**: `GET /economic/inflation`
- **Descripción**: Obtiene la serie de inflación mensual calculada a partir del IPC.
- **Query Params**:
  - `refresh` (bool, opcional): Fuerza una actualización del cache. Valores: `true`. Por defecto: `false`.
- **Body**: No requiere.
- **Respuesta**:
```json
{
  "series": {
    "name": "Inflación mensual",
    "unit": "%",
    "points": [
      {
        "date": "2017-01-01",
        "value": 1.5
      }
    ]
  },
  "last": {
    "date": "2024-03-01",
    "value": 13.2
  },
  "delta": {
    "diff": 2.1,
    "pct": 18.9
  }
}
```

---

### 3. Dólar Histórico

- **Endpoint**: `GET /economic/dollar`
- **Descripción**: Obtiene la serie histórica de cotización del dólar oficial (BNA).
- **Query Params**:
  - `quotation` (string, opcional): Tipo de cotización. Valores: `buy` (compra) o `sell` (venta). Por defecto: `sell`.
  - `refresh` (bool, opcional): Fuerza una actualización del cache. Valores: `true`. Por defecto: `false`.
- **Body**: No requiere.
- **Respuesta**:
```json
{
  "series": {
    "name": "Dólar Oficial (venta)",
    "unit": "index",
    "points": [
      {
        "date": "2024-01-01",
        "value": 350.0
      }
    ]
  },
  "last": {
    "date": "2024-03-01",
    "value": 365.5
  },
  "delta": {
    "diff": 5.0,
    "pct": 1.38
  }
}
```

---

### 4. Valor del Dólar por Banco

- **Endpoint**: `GET /economic/dollar/banks`
- **Descripción**: Obtiene las cotizaciones actuales del dólar en diferentes bancos y entidades.
- **Query Params**:
  - `refresh` (bool, opcional): Fuerza una actualización del cache. Valores: `true`. Por defecto: `false`.
- **Body**: No requiere.
- **Respuesta**:
```json
{
  "bna": {
    "entity": "Banco de la Nación Argentina",
    "slug": "bna",
    "logo_url": "https://...",
    "buy": 350.0,
    "sell": 365.0,
    "pct_variation": 1.2,
    "updated_at": "2024-03-15T10:30:00Z"
  },
  "galicia": {
    "entity": "Banco Galicia",
    "slug": "galicia",
    "buy": 352.0,
    "sell": 368.0,
    "pct_variation": 1.5,
    "updated_at": "2024-03-15T10:30:00Z"
  }
}
```

---

### 5. Criptomonedas

- **Endpoint**: `GET /economic/crypto`
- **Descripción**: Obtiene la serie histórica de precios de criptomonedas (BTC, ETH, USDT).
- **Query Params**:
  - `symbol` (string, opcional): Símbolo de la criptomoneda. Valores: `btc`, `eth`, `usdt`. Por defecto: `usdt`.
  - `refresh` (bool, opcional): Fuerza una actualización del cache. Valores: `true`. Por defecto: `false`.
- **Body**: No requiere.
- **Respuesta**:
```json
{
  "series": {
    "name": "Crypto usdt",
    "unit": "index",
    "points": [
      {
        "date": "2024-03-01",
        "value": 850.0
      }
    ]
  },
  "last": {
    "date": "2024-03-15",
    "value": 875.5
  },
  "delta": {
    "diff": 10.0,
    "pct": 1.15
  }
}
```

---

### 6. Riesgo País

- **Endpoint**: `GET /economic/country-risk`
- **Descripción**: Obtiene el valor actual del riesgo país de Argentina (EMBI+).
- **Query Params**:
  - `refresh` (bool, opcional): Fuerza una actualización del cache. Valores: `true`. Por defecto: `false`.
- **Body**: No requiere.
- **Respuesta**:
```json
{
  "date": "2024-03-15",
  "value": 1800,
  "variation": 2.5
}
```

---

### 7. Plazos Fijos

- **Endpoint**: `GET /economic/fixed-deposits`
- **Descripción**: Obtiene las tasas de plazos fijos de diferentes bancos.
- **Query Params**:
  - `refresh` (bool, opcional): Fuerza una actualización del cache. Valores: `true`. Por defecto: `false`.
- **Body**: No requiere.
- **Respuesta**:
```json
{
  "bna": {
    "entity": "Banco de la Nación Argentina",
    "logo_url": "https://...",
    "slug": "bna",
    "tem": 6.5,
    "tea": 8.2,
    "tna": 7.8,
    "min_term": 30,
    "max_term": 365,
    "updated_at": "2024-03-15T10:30:00Z"
  },
  "galicia": {
    "entity": "Banco Galicia",
    "slug": "galicia",
    "tem": 7.0,
    "tea": 9.0,
    "tna": 8.5,
    "min_term": 30,
    "max_term": 180,
    "updated_at": "2024-03-15T10:30:00Z"
  }
}
```

---

### 8. Cuentas Remuneradas

- **Endpoint**: `GET /economic/yield-accounts`
- **Descripción**: Obtiene las tasas de cuentas remuneradas de diferentes bancos.
- **Query Params**:
  - `refresh` (bool, opcional): Fuerza una actualización del cache. Valores: `true`. Por defecto: `false`.
- **Body**: No requiere.
- **Respuesta**:
```json
{
  "uala": {
    "entity": "Uala",
    "logo_url": "https://...",
    "slug": "uala",
    "conditions": "Solo para clientes",
    "tem": 5.0,
    "tea": 6.1,
    "tna": 5.8,
    "daily_rate": 0.015,
    "limit": 150000,
    "updated_at": "2024-03-15T10:30:00Z"
  },
  "brubank": {
    "entity": "Brubank",
    "slug": "brubank",
    "tem": 5.2,
    "tea": 6.5,
    "tna": 6.0,
    "daily_rate": 0.016,
    "limit": 200000,
    "updated_at": "2024-03-15T10:30:00Z"
  }
}
```

---

### 9. Tasas de Préstamos Hipotecarios

- **Endpoint**: `GET /economic/loans`
- **Descripción**: Obtiene las tasas de préstamos hipotecarios UVA de diferentes bancos.
- **Query Params**:
  - `refresh` (bool, opcional): Fuerza una actualización del cache. Valores: `true`. Por defecto: `false`.
- **Body**: No requiere.
- **Respuesta**:
```json
{
  "banco-nación": {
    "entity": "Banco de la Nación Argentina",
    "name": "Banco Nación",
    "slug": "banco-nación",
    "tna": 4.5,
    "updated_at": "2024-03-15T10:30:00Z"
  },
  "galicia": {
    "entity": "Banco Galicia",
    "name": "Banco Galicia",
    "slug": "galicia",
    "tna": 5.2,
    "updated_at": "2024-03-15T10:30:00Z"
  }
}
```

---

## Tipos de Datos Comunes

### TimeSeriesPoint
```json
{
  "date": "2024-03-01",
  "value": 350.0
}
```

### TimeSeriesDelta
```json
{
  "diff": 15.2,
  "pct": 1.82
}
```

### EconomicSeriesResponse
```json
{
  "series": {
    "name": "string",
    "unit": "string",
    "points": []
  },
  "last": {},
  "delta": {}
}
```
