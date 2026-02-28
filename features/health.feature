Feature: Health check del servicio
  Como consumidor de la API
  Quiero consultar el estado del servicio
  Para saber si está operativo

  Scenario: El endpoint de health devuelve status ok
    When hago GET a "/health"
    Then el código de respuesta es 200
    And el campo "status" es "ok"
    And el campo "service" es "betix-api"
