Feature: Endpoint unificado de geodata

  Como cliente frontend
  Quiero obtener en una sola llamada los datos georreferenciados y el detalle por juego
  Para reducir el número de requests al servidor

  Scenario: La respuesta es exitosa y contiene las dos colecciones de datos
    When hago GET a "/api/datos/geodata"
    Then el código de respuesta es 200
    And el campo "status" es "ok"
    And la respuesta contiene un array en el campo "data.geo"
    And la respuesta contiene un array en el campo "data.detail"
    And el campo "data.geo" tiene 10 elementos
    And el campo "data.detail" tiene 30 elementos

  Scenario: Los datos geo tienen todos los campos requeridos incluyendo coordenadas
    When hago GET a "/api/datos/geodata"
    Then cada elemento del campo "data.geo" tiene los campos "provincia,cantidad,importe,beneficio,lat,lng"

  Scenario: Los datos de detalle tienen todos los campos requeridos
    When hago GET a "/api/datos/geodata"
    Then cada elemento del campo "data.detail" tiene los campos "provincia,juego,cantidad,importe,beneficio"
