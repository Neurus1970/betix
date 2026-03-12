import psycopg.errors
from psycopg.rows import dict_row
from ..db import get_connection


def get_provincias_juegos(provincia_id=None, juego_id=None) -> list:
    """Return list of provincia-juego assignments with optional filtering.

    Each item: {provincia_id, juego_id, provincia_nombre, juego_nombre}
    """
    query = """
        SELECT
            pj.provincia_id,
            pj.juego_id,
            p.nombre AS provincia_nombre,
            j.nombre AS juego_nombre
        FROM betix.provincias_juegos pj
        JOIN betix.provincias p ON p.id = pj.provincia_id
        JOIN betix.juegos     j ON j.id = pj.juego_id
        WHERE TRUE
    """
    params = []

    if provincia_id is not None:
        query += " AND pj.provincia_id = %s"
        params.append(provincia_id)

    if juego_id is not None:
        query += " AND pj.juego_id = %s"
        params.append(juego_id)

    query += " ORDER BY pj.provincia_id, pj.juego_id"

    with get_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, params)
            rows = cur.fetchall()

    return [dict(r) for r in rows]


def create_provincia_juego(provincia_id: int, juego_id: int) -> dict:
    """Insert a new provincia-juego assignment.

    Returns the created record with nombres via JOIN.
    Raises ValueError on FK violation or duplicate PK.
    """
    insert_sql = """
        INSERT INTO betix.provincias_juegos (provincia_id, juego_id)
        VALUES (%s, %s)
    """
    select_sql = """
        SELECT
            pj.provincia_id,
            pj.juego_id,
            p.nombre AS provincia_nombre,
            j.nombre AS juego_nombre
        FROM betix.provincias_juegos pj
        JOIN betix.provincias p ON p.id = pj.provincia_id
        JOIN betix.juegos     j ON j.id = pj.juego_id
        WHERE pj.provincia_id = %s AND pj.juego_id = %s
    """
    with get_connection() as conn:
        try:
            with conn.cursor() as cur:
                cur.execute(insert_sql, (provincia_id, juego_id))
            conn.commit()
        except psycopg.errors.UniqueViolation:
            conn.rollback()
            raise ValueError("La asignación ya existe")
        except psycopg.errors.ForeignKeyViolation:
            conn.rollback()
            raise ValueError("provincia_id o juego_id no válidos")

        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(select_sql, (provincia_id, juego_id))
            row = cur.fetchone()

    return dict(row)


def delete_provincia_juego(provincia_id: int, juego_id: int) -> bool:
    """Delete a provincia-juego assignment.

    Returns True if deleted, False if not found.
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM betix.provincias_juegos "
                "WHERE provincia_id = %s AND juego_id = %s",
                (provincia_id, juego_id),
            )
            deleted = cur.rowcount
        conn.commit()

    return deleted > 0
