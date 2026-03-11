# BETIX-XX — Migración de datos estáticos a PostgreSQL

**Type:** Story
**Component:** `core/` · `infra/`
**Labels:** `architecture`, `database`, `backend`
**Priority:** High

---

## Descripción

Actualmente los datos de apuestas por provincia están hardcodeados en dos archivos Python:

- `core/data/mock_data.py` — snapshot estático (provincia × juego): cantidad, ingresos, costo.
- `core/data/tickets_por_mes.py` — serie temporal generada algorítmicamente a partir del snapshot anterior, aplicando factores estacionales y ruido determinístico.

Los centroides geográficos están hardcodeados en `core/services/geodata_service.py` como un diccionario `PROVINCE_COORDS`.

El objetivo de esta historia es reemplazar todos esos datos estáticos por lecturas desde una base de datos PostgreSQL, sin cambiar el contrato de los endpoints existentes.

---

## Modelo de datos propuesto

### Tabla `provincias`
Catálogo de provincias. Fuente: `PROVINCE_COORDS` en `geodata_service.py`.

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | `SERIAL` | PK |
| `nombre` | `VARCHAR(100)` | UNIQUE NOT NULL |
| `lat` | `DECIMAL(9,6)` | NOT NULL |
| `lng` | `DECIMAL(9,6)` | NOT NULL |

### Tabla `juegos`
Catálogo de tipos de juego. Fuente: valores distintos de `juego` en `mock_data.py` (`Quiniela`, `Lotería`, `Raspadita`).

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | `SERIAL` | PK |
| `nombre` | `VARCHAR(50)` | UNIQUE NOT NULL |

### Tabla `juegos_provincias`
Relación de disponibilidad: indica en qué provincias está habilitado cada juego. No todos los juegos operan en todas las provincias.

| Columna | Tipo | Restricciones |
|---|---|---|
| `juego_id` | `INTEGER` | FK → `juegos.id` NOT NULL |
| `provincia_id` | `INTEGER` | FK → `provincias.id` NOT NULL |

**PK compuesta:** `(juego_id, provincia_id)`.

> Se descarta el uso de `integer[]` (array nativo de PostgreSQL) porque no admite integridad referencial sobre sus elementos ni permite JOINs eficientes. La tabla intermedia es la solución normalizada estándar.

### Tabla `tickets_mensuales`
Serie temporal de apuestas. Fuente: `TICKETS_POR_MES` generado por `tickets_por_mes.py`.

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | `SERIAL` | PK |
| `provincia_id` | `INTEGER` | FK → `provincias.id` NOT NULL |
| `juego_id` | `INTEGER` | FK → `juegos.id` NOT NULL |
| `fecha` | `DATE` | NOT NULL (primer día del mes) |
| `cantidad` | `INTEGER` | NOT NULL |
| `ingresos` | `DECIMAL(14,2)` | NOT NULL |
| `costo` | `DECIMAL(14,2)` | NOT NULL |

**Índice compuesto:** `(provincia_id, juego_id, fecha)` UNIQUE.

**FK compuesta opcional:** `(juego_id, provincia_id)` → `juegos_provincias(juego_id, provincia_id)`. Garantiza que no se puedan cargar tickets de un juego no habilitado en esa provincia.

> `beneficio` no se persiste — se calcula en query como `ingresos - costo`, igual que hoy en el servicio.

### Diagrama de relaciones

```
provincias            juegos
──────────            ──────
id PK ◄───────────┐   id PK ◄───────────┐
nombre UNIQUE     │   nombre UNIQUE      │
lat               │                     │
lng               │   juegos_provincias  │
                  │   ─────────────────  │
                  └── provincia_id       │
                      juego_id ──────────┘
                      PK(juego_id, provincia_id)
                              │
                              │ (FK compuesta opcional)
                              ▼
                      tickets_mensuales
                      ─────────────────
                      id PK
                      provincia_id FK → provincias.id
                      juego_id     FK → juegos.id
                      fecha
                      cantidad
                      ingresos
                      costo
```

---

## Estrategia por entorno

| Entorno | Motor | Observaciones |
|---|---|---|
| `dev` | PostgreSQL en Docker Compose (servicio `db`) | `BETIX_DB_URL` en `.env.dev` |
| `uat` | PostgreSQL SaaS (ej. Supabase / Neon / RDS) | `BETIX_DB_URL` en `.env.uat` |
| `pro` | PostgreSQL SaaS | `BETIX_DB_URL` en `.env.pro` |

La conexión se resuelve exclusivamente por la variable de entorno `BETIX_DB_URL` (DSN estándar: `postgresql://user:pass@host:port/db`). El código no debe tener ningún default hardcodeado.

---

## Criterios de aceptación

```gherkin
Scenario: GET /api/datos/geodata retorna datos desde la base
  Given la base de datos contiene al menos una provincia con tickets
  When se llama a GET /api/datos/geodata
  Then el response incluye "provinces" con lat, lng y totales correctos
  And el campo "globalTotals" refleja la suma de todas las provincias

Scenario: GET /api/datos/proyectado retorna serie histórica desde la base
  Given existen registros en tickets_mensuales para 12 meses
  When se llama a GET /api/datos/proyectado?provincia=Salta&juego=Quiniela
  Then el response incluye una serie de 12 puntos históricos
  And los valores de beneficio son ingresos - costo para cada mes

Scenario: Solo se pueden cargar tickets de juegos habilitados en la provincia
  Given "Raspadita" no está habilitada en "Tierra del Fuego" en juegos_provincias
  When se intenta insertar un ticket de Raspadita para Tierra del Fuego
  Then la operación falla con un error de integridad referencial

Scenario: Entorno sin BETIX_DB_URL falla con error claro al iniciar
  Given la variable BETIX_DB_URL no está definida
  When se inicia el core Flask
  Then el proceso termina con un mensaje de error descriptivo
  And no se sirve ningún endpoint
```

---

## Tareas técnicas

1. **Migraciones** — crear script SQL (o usar Alembic) con `CREATE TABLE` para `provincias`, `juegos`, `juegos_provincias` y `tickets_mensuales`.
2. **Seeder** — script que carga los datos actuales de `mock_data.py` y `tickets_por_mes.py` como datos iniciales de desarrollo, incluyendo la población de `juegos_provincias` a partir de las combinaciones presentes en `mock_data.py`.
3. **Capa de acceso a datos** — módulo `core/db.py` que expone una conexión/pool (psycopg3 o SQLAlchemy Core). Sin ORM.
4. **Refactor de servicios** — reemplazar imports de `mock_data` / `tickets_por_mes` en `geodata_service.py` y `proyecciones_service.py` por queries SQL.
5. **Docker Compose** — agregar servicio `db` (imagen `postgres:16-alpine`) con volumen persistente y `healthcheck`.
6. **Variables de entorno** — documentar `BETIX_DB_URL` en `.env.dev.example`.
7. **Tests** — adaptar suite de pytest para levantar una base de test en memoria o un contenedor efímero (fixture de sesión).

---

## Fuera de scope

- ORM (SQLAlchemy models, Django ORM, etc.) — no se usa.
- Migraciones automáticas en runtime — las migraciones se corren manualmente o en pipeline CI.
- Cambios en el contrato de los endpoints o en la lógica de proyecciones SMA.
- Frontend / Node.js proxy — no se tocan.
