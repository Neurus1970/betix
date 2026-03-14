# Tabla de Contenidos: Plataforma de Desarrollo Tecnoaccion — Curso de Onboarding

---

## [Módulo 0 — ¿Por qué una plataforma unificada?](modulos/0.md)
- El costo real del caos: entornos inconsistentes, bugs en prod que no reproducen en local, onboarding de semanas
- Qué es una plataforma de desarrollo (Developer Platform): herramientas + procesos + estándares
- El desarrollador como "cliente interno" de la plataforma
- **Claude como copiloto transversal**: no reemplaza el criterio, amplifica la capacidad del equipo en cada etapa del ciclo

---

## [Módulo 1 — El entorno local estandarizado](modulos/1.md)
- Prerequisitos: Git, Docker, VS Code + extensión Claude Code
- Clonar Betix y levantar los 3 servicios en un solo comando (`make up`)
- Anatomía del proyecto: qué corre dónde y por qué (C4 model en `docs/`)
- **Ejercicio con Claude**: "Explícame la arquitectura de Betix" → lectura guiada de `ArquitecturaC4.md`

---

## [Módulo 2 — Git como contrato de equipo](modulos/2.md)
- Branching strategy: `develop` como rama principal, prefijos obligatorios (`feature/`, `fix/`, `refactor/`)
- Conventional Commits: por qué el mensaje importa (Release Please lo lee)
- Pull Requests a `develop`: qué revisar, qué no bloquear
- **Ejercicio con Claude**: crear una rama, hacer un cambio mínimo en Betix, escribir el commit message con ayuda de Claude

---

## [Módulo 3 — Claude Code como herramienta de SDLC](modulos/3.md)
- Instalación y configuración en VS Code
- Casos de uso por etapa:
  - **Entender código legado**: `/explain`, preguntas sobre archivos
  - **Escribir código**: feature nueva end-to-end con el skill `add-endpoint`
  - **Revisar código**: `/review`, detección de bugs y vulnerabilidades
  - **Escribir tests**: delegación al agente `testing`
  - **Documentar**: generar CLAUDE.md, ADRs
- Agentes especializados de Betix (`.claude/agents/`): microservices, testing, infra, frontend
- **Ejercicio**: usar Claude para entender un endpoint de Betix sin leer el código manualmente

---

## [Módulo 4 — Testing como cultura, no como tarea](modulos/4.md)
- La pirámide de tests en Betix: pytest (unit), Jest (integration), Cucumber (BDD/acceptance)
- BDD: escribir escenarios en lenguaje de negocio antes del código
- `make test` y cómo leer los resultados
- **Ejercicio con Claude**: el agente `testing` escribe un test para un escenario de Betix dado en lenguaje natural

---

## Módulo 5 — CI/CD: de commit a producción
- Qué es un pipeline y qué problema resuelve
- Los dos workflows de Betix: `ci-core.yml` y `ci-api.yml`, path filters
- Lectura de un run fallido en GitHub Actions: cómo diagnosticar sin pánico
- **Ejercicio con Claude**: simular un fallo de CI en Betix y usar Claude para diagnosticarlo y proponer el fix

---

## Módulo 6 — Infraestructura como código
- Docker: imágenes, contenedores, `docker-compose` para dev local
- Kubernetes: namespaces, deployments, services — `make k8s-apply` en minikube
- Terraform: infraestructura AWS (EKS, ECR, VPC) — solo lectura/comprensión
- **Ejercicio con Claude**: el agente `infra` interpreta un manifiesto k8s de Betix y explica qué despliega

---

## Módulo 7 — Gestión de tickets con Jira + Git
- Del ticket al branch: convención `BETIX-XX` en el nombre de la rama y en commits
- Trazabilidad: de un bug en prod → al commit → al ticket
- **Ejercicio con Claude**: tomar un ticket ficticio de Jira, crear la rama correcta y el primer commit con el mensaje adecuado

---

## Módulo 8 — Versionado y releases
- Semver: MAJOR.MINOR.PATCH y cuándo usar cada uno
- Release Please: cómo los conventional commits generan el CHANGELOG y bumpa versiones automáticamente
- Tags de ECR: `sha-`, `-rc.`, `latest`
- **Ejercicio**: hacer un merge a `develop` con cambios en `core/` y observar qué jobs de CI corren (y cuáles no)

---

## Módulo 9 — Hands-on: construir un requisito de punta a punta
> Escenario: *"Como analista, quiero ver el total de ventas del mes actual en el dashboard de Betix"*

1. Crear ticket ficticio en Jira → rama `feature/BETIX-99-ventas-mes-actual`
2. **Claude** escribe el escenario Cucumber (agente `testing`)
3. **Claude** implementa el endpoint Flask en `core/` (agente `microservices`)
4. **Claude** conecta el proxy Node.js en `src/` (agente `microservices`)
5. **Claude** actualiza el widget D3.js en `src/public/` (agente `frontend`)
6. Tests pasan (`make test`) → PR a `develop` → revisión → merge
7. CI corre automáticamente → imágenes taggeadas con SHA

---

## Módulo 10 — Operación y observabilidad
- Logs estructurados: Winston (JS) y cómo leerlos en `make logs`
- Debugging en contenedores: `docker exec`, `kubectl logs`
- **Claude** como primer nivel de diagnóstico: pegar un stacktrace y pedir análisis
- Cierre: qué hace a una plataforma "viva" — retroalimentación, mejora continua, ownership compartido
