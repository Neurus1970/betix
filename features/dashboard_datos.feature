Feature: Datos JSON del dashboard de rendimiento
  Como cliente frontend
  Quiero obtener los datos de rendimiento por provincia y juego
  Para renderizar el dashboard interactivo

  Scenario: La respuesta es exitosa y contiene datos
    When hago GET a "/api/dashboard/datos"
    Then el código de respuesta es 200
    And el campo "status" es "ok"
    And la respuesta contiene un array en "data"
    And el array "data" no está vacío

  Scenario: Cada registro tiene todos los campos requeridos
    When hago GET a "/api/dashboard/datos"
    Then cada elemento de "data" tiene los campos "provincia,juego,cantidad,importe,beneficio"

  Scenario: Los importes son positivos
    When hago GET a "/api/dashboard/datos"
    Then cada elemento de "data" tiene "importe" mayor que 0

  Scenario: Los beneficios son positivos
    When hago GET a "/api/dashboard/datos"
    Then cada elemento de "data" tiene "beneficio" mayor que 0
