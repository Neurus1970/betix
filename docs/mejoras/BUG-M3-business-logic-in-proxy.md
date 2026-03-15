---
id: BUG-M3
area: microservicios
archivo: src/controllers/proyectadoController.js
prioridad: media
complejidad: media
impacto_didactico: alto
parent_ticket: BETIX-47
---

# BUG-M3 — Lógica de negocio en el proxy Node.js: filtrado y slicing en `proyectadoController`

## Descripción

`proyectadoController.js` aplica filtrado por `provinciaId` y un `slice` de los datos recibidos de `core` antes de devolverlos al cliente. Esta lógica —aunque mínima— es lógica de negocio que debería vivir exclusivamente en `core/` (Python Flask), según el Principio 1 y la regla explícita en `CLAUDE.md`.

El proxy debe **reenviar** la respuesta de `core` sin transformarla. Si `core` necesita filtrar o limitar los datos, esa decisión debe tomarse en `core`.

## Comportamiento actual

```js
// src/controllers/proyectadoController.js
const data = await upstream.json();
const filtered = data.filter(item => item.provinciaId === Number(provinciaId));
const result = filtered.slice(0, 12);
res.json(result);
```

## Comportamiento esperado

Los parámetros de filtrado deben pasarse como query params a `core`, y `core` debe devolver ya los datos correctos:

```js
// Proxy sin lógica: reenvía los params y devuelve lo que core responde
const upstream = await fetch(`${CORE_URL}/proyectado?provinciaId=${provinciaId}&limit=12`);
res.json(await upstream.json());
```

## Referencia en el código

`CLAUDE.md` — Rules / Critical:
> Business logic lives in `core/` (Python) only. Never duplicate in Node.js.

## Por qué importa (principio fundacional)

> *"Si una regla puede romperse sin que nada falle, no es una regla — es una sugerencia."* — Principio 1

Las fronteras entre componentes son contratos estructurales. Si el proxy filtra datos, la responsabilidad de `core` se erosiona. Con el tiempo, la lógica de negocio termina duplicada o fragmentada.

## Qué demuestra al alumno

- La diferencia entre un proxy "thin" (solo transporte) y un proxy que acumula responsabilidades.
- Cómo refactorizar: mover la lógica al endpoint Flask y eliminarla del controller Node.js.
- Por qué las reglas de arquitectura deben ser contratos, no sugerencias.
