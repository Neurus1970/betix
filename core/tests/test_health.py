import pytest
from unittest.mock import patch, MagicMock
from core.services.health_service import check_data_access


def test_health_returns_200(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.get_json()["status"] == "healthy"


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
