# CLAUDE.md — Betix

## WHY

**Betix** is a lottery ticket statistics platform for Argentine provinces. It visualizes ticket sales, revenue, and projections via interactive D3.js dashboards.

---

## WHAT — Repo Map

```
betix/
├── src/           # Node.js 18 + Express (port 3000) — thin HTTP proxy + static pages
├── core/          # Python 3.12 + Flask (port 5000) — all business logic lives here
├── frontend/      # nginx 1.27 Alpine (port 8080) — static assets + reverse proxy
├── features/      # Cucumber BDD scenarios (.feature + step_definitions/)
├── tests/         # Jest unit/integration tests
├── docs/          # Architecture docs → read here before modifying architecture
├── k8s/           # Kubernetes manifests (betix namespace)
└── terraform/     # AWS infrastructure (EKS, ECR, VPC)
```

**Architecture context:** → `docs/ArquitecturaC4.md` (C4 model + Mermaid diagrams)

---

## HOW — Essential Commands

```bash
# Desarrollo local
make up           # docker-compose up --build (levanta los 3 servicios)
make down         # docker-compose down
make logs         # tail de logs de todos los servicios

# Tests
make test         # pytest + jest + cucumber (todos)
make test-core    # solo pytest core/
make test-api     # solo Jest + Cucumber
make lint         # ESLint on src/ and tests/

# Individual
npm test                         # Jest + Cucumber
python3 -m pytest core/tests/ -v # pytest

# Build y push de imágenes Docker (requiere credenciales ECR)
make build        # build de las 3 imágenes
make push         # push de las 3 imágenes a ECR
make build-core   # build solo betix-core:<version>
make push-core    # push solo betix-core:<version>
make build-api    # build solo betix-api:<version>
make push-api     # push solo betix-api:<version>

# Kubernetes (requiere minikube o cluster configurado)
make k8s-apply    # kubectl apply -f k8s/namespace.yaml && kubectl apply -f k8s/
make k8s-status   # kubectl get all -n betix
make k8s-delete   # kubectl delete -f k8s/

# Versionado
make version      # muestra versión actual de los 3 servicios
```

---

## Rules

### Critical

- **Business logic lives in `core/` (Python) only.** Never duplicate in Node.js.
- **Mock data has two copies** — always edit both: `src/data/` AND `core/data/`.
- **No `console.log`** in JS — use `logger.info()` / `logger.error()` (Winston).
- **CommonJS only** in Node.js — use `require`/`module.exports`, not ES modules.

### Git / Branching

Target branch: `develop` (never `main` directly).

Branch prefix **must** match the type of change:
- `feature/BETIX-XX-description` — new functionality
- `fix/BETIX-XX-description` — bug fix
- `refactor/BETIX-XX-description` — restructuring without behaviour change

Pattern: `<prefix>/BETIX-XX-short-description` (kebab-case, Jira ID required).

### Code Style

| Language | Style |
|----------|-------|
| JS | Single quotes, semicolons, 2-space indent |
| Python | PEP 8, 4-space indent, function-based views |

### Versioning

Cada servicio tiene su propio archivo `VERSION` con semver independiente (`MAJOR.MINOR.PATCH`):

```
core/VERSION      # ej: 1.3.0  → imagen betix-core:1.3.0
src/VERSION       # ej: 2.1.0  → imagen betix-api:2.1.0
frontend/VERSION  # ej: 1.0.5  → imagen betix-frontend:1.0.5
```

**Convención de tags en ECR:**

| Tag | Cuándo se genera |
|-----|-----------------|
| `1.3.0` | release estable (merge a `main`) |
| `1.3.0-rc.1` | release candidate |
| `sha-abc1234` | builds de `develop`/`feature` (CI automático) |
| `latest` | apunta siempre al último release estable |

> Para builds de CI en ramas no-main usar el SHA corto del commit como tag (evita colisiones y permite trazar qué código está corriendo).

**Bumpar una versión antes de mergear a `main`:**
```bash
make bump-core v=X.Y.Z
make bump-api v=X.Y.Z
make bump-frontend v=X.Y.Z
```
El `Makefile` lee ese archivo automáticamente en los targets `build-*` y `push-*`.

### CI — Path Filters

Tres workflows independientes en `.github/workflows/`. Cada job solo corre si sus paths cambiaron:

```
Cambio en core/                  → ci-core.yml     (pytest)
Cambio en src/ tests/ features/  → ci-api.yml      (Jest + Cucumber)
Cambio en docs/diagrams/         → ci-diagrams.yml (regenera PNGs)
Cambio en terraform/ k8s/ docker-compose.yml → ci-diagrams.yml
Cambio en README.md              → ningún job corre
```

> Si un job no corre porque sus paths no cambiaron, GitHub lo considera automáticamente pasado — no bloquea branch protection rules.

---

## Skills (Common Workflows)

Reusable step-by-step playbooks in `.claude/skills/`:

- **add-endpoint** — add a new API endpoint end-to-end
- **sync-mock-data** — modify mock data in both JS and Python copies
- **release** — bump versions, tag, and push a release
