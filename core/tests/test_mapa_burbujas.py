from core.services.mapa_burbujas_service import get_mapa_burbujas


def test_mapa_burbujas_returns_200(client):
    res = client.get("/mapa-burbujas")
    assert res.status_code == 200
    assert res.get_json()["status"] == "ok"


def test_mapa_burbujas_has_required_keys(client):
    data = client.get("/mapa-burbujas").get_json()["data"]
    assert "provinces" in data
    assert "juegos" in data
    assert "fechas" in data


def test_mapa_burbujas_ten_provinces(client):
    provinces = client.get("/mapa-burbujas").get_json()["data"]["provinces"]
    assert isinstance(provinces, list)
    assert len(provinces) == 10


def test_province_fields(client):
    provinces = client.get("/mapa-burbujas").get_json()["data"]["provinces"]
    for p in provinces:
        assert "provincia" in p
        assert p["lat"] is not None
        assert p["lng"] is not None
        assert "cantidad" in p
        assert "ingresos" in p
        assert "beneficio" in p


def test_juego_filter_reduces_results(client):
    all_res    = client.get("/mapa-burbujas").get_json()["data"]["provinces"]
    quini_res  = client.get("/mapa-burbujas?juego=Quiniela").get_json()["data"]["provinces"]
    assert len(quini_res) == 10
    # filtered ingresos must be less than full aggregation
    total_all   = sum(p["ingresos"] for p in all_res)
    total_quini = sum(p["ingresos"] for p in quini_res)
    assert total_quini < total_all


def test_fecha_desde_filter(client):
    all_res      = client.get("/mapa-burbujas").get_json()["data"]["provinces"]
    filtered_res = client.get("/mapa-burbujas?fecha_desde=2026-01").get_json()["data"]["provinces"]
    total_all      = sum(p["ingresos"] for p in all_res)
    total_filtered = sum(p["ingresos"] for p in filtered_res)
    assert total_filtered < total_all


def test_fecha_hasta_filter(client):
    all_res      = client.get("/mapa-burbujas").get_json()["data"]["provinces"]
    filtered_res = client.get("/mapa-burbujas?fecha_hasta=2025-06").get_json()["data"]["provinces"]
    total_all      = sum(p["ingresos"] for p in all_res)
    total_filtered = sum(p["ingresos"] for p in filtered_res)
    assert total_filtered < total_all


def test_beneficio_equals_ingresos_minus_costo():
    from core.data.tickets_por_mes import TICKETS_POR_MES
    provinces = get_mapa_burbujas()["provinces"]
    by_prov = {}
    for r in TICKETS_POR_MES:
        p = r["provincia"]
        if p not in by_prov:
            by_prov[p] = {"ingresos": 0, "costo": 0}
        by_prov[p]["ingresos"] += r["ingresos"]
        by_prov[p]["costo"]    += r["costo"]

    for p in provinces:
        expected = by_prov[p["provincia"]]["ingresos"] - by_prov[p["provincia"]]["costo"]
        assert p["beneficio"] == expected


def test_service_returns_three_juegos():
    result = get_mapa_burbujas()
    assert sorted(result["juegos"]) == ["Lotería", "Quiniela", "Raspadita"]


def test_service_returns_twelve_fechas():
    result = get_mapa_burbujas()
    assert len(result["fechas"]) == 12
