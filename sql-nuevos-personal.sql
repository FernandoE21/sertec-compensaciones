-- ============================================
-- INSERTAR NUEVOS EMPLEADOS EN TABLA PERSONAL
-- Total: 29 empleados nuevos (no existentes en tabla)
-- Fuente: LISTA DE PERSONAL.csv
-- Fecha: 25-Feb-2026
-- ============================================
-- Usa WHERE NOT EXISTS para evitar duplicados por código.
-- Ejecutar en Supabase SQL Editor.

-- =====================
-- LÍNEA CIL
-- =====================

-- #9 - VARGAS MARTINEZ DANIEL MISAEL
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01000394', 'VARGAS MARTINEZ', 'DANIEL MISAEL', 'TÉCNICO ELECTRÓNICO', 'CIPSA - TECNICO', 'CIL', '10198426', '1975-05-03'::date, '2009-03-20'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01000394');

-- #13 - MALDONADO TORRES WILLIAM ALONSO
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01002457', 'MALDONADO TORRES', 'WILLIAM ALONSO', 'TÉCNICO ELECTRÓNICO', 'CIPSA - TECNICO', 'CIL', '72391354', '2005-06-28'::date, '2026-02-04'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01002457');

-- =====================
-- PPL LINDLEY
-- =====================

-- #14 - FLORES BARRERA SEBASTIAN NICOLAS
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01001779', 'FLORES BARRERA', 'SEBASTIAN NICOLAS', 'TÉCNICO ELECTRÓNICO', 'CONTRATO LINDLEY PUCUSANA', 'PPL LINDLEY', '76254020', '1997-10-30'::date, '2021-01-11'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01001779');

-- #15 - ZUÑIGA COLONIO JORGE JUNIOR
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01002195', 'ZUÑIGA COLONIO', 'JORGE JUNIOR', 'TÉCNICO ELECTRÓNICO', 'CONTRATO LINDLEY PUCUSANA', 'PPL LINDLEY', '74446219', '2003-06-10'::date, '2024-10-15'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01002195');

-- #16 - RAMOS ORDOÑEZ ANIVAL ANDULY
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01002336', 'RAMOS ORDOÑEZ', 'ANIVAL ANDULY', 'TÉCNICO ELECTRÓNICO', 'CONTRATO LINDLEY PUCUSANA', 'PPL LINDLEY', '74467324', '1995-12-21'::date, '2025-07-16'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01002336');

-- =====================
-- INSPECCIÓN
-- =====================

-- #23 - GARCIA CUEVA JEFREEY ABBIT
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01002452', 'GARCIA CUEVA', 'JEFREEY ABBIT', 'TÉCNICO ELECTRÓNICO', 'CIPSA - TECNICO', 'INSPECCION', '71965560', '1998-11-05'::date, '2026-02-02'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01002452');

-- =====================
-- NESTLE
-- =====================

-- #25 - HINOSTROZA ROMERO MERLIN
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01002163', 'HINOSTROZA ROMERO', 'MERLIN', 'TÉCNICO ELECTRÓNICO', 'CONTRATO NESTLE', 'NESTLE', '71723432', '2003-01-01'::date, '2024-08-23'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01002163');

-- #26 - SALAS VIZCARRA ANDY JAIR
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01002158', 'SALAS VIZCARRA', 'ANDY JAIR', 'TÉCNICO ELECTRÓNICO', 'CONTRATO NESTLE', 'NESTLE', '76259762', '2000-05-23'::date, '2024-08-09'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01002158');

-- #27 - ALDANA CAJAHUANCA DIEGO ARMANDO
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01001968', 'ALDANA CAJAHUANCA', 'DIEGO ARMANDO', 'TÉCNICO ELECTRÓNICO', 'CONTRATO NESTLE', 'NESTLE', '71988650', '2003-06-09'::date, '2023-10-01'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01001968');

-- #28 - SUCASAIRE FLORES CRISTIAN ANDRES
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01002084', 'SUCASAIRE FLORES', 'CRISTIAN ANDRES', 'TÉCNICO ELECTRÓNICO', 'CONTRATO NESTLE', 'NESTLE', '77617199', '2002-02-05'::date, '2024-03-07'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01002084');

-- #29 - SUCASACA MACHACA THAYLOR BONNET
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01002335', 'SUCASACA MACHACA', 'THAYLOR BONNET', 'TÉCNICO ELECTRÓNICO', 'CONTRATO NESTLE', 'NESTLE', '75902746', '2005-02-03'::date, '2025-07-16'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01002335');

-- =====================
-- CAD
-- =====================

-- #37 - FIERRO POMABRUCE JESULY
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '30000018', 'FIERRO POMABRUCE', 'JESULY', 'TÉCNICO ELECTRÓNICO', 'CIPSA - TECNICO', 'CAD', '72049136', '2005-07-01'::date, '2026-02-02'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '30000018');

-- =====================
-- CPEI
-- =====================

-- #42 - ALVARADO MENDOZA JHOSMAR ANTONI
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01002321', 'ALVARADO MENDOZA', 'JHOSMAR ANTONI', 'TÉCNICO ELECTRÓNICO', 'CIPSA - TECNICO', 'CPEI', '78376242', '2001-05-08'::date, '2025-06-17'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01002321');

-- #44 - VELASQUEZ ARIAS WALTER PAOLO
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01002451', 'VELASQUEZ ARIAS', 'WALTER PAOLO', 'TÉCNICO ELECTRÓNICO', 'CIPSA - TECNICO', 'CPEI', '75477626', '2005-06-18'::date, '2026-02-02'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01002451');

-- =====================
-- ÁREA ADMINISTRATIVA
-- =====================

