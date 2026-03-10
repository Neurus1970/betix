# CLAUDE.md — AI Assistant Guide for Betix

This file provides context for AI assistants working in this codebase. It documents architecture, conventions, and development workflows.

---

## Project Overview

**Betix** is a lottery ticket statistics platform for Argentine provinces. It visualizes ticket sales, revenue, and projections via interactive D3.js dashboards.

The system is a **monorepo** with three independent microservices:

| Service | Technology | Port | Responsibility |
|---------|-----------|------|---------------|
| `core/` | Python 3.12 + Flask | 5000 (5001 exposed) | Business logic, data aggregation, projections |
| `src/` | Node.js 18 + Express | 3000 | Thin HTTP proxy, static file serving |
| `frontend/` | nginx 1.27 Alpine | 80 (8080 exposed) | Static asset server, reverse proxy |

**Data:** All data is in-memory mock data — no external database. Two datasets exist in both Python (`core/data/`) and Node.js (`src/data/`).

---

## Repository Structure

```
betix/
├── src/                    # Node.js API (thin proxy)
│   ├── app.js              # Express entry point, routes, static pages
│   ├── config.js           # Profile-based config loader (.env.dev/uat/pro)
│   ├── logger.js           # Winston structured logging
│   ├── controllers/        # Thin request handlers (delegate to services)
│   ├── routes/             # Route definitions
│   ├── services/           # Business logic (proxying to core, SMA calculations)
│   ├── data/               # In-memory mock data (mockData.js, ticketsPorMes.js)
│   └── public/             # Static HTML + D3.js dashboards
├── core/                   # Python Flask microservice
│   ├── main.py             # Flask app entry point
│   ├── services/           # Python business logic
│   ├── data/               # In-memory mock data (mirrors src/data)
│   └── tests/              # pytest test suite
├── features/               # Cucumber BDD scenarios
│   ├── *.feature           # Gherkin feature files
│   ├── step_definitions/   # Step implementations
│   └── support/            # Hooks and world setup
├── tests/                  # Jest unit/integration tests
├── docs/                   # Architecture docs (C4 model, monorepo guide)
│   └── diagrams/           # Python scripts that generate architecture PNGs
├── k8s/                    # Kubernetes manifests (betix namespace)
├── terraform/              # AWS infrastructure (EKS, ECR, VPC)
├── .github/workflows/      # GitHub Actions CI/CD pipelines
├── .githooks/              # Git hooks (post-checkout installs deps)
├── Dockerfile              # Node.js API image (node:18-alpine)
├── docker-compose.yml      # Local multi-container orchestration
├── Makefile                # Unified build/test/deploy interface
├── package.json            # Node.js deps and Jest/Cucumber config
└── cucumber.js             # Cucumber profiles configuration
```

---

## Running Locally

### Option 1: Docker Compose (recommended)

```bash
make up       # docker-compose up --build (all 3 services)
make down     # docker-compose down
make logs     # tail all service logs
```

Access: `http://localhost:8080`

### Option 2: Manual (3 terminals)

```bash
# Terminal 1 — Python core
cd core && python3 -m core.main

# Terminal 2 — Node.js API
npm install
NODE_ENV=dev npm run dev

# Terminal 3 — Static frontend (optional)
# Serve src/public/ with any HTTP server or open HTML files directly
```

---

## Environment Configuration

Configuration is profile-based. `NODE_ENV` selects the profile:

| Profile | `NODE_ENV` | File | Log Level | Log Output |
|---------|-----------|------|-----------|-----------|
| Development | `dev` | `.env.dev` | debug | console |
| UAT/QA | `uat` | `.env.uat` | info | both |
| Production | `pro` | `.env.pro` | warn | file |

**Key environment variables:**

```
BETIX_PORT=3000           # Express server port
BETIX_LOG_LEVEL=debug     # winston log level
BETIX_LOG_OUTPUT=console  # console | file | both
BETIX_LOG_FILE=logs/betix.log
CORE_URL=http://localhost:5000   # upstream Flask URL
CORE_PORT=5000            # Flask port
```

---

## Testing

### Run All Tests

```bash
make test             # pytest + jest + cucumber
```

### Node.js Tests

```bash
npm test              # Jest + Cucumber (summary mode)
npm run test:ci       # Jest with coverage (CI mode)
npm run test:functional       # Cucumber pretty format
npm run test:functional:ci    # Cucumber JUnit XML output
make test-api         # All Node.js tests via Makefile
```

