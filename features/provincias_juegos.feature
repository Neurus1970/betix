Feature: Gestión de asignaciones provincia-juego

  Como administrador de Betix
  Quiero gestionar las asignaciones entre provincias y juegos
  Para configurar qué juegos están disponibles en cada provincia

  Scenario: Obtener lista completa de asignaciones
    Given el core devuelve la lista de provincias_juegos
    When se hace GET a "/api/provincias_juegos"
    Then la respuesta tiene status 200
    And la respuesta contiene una lista de asignaciones

  Scenario: Filtrar asignaciones por provincia
    Given el core devuelve asignaciones para la provincia 1
    When se hace GET a "/api/provincias_juegos?provincia_id=1"
    Then la respuesta tiene status 200
    And todas las asignaciones pertenecen a la provincia 1

  Scenario: Crear una nueva asignación
    Given el core acepta la nueva asignación
    When se hace POST a "/api/provincias_juegos" con body provincia_id=3 juego_id=2
    Then la respuesta tiene status 201
    And la respuesta contiene los datos de la asignación creada

  Scenario: Error al crear asignación duplicada
    Given el core rechaza la asignación por duplicada
    When se hace POST a "/api/provincias_juegos" con body provincia_id=1 juego_id=1
    Then la respuesta tiene status 409

  Scenario: Eliminar una asignación existente
    Given el core elimina la asignación correctamente
    When se hace DELETE a "/api/provincias_juegos/1/1"
    Then la respuesta tiene status 204

  Scenario: Error al eliminar asignación inexistente
    Given el core no encuentra la asignación a eliminar
    When se hace DELETE a "/api/provincias_juegos/9999/9999"
    Then la respuesta tiene status 404
