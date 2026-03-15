---
id: BUG-I6
area: infra
archivo: .github/workflows/ai-pr-review.yml
prioridad: baja
complejidad: baja
impacto_didactico: medio
parent_ticket: BETIX-47
---

# BUG-I6 — `ai-pr-review.yml` duplica la ejecución de tests que ya corrió `ci-api.yml`

## Descripción

El workflow `ai-pr-review.yml` ejecuta `npm run test:ci` y `npm run test:functional:ci` antes de llamar a la API de Claude para el análisis del PR. Estos mismos tests ya fueron ejecutados por `ci-api.yml`, que se dispara en el mismo evento de PR.

El resultado es que en cada PR se corren los tests de Node.js dos veces: una en `ci-api.yml` (el workflow de CI) y otra en `ai-pr-review.yml` (el workflow de revisión). Esto duplica el tiempo de ejecución y el consumo de minutos de GitHub Actions sin agregar valor.

## Comportamiento actual

```yaml
# .github/workflows/ai-pr-review.yml
- name: Run tests
  run: npm run test:ci

- name: Run Cucumber tests
  run: npm run test:functional:ci

- name: AI PR Review
  run: node scripts/ai-pr-review.js
```

## Comportamiento esperado

El workflow de revisión de AI debería usar los artefactos de cobertura y los resultados de test producidos por `ci-api.yml`, en lugar de re-ejecutar los tests. Alternativamente, puede esperar a que `ci-api.yml` termine exitosamente antes de ejecutar la revisión:

```yaml
# Opción 1: depender del job de CI
needs: ci-api  # o el job equivalente

# Opción 2: descargar los artefactos de cobertura
- uses: actions/download-artifact@v4
  with:
    name: coverage-report
```

Si el workflow de revisión no necesita los resultados de los tests para hacer el análisis, simplemente puede eliminar los pasos de ejecución de tests.

## Por qué importa

El principio de CI eficiente: cada paso del pipeline debe aportar información que los pasos anteriores no aportaron. Ejecutar los mismos tests dos veces no agrega información — solo agrega tiempo y costo.

Para un proyecto educativo esto es menor, pero para un proyecto con 50+ developers corriendo 20 PRs por día, duplicar la ejecución de tests tiene un impacto medible en costos y en tiempo de feedback.

## Qué demuestra al alumno

- Cómo los workflows de GitHub Actions pueden depender entre sí con `needs:`.
- Cómo compartir artefactos entre jobs y workflows con `actions/upload-artifact` y `actions/download-artifact`.
- El principio de "no repetir lo que otro paso ya hizo" en el diseño de pipelines.
