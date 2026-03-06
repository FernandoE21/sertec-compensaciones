// explorar-flg-app.cjs
// Verifica si las marcas móviles están en MARCACION_BASE con flg_app = 1

const sql = require('mssql');

const config = {
  user: 'USERDESK',
  password: 'GPTY2K5',
  server: 'PROMETEO\\SQL2K5',
  port: 1200,
  database: 'MARCACION',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 60000
  }
};

async function main() {
  let pool;
  try {
    pool = await sql.connect(config);
    console.log('Conectado a PROMETEO/MARCACION\n');

    // 1. Contar marcas con flg_app = 1 vs flg_app = 0
    console.log('=== 1. CONTEO flg_app EN MARCACION_BASE ===');
    const conteo = await pool.request().query(`
      SELECT 
        flg_app,
        COUNT(*) as cantidad,
        MIN(fec_hra_marcacion) as fecha_min,
        MAX(fec_hra_marcacion) as fecha_max
      FROM MARCACION_BASE 
      WHERE flg_anulado = 0
      GROUP BY flg_app
      ORDER BY flg_app
    `);
    conteo.recordset.forEach(r => {
      console.log(`  flg_app = ${r.flg_app} → ${r.cantidad} marcas (desde ${r.fecha_min} hasta ${r.fecha_max})`);
    });

    // 2. Ejemplo de marcas con flg_app = 1 (las más recientes)
    console.log('\n=== 2. ÚLTIMAS 10 MARCAS CON flg_app = 1 ===');
    const appMarks = await pool.request().query(`
      SELECT TOP 10
        id_trabajador,
        nro_marcacion,
        id_tpo_marcacion,
        fec_hra_marcacion,
        fec_jornada,
        id_marcador,
        fnc_tecla,
        flg_app,
        EST_MRK_GUARDIA
      FROM MARCACION_BASE
      WHERE flg_anulado = 0 AND flg_app = 1
      ORDER BY fec_hra_marcacion DESC
    `);
    if (appMarks.recordset.length === 0) {
      console.log('  *** NO HAY MARCAS CON flg_app = 1 ***');
    } else {
      appMarks.recordset.forEach(r => {
        console.log(`  ${r.id_trabajador} | ${r.fec_hra_marcacion} | tipo=${r.id_tpo_marcacion} | marcador=${r.id_marcador} | tecla=${r.fnc_tecla}`);
      });
    }

    // 3. Tipos de marcación que usan flg_app = 1
    console.log('\n=== 3. TIPOS DE MARCACIÓN PARA flg_app = 1 ===');
    const tiposApp = await pool.request().query(`
      SELECT 
        mb.id_tpo_marcacion,
        mt.nom_tpo_marcacion,
        COUNT(*) as cantidad
      FROM MARCACION_BASE mb
      LEFT JOIN Marcacion_Tipo mt ON mb.id_tpo_marcacion = mt.id_tpo_marcacion
      WHERE mb.flg_anulado = 0 AND mb.flg_app = 1
      GROUP BY mb.id_tpo_marcacion, mt.nom_tpo_marcacion
      ORDER BY cantidad DESC
    `);
    if (tiposApp.recordset.length === 0) {
      console.log('  (sin datos)');
    } else {
      tiposApp.recordset.forEach(r => {
        console.log(`  tipo=${r.id_tpo_marcacion} (${r.nom_tpo_marcacion}) → ${r.cantidad} marcas`);
      });
    }

    // 4. Marcadores usados para flg_app = 1
    console.log('\n=== 4. MARCADORES USADOS CON flg_app = 1 ===');
    const marcadoresApp = await pool.request().query(`
      SELECT 
        mb.id_marcador,
        m.nom_marcador,
        COUNT(*) as cantidad
      FROM MARCACION_BASE mb
      LEFT JOIN Marcador m ON mb.id_marcador = m.id_marcador
      WHERE mb.flg_anulado = 0 AND mb.flg_app = 1
      GROUP BY mb.id_marcador, m.nom_marcador
      ORDER BY cantidad DESC
    `);
    if (marcadoresApp.recordset.length === 0) {
      console.log('  (sin datos)');
    } else {
      marcadoresApp.recordset.forEach(r => {
        console.log(`  marcador=${r.id_marcador} (${r.nom_marcador}) → ${r.cantidad} marcas`);
      });
    }

    // 5. Trabajadores de CIPSA (01000xxx) con marcas app recientes
    console.log('\n=== 5. TRABAJADORES CIPSA CON MARCAS APP (últimos 6 meses) ===');
    const cipsaApp = await pool.request().query(`
      SELECT 
        id_trabajador,
        COUNT(*) as total_marcas,
        MIN(fec_hra_marcacion) as primera,
        MAX(fec_hra_marcacion) as ultima
      FROM MARCACION_BASE
      WHERE flg_anulado = 0 
        AND flg_app = 1
        AND id_trabajador LIKE '0101%'
        AND fec_hra_marcacion >= DATEADD(MONTH, -6, GETDATE())
      GROUP BY id_trabajador
      ORDER BY ultima DESC
    `);
    if (cipsaApp.recordset.length === 0) {
      console.log('  *** No hay trabajadores CIPSA con marcas app en los últimos 6 meses ***');
    } else {
      cipsaApp.recordset.forEach(r => {
        console.log(`  ${r.id_trabajador} → ${r.total_marcas} marcas (${r.primera} a ${r.ultima})`);
      });
    }

    // 6. Comparar: marcas TOTALES recientes de trabajadores CIPSA (app vs tracker)
    console.log('\n=== 6. COMPARACIÓN APP vs TRACKER - CIPSA últimos 3 meses ===');
    const comparacion = await pool.request().query(`
      SELECT 
        CASE WHEN flg_app = 1 THEN 'APP' ELSE 'TRACKER' END as origen,
        COUNT(*) as total_marcas,
        COUNT(DISTINCT id_trabajador) as trabajadores_unicos
      FROM MARCACION_BASE
      WHERE flg_anulado = 0 
        AND id_trabajador LIKE '0101%'
        AND fec_hra_marcacion >= DATEADD(MONTH, -3, GETDATE())
      GROUP BY flg_app
    `);
    comparacion.recordset.forEach(r => {
      console.log(`  ${r.origen}: ${r.total_marcas} marcas de ${r.trabajadores_unicos} trabajadores`);
    });

    // 7. Contar marcas GPS en usuario_gps para trabajadores CIPSA
    console.log('\n=== 7. MARCAS GPS (usuario_gps) con usuario 0101% ===');
    const gpsCount = await pool.request().query(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT id_usuario) as usuarios_unicos,
        MIN(fec_marca) as primera,
        MAX(fec_marca) as ultima
      FROM usuario_gps
      WHERE flg_anulado = 0
        AND id_usuario LIKE '0101%'
    `);
    const g = gpsCount.recordset[0];
    console.log(`  Total: ${g.total} marcas de ${g.usuarios_unicos} usuarios (${g.primera} a ${g.ultima})`);

    // 8. Últimas 5 marcas GPS de CIPSA
    console.log('\n=== 8. ÚLTIMAS 5 MARCAS GPS (usuario_gps) ===');
    const gpsRecent = await pool.request().query(`
      SELECT TOP 5
        id_marca,
        id_usuario,
        fec_marca,
        observacion,
        referencia,
        cliente,
        latitud,
        longitud,
        flg_teletrabajo
      FROM usuario_gps
      WHERE flg_anulado = 0 AND id_usuario LIKE '0101%'
      ORDER BY fec_marca DESC
    `);
    gpsRecent.recordset.forEach(r => {
      console.log(`  ${r.id_usuario} | ${r.fec_marca} | ${r.observacion || '(sin obs)'} | ${r.cliente || '(sin cliente)'} | ${r.referencia || ''}`);
    });

    console.log('\n✅ Exploración completada');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (pool) await pool.close();
  }
}

main();
