---
id: BUG-T4
area: testing
archivo: tests/ (todos los tests que usan nock), features/support/hooks.js
prioridad: media
complejidad: alta
impacto_didactico: alto
parent_ticket: BETIX-47
---

# BUG-T4 — Gap de contract testing: los mocks de nock pueden divergir de las respuestas reales de Flask

## Descripción

Todos los tests de Node.js (Jest + Cucumber) interceptan las llamadas HTTP a `core` Flask usando `nock`. Esto es correcto para tests unitarios e integración: los tests no deben depender de que `core` esté corriendo.

El problema es que **no existe ningún test que verifique que los mocks de nock representan fielmente lo que `core` devuelve en realidad**. Si el contrato de la API Flask cambia (por ejemplo, un campo renombrado, un nuevo campo requerido, o un cambio en la estructura del JSON), los tests de Node.js siguen pasando con el mock viejo mientras la integración real está rota.

## Ejemplo del riesgo

```js
// nock en tests/proyectado.test.js — mock con campo "historico"
nock(CORE_URL).get('/proyectado').reply(200, [
  { historico: [...], proyectado: [...] }
]);

// Flask en core/main.py cambia el campo a "datos_historicos"
# flask devuelve: [{ "datos_historicos": [...], "proyectado": [...] }]

// Resultado: tests de Node.js pasan (usan el mock viejo),
// pero la integración real está rota.
```

## Solución propuesta

Agregar un **contrato explícito** que se ejecute contra el servicio real en el entorno local (no en CI unitario), por ejemplo con una suite de integración separada que levante el stack real:

```bash
# En Makefile — solo se corre con el stack levantado
make test-integration   # npm run test:integration (sin nock, contra core real)
```

O como mínimo, agregar un comentario en cada nock que especifique la versión del contrato y qué endpoint de Flask corresponde.

## Por qué importa

Este es el mismo tipo de problema que produjo el incidente documentado en el feedback de testing del equipo: *"mocked tests passed but the prod migration failed"*. Los mocks solo son útiles si se mantienen sincronizados con la realidad.

## Qué demuestra al alumno

- El concepto de "contract testing" y por qué existe.
- La diferencia entre un test unitario (rápido, aislado, con mocks) y un test de integración (más lento, contra servicios reales).
- Por qué Pact, Dredd y herramientas similares existen: para automatizar la verificación de contratos.
- Cómo organizar una suite de integración separada en un monorepo.
