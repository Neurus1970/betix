Feature: Resumen general de estadísticas
  Como directivo de Betix
  Quiero ver el resumen consolidado de todos los tickets
  Para evaluar la rentabilidad global del negocio

  Scenario: El resumen devuelve los cuatro campos esperados
    When hago GET a "/api/estadisticas/resumen"
    Then el código de respuesta es 200
    And el campo "status" es "ok"
    And "data" tiene los campos "totalTickets,totalIngresos,totalCosto,rentabilidad"

  Scenario: El negocio es rentable (ingresos superan costos)
    When hago GET a "/api/estadisticas/resumen"
    Then el campo numérico "data.totalIngresos" es mayor que "data.totalCosto"
