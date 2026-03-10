# Betix — Guía de Monorepo escalable

## Por qué un monorepo

Betix es un monorepo con tres microservicios (`core/`, `src/`, `frontend/`) que comparten ciclo de vida, contratos de API y pipeline CI/CD. Esta guía documenta las tres prácticas que permiten escalar esa estructura sin romper la autonomía de cada servicio.

---

## Mejora 1 — CI con path filters

### Problema

Sin path filters, cualquier cambio en el repositorio (aunque sea un comentario en `README.md`) dispara los tres jobs de CI: `diagrams`, `test-core` y `lint-and-test`. Eso desperdicia minutos de runner y oscurece qué cambió realmente.

### Solución

Cada job declara los paths que le incumben. Si ningún archivo de esos paths cambió, el job se salta automáticamente.

```
Cambio en core/       → corre solo test-core
Cambio en src/        → corre solo lint-and-test
Cambio en docs/       → corre solo diagrams
Cambio en README.md   → ningún job corre (correcto)
```

### Cómo funciona

Los workflows en `.github/workflows/` tienen filtros `paths` en el trigger `on`. GitHub Actions evalúa si algún archivo modificado en el commit/PR coincide con esos paths antes de encolar el job.

```yaml
on:
  pull_request:
    branches: [main]
    paths:
      - 'core/**'          # solo si cambió el servicio Python
```

> **Nota**: los path filters aplican a nivel de workflow (archivo `.yml`), no a nivel de job. Por eso los tres jobs se separaron en tres archivos independientes: `ci-core.yml`, `ci-api.yml` y `ci-diagrams.yml`.

### Comportamiento en PRs

GitHub marca como "required" los checks que aplican. Si un job no corre porque sus paths no cambiaron, GitHub lo considera automáticamente pasado (no bloqueante). Esto es el comportamiento correcto para branch protection rules.

---

## Mejora 2 — Versionado independiente por servicio

### Problema

Con un solo tag (`latest`) por imagen Docker no se puede saber qué versión de cada servicio está corriendo en cada ambiente, ni hacer rollback selectivo.

### Solución

Cada servicio tiene un archivo `VERSION` con su propia versión semántica (`MAJOR.MINOR.PATCH`). Las imágenes Docker se construyen y pushean con ese tag.

```
betix-core:1.3.0
betix-api:2.1.0
betix-frontend:1.0.5
```

### Estructura

```
core/VERSION        # ej: 1.3.0
src/VERSION         # ej: 2.1.0
frontend/VERSION    # ej: 1.0.5
```

### Cómo bumpar una versión

Editar el archivo `VERSION` del servicio afectado antes de mergear a `main`. Los comandos del `Makefile` leen ese archivo automáticamente:

```bash
make build-core     # usa core/VERSION como tag
make push-core      # pushea betix-core:<version> a ECR
```

### Convención de tags en ECR/DockerHub

| Tag | Cuándo se genera |
|---|---|
| `1.3.0` | release estable |
| `1.3.0-rc.1` | release candidate |
| `sha-abc1234` | builds de develop/feature (CI automático) |
| `latest` | apunta al último release estable |

Para builds de CI en ramas no-main, usar el SHA corto del commit como tag evita colisiones y permite trazar exactamente qué código está corriendo.

---

## Mejora 3 — Makefile por servicio

### Problema

Los comandos para buildear, testear y correr cada servicio viven en distintos lugares (`package.json`, `pytest`, `docker-compose`). Un developer nuevo tarda en descubrir cuál comando aplica a qué servicio.

### Solución

Un `Makefile` en la raíz del repo expone todos los comandos en una interfaz uniforme.

```bash
make help           # lista todos los targets disponibles
make test           # corre todos los tests
make test-core      # solo pytest del core Python
make test-api       # solo Jest + Cucumber del API Node.js
make build          # construye todas las imágenes Docker
make build-core     # construye solo betix-core:<version>
make up             # docker-compose up --build
make down           # docker-compose down
```

### Filosofía

El `Makefile` no reemplaza las herramientas nativas (`npm`, `pytest`, `docker`), las **orquesta**. Cada target es un wrapper delgado que sabe dónde vive cada herramienta.

---

## Referencia rápida

```bash
# Desarrollo local
make up                      # levanta los 3 servicios con docker-compose
make down                    # baja todo
make logs                    # tail de logs de todos los servicios

# Tests
make test                    # todos los tests
make test-core               # pytest core/
make test-api                # Jest + Cucumber

# Build y push (requiere credenciales ECR)
make build                   # build de las 3 imágenes
make push                    # push de las 3 imágenes a ECR
make build-core              # build solo betix-core
make push-core               # push solo betix-core

# Kubernetes (requiere minikube corriendo)
make k8s-apply               # kubectl apply -f k8s/namespace.yaml && kubectl apply -f k8s/
make k8s-status              # kubectl get all -n betix
make k8s-delete              # kubectl delete -f k8s/

# Versionado
make version                 # muestra versión actual de cada servicio
make bump-core v=1.4.0       # actualiza core/VERSION
make bump-api v=2.2.0        # actualiza src/VERSION
make bump-frontend v=1.1.0   # actualiza frontend/VERSION
```

---

## Estructura de archivos resultante

```
betix/
├── .github/workflows/
│   ├── ci-core.yml          # paths: core/**
│   ├── ci-api.yml           # paths: src/**, tests/**, features/**
│   └── ci-diagrams.yml      # paths: docs/diagrams/**
├── core/
│   └── VERSION              # 1.0.0
├── src/
│   └── VERSION              # 1.0.0
├── frontend/
│   └── VERSION              # 1.0.0
├── Makefile
└── docs/
    └── monorepo-guide.md    # este archivo
```
