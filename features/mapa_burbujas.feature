Feature: Endpoint de mapa de burbujas por provincia

  Como cliente frontend
  Quiero obtener métricas agregadas por provincia con coordenadas geográficas
  Para visualizar la distribución de ingresos y ventas en un mapa interactivo

  Scenario: La respuesta contiene provinces, juegos y fechas
    When hago GET a "/api/datos/mapa-burbujas"
    Then el código de respuesta es 200
    And el campo "status" es "ok"
    And "data" tiene los campos "provinces,juegos,fechas"
    And el campo "data.provinces" tiene 10 elementos

  Scenario: Cada provincia tiene coordenadas y métricas
    When hago GET a "/api/datos/mapa-burbujas"
    Then cada elemento del campo "data.provinces" tiene los campos "provincia,lat,lng,cantidad,ingresos,beneficio"

  Scenario: data.juegos contiene los tres juegos disponibles
    When hago GET a "/api/datos/mapa-burbujas"
    Then la respuesta contiene un array en el campo "data.juegos"

  Scenario: Filtrar por juego acepta el parámetro y retorna 200
    When hago GET a "/api/datos/mapa-burbujas?juego=Quiniela"
    Then el código de respuesta es 200
    And el campo "status" es "ok"

  Scenario: Filtrar por rango de fechas retorna 200
    When hago GET a "/api/datos/mapa-burbujas?fecha_desde=2025-06&fecha_hasta=2025-12"
    Then el código de respuesta es 200
    And el campo "status" es "ok"
