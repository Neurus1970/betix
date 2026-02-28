Feature: Dashboard interactivo (mapa choropleth + torta)

  Como analista en Tecno Acción
  Quiero una pantalla con mapa y torta interactivos
  Para analizar el rendimiento por provincia y juego

  Scenario: La página carga con código 200
    When hago GET a "/dashboard-interactivo"
    Then el código de respuesta es 200

  Scenario: La API provee los datos necesarios para el dashboard
    When hago GET a "/api/datos/geodata"
    Then el código de respuesta es 200
    And el campo "data.provinces" tiene 10 elementos

  Scenario: Cada provincia tiene juegos para alimentar el pie chart
    When hago GET a "/api/datos/geodata"
    Then cada elemento del campo "data.provinces" tiene los campos "provincia,lat,lng,totals,games"
