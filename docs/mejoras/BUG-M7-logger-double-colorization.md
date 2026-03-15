---
id: BUG-M7
area: microservicios
archivo: src/logger.js
prioridad: baja
complejidad: baja
impacto_didactico: medio
parent_ticket: BETIX-47
---

# BUG-M7 — Doble colorización en `logger.js`: ANSI manual + `format.colorize()` se superponen

## Descripción

`src/logger.js` tiene dos mecanismos de colorización activos simultáneamente:

1. **ANSI manual**: en `customFormat`, el código reemplaza `HIT` y `MISS` con secuencias de escape ANSI directamente en el string del mensaje (`\x1b[32mHIT\x1b[0m`).
2. **`format.colorize()`**: Winston aplica su propio sistema de colorización sobre el nivel del log.

El resultado en la consola es correcto visualmente (por casualidad), pero el problema real es el **transporte a archivos**: cuando `BETIX_LOG_OUTPUT=file` o `=both`, las secuencias ANSI del punto 1 se escriben literalmente en el archivo de log:

```
2026-03-14T18:22:03.147Z info   : Cache [32mHIT[0m [proyectado]
```

Los archivos de log quedan contaminados con caracteres de control que dificultan el parseo y el grep.

## Comportamiento actual

```js
// Paso 1: colorización manual ANSI (siempre activa, incluso en file transport)
msg = msg.replace(/\bHIT\b/g,  `${colors.green}HIT${colors.reset}`);
msg = msg.replace(/\bMISS\b/g, `${colors.red}MISS${colors.reset}`);

// Paso 2: format.colorize() de Winston (se aplica encima del paso 1)
format: format.combine(
  format.timestamp(),
  format.colorize(),
  customFormat
)
```

## Comportamiento esperado

La colorización manual debería aplicarse **solo cuando el transport es consola**, o bien usarse exclusivamente el sistema de `format.colorize()` de Winston (que ya sabe cuándo aplicar y cuándo no).

Una solución simple: mover el reemplazo de colores ANSI fuera del `customFormat` y aplicarlo solo en el transport de consola con un formatter separado.

## Qué demuestra al alumno

- La diferencia entre un formatter de Winston y un transport: el formatter transforma el mensaje, el transport decide dónde va.
- Por qué la colorización ANSI en archivos de log es un problema de parseo.
- El concepto de "transport-aware formatting": algunas transformaciones solo tienen sentido para ciertos destinos.
- Cómo diagnosticar este tipo de bug: `tail -f logs/betix.log | cat -v` para ver los caracteres de control.
