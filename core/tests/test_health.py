from core.services.health_service import check_data_access
from core.data import mock_data


def test_health_returns_200(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.get_json()["status"] == "healthy"


def test_check_data_access_passes_with_valid_data():
    # Should not raise
    check_data_access()


def test_check_data_access_raises_on_missing_field():
    original = mock_data.TICKETS[0].copy()
    del mock_data.TICKETS[0]["provincia"]
    try:
        with __import__("pytest").raises(RuntimeError, match='campo "provincia" faltante'):
            check_data_access()
    finally:
        mock_data.TICKETS[0].update(original)


def test_check_data_access_raises_on_wrong_type():
    original = mock_data.TICKETS[0]["ingresos"]
    mock_data.TICKETS[0]["ingresos"] = "invalido"
    try:
        with __import__("pytest").raises(RuntimeError, match='campo "ingresos" inválido'):
            check_data_access()
    finally:
        mock_data.TICKETS[0]["ingresos"] = original
