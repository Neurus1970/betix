#!/bin/sh
# =============================================================================
# init-repo.sh — Inicializa y configura un repositorio GitHub con las
#                políticas estándar de la plataforma Betix / Tecno Acción.
#
# Uso:
#   ./scripts/init-repo.sh --repo MyOrg/my-repo --jira-project BETIX \
#     --jira-url https://mi-org.atlassian.net --ci-checks test-core,lint-and-test
#
# Requisitos:
#   - gh CLI instalado y autenticado (o pasar --github-token)
#   - Permisos de admin sobre el repo destino
# =============================================================================
set -euo pipefail

# -----------------------------------------------------------------------------
# Colores y prefijos de output
# -----------------------------------------------------------------------------
RED=$(printf '\033[0;31m')
GREEN=$(printf '\033[0;32m')
YELLOW=$(printf '\033[1;33m')
BLUE=$(printf '\033[0;34m')
CYAN=$(printf '\033[0;36m')
BOLD=$(printf '\033[1m')
RESET=$(printf '\033[0m')

ok()   { printf "${GREEN}[OK]${RESET}   %s\n" "$*"; }
warn() { printf "${YELLOW}[WARN]${RESET}  %s\n" "$*"; }
err()  { printf "${RED}[ERROR]${RESET} %s\n" "$*" >&2; }
skip() { printf "${CYAN}[SKIP]${RESET}  %s\n" "$*"; }
info() { printf "${BLUE}[INFO]${RESET}  %s\n" "$*"; }
header() { printf "\n${BOLD}==> %s${RESET}\n" "$*"; }

# -----------------------------------------------------------------------------
# Trap para errores inesperados
# -----------------------------------------------------------------------------
trap 'err "El script falló en la línea $LINENO. Abortando."; exit 1' ERR

# -----------------------------------------------------------------------------
# Valores por defecto
# -----------------------------------------------------------------------------
REPO=""
GITHUB_TOKEN_FLAG=""
JIRA_PROJECT=""
JIRA_URL=""
CI_CHECKS=""
DEVELOP_BRANCH="develop"
MAIN_BRANCH="main"
REQUIRED_APPROVALS="1"
ENFORCE_ADMINS="false"
TEAM=""

# -----------------------------------------------------------------------------
# Ayuda
# -----------------------------------------------------------------------------
usage() {
  cat <<EOF

${BOLD}NOMBRE${RESET}
    init-repo.sh — Configura un repositorio GitHub con las políticas estándar
                   de la plataforma (branch protection, labels, rulesets, etc.)

${BOLD}USO${RESET}
    $0 [FLAGS]

${BOLD}FLAGS REQUERIDOS${RESET}
    --repo            org/repo o owner/repo del repositorio destino
                      Ejemplo: MyOrg/my-repo
    --jira-project    Clave del proyecto Jira (para patrón de nombres de rama)
                      Ejemplo: BETIX
    --jira-url        URL base de la instancia Jira
                      Ejemplo: https://mi-org.atlassian.net
    --ci-checks       Job names de CI requeridos, separados por coma
                      Ejemplo: test-core,lint-and-test

${BOLD}FLAGS OPCIONALES${RESET}
    --github-token    Personal Access Token con scopes repo y admin:org.
                      Si no se pasa, se usa la autenticación activa del gh CLI.
    --develop-branch  Rama de integración (default: develop)
    --main-branch     Rama de producción (default: main)
    --required-approvals  Cantidad de approvals requeridos para --main-branch
                          (default: 1)
    --enforce-admins  Aplicar reglas también a admins del repo (default: false)
    --team            Slug del equipo GitHub al que dar permiso push (opcional)
                      Ejemplo: backend-team
    --help            Muestra esta ayuda y sale

${BOLD}EJEMPLO COMPLETO${RESET}
    $0 \\
      --repo MyOrg/my-repo \\
      --github-token ghp_xxx \\
      --jira-project BETIX \\
      --jira-url https://mi-org.atlassian.net \\
      --ci-checks test-core,lint-and-test \\
      --develop-branch develop \\
      --main-branch main \\
      --required-approvals 1 \\
      --enforce-admins false \\
      --team backend-team

${BOLD}QUÉ CONFIGURA${RESET}
    1. Repository settings (squash merge, delete branch on merge, etc.)
    2. Branch protection en --develop-branch (PR obligatorio, 0 approvals)
    3. Branch protection en --main-branch (PR + N approvals + dismiss stale)
    4. Ruleset de naming convention de ramas (requiere GitHub Team/Enterprise)
    5. Labels estándar (elimina defaults, crea el set de la plataforma)
    6. Permisos del equipo sobre el repo (si se pasa --team)

EOF
}

