Feature: Página HTML del dashboard de rendimiento
  Como usuario de Betix
  Quiero acceder al dashboard de rendimiento
  Para visualizar el gráfico interactivo de juegos por provincia

  Scenario: La página HTML es accesible
    When hago GET a "/dashboard-rendimiento"
    Then el código de respuesta es 200
    And el Content-Type es "text/html"

  Scenario: La página contiene el selector de juego
    When hago GET a "/dashboard-rendimiento"
    Then el HTML contiene 'id="juego"'

  Scenario: La página contiene el selector de métrica
    When hago GET a "/dashboard-rendimiento"
    Then el HTML contiene 'id="metrica"'

  Scenario: La página contiene el selector de provincias
    When hago GET a "/dashboard-rendimiento"
    Then el HTML contiene 'id="provincias"'
