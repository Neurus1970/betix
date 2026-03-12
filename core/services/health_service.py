import psycopg

from ..db import get_connection


def check_data_access() -> None:
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM betix.provincias")
                count = cur.fetchone()[0]
    except psycopg.OperationalError as e:
        err = RuntimeError(f"DB connection failed: {e}")
        err.pgcode = getattr(e, 'sqlstate', None)
        raise err from e
    except Exception as e:
        raise RuntimeError(f"DB error: {e}") from e
    if count == 0:
        raise RuntimeError("La base de datos no contiene datos: tabla betix.provincias vacía")
