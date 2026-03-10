# Arquitectura C4 — Betix

## Qué es el modelo C4

C4 (Context, Containers, Components, Code) es un modelo de documentación de arquitectura de software creado por Simon Brown. Propone cuatro niveles de abstracción progresiva, de lo más general a lo más detallado, de forma similar a cómo un mapa tiene distintos niveles de zoom. Cada nivel responde a una audiencia distinta: negocio, arquitectura, desarrollo e implementación.

Los diagramas de Betix están expresados en **Mermaid** con la sintaxis C4, lo que permite mantenerlos como código dentro del repositorio, versionarlos con git y renderizarlos automáticamente en GitHub.

---

## Nivel 1 — Contexto del sistema

Muestra Betix como caja negra y sus relaciones con usuarios y sistemas externos. Audiencia: stakeholders de negocio y arquitectos.

```mermaid
C4Context
    title Diagrama de Contexto — Betix

    Person(usuario, "Usuario", "Analista o gerente que consulta estadísticas y proyecciones de apuestas")

    System(betix, "Betix", "Plataforma de estadísticas con microservicios: Flask core, Node.js proxy, nginx frontend")

    System_Ext(jira, "Jira", "Gestión de tickets y sprints del proyecto BETIX")
    System_Ext(sonar, "SonarCloud", "Análisis continuo de calidad y cobertura de código")
    System_Ext(github, "GitHub Actions", "Pipeline CI/CD: lint, tests, pytest, diagramas, AI review")

    Rel(usuario, betix, "Consulta dashboards y proyecciones", "HTTPS / Browser")
    Rel(betix, jira, "Transiciona tickets automáticamente en PR", "REST API")
    Rel(github, sonar, "Envía métricas de cobertura", "SonarCloud Scanner")
```

---

## Nivel 2 — Contenedores

Desglosa Betix en sus procesos ejecutables e interfaces. Audiencia: arquitectos y desarrolladores.

```mermaid
C4Container
    title Diagrama de Contenedores — Betix

    Person(usuario, "Usuario", "Analista")

    Container_Boundary(betix, "Betix") {
        Container(frontend, "Frontend", "nginx + HTML5 + D3.js v7", "Sirve páginas estáticas y proxea /api/* hacia Node.js API")
        Container(api, "Betix API", "Node.js 18 + Express 4", "Thin proxy HTTP hacia Python core. Caché Redis en todas las rutas /api/datos/*")
        ContainerDb(redis, "Redis", "Redis 7 (in-memory)", "Caché de respuestas del core. TTL configurable (default 60s). Degradación elegante si no está disponible")
        Container(core, "Betix Core", "Python 3.12 + Flask", "Lógica de negocio: geodata, proyecciones SMA rolling, mapa burbujas, health check")
        ContainerDb(dataStatic, "mock_data.py", "Módulo Python en memoria", "30 registros estáticos: 10 provincias × 3 juegos")
        ContainerDb(dataMonthly, "tickets_por_mes.py", "Módulo Python en memoria", "360 registros mensuales con factores estacionales (mar 2025–feb 2026)")
    }

    Rel(usuario, frontend, "Navega y filtra datos", "HTTPS :8080")
    Rel(frontend, api, "Proxea /api/* y /healthz", "HTTP interno :3000")
    Rel(api, redis, "Cache HIT: sirve respuesta / Cache MISS: almacena resultado", "ioredis :6379")
    Rel(api, core, "HTTP proxy (solo en cache miss)", "HTTP interno :5000")
    Rel(core, dataStatic, "Lee snapshot de datos", "import")
    Rel(core, dataMonthly, "Lee series temporales", "import")
```

---

## Nivel 3 — Componentes del Core (Python Flask)

Muestra los componentes internos del microservicio `core/` y sus responsabilidades. Audiencia: desarrolladores del servicio.

```mermaid
C4Component
    title Diagrama de Componentes — Betix Core (Flask)

    Container_Boundary(core, "Betix Core (Python / Flask)") {
        Component(healthEp, "Health Endpoint", "Flask route", "GET /health")
        Component(geodataEp, "Geodata Endpoint", "Flask route", "GET /geodata")
        Component(proyectadoEp, "Proyectado Endpoint", "Flask route", "GET /proyectado")
        Component(mapaBurbujasEp, "Mapa Burbujas Endpoint", "Flask route", "GET /mapa-burbujas?juego&fecha_desde&fecha_hasta")

        Component(geodataSvc, "geodata_service", "Python", "Agrega métricas por provincia con coordenadas geográficas")
        Component(proyeccionesSvc, "proyecciones_service", "Python", "Calcula SMA rolling, SD histórica y bandas de error crecientes")
        Component(mapaBurbujasSvc, "mapa_burbujas_service", "Python", "Agrega TICKETS_POR_MES por provincia con filtros de juego y período")
        Component(healthSvc, "health_service", "Python", "Valida estructura y tipos de los datos en memoria")

        ComponentDb(mockData, "mock_data.py", "Python module", "Snapshot: 30 registros")
        ComponentDb(ticketsPorMes, "tickets_por_mes.py", "Python module", "Series: 360 registros mensuales")
    }

    Rel(healthEp, healthSvc, "Invoca validación")
    Rel(geodataEp, geodataSvc, "Delega agregación")
    Rel(proyectadoEp, proyeccionesSvc, "Delega cálculo")
    Rel(mapaBurbujasEp, mapaBurbujasSvc, "Delega agregación filtrada")
    Rel(geodataSvc, mockData, "Lee")
    Rel(proyeccionesSvc, ticketsPorMes, "Lee")
    Rel(mapaBurbujasSvc, ticketsPorMes, "Lee y filtra")
    Rel(healthSvc, mockData, "Valida")
```

---

## Referencias

- [C4 Model — simon brown](https://c4model.com/)
- [Mermaid C4 Diagram Syntax](https://mermaid.js.org/syntax/c4.html)
