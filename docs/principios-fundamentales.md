## Los 5 principios fundacionales de la plataforma


Los agentes leyeron el repo desde cuatro ángulos distintos y hay convergencia fuerte en algunos puntos, divergencia interesante en otros. El tuyo es el correcto como punto de partida, pero "código versionado" es condición necesaria, no suficiente. Los otros cuatro dicen qué pasa una vez que ese principio está garantizado.

## Principio 0: Todo el estado del sistema es código versionado
"Desde las pruebas hasta la infraestructura, desde los datos semilla hasta la configuración del agente de AI."

Los cuatro agentes lo reconocen como meta-principio: el suelo sobre el que se para todo. Infra lo expresa así: "Si algo existe pero no está en código, no existe para la plataforma." Pero coinciden también en que versionar por sí solo no es suficiente — se puede versionar código que no sea reproducible, que tenga brecha entre entornos, o que contenga secretos. Lo que la plataforma hace es versionar las cosas correctas, de la manera correcta.

---

> Betix en código: db/seeds/ (datos), k8s/ (orquestación), terraform/ (cloud), .claude/agents/ (conocimiento del equipo), docs/onboarding/ (curso de onboarding) — todo en el repo.

## Principio 1: Las fronteras entre componentes son contratos estructurales, no convenciones voluntarias
"Si una regla puede romperse sin que nada falle, no es una regla — es una sugerencia."

Este es el que más convergencia tiene entre los cuatro agentes. Microservices lo dice con más fuerza: "La frontera de responsabilidad es inviolable, no negociable." Frontend lo refuerza: cuando se borró el código legacy de src/data/ y src/services/ en BETIX-15, eso no fue limpieza cosmética — fue la afirmación del principio. Testing lo verifica desde otro ángulo: nock no es solo un stub, es un verificador; si el controller llamara al core cuando no debería, el test falla porque el interceptor está ausente. Infra lo materializa en los depends_on de docker-compose: cada componente declara lo que necesita, no asume que el de arriba ya está listo.

Por qué es fundacional: Las convenciones se erosionan bajo presión. Lo que resiste es la estructura. Si el frontend puede llamar directamente al core, eventualmente alguien lo hará.

Betix en código: CLAUDE.md rule #1: "Business logic lives in core/ only. Never duplicate in Node.js." — k8s/core-deployment.yaml (probe + resource limits independientes) — docker-compose.yml depends_on: condition: service_healthy.

## Principio 2: La plataforma se clona, no se hereda
"Un developer que clona el repo obtiene el mismo contexto, las mismas herramientas y el mismo conocimiento que el equipo que lo construyó."

Este es el insight más original del agente de frontend. La frase está literalmente en CLAUDE.md. Pero el agente de infra lo materializa desde otro ángulo: make up es un solo comando que levanta seis servicios en el orden correcto con los datos correctos. No hay setup manual. No hay pasos que solo alguien de infra sabe hacer. Infra también lo formula negativamente: "La plataforma exige que no existan pasos manuales en la consola que solo alguien sabe hacer."

Por qué es fundacional: El conocimiento que vive en la cabeza de una persona o en un Slack archivado no puede ser revisado en un PR, no puede ser actualizado con el sistema, y desaparece cuando esa persona se va.

Betix en código: .claude/agents/ (contexto de AI versionado) — docker-compose.yml + make up (entorno reproducible en un comando) — docs/onboarding/ (curso en el repo, no en Confluence) — db/load_data.sh (seed determinístico, siempre el mismo resultado).

## Principio 3: La calidad se automatiza y se enforcea — nunca se sugiere
"Un estándar que se puede saltear no es un estándar."

El agente de infra encontró el dato más revelador: el workflow de hotfix (ci-hotfix.yml) no relaja el CI, lo endurece — suite completa sin path filters, porque un hotfix es el escenario de mayor riesgo. El agente de testing lo complementa: nock.disableNetConnect() en BeforeAll no es una recomendación, es una restricción que hace imposible que un test haga llamadas reales a la red. El agente de microservices apunta a los path filters de CI: cada servicio se valida independientemente, y el resultado de CI no depende de la buena voluntad de nadie.

Por qué es fundacional: Bajo presión (deadline, incidente, hotfix urgente) la primera víctima son los estándares voluntarios. La plataforma los convierte en restricciones automáticas.

Betix en código: ci-hotfix.yml (suite completa, stricter que en develop) — features/support/hooks.js nock.disableNetConnect() — SonarCloud Quality Gate en cada PR — branch protection rules en GitHub.

## Principio 4: Una sola fuente de verdad — cero estado implícito
"Lo que no está en el código no existe para la plataforma. Lo que está duplicado tiene dos versiones y una de ellas ya es mentira."

El agente de testing lo dice mejor que nadie: db/seeds/ son la fuente canónica. csvLoader.js la consume en Jest, hooks.js la consume en Cucumber, conftest.py la consume en pytest. Agregar una provincia al CSV cambia automáticamente el comportamiento de las tres suites sin tocar ningún archivo de test. El agente de infra lo refuerza desde el otro lado: los diagramas Mermaid no son documentación opcional — un PR que cambia terraform/ sin actualizar el diagrama está incompleto. El agente de frontend lo aplica al versionado: la versión del sistema no está en un README, está en frontend/VERSION, core/VERSION, src/VERSION — y el tag de ECR que corre en producción es trazable hasta el SHA del commit.

Por qué es fundacional: La documentación que describe lo que el sistema debería hacer diverge inmediatamente del código que describe lo que el sistema hace. La única documentación que no puede mentir es el código en producción.

Betix en código: db/seeds/ → csvLoader.js → Jest/Cucumber/pytest (misma fuente) — docs/diagrams/infrastructure.md actualizado en el mismo PR que terraform/ — core/VERSION, src/VERSION, frontend/VERSION como único origen de versión.

---

### Tabla de origen
Principio	Infra	Testing	Microservices	Frontend
0. Todo es código versionado	★ meta	★ meta	★ meta	★ meta
1. Fronteras como contratos estructurales	depends_on	nock como verifier	single responsibility	no business logic en frontend
2. La plataforma se clona	make up / IaC	csvLoader.js	—	.claude/ versionado
3. Calidad automatizada y sin bypass	hotfix CI stricter	disableNetConnect	path filters por servicio	—
4. Una sola fuente de verdad	diagrama en mismo PR	db/seeds/ canónico	VERSION files + SHA	Mermaid sobre Visio
