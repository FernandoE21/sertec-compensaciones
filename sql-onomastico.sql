-- ============================================
-- MIGRACIÓN: Agregar fecha_nacimiento y fecha_ingreso a personal
-- Ejecutar en Supabase SQL Editor
-- Fecha: 25-Feb-2026 (v2 - reglas actualizadas)
-- ============================================

-- 1. Agregar columnas
ALTER TABLE personal ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
ALTER TABLE personal ADD COLUMN IF NOT EXISTS fecha_ingreso DATE;

-- 2. Cargar datos desde CSV LISTA DE PERSONAL
-- Formato: UPDATE personal SET fecha_nacimiento = 'YYYY-MM-DD', fecha_ingreso = 'YYYY-MM-DD' WHERE codigo = 'XXXXX';

UPDATE personal SET fecha_nacimiento = '1993-02-19', fecha_ingreso = '2018-01-05' WHERE codigo = '01001360';
UPDATE personal SET fecha_nacimiento = '1995-05-23', fecha_ingreso = '2020-02-17' WHERE codigo = '01001577';
UPDATE personal SET fecha_nacimiento = '1981-11-07', fecha_ingreso = '2013-05-13' WHERE codigo = '01000832';
UPDATE personal SET fecha_nacimiento = '1992-02-10', fecha_ingreso = '2020-02-17' WHERE codigo = '01001578';
UPDATE personal SET fecha_nacimiento = '1998-02-05', fecha_ingreso = '2022-03-01' WHERE codigo = '01001741';
UPDATE personal SET fecha_nacimiento = '1983-07-27', fecha_ingreso = '2014-01-17' WHERE codigo = '01000902';
UPDATE personal SET fecha_nacimiento = '1995-07-01', fecha_ingreso = '2022-07-05' WHERE codigo = '01001784';
UPDATE personal SET fecha_nacimiento = '1973-01-27', fecha_ingreso = '2002-10-14' WHERE codigo = '01000225';
UPDATE personal SET fecha_nacimiento = '1975-05-03', fecha_ingreso = '2009-03-20' WHERE codigo = '01000394';
UPDATE personal SET fecha_nacimiento = '2002-11-30', fecha_ingreso = '2023-12-20' WHERE codigo = '01002020';
UPDATE personal SET fecha_nacimiento = '1999-11-03', fecha_ingreso = '2025-06-17' WHERE codigo = '01002324';
UPDATE personal SET fecha_nacimiento = '1997-10-17', fecha_ingreso = '2020-01-16' WHERE codigo = '01001559';
UPDATE personal SET fecha_nacimiento = '2005-06-28', fecha_ingreso = '2026-02-04' WHERE codigo = '01002457';
UPDATE personal SET fecha_nacimiento = '1997-10-30', fecha_ingreso = '2021-01-11' WHERE codigo = '01001779';
UPDATE personal SET fecha_nacimiento = '2003-06-10', fecha_ingreso = '2024-10-15' WHERE codigo = '01002195';
UPDATE personal SET fecha_nacimiento = '1995-12-21', fecha_ingreso = '2025-07-16' WHERE codigo = '01002336';
UPDATE personal SET fecha_nacimiento = '1997-02-13', fecha_ingreso = '2020-01-23' WHERE codigo = '01001562';
UPDATE personal SET fecha_nacimiento = '1999-08-08', fecha_ingreso = '2022-03-21' WHERE codigo = '01001747';
UPDATE personal SET fecha_nacimiento = '1997-06-17', fecha_ingreso = '2021-10-01' WHERE codigo = '01001679';
UPDATE personal SET fecha_nacimiento = '1992-06-22', fecha_ingreso = '2014-04-11' WHERE codigo = '01000946';
UPDATE personal SET fecha_nacimiento = '1999-11-15', fecha_ingreso = '2022-03-22' WHERE codigo = '01001748';
UPDATE personal SET fecha_nacimiento = '2000-06-08', fecha_ingreso = '2022-11-15' WHERE codigo = '01001826';
UPDATE personal SET fecha_nacimiento = '1998-11-05', fecha_ingreso = '2026-02-02' WHERE codigo = '01002452';
UPDATE personal SET fecha_nacimiento = '1991-10-20', fecha_ingreso = '2015-03-06' WHERE codigo = '01001059';
UPDATE personal SET fecha_nacimiento = '2003-01-01', fecha_ingreso = '2024-08-23' WHERE codigo = '01002163';
UPDATE personal SET fecha_nacimiento = '2000-05-23', fecha_ingreso = '2024-08-09' WHERE codigo = '01002158';
UPDATE personal SET fecha_nacimiento = '2003-06-09', fecha_ingreso = '2023-10-01' WHERE codigo = '01001968';
UPDATE personal SET fecha_nacimiento = '2002-02-05', fecha_ingreso = '2024-03-07' WHERE codigo = '01002084';
UPDATE personal SET fecha_nacimiento = '2005-02-03', fecha_ingreso = '2025-07-16' WHERE codigo = '01002335';
UPDATE personal SET fecha_nacimiento = '1976-08-10', fecha_ingreso = '2011-08-22' WHERE codigo = '01000888';
UPDATE personal SET fecha_nacimiento = '1974-07-09', fecha_ingreso = '2013-07-18' WHERE codigo = '01000848';
UPDATE personal SET fecha_nacimiento = '1984-10-10', fecha_ingreso = '2014-09-26' WHERE codigo = '01001007';
UPDATE personal SET fecha_nacimiento = '1973-05-11', fecha_ingreso = '2004-03-01' WHERE codigo = '01000299';
UPDATE personal SET fecha_nacimiento = '1982-05-18', fecha_ingreso = '2010-02-01' WHERE codigo = '01000473';
UPDATE personal SET fecha_nacimiento = '2000-08-21', fecha_ingreso = '2024-01-16' WHERE codigo = '01002044';
UPDATE personal SET fecha_nacimiento = '2003-03-28', fecha_ingreso = '2024-07-26' WHERE codigo = '01002151';
UPDATE personal SET fecha_nacimiento = '2005-07-01', fecha_ingreso = '2026-02-02' WHERE codigo = '30000018';
UPDATE personal SET fecha_nacimiento = '1999-02-02', fecha_ingreso = '2023-01-23' WHERE codigo = '01001868';
UPDATE personal SET fecha_nacimiento = '1980-12-19', fecha_ingreso = '2012-08-01' WHERE codigo = '01000736';
UPDATE personal SET fecha_nacimiento = '1998-04-09', fecha_ingreso = '2024-02-26' WHERE codigo = '01002079';
UPDATE personal SET fecha_nacimiento = '1975-01-13', fecha_ingreso = '2015-08-04' WHERE codigo = '01001092';
UPDATE personal SET fecha_nacimiento = '2001-05-08', fecha_ingreso = '2025-06-17' WHERE codigo = '01002321';
UPDATE personal SET fecha_nacimiento = '1986-10-26', fecha_ingreso = '2014-04-11' WHERE codigo = '01000947';
UPDATE personal SET fecha_nacimiento = '2005-06-18', fecha_ingreso = '2026-02-02' WHERE codigo = '01002451';
UPDATE personal SET fecha_nacimiento = '1987-08-17', fecha_ingreso = '2014-05-05' WHERE codigo = '01000954';
UPDATE personal SET fecha_nacimiento = '2000-06-08', fecha_ingreso = '2024-02-26' WHERE codigo = '01002080';
UPDATE personal SET fecha_nacimiento = '1997-11-26', fecha_ingreso = '2025-09-01' WHERE codigo = '01002346';
UPDATE personal SET fecha_nacimiento = '2004-09-21', fecha_ingreso = '2024-10-01' WHERE codigo = '01002389';
UPDATE personal SET fecha_nacimiento = '1981-06-30', fecha_ingreso = '2013-04-24' WHERE codigo = '01000831';
UPDATE personal SET fecha_nacimiento = '1998-03-25', fecha_ingreso = '2022-06-21' WHERE codigo = '01001781';
UPDATE personal SET fecha_nacimiento = '1990-11-26', fecha_ingreso = '2013-04-22' WHERE codigo = '01000830';
UPDATE personal SET fecha_nacimiento = '1994-05-23', fecha_ingreso = '2021-08-19' WHERE codigo = '01001671';
UPDATE personal SET fecha_nacimiento = '1991-02-15', fecha_ingreso = '2016-10-18' WHERE codigo = '01001223';
UPDATE personal SET fecha_nacimiento = '1977-06-15', fecha_ingreso = '2005-03-01' WHERE codigo = '01000314';
UPDATE personal SET fecha_nacimiento = '2003-03-08', fecha_ingreso = '2024-06-19' WHERE codigo = '01002133';
UPDATE personal SET fecha_nacimiento = '1999-11-28', fecha_ingreso = '2023-09-07' WHERE codigo = '01001946';
UPDATE personal SET fecha_nacimiento = '1992-06-29', fecha_ingreso = '2019-03-12' WHERE codigo = '01001491';
UPDATE personal SET fecha_nacimiento = '2003-10-24', fecha_ingreso = '2025-07-07' WHERE codigo = '01002329';
UPDATE personal SET fecha_nacimiento = '2003-04-05', fecha_ingreso = '2025-07-14' WHERE codigo = '01002332';
UPDATE personal SET fecha_nacimiento = '1996-12-22', fecha_ingreso = '2018-06-04' WHERE codigo = '01001400';
UPDATE personal SET fecha_nacimiento = '1986-12-26', fecha_ingreso = '2013-03-04' WHERE codigo = '01000822';
UPDATE personal SET fecha_nacimiento = '1994-12-04', fecha_ingreso = '2018-10-10' WHERE codigo = '01001423';
UPDATE personal SET fecha_nacimiento = '2004-09-07', fecha_ingreso = '2025-06-02' WHERE codigo = '08000470';
UPDATE personal SET fecha_nacimiento = '2005-11-15', fecha_ingreso = '2025-09-01' WHERE codigo = '08000479';

-- 3. Crear tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS configuracion (
  id SERIAL PRIMARY KEY,
  clave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Insertar fecha de corte de onomástico
INSERT INTO configuracion (clave, valor, descripcion) 
VALUES ('onomastico_fecha_corte', '2024-11-30', 'Fecha máxima de ingreso para ser elegible al beneficio de onomástico')
ON CONFLICT (clave) DO NOTHING;

-- 5. RLS para configuracion: lectura pública, escritura para todos (admin controla desde frontend)
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura pública configuracion" ON configuracion FOR SELECT USING (true);
CREATE POLICY "Escritura configuracion" ON configuracion FOR ALL USING (true);

-- 6. Verificar resultado
SELECT codigo, nombres, apellidos, fecha_nacimiento, fecha_ingreso,
  CASE WHEN fecha_ingreso <= '2024-11-30' THEN 'ELEGIBLE' ELSE 'NO ELEGIBLE' END as onomastico_status
FROM personal 
WHERE fecha_nacimiento IS NOT NULL 
ORDER BY codigo;

SELECT * FROM configuracion;
