Feature: Estadísticas por juego
  Como analista de Betix
  Quiero obtener estadísticas agrupadas por juego
  Para comparar el rendimiento entre Quiniela, Lotería y Raspadita

  Scenario: La respuesta contiene estadísticas de los tres juegos
    When hago GET a "/api/estadisticas/juego"
    Then el código de respuesta es 200
    And el campo "status" es "ok"
    And la respuesta contiene un array en "data"

  Scenario: Cada juego tiene los campos obligatorios
    When hago GET a "/api/estadisticas/juego"
    Then cada elemento de "data" tiene los campos "juego,totalTickets,totalIngresos,totalCosto,rentabilidad"

  Scenario: Los tres juegos esperados están presentes
    When hago GET a "/api/estadisticas/juego"
    Then el array "data" contiene un elemento con "juego" igual a "Quiniela"
    And el array "data" contiene un elemento con "juego" igual a "Lotería"
    And el array "data" contiene un elemento con "juego" igual a "Raspadita"
