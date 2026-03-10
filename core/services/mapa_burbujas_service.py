from ..data.tickets_por_mes import TICKETS_POR_MES
from .geodata_service import PROVINCE_COORDS


def get_mapa_burbujas(juego=None, fecha_desde=None, fecha_hasta=None) -> dict:
    rows = TICKETS_POR_MES

    if juego:
        rows = [r for r in rows if r["juego"] == juego]
    if fecha_desde:
        rows = [r for r in rows if r["fecha"] >= fecha_desde]
    if fecha_hasta:
        rows = [r for r in rows if r["fecha"] <= fecha_hasta]

    by_prov: dict = {}
    for r in rows:
        p = r["provincia"]
        if p not in by_prov:
            by_prov[p] = {"cantidad": 0, "ingresos": 0, "costo": 0}
        by_prov[p]["cantidad"] += r["cantidad"]
        by_prov[p]["ingresos"] += r["ingresos"]
        by_prov[p]["costo"]    += r["costo"]

    provinces = []
    for prov, d in by_prov.items():
        if prov not in PROVINCE_COORDS:
            continue
        provinces.append({
            "provincia": prov,
            "lat":       PROVINCE_COORDS[prov]["lat"],
            "lng":       PROVINCE_COORDS[prov]["lng"],
            "cantidad":  d["cantidad"],
            "ingresos":  d["ingresos"],
            "beneficio": d["ingresos"] - d["costo"],
        })

    all_juegos = sorted({r["juego"] for r in TICKETS_POR_MES})
    all_fechas = sorted({r["fecha"] for r in TICKETS_POR_MES})

    return {
        "provinces": provinces,
        "juegos":    all_juegos,
        "fechas":    all_fechas,
    }
