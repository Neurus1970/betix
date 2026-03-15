# Claude Code Hooks — Betix

Los hooks de Claude Code se configuran en `.claude/settings.json` y se ejecutan automáticamente cuando el agente usa ciertas herramientas. Los scripts están en `.claude/hooks/scripts/`.

## Sintaxis del matcher en settings.json

El campo `"matcher"` acepta una **expresión regular** que se evalúa contra el nombre de la herramienta. El `|` es el operador OR de regex, no un separador literal:

```json
"matcher": "Edit|Write"   // regex: coincide con "Edit" OR "Write"
"matcher": "Bash"         // literal: solo coincide con "Bash"
```

Referencia: [Claude Code hooks documentation](https://docs.anthropic.com/en/docs/claude-code/hooks)

## Hooks activos

| Evento | Matcher | Script | Qué hace |
|--------|---------|--------|----------|
| `PreToolUse` | `Edit\|Write` | `pre-edit.sh` | Bloquea edición de `terraform/` y `k8s/` sin aprobación explícita |
| `PreToolUse` | `Bash` | `pre-bash.sh` | Valida naming convention al crear ramas git |
| `PostToolUse` | `Edit\|Write` | `post-edit.sh` | ESLint automático al editar archivos JS en `src/` o `tests/` |

## Comportamiento por tipo de hook

- **PreToolUse `exit 2`** — hard block: Claude no puede ejecutar la herramienta
- **PreToolUse `exit 0`** — permite la ejecución
- **PostToolUse `exit 0` siempre** — informacional: el output es visible para Claude pero no interrumpe el flujo

## Cómo testear un hook localmente

```bash
# Simular el JSON que Claude Code envía al hook
echo '{"tool_name":"Edit","tool_input":{"file_path":"terraform/vpc.tf"}}' | bash .claude/hooks/scripts/pre-edit.sh
echo $?   # debe ser 2 (blocked)

echo '{"tool_name":"Edit","tool_input":{"file_path":"src/app.js"}}' | bash .claude/hooks/scripts/pre-edit.sh
echo $?   # debe ser 0 (pass)
```

## Cómo deshabilitar un hook temporalmente

Comentar o eliminar la entrada correspondiente en `.claude/settings.json`. No modificar los scripts — así es más fácil revertir.
