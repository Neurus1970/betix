#!/bin/bash
# Hook: Pre-Bash — enforcea naming convention de ramas git
# Principio 3: Un estándar que se puede saltear no es un estándar

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('command', ''))
except Exception:
    print('')
" 2>/dev/null)

# Solo actúa sobre comandos de creación de ramas
if ! echo "$COMMAND" | grep -qE 'git (checkout -b|switch -c|branch) '; then
    exit 0
fi

# Extrae el nombre de la rama (primer token que no empieza con -)
BRANCH_NAME=$(echo "$COMMAND" | grep -oP '(?<=(checkout -b|switch -c|branch) )[^\s-]\S*' | head -1)

if [ -z "$BRANCH_NAME" ]; then
    exit 0
fi

# Valida el patrón requerido: <prefix>/BETIX-XX-descripcion
VALID_PATTERN='^(feature|fix|refactor|hotfix)/BETIX-[0-9]+-[a-zA-Z0-9-]+$'

if ! echo "$BRANCH_NAME" | grep -qP "$VALID_PATTERN"; then
    echo ""
    echo "⛔ [BETIX Platform Rule] Nombre de rama inválido: '$BRANCH_NAME'"
    echo ""
    echo "Formato requerido: <prefix>/BETIX-XX-descripcion-corta"
    echo ""
    echo "Prefijos válidos:  feature/   fix/   refactor/   hotfix/"
    echo "ID de Jira:        BETIX-XX (obligatorio)"
    echo ""
    echo "Ejemplos válidos:"
    echo "  feature/BETIX-41-platform-rules-enforcement"
    echo "  fix/BETIX-42-endpoint-bug"
    echo "  refactor/BETIX-43-cleanup-proxy"
    echo "  hotfix/BETIX-44-prod-fix  (diverge desde main, no desde develop)"
    echo ""
    exit 2
fi

exit 0
