Feature: Endpoint de datos temporales por provincia y mes

  Scenario: El endpoint retorna status 200
    When hago GET a "/api/datos/temporal"
    Then el código de respuesta es 200

  Scenario: La respuesta tiene status ok
    When hago GET a "/api/datos/temporal"
    Then el campo "status" es "ok"

  Scenario: La respuesta contiene meses y series
    When hago GET a "/api/datos/temporal"
    Then la respuesta contiene un array en el campo "data.meses"
    And la respuesta contiene un array en el campo "data.series"

  Scenario: La serie tiene 10 meses (Jun 2025 - Mar 2026)
    When hago GET a "/api/datos/temporal"
    Then el campo "data.meses" tiene 10 elementos

  Scenario: La respuesta incluye 10 provincias
    When hago GET a "/api/datos/temporal"
    Then el campo "data.series" tiene 10 elementos

  Scenario: Cada serie tiene las métricas esperadas
    When hago GET a "/api/datos/temporal"
    Then cada elemento del campo "data.series" tiene los campos "provincia,cantidad,ingresos,costo,beneficio"

  Scenario: El filtro por juego es soportado
    When hago GET a "/api/datos/temporal?juego=Quiniela"
    Then el código de respuesta es 200
    And la respuesta contiene un array en el campo "data.series"

  Scenario: El filtro Todos retorna todas las provincias
    When hago GET a "/api/datos/temporal?juego=Todos"
    Then el campo "data.series" tiene 10 elementos
