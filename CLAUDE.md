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
# Run everything
make up           # docker-compose up --build
make test         # pytest + jest + cucumber
make lint         # ESLint on src/ and tests/

# Individual
npm test                         # Jest + Cucumber
python3 -m pytest core/tests/ -v # pytest
make test-api / make test-core   # via Makefile
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

Versioning is automated via **Release Please**. Merging to `main` triggers
the `release.yml` workflow, which opens a release PR with bumped versions
and changelogs based on Conventional Commits.

`make bump-api v=X.Y.Z` / `make bump-core v=X.Y.Z` / `make bump-frontend v=X.Y.Z`
are **emergency bypasses only** — do not use them in normal development.
After a manual bump, sync `.release-please-manifest.json` to match.

---

## Skills (Common Workflows)

Reusable step-by-step playbooks in `.claude/skills/`:

- **add-endpoint** — add a new API endpoint end-to-end
- **sync-mock-data** — modify mock data in both JS and Python copies
- **release** — bump versions, tag, and push a release
