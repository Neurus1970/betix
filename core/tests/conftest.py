import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import psycopg
import pytest

# BETIX_DB_URL puede venir del entorno (CI) o usar el default local.
# En CI se inyecta via el servicio `postgres` del workflow.
_TEST_DB_URL = os.environ.get(
    "BETIX_DB_URL",
    "postgresql://betix:betix@localhost:5432/betix",
)

_SEEDS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "db", "seeds")
_MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "db", "migrations")


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Crea el esquema betix y carga los seeds antes de todos los tests."""
    os.environ["BETIX_DB_URL"] = _TEST_DB_URL

    with psycopg.connect(_TEST_DB_URL) as conn:
        # Migraciones (idempotente — usa IF NOT EXISTS)
        with open(os.path.join(_MIGRATIONS_DIR, "001_init.sql")) as f:
            conn.execute(f.read())

        # Truncar y recargar seeds
        conn.execute(
            "TRUNCATE betix.tickets_mensuales, betix.provincias, betix.juegos "
            "RESTART IDENTITY CASCADE"
        )

        with open(os.path.join(_SEEDS_DIR, "_provincias.csv")) as f:
            with conn.cursor() as cur:
                with cur.copy(
                    "COPY betix.provincias(nombre, lat, lng) FROM STDIN CSV HEADER"
                ) as copy:
                    copy.write(f.read())

        with open(os.path.join(_SEEDS_DIR, "_juegos.csv")) as f:
            with conn.cursor() as cur:
                with cur.copy(
                    "COPY betix.juegos(nombre) FROM STDIN CSV HEADER"
                ) as copy:
                    copy.write(f.read())

        with open(os.path.join(_SEEDS_DIR, "_tickets_mensuales.csv")) as f:
            csv_content = f.read()

        with conn.cursor() as cur:
            cur.execute("""
                CREATE TEMP TABLE tmp_tickets (
                    provincia_nombre VARCHAR(100),
                    juego_nombre     VARCHAR(50),
                    fecha            DATE,
                    cantidad         INTEGER,
                    ingresos         DECIMAL(14,2),
                    costo            DECIMAL(14,2)
                )
            """)
            with cur.copy("COPY tmp_tickets FROM STDIN CSV HEADER") as copy:
                copy.write(csv_content)
            cur.execute("""
                INSERT INTO betix.tickets_mensuales
                       (provincia_id, juego_id, fecha, cantidad, ingresos, costo)
                SELECT p.id, j.id, t.fecha, t.cantidad, t.ingresos, t.costo
                FROM   tmp_tickets t
                JOIN   betix.provincias p ON p.nombre = t.provincia_nombre
                JOIN   betix.juegos     j ON j.nombre = t.juego_nombre
            """)

        conn.commit()

    yield

    from core.db import close_pool
    close_pool()


@pytest.fixture
def client():
    from core.main import app as flask_app
    flask_app.config["TESTING"] = True
    with flask_app.test_client() as c:
        yield c
