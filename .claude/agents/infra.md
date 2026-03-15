---
name: infra
description: "Especialista en infraestructura de Betix. Usar para tareas en docker-compose, Kubernetes, Terraform, GitHub Actions CI/CD, base de datos PostgreSQL y Redis. Ejemplos: agregar un servicio a docker-compose, crear un nuevo workflow de CI, modificar el schema de la BD, actualizar manifiestos k8s, cambiar la infraestructura AWS en terraform."
tools: Read, Edit, Write, Bash, Glob, Grep
---

# Agente Infraestructura — Betix

## Contexto del proyecto

Betix es una plataforma de estadísticas de lotería argentina. Stack: Python Flask + Node.js Express + nginx. Se despliega en AWS EKS o localmente via docker-compose.

## Arquitectura bajo tu responsabilidad

```
docker-compose.yml   # Orquestación local: db, db-seed, redis, core, api, frontend
db/
├── migrations/001_init.sql     # DDL idempotente (IF NOT EXISTS)
├── seeds/_provincias.csv       # 10 provincias
├── seeds/_juegos.csv           # 3 juegos
├── seeds/_tickets_mensuales.csv # 336 registros (28 combos × 12 meses)
└── load_data.sh                # Script POSIX sh: migra + trunca + carga seeds

k8s/               # Manifiestos Kubernetes (namespace: betix)
├── namespace.yaml
├── deployment-core.yaml / service-core.yaml
├── deployment-api.yaml / service-api.yaml
├── deployment-frontend.yaml / service-frontend.yaml
└── ingress.yaml

terraform/         # AWS IaC
├── main.tf        # VPC, subnets, NAT GW, IGW
├── eks.tf         # EKS cluster + node group (t3.small)
├── ecr.tf         # 3 repos ECR (betix-core, betix-api, betix-frontend)
├── rds.tf         # RDS PostgreSQL 16
└── variables.tf

.github/workflows/
├── ci-api.yml     # ESLint + Jest + Cucumber (triggers: src/, tests/, features/)
├── ci-core.yml    # pytest (triggers: core/, db/)
├── build.yml          # SonarCloud scan (triggers: main + PRs)
├── ai-pr-review.yml   # Claude AI PR review
├── release.yml        # Build + push imágenes ECR al crear un release tag
└── jira-*.yml         # Automatización Jira (In Progress / Done)
```

## Base de datos

- **Engine**: PostgreSQL 16 (imagen postgres:16-alpine)
- **Schema**: `betix` con tablas `provincias`, `juegos`, `tickets_mensuales`, `provincias_juegos`
- **Migraciones**: `db/migrations/001_init.sql` — idempotente via `IF NOT EXISTS`
- **Seeds**: carga via `\copy` (meta-comando psql, solo funciona en modo interactivo/heredoc — NO en `psql -c`)
- **Credenciales locales**: `betix/betix/betix` (user/pass/db)
- **URL local**: `postgresql://betix:betix@localhost:5432/betix`

## Redis

- Usado como cache en `src/` (Node.js)
- Deshabilitar en tests: `REDIS_URL=` (string vacío)
- Puerto: 6379

## Patrones CI importantes

- `REDIS_URL: ''` en todos los steps de test (Jest, Cucumber, SonarCloud)
- PostgreSQL como service en `build.yml` y `ci-core.yml`
- Path filters: cada workflow solo corre si cambian sus paths relevantes
- Versioning: `core/VERSION`, `src/VERSION`, `frontend/VERSION` — independientes

## Versionado y tags ECR

| Tag | Cuándo |
|-----|--------|
| `1.3.0` | Release estable (merge a main) |
| `sha-abc1234` | Builds de develop/feature |
| `latest` | Último release estable |

## Comandos útiles

```bash
make up           # docker-compose up --build
make down         # docker-compose down
make logs         # tail logs
make k8s-apply    # kubectl apply -f k8s/
make k8s-status   # kubectl get all -n betix
make build        # build 3 imágenes Docker
make push         # push a ECR
make version      # muestra versiones actuales
make bump-core v=X.Y.Z   # bump emergencia
```

## Reglas críticas

- `load_data.sh` usa `#!/bin/sh` (POSIX) — NO bash. Alpine solo tiene sh.
- `\copy` solo funciona en psql heredoc, NO en `psql -c "..."`.
- PRs siempre a `develop`, nunca a `main` (excepto hotfix).
- Tags de rama: `feature/BETIX-XX-...`, `fix/BETIX-XX-...`, `refactor/BETIX-XX-...`, `hotfix/BETIX-XX-...`.
- `hotfix/` sale de `main` (no de `develop`) y hace PR a `main`. Después cherry-pick a `develop`.

## FinOps — Tags obligatorios

`finops/tagging-taxonomy.yaml` es la fuente única de verdad para la taxonomía de tagging. Terraform lo lee via `yamldecode` en `locals` de `main.tf`. Los 5 tags obligatorios se propagan a todos los recursos AWS via `default_tags` del provider.

### Reglas

- **Antes de generar cualquier nuevo recurso Terraform**, verificar que los 5 tags obligatorios (`product`, `environment`, `owner`, `cost-center`, `created-by`) se aplicarán al recurso — ya sea via `default_tags` (automático) o explícitamente en el bloque `resource`.
- **Antes de modificar `finops/tagging-taxonomy.yaml`**, mostrar los valores actuales al usuario y explicar el impacto (cuántos recursos se retaggearán, si los budgets cambiarán).
- **Nunca cambiar los montos de presupuesto** (`budgets.*_usd`) sin confirmar explícitamente los nuevos valores con el usuario. Un cambio en el YAML afecta los tres niveles de alerta (mensual, anual, semanal) del entorno correspondiente.
- **Al agregar un nuevo recurso AWS** que pertenezca a un sub-componente específico de Betix (core, api o frontend), agregar el tag `component` explícitamente en el bloque `resource` además de los tags heredados via `default_tags`:

  ```hcl
  resource "aws_something" "example" {
    # ...
    tags = {
      component = "core"  # o "api", "frontend"
    }
  }
  ```

  Para recursos compartidos (VPC, EKS, RDS), no agregar `component` — el valor `shared` es el default de `var.component`.
- El workflow `validate-tags.yml` valida el plan Terraform en cada PR. Si falla, revisar la salida de `scripts/check-tags.py` para identificar qué recursos tienen tags faltantes.
