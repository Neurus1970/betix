# Reporte de Sub-Agentes — Betix

**Fecha:** 2026-03-12
**Contexto:** Exploración del estado actual del repo previo a la implementación de BETIX-30 y BETIX-31.

---

## Agente Microservices (`core/` + `src/`)

### Versiones
| Servicio | Versión |
|----------|---------|
| `core/` (betix-core, Python/Flask) | 1.1.0 |
| `src/` (betix-api, Node.js/Express) | 1.1.0 |

### Endpoints — betix-core (Flask, puerto 5000)

| Método | Path | Descripción |
|--------|------|-------------|
| `GET` | `/healthz` | Health check. Consulta `SELECT COUNT(*) FROM betix.provincias`. Devuelve `status`, `component`, `timestamp`, `dependencies.postgresql`. 503 si unhealthy. |
| `GET` | `/geodata` | Estadísticas agregadas por provincia (cantidad, ingresos, costos, beneficios por juego). Delega a `geodata_service.get_geodata()`. |
| `GET` | `/proyectado` | Proyecciones estadísticas. Modo all-data (sin params) o filtrado (`?provincia=&juego=&meses=`). SMA 3 meses con bandas de error crecientes (`std × (1 + 0.15 × month_index)`). `meses` acotado a [1,6]. |

### Endpoints — betix-api (Express, puerto 3000)

| Método | Path | Descripción |
|--------|------|-------------|
| `GET` | `/healthz` | Health agregado: sondea `betix-core /healthz` + `redis.ping()`. 503 si alguna dependencia falla. |
| `GET` | `/api/datos/geodata` | Proxy a core `/geodata`. Usa `cacheMiddleware` (clave Redis por path + query params ordenados). |
| `GET` | `/api/datos/proyectado` | Proxy a core `/proyectado`. Estrategia all-data: MISS → fetch sin filtros → guarda `betix:proyectado:all` → filtra en memoria. HIT → filtra en memoria directamente. |
| `GET` | `/dashboard` | Sirve `src/public/dashboard.html`. |
| static | `/` | Sirve archivos desde `src/public/`. |

### Estructura de archivos

```
core/
├── main.py                    # Flask app + 3 route handlers
├── db.py                      # Connection pool lazy (psycopg_pool, min=1, max=10)
├── requirements.txt           # flask, psycopg[binary], psycopg-pool, pytest, pytest-cov
├── VERSION                    # 1.1.0
├── services/
│   ├── geodata_service.py     # Agregación SQL para datos del mapa
│   ├── proyecciones_service.py # Lógica SMA + helpers estadísticos
│   └── health_service.py      # Sonda de conectividad DB
└── data/
    ├── mock_data.py           # 30 registros base (10 provincias × 3 juegos)
    └── tickets_por_mes.py     # Genera 360 filas (30 × 12 meses) — actualmente no importado

src/
├── app.js                     # Express app, montaje de rutas, error handler
├── config.js                  # Carga env profiles (.env.dev / .env.uat / .env.pro)
├── cache.js                   # Wrapper ioredis (get/set/ping/isEnabled)
├── logger.js                  # Winston logger
├── VERSION                    # 1.1.0
├── routes/
│   ├── health.js              # GET /healthz
│   ├── geodata.js             # GET /api/datos/geodata (usa cacheMiddleware)
│   └── proyectado.js          # GET /api/datos/proyectado (caché gestionada en controller)
├── controllers/
│   ├── geodataController.js
│   └── proyectadoController.js # Estrategia all-data cache
└── middleware/
    └── cacheMiddleware.js     # Middleware Redis genérico para geodata
```

### Observaciones notables
- **`src/data/` no existe** — CLAUDE.md menciona "dos copias de mock data" (`src/data/` + `core/data/`), pero `src/data/` fue eliminado. Regla desactualizada.
- **`core/data/tickets_por_mes.py` no está importado** por ningún servicio — posible código legado.
- **Cache TTL default de 60s** — muy corto para un dashboard de estadísticas.
- **`core/db.py` es lazy** — el pool no falla en startup sino en el primer request si `BETIX_DB_URL` no está seteado.

### Dependencias
**Python (`core/requirements.txt`):** flask 3.1.1, psycopg[binary] 3.2.6, psycopg-pool 3.2.6, pytest 8.3.5, pytest-cov 6.1.0

**Node.js (`package.json`):** express ^4.18.2, ioredis ^5.10.0, winston ^3.19.0, node-fetch ^2.7.0 / jest ^29.7.0, @cucumber/cucumber ^12.7.0, nock ^13.5.4, supertest ^6.3.4

---

## Agente Testing (`tests/` + `features/` + `core/tests/`)

### Tests existentes — Jest (`tests/`)

