"""
Módulo de acceso a base de datos.

Expone get_connection() que devuelve una conexión del pool.
El pool se inicializa de forma lazy en el primer uso.

Requiere la variable de entorno BETIX_DB_URL con un DSN estándar:
    postgresql://user:pass@host:port/dbname

Falla explícitamente al arrancar si la variable no está definida.
"""

import os
from typing import Optional

import psycopg
from psycopg_pool import ConnectionPool

_pool: Optional[ConnectionPool] = None


def _get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        db_url = os.environ.get("BETIX_DB_URL")
        if not db_url:
            raise RuntimeError(
                "La variable de entorno BETIX_DB_URL no está definida. "
                "Definila antes de iniciar el servidor: "
                "postgresql://user:pass@host:port/dbname"
            )
        _pool = ConnectionPool(db_url, min_size=1, max_size=10, open=True)
    return _pool


def get_connection() -> psycopg.Connection:
    """Devuelve una conexión del pool. Usar como context manager."""
    return _get_pool().connection()


def close_pool() -> None:
    """Cierra el pool (útil en tests para liberar recursos)."""
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None