# -----------------------------------------------------------------------------
# Parseo de argumentos
# -----------------------------------------------------------------------------
while [ $# -gt 0 ]; do
  case "$1" in
    --help)
      usage
      exit 0
      ;;
    --repo)
      REPO="$2"; shift 2 ;;
    --github-token)
      GITHUB_TOKEN_FLAG="$2"; shift 2 ;;
    --jira-project)
      JIRA_PROJECT="$2"; shift 2 ;;
    --jira-url)
      JIRA_URL="$2"; shift 2 ;;
    --ci-checks)
      CI_CHECKS="$2"; shift 2 ;;
    --develop-branch)
      DEVELOP_BRANCH="$2"; shift 2 ;;
    --main-branch)
      MAIN_BRANCH="$2"; shift 2 ;;
    --required-approvals)
      REQUIRED_APPROVALS="$2"; shift 2 ;;
    --enforce-admins)
      ENFORCE_ADMINS="$2"; shift 2 ;;
    --team)
      TEAM="$2"; shift 2 ;;
    *)
      err "Flag desconocido: $1"
      usage
      exit 1
      ;;
  esac
done

# -----------------------------------------------------------------------------
# Modo interactivo — se activa cuando faltan requeridos y stdin es una TTY
# -----------------------------------------------------------------------------
prompt_required() {
  _prompt="$1"
  _example="$2"
  while true; do
    printf "${BOLD}%s${RESET}" "$_prompt" >&2
    [ -n "$_example" ] && printf " ${CYAN}(ej: %s)${RESET}" "$_example" >&2
    printf ": " >&2
    read -r _val
    [ -n "$_val" ] && { printf '%s' "$_val"; return 0; }
    printf "${RED}  Este campo es requerido.${RESET}\n" >&2
  done
}

prompt_optional() {
  _prompt="$1"
  _default="$2"
  printf "${BOLD}%s${RESET} [${CYAN}%s${RESET}]: " "$_prompt" "$_default" >&2
  read -r _val
  [ -n "$_val" ] && printf '%s' "$_val" || printf '%s' "$_default"
}

NEEDS_INTERACTIVE=0
{ [ -z "$REPO" ] || [ -z "$JIRA_PROJECT" ] || [ -z "$JIRA_URL" ] || [ -z "$CI_CHECKS" ]; } && NEEDS_INTERACTIVE=1

if [ "$NEEDS_INTERACTIVE" = "1" ]; then
  if [ ! -t 0 ]; then
    err "Modo no interactivo: faltan parámetros requeridos (--repo, --jira-project, --jira-url, --ci-checks)"
    usage
    exit 1
  fi

  printf "\n${BOLD}${BLUE}Modo interactivo — completar los parámetros faltantes${RESET}\n"
  printf "${CYAN}(Los campos opcionales muestran el valor por defecto entre corchetes; Enter para aceptar)${RESET}\n\n"

  [ -z "$REPO" ]         && REPO=$(prompt_required         "Repositorio (owner/repo)"             "MyOrg/my-repo")
  [ -z "$JIRA_PROJECT" ] && JIRA_PROJECT=$(prompt_required "Clave del proyecto Jira"               "BETIX")
  [ -z "$JIRA_URL" ]     && JIRA_URL=$(prompt_required     "URL base de Jira"                      "https://org.atlassian.net")
  [ -z "$CI_CHECKS" ]    && CI_CHECKS=$(prompt_required    "Jobs de CI requeridos (separados por coma)" "test-core,lint-and-test")

  DEVELOP_BRANCH=$(prompt_optional  "Rama de integración"                          "$DEVELOP_BRANCH")
  MAIN_BRANCH=$(prompt_optional     "Rama de producción"                           "$MAIN_BRANCH")
  REQUIRED_APPROVALS=$(prompt_optional "Approvals requeridos (main)"               "$REQUIRED_APPROVALS")
  ENFORCE_ADMINS=$(prompt_optional  "Aplicar reglas a admins (true/false)"         "$ENFORCE_ADMINS")
  TEAM=$(prompt_optional            "Equipo GitHub (slug, dejar vacío para omitir)" "$TEAM")
