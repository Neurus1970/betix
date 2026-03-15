---
id: BUG-T1
area: testing
archivo: tests/proyectado.test.js, tests/proyectadoCache.test.js, features/support/hooks.js
prioridad: media
complejidad: baja
impacto_didactico: alto
parent_ticket: BETIX-47
---

# BUG-T1 — Builders de fixtures duplicados en tres archivos de test

## Descripción

Las funciones `makeHistorico`, `makeProyectado` y `buildAllData` están definidas independientemente en tres archivos distintos:

- `tests/proyectado.test.js`
- `tests/proyectadoCache.test.js`
- `features/support/hooks.js`

Cualquier cambio en la estructura del mock de `core` requiere actualizar los tres archivos. Si uno se olvida, los tests del archivo desactualizado pasan con datos incorrectos.

`CLAUDE.md` tiene una nota al respecto:
> *"If you need to change the mock structure, update all three files."*

Esta nota es el reconocimiento explícito del problema, no la solución.

## Comportamiento actual

```js
// Repetido casi literalmente en los tres archivos:
function makeHistorico(overrides = {}) {
  return {
    provinciaId: 1,
    juegoId: 1,
    mes: 1,
    anio: 2024,
    totalTickets: 100,
    ...overrides,
  };
}
```

## Comportamiento esperado

Una única fuente de verdad para los builders:

```js
// tests/fixtures/proyectadoBuilder.js
function makeHistorico(overrides = {}) { ... }
function makeProyectado(overrides = {}) { ... }
function buildAllData(overrides = {}) { ... }
module.exports = { makeHistorico, makeProyectado, buildAllData };
```

Importado en los tres archivos:
```js
const { makeHistorico, makeProyectado, buildAllData } = require('./fixtures/proyectadoBuilder');
```

## Por qué importa (principio fundacional)

> *"Lo que está duplicado tiene dos versiones y una de ellas ya es mentira."* — Principio 4

Si los builders divergen, los tests no están probando lo mismo aunque parezca que sí.

## Qué demuestra al alumno

- El principio DRY (Don't Repeat Yourself) aplicado a los datos de test.
- Cómo un "fixture builder" centralizado es análogo a la tabla de `db/seeds/` como fuente canónica.
- Cómo refactorizar sin cambiar el comportamiento de los tests (todos deben seguir pasando).
