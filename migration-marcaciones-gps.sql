-- =====================================================
-- TABLA: marcaciones_gps
-- Almacena las marcas de la app móvil (usuario_gps)
-- Solo registros de empleados con código 0100XXXX
-- =====================================================

CREATE TABLE IF NOT EXISTS marcaciones_gps (
  id BIGSERIAL PRIMARY KEY,
  id_marca BIGINT UNIQUE NOT NULL,          -- ID único de la marca en SQL Server
  codigo_trabajador VARCHAR(10) NOT NULL,    -- Código 0100XXXX del trabajador
  fecha_marca TIMESTAMPTZ NOT NULL,          -- Fecha y hora de la marca (fec_marca)
  observacion TEXT,                          -- Observación (ENTRADA, SALIDA, etc.)
  cliente TEXT,                              -- Nombre del cliente asignado
  otr_referencia TEXT,                       -- Referencia adicional (OT, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX idx_marcaciones_gps_codigo ON marcaciones_gps(codigo_trabajador);
CREATE INDEX idx_marcaciones_gps_fecha ON marcaciones_gps(fecha_marca);
CREATE INDEX idx_marcaciones_gps_codigo_fecha ON marcaciones_gps(codigo_trabajador, fecha_marca);

-- =====================================================
-- EJECUTAR ESTE SQL EN EL EDITOR SQL DE SUPABASE
-- Dashboard → SQL Editor → New Query → Pegar y Run
-- =====================================================
