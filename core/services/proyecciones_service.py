import math
from psycopg.rows import dict_row
from ..db import get_connection

SMA_WINDOW = 3


def mean(arr: list) -> float:
    return sum(arr) / len(arr)


def std_dev(arr: list) -> float:
    m = mean(arr)
    variance = sum((v - m) ** 2 for v in arr) / len(arr)
    return math.sqrt(variance)


def _add_month(fecha_yyyy_mm: str) -> str:
    year, month = map(int, fecha_yyyy_mm.split("-"))
    month += 1
    if month > 12:
        month = 1
        year += 1
    return f"{year}-{month:02d}"


def get_provincias() -> list:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT nombre FROM betix.provincias ORDER BY nombre")
            return [r[0] for r in cur.fetchall()]


def get_juegos() -> list:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT nombre FROM betix.juegos ORDER BY nombre")
            return [r[0] for r in cur.fetchall()]


def calcular_proyecciones(provincia: str, juego: str, k: int, n: int = SMA_WINDOW) -> dict:
    with get_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("""
                SELECT
                    TO_CHAR(t.fecha, 'YYYY-MM') AS fecha,
                    t.cantidad,
                    t.ingresos,
                    t.costo,
                    (t.ingresos - t.costo)      AS beneficio
                FROM betix.tickets_mensuales t
                JOIN betix.provincias p ON p.id = t.provincia_id
                JOIN betix.juegos     j ON j.id = t.juego_id
                WHERE p.nombre = %s
                  AND j.nombre = %s
                ORDER BY t.fecha
            """, (provincia, juego))
            historico = [
                {
                    "fecha":     r["fecha"],
                    "cantidad":  r["cantidad"],
                    "ingresos":  int(r["ingresos"]),
                    "costo":     int(r["costo"]),
                    "beneficio": int(r["beneficio"]),
                }
                for r in cur.fetchall()
            ]

    if len(historico) < n:
        raise ValueError(
            f"Datos insuficientes para proyectar (se necesitan {n} meses, hay {len(historico)})"
        )

    metricas = ["cantidad", "ingresos", "costo", "beneficio"]

    series   = {met: [h[met] for h in historico] for met in metricas}
    base_sds = {met: std_dev([h[met] for h in historico][-n:]) for met in metricas}

    last_fecha = historico[-1]["fecha"]
    proyectado = []

    for i in range(k):
        fecha = _add_month(last_fecha)
        entry = {"fecha": fecha}

        for met in metricas:
            window = series[met][-n:]
            valor  = round(mean(window))
            error  = round(base_sds[met] * (1 + i * 0.15))

            entry[met]            = valor
            entry[f"error_{met}"] = error
            series[met]           = series[met] + [valor]

        proyectado.append(entry)
        last_fecha = fecha

    return {"historico": historico, "proyectado": proyectado}
