# CLAUDE.md — Betix

## WHY

**Betix** is a fictional lottery ticket statistics platform for Argentine provinces, built as an educational *playground* for the Tecno Acción developer onboarding course (`docs/curso-entrenamiento/`). It demonstrates the team's development platform tools, processes, and standards end-to-end. All data, provinces, games and statistics are invented.

---

## WHAT — Repo Map

```
betix/
├── src/           # Node.js 18 + Express (port 3000) — thin HTTP proxy + static pages
├── core/          # Python 3.12 + Flask (port 5000) — all business logic lives here
├── frontend/      # nginx 1.27 Alpine (port 8080) — static assets + reverse proxy
├── features/      # Cucumber BDD scenarios (.feature + step_definitions/)
├── tests/         # Jest unit/integration tests
│   └── fixtures/  # csvLoader.js — reads db/seeds/ CSVs as test data source
├── db/            # PostgreSQL migrations + seeds (single source of truth for data)
│   └── seeds/     # _provincias.csv, _juegos.csv, _tickets_mensuales.csv
├── docs/          # Architecture docs → read here before modifying architecture
│   └── curso-entrenamiento/  # Developer onboarding course (modules 0–10)
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
- **No `console.log`** in JS — use `logger.info()` / `logger.error()` (Winston).
- **CommonJS only** in Node.js — use `require`/`module.exports`, not ES modules.

### Git / Branching

Target branch: `develop` (never `main` directly).

Branch prefix **must** match the type of change:
- `feature/BETIX-XX-description` — new functionality
- `fix/BETIX-XX-description` — bug fix
- `refactor/BETIX-XX-description` — restructuring without behaviour change
- `hotfix/BETIX-XX-description` — urgent fix directly on `main` (production)

Pattern: `<prefix>/BETIX-XX-short-description` (kebab-case, Jira ID required).

`hotfix/` branches diverge from `main` (not `develop`) and PR back to `main`. After merging, cherry-pick the fix to `develop` to avoid regression.

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

**El versionado es automatizado con Release Please** (BETIX-19). Al hacer merge a `main`, Release Please abre un PR automático que bumpa las versiones y genera el CHANGELOG según los conventional commits. Solo se bumpean los servicios cuyos paths cambiaron.

Los comandos `make bump-*` son bypass de emergencia — no usar en operación normal:
```bash
make bump-core v=X.Y.Z
make bump-api v=X.Y.Z
make bump-frontend v=X.Y.Z
```
El `Makefile` lee ese archivo automáticamente en los targets `build-*` y `push-*`.

### CI — Path Filters

Dos workflows independientes en `.github/workflows/`. Cada job solo corre si sus paths cambiaron:

```
Cambio en core/                  → ci-core.yml  (pytest)
Cambio en src/ tests/ features/  → ci-api.yml   (Jest + Cucumber)
Cambio en README.md              → ningún job corre
```

> Los diagramas de arquitectura están en Mermaid (docs/diagrams/, docs/ArquitecturaC4.md) y se renderizan automáticamente en GitHub sin CI adicional.

> Si un job no corre porque sus paths no cambiaron, GitHub lo considera automáticamente pasado — no bloquea branch protection rules.

---

## Sub-Agents (Delegación por área)

Ante cualquier tarea de implementación, delegar en el sub-agente correspondiente según el área afectada. Los agentes están definidos en `.claude/agents/`:

| Agente | Archivo | Delegar cuando el cambio toca… |
|--------|---------|-------------------------------|
| **microservices** | `microservices.md` | `core/` (Python/Flask), `src/` (Node.js proxy) — solo lógica de producción |
| **testing** | `testing.md` | `tests/`, `features/`, `core/tests/` — CUALQUIER tarea de tests (escribir, corregir, actualizar mocks/nocks) |
| **infra** | `infra.md` | `docker-compose.yml`, `k8s/`, `terraform/`, `.github/workflows/`, `db/`, `frontend/nginx.conf`, `Dockerfile` |
| **frontend** | `frontend.md` | `frontend/` (nginx config), `src/public/` (HTML/CSS/JS/D3.js) |

**Regla:** Si una tarea toca múltiples áreas, delegar en cada agente por separado en paralelo cuando sea posible, o secuencialmente cuando haya dependencias entre los cambios.

**Regla de testing:** Toda tarea que involucre escribir, modificar, corregir o ejecutar tests (Jest, Cucumber, pytest) debe delegarse al agente **testing**, incluso si el cambio de producción fue hecho por otro agente.

---

## Skills (Common Workflows)

Reusable step-by-step playbooks in `.claude/skills/`:

- **add-endpoint** — add a new API endpoint end-to-end
- **release** — bump versions, tag, and push a release

---

## Claude Code — Configuración de equipo

La carpeta `.claude/` y el archivo `.mcp.json` en la raíz son parte del repositorio. Todo lo que vive ahí es **conocimiento compartido del equipo**, versionado y revisado en PR igual que el código de producción.

```
.mcp.json              # Servidores MCP del proyecto (Jira URL pre-configurada)
.claude/
├── agents/              # Sub-agentes especializados por área
│   ├── microservices.md # core/ (Python) + src/ (Node.js proxy)
│   ├── testing.md       # tests/, features/, core/tests/
│   ├── infra.md         # docker-compose, k8s, terraform, CI/CD
│   └── frontend.md      # src/public/ (HTML/CSS/JS/D3.js) + nginx
├── skills/              # Playbooks reutilizables paso a paso
│   ├── add-endpoint.md  # flujo completo para agregar un endpoint
│   └── release.md       # cómo funciona el versionado automatizado
└── hooks/               # Comandos que se ejecutan en eventos del ciclo de trabajo
```

### Qué se comparte vs qué es personal

| Archivo / carpeta | ¿Se commitea? | Para qué sirve |
|---|---|---|
| `.mcp.json` | Sí | Config del servidor MCP de Jira (URL del proyecto, sin credenciales) |
| `.claude/agents/` | Sí | Contexto especializado por área — todo el equipo lo usa |
| `.claude/skills/` | Sí | Playbooks de flujos comunes — referencia compartida |
| `.claude/hooks/` | Sí | Automatizaciones del ciclo de trabajo |
| `.claude/settings.json` | Sí | Settings del proyecto (no incluye tokens ni secrets) |
| `.claude/settings.local.json` | No (`.gitignore`) | Preferencias personales que sobreescriben settings del proyecto |
| `.claude/worktrees/` | No (`.gitignore`) | Worktrees temporales de Claude — locales, no compartidos |

**Credenciales MCP (nunca en el repo):** cada developer configura sus credenciales en `.claude/settings.local.json` (está en `.gitignore`). Ver instrucciones completas en `docs/curso-entrenamiento/modulos/1.md#configurar-el-servidor-mcp-de-jira`.

### Principio

> **La plataforma es el repositorio.** Un developer que clona el repo obtiene automáticamente el mismo Claude configurado, con el mismo conocimiento del proyecto, que el resto del equipo. No hay setup manual de prompts ni contexto que transmitir por Slack.
