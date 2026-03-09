Feature: Página de proyecciones estadísticas

  Como usuario de la demo de BETIX
  Quiero una página dedicada a proyecciones futuras de métricas de apuestas por provincia
  Para anticipar tendencias basadas en datos históricos con media móvil

  # ── Página HTML ──────────────────────────────────────────────────────────────

  Scenario: La página es accesible
    When hago GET a "/proyectado"
    Then el código de respuesta es 200
    And el Content-Type es "text/html"

  Scenario: La página contiene los selectores de filtros
    When hago GET a "/proyectado"
    Then el HTML contiene 'id="sel-provincia"'
    And el HTML contiene 'id="sel-juego"'
    And el HTML contiene 'id="sel-meses"'
    And el HTML contiene 'id="sel-metrica"'

  Scenario: La página contiene el SVG del gráfico de proyecciones
    When hago GET a "/proyectado"
    Then el HTML contiene 'id="chart-svg"'

  Scenario: La página contiene la tabla de datos numéricos
    When hago GET a "/proyectado"
    Then el HTML contiene 'id="table-proyectado"'

  Scenario: La página usa D3.js para las visualizaciones
    When hago GET a "/proyectado"
    Then el HTML contiene 'd3js.org'

  Scenario: La página consume el endpoint de proyectado
    When hago GET a "/proyectado"
    Then el HTML contiene '/api/datos/proyectado'

  # ── API endpoint ──────────────────────────────────────────────────────────────

  Scenario: El endpoint retorna datos con estructura correcta
    When hago GET a "/api/datos/proyectado"
    Then el código de respuesta es 200
    And el campo "status" es "ok"
    And "data" tiene los campos "historico,proyectado,provincias,juegos"

  Scenario: El histórico tiene 12 registros mensuales
    When hago GET a "/api/datos/proyectado"
    Then el campo "data.historico" tiene 12 elementos

  Scenario: Por defecto se proyecta 1 mes
    When hago GET a "/api/datos/proyectado"
    Then el campo "data.proyectado" tiene 1 elementos

  Scenario: Se pueden solicitar hasta 4 meses proyectados
    When hago GET a "/api/datos/proyectado?meses=4"
    Then el campo "data.proyectado" tiene 4 elementos

  Scenario: Los registros históricos tienen todos los campos requeridos
    When hago GET a "/api/datos/proyectado"
    Then cada elemento del campo "data.historico" tiene los campos "fecha,cantidad,ingresos,costo,beneficio"

  Scenario: Los registros proyectados tienen valores y bandas de error
    When hago GET a "/api/datos/proyectado"
    Then cada elemento del campo "data.proyectado" tiene los campos "fecha,cantidad,error_cantidad,ingresos,error_ingresos,beneficio,error_beneficio"

  Scenario: La lista de provincias está presente y no está vacía
    When hago GET a "/api/datos/proyectado"
    Then la respuesta contiene un array en el campo "data.provincias"
    And el campo "data.provincias" tiene 10 elementos

  Scenario: La lista de juegos está presente y no está vacía
    When hago GET a "/api/datos/proyectado"
    Then la respuesta contiene un array en el campo "data.juegos"
    And el campo "data.juegos" tiene 3 elementos
