from psycopg.rows import dict_row
from ..db import get_connection


def get_geodata() -> dict:
    with get_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("""
                SELECT
                    p.nombre                   AS provincia,
                    p.lat,
                    p.lng,
                    j.nombre                   AS juego,
                    SUM(t.cantidad)            AS cantidad,
                    SUM(t.ingresos)            AS ingresos,
                    SUM(t.costo)               AS costo,
                    SUM(t.ingresos - t.costo)  AS beneficio
                FROM betix.tickets_mensuales t
                JOIN betix.provincias p ON p.id = t.provincia_id
                JOIN betix.juegos     j ON j.id = t.juego_id
                GROUP BY p.nombre, p.lat, p.lng, j.nombre
                ORDER BY p.nombre, j.nombre
            """)
            rows = cur.fetchall()

    by_prov: dict = {}
    for r in rows:
        prov = r["provincia"]
        if prov not in by_prov:
            by_prov[prov] = {
                "lat":      float(r["lat"]),
                "lng":      float(r["lng"]),
                "cantidad": 0,
                "importe":  0,
                "costo":    0,
                "games":    [],
            }
        by_prov[prov]["cantidad"] += r["cantidad"]
        by_prov[prov]["importe"]  += int(r["ingresos"])
        by_prov[prov]["costo"]    += int(r["costo"])
        by_prov[prov]["games"].append({
            "juego":     r["juego"],
            "cantidad":  r["cantidad"],
            "importe":   int(r["ingresos"]),
            "beneficio": int(r["beneficio"]),
        })

    global_cantidad  = 0
    global_importe   = 0
    global_beneficio = 0
    provinces = []

    for prov, d in by_prov.items():
        beneficio = d["importe"] - d["costo"]
        global_cantidad  += d["cantidad"]
        global_importe   += d["importe"]
        global_beneficio += beneficio
        provinces.append({
            "provincia": prov,
            "lat":       d["lat"],
            "lng":       d["lng"],
            "totals": {
                "cantidad":  d["cantidad"],
                "importe":   d["importe"],
                "beneficio": beneficio,
            },
            "games": d["games"],
        })

    return {
        "globalTotals": {
            "cantidad":  global_cantidad,
            "importe":   global_importe,
            "beneficio": global_beneficio,
        },
        "provinces": provinces,
    }
