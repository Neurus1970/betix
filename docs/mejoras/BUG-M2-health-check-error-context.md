---
id: BUG-M2
area: microservicios
archivo: src/routes/health.js
prioridad: baja
complejidad: baja
impacto_didactico: medio
parent_ticket: BETIX-47
---

# BUG-M2 — Health check no distingue entre error de red y error del servicio

## Descripción

El endpoint `/healthz` de la API Node.js llama al health check de `core` Flask y, si algo falla, responde con un mensaje genérico de error. Sin embargo, no distingue entre dos situaciones completamente diferentes:

- **Error de red**: `core` no responde (contenedor caído, ECONNREFUSED).
- **Error del servicio**: `core` responde pero devuelve un código de error HTTP (500, 503).

Ambos casos producen la misma respuesta para el cliente y el mismo log (o ningún log), lo que complica el diagnóstico.

## Comportamiento esperado

| Situación | Respuesta del health check |
|-----------|---------------------------|
| Core caído (red) | `{ status: "unhealthy", reason: "core unreachable", error: "ECONNREFUSED" }` |
| Core responde con error | `{ status: "unhealthy", reason: "core returned 503", upstream: { status: 503 } }` |
| Todo ok | `{ status: "ok" }` |

## Comportamiento actual

El `catch` general captura ambos casos y los trata igual, sin distinguir la causa.

## Referencia didáctica

Este es un ejemplo del principio de **observabilidad**: un health check que no comunica *por qué* falló no aporta más información que la ausencia de respuesta.

La diferencia entre "el servicio no responde" y "el servicio responde con un error" es la diferencia entre "el pod está caído" y "hay un bug en la aplicación".

## Qué demuestra al alumno

- Cómo distinguir `network errors` (excepción en `fetch`) de `HTTP errors` (respuesta con status >= 400).
- El patrón `if (!response.ok)` vs `catch (err)` en Node.js.
- Cómo el contexto en los logs reduce el tiempo de diagnóstico.
