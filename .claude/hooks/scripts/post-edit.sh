#!/bin/bash
# Hook: Post-Edit — ejecuta ESLint automáticamente después de editar archivos JS
# Principio 3: La calidad se automatiza y se enforcea — nunca se sugiere
# Solo actúa sobre src/ y tests/ (JS). Python y otros pasan sin intervención.

INPUT=$(cat)

# shellcheck source=lib/json_parse.sh
. "$(dirname "${BASH_SOURCE[0]}")/lib/json_parse.sh"
FILE_PATH=$(echo "$INPUT" | get_tool_input_field "file_path")

# Solo actúa sobre archivos JS en src/ o tests/
if [[ "$FILE_PATH" =~ ^(src|tests)/.*\.(js|mjs)$ ]]; then
    echo ">>> [BETIX Hook] ESLint automático en $FILE_PATH"
    if ! npx eslint "$FILE_PATH" 2>&1; then
        echo ""
        echo "⚠️  ESLint falló en $FILE_PATH — corrige antes de commitear."
        echo "    Violaciones comunes: console.log → logger.info(), require() en lugar de import, semicolons"
    fi
    # PostToolUse hooks siempre exit 0 — la edición ya ocurrió.
    # El output de ESLint es feedback para Claude, no un bloqueo.
fi

exit 0
