Feature: Endpoint unificado de geodata

  Como cliente frontend
  Quiero obtener en una sola llamada los totales globales, por provincia y por juego
  Para reducir el número de requests al servidor

  Scenario: La respuesta contiene globalTotals y la lista de provincias
    When hago GET a "/api/datos/geodata"
    Then el código de respuesta es 200
    And el campo "status" es "ok"
    And "data" tiene los campos "globalTotals,provinces"
    And el campo "data.provinces" tiene 10 elementos

  Scenario: globalTotals tiene los campos de métricas requeridos
    When hago GET a "/api/datos/geodata"
    Then el campo anidado "data.globalTotals" tiene los campos "cantidad,importe,beneficio"

  Scenario: Cada provincia tiene estructura con coordenadas, totales y juegos
    When hago GET a "/api/datos/geodata"
    Then cada elemento del campo "data.provinces" tiene los campos "provincia,lat,lng,totals,games"
