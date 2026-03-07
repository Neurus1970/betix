Feature: Health check del servicio
  Como consumidor de la API
  Quiero consultar el estado del servicio
  Para saber si está operativo

  Scenario: El endpoint /healthz devuelve status healthy
    When hago GET a "/healthz"
    Then el código de respuesta es 200
    And el campo "status" es "healthy"

  Scenario: El endpoint /health redirige a /healthz con 301
    When hago GET a "/health"
    Then el código de respuesta es 301
