---
id: BUG-T3
area: testing
archivo: package.json
prioridad: media
complejidad: baja
impacto_didactico: alto
parent_ticket: BETIX-47
---

# BUG-T3 — No hay `coverageThreshold` configurado: la cobertura se genera pero no se enforcea

## Descripción

La configuración de Jest en `package.json` genera un reporte de cobertura con `--coverage`, pero no tiene `coverageThreshold` definido. Esto significa que Jest puede terminar con `0%` de cobertura y aun así salir con código `0` (éxito).

El CI publica la cobertura en SonarCloud con un Quality Gate, pero eso solo protege el merge a `main`. Localmente, un developer puede correr `npm test` con tests que cubren nada y recibir un checkmark verde.

## Configuración actual

```json
// package.json — sin threshold
"jest": {
  "collectCoverage": true,
  "coverageDirectory": "coverage",
  "coverageReporters": ["lcov", "text"]
}
```

## Configuración esperada

```json
"jest": {
  "collectCoverage": true,
  "coverageDirectory": "coverage",
  "coverageReporters": ["lcov", "text"],
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

## Por qué importa (principio fundacional)

> *"Un estándar que se puede saltear no es un estándar."* — Principio 3

Si el umbral de cobertura no se enforcea localmente, el feedback llega tarde (en el PR, en SonarCloud) en lugar de en el momento en que se escribe el código.

## Consideración didáctica

Los valores del threshold deben ser realistas para el estado actual del proyecto. Empezar con umbrales demasiado altos genera frustración; empezar con los valores actuales de cobertura y subirlos gradualmente enseña el concepto sin bloquear el flujo.

## Qué demuestra al alumno

- La diferencia entre "medir cobertura" y "enforcer un mínimo de cobertura".
- Cómo `coverageThreshold` convierte un reporte informativo en un gate de calidad.
- El flujo de feedback: cuanto más temprano se detecta un problema, más barato es resolverlo.
