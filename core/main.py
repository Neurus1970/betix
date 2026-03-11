import os
from flask import Flask, jsonify, request
from .services.geodata_service import get_geodata
from .services.proyecciones_service import calcular_proyecciones, get_provincias, get_juegos
from .services.health_service import check_data_access

app = Flask(__name__)


@app.get("/health")
def health():
    try:
        check_data_access()
        return jsonify({"status": "healthy"})
    except RuntimeError as e:
        return jsonify({"status": "unhealthy", "message": str(e)}), 500


@app.get("/geodata")
def geodata():
    return jsonify({"status": "ok", "data": get_geodata()})


@app.get("/proyectado")
def proyectado():
    provincias = get_provincias()
    juegos     = get_juegos()

    provincia = request.args.get("provincia") or provincias[0]
    juego     = request.args.get("juego")     or juegos[0]
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