fi

# -----------------------------------------------------------------------------
# Validación de parámetros requeridos
# -----------------------------------------------------------------------------
MISSING=""
[ -z "$REPO" ]          && MISSING="${MISSING}  --repo\n"
[ -z "$JIRA_PROJECT" ]  && MISSING="${MISSING}  --jira-project\n"
[ -z "$JIRA_URL" ]      && MISSING="${MISSING}  --jira-url\n"
[ -z "$CI_CHECKS" ]     && MISSING="${MISSING}  --ci-checks\n"

if [ -n "$MISSING" ]; then
  err "Faltan parámetros requeridos:"
  printf "${RED}%b${RESET}" "$MISSING" >&2
  usage
  exit 1
fi

# Validar formato de REPO
case "$REPO" in
  */*) : ;;  # contiene slash, formato correcto
  *)
    err "--repo debe tener el formato owner/repo (ej: MyOrg/my-repo)"
    exit 1
    ;;
esac

# Validar REQUIRED_APPROVALS es un número
case "$REQUIRED_APPROVALS" in
  ''|*[!0-9]*)
    err "--required-approvals debe ser un número entero (ej: 1)"
    exit 1
    ;;
esac

# Validar ENFORCE_ADMINS
case "$ENFORCE_ADMINS" in
  true|false) : ;;
  *)
    err "--enforce-admins debe ser 'true' o 'false'"
    exit 1
    ;;
esac

# -----------------------------------------------------------------------------
# Configurar autenticación
# -----------------------------------------------------------------------------
if [ -n "$GITHUB_TOKEN_FLAG" ]; then
  export GITHUB_TOKEN="$GITHUB_TOKEN_FLAG"
  info "Usando token proporcionado via --github-token"
fi

# Verificar que gh CLI está disponible
if ! command -v gh > /dev/null 2>&1; then
  err "gh CLI no encontrado. Instalarlo desde: https://cli.github.com/"
  exit 1
fi

# Verificar autenticación
if ! gh auth status > /dev/null 2>&1; then
  err "gh CLI no está autenticado. Ejecutar 'gh auth login' o pasar --github-token"
  exit 1
fi

# Extraer owner y repo name
OWNER="${REPO%%/*}"
REPO_NAME="${REPO#*/}"

# -----------------------------------------------------------------------------
# Construir JSON de checks requeridos a partir de --ci-checks
# Entrada: "test-core,lint-and-test"
# Salida:  [{"context":"test-core"},{"context":"lint-and-test"}]
# -----------------------------------------------------------------------------
build_checks_json() {
  checks_input="$1"
  result="["
  first=1
  # Iterar por cada check separado por coma
  OLD_IFS="$IFS"
  IFS=','
  for check in $checks_input; do
    # Eliminar espacios
    check="${check# }"
    check="${check% }"
    if [ $first -eq 1 ]; then
      result="${result}{\"context\":\"${check}\"}"
      first=0
    else
      result="${result},{\"context\":\"${check}\"}"
    fi
  done
  IFS="$OLD_IFS"
  result="${result}]"
  printf '%s' "$result"
}

CHECKS_JSON="$(build_checks_json "$CI_CHECKS")"

# -----------------------------------------------------------------------------
# Imprimir configuración que se va a aplicar
# -----------------------------------------------------------------------------
printf "\n${BOLD}${BLUE}╔══════════════════════════════════════════════════════════╗${RESET}\n"
printf "${BOLD}${BLUE}║  init-repo.sh — Configuración de plataforma             ║${RESET}\n"
printf "${BOLD}${BLUE}╚══════════════════════════════════════════════════════════╝${RESET}\n\n"

info "Repositorio:       https://github.com/${REPO}"
info "Jira project:      ${JIRA_PROJECT}"
info "Jira URL:          ${JIRA_URL}"
info "CI checks:         ${CI_CHECKS}"
info "Rama integración:  ${DEVELOP_BRANCH}"
info "Rama producción:   ${MAIN_BRANCH}"
info "Approvals (main):  ${REQUIRED_APPROVALS}"
info "Enforce admins:    ${ENFORCE_ADMINS}"
[ -n "$TEAM" ] && info "Equipo:            ${TEAM}"
printf "\n"

