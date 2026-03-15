---
id: BUG-T2
area: testing
archivo: features/step_definitions/provinciasJuegos.steps.js
prioridad: alta
complejidad: baja
impacto_didactico: alto
parent_ticket: BETIX-47
---

# BUG-T2 — Datos hardcodeados en `provinciasJuegos.steps.js` violan la fuente única de verdad

## Descripción

`provinciasJuegos.steps.js` define `MOCK_LISTA` con provincias y juegos hardcodeados directamente en el archivo:

```js
const MOCK_LISTA = [
  { provinciaId: 1, nombre: 'Salta', juegoId: 1, juego: 'Quiniela' },
  { provinciaId: 2, nombre: 'Neuquén', juegoId: 2, juego: 'Lotería' },
  // ...
];
```

Esto viola el Principio 4: la fuente canónica de datos es `db/seeds/` (CSVs), consumida por `csvLoader.js`. Todos los demás archivos de test leen desde esa fuente. Este es el único archivo que tiene sus propios datos hardcodeados.

Si se agrega una provincia al CSV, los tests de Jest y Cucumber (en otros escenarios) la incluyen automáticamente. Este test no.

## Comportamiento actual

Datos de provincia/juego definidos localmente en el step file, sin relación con `db/seeds/`.

## Comportamiento esperado

```js
const { loadProvinciasJuegos } = require('../../tests/fixtures/csvLoader');

const MOCK_LISTA = loadProvinciasJuegos(); // lee desde db/seeds/_provincias.csv y _juegos.csv
```

## Por qué importa (principio fundacional)

> *"Lo que está duplicado tiene dos versiones y una de ellas ya es mentira."* — Principio 4

`db/seeds/` es la fuente canónica porque es la misma fuente que usa la base de datos real. Si el CSV cambia y el step file no, los tests de Cucumber aceptan respuestas que ya no corresponden al estado real del sistema.

## Qué demuestra al alumno

- Cómo `csvLoader.js` funciona como puente entre los seeds de base de datos y los datos de test.
- Por qué centralizar los datos de test en una fuente canónica facilita el mantenimiento.
- La diferencia entre un test que prueba el código y un test que prueba datos inventados.
