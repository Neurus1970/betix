import psycopg
import pytest
from unittest.mock import patch, MagicMock
from core.services.health_service import check_data_access


def test_health_returns_200(client):
    res = client.get("/healthz")
    assert res.status_code == 200
    body = res.get_json()
    assert body["status"] == "healthy"
    assert body["component"] == "betix-core"
    assert "timestamp" in body
    assert body["dependencies"]["postgresql"]["status"] == "healthy"


def test_health_returns_503_when_unhealthy(client):
    with patch("core.services.health_service.get_connection") as mock_get_conn:
        mock_get_conn.side_effect = RuntimeError("DB connection failed: something went wrong")
        res = client.get("/healthz")
    assert res.status_code == 503
    body = res.get_json()
    assert body["status"] == "unhealthy"
    assert body["component"] == "betix-core"
    assert "timestamp" in body
    pg = body["dependencies"]["postgresql"]
    assert pg["status"] == "unhealthy"
    assert "error" in pg


def test_health_returns_503_on_psycopg_operational_error(client):
    # Simula un OperationalError que health_service convierte a RuntimeError("DB connection failed: ...")
    with patch("core.services.health_service.get_connection") as mock_get_conn:
        mock_get_conn.side_effect = psycopg.OperationalError("connection refused")
        res = client.get("/healthz")
    assert res.status_code == 503
    body = res.get_json()
    assert body["status"] == "unhealthy"
    assert body["component"] == "betix-core"
    assert "timestamp" in body
    pg = body["dependencies"]["postgresql"]
    assert pg["status"] == "unhealthy"
    assert "DB connection failed" in pg["error"]


def test_health_returns_503_includes_pgcode_when_available(client):
    # Simula un OperationalError con sqlstate (pgcode) definido
    err = psycopg.OperationalError("connection refused")
    err.sqlstate = "08006"
    with patch("core.services.health_service.get_connection") as mock_get_conn:
        mock_get_conn.side_effect = err
        res = client.get("/healthz")
    assert res.status_code == 503
    pg = res.get_json()["dependencies"]["postgresql"]
    assert pg.get("pgcode") == "08006"


def test_check_data_access_passes_with_data():
    # La DB de test tiene 10 provincias cargadas — no debe lanzar excepción
    check_data_access()


def test_check_data_access_raises_when_empty():
    # Simula una DB vacía devolviendo count = 0
    mock_cursor = MagicMock()
    mock_cursor.__enter__ = MagicMock(return_value=mock_cursor)
    mock_cursor.__exit__ = MagicMock(return_value=False)
    mock_cursor.fetchone.return_value = (0,)

    mock_conn = MagicMock()
    mock_conn.__enter__ = MagicMock(return_value=mock_conn)
    mock_conn.__exit__ = MagicMock(return_value=False)
    mock_conn.cursor.return_value = mock_cursor

    with patch("core.services.health_service.get_connection", return_value=mock_conn):
        with pytest.raises(RuntimeError, match="vacía"):
            check_data_access()


def test_check_data_access_raises_on_psycopg_operational_error():
    # Simula psycopg.OperationalError siendo capturada y relanzada como RuntimeError
    with patch("core.services.health_service.get_connection") as mock_get_conn:
        mock_get_conn.side_effect = psycopg.OperationalError("connection refused")
        with pytest.raises(RuntimeError, match="DB connection failed"):
            check_data_access()
