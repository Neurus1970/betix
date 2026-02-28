# Betix API

API de estadísticas de tickets de lotería por provincia y tipo de juego, con soporte de filtros por fecha.

## Tabla de contenidos

- [Instalación](#instalación)
- [Uso](#uso)
- [Endpoints](#endpoints)
  - [Health](#health)
  - [Estadísticas por Provincia](#estadísticas-por-provincia)
  - [Estadísticas por Juego](#estadísticas-por-juego)
  - [Resumen General](#resumen-general)
- [Filtros disponibles](#filtros-disponibles)
- [Pipeline CI/CD](#pipeline-cicd)

---

## Instalación

```bash
npm install
```

## Uso

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm start

# Tests
npm test
```

La API corre por defecto en `http://localhost:3000`.

---

## Endpoints

### Health

Verifica que el servicio esté activo.

```
GET /health
```

**Respuesta**
```json
{
  "status": "ok",
  "service": "betix-api"
}
```

---

### Estadísticas por Provincia

Retorna los tickets vendidos, ingresos, costos y rentabilidad agrupados por provincia.

```
GET /api/estadisticas/provincia
```

**Query params opcionales**

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `fechaDesde` | `YYYY-MM-DD` | Fecha de inicio del período | `2026-01-01` |
| `fechaHasta` | `YYYY-MM-DD` | Fecha de fin del período | `2026-01-31` |
| `juego` | string | Filtrar por tipo de juego | `Quiniela` |

**Ejemplos**

```bash
# Sin filtros
GET /api/estadisticas/provincia

# Solo Febrero 2026
GET /api/estadisticas/provincia?fechaDesde=2026-02-01&fechaHasta=2026-02-28

# Solo Quiniela en Enero
GET /api/estadisticas/provincia?fechaDesde=2026-01-01&fechaHasta=2026-01-31&juego=Quiniela
```

**Respuesta**
```json
{
  "status": "ok",
  "filtros": {
    "fechaDesde": "2026-01-01",
    "fechaHasta": "2026-01-31",
    "juego": "Quiniela"
  },
  "data": [
    {
      "provincia": "Buenos Aires",
      "totalTickets": 15200,
      "totalIngresos": 456000,
      "totalCosto": 310000,
      "rentabilidad": 32.02
    },
    {
      "provincia": "Córdoba",
      "totalTickets": 9800,
      "totalIngresos": 294000,
      "totalCosto": 200000,
      "rentabilidad": 31.97
    }
  ]
}
```

**Campos de respuesta**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `provincia` | string | Nombre de la provincia |
| `totalTickets` | number | Cantidad total de tickets vendidos |
| `totalIngresos` | number | Ingresos brutos en pesos |
| `totalCosto` | number | Costos totales en pesos |
| `rentabilidad` | number | Margen de rentabilidad en % `((ingresos - costo) / ingresos * 100)` |

---

### Estadísticas por Juego

Retorna los tickets vendidos, ingresos, costos y rentabilidad agrupados por tipo de juego.

```
GET /api/estadisticas/juego
```

**Query params opcionales**

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `fechaDesde` | `YYYY-MM-DD` | Fecha de inicio del período | `2026-02-01` |
| `fechaHasta` | `YYYY-MM-DD` | Fecha de fin del período | `2026-02-28` |

**Ejemplos**

```bash
# Sin filtros
GET /api/estadisticas/juego

# Solo Febrero 2026
GET /api/estadisticas/juego?fechaDesde=2026-02-01&fechaHasta=2026-02-28
```

**Respuesta**
```json
{
  "status": "ok",
  "filtros": {
    "fechaDesde": "2026-02-01",
    "fechaHasta": "2026-02-28"
  },
  "data": [
    {
      "juego": "Quiniela",
      "totalTickets": 41400,
      "totalIngresos": 1242000,
      "totalCosto": 844000,
      "rentabilidad": 32.05
    },
    {
      "juego": "Lotería",
      "totalTickets": 13900,
      "totalIngresos": 1390000,
      "totalCosto": 904000,
      "rentabilidad": 34.96
    },
    {
      "juego": "Raspadita",
      "totalTickets": 34000,
      "totalIngresos": 340000,
      "totalCosto": 277000,
      "rentabilidad": 18.53
    }
  ]
}
```

**Juegos disponibles**

| Juego | Descripción |
|-------|-------------|
| `Quiniela` | Apuestas de quiniela tradicional |
| `Lotería` | Lotería nacional |
| `Raspadita` | Tickets rasca y gana |

---

### Resumen General

Retorna el consolidado total de tickets, ingresos, costos y rentabilidad.

```
GET /api/estadisticas/resumen
```

**Query params opcionales**

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `fechaDesde` | `YYYY-MM-DD` | Fecha de inicio del período | `2026-01-01` |
| `fechaHasta` | `YYYY-MM-DD` | Fecha de fin del período | `2026-01-31` |
| `juego` | string | Filtrar por tipo de juego | `Lotería` |

**Ejemplos**

```bash
# Resumen total
GET /api/estadisticas/resumen

# Resumen de Enero 2026
GET /api/estadisticas/resumen?fechaDesde=2026-01-01&fechaHasta=2026-01-31

# Resumen de Lotería en todo el período
GET /api/estadisticas/resumen?juego=Lotería
```

**Respuesta**
```json
{
  "status": "ok",
  "filtros": {
    "fechaDesde": "2026-01-01",
    "fechaHasta": "2026-01-31"
  },
  "data": {
    "totalTickets": 105300,
    "totalIngresos": 3273000,
    "totalCosto": 2238000,
    "rentabilidad": 31.62
  }
}
```

---

## Filtros disponibles

Todos los endpoints de `/api/estadisticas/*` aceptan los mismos query params opcionales. Los filtros son acumulativos (se aplican con lógica `AND`).

| Parámetro | Tipo | Formato | Descripción |
|-----------|------|---------|-------------|
| `fechaDesde` | string | `YYYY-MM-DD` | Límite inferior de fecha (inclusive) |
| `fechaHasta` | string | `YYYY-MM-DD` | Límite superior de fecha (inclusive) |
| `juego` | string | texto exacto | Tipo de juego: `Quiniela`, `Lotería`, `Raspadita` |

Si no se aplica ningún filtro, se retornan todos los datos disponibles. Si los filtros no coinciden con ningún registro, `data` retorna un array vacío `[]` o zeros en el caso del resumen.

---

## Pipeline CI/CD

Cada Pull Request hacia `main` ejecuta automáticamente:

| Workflow | Descripción | Falla si... |
|----------|-------------|-------------|
| **CI** (`ci.yml`) | Lint + tests + cobertura | Tests fallan o cobertura < umbral |
| **SonarCloud** (`sonarcloud.yml`) | Análisis de calidad y seguridad | Quality Gate no se cumple |
| **AI Review** (`ai-pr-review.yml`) | Revisión y documentación con Claude | Error de conexión a API |

El merge a `main` solo está habilitado si los tres workflows pasan exitosamente.
