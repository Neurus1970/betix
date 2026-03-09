from core.services.geodata_service import get_geodata


def test_geodata_returns_200(client):
    res = client.get("/geodata")
    assert res.status_code == 200
    assert res.get_json()["status"] == "ok"


def test_geodata_has_required_keys(client):
    data = client.get("/geodata").get_json()["data"]
    assert "globalTotals" in data
    assert "provinces" in data


def test_global_totals_fields(client):
    totals = client.get("/geodata").get_json()["data"]["globalTotals"]
    assert "cantidad" in totals
    assert "importe" in totals
    assert "beneficio" in totals


def test_ten_provinces(client):
    provinces = client.get("/geodata").get_json()["data"]["provinces"]
    assert isinstance(provinces, list)
    assert len(provinces) == 10


def test_province_fields(client):
    provinces = client.get("/geodata").get_json()["data"]["provinces"]
    for p in provinces:
        assert "provincia" in p
        assert p["lat"] is not None
        assert p["lng"] is not None
        assert "cantidad" in p["totals"]
        assert "importe" in p["totals"]
        assert "beneficio" in p["totals"]
        assert isinstance(p["games"], list)
        assert len(p["games"]) > 0


def test_get_geodata_service():
    result = get_geodata()
    assert len(result["provinces"]) == 10
    assert result["globalTotals"]["beneficio"] > 0
