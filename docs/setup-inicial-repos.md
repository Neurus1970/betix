# Setup inicial de repositorios — Guía para administradores de plataforma

Este documento describe cómo usar el script `scripts/init-repo.sh` para configurar un repositorio GitHub nuevo con todas las políticas estándar de la plataforma. El script es genérico y reutilizable.

---

## Cuándo usar este script

Cada vez que se crea un repositorio nuevo dentro de la organización. El objetivo es que todos los repos arranquen con la misma configuración de seguridad, políticas de ramas y labels, sin depender de la memoria o el criterio del administrador que lo configura.

El script es **idempotente**: se puede ejecutar más de una vez sobre el mismo repo sin efectos negativos. Si algo ya está configurado, lo actualiza; si no existe, lo crea.

---

## Prerequisitos

### 1. `gh` CLI instalado

```bash
# macOS
brew install gh

# Linux
sudo apt install gh   # o el package manager de la distro
```

Verificar instalación:

```bash
gh --version
```

### 2. Autenticación con GitHub

**Opción A — Autenticación interactiva** (recomendada para uso local):

```bash
gh auth login
```

Seguir el wizard. Seleccionar GitHub.com o GitHub Enterprise según corresponda.

**Opción B — Token por variable de entorno** (recomendada para CI/CD o scripts automatizados):

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

**Opción C — Token por parámetro** (ver sección de parámetros):

```bash
./scripts/init-repo.sh --github-token ghp_xxx ...
```

### 3. Permisos requeridos del token

El Personal Access Token (PAT) debe tener los siguientes scopes:

| Scope | Para qué |
|-------|----------|
| `repo` | Leer y escribir configuración del repositorio, branch protection, labels |
| `admin:org` | Asignar equipos al repo (solo necesario si se usa `--team`) |

Para repositorios en **GitHub Enterprise**, el token debe ser generado en la instancia Enterprise correspondiente, no en github.com.

---

## Parámetros del script

### Parámetros requeridos

| Parámetro | Descripción | Ejemplo |
|-----------|-------------|---------|
| `--repo` | Nombre del repositorio en formato `owner/repo` o `org/repo` | `MiOrg/mi-servicio` |
| `--jira-project` | Clave del proyecto Jira asociado. Se usa para construir el patrón de validación de nombres de rama | `BETIX` |
| `--jira-url` | URL base de la instancia Jira | `https://mi-org.atlassian.net` |
| `--ci-checks` | Nombres de los jobs de CI que deben pasar antes de poder mergear, separados por coma. Deben coincidir exactamente con los nombres de los jobs en los workflows de GitHub Actions | `test-core,lint-and-test` |

> **Cómo obtener los nombres de CI checks:** abrir cualquier archivo en `.github/workflows/` del repo y buscar las claves de primer nivel bajo `jobs:`. Cada clave es un job name. Por ejemplo, si el workflow tiene `jobs: { test-core: ... }`, el check se llama `test-core`.

### Parámetros opcionales

| Parámetro | Descripción | Default |
|-----------|-------------|---------|
| `--github-token` | PAT de GitHub. Si no se pasa, usa la sesión activa del `gh` CLI | *(sesión activa)* |
| `--develop-branch` | Nombre de la rama de integración | `develop` |
| `--main-branch` | Nombre de la rama de producción | `main` |
| `--required-approvals` | Número de approvals requeridos para mergear a la rama de producción | `1` |
| `--enforce-admins` | Si `true`, las reglas de branch protection aplican también a los admins del repo. Si `false`, los admins pueden hacer bypass | `false` |
| `--team` | Slug del equipo de GitHub al que se le dará permiso `push` sobre el repo. Solo funciona si el repo pertenece a una organización | *(sin equipo)* |
| `--help` | Muestra la ayuda del script y sale | — |

---

## Qué configura el script paso a paso

### Paso 1 — Repository settings

Configura las opciones generales del repositorio:

- **Squash merge habilitado** — los commits de un PR se compactan en uno solo al mergear. Mantiene el historial de `develop` y `main` limpio y legible.
- **Rebase merge habilitado** — alternativa al squash para mantener commits individuales sin merge commit.
- **Merge commit deshabilitado** — evita los commits de merge que ensucian el historial (`Merge branch 'feature/...' into develop`).
- **Delete branch on merge** — borra automáticamente la rama del PR al hacer merge. Evita acumulación de ramas muertas.
- **Projects deshabilitado** — el tracking se hace en Jira, no en GitHub Projects.

