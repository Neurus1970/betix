# Mejoras pendientes — Betix

Reporte de bugs y oportunidades de mejora identificadas en el proyecto, organizadas como tickets de implementación para el curso de onboarding.

**Ticket padre:** BETIX-47

---

## Resumen

| ID | Área | Descripción | Prioridad | Complejidad | Impacto didáctico |
|----|------|-------------|-----------|-------------|-------------------|
| [BUG-I3](BUG-I3-validate-branch-name-workflow-missing.md) | Infra | `validate-branch-name.yml` documentado pero inexistente | **Crítica** | Baja | Muy alto |
| [BUG-I5](BUG-I5-k8s-manifests-use-latest-tag.md) | Infra | K8s manifests usan `latest` (contradice el pipeline de versionado) | Alta | Baja | Muy alto |
| [BUG-T2](BUG-T2-hardcoded-data-provincias-steps.md) | Testing | Datos hardcodeados en `provinciasJuegos.steps.js` — viola fuente única de verdad | Alta | Baja | Alto |
| [BUG-F1](BUG-F1-d3-cdn-without-sri.md) | Frontend | D3.js cargado desde CDN sin SRI (TODO reconocido en el archivo) | Alta | Baja | Alto |
| [BUG-F4](BUG-F4-console-error-in-dashboard.md) | Frontend | `console.error()` en `dashboard.html` viola `CLAUDE.md` | Alta | Baja | Alto |
| [BUG-M1](BUG-M1-geodata-controller-missing-error-log.md) | Microservicios | `geodataController` no loggea el error en el `catch` | Media | Baja | Alto |
| [BUG-M3](BUG-M3-business-logic-in-proxy.md) | Microservicios | Filtrado y slicing (lógica de negocio) en el proxy Node.js | Media | Media | Alto |
| [BUG-M4](BUG-M4-fetch-no-timeout.md) | Microservicios | `fetch` a `core` sin timeout — requests pueden quedar colgadas | Media | Baja | Alto |
| [BUG-M5](BUG-M5-flask-no-structured-logging.md) | Microservicios | Flask sin logging estructurado — errores invisibles en logs | Media | Baja | Alto |
| [BUG-M7](BUG-M7-logger-double-colorization.md) | Microservicios | Doble colorización en `logger.js` — ANSI contamina los archivos de log | Media | Baja | Medio |
| [BUG-T1](BUG-T1-duplicated-fixture-builders.md) | Testing | Builders de fixtures duplicados en 3 archivos de test | Media | Baja | Alto |
| [BUG-T3](BUG-T3-no-coverage-threshold.md) | Testing | Sin `coverageThreshold` — la cobertura se genera pero no se enforcea | Media | Baja | Alto |
| [BUG-T4](BUG-T4-contract-test-gap.md) | Testing | Gap de contract testing: mocks de nock pueden divergir de Flask real | Media | Alta | Alto |
| [BUG-T5](BUG-T5-uncovered-branches-proyectado-controller.md) | Testing | Ramas de error sin cobertura en `proyectadoController.js` | Media | Baja | Alto |
| [BUG-I1](BUG-I1-hardcoded-credentials-docker-compose.md) | Infra | Credenciales hardcodeadas sin `.env.example` ni comentario de contexto | Media | Baja | Alto |
| [BUG-I4](BUG-I4-dockerfiles-run-as-root.md) | Infra | Dockerfiles corren como `root` — sin usuario no-root | Media | Baja | Alto |
| [BUG-F2](BUG-F2-aria-inconsistency-dashboard-backoffice.md) | Frontend | ARIA implementado en `backoffice.html` pero ausente en `dashboard.html` | Media | Baja | Medio |
| [BUG-F5](BUG-F5-nginx-missing-security-headers.md) | Frontend | nginx sin headers de seguridad, compresión ni `server_tokens off` | Media | Baja | Alto |
| [BUG-I2](BUG-I2-frontend-missing-healthcheck-docker-compose.md) | Infra | Servicio `frontend` sin healthcheck en `docker-compose.yml` | Baja | Baja | Medio |
| [BUG-I6](BUG-I6-ai-pr-review-duplicates-ci-tests.md) | Infra | `ai-pr-review.yml` duplica tests que ya corrió `ci-api.yml` | Baja | Baja | Medio |
| [BUG-M2](BUG-M2-health-check-error-context.md) | Microservicios | Health check no distingue error de red vs error del servicio | Baja | Baja | Medio |
| [BUG-M6](BUG-M6-domain-validation-in-proxy.md) | Microservicios | Validación de dominio en proxy Node.js en vez de en `core` Flask | Baja | Baja | Medio |
| [BUG-F3](BUG-F3-css-js-inline-no-separation.md) | Frontend | CSS/JS inline en HTML de 1600 líneas — sin separación de responsabilidades | Baja | Alta | Alto |