Test files: `tests/*.test.js` (Jest/Supertest, 5 suites, ~41 tests)
Feature files: `features/*.feature` (Cucumber, 5 files, ~33 scenarios)

### Python Tests

```bash
python3 -m pytest core/tests/ -v
make test-core
```

Test files: `core/tests/test_*.py` (27 tests)

### Test Output Locations

- Jest JUnit: `test-results/junit.xml`
- Cucumber JSON: `test-results/cucumber-report.json`
- Jest coverage: `coverage/`

---

## Linting

```bash
npm run lint      # ESLint on src/ and tests/
make lint
```

ESLint config (`.eslintrc.json`): Node.js + ES2021 + Jest env, recommended rules, single quotes, semicolons required, no unused vars.

---

## API Endpoints

All endpoints served from the Node.js API on port 3000:

### `GET /healthz`
Proxies to `GET /health` on the Python core.
```json
{ "status": "healthy" }
```

### `GET /api/datos/geodata`
Returns provincial statistics with coordinates for choropleth maps.
```json
{
  "status": "ok",
  "data": {
    "globalTotals": { "cantidad": 0, "importe": 0, "beneficio": 0 },
    "provinces": [
      {
        "provincia": "Buenos Aires",
        "lat": -34.61,
        "lng": -58.38,
        "totals": { "cantidad": 0, "importe": 0, "beneficio": 0 },
        "games": [{ "juego": "Lotería", "cantidad": 0, "importe": 0, "beneficio": 0 }]
      }
    ]
  }
}
```

### `GET /api/datos/proyectado?provincia=X&juego=Y&meses=K`
Returns historical data + SMA rolling projections with error bands.

Query parameters:
- `provincia` — Argentine province name (default: first alphabetically)
- `juego` — Game: `Lotería`, `Quiniela`, or `Raspadita` (default: first alphabetically)
- `meses` — Months to project: 1–4 (default: 1)

```json
{
  "status": "ok",
  "data": {
    "historico": [{ "fecha": "2025-03", "cantidad": 0, "ingresos": 0, "costo": 0, "beneficio": 0 }],
    "proyectado": [{ "fecha": "2026-03", "cantidad": 0, "error_cantidad": 0, "ingresos": 0, "error_ingresos": 0 }],
    "provincias": ["Buenos Aires", "..."],
    "juegos": ["Lotería", "Quiniela", "Raspadita"],
    "provincia": "Buenos Aires",
    "juego": "Lotería",
    "meses": 1
  }
}
```

---

## Frontend Pages

Served by Node.js on port 3000 (proxied through nginx on port 8080):

| Route | File | Description |
|-------|------|-------------|
| `/dashboard` | `src/public/dashboard.html` | Static D3.js choropleth map |
| `/dashboard-interactivo` | `src/public/dashboard-interactivo.html` | Interactive choropleth + Sankey |
| `/proyectado` | `src/public/proyectado.html` | Projection charts with error bands |

---

## Data Model

### Mock Data (`mockData.js` / `mock_data.py`)

30 static records (10 provinces × 3 games):

```javascript
{
  id: Number,
  provincia: String,   // 10 Argentine provinces
  juego: String,       // "Lotería" | "Quiniela" | "Raspadita"
  cantidad: Number,    // tickets sold
  ingresos: Number,    // revenue
  costo: Number        // cost
}
```

### Monthly Time-Series (`ticketsPorMes.js` / `tickets_por_mes.py`)

360 records covering March 2025–February 2026 (10 provinces × 3 games × 12 months):

```javascript
{
  fecha: "YYYY-MM",
  provincia: String,
  juego: String,
  cantidad: Number,
  ingresos: Number,
  costo: Number,
  beneficio: Number    // ingresos - costo
}
```

---

## Architecture Patterns

### Thin Proxy Pattern

The Node.js layer is intentionally thin. It:
1. Receives HTTP requests
2. Forwards them (with query params) to the Python core
3. Returns the response verbatim

Business logic lives exclusively in Python (`core/`). Do not duplicate business logic in the Node.js layer.

### SMA Rolling Projections

The `proyecciones_service.py` / `proyeccionesService.js` implements:
- 3-month rolling average (window = 3)
- Error bands that grow monotonically: base standard deviation × (1 + 0.15 × month)
- Applied to `cantidad`, `ingresos`, `costo`, `beneficio` fields independently

---

## Code Conventions

### JavaScript (Node.js)

