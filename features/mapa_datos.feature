Feature: Datos JSON del mapa de estadísticas (DEPRECADO)

  Como cliente frontend
  Quiero saber que el endpoint deprecado retorna 410
  Para migrar al nuevo endpoint /api/datos/geodata

  Scenario: El endpoint retorna 410 Gone por estar deprecado
    When hago GET a "/api/mapa-estadisticas/datos"
    Then el código de respuesta es 410
    And el campo "status" es "gone"