### Paso 2 — Branch protection en la rama de integración (`develop`)

Protege la rama donde se integra todo el trabajo del equipo:

- **PR obligatorio**: nadie puede pushear directamente a `develop`, ni siquiera el admin (si `--enforce-admins true`). Todo cambio debe entrar vía Pull Request.
- **0 approvals requeridos**: el PR es obligatorio como mecanismo de proceso (dispara CI, crea registro, habilita review), pero no bloquea si no hay reviewer disponible. Apropiado para equipos pequeños. Ajustar con `--required-approvals` si el equipo crece.
- **CI requerido**: los checks pasados en `--ci-checks` deben estar en verde antes de poder mergear. Si el workflow no se disparó (porque los paths del PR no lo incluyen), GitHub lo considera automáticamente aprobado — no bloquea.
- **No force push**: protege el historial de la rama.
- **No delete**: la rama `develop` no puede borrarse accidentalmente.
- **Required conversation resolution**: todos los comentarios del PR deben estar resueltos antes de mergear.

### Paso 3 — Branch protection en la rama de producción (`main`)

Reglas más estrictas para el código que va a producción:

- Todo lo del Paso 2, más:
- **N approvals requeridos** (configurable con `--required-approvals`, default 1): al menos un reviewer debe aprobar el PR.
- **Dismiss stale reviews**: si se pushean nuevos commits al PR después de un approval, el approval se invalida automáticamente. Evita que un approval viejo pase código que fue modificado después.

### Paso 4 — Ruleset de naming convention de ramas

Intenta crear una regla que valide el nombre de cada rama nueva antes de que se pueda pushear al servidor.

El patrón generado usa la clave Jira del parámetro `--jira-project`:

```
^(feature|fix|refactor|hotfix)/JIRA_PROJECT-[0-9]+-[a-zA-Z0-9-]+$
```

Ejemplos de nombres válidos (con `--jira-project BETIX`):
```
feature/BETIX-41-platform-rules-enforcement   ✅
fix/BETIX-42-endpoint-bug                     ✅
refactor/BETIX-43-cleanup-proxy               ✅
hotfix/BETIX-44-prod-fix                      ✅
feat/mi-feature                               ❌  prefijo inválido
feature/nueva-funcionalidad                   ❌  falta ID de Jira
feature/BETIX-nueva-funcionalidad             ❌  ID de Jira debe ser numérico
```

Las ramas `main` y `develop` están excluidas del ruleset — sus nombres son correctos por definición.

> **Importante — Compatibilidad de plan:** esta funcionalidad requiere **GitHub Team o GitHub Enterprise**. En GitHub Free, el script emite un `[WARN]` e imprime el patrón para configuración manual, pero no falla ni aborta.

### Paso 5 — Labels estándar

Elimina los labels default que crea GitHub (bug, enhancement, good first issue, etc.) y los reemplaza por el set estándar de la plataforma:

| Label | Color | Uso |
|-------|-------|-----|
| `feature` | azul `#0075ca` | Nueva funcionalidad |
| `fix` | rojo `#d73a4a` | Corrección de bug |
| `hotfix` | rojo oscuro `#b60205` | Fix urgente en producción |
| `refactor` | amarillo `#e4e669` | Refactorización sin cambio de comportamiento |
| `dependencies` | azul `#0366d6` | Actualización de dependencias |
| `documentation` | gris `#cfd3d7` | Cambios en documentación |
| `infrastructure` | rosa `#f9d0c4` | Cambios de infraestructura |

### Paso 6 — Permisos de equipo

Solo se ejecuta si se pasa `--team`. Otorga permiso `push` al equipo indicado sobre el repositorio. Requiere que:
- El repo pertenezca a una organización (no a un usuario personal).
- El token tenga scope `admin:org`.
- El slug del equipo sea correcto (se puede verificar en `github.com/orgs/ORG/teams`).

---

## Ejemplos de uso

### Caso mínimo — equipo pequeño, un solo developer

```bash
./scripts/init-repo.sh \
  --repo MiOrg/mi-nuevo-servicio \
  --jira-project PROJ \
  --jira-url https://mi-org.atlassian.net \
  --ci-checks lint,test
```