| Archivo | Tests | Qué cubre |
|---------|-------|-----------|
| `health.test.js` | 3 | `GET /healthz`: 200 healthy, 503 con pgcode, 503 ECONNREFUSED |
| `dashboard.test.js` | 10 | HTML estático: status 200, Content-Type, presencia de IDs y referencias D3 |
| `geodata.test.js` | 6 | `GET /api/datos/geodata`: estructura, globalTotals, 10 provincias, campos lat/lng/games |
| `cache.test.js` | 4 | cache no-op, pass-through middleware, 502 por JSON inválido, proyectado sin params |
| `cacheMiddleware.test.js` | 5 | HIT, MISS, error Redis, construcción de clave con query params ordenados |
| `proyectado.test.js` | 9 | Estructura, meses default/custom/clamping, filtrado provincia/juego, campos error_* |
| `proyectadoCache.test.js` | 5 | Estrategia MISS→HIT: llamada sin params, filtrado en memoria, 400 combo inexistente |

### Tests existentes — Cucumber (`features/`)

| Feature | Scenarios | Qué cubre |
|---------|-----------|-----------|
| `dashboard.feature` | 8 | Accesibilidad HTML y presencia de elementos clave |
| `health.feature` | 1 | Solo happy path: 200 + `status: 'healthy'` |
| `geodata.feature` | 3 | globalTotals, campos, estructura de cada provincia |
| `proyectado.feature` | 8 | Estructura, meses, campos histórico/proyectado, listas de provincias/juegos |

### Tests existentes — pytest (`core/tests/`)

| Archivo | Tests | Qué cubre |
|---------|-------|-----------|
| `test_health.py` | 7 | `/healthz` con DB real, 503 RuntimeError, 503 OperationalError, pgcode |
| `test_geodata.py` | 6 | `/geodata` con DB real: estructura, 10 provincias, beneficio > 0 |
| `test_proyecciones.py` | 16 | Helpers estadísticos, SMA, fechas, error bands, invariante beneficio, filtered mode, clamping |

### Frameworks y configuración

| Framework | Versión | Config |
|-----------|---------|--------|
| Jest | ^29.7.0 | `testEnvironment: node`, `forceExit: true`, reporters: default + jest-junit |
| @cucumber/cucumber | ^12.7.0 | Profiles: `default` (pretty+JSON), `summary` (progress+JSON) |
| pytest | 8.3.5 | Sin archivo de configuración explícito — depende de flags en CLI |
| nock | ^13.5.4 | Intercepta `CORE_URL` (default `http://localhost:5000`) |

### Mocks / Nocks

- **Jest**: todos los archivos que llaman al core usan `nock(CORE_URL)` + `afterEach(() => nock.cleanAll())`
- **Cucumber `hooks.js`**: `BeforeAll` desactiva red real; `Before` registra 3 nocks con `.persist()` (healthz, geodata, proyectado)
- **pytest**: no hay mocks de red — tests contra DB real PostgreSQL seedeada

### Áreas sin cobertura
- `src/cache.js` con Redis habilitado real
- Escenarios Cucumber de unhealthy/503
- `src/logger.js` y `src/config.js`
- Lógica JavaScript del dashboard (D3.js)
- `_add_month` wrap de diciembre→enero en `proyecciones_service.py`

### Observaciones notables
- **Steps sin usar:** `mapa.steps.js` define 3 steps que ningún `.feature` invoca.
- **Fixture duplicado en 3 lugares:** provincias + juegos + datos mock copiados literalmente en `proyectado.test.js`, `proyectadoCache.test.js` y `features/support/hooks.js`.
- **`cache.test.js` mezcla responsabilidades:** cubre cache.js, cacheMiddleware.js y proyectadoController.
- **pytest sin `pytest.ini`:** comportamiento diferente entre `make test-core` y CI.
- **Mock de health en Cucumber incompleto:** `{ status: 'healthy' }` sin `component`, `timestamp`, `dependencies`.

---

## Agente Infra (`docker-compose` + `k8s/` + `terraform/` + `.github/workflows/`)

### docker-compose.yml

| Servicio | Imagen | Puerto host:container | Propósito |
|----------|--------|-----------------------|-----------|
| `db` | postgres:16-alpine | 5432:5432 | PostgreSQL |
| `db-seed` | postgres:16-alpine | — | One-shot seed runner |
| `redis` | redis:7-alpine | 6379:6379 | Caché |
| `core` | betix-core:latest | **5001**:5000 | Python/Flask |
| `api` | betix-api:latest | 3000:3000 | Node.js proxy |
| `frontend` | betix-frontend:latest | 8080:80 | nginx |

Cadena de dependencias: `db` (healthy) → `db-seed` (completed) → `core` (healthy) → `api` + `redis` (healthy) → `frontend`

### GitHub Actions Workflows

| Workflow | Trigger | Qué hace |
|----------|---------|----------|
| `ci-api.yml` | PR a main/develop; push con path filter | ESLint + Jest (coverage) + Cucumber |
| `ci-core.yml` | PR a main/develop; push path filter core/db/ | pytest con cobertura, servicio PostgreSQL |
| `build.yml` | Push a main; todos los PRs | SonarQube scan (ambos test suites) |
| `release.yml` | Push a main | Release Please (bump versiones + CHANGELOG) |
| `ai-pr-review.yml` | PR a **main** únicamente | Review con Claude AI, comenta en el PR |
| `jira-branch-to-in-progress.yml` | Creación de rama | Transiciona ticket a "In Progress" (ID 21) |
| `jira-close-on-merge.yml` | PR cerrado en main/develop | Done (ID 31) si merge, To Do (ID 11) si closed |

