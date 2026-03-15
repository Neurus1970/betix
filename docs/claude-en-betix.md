# Claude en Betix

> Este documento explica cómo Claude Code está configurado en este proyecto: qué sub-agentes existen, cómo colaboran entre sí, qué automatizan los hooks y qué playbooks están disponibles. Está pensado para desarrolladores que llegan al proyecto por primera vez.

---

## Por qué Claude es parte del repositorio

En la mayoría de los equipos, el contexto del proyecto vive en la cabeza de las personas: quién sabe cómo está montada la arquitectura, qué convenciones se siguen, qué partes son frágiles. Ese conocimiento se pierde cuando alguien sale del equipo, y se transmite de forma ineficiente durante el onboarding.

En Betix, ese contexto está codificado en archivos que viven junto al código de producción:

```
.claude/
├── agents/          # Sub-agentes especializados por área
├── skills/          # Playbooks reutilizables paso a paso
├── hooks/           # Automatizaciones del ciclo de trabajo
└── settings.json    # Configuración del proyecto (versionada)

CLAUDE.md            # Instrucciones globales del proyecto para Claude
```

Cuando un desarrollador clona el repositorio, obtiene automáticamente el mismo Claude configurado que el resto del equipo. No hay setup manual, no hay prompts que transmitir por Slack.

> **Principio:** la plataforma es el repositorio. Lo que vive en `.claude/` es conocimiento del equipo — se versiona, se revisa en PR y evoluciona con el proyecto igual que el código de producción.

---

## CLAUDE.md — las instrucciones globales

El archivo `CLAUDE.md` en la raíz del proyecto es el punto de partida que Claude lee antes de cualquier tarea. Contiene:

- El mapa del repositorio (`src/`, `core/`, `frontend/`, etc.)
- Las reglas críticas de arquitectura (business logic solo en `core/`)
- Las convenciones de código (CommonJS, PEP 8, naming de ramas)
- El sistema de versionado y los comandos esenciales
- La tabla de delegación a sub-agentes

Si una regla importante del proyecto no está en `CLAUDE.md`, Claude no puede seguirla consistentemente. Cuando el equipo acuerda una nueva convención, el primer lugar donde documentarla es aquí.

---

## Sub-agentes especializados

Betix define cuatro sub-agentes, cada uno con su propio archivo de contexto en `.claude/agents/`. Un sub-agente es una instancia de Claude que recibe solo el contexto relevante para su área — no todo el contexto del proyecto — lo que lo hace más preciso y menos propenso a errores fuera de su dominio.

### Cuándo usar un sub-agente

El agente principal (el que estás leyendo ahora) delega en sub-agentes según qué archivos afecta la tarea. La regla general es:

| La tarea toca... | Delegar al agente |
|-----------------|-------------------|
| `core/` (Python) o `src/` (Node.js) — solo producción | **microservices** |
| `tests/`, `features/`, `core/tests/` — cualquier test | **testing** |
| `docker-compose.yml`, `k8s/`, `terraform/`, `.github/workflows/`, `db/` | **infra** |
| `frontend/` (nginx) o `src/public/` (HTML/CSS/JS/D3.js) | **frontend** |

---

### Agente `microservices`

**Archivo:** `.claude/agents/microservices.md`

Especialista en los dos microservicios de la capa de aplicación:

- **`core/`** — Python 3.12 + Flask (puerto 5000): toda la lógica de negocio. Endpoints, servicios, modelos.
- **`src/`** — Node.js 18 + Express (puerto 3000): thin proxy HTTP hacia core. No contiene lógica de negocio.

**Ejemplos de tareas para este agente:**
- Agregar un endpoint nuevo en Flask (`core/main.py` + `core/services/`)
- Corregir un bug en las proyecciones SMA
- Actualizar el proxy Node.js para pasar un nuevo parámetro al core
- Implementar una feature que requiere cambios en Python y en Node.js

**Límite importante:** este agente **no escribe ni corrige tests**. Cuando hace un cambio de producción que requiere actualizar tests, la tarea de testing se delega al agente `testing` por separado.

---

### Agente `testing`

**Archivo:** `.claude/agents/testing.md`

Especialista en las tres capas de tests de Betix:

| Suite | Herramienta | Ubicación |
|-------|-------------|-----------|
| Unit / Integration (Node.js) | Jest + Supertest + nock | `tests/*.test.js` |
| Functional / BDD | Cucumber | `features/` |
| Unit (Python core) | pytest | `core/tests/` |

**Ejemplos de tareas para este agente:**
- Escribir tests para un endpoint nuevo
- Corregir un test roto después de un cambio de schema
- Actualizar los nocks de nock cuando cambia el formato de respuesta del core
- Agregar un escenario Cucumber para una feature existente
- Diagnosticar por qué un test falla en CI pero no en local

**El agente `testing` siempre debe ser consultado cuando:**
- El agente `microservices` o `infra` hace un cambio que afecta el contrato de una API
- Se agrega una tabla nueva a la base de datos (los fixtures de test usan los CSVs de `db/seeds/`)
- Cambia el formato de respuesta de un endpoint (los nocks de Cucumber necesitan actualizarse)

---

### Agente `infra`

**Archivo:** `.claude/agents/infra.md`

Especialista en toda la infraestructura del proyecto:

- **`docker-compose.yml`** — orquestación local (db, redis, core, api, frontend)
- **`db/`** — migraciones PostgreSQL y seeds CSV
- **`k8s/`** — manifiestos Kubernetes (namespace `betix`)
- **`terraform/`** — infraestructura AWS (EKS, ECR, VPC, RDS)
- **`.github/workflows/`** — pipelines de CI/CD

**Ejemplos de tareas para este agente:**
- Agregar un nuevo servicio a docker-compose
- Crear un workflow de GitHub Actions
- Modificar el schema de la base de datos (nueva tabla, nueva columna)
- Actualizar los manifiestos de Kubernetes para un nuevo deployment
- Cambiar la infraestructura AWS en Terraform

**Advertencia:** los cambios en `terraform/` y `k8s/` están protegidos por un hook de pre-edición (ver sección Hooks más abajo). El agente no puede editarlos sin aprobación explícita.

---

### Agente `frontend`

**Archivo:** `.claude/agents/frontend.md`

Especialista en la capa de presentación:

- **`frontend/`** — configuración de nginx (reverse proxy, rutas estáticas)
- **`src/public/`** — HTML, CSS y JavaScript del cliente (visualizaciones D3.js)

**Páginas disponibles:**
- `/dashboard` — dashboard principal con 5 tabs de visualizaciones D3.js (mapa, sunburst, sankey, tabla, proyecciones)
- `/backoffice` — gestión de asignaciones provincia↔juego (kanban + matriz)

**Ejemplos de tareas para este agente:**
- Agregar un nuevo gráfico D3.js al dashboard
- Modificar el layout de una página
- Actualizar la configuración de nginx para una nueva ruta
- Corregir un bug visual en el backoffice

---

## Cómo colaboran los agentes

La regla de oro es: **un agente hace su parte y luego otro agente hace la suya**. No se mezclan responsabilidades.

### Caso típico: agregar un endpoint nuevo

```
1. microservices → implementa el endpoint en core/ y el proxy en src/
2. testing       → escribe los tests Jest, pytest y el escenario Cucumber
3. frontend      → (si aplica) consume el endpoint desde el dashboard
```

Los pasos 1 y 3 pueden correr en paralelo si no hay dependencia entre ellos. El paso 2 siempre espera al 1 porque necesita saber el contrato del endpoint.

### Caso típico: cambio de schema en la base de datos

```
1. infra         → modifica db/migrations/ y db/seeds/
2. microservices → actualiza los services de Python que usan esa tabla
3. testing       → actualiza los fixtures y tests que dependen de los CSVs
```

### Caso típico: bug en un test roto

```
testing          → diagnostica y corrige, puede necesitar leer src/ o core/ para entender el contrato
```

En este caso es solo el agente `testing` — no hay cambio de producción.

### Cuándo corren en paralelo

Los agentes pueden correr en paralelo cuando sus cambios no se pisan. Por ejemplo, si una feature requiere:
- Un nuevo endpoint en el core (microservices)
- Un nuevo widget en el dashboard (frontend)
- Un nuevo workflow de CI (infra)

