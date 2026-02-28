Feature: Página HTML del mapa de estadísticas
  Como usuario de Betix
  Quiero acceder a la página del mapa interactivo
  Para visualizar las estadísticas georreferenciadas

  Scenario: La página HTML es accesible
    When hago GET a "/mapa-estadisticas"
    Then el código de respuesta es 200
    And el Content-Type es "text/html"

  Scenario: La página contiene el elemento del mapa
    When hago GET a "/mapa-estadisticas"
    Then el HTML contiene 'id="mapa"'

  Scenario: La página contiene el selector de métricas
    When hago GET a "/mapa-estadisticas"
    Then el HTML contiene 'id="metrica"'
    And el HTML contiene "cantidad"
    And el HTML contiene "importe"
    And el HTML contiene "beneficio"
