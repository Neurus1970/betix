#!/bin/bash
# Hook: Pre-Edit — bloquea edición de archivos de infraestructura sin aprobación explícita
# Principio 3: La calidad se automatiza y se enforcea — nunca se sugiere

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null)

# Solo actúa sobre archivos de infra — todo lo demás pasa sin intervención
if [[ "$FILE_PATH" =~ ^(terraform|k8s)/ ]]; then
    echo ""
    echo "⛔ [BETIX Platform Rule] Edición de infraestructura bloqueada"
    echo ""
    echo "Archivo: $FILE_PATH"
    echo ""
    echo "Los archivos de terraform/ y k8s/ requieren aprobación explícita del usuario antes de editarse."
    echo "Estos cambios pueden generar costos en AWS o causar downtime en servicios corriendo."
    echo ""
    echo "Antes de proceder:"
    echo "  1. Confirma con el usuario que este cambio está aprobado."
    echo "  2. Para Terraform: revisar con 'terraform plan' antes de cualquier 'terraform apply'."
    echo "  3. Para K8s: verificar estado actual con 'make k8s-status'."
    echo ""
    echo "Pregunta al usuario antes de continuar."
    exit 2
fi

exit 0
