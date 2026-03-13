#!/bin/sh
# Carga (o recarga) todos los datos en la base de datos Betix.
#
# Uso:
#   BETIX_DB_URL=postgresql://user:pass@host:port/db ./db/load_data.sh
#
# El script:
#   1. Ejecuta las migraciones (idempotente — usa IF NOT EXISTS)
#   2. Trunca todas las tablas del esquema betix
#   3. Carga los datos desde los archivos CSV de db/seeds/
#
# Requiere: psql (cliente PostgreSQL) en el PATH y la variable BETIX_DB_URL definida.

set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MIGRATIONS_DIR="${SCRIPT_DIR}/migrations"
SEEDS_DIR="${SCRIPT_DIR}/seeds"

if [ -z "${BETIX_DB_URL:-}" ]; then
    echo "ERROR: la variable BETIX_DB_URL no está definida." >&2
    echo "Uso: BETIX_DB_URL=postgresql://user:pass@host:port/db $0" >&2
    exit 1
fi

echo "==> Ejecutando migraciones..."
psql "${BETIX_DB_URL}" -f "${MIGRATIONS_DIR}/001_init.sql"

echo "==> Truncando tablas..."
psql "${BETIX_DB_URL}" <<SQL
TRUNCATE betix.provincias_juegos, betix.tickets_mensuales, betix.provincias, betix.juegos RESTART IDENTITY CASCADE;
SQL

echo "==> Cargando provincias..."
psql "${BETIX_DB_URL}" <<SQL
\copy betix.provincias(nombre, lat, lng) FROM '${SEEDS_DIR}/_provincias.csv' CSV HEADER;
SQL

echo "==> Cargando juegos..."
psql "${BETIX_DB_URL}" <<SQL
\copy betix.juegos(nombre) FROM '${SEEDS_DIR}/_juegos.csv' CSV HEADER;
SQL

echo "==> Cargando tickets_mensuales..."
psql "${BETIX_DB_URL}" <<SQL
CREATE TEMP TABLE tmp_tickets (
    provincia_nombre VARCHAR(100),
    juego_nombre     VARCHAR(50),
    fecha            DATE,
    cantidad         INTEGER,
    ingresos         DECIMAL(14,2),
    costo            DECIMAL(14,2)
);

\copy tmp_tickets FROM '${SEEDS_DIR}/_tickets_mensuales.csv' CSV HEADER;

INSERT INTO betix.tickets_mensuales (provincia_id, juego_id, fecha, cantidad, ingresos, costo)
SELECT p.id, j.id, t.fecha, t.cantidad, t.ingresos, t.costo
FROM   tmp_tickets t
JOIN   betix.provincias p ON p.nombre = t.provincia_nombre
JOIN   betix.juegos     j ON j.nombre = t.juego_nombre;

DROP TABLE tmp_tickets;
SQL

echo "==> Cargando provincias_juegos..."
psql "${BETIX_DB_URL}" <<SQL
INSERT INTO betix.provincias_juegos (provincia_id, juego_id)
SELECT DISTINCT t.provincia_id, t.juego_id
FROM   betix.tickets_mensuales t;
SQL

echo "==> Carga completada."
psql "${BETIX_DB_URL}" -c "
SELECT
    (SELECT COUNT(*) FROM betix.provincias)         AS provincias,
    (SELECT COUNT(*) FROM betix.juegos)             AS juegos,
    (SELECT COUNT(*) FROM betix.tickets_mensuales)  AS tickets_mensuales,
    (SELECT COUNT(*) FROM betix.provincias_juegos)  AS provincias_juegos;
"