Los tres pueden trabajar en paralelo porque cada uno toca archivos distintos.

---

## Hooks automáticos

Los hooks son comandos que Claude ejecuta automáticamente en respuesta a eventos de su ciclo de trabajo. Están configurados en `.claude/settings.json` y los scripts viven en `.claude/hooks/scripts/`.

### Hooks activos

| Evento | Condición | Qué hace |
|--------|-----------|----------|
| **PreToolUse** (Edit/Write) | Archivo en `terraform/` o `k8s/` | **Bloquea** la edición — requiere aprobación explícita antes de continuar |
| **PreToolUse** (Bash) | Comando `git checkout -b` | Valida que el nombre de rama siga la convención (`feature/BETIX-XX-...`, etc.) |
| **PostToolUse** (Edit/Write) | Archivo JS en `src/` o `tests/` | Ejecuta ESLint automáticamente y reporta errores |

### Por qué existe el bloqueo de `terraform/` y `k8s/`

Los cambios en infraestructura tienen blast radius alto: un error en Terraform puede afectar la VPC completa; un manifiesto k8s mal configurado puede tirar un deployment en producción. El hook de pre-edición actúa como un checkpoint — Claude debe mostrar qué va a cambiar y recibir confirmación antes de escribir.

### Por qué existe la validación de ramas

Los nombres de rama están atados a la automatización de Jira: el hook de pre-bash bloquea ramas con prefijos inválidos (`feat/`, `release/`, etc.) antes de crearlas. Esto evita que una rama llegue a un PR con el nombre incorrecto, lo que rompería la transición automática de tickets.

---

## Skills (playbooks)

Los skills son playbooks paso a paso para flujos comunes del proyecto. Están en `.claude/skills/` y se invocan con `/skill-name`.

### `add-endpoint`

**Archivo:** `.claude/skills/add-endpoint.md`

Guía el proceso completo de agregar un endpoint nuevo de punta a punta:

1. Implementar la ruta y el service en `core/` (Python)
2. Agregar el controller y la ruta proxy en `src/` (Node.js)
3. Escribir los tests: pytest, Jest y escenario Cucumber
4. Verificar con `make test` y `make lint`

Este skill es útil porque garantiza que ningún paso se salte — en particular, que los tests se escriban antes de dar el trabajo por terminado.

### `release`

**Archivo:** `.claude/skills/release.md`

Documenta cómo funciona el versionado automatizado con Release Please:
- Qué convenciones de commits generan un bump de versión
- Cómo se generan los tags de ECR (`sha-`, `-rc.`, `latest`)
- Los comandos de emergencia (`make bump-*`) y cuándo NO usarlos

---

## Qué es personal y qué es del equipo

| Archivo / carpeta | Versionado | Para qué sirve |
|---|---|---|
| `CLAUDE.md` | Sí | Instrucciones globales del proyecto |
| `.claude/agents/` | Sí | Contexto especializado por área |
| `.claude/skills/` | Sí | Playbooks de flujos comunes |
| `.claude/hooks/` | Sí | Automatizaciones del ciclo de trabajo |
| `.claude/settings.json` | Sí | Config del proyecto (sin credenciales) |
| `.mcp.json` | Sí | Config del servidor MCP de Jira |
| `.claude/settings.local.json` | No (`.gitignore`) | Preferencias personales (tokens, overrides) |
| `.claude/worktrees/` | No (`.gitignore`) | Worktrees temporales — locales, no compartidos |

Las credenciales del servidor MCP de Jira van en `.claude/settings.local.json`. Ver instrucciones en [docs/onboarding/modulos/1.md](onboarding/modulos/1.md#configurar-el-servidor-mcp-de-jira).

---

## Para profundizar

- **Arquitectura del proyecto** → [docs/ArquitecturaC4.md](ArquitecturaC4.md)
- **Módulo 3 del onboarding** → [Claude Code como herramienta de SDLC](onboarding/modulos/3.md)
- **Configuración de Claude Code** → [docs/onboarding/modulos/1.md](onboarding/modulos/1.md)
- **Claude Code (documentación oficial)** → https://docs.anthropic.com/en/docs/claude-code
