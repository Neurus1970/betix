---
id: BUG-M1
area: microservicios
archivo: src/controllers/geodataController.js
prioridad: media
complejidad: baja
impacto_didactico: alto
parent_ticket: BETIX-47
---

# BUG-M1 — Logging asimétrico: `geodataController` no loggea el error en el catch

## Descripción

Todos los controllers de la API Node.js tienen el mismo patrón en el bloque `catch`: primero llaman a `logger.error()` con el mensaje del error, y luego retornan un `500`. El único que rompe este patrón es `geodataController.js`, que retorna el `500` pero no deja registro del error.

Cuando el servicio `core` falla al responder `/geodata`, el error desaparece silenciosamente: el cliente recibe un 500 pero no hay ninguna línea en los logs que explique qué pasó.

## Comportamiento esperado

```
2026-03-14T18:22:09.442Z error  : getGeodata error: connect ECONNREFUSED 127.0.0.1:5000
```

## Comportamiento actual

El bloque `catch` retorna el 500 pero no llama a `logger.error()`.

## Pasos para reproducir

1. Levantar el stack: `make up`
2. Detener el servicio core: `docker compose stop core`
3. Llamar al endpoint: `curl http://localhost:3000/api/geodata`
4. Observar los logs: `docker compose logs api`
5. El cliente recibe `500`, pero no hay ninguna línea de error en los logs

## Referencia en el código

```js
// src/controllers/geodataController.js — bloque catch actual (sin logger.error)
} catch (err) {
  res.status(500).json({ error: 'Error al obtener geodata' });
}

// Cómo debería ser — alineado con los demás controllers
} catch (err) {
  logger.error(`getGeodata error: ${err.message}`);
  res.status(500).json({ error: 'Error al obtener geodata' });
}
```

## Por qué importa (principio fundacional)

> *"Si no está en los logs, no pasó."* — Capítulo 10

Un error que no deja registro puede reproducirse indefinidamente sin poder diagnosticarse.

## Qué demuestra al alumno

- El patrón de logging simétrico: todo `catch` debe llamar a `logger.error()` antes de responder.
- Cómo comparar el controller roto contra cualquier otro controller para ver el patrón correcto.
- La diferencia entre "el cliente recibe un error" y "el sistema registró que ocurrió un error".
