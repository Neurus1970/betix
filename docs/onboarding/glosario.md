# Glosario de términos técnicos

← [Volver al temario](TOC.md)

Este glosario reúne los términos técnicos usados a lo largo del curso. Están ordenados alfabéticamente. Cuando un capítulo usa un término por primera vez, incluye un enlace directo a esta página.

---

## B

### Branch
Rama de trabajo en Git. Permite desarrollar cambios de forma aislada sin afectar el código principal. Ver [Capítulo 2 — Estrategia de branches](modulos/2.md#2-la-estrategia-de-branches-de-tecnoaccion).

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

### C4 Model
Modelo de documentación de arquitectura de software creado por Simon Brown. Propone cuatro niveles de abstracción progresiva: Contexto (L1), Contenedores (L2), Componentes (L3) y Código (L4). Cada nivel responde a una audiencia distinta, de stakeholders de negocio hasta desarrolladores. En Betix, los niveles L1-L3 están documentados en [`docs/ArquitecturaC4.md`](../ArquitecturaC4.md) con la sintaxis C4 de Mermaid.

### CHANGELOG
Archivo que registra todos los cambios de cada versión de un proyecto. En Betix es generado automáticamente por Release Please al leer los mensajes de commits.

### Cherry-pick
Operación de Git que toma un commit específico de una rama y lo aplica sobre otra, sin mergear toda la rama. Se usa en Betix para llevar un hotfix de `main` a `develop` después de aplicarlo en producción.

```bash
# Ejemplo: llevar el commit abc1234 a la rama actual
git cherry-pick abc1234
```

### CI/CD
**Continuous Integration / Continuous Delivery** (Integración y entrega continua). Automatización que ejecuta tests, lint y builds cada vez que se sube código. En Betix son los workflows de GitHub Actions (`ci-core.yml`, `ci-api.yml`). Ver [Capítulo 5 — CI/CD](modulos/5.md).

### Conventional Commits
Convención de formato para mensajes de commits. Define tipos estándar (`feat`, `fix`, `refactor`, `docs`, `test`, `chore`) que herramientas como Release Please pueden leer para automatizar el versionado. Ver [Capítulo 2 — Conventional Commits](modulos/2.md#4-conventional-commits--el-mensaje-que-trabaja-por-vos).

---

## D

### Deploy / Deployment
Proceso de poner una nueva versión de software en funcionamiento en un entorno (desarrollo, staging, producción). En Betix se hace con `kubectl set image` o actualizando los manifiestos de `k8s/`.

### Diagrams as Code
Práctica de expresar diagramas de arquitectura e infraestructura en texto plano (código), versionable en Git y revisable en PRs, en lugar de capturas de pantalla o archivos binarios. En Betix se usa [Mermaid](#mermaid): [`docs/ArquitecturaC4.md`](../ArquitecturaC4.md) documenta la arquitectura C4 y [`docs/diagrams/infrastructure.md`](../diagrams/infrastructure.md) documenta los flujos de infraestructura en local, Kubernetes y AWS. Los diagramas se renderizan automáticamente en GitHub.

### Docker / Imagen Docker
Tecnología de contenedores. Una *imagen* es un paquete autónomo con el código y sus dependencias. Un *contenedor* es una instancia en ejecución de esa imagen. Ver [Capítulo 6 — Infraestructura como código](modulos/6.md).

---

## E

### ECR (Elastic Container Registry)
Registro privado de imágenes Docker de AWS. En Betix almacena las imágenes `betix-core`, `betix-api` y `betix-frontend`, cada una con sus propios tags de versión.

---

## F

### FinOps
Práctica de gestión financiera del gasto en cloud que combina cultura, procesos y herramientas para dar visibilidad y control sobre los costos de infraestructura. El nombre viene de "Finance + DevOps". En Betix se implementa con tres mecanismos: tagging obligatorio en todos los recursos AWS (vía `default_tags` del provider Terraform), presupuestos automáticos con alertas (AWS Budgets), y validación de tags en CI (`scripts/check-tags.py`). La fuente única de verdad es [`finops/tagging-taxonomy.yaml`](../../finops/tagging-taxonomy.yaml). Ver [Capítulo 6 — FinOps](modulos/6.md#5-finops-visibilidad-y-control-de-costos).

---

## H

### Hotfix
Fix urgente aplicado directamente sobre el código en producción (rama `main`), saltando el ciclo normal de desarrollo. Se usa cuando hay un bug crítico que no puede esperar el próximo release. Ver [Capítulo 2 — Hotfixes](modulos/2.md#6-versionado-con-tags--hotfixes-en-versiones-en-producción).

---

## I

### IaC (Infrastructure as Code)
Práctica de definir y gestionar infraestructura (servidores, redes, bases de datos) mediante archivos de código versionados, en lugar de configuración manual. En Betix: `terraform/` para AWS y `k8s/` para Kubernetes.

### Ingress (Kubernetes)
Recurso de Kubernetes que gestiona el acceso externo al cluster. Define reglas de routing basadas en host y path: una sola IP o DNS pública que distribuye tráfico a distintos Services internos. En Betix, `k8s/ingress.yaml` rutea `/api/*` y `/healthz` al servicio `api:3000` y `/` al servicio `frontend:80`. Ver [Capítulo 6 — Kubernetes](modulos/6.md#el-ingress-routing-de-entrada).

---

## K

### Kebab-case
Convención de nombres donde las palabras se separan con guiones: `mi-variable-de-ejemplo`. Se usa en Betix para los nombres de ramas Git.

### Kubernetes (k8s)
Plataforma de orquestación de contenedores. Gestiona el despliegue, escalado y operación de aplicaciones en contenedores. Ver [Capítulo 6 — Infraestructura como código](modulos/6.md).

---

## M

### Merge / Mergear
Integrar los cambios de una rama en otra. En Betix, las ramas temporales se mergean a `develop` mediante Pull Requests.

### Mermaid
Lenguaje de texto para crear diagramas (flowcharts, sequenceDiagram, mindmap, diagramas C4) que se renderizan automáticamente en GitHub, GitLab y muchos editores. En Betix se usa para todos los diagramas de arquitectura e infraestructura: [`docs/ArquitecturaC4.md`](../ArquitecturaC4.md) y [`docs/diagrams/infrastructure.md`](../diagrams/infrastructure.md). Ver también: [Diagrams as Code](#diagrams-as-code), [C4 Model](#c4-model).

### Minor / Major / Patch
Las tres partes de un número de versión semántica (ej: `1.3.0`):
- **MAJOR** (`1`.3.0) — cambios incompatibles con versiones anteriores
- **MINOR** (1.`3`.0) — nuevas funcionalidades compatibles
- **PATCH** (1.3.`0`) — correcciones de bugs compatibles

Ver: [Semver](#semver).

---

## N

### Namespace (Kubernetes)
Espacio de aislamiento dentro de un cluster de Kubernetes. Agrupa recursos relacionados (pods, services, secrets, ingress) bajo un nombre común y los aísla de otros namespaces. En Betix todos los recursos viven en el namespace `betix`, definido en `k8s/namespace.yaml`. Ver [Capítulo 6 — Kubernetes](modulos/6.md#el-namespace).

---

## P

### Pipeline
Secuencia automatizada de pasos que se ejecutan al subir código: lint → tests → build → deploy. En Betix son los workflows de GitHub Actions.

### Probe (Kubernetes)
Mecanismo de healthcheck continuo de Kubernetes para monitorear el estado de los pods. Hay dos tipos: `livenessProbe` (si falla, Kubernetes reinicia el pod) y `readinessProbe` (si falla, el pod deja de recibir tráfico pero no se reinicia). En Betix, el deployment del `api` usa ambas apuntando a `GET /healthz`. Ver [Capítulo 6 — Probes](modulos/6.md#1-probes-liveness-vs-readiness).

### Pull Request (PR)
Propuesta formal de integrar los cambios de una rama en otra. Incluye revisión de código, ejecución de CI y al menos una aprobación humana antes del merge. Ver [Capítulo 2 — Pull Requests](modulos/2.md#5-pull-requests--qué-revisar-qué-no-bloquear).

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
Convención de versionado `MAJOR.MINOR.PATCH` que comunica el impacto de los cambios mediante el número de versión. Sitio oficial: [semver.org](https://semver.org). Ver también: [Capítulo 8 — Versionado y releases](modulos/8.md).

### SHA (commit hash)
Identificador único de un commit en Git. Ejemplo: `abc1234`. En Betix, las imágenes Docker de ramas no-main se tagean con el SHA corto del commit (`sha-abc1234`) para trazabilidad exacta.

### SNS (Simple Notification Service)
Servicio de mensajería pub/sub de AWS. Permite publicar un mensaje a un topic y distribuirlo a múltiples suscriptores (email, Lambda, SQS, HTTP). En Betix se usa para las alertas de presupuesto FinOps: AWS Budgets publica en el topic `betix-finops-alerts-dev` cuando el gasto supera el 70%, 80% o 90% del límite, y el topic reenvía la notificación por email a `finops@tecnoaccion.com`. Ver [Capítulo 6 — FinOps](modulos/6.md#5-finops-visibilidad-y-control-de-costos).

### SonarCloud
Plataforma de análisis estático de código en la nube. En Betix analiza cobertura de tests (JS y Python), detecta bugs, vulnerabilidades y code smells en cada PR. El resultado aparece como un *Quality Gate* directamente en GitHub. Ver [Capítulo 4 — Cobertura con SonarCloud](modulos/4.md#6-cobertura-de-código-con-sonarcloud).

---

## T

### Tag (Git)
Etiqueta inmutable en un commit específico, usada para marcar releases. Ejemplo: `betix-api-v1.3.0`. A diferencia de las ramas, un tag no avanza con nuevos commits.

### Terraform
Herramienta de IaC de HashiCorp. Define infraestructura cloud (AWS, GCP, Azure) mediante archivos `.tf`. En Betix gestiona el cluster EKS, las ECRs y la VPC. Ver [Capítulo 6](modulos/6.md).

---

## U

### UAT (User Acceptance Testing)
Pruebas de aceptación de usuario. Validación funcional en un entorno de staging antes de pasar a producción, típicamente con los usuarios o analistas que van a usar el sistema.

---

## V

### VPC (Virtual Private Cloud)
Red privada virtual en AWS. Aísla los recursos de otras cuentas y del internet público. En Betix, la VPC `betix-dev` (10.0.0.0/16) tiene subnets públicas (para el load balancer y el NAT Gateway) y subnets privadas (para los nodos EKS y la base de datos RDS). Los nodos EKS no son accesibles desde internet — solo reciben tráfico a través del ALB. Definida en `terraform/vpc.tf`. Ver [Capítulo 6 — La VPC](modulos/6.md#la-vpc-red-privada-en-aws).

---

## W

### Workflow
En GitHub Actions, archivo YAML en `.github/workflows/` que define una secuencia automatizada de pasos disparada por eventos (push, PR, merge). Ver [Capítulo 5](modulos/5.md).

---

← [Volver al temario](TOC.md)