-- #50 - AIRA RETUERTO ROSSMERY JANET
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01001781', 'AIRA RETUERTO', 'ROSSMERY JANET', 'ASISTENTE ADMNISTRATIVO LÍNEA CPEI', 'CIPSA - ADM', 'CIL', '70650570', '1998-03-25'::date, '2022-06-21'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01001781');

-- #51 - ALVARADO PINEDO WENDY LLANET
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01000830', 'ALVARADO PINEDO', 'WENDY LLANET', 'COORDINADOR DE SERVICIOS', 'CIPSA - ADM', 'SERTEC', '72168824', '1990-11-26'::date, '2013-04-22'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01000830');

-- #52 - FLORES CARTAGENA LAURA CRISTINA
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01001671', 'FLORES CARTAGENA', 'LAURA CRISTINA', 'ASISTENTE ADMNISTRATIVO LÍNEA CIL', 'CIPSA - ADM', 'CPEI', '73684381', '1994-05-23'::date, '2021-08-19'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01001671');

-- #53 - MACEDO CABRERA DIANA CAROL
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01001223', 'MACEDO CABRERA', 'DIANA CAROL', 'ASISTENTE DE RUTA TECNICA 2', 'CIPSA - ADM', 'SERTEC', '47086689', '1991-02-15'::date, '2016-10-18'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01001223');

-- #54 - MALLQUI CASTILLO BETTY MARLENE
-- NOTA: En LISTA aparece como "MALLQUI MALLQUI CASTILLO BETTY MARLENE"
-- Se interpretó como apellidos = MALLQUI CASTILLO, nombres = BETTY MARLENE
-- Si es incorrecto, editar desde el panel admin
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01000314', 'MALLQUI CASTILLO', 'BETTY MARLENE', 'SUPERVISOR DE LÍNEA', 'CIPSA - ADM', 'SERTEC', '32661841', '1977-06-15'::date, '2005-03-01'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01000314');

-- #55 - OLMOS BRAVO MARIA ALEJANDRA
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01002133', 'OLMOS BRAVO', 'MARIA ALEJANDRA', 'ASISTENTE ADMNISTRATIVO LÍNEA CAD', 'CIPSA - ADM', 'CAD', '76311802', '2003-03-08'::date, '2024-06-19'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01002133');

-- #56 - QUISPE TORRES ARACELY VANESSA
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01001946', 'QUISPE TORRES', 'ARACELY VANESSA', 'ASISTENTE ADMNISTRATIVO LÍNEA INSPECCION', 'CIPSA - ADM', 'INSPECCION', '76440048', '1999-11-28'::date, '2023-09-07'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01001946');

-- #57 - ROJAS RUBIO ALAN BRIEN
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01001491', 'ROJAS RUBIO', 'ALAN BRIEN', 'ASISTENTE DE RUTA TECNICA 1', 'CIPSA - ADM', 'SERTEC', '72664941', '1992-06-29'::date, '2019-03-12'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01001491');

-- #58 - CASAS CISNEROS ASTRID YESMIN
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01002329', 'CASAS CISNEROS', 'ASTRID YESMIN', 'ASISTENTE ADMINISTRATIVO', 'CIPSA - ADM', 'SERTEC', '74375405', '2003-10-24'::date, '2025-07-07'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01002329');

-- #59 - DELGADO ALBITRES ARACELY ZARAI
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01002332', 'DELGADO ALBITRES', 'ARACELY ZARAI', 'ASISTENTE ADMINISTRATIVO', 'CIPSA - ADM', 'SERTEC', '74442606', '2003-04-05'::date, '2025-07-14'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01002332');

-- #60 - ROSAS SAJAMI ISABEL MELISSA
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01001400', 'ROSAS SAJAMI', 'ISABEL MELISSA', 'ASISTENTE ADMNISTRATIVO DE CONTRATO', 'CIPSA - ADM', 'SERTEC', '74708995', '1996-12-22'::date, '2018-06-04'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01001400');

-- #61 - VILCHEZ SOLIMANO LUIS
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01000822', 'VILCHEZ SOLIMANO', 'LUIS', 'JEFE DE SERVICIO TECNICO', 'CIPSA - ADM', 'SERTEC', '43937360', '1986-12-26'::date, '2013-03-04'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01000822');

-- #62 - CRISTOBAL OSORIO THALIA JHOSELYN
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '01001423', 'CRISTOBAL OSORIO', 'THALIA JHOSELYN', 'ASISTENTE ADMNISTRATIVO LÍNEA INSPECCION', 'CIPSA - ADM', 'INSPECCION', '76927074', '1994-12-04'::date, '2018-10-10'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '01001423');

-- #63 - SAAVEDRA GUERRA ANDREA JANINA
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '08000470', 'SAAVEDRA GUERRA', 'ANDREA JANINA', 'TRAINEE PROFESIONAL', 'CIPSA - ADM', 'SERTEC', '72213172', '2004-09-07'::date, '2025-06-02'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '08000470');

-- #64 - BERNAOLA SILVA CAMILA YAMILE
INSERT INTO personal (codigo, apellidos, nombres, cargo, area, seccion, dni, fecha_nacimiento, fecha_ingreso)
SELECT '08000479', 'BERNAOLA SILVA', 'CAMILA YAMILE', 'PRACTICANTE', 'CIPSA - ADM', 'SERTEC', '71337612', '2005-11-15'::date, '2025-09-01'::date
WHERE NOT EXISTS (SELECT 1 FROM personal WHERE codigo = '08000479');

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT COUNT(*) as total_personal FROM personal;

SELECT codigo, apellidos, nombres, cargo, seccion, area, fecha_ingreso
FROM personal 
ORDER BY codigo;
