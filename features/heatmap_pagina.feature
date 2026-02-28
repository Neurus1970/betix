Feature: Página HTML del heatmap de apuestas
  Como usuario de Betix
  Quiero acceder al heatmap de apuestas por provincia
  Para identificar regiones de alto y bajo rendimiento geográfico

  Scenario: La página HTML es accesible
    When hago GET a "/heatmap-apuestas"
    Then el código de respuesta es 200
    And el Content-Type es "text/html"

  Scenario: La página contiene el selector de juego
    When hago GET a "/heatmap-apuestas"
    Then el HTML contiene 'id="juego"'

  Scenario: La página contiene el selector de métrica
    When hago GET a "/heatmap-apuestas"
    Then el HTML contiene 'id="metrica"'

  Scenario: La página contiene el elemento del heatmap
    When hago GET a "/heatmap-apuestas"
    Then el HTML contiene 'id="heatmap"'
