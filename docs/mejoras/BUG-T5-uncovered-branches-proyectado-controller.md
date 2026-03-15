---
id: BUG-T5
area: testing
archivo: tests/proyectado.test.js, src/controllers/proyectadoController.js
prioridad: media
complejidad: baja
impacto_didactico: alto
parent_ticket: BETIX-47
---

# BUG-T5 — Ramas sin cobertura en `proyectadoController.js`

## Descripción

`proyectadoController.js` tiene dos ramas de error que no están cubiertas por ningún test:

1. **`if (!upstream.ok)`**: el caso en que `core` responde con un código de error HTTP (4xx, 5xx). El test cubre el caso happy path (200 OK), pero no el caso en que `core` devuelve un error.

2. **Bloque `catch`**: el caso en que `fetch` lanza una excepción (error de red, timeout, ECONNREFUSED). El test tampoco cubre este caso.

Cuando SonarCloud reporta cobertura de branches por debajo del Quality Gate, estas son exactamente las ramas que faltan.

## Ramas sin tests

```js
// src/controllers/proyectadoController.js
if (!upstream.ok) {
  // ← RAMA SIN TEST: ¿qué pasa si core devuelve 500?
  logger.error(`getProyectado upstream error: ${upstream.status}`);
  return res.status(upstream.status).json({ error: 'Error en core' });
}

// ...

} catch (err) {
  // ← RAMA SIN TEST: ¿qué pasa si fetch lanza una excepción?
  logger.error(`getProyectado error: ${err.message}`);
  res.status(500).json({ error: 'Error interno' });
}
```

## Tests que faltan

```js
// Test 1: core responde con error HTTP
it('returns 503 when core returns error', async () => {
  nock(CORE_URL).get('/proyectado').reply(503);
  const res = await request(app).get('/api/proyectado?provinciaId=1');
  expect(res.status).toBe(503);
});

// Test 2: core no responde (error de red)
it('returns 500 when core is unreachable', async () => {
  nock(CORE_URL).get('/proyectado').replyWithError('ECONNREFUSED');
  const res = await request(app).get('/api/proyectado?provinciaId=1');
  expect(res.status).toBe(500);
});
```

## Por qué importa

Las ramas de error son las más importantes de testear: el happy path casi siempre funciona. Lo que falla en producción son los casos de error. Un controlador sin tests de error es un controlador cuyo comportamiento bajo falla es desconocido.

## Qué demuestra al alumno

- Cómo usar `nock` para simular respuestas de error (`reply(503)`) y errores de red (`replyWithError()`).
- Por qué la cobertura de ramas es más útil que la cobertura de líneas.
- El patrón de test para cada posible retorno de un controlador: happy path, upstream error, network error.
