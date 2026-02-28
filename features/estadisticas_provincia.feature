Feature: Estadísticas por provincia
  Como analista de Betix
  Quiero obtener estadísticas agrupadas por provincia
  Para evaluar el rendimiento en cada región

  Scenario: La respuesta contiene el array de provincias
    When hago GET a "/api/estadisticas/provincia"
    Then el código de respuesta es 200
    And el campo "status" es "ok"
    And la respuesta contiene un array en "data"
    And el array "data" no está vacío

  Scenario: Cada provincia tiene los campos obligatorios
    When hago GET a "/api/estadisticas/provincia"
    Then cada elemento de "data" tiene los campos "provincia,totalTickets,totalIngresos,totalCosto,rentabilidad"

  Scenario: La rentabilidad está entre 0 y 100
    When hago GET a "/api/estadisticas/provincia"
    Then la rentabilidad de cada elemento en "data" es un número entre 0 y 100

  Scenario: Se retornan las 10 provincias del sistema
    When hago GET a "/api/estadisticas/provincia"
    Then el array "data" tiene al menos 10 elementos