---

## Top 5 para empezar

Criterio: máximo impacto didáctico con mínima complejidad de implementación.

1. **[BUG-I3](BUG-I3-validate-branch-name-workflow-missing.md)** — El workflow que el Capítulo 7 describe como "guardián final" no existe. La documentación contradice el código.
2. **[BUG-T2](BUG-T2-hardcoded-data-provincias-steps.md)** — Datos hardcodeados en un step de Cucumber viola el Principio 4 de forma directa y verificable.
3. **[BUG-F4](BUG-F4-console-error-in-dashboard.md)** — Violación directa de una regla de `CLAUDE.md` fácilmente encontrable.
4. **[BUG-M1](BUG-M1-geodata-controller-missing-error-log.md)** — Ejemplo claro del principio "si no está en los logs, no pasó".
5. **[BUG-T5](BUG-T5-uncovered-branches-proyectado-controller.md)** — Oportunidad concreta de escribir tests con nock para cubrir ramas de error.

---

## Por área

### Microservicios
- [BUG-M1](BUG-M1-geodata-controller-missing-error-log.md) — Logging asimétrico en geodataController
- [BUG-M2](BUG-M2-health-check-error-context.md) — Health check sin distinción de tipo de error
- [BUG-M3](BUG-M3-business-logic-in-proxy.md) — Lógica de negocio en el proxy
- [BUG-M4](BUG-M4-fetch-no-timeout.md) — Fetch sin timeout
- [BUG-M5](BUG-M5-flask-no-structured-logging.md) — Flask sin logging estructurado
- [BUG-M6](BUG-M6-domain-validation-in-proxy.md) — Validación de dominio en proxy
- [BUG-M7](BUG-M7-logger-double-colorization.md) — Doble colorización en logger.js

### Testing
- [BUG-T1](BUG-T1-duplicated-fixture-builders.md) — Builders duplicados en 3 archivos
- [BUG-T2](BUG-T2-hardcoded-data-provincias-steps.md) — Datos hardcodeados en step definitions
- [BUG-T3](BUG-T3-no-coverage-threshold.md) — Sin coverageThreshold
- [BUG-T4](BUG-T4-contract-test-gap.md) — Gap de contract testing
- [BUG-T5](BUG-T5-uncovered-branches-proyectado-controller.md) — Ramas sin cobertura

### Infraestructura
- [BUG-I1](BUG-I1-hardcoded-credentials-docker-compose.md) — Credenciales hardcodeadas
- [BUG-I2](BUG-I2-frontend-missing-healthcheck-docker-compose.md) — Frontend sin healthcheck
- [BUG-I3](BUG-I3-validate-branch-name-workflow-missing.md) — Workflow de validación de rama inexistente
- [BUG-I4](BUG-I4-dockerfiles-run-as-root.md) — Dockerfiles como root
- [BUG-I5](BUG-I5-k8s-manifests-use-latest-tag.md) — K8s con tag `latest`
- [BUG-I6](BUG-I6-ai-pr-review-duplicates-ci-tests.md) — ai-pr-review duplica tests de CI

### Frontend
- [BUG-F1](BUG-F1-d3-cdn-without-sri.md) — D3.js sin SRI
- [BUG-F2](BUG-F2-aria-inconsistency-dashboard-backoffice.md) — Inconsistencia ARIA
- [BUG-F3](BUG-F3-css-js-inline-no-separation.md) — CSS/JS inline
- [BUG-F4](BUG-F4-console-error-in-dashboard.md) — console.error en producción
- [BUG-F5](BUG-F5-nginx-missing-security-headers.md) — nginx sin headers de seguridad
