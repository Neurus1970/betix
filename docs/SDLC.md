# Ciclo de Vida del Desarrollo de Software (SDLC)

Este documento describe el flujo de trabajo y las herramientas que constituyen el núcleo de nuestra **plataforma corporativa de desarrollo de software**. Aplica a todos los proyectos que adopten esta plataforma. El repositorio [Betix](../README.md) actúa como proyecto de referencia: es un ejemplo funcional completo que los nuevos colaboradores pueden usar para familiarizarse con el ciclo antes de trabajar en proyectos reales.

---

## Resumen del flujo

```
Ticket → Branch → Código → Tests → PR → CI → Review → Merge → Release
```

Cada etapa tiene herramientas y convenciones definidas. Las automatizaciones reducen la fricción entre etapas: crear una rama mueve el ticket a "In Progress"; hacer merge lo cierra y dispara el pipeline de release.

---

## 1. Planificación — Jira

**Herramienta:** [Jira](https://www.atlassian.com/software/jira)

Todo trabajo comienza con un ticket. Los tickets son la unidad de trazabilidad: conectan el código con el requerimiento que lo motivó y dan visibilidad al equipo sobre el estado del trabajo.

**Estados del ticket:**

| Estado | Significado |
|--------|-------------|
| To Do | Pendiente, en el backlog del sprint activo |
| In Progress | Rama creada, trabajo en curso |
| Done | PR mergeado, cambio integrado |

**Buenas prácticas:**
- Trabajar solo sobre tickets del sprint activo — no del backlog general.
- Cada ticket debe tener criterio de aceptación claro antes de iniciar el trabajo.
- Usar el ID del ticket en el nombre de la rama (ver sección siguiente) para habilitar las automatizaciones Jira ↔ GitHub.

---

## 2. Branching — Git Flow simplificado

**Herramientas:** Git · [GitHub](https://github.com)

Seguimos una variante simplificada de [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow) con dos ramas permanentes, inspirada en el [modelo Gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) pero sin las ramas de release y hotfix de alta complejidad. La elección responde a la necesidad de balancear estructura con agilidad — ver el análisis de trade-offs en [Patterns for Managing Source Code Branches](https://martinfowler.com/articles/branching-patterns.html) de Martin Fowler.

**Ramas permanentes:**

| Rama | Propósito |
|------|-----------|
| `main` | Código en producción. Solo recibe merges de releases. |
| `develop` | Rama de integración. Todos los PRs de trabajo diario apuntan aquí. |

**Ramas temporales de trabajo:**

| Prefijo | Cuándo usarlo |
|---------|--------------|
| `feature/TICKET-XX-descripcion` | Nueva funcionalidad |
| `fix/TICKET-XX-descripcion` | Corrección de bug |
| `refactor/TICKET-XX-descripcion` | Reestructuración sin cambio de comportamiento |

El ID del ticket en el nombre de rama es obligatorio: habilita la automatización que mueve el ticket en Jira al crear la rama y al hacer merge.

```bash
git checkout develop
git pull origin develop
git checkout -b feature/TICKET-42-nueva-funcionalidad
# ... trabajar, commitear ...
git push origin feature/TICKET-42-nueva-funcionalidad
# → abrir PR contra develop en GitHub
```

> Nunca modificar `develop` o `main` directamente. Todo cambio entra por Pull Request.

Para contexto sobre desarrollo basado en tronco vs. ramas de features, ver [Trunk-based Development](https://www.atlassian.com/continuous-delivery/continuous-integration/trunk-based-development) de Atlassian.

---

## 3. Desarrollo — Código y convenciones

**Herramienta:** Docker Compose (entorno local reproducible)

El entorno de desarrollo local se levanta con un único comando, levantando todos los servicios del proyecto en contenedores. Esto garantiza paridad con el entorno de CI y elimina el "funciona en mi máquina".

**Principios generales:**
- La lógica de negocio debe vivir en una única capa del sistema. No duplicar lógica entre servicios.
- Seguir las convenciones de estilo definidas para cada lenguaje del proyecto (indentación, comillas, nombrado). Estas convenciones se documentan en el `CLAUDE.md` de cada proyecto.
- No usar `console.log` u equivalentes en código de producción — usar el sistema de logging estructurado del proyecto.
- Preferir editar código existente antes que crear archivos nuevos. Evitar sobre-ingeniería: la cantidad correcta de abstracción es la mínima necesaria para el requerimiento actual.

---

## 4. Testing — Pirámide de tests

**Herramientas:** Jest · Supertest · nock (Node.js) · pytest (Python) · Cucumber (BDD)

Seguimos la [pirámide de testing](https://martinfowler.com/articles/practical-test-pyramid.html) descripta por Martin Fowler: muchos tests unitarios rápidos en la base, tests de integración en el medio, y pocos tests end-to-end en la cima. Ver también la definición concisa original en [TestPyramid](https://martinfowler.com/bliki/TestPyramid.html).

Todo cambio de comportamiento debe ir acompañado de tests. Un cambio sin tests no está terminado.

| Nivel | Herramienta | Cobertura esperada |
|-------|-------------|-------------------|
| Unitario / Integración (Node.js) | Jest + Supertest + nock | > 80% por módulo |
| Unitario (Python) | pytest | > 80% por módulo |
| Funcional / BDD | Cucumber | Escenarios definidos en el ticket |

**Reglas:**
- Los tests de integración no deben levantar servicios externos en CI — usar mocks/stubs (ej. `nock` para interceptar HTTP).
- Los tests BDD ([Behaviour-Driven Development](https://cucumber.io/docs/bdd/)) documentan el comportamiento desde la perspectiva del usuario, en lenguaje de negocio. Son la traducción ejecutable del criterio de aceptación del ticket.
- Un test que no falla cuando el código está roto no sirve.

---

## 5. Calidad de código — Análisis estático

**Herramienta:** [SonarCloud](https://sonarcloud.io)

SonarCloud analiza el código en cada PR mediante análisis estático y reporta métricas de calidad antes de que el cambio sea mergeado.

| Métrica | Descripción |
|---------|-------------|
| **Coverage** | Porcentaje de líneas cubiertas por tests |
| **Bugs** | Errores detectados estáticamente |
| **Code Smells** | Deuda técnica: código confuso, duplicado o difícil de mantener |
| **Security Hotspots** | Código que merece revisión de seguridad |
| **Quality Gate** | Conjunto de umbrales mínimos que el PR debe superar para poder mergear |

Ver la documentación oficial sobre [Quality Gates en SonarCloud](https://docs.sonarcloud.io/improving/quality-gates/).

**Reglas:**
- El Quality Gate debe estar en verde para poder mergear. No hay excepciones.
- Los issues de severidad `blocker` o `critical` deben resolverse, no ignorarse ni suprimirse sin justificación documentada.
- La cobertura se mide sobre el código nuevo introducido por el PR — no sobre el histórico del proyecto — para evitar que deuda técnica heredada bloquee trabajo nuevo.

---

## 6. Pull Request — Revisión de código

**Herramientas:** GitHub Pull Requests · Claude AI (revisión automatizada)

El PR es la unidad de integración y el punto central de revisión de calidad. Nada llega a `develop` sin pasar por un PR.

**Proceso:**
1. Abrir PR desde la rama de trabajo hacia `develop`.
2. El CI se dispara automáticamente (ver sección siguiente).
3. La IA realiza una revisión automatizada y deja un reporte como comentario en el PR.
4. Un revisor humano aprueba o solicita cambios.
5. Todos los checks en verde + al menos una aprobación humana → merge habilitado.

**Buenas prácticas:**
- Título claro que describa el cambio, no el número de ticket.
- Descripción con contexto: qué cambia, por qué, y cómo verificarlo manualmente.
- PRs pequeños y enfocados — más fáciles de revisar, menos riesgosos de mergear.
- No incluir cambios no relacionados con el ticket del PR.

### Revisión automatizada con IA

Cada PR recibe automáticamente una revisión generada por Claude (Anthropic). El reporte cubre:
- Correctitud lógica y posibles bugs
- Violaciones a las convenciones del proyecto
- Oportunidades de simplificación
- Riesgos de seguridad

Esta revisión **complementa, no reemplaza**, la revisión humana. El revisor humano tiene la palabra final.

---

## 7. Integración continua (CI) — GitHub Actions

**Herramienta:** [GitHub Actions](https://docs.github.com/en/actions/get-started/continuous-integration)

El CI se ejecuta automáticamente en cada PR y en cada push. Está organizado en workflows independientes con **path filters**: cada workflow corre solo si los archivos de su dominio cambiaron, evitando ejecuciones innecesarias y reduciendo el tiempo de feedback.

**Estructura de workflows recomendada:**

| Workflow | Disparado por cambios en | Qué ejecuta |
|----------|--------------------------|-------------|
| `ci-core` | Capa de negocio | Tests unitarios + cobertura |
| `ci-api` | Capa API + tests + features | Lint + tests unitarios + BDD |
| `ci-diagrams` | Diagramas de arquitectura, IaC | Regenera diagramas como artefactos |
| `build` | Cualquier push | Análisis SonarCloud |
| `ai-review` | Pull Requests | Revisión IA con Claude |

**Principio clave:** Si un workflow no corre porque sus paths no cambiaron, GitHub lo considera automáticamente superado. Esto no bloquea las branch protection rules.

Ver también [buenas prácticas de seguridad para GitHub Actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions).

---

## 8. Merge e integración

**Herramienta:** GitHub (merge hacia `develop`)

Una vez que todos los checks pasan y el PR tiene al menos una aprobación humana:

1. Se hace merge hacia `develop`.
2. La automatización de Jira cierra el ticket automáticamente.
3. Los cambios quedan disponibles en `develop` para el siguiente ciclo de validación.

**Flujo hacia producción:**
```
develop → (PR a main) → main → Release Please → tag + CHANGELOG
```

La promoción de `develop` a `main` se realiza mediante un PR manual, generalmente al cierre del sprint o cuando el conjunto de cambios ha sido validado en el entorno de staging.

---

## 9. Versionado semántico y release — Release Please

**Herramientas:** [Semantic Versioning](https://semver.org/) · [Release Please](https://github.com/googleapis/release-please)

El versionado sigue el estándar **SemVer** (Semantic Versioning 2.0.0): `MAJOR.MINOR.PATCH`.

| Componente | Cuándo incrementar |
|------------|-------------------|
| `MAJOR` | Cambio incompatible con versiones anteriores |
| `MINOR` | Nueva funcionalidad compatible con versiones anteriores |
| `PATCH` | Corrección de bugs compatible con versiones anteriores |

El proceso de release es **completamente automático** mediante Release Please, que analiza los mensajes de commit siguiendo la especificación [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

| Tipo de commit | Bump de versión |
|----------------|-----------------|
| `fix: descripcion` | PATCH (1.0.0 → 1.0.1) |
| `feat: descripcion` | MINOR (1.0.0 → 1.1.0) |
| `feat!:` o `BREAKING CHANGE` en el footer | MAJOR (1.0.0 → 2.0.0) |

**Flujo automático al hacer merge a `main`:**
1. Release Please analiza los commits desde el último release.
2. Crea (o actualiza) un PR de release con: bump de versión en los archivos `VERSION`, actualización del `CHANGELOG.md` y el tag de Git propuesto.
3. Al hacer merge de ese PR de release: se crea el tag en GitHub y se dispara el pipeline de build y push de imágenes.

En monorepos, cada componente tiene su propio ciclo de versionado independiente. Un cambio en la capa de negocio no bumpa la versión de la capa API si esta no tuvo cambios.

**Convención de tags de imágenes Docker:**

| Tag | Cuándo se genera |
|-----|-----------------|
| `1.3.0` | Release estable (merge a `main`) |
| `sha-abc1234` | Builds automáticos de `develop` o ramas de feature |
| `latest` | Apunta siempre al último release estable |

---

## 10. Infraestructura — Infrastructure as Code

**Herramienta:** [Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/infrastructure-as-code)

La infraestructura en la nube está definida completamente como código (IaC). Esto garantiza que cualquier cambio en la infraestructura pasa por revisión de código, queda versionado en git y es reproducible en cualquier entorno. Ver las [prácticas recomendadas de Terraform](https://developer.hashicorp.com/terraform/cloud-docs/recommended-practices) para organización de workspaces y colaboración en equipo.

**Principios:**
- Nunca modificar infraestructura directamente en la consola del proveedor cloud ("ClickOps"). Todos los cambios pasan por código.
- Todo cambio de infraestructura sigue el mismo flujo que el código de aplicación: branch → PR → CI → merge.
- Los archivos de Terraform se revisan con la misma rigurosidad que el código de negocio.

---

## 11. Documentación de arquitectura — Modelo C4

**Herramienta:** [C4 Model](https://c4model.com/introduction) (Mermaid / diagrams-mingrammer)

La arquitectura de cada proyecto se documenta siguiendo el [modelo C4](https://c4model.com/diagrams), creado por Simon Brown. Organiza la descripción del sistema en cuatro niveles de zoom progresivo:

| Nivel | Diagrama | Audiencia |
|-------|----------|-----------|
| L1 | Context | Stakeholders de negocio |
| L2 | Containers | Equipo de desarrollo y arquitectura |
| L3 | Components | Desarrolladores del servicio |
| L4 | Code | Opcional, para lógica compleja |

Los diagramas se expresan en código (Mermaid o diagrams-mingrammer), viven junto al código fuente y se regeneran automáticamente en CI cuando sus fuentes cambian. Esto garantiza que la documentación de arquitectura evoluciona con el sistema y nunca queda desactualizada.

---

## Automatizaciones Jira ↔ GitHub

La plataforma conecta Jira y GitHub mediante workflows automatizados que eliminan la necesidad de actualizar el estado de tickets manualmente:

| Evento en GitHub | Acción automática en Jira |
|------------------|--------------------------|
| Se crea una rama con `TICKET-XX` en el nombre | Ticket → **In Progress** |
| Se hace merge del PR | Ticket → **Done** |
| Se cierra el PR sin merge | Ticket → **To Do** |

---

## Proyecto de referencia

[Betix](../README.md) es el proyecto de referencia de la plataforma: una aplicación funcional completa que implementa todos los estándares descritos en este documento. Está diseñado para que los nuevos colaboradores puedan:

- Explorar cómo se estructura un proyecto real bajo estas convenciones.
- Ejecutar el ciclo completo (ticket → branch → código → tests → PR → CI → merge) en un entorno de bajo riesgo.
- Validar que su entorno local está correctamente configurado antes de sumarse a un proyecto productivo.

---

## Referencias

| Documento | Contenido |
|-----------|-----------|
| [CLAUDE.md](../CLAUDE.md) | Convenciones de código, comandos esenciales y reglas específicas del proyecto |
| [docs/monorepo-guide.md](monorepo-guide.md) | Estructura del monorepo, path filters de CI, uso del Makefile |
| [docs/ArquitecturaC4.md](ArquitecturaC4.md) | Modelo C4 del sistema de referencia Betix |
| [docs/versionadosemantico.md](versionadosemantico.md) | Implementación de Release Please: configuración, bootstrap y gotchas |
