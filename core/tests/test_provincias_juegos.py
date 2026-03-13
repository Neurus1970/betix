import pytest


# ---------------------------------------------------------------------------
# GET /provincias_juegos
# ---------------------------------------------------------------------------

def test_get_provincias_juegos_returns_200(client):
    res = client.get("/provincias_juegos")
    assert res.status_code == 200
    assert res.get_json()["status"] == "ok"


def test_get_provincias_juegos_non_empty(client):
    data = client.get("/provincias_juegos").get_json()["data"]
    assert isinstance(data, list)
    assert len(data) > 0


def test_get_provincias_juegos_item_fields(client):
    data = client.get("/provincias_juegos").get_json()["data"]
    for item in data:
        assert "provincia_id" in item
        assert "juego_id" in item
        assert "provincia_nombre" in item
        assert "juego_nombre" in item


def test_get_provincias_juegos_filter_by_provincia_id(client):
    res = client.get("/provincias_juegos?provincia_id=1")
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert isinstance(data, list)
    assert len(data) > 0
    for item in data:
        assert item["provincia_id"] == 1


def test_get_provincias_juegos_filter_by_juego_id(client):
    res = client.get("/provincias_juegos?juego_id=1")
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert isinstance(data, list)
    assert len(data) > 0
    for item in data:
        assert item["juego_id"] == 1


# ---------------------------------------------------------------------------
# POST /provincias_juegos
# ---------------------------------------------------------------------------

def test_post_provincia_juego_valid(client):
    # Use a high provincia_id / juego_id unlikely to be in seed data.
    # We delete first to ensure it does not exist, then create it.
    client.delete("/provincias_juegos/1/1")

    res = client.post(
        "/provincias_juegos",
        json={"provincia_id": 1, "juego_id": 1},
    )
    # It may return 201 (created) or 409 (already exists if seed populated it).
    # Re-insert after ensuring deletion → should be 201.
    # If the seed already added (1,1) the delete above removed it so we expect 201.
    assert res.status_code == 201
    body = res.get_json()
    assert body["status"] == "ok"
    assert body["data"]["provincia_id"] == 1
    assert body["data"]["juego_id"] == 1
    assert "provincia_nombre" in body["data"]
    assert "juego_nombre" in body["data"]

    # Restore: re-insert so other tests are not affected
    # (seed data will be reset on next session anyway)


def test_post_provincia_juego_duplicate(client):
    # Ensure the row exists first
    client.post("/provincias_juegos", json={"provincia_id": 1, "juego_id": 1})

    res = client.post(
        "/provincias_juegos",
        json={"provincia_id": 1, "juego_id": 1},
    )
    assert res.status_code == 409
    body = res.get_json()
    assert body["status"] == "error"
    assert body["message"] == "La asignación ya existe"


def test_post_provincia_juego_invalid_fk(client):
    res = client.post(
        "/provincias_juegos",
        json={"provincia_id": 9999, "juego_id": 9999},
    )
    assert res.status_code == 400
    body = res.get_json()
    assert body["status"] == "error"
    assert "válidos" in body["message"]


def test_post_provincia_juego_missing_fields(client):
    res = client.post("/provincias_juegos", json={"provincia_id": 1})
    assert res.status_code == 400
    body = res.get_json()
    assert body["status"] == "error"


def test_post_provincia_juego_non_integer_fields(client):
    res = client.post(
        "/provincias_juegos",
        json={"provincia_id": "abc", "juego_id": 1},
    )
    assert res.status_code == 400
    body = res.get_json()
    assert body["status"] == "error"


# ---------------------------------------------------------------------------
# DELETE /provincias_juegos/<provincia_id>/<juego_id>
# ---------------------------------------------------------------------------

def test_delete_provincia_juego_existing(client):
    # Ensure the row exists before deleting
    client.post("/provincias_juegos", json={"provincia_id": 1, "juego_id": 1})

    res = client.delete("/provincias_juegos/1/1")
    assert res.status_code == 204
    assert res.data == b""

    # Restore to avoid polluting session-scoped DB state for subsequent tests
    client.post("/provincias_juegos", json={"provincia_id": 1, "juego_id": 1})


def test_delete_provincia_juego_not_found(client):
    # Make sure the row does not exist
    client.delete("/provincias_juegos/9999/9999")

    res = client.delete("/provincias_juegos/9999/9999")
    assert res.status_code == 404
    body = res.get_json()
    assert body["status"] == "error"
    assert body["message"] == "Asignación no encontrada"
