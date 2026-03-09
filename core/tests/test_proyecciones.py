import pytest
from core.services.proyecciones_service import (
    calcular_proyecciones,
    get_provincias,
    get_juegos,
    mean,
    std_dev,
)


# ── Helpers estadísticos ──────────────────────────────────────────────────────

def test_mean_basic():
    assert mean([2, 4, 6]) == 4.0
    assert mean([10]) == 10.0


def test_std_dev_constant():
    assert std_dev([5, 5, 5]) == 0.0


def test_std_dev_known_value():
    result = std_dev([2, 4, 4, 4, 5, 5, 7, 9])
    assert abs(result - 2.0) < 0.5


# ── Listas de referencia ──────────────────────────────────────────────────────

def test_get_provincias_count_and_sorted():
    lst = get_provincias()
    assert len(lst) == 10
    assert lst == sorted(lst)


def test_get_juegos_count_and_sorted():
    lst = get_juegos()
    assert len(lst) == 3
    assert lst == sorted(lst)


# ── calcular_proyecciones ─────────────────────────────────────────────────────

def test_historico_and_proyectado_lengths():
    result = calcular_proyecciones(provincia="Catamarca", juego="Lotería", k=2)
    assert len(result["historico"]) == 12
    assert len(result["proyectado"]) == 2


def test_projected_dates_are_consecutive_and_future():
    result = calcular_proyecciones(provincia="Neuquén", juego="Quiniela", k=3)
    hist = result["historico"]
    proj = result["proyectado"]
    last_hist = hist[-1]["fecha"]
    assert proj[0]["fecha"] > last_hist
    assert proj[1]["fecha"] > proj[0]["fecha"]
    assert proj[2]["fecha"] > proj[1]["fecha"]


def test_error_grows_monotonically():
    result = calcular_proyecciones(provincia="Corrientes", juego="Lotería", k=4)
    proj = result["proyectado"]
    assert proj[3]["error_cantidad"] >= proj[0]["error_cantidad"]


def test_beneficio_equals_ingresos_minus_costo():
    result = calcular_proyecciones(provincia="Salta", juego="Quiniela", k=1)
    for row in result["historico"]:
        assert row["beneficio"] == row["ingresos"] - row["costo"]


def test_projected_has_error_fields():
    result = calcular_proyecciones(provincia="Salta", juego="Quiniela", k=1)
    item = result["proyectado"][0]
    assert "error_cantidad" in item
    assert "error_ingresos" in item
    assert "error_beneficio" in item


def test_raises_on_insufficient_data():
    with pytest.raises(ValueError):
        calcular_proyecciones(provincia="Inexistente", juego="Quiniela", k=1)


# ── API endpoint ──────────────────────────────────────────────────────────────

def test_proyectado_api_200(client):
    res = client.get("/proyectado")
    assert res.status_code == 200
    assert res.get_json()["status"] == "ok"


def test_proyectado_api_default_structure(client):
    data = client.get("/proyectado").get_json()["data"]
    assert "historico" in data
    assert "proyectado" in data
    assert "provincias" in data
    assert "juegos" in data


def test_proyectado_api_default_1_month(client):
    data = client.get("/proyectado").get_json()["data"]
    assert len(data["proyectado"]) == 1


def test_proyectado_api_4_months(client):
    data = client.get("/proyectado?meses=4").get_json()["data"]
    assert len(data["proyectado"]) == 4


def test_proyectado_api_clamps_meses(client):
    data = client.get("/proyectado?meses=10").get_json()["data"]
    assert len(data["proyectado"]) == 4


def test_proyectado_api_filter_provincia(client):
    data = client.get("/proyectado?provincia=Corrientes&juego=Quiniela").get_json()["data"]
    assert data["provincia"] == "Corrientes"
    assert data["juego"] == "Quiniela"
