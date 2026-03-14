#!/bin/bash
# Librería compartida para los hooks de Claude Code — parsing del JSON de entrada.
#
# Uso:
#   . "$(dirname "${BASH_SOURCE[0]}")/lib/json_parse.sh"
#   FIELD=$(echo "$INPUT" | get_tool_input_field "file_path")

# Extrae un campo de tool_input del JSON que Claude Code pasa a los hooks via stdin.
# Argumentos:
#   $1 — nombre del campo a extraer (ej: "file_path", "command")
# Entrada: JSON en stdin (ej: echo "$INPUT" | get_tool_input_field "file_path")
# Salida:  valor del campo, o cadena vacía si no existe o hay error de parseo
get_tool_input_field() {
  local field="$1"
  python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('$field', ''))
except Exception:
    print('')
" 2>/dev/null
}
