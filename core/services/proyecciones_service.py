import math
from ..data.tickets_por_mes import TICKETS_POR_MES

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
    return sorted({t["provincia"] for t in TICKETS_POR_MES})


def get_juegos() -> list:
    return sorted({t["juego"] for t in TICKETS_POR_MES})


def calcular_proyecciones(provincia: str, juego: str, k: int, n: int = SMA_WINDOW) -> dict:
    historico = sorted(
        [
            {**t, "beneficio": t["ingresos"] - t["costo"]}
            for t in TICKETS_POR_MES
            if t["provincia"] == provincia and t["juego"] == juego
        ],
        key=lambda x: x["fecha"],
    )

    if len(historico) < n:
        raise ValueError(
            f"Datos insuficientes para proyectar (se necesitan {n} meses, hay {len(historico)})"
        )

    metricas = ["cantidad", "ingresos", "costo", "beneficio"]

    # Series de trabajo para rolling SMA (se extienden con cada proyectado)
    series = {met: [h[met] for h in historico] for met in metricas}

    # SD base calculada sobre el histórico (últimos n meses): garantiza crecimiento monotónico del error
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

            entry[met]             = valor
            entry[f"error_{met}"]  = error
            series[met]            = series[met] + [valor]

        proyectado.append(entry)
        last_fecha = fecha

    return {"historico": historico, "proyectado": proyectado}
