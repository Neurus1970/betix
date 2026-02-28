Feature: Datos JSON del mapa de estadísticas
  Como cliente frontend
  Quiero obtener los datos georreferenciados de las provincias
  Para renderizar el mapa interactivo

  Scenario: La respuesta es exitosa y contiene datos
    When hago GET a "/api/mapa-estadisticas/datos"
    Then el código de respuesta es 200
    And el campo "status" es "success"
    And la respuesta contiene un array en "data"
    And el array "data" no está vacío

  Scenario: Cada provincia tiene todos los campos del mapa
    When hago GET a "/api/mapa-estadisticas/datos"
    Then cada elemento de "data" tiene los campos "provincia,cantidad,importe,beneficio,lat,lng"

  Scenario: Los valores numéricos son positivos
    When hago GET a "/api/mapa-estadisticas/datos"
    Then cada elemento de "data" tiene "cantidad" mayor que 0
    And cada elemento de "data" tiene "importe" mayor que 0

  Scenario: Las coordenadas corresponden a territorio argentino
    When hago GET a "/api/mapa-estadisticas/datos"
    Then la latitud de cada provincia está entre -60 y -20
    And la longitud de cada provincia está entre -75 y -50

  Scenario: Todas las provincias tienen coordenadas definidas
    When hago GET a "/api/mapa-estadisticas/datos"
    Then ningún elemento de "data" tiene "lat" nulo
    And ningún elemento de "data" tiene "lng" nulo