### Caso equipo mediano — con approvals y equipo asignado

```bash
./scripts/init-repo.sh \
  --repo MiOrg/mi-nuevo-servicio \
  --github-token ghp_xxxxxxxxxxxxxxxxxxxx \
  --jira-project PROJ \
  --jira-url https://mi-org.atlassian.net \
  --ci-checks lint,test,integration-test \
  --required-approvals 2 \
  --enforce-admins true \
  --team backend-team
```

### Caso GitHub Enterprise — configuración completa

```bash
./scripts/init-repo.sh \
  --repo MiEmpresa/mi-servicio \
  --github-token ghp_xxxxxxxxxxxxxxxxxxxx \
  --jira-project SERV \
  --jira-url https://mi-empresa.atlassian.net \
  --ci-checks pytest,jest,sonar \
  --develop-branch develop \
  --main-branch main \
  --required-approvals 1 \
  --enforce-admins false \
  --team squad-plataforma
```

---

## Output esperado

El script imprime el estado de cada paso con prefijos de color:

```
[INFO]  Repositorio: https://github.com/MiOrg/mi-servicio
[INFO]  CI checks:   lint,test

==> Paso 1: Repository settings
[OK]   Repository settings aplicados (squash/rebase merge, delete on merge, no projects)

==> Paso 2: Branch protection — develop
[OK]   Branch protection aplicada en 'develop' (PR obligatorio, 0 approvals, CI: lint,test)

==> Paso 3: Branch protection — main
[OK]   Branch protection aplicada en 'main' (PR + 1 approval(s), dismiss stale, CI requerido)

==> Paso 4: Ruleset — naming convention de ramas
[OK]   Ruleset 'branch-naming-convention' creado  ← solo en GitHub Team/Enterprise
# o bien:
[WARN]  Ruleset no disponible en el plan actual (requiere GitHub Team/Enterprise). HTTP 422.
[WARN]  Patrón a configurar manualmente: ^(feature|fix|refactor|hotfix)/PROJ-[0-9]+-[a-zA-Z0-9-]+$

==> Paso 5: Labels estándar
[OK]   Label 'bug' eliminado
...
[OK]   Label 'feature' creado (#0075ca)
...

==> Paso 6: Permisos de equipo
[SKIP]  No se pasó --team. Omitiendo configuración de permisos de equipo.
```

Al finalizar imprime un resumen con links directos a la configuración del repo en GitHub.

---

## Qué hacer después de ejecutar el script

1. **Verificar branch protection** en `https://github.com/ORG/REPO/settings/branches` — confirmar que `develop` y `main` aparecen con los candados de protección.

2. **Verificar labels** en `https://github.com/ORG/REPO/labels` — confirmar que el set estándar está presente.

3. **Verificar ruleset** (solo GitHub Team/Enterprise) en `https://github.com/ORG/REPO/settings/rules` — confirmar que el ruleset `branch-naming-convention` está activo.

4. **Crear las ramas iniciales** si el repo está vacío. La branch protection solo aplica a ramas que existen:

```bash
git checkout -b develop
git push origin develop
git checkout main
git push origin main
```

5. **Configurar el default branch** en GitHub → Settings → General → Default branch → cambiar a `develop`.

---

## Troubleshooting

### `gh CLI no está autenticado`

```bash
gh auth login
# o
export GITHUB_TOKEN=ghp_xxx
```

### `Branch not found` al aplicar protección

La rama debe existir en el repo antes de poder protegerla. Crear y pushear la rama primero (ver paso 4 de "Qué hacer después").

### `Must have admin rights to Repository` (HTTP 403)

El token no tiene permisos suficientes sobre el repo. Verificar que el usuario es admin del repo y que el token tiene scope `repo`.

### `Validation Failed` en branch protection (HTTP 422)

Los nombres en `--ci-checks` no coinciden exactamente con los job names en los workflows. Verificar en `.github/workflows/` el nombre exacto del job bajo la clave `jobs:`.

### Ruleset da `[WARN]` en GitHub Free

Es el comportamiento esperado. El script no falla — solo avisa. Cuando el repo migre a GitHub Enterprise, volver a ejecutar el script con los mismos parámetros: el Paso 4 va a funcionar correctamente sin cambios en el comando.
