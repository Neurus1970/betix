# Glosario de términos técnicos

← [Volver al temario](TOC.md)

Este glosario reúne los términos técnicos usados a lo largo del curso. Están ordenados alfabéticamente. Cuando un módulo usa un término por primera vez, incluye un enlace directo a esta página.

---

## B

### Branch
Rama de trabajo en Git. Permite desarrollar cambios de forma aislada sin afectar el código principal. Ver [Módulo 2 — Estrategia de branches](modulos/2.md#2-la-estrategia-de-branches-de-betix).

### BREAKING CHANGE
Cambio que rompe la compatibilidad con versiones anteriores de una API o interfaz. En Conventional Commits se declara con `!` en el tipo o con un footer `BREAKING CHANGE:`. Genera un bump de versión MAJOR (ej: 1.2.0 → 2.0.0).

### Bump (de versión)
Incrementar el número de versión de un software. En Betix esto ocurre automáticamente cuando se mergea a `main`: Release Please lee los mensajes de commits y decide qué número cambiar:
- `feat:` → bump **MINOR** (ej: 1.2.0 → 1.3.0)
- `fix:` → bump **PATCH** (ej: 1.2.0 → 1.2.1)
- `BREAKING CHANGE` → bump **MAJOR** (ej: 1.2.0 → 2.0.0)

Ver también: [Semver](#semver), [Release Please](#release-please).

---

## C

### CHANGELOG
Archivo que registra todos los cambios de cada versión de un proyecto. En Betix es generado automáticamente por Release Please al leer los mensajes de commits.

### Cherry-pick
Operación de Git que toma un commit específico de una rama y lo aplica sobre otra, sin mergear toda la rama. Se usa en Betix para llevar un hotfix de `main` a `develop` después de aplicarlo en producción.

```bash
# Ejemplo: llevar el commit abc1234 a la rama actual
git cherry-pick abc1234
```

### CI/CD
**Continuous Integration / Continuous Delivery** (Integración y entrega continua). Automatización que ejecuta tests, lint y builds cada vez que se sube código. En Betix son los workflows de GitHub Actions (`ci-core.yml`, `ci-api.yml`). Ver [Módulo 5 — CI/CD](modulos/5.md).

### Conventional Commits
Convención de formato para mensajes de commits. Define tipos estándar (`feat`, `fix`, `refactor`, `docs`, `test`, `chore`) que herramientas como Release Please pueden leer para automatizar el versionado. Ver [Módulo 2 — Conventional Commits](modulos/2.md#4-conventional-commits--el-mensaje-que-trabaja-por-vos).

---

## D

### Deploy / Deployment
Proceso de poner una nueva versión de software en funcionamiento en un entorno (desarrollo, staging, producción). En Betix se hace con `kubectl set image` o actualizando los manifiestos de `k8s/`.

### Docker / Imagen Docker
Tecnología de contenedores. Una *imagen* es un paquete autónomo con el código y sus dependencias. Un *contenedor* es una instancia en ejecución de esa imagen. Ver [Módulo 6 — Infraestructura como código](modulos/6.md).

---

## E

### ECR (Elastic Container Registry)
Registro privado de imágenes Docker de AWS. En Betix almacena las imágenes `betix-core`, `betix-api` y `betix-frontend`, cada una con sus propios tags de versión.

---

## H

### Hotfix
Fix urgente aplicado directamente sobre el código en producción (rama `main`), saltando el ciclo normal de desarrollo. Se usa cuando hay un bug crítico que no puede esperar el próximo release. Ver [Módulo 2 — Hotfixes](modulos/2.md#6-versionado-con-tags--hotfixes-en-versiones-en-producción).

---

## I

### IaC (Infrastructure as Code)
Práctica de definir y gestionar infraestructura (servidores, redes, bases de datos) mediante archivos de código versionados, en lugar de configuración manual. En Betix: `terraform/` para AWS y `k8s/` para Kubernetes.

---

## K

### Kebab-case
Convención de nombres donde las palabras se separan con guiones: `mi-variable-de-ejemplo`. Se usa en Betix para los nombres de ramas Git.

### Kubernetes (k8s)
Plataforma de orquestación de contenedores. Gestiona el despliegue, escalado y operación de aplicaciones en contenedores. Ver [Módulo 6 — Infraestructura como código](modulos/6.md).

---

## M

### Merge / Mergear
Integrar los cambios de una rama en otra. En Betix, las ramas temporales se mergean a `develop` mediante Pull Requests.

### Minor / Major / Patch
Las tres partes de un número de versión semántica (ej: `1.3.0`):
- **MAJOR** (`1`.3.0) — cambios incompatibles con versiones anteriores
- **MINOR** (1.`3`.0) — nuevas funcionalidades compatibles
- **PATCH** (1.3.`0`) — correcciones de bugs compatibles

Ver: [Semver](#semver).

---

## P

### Pipeline
Secuencia automatizada de pasos que se ejecutan al subir código: lint → tests → build → deploy. En Betix son los workflows de GitHub Actions.

### Pull Request (PR)
Propuesta formal de integrar los cambios de una rama en otra. Incluye revisión de código, ejecución de CI y al menos una aprobación humana antes del merge. Ver [Módulo 2 — Pull Requests](modulos/2.md#5-pull-requests--qué-revisar-qué-no-bloquear).

---

## R

### RC (Release Candidate)
Versión candidata a ser el próximo release estable. Se usa para validar en entornos de prueba (UAT) antes de ir a producción. Tag de ejemplo: `betix-api:1.3.0-rc.1`.

### Release Please
Herramienta de Google que automatiza el versionado y la generación de CHANGELOG. Lee los mensajes de commits en formato Conventional Commits y propone automáticamente el bump de versión al hacer merge a `main`.

### Rollback
Volver a una versión anterior de software ante un problema en producción. En Betix es trivial gracias a los tags de ECR: `kubectl set image deployment/betix-api api=betix-api:1.1.0`.

---

## S

### Semver (Semantic Versioning)
Convención de versionado `MAJOR.MINOR.PATCH` que comunica el impacto de los cambios mediante el número de versión. Sitio oficial: [semver.org](https://semver.org). Ver también: [Módulo 8 — Versionado y releases](modulos/8.md).

### SHA (commit hash)
Identificador único de un commit en Git. Ejemplo: `abc1234`. En Betix, las imágenes Docker de ramas no-main se tagean con el SHA corto del commit (`sha-abc1234`) para trazabilidad exacta.

---

## T

### Tag (Git)
Etiqueta inmutable en un commit específico, usada para marcar releases. Ejemplo: `betix-api-v1.3.0`. A diferencia de las ramas, un tag no avanza con nuevos commits.

### Terraform
Herramienta de IaC de HashiCorp. Define infraestructura cloud (AWS, GCP, Azure) mediante archivos `.tf`. En Betix gestiona el cluster EKS, las ECRs y la VPC. Ver [Módulo 6](modulos/6.md).

---

## U

### UAT (User Acceptance Testing)
Pruebas de aceptación de usuario. Validación funcional en un entorno de staging antes de pasar a producción, típicamente con los usuarios o analistas que van a usar el sistema.

---

## W

### Workflow
En GitHub Actions, archivo YAML en `.github/workflows/` que define una secuencia automatizada de pasos disparada por eventos (push, PR, merge). Ver [Módulo 5](modulos/5.md).

---

← [Volver al temario](TOC.md)
