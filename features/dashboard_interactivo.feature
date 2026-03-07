Feature: Dashboard interactivo con mapa y gráfico de torta
  Como gerente o analista en Tecno Acción
  Quiero una pantalla con mapa de Argentina y gráfico de torta filtrables
  Para analizar el rendimiento por provincia y juego de forma dinámica

  Scenario: La página es accesible
    When hago GET a "/dashboard-interactivo"
    Then el código de respuesta es 200
    And el Content-Type es "text/html"

  Scenario: La página contiene el selector de juego
    When hago GET a "/dashboard-interactivo"
    Then el HTML contiene 'id="sel-juego"'

  Scenario: La página contiene el selector de métrica
    When hago GET a "/dashboard-interactivo"
    Then el HTML contiene 'id="sel-metrica"'

  Scenario: La página contiene el SVG del mapa de Argentina
    When hago GET a "/dashboard-interactivo"
    Then el HTML contiene 'id="map-svg"'

  Scenario: La página contiene el SVG del gráfico de torta
    When hago GET a "/dashboard-interactivo"
    Then el HTML contiene 'id="pie-svg"'

  Scenario: La página usa D3.js para los gráficos
    When hago GET a "/dashboard-interactivo"
    Then el HTML contiene 'd3js.org'

  Scenario: La página consume el endpoint de geodata
    When hago GET a "/dashboard-interactivo"
    Then el HTML contiene '/api/datos/geodata'
