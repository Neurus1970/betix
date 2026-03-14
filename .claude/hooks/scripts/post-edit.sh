#!/bin/bash
# Hook: Post-Edit — ejecuta ESLint automáticamente después de editar archivos JS
# Principio 3: La calidad se automatiza y se enforcea — nunca se sugiere
# Solo actúa sobre src/ y tests/ (JS). Python y otros pasan sin intervención.

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null)

# Solo actúa sobre archivos JS en src/ o tests/
if [[ "$FILE_PATH" =~ ^(src|tests)/.*\.(js|mjs)$ ]]; then
    echo ">>> [BETIX Hook] ESLint automático en $FILE_PATH"
    npx eslint "$FILE_PATH" 2>&1
    EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        echo ""
        echo "⚠️  ESLint falló. Corrige antes de commitear."
        echo "    Violaciones comunes: console.log → logger.info(), require() en lugar de import, semicolons"
    fi
    exit $EXIT_CODE
fi

exit 0
