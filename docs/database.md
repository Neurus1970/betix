# Base de datos — Modelo de datos Betix

## Tecnología

PostgreSQL 16. Schema: `betix`.

La conexión se configura exclusivamente a través de la variable de entorno `BETIX_DB_URL` con un DSN estándar:

```
postgresql://user:password@host:port/dbname
```

El servidor Flask falla con un mensaje claro al iniciar si `BETIX_DB_URL` no está definida.

---

## Modelo entidad-relación

```
provincias          juegos
──────────          ──────
id (PK)             id (PK)
nombre (UNIQUE)     nombre (UNIQUE)
lat
lng
    │                   │
    └────────┬───────────┘
             │
    tickets_mensuales
    ─────────────────
    id (PK)
    provincia_id (FK → provincias.id)
    juego_id     (FK → juegos.id)
    fecha        DATE  ← primer día del mes
    cantidad     INTEGER
    ingresos     DECIMAL(14,2)
    costo        DECIMAL(14,2)
    [UNIQUE (provincia_id, juego_id, fecha)]
```

> `beneficio` no se persiste. Se calcula en query como `ingresos - costo`.

---

## Tablas

### `betix.provincias`

Catálogo de provincias con coordenadas geográficas del centroide.

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `SERIAL` | PK |
| `nombre` | `VARCHAR(100)` | UNIQUE NOT NULL |
| `lat` | `DECIMAL(9,6)` | NOT NULL |
| `lng` | `DECIMAL(9,6)` | NOT NULL |

### `betix.juegos`

Catálogo de tipos de juego.

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `SERIAL` | PK |
| `nombre` | `VARCHAR(50)` | UNIQUE NOT NULL |

Valores de referencia: `Lotería`, `Quiniela`, `Raspadita`.

### `betix.tickets_mensuales`

Serie temporal de apuestas por provincia, juego y mes.

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `SERIAL` | PK |
| `provincia_id` | `INTEGER` | FK → `provincias.id` NOT NULL |
| `juego_id` | `INTEGER` | FK → `juegos.id` NOT NULL |
| `fecha` | `DATE` | NOT NULL — primer día del mes (ej. `2025-03-01`) |
| `cantidad` | `INTEGER` | NOT NULL |
| `ingresos` | `DECIMAL(14,2)` | NOT NULL |
| `costo` | `DECIMAL(14,2)` | NOT NULL |

Índice compuesto: `(provincia_id, juego_id, fecha)` UNIQUE.

---

## Archivos

| Archivo | Propósito |
|---------|-----------|
| `db/migrations/001_init.sql` | DDL: CREATE SCHEMA + CREATE TABLE (idempotente) |
| `db/seeds/_provincias.csv` | 10 provincias con lat/lng |
| `db/seeds/_juegos.csv` | 3 juegos |
| `db/seeds/_tickets_mensuales.csv` | 360 registros (30 combinaciones × 12 meses) |
| `db/load_data.sh` | Script de carga: trunca + recarga desde CSVs |

---

## Carga de datos

### Primera vez (o recarga completa)

```bash
BETIX_DB_URL=postgresql://betix:betix@localhost:5432/betix ./db/load_data.sh
```

El script:
1. Ejecuta las migraciones (idempotente — `IF NOT EXISTS`)
2. Trunca todas las tablas (`RESTART IDENTITY CASCADE`)
3. Carga los CSVs en orden: `provincias` → `juegos` → `tickets_mensuales`

### Con docker-compose

El servicio `db-seed` ejecuta automáticamente la carga al hacer `make up`.

---

## Estrategia por entorno

| Entorno | Motor | Variable |
|---------|-------|----------|
| `dev` | PostgreSQL en Docker Compose (servicio `db`) | `BETIX_DB_URL` en `.env.dev` |
| `uat` | PostgreSQL SaaS (Neon, Supabase, RDS) | `BETIX_DB_URL` en `.env.uat` |
| `pro` | RDS PostgreSQL en AWS (Terraform: `terraform/rds.tf`) | `BETIX_DB_URL` como secret de Kubernetes |

---

## Acceso desde el código

El módulo `core/db.py` expone `get_connection()`, que devuelve una conexión del pool (psycopg3). Los servicios lo usan como context manager:

```python
from ..db import get_connection

with get_connection() as conn:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT ...")
        rows = cur.fetchall()
```

Sin ORM. Queries SQL directas.
