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

```mermaid
erDiagram
    PROVINCIAS {
        serial      id      PK
        varchar_100 nombre  UK "UNIQUE NOT NULL"
        decimal_9_6 lat        "NOT NULL"
        decimal_9_6 lng        "NOT NULL"
    }
    JUEGOS {
        serial     id      PK
        varchar_50 nombre  UK "UNIQUE NOT NULL"
    }
    TICKETS_MENSUALES {
        serial       id           PK
        integer      provincia_id FK "NOT NULL"
        integer      juego_id     FK "NOT NULL"
        date         fecha           "NOT NULL — primer día del mes"
        integer      cantidad        "NOT NULL"
        decimal_14_2 ingresos        "NOT NULL"
        decimal_14_2 costo           "NOT NULL"
    }

    PROVINCIAS_JUEGOS {
        integer provincia_id FK "NOT NULL"
        integer juego_id     FK "NOT NULL"
    }

    PROVINCIAS ||--o{ TICKETS_MENSUALES : "provincia_id"
    JUEGOS     ||--o{ TICKETS_MENSUALES : "juego_id"
    PROVINCIAS ||--o{ PROVINCIAS_JUEGOS : "provincia_id"
    JUEGOS     ||--o{ PROVINCIAS_JUEGOS : "juego_id"
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

### `betix.provincias_juegos`

Tabla de asociación muchos-a-muchos entre provincias y juegos. Registra explícitamente qué juegos están habilitados en cada provincia.

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `provincia_id` | `INTEGER` | PK parcial, FK → `provincias.id` NOT NULL |
| `juego_id` | `INTEGER` | PK parcial, FK → `juegos.id` NOT NULL |

Clave primaria compuesta: `(provincia_id, juego_id)`.

---

## Archivos

| Archivo | Propósito |
|---------|-----------|
| `db/migrations/001_init.sql` | DDL: CREATE SCHEMA + CREATE TABLE (idempotente) |
| `db/seeds/_provincias.csv` | 10 provincias con lat/lng |
| `db/seeds/_juegos.csv` | 3 juegos |
| `db/seeds/_tickets_mensuales.csv` | 360 registros (30 combinaciones × 12 meses) |
| `db/seeds/provincias_juegos` | Combinaciones iniciales (derivadas de tickets_mensuales al cargar) |
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
3. Carga los CSVs en orden: `provincias` → `juegos` → `tickets_mensuales` → `provincias_juegos (derivado de tickets_mensuales)`

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
