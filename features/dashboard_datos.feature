Feature: Datos JSON del dashboard de rendimiento (DEPRECADO)

  Como cliente frontend
  Quiero saber que el endpoint deprecado retorna 410
  Para migrar al nuevo endpoint /api/datos/geodata

  Scenario: El endpoint retorna 410 Gone por estar deprecado
    When hago GET a "/api/dashboard/datos"
    Then el código de respuesta es 410
    And el campo "status" es "gone"
