---
id: BUG-F4
area: frontend
archivo: src/public/dashboard.html (línea ~1531)
prioridad: alta
complejidad: baja
impacto_didactico: alto
parent_ticket: BETIX-47
---

# BUG-F4 — `console.error()` en `dashboard.html` viola la regla explícita de `CLAUDE.md`

## Descripción

`dashboard.html` contiene una llamada a `console.error()` en el código JavaScript inline (aproximadamente línea 1531). Esta llamada viola la regla explícita de `CLAUDE.md`:

> **No `console.log`** in JS — use `logger.info()` / `logger.error()` (Winston).

La regla existe porque `console.log`/`console.error` producen texto plano sin estructura, sin niveles configurables y sin transports. En el frontend, la restricción aplica de manera diferente (no hay Winston en el browser), pero el principio es el mismo: los errores no deben descartarse silenciosamente con un `console.error` que solo aparece en las DevTools del developer.

## Comportamiento actual

```js
// dashboard.html ~línea 1531
.catch(err => {
  console.error(err);  // ← viola CLAUDE.md y no hace nada útil para el usuario
});
```

## Comportamiento esperado

En el frontend, el manejo de errores debe:
1. **Informar al usuario** (UI feedback) en lugar de loggear silenciosamente en la consola.
2. **Opcionalmente**, reportar el error a un servicio de monitoreo si existe.

```js
.catch(err => {
  // Mostrar feedback al usuario
  document.getElementById('error-message').textContent =
    'Error al cargar los datos. Por favor, recargá la página.';
  document.getElementById('error-message').hidden = false;

  // En producción: reportar a un servicio de errores (Sentry, etc.)
  // errorReporter.capture(err);
});
```

## Por qué importa

Esta es una violación directa y verificable de una regla explícita del proyecto. Si el linter no la detecta, la violación puede proliferar. Si Claude Code no la señala en una revisión, el alumno aprende que la regla es opcional.

Además, `console.error(err)` en producción es información que el usuario no ve y que no queda registrada en ningún lado útil. Es el equivalente frontend del error silencioso en el servidor.

## Qué demuestra al alumno

- La diferencia entre "loggear un error" (para el developer) y "manejar un error" (para el usuario).
- Por qué `console.error` en producción no es una estrategia de manejo de errores.
- Cómo mostrar feedback de error en la UI de manera accesible (ARIA `role="alert"`).
- El concepto de error boundary en frontends.
