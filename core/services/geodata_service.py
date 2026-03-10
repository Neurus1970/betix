from ..data.mock_data import TICKETS

PROVINCE_COORDS = {
    "Salta":               {"lat": -24.7859, "lng": -65.4117},
    "Santiago del Estero": {"lat": -27.7951, "lng": -64.2615},
    "Neuquén":             {"lat": -38.9516, "lng": -68.0591},
    "La Pampa":            {"lat": -36.6148, "lng": -64.2839},
    "Santa Cruz":          {"lat": -51.6230, "lng": -69.2168},
    "La Rioja":            {"lat": -29.4131, "lng": -66.8558},
    "Catamarca":           {"lat": -28.4696, "lng": -65.7852},
    "Tierra del Fuego":    {"lat": -54.8019, "lng": -68.3030},
    "Corrientes":          {"lat": -27.4806, "lng": -58.8341},
    "Río Negro":           {"lat": -40.8135, "lng": -63.0000},
}


def get_geodata() -> dict:
    by_prov: dict = {}
    for t in TICKETS:
        p = t["provincia"]
        if p not in by_prov:
            by_prov[p] = {"cantidad": 0, "importe": 0, "costo": 0, "games": []}
        by_prov[p]["cantidad"] += t["cantidad"]
        by_prov[p]["importe"]  += t["ingresos"]
        by_prov[p]["costo"]    += t["costo"]
        by_prov[p]["games"].append({
            "juego":     t["juego"],
            "cantidad":  t["cantidad"],
            "importe":   t["ingresos"],
            "beneficio": t["ingresos"] - t["costo"],
        })

    global_cantidad  = 0
    global_importe   = 0
    global_beneficio = 0
    provinces = []

    for prov, d in by_prov.items():
        if prov not in PROVINCE_COORDS:
            continue
        beneficio = d["importe"] - d["costo"]
        global_cantidad  += d["cantidad"]
        global_importe   += d["importe"]
        global_beneficio += beneficio
        provinces.append({
            "provincia": prov,
            "lat": PROVINCE_COORDS[prov]["lat"],
            "lng": PROVINCE_COORDS[prov]["lng"],
            "totals": {
                "cantidad": d["cantidad"],
                "importe":  d["importe"],
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