- **Style:** Single quotes, semicolons required, 2-space indent
- **Linter:** ESLint with `eslint:recommended` + custom rules
- **Pattern:** Controllers are thin (delegate to services). Services contain logic.
- **Logging:** Use `logger.js` (Winston), never `console.log` directly
- **No `console` calls:** ESLint rule enforces this — use `logger.info()`, `logger.error()`, etc.
- **HTTP client:** `node-fetch` v2 (CommonJS `require`)
- **Module system:** CommonJS (`require`/`module.exports`), not ES modules

### Python (Core)

- **Style:** PEP 8, 4-space indent
- **Framework:** Flask with plain function-based views (no class-based views)
- **Module layout:** `services/` for business logic, `data/` for mock data
- **Tests:** pytest with assertions, no mocking of internal modules
- **Entry point:** Run as `python3 -m core.main` (package-relative imports)

### Git / Branching

Follows **Git Flow** with Jira integration:
- `main` — production
- `develop` — integration branch
- `feature/BETIX-XX-description` — feature branches (triggers Jira "In Progress")
- `fix/BETIX-XX-description` — bug fixes
- `release/vX.Y.Z` — release preparation

PR merge to `main`/`develop` automatically transitions Jira tickets to "Done".

### Versioning

Each service has an independent `VERSION` file:
- `core/VERSION`
- `src/VERSION`
- `frontend/VERSION`

To bump: `make bump-api v=X.Y.Z`, `make bump-core v=X.Y.Z`, `make bump-frontend v=X.Y.Z`

---

## CI/CD Pipelines

GitHub Actions workflows in `.github/workflows/`:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci-api.yml` | push/PR to develop/main | Lint + Jest + Cucumber |
| `ci-core.yml` | push/PR to develop/main | pytest + SonarCloud |
| `ci-diagrams.yml` | changes to `docs/diagrams/` | Regenerate architecture PNGs |
| `build.yml` | git tags | Build and push Docker images to ECR |
| `jira-branch-to-in-progress.yml` | branch creation | Move Jira ticket to "In Progress" |
| `jira-close-on-merge.yml` | PR merge | Move Jira ticket to "Done" |
| `ai-pr-review.yml` | PR events | Automated AI code review comments |

Path filters: CI runs selectively based on changed files (e.g., `core/` changes only run `ci-core.yml`).

---

## Docker & Deployment

### Build Individual Images

```bash
make build-api       # node:18-alpine, port 3000
make build-core      # python:3.12-slim, port 5000
make build-frontend  # nginx:1.27-alpine, port 80
make build           # all three
```

### Push to ECR

```bash
make push ECR=<registry-url>
```

### Kubernetes

```bash
make k8s-apply    # Apply all manifests to betix namespace
make k8s-status   # Show pods and services
make k8s-delete   # Remove all k8s resources
```

Manifests in `k8s/`: namespace, 3 deployments, 3 services, 1 ingress (path-based routing).

### Terraform (AWS)

Infrastructure defined in `terraform/`: VPC, EKS cluster, ECR repositories.

---

## Architecture Documentation

C4 model documentation in `docs/ArquitecturaC4.md` with Mermaid diagrams.

Architecture diagrams (PNG) are generated from Python scripts in `docs/diagrams/`:
- `architecture_local.py` → local Docker Compose view
- `architecture_k8s.py` → Kubernetes deployment view
- `architecture_aws.py` → AWS infrastructure view

Regenerate: `make diagrams`

---

## Common Tasks

### Add a new API endpoint

1. Add route in Python core: `core/main.py` + `core/services/`
2. Add proxy in Node.js: `src/routes/`, `src/controllers/`, `src/services/`
3. Wire route in `src/app.js`
4. Write Jest tests in `tests/`
5. Write pytest tests in `core/tests/`
6. Add Cucumber scenarios in `features/`

### Modify mock data

Edit both copies:
- `src/data/mockData.js` and `src/data/ticketsPorMes.js`
- `core/data/mock_data.py` and `core/data/tickets_por_mes.py`

Keep both datasets in sync.

### Update a frontend dashboard

Edit HTML files directly in `src/public/`. D3.js code is inline in the HTML files. Dashboards fetch from `/api/datos/geodata` and `/api/datos/proyectado`.

### Run a specific test

```bash
# Single Jest test file
npx jest tests/health.test.js

# Single pytest file
python3 -m pytest core/tests/test_health.py -v

# Single Cucumber feature
npx cucumber-js features/health.feature
```