**Versiones de actions en uso:**

| Action | Versión actual |
|--------|---------------|
| `actions/checkout` | @v4 |
| `actions/setup-node` | @v4 |
| `actions/setup-python` | @v5 |
| `actions/upload-artifact` | @v4 |
| `actions/github-script` | @v7 |
| `googleapis/release-please-action` | @v4 |
| `SonarSource/sonarqube-scan-action` | @v6 |

### Kubernetes Manifests (namespace: betix)

| Recurso | Imagen | Réplicas | Puerto |
|---------|--------|----------|--------|
| Deployment `api` | betix-api:latest | 1 | 3000 |
| Deployment `core` | betix-core:latest | 1 | 5000 |
| Deployment `frontend` | betix-frontend:latest | 1 | 80 |
| Deployment `redis` | redis:7-alpine | 1 | 6379 |

Ingress `betix-ingress` (host: `betix.local`): `/api` → api:3000, `/healthz` → api:3000, `/` → frontend:80

### Terraform — AWS Resources

| Archivo | Recursos |
|---------|----------|
| `vpc.tf` | VPC 10.0.0.0/16, 2 subnets públicas, 2 privadas, IGW, NAT GW (1 AZ) |
| `eks.tf` | EKS cluster v1.31, node group t3.small (desired:2 min:1 max:3) |
| `ecr.tf` | 3 repos ECR (betix-core, betix-api, betix-frontend), scan_on_push, lifecycle 10 imgs |
| `rds.tf` | RDS PostgreSQL 16, private subnets, multi_az solo en pro |

### DB Schema

Tablas en schema `betix`: `provincias` (id, nombre, lat, lng), `juegos` (id, nombre), `tickets_mensuales` (id, provincia_id, juego_id, fecha, cantidad, ingresos, costo). `beneficio` se computa en query.

### Issues críticos identificados

| Severidad | Área | Problema |
|-----------|------|----------|
| **Alta** | Terraform | `rds.tf` referencia `aws_security_group.eks_nodes` que no existe en `eks.tf` → `terraform plan` falla |
| **Alta** | k8s | `core-deployment.yaml` sin `BETIX_DB_URL` → core no conecta a DB en el cluster |
| **Media** | k8s | Sin resource limits/requests en ningún Deployment (viola regla de `k8s/CLAUDE.md`) |
| **Media** | k8s | `imagePullPolicy: IfNotPresent` + tag `latest` → no se actualizan imágenes automáticamente |
| **Media** | Terraform | Backend remoto (S3 + DynamoDB) comentado — solo estado local |
| **Baja** | k8s | `frontend-deployment.yaml` sin `readinessProbe` |
| **Baja** | CI | `ai-pr-review.yml` solo corre en PRs a `main`, no `develop` |

---

## Agente Frontend (`frontend/` + `src/public/`)

### Versión
`frontend/VERSION`: 1.0.0

### Estructura
```
frontend/
├── Dockerfile       # FROM nginx:1.27-alpine, build multi-stage
├── nginx.conf       # Puerto 80, /api/ → proxy api:3000
└── VERSION          # 1.0.0

src/public/
├── dashboard.html   # SPA completa (~1600 líneas) — HTML + CSS inline + JS inline
└── argentina.geojson # GeoJSON provincias argentinas para mapa choropleth
```

### Visualizaciones D3.js (5 tabs)

| Tab | Visualización | Datos consumidos |
|-----|---------------|-----------------|
| 1 — Mapa & Torta | Choropleth map (`d3.geoMercator`) + donut/pie interactivo | `/api/datos/geodata` |
| 2 — Sunburst | Jerarquía partición D3 (provincia → juego) | `/api/datos/geodata` |
| 3 — Sankey | Flujo provincias → juegos (`d3-sankey`) | `/api/datos/geodata` |
| 4 — Tabla | Tabla sorteable con búsqueda y export CSV | `/api/datos/geodata` |
| 5 — Proyecciones | Línea temporal histórico + SMA proyectado + banda de error | `/api/datos/proyectado` |

### nginx config
- Puerto 80, document root `/usr/share/nginx/html`
- `/api/` → `http://api:3000` (reverse proxy)
- `/healthz` → `http://api:3000`
- Assets estáticos (html, css, js, json, geojson) → `try_files` desde disco

### Issues identificados

| Severidad | Problema |
|-----------|----------|
| **Media** | CDN sin SRI: d3.js y d3-sankey sin atributos `integrity` |
| **Media** | "Todas las provincias" en proyecciones: dispara N fetches paralelos desde browser — no escala |
| **Baja** | Todo el código en un solo archivo (1600 líneas) — sin minificación ni cache-busting |
| **Baja** | `console.error` en línea 1524 — inconsistente con política de no `console.log` |
| **Baja** | `meses` default en UI (3) no coincide con default de core (1) si se llama directamente |
| **Info** | Sin redirect `/` → `/dashboard` |
