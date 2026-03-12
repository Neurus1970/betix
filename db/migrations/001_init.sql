-- Betix — Migración inicial
-- Crea el esquema y las tres tablas del modelo de datos.

CREATE SCHEMA IF NOT EXISTS betix;

-- ── Catálogo de provincias ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS betix.provincias (
    id     SERIAL       PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    lat    DECIMAL(9,6) NOT NULL,
    lng    DECIMAL(9,6) NOT NULL
);

-- ── Catálogo de juegos ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS betix.juegos (
    id     SERIAL      PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- ── Serie temporal de apuestas ───────────────────────────────────────────────
-- fecha: primer día del mes (ej. 2025-03-01 representa marzo 2025)
-- beneficio no se persiste: se calcula en query como ingresos - costo

CREATE TABLE IF NOT EXISTS betix.tickets_mensuales (
    id           SERIAL         PRIMARY KEY,
    provincia_id INTEGER        NOT NULL REFERENCES betix.provincias(id),
    juego_id     INTEGER        NOT NULL REFERENCES betix.juegos(id),
    fecha        DATE           NOT NULL,
    cantidad     INTEGER        NOT NULL,
    ingresos     DECIMAL(14,2)  NOT NULL,
    costo        DECIMAL(14,2)  NOT NULL,

    CONSTRAINT uq_tickets_mensuales UNIQUE (provincia_id, juego_id, fecha)
);

CREATE INDEX IF NOT EXISTS idx_tickets_prov_juego_fecha
    ON betix.tickets_mensuales (provincia_id, juego_id, fecha);

-- ── Asignación juegos↔provincias (muchos-a-muchos) ───────────────────────────
-- Registra explícitamente qué juegos están habilitados en cada provincia.

CREATE TABLE IF NOT EXISTS betix.provincias_juegos (
    provincia_id INTEGER NOT NULL REFERENCES betix.provincias(id),
    juego_id     INTEGER NOT NULL REFERENCES betix.juegos(id),

    CONSTRAINT pk_provincias_juegos PRIMARY KEY (provincia_id, juego_id)
);