# =============================================================================
# PASO 1 — Repository settings
# =============================================================================
header "Paso 1: Repository settings"

gh api \
  --method PATCH \
  "/repos/${REPO}" \
  --field delete_branch_on_merge=true \
  --field allow_squash_merge=true \
  --field allow_merge_commit=false \
  --field allow_rebase_merge=true \
  --field has_projects=false \
  --silent

ok "Repository settings aplicados (squash/rebase merge, delete on merge, no projects)"

# =============================================================================
# PASO 2 — Branch protection: develop (rama de integración)
# =============================================================================
header "Paso 2: Branch protection — ${DEVELOP_BRANCH}"

gh api \
  --method PUT \
  "/repos/${REPO}/branches/${DEVELOP_BRANCH}/protection" \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": $(printf '%s' "$CHECKS_JSON")
  },
  "enforce_admins": ${ENFORCE_ADMINS},
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true
}
EOF

ok "Branch protection aplicada en '${DEVELOP_BRANCH}' (PR obligatorio, 0 approvals, CI: ${CI_CHECKS})"

# =============================================================================
# PASO 3 — Branch protection: main (rama de producción)
# =============================================================================
header "Paso 3: Branch protection — ${MAIN_BRANCH}"

gh api \
  --method PUT \
  "/repos/${REPO}/branches/${MAIN_BRANCH}/protection" \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": $(printf '%s' "$CHECKS_JSON")
  },
  "enforce_admins": ${ENFORCE_ADMINS},
  "required_pull_request_reviews": {
    "required_approving_review_count": ${REQUIRED_APPROVALS},
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "dismissal_restrictions": {}
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true
}
EOF

ok "Branch protection aplicada en '${MAIN_BRANCH}' (PR + ${REQUIRED_APPROVALS} approval(s), dismiss stale, CI requerido)"

# =============================================================================
# PASO 4 — Ruleset: branch naming convention
# Requiere GitHub Team o Enterprise. Si falla con 422, continúa con warning.
# =============================================================================
header "Paso 4: Ruleset — naming convention de ramas"

BRANCH_PATTERN="^(feature|fix|refactor|hotfix)/${JIRA_PROJECT}-[0-9]+-[a-zA-Z0-9-]+\$"

RULESET_RESPONSE_CODE=0

# Intentar crear el ruleset y capturar el HTTP status code
HTTP_STATUS=$(gh api \
  --method POST \
  "/repos/${REPO}/rulesets" \
  --input - \
  -i 2>/dev/null <<EOF | head -1 | awk '{print $2}'
{
  "name": "branch-naming-convention",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~ALL"],
      "exclude": [
        "refs/heads/${MAIN_BRANCH}",
        "refs/heads/${DEVELOP_BRANCH}"
      ]
    }
  },
  "rules": [
    {
      "type": "branch_name_pattern",
      "parameters": {
        "name": "branch-naming-convention",
        "negate": false,
        "operator": "regex",
        "pattern": "${BRANCH_PATTERN}"
      }
    }
  ]
}
EOF
) || RULESET_RESPONSE_CODE=$?

if [ "$HTTP_STATUS" = "201" ] || [ "$HTTP_STATUS" = "200" ]; then
  ok "Ruleset 'branch-naming-convention' creado (patrón: ${BRANCH_PATTERN})"
elif [ "$HTTP_STATUS" = "422" ] || [ "$HTTP_STATUS" = "404" ] || [ "$HTTP_STATUS" = "403" ]; then
  warn "Ruleset no disponible en el plan actual (requiere GitHub Team/Enterprise). HTTP ${HTTP_STATUS}."
  warn "Patrón a configurar manualmente cuando el plan lo permita: ${BRANCH_PATTERN}"
  warn "Excluir de la regla: refs/heads/${MAIN_BRANCH}, refs/heads/${DEVELOP_BRANCH}"
else
  # Intentar vía gh api sin -i para ver si ya existe el ruleset
  # En ese caso, intentar actualizar buscando por nombre
  warn "Ruleset respondió HTTP ${HTTP_STATUS:-desconocido}. Verificar manualmente en GitHub > Settings > Rules."
fi

# =============================================================================
# PASO 5 — Labels estándar
# =============================================================================
header "Paso 5: Labels estándar"

# Labels default de GitHub a eliminar (si existen)
DEFAULT_LABELS="bug documentation duplicate enhancement good_first_issue help_wanted invalid question wontfix"

