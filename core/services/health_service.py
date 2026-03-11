from ..db import get_connection


def check_data_access() -> None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM betix.provincias")
            count = cur.fetchone()[0]
    if count == 0:
        raise RuntimeError("La base de datos no contiene datos: tabla betix.provincias vacía")
