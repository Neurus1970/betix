import os
from datetime import datetime
from flask import Flask, jsonify, request
from .services.geodata_service import get_geodata
from .services.proyecciones_service import calcular_proyecciones, get_provincias, get_juegos
from .services.health_service import check_data_access

app = Flask(__name__)


@app.get("/healthz")
def health():
    try:
        check_data_access()
        return jsonify({
            "status": "healthy",
            "component": "betix-core",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "dependencies": {
                "postgresql": {"status": "healthy"},
            },
        })
    except RuntimeError as e:
        pg_dep = {"status": "unhealthy", "error": str(e)}
        pgcode = getattr(e, "pgcode", None)
        if pgcode:
            pg_dep["pgcode"] = pgcode
        return jsonify({
            "status": "unhealthy",
            "component": "betix-core",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "dependencies": {
                "postgresql": pg_dep,
            },
        }), 503


@app.get("/geodata")
def geodata():
    return jsonify({"status": "ok", "data": get_geodata()})


@app.get("/proyectado")
def proyectado():
    provincias = get_provincias()
    juegos     = get_juegos()

    provincia_param = request.args.get("provincia")
    juego_param     = request.args.get("juego")

    # All-data mode: sin filtros → devuelve todas las combinaciones provincia/juego.
    # El primer llamado (cache MISS) usa este modo; Node.js filtra en memoria en HIT.
    if not provincia_param and not juego_param:
        todos = []
        for prov in provincias:
            for juego in juegos:
                try:
                    result = calcular_proyecciones(provincia=prov, juego=juego, k=6)
                    todos.append({"provincia": prov, "juego": juego, **result})
                except ValueError:
                    pass
        return jsonify({
            "status": "ok",
            "data": {
                "todos":      todos,
                "provincias": provincias,
                "juegos":     juegos,
            },
        })

    # Filtered mode: con provincia y/o juego → respuesta individual (retrocompatible)
    provincia = provincia_param or provincias[0]
    juego     = juego_param     or juegos[0]
    k         = min(6, max(1, int(request.args.get("meses", 1) or 1)))

    try:
        result = calcular_proyecciones(provincia=provincia, juego=juego, k=k)
        return jsonify({
            "status": "ok",
            "data": {
                **result,
                "provincias": provincias,
                "juegos":     juegos,
                "provincia":  provincia,
                "juego":      juego,
                "meses":      k,
            },
        })
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e)}), 400


if __name__ == "__main__":
    port = int(os.environ.get("CORE_PORT", 5000))
    app.run(host="0.0.0.0", port=port)