info "Eliminando labels default de GitHub..."
for label in $DEFAULT_LABELS; do
  if gh api \
      --method DELETE \
      "/repos/${REPO}/labels/${label}" \
      --silent 2>/dev/null; then
    ok "  Label '${label}' eliminado"
  else
    skip "  Label '${label}' no encontrado (ya eliminado o nunca existió)"
  fi
done

# Labels estándar de la plataforma
info "Creando labels estándar de la plataforma..."

create_or_update_label() {
  label_name="$1"
  label_color="$2"
  label_description="$3"

  # Intentar crear primero
  if gh api \
      --method POST \
      "/repos/${REPO}/labels" \
      --field "name=${label_name}" \
      --field "color=${label_color}" \
      --field "description=${label_description}" \
      --silent 2>/dev/null; then
    ok "  Label '${label_name}' creado (#${label_color})"
  else
    # Si ya existe (422), actualizar
    if gh api \
        --method PATCH \
        "/repos/${REPO}/labels/${label_name}" \
        --field "color=${label_color}" \
        --field "description=${label_description}" \
        --silent 2>/dev/null; then
      ok "  Label '${label_name}' actualizado (#${label_color})"
    else
      warn "  No se pudo crear/actualizar label '${label_name}'"
    fi
  fi
}

create_or_update_label "feature"        "0075ca" "Nueva funcionalidad"
create_or_update_label "fix"            "d73a4a" "Corrección de bug"
create_or_update_label "hotfix"         "b60205" "Fix urgente en producción"
create_or_update_label "refactor"       "e4e669" "Refactorización sin cambio de comportamiento"
create_or_update_label "dependencies"   "0366d6" "Actualización de dependencias"
create_or_update_label "documentation"  "cfd3d7" "Cambios en documentación"
create_or_update_label "infrastructure" "f9d0c4" "Cambios de infraestructura"

# =============================================================================
# PASO 6 — Team permissions (opcional)
# =============================================================================
header "Paso 6: Permisos de equipo"

if [ -n "$TEAM" ]; then
  if gh api \
      --method PUT \
      "/orgs/${OWNER}/teams/${TEAM}/repos/${OWNER}/${REPO_NAME}" \
      --field "permission=push" \
      --silent 2>/dev/null; then
    ok "Equipo '${TEAM}' con permiso push sobre ${REPO}"
  else
    warn "No se pudo asignar permisos al equipo '${TEAM}'. Verificar que:"
    warn "  - El equipo existe en la org '${OWNER}'"
    warn "  - El token tiene scope admin:org"
    warn "  - El repo pertenece a una organización (no a un usuario)"
  fi
else
  skip "No se pasó --team. Omitiendo configuración de permisos de equipo."
fi

# =============================================================================
# RESUMEN FINAL
# =============================================================================
printf "\n${BOLD}${GREEN}╔══════════════════════════════════════════════════════════╗${RESET}\n"
printf "${BOLD}${GREEN}║  Configuración completada                                ║${RESET}\n"
printf "${BOLD}${GREEN}╚══════════════════════════════════════════════════════════╝${RESET}\n\n"

printf "  Repositorio:   ${BOLD}https://github.com/${REPO}${RESET}\n"
printf "  Branch protection:\n"
printf "    ${DEVELOP_BRANCH}  → PR obligatorio, 0 approvals, CI: ${CI_CHECKS}\n"
printf "    ${MAIN_BRANCH}     → PR + ${REQUIRED_APPROVALS} approval(s), dismiss stale, CI: ${CI_CHECKS}\n"
printf "  Naming convention: ${BRANCH_PATTERN}\n"
printf "  Labels:        feature, fix, hotfix, refactor, dependencies, documentation, infrastructure\n"
[ -n "$TEAM" ] && printf "  Equipo:        ${TEAM} → permiso push\n"
printf "\n"
printf "  Jira project:  ${BOLD}${JIRA_URL}/jira/software/projects/${JIRA_PROJECT}${RESET}\n"
printf "  Settings:      ${BOLD}https://github.com/${REPO}/settings${RESET}\n"
printf "  Branch rules:  ${BOLD}https://github.com/${REPO}/settings/branches${RESET}\n"
printf "  Labels:        ${BOLD}https://github.com/${REPO}/labels${RESET}\n"
printf "\n"
