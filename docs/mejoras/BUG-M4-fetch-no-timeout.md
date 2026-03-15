---
id: BUG-M4
area: microservicios
archivo: src/controllers/ (todos los controllers)
prioridad: media
complejidad: baja
impacto_didactico: alto
parent_ticket: BETIX-47
---

# BUG-M4 — Las llamadas `fetch` a `core` no tienen timeout configurado

## Descripción

Todos los controllers Node.js llaman a `core` Flask usando `fetch()` sin ningún timeout. Si `core` tarda en responder (por carga, deadlock, o cualquier problema), la request del cliente queda suspendida indefinidamente hasta que Node.js cierre la conexión (lo cual puede tardar minutos o no ocurrir nunca).

En producción, esto puede traducirse en acumulación de requests colgadas, agotamiento de conexiones y degradación progresiva de toda la API.

## Comportamiento actual

```js
// Sin timeout — si core no responde, la request queda indefinidamente pendiente
const upstream = await fetch(`${CORE_URL}/proyectado?...`);
```

## Comportamiento esperado

```js
// Con AbortController y timeout explícito
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos

try {
  const upstream = await fetch(`${CORE_URL}/proyectado?...`, { signal: controller.signal });
  clearTimeout(timeoutId);
  // ...
} catch (err) {
  if (err.name === 'AbortError') {
    logger.error('getProyectado timeout: core no respondió en 5000ms');
    return res.status(504).json({ error: 'Gateway timeout' });
  }
  logger.error(`getProyectado error: ${err.message}`);
  return res.status(500).json({ error: 'Error interno' });
}
```

## Por qué importa

Un sistema sin timeouts no puede fallar rápido ("fail fast"). Un servicio que depende de otro sin timeout hereda todos los problemas de disponibilidad del servicio aguas arriba, sin poder recuperarse por sí mismo.

## Qué demuestra al alumno

- El patrón `AbortController` + `setTimeout` para timeouts en `fetch`.
- El concepto de "fail fast": es mejor responder 504 en 5 segundos que dejar al cliente esperando 3 minutos.
- Cómo los errores de timeout se distinguen de otros errores con `err.name === 'AbortError'`.
- La diferencia entre un proxy resiliente y un proxy que transmite problemas.
