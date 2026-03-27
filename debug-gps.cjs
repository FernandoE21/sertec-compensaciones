// sync-marcaciones-gps.cjs
// Sincroniza marcas de la app móvil (usuario_gps) desde SQL Server → Supabase
// Solo registros con id_usuario que contenga patrón 0100XXXX (empleados CIPSA)

const sql = require('mssql');
const { createClient } = require('@supabase/supabase-js');

// ─── Configuración SQL Server (PROMETEO) ───────────────────────────
const sqlConfig = {
  user: 'USERDESK',
  password: 'GPTY2K5',
  server: '172.16.30.18',
  port: 1200,
  database: 'MARCACION',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 120000,
    connectTimeout: 30000
  }
};

// ─── Configuración Supabase ────────────────────────────────────────
const SUPABASE_URL = 'https://pwzogtzcgcxiondlcfeo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oCt_y46aZ4iTg81CTKb3YQ_tLG_K-aA';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Extraer código 0100XXXX del id_usuario ────────────────────────
function extraerCodigo(idUsuario) {
  if (!idUsuario) return null;
  const match = String(idUsuario).match(/0100\d{4}/);
  return match ? match[0] : null;
}

// ─── Sincronización principal ──────────────────────────────────────
async function syncMarcacionesGPS() {
  let pool;
  try {
    console.log('═══════════════════════════════════════════════');
    console.log('  SYNC MARCACIONES GPS → SUPABASE');
    console.log('═══════════════════════════════════════════════\n');

    // 1. Obtener códigos de empleados registrados en Supabase
    console.log('📋 Obteniendo empleados de Supabase...');
    const { data: personal, error: errPersonal } = await supabase
      .from('personal')
      .select('codigo');

    if (errPersonal) throw new Error(`Error consultando personal: ${errPersonal.message}`);

    const codigosValidos = new Set(personal.map(p => p.codigo));
    console.log(`   → ${codigosValidos.size} empleados registrados\n`);

    // 2. Conectar a SQL Server
    console.log('🔌 Conectando a PROMETEO\\SQL2K5...');
    pool = await sql.connect(sqlConfig);
    console.log('   → Conectado\n');

    // 3. Obtener último id_marca sincronizado (para sync incremental)
    const { data: ultimoSync } = await supabase
      .from('marcaciones_gps')
      .select('id_marca')
      .order('id_marca', { ascending: false })
      .limit(1)
      .single();

    const ultimoIdMarca = ultimoSync?.id_marca || 0;
    console.log(`📌 Último id_marca sincronizado: ${ultimoIdMarca}\n`);

    // 4. Consultar usuario_gps en SQL Server
    console.log('🔍 Consultando usuario_gps en SQL Server...');
    const result = await pool.request().query(`
      SELECT 
        CAST(id_marca AS VARCHAR(50)) as id_marca,
        fec_marca,
        id_usuario,
        observacion,
        cliente,
        otr_referencia,
        latitud,
        longitud
      FROM usuario_gps
      WHERE flg_anulado = 0
        AND fec_marca IS NOT NULL
        AND fec_marca >= DATEADD(day, -7, GETDATE())
      ORDER BY fec_marca DESC
    `);

    console.log(`   → ${result.recordset.length} registros nuevos encontrados\n`);

    if (result.recordset.length === 0) {
      console.log('✅ No hay registros nuevos para sincronizar.');
      return;
    }

    // 5. Filtrar y transformar registros
    console.log('🔄 Filtrando registros con código 0100XXXX...');
    const registros = [];

    for (const row of result.recordset) {
      const codigo = extraerCodigo(row.id_usuario);
      if (!codigo) continue;                      // No tiene formato 0100XXXX
      if (!codigosValidos.has(codigo)) continue;  // No está en personal de Supabase

      registros.push({
        id_marca: row.id_marca,
        codigo_trabajador: codigo,
        fecha_marca: row.fec_marca,
        observacion: row.observacion || null,
        cliente: row.cliente ? row.cliente.trim() : null,
        otr_referencia: row.otr_referencia || null,
        latitud: row.latitud || null,
        longitud: row.longitud || null,
      });
    }

    console.log(`   → ${registros.length} registros válidos para sincronizar\n`);

    if (registros.length === 0) {
      console.log('✅ Ningún registro coincide con empleados registrados.');
      return;
    }

    // 6. Upsert a Supabase en lotes de 500
    const BATCH_SIZE = 500;
    let totalInsertados = 0;
    let totalErrores = 0;

    for (let i = 0; i < registros.length; i += BATCH_SIZE) {
      const lote = registros.slice(i, i + BATCH_SIZE);
      const numLote = Math.floor(i / BATCH_SIZE) + 1;
      const totalLotes = Math.ceil(registros.length / BATCH_SIZE);

      console.log(`   📤 Enviando lote ${numLote}/${totalLotes} (${lote.length} registros)...`);

      const { data, error } = await supabase
        .from('marcaciones_gps')
        .upsert(lote, { onConflict: 'id_marca' });

      if (error) {
        console.error(`   ❌ Error en lote ${numLote}: ${error.message}`);
        totalErrores += lote.length;
      } else {
        totalInsertados += lote.length;
        console.log(`   ✅ Lote ${numLote} OK`);
      }
    }

    // 7. Resumen
    console.log('\n═══════════════════════════════════════════════');
    console.log('  RESUMEN DE SINCRONIZACIÓN');
    console.log('═══════════════════════════════════════════════');
    console.log(`  Total registros SQL Server:  ${result.recordset.length}`);
    console.log(`  Filtrados (0100XXXX):        ${registros.length}`);
    console.log(`  Insertados/Actualizados:     ${totalInsertados}`);
    console.log(`  Errores:                     ${totalErrores}`);
    console.log('═══════════════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Error fatal:', err.message);
    console.error(err.stack);
  } finally {
    if (pool) {
      await pool.close();
      console.log('🔌 Conexión SQL Server cerrada.');
    }
  }
}

syncMarcacionesGPS();
