const sql = require('mssql')
const { createClient } = require('@supabase/supabase-js')

const SQL_CONFIG = {
  server: 'PROMETEO',
  port: 1200,
  database: 'MARCACION',
  user: 'USERDESK',
  password: 'GPTY2K5',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  requestTimeout: 60000,
}

const SUPABASE_URL = 'https://pwzogtzcgcxiondlcfeo.supabase.co'
const SUPABASE_KEY = 'sb_publishable_oCt_y46aZ4iTg81CTKb3YQ_tLG_K-aA'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function sqlIdToSupabase(id) {
  return id ? id.trim().substring(4) : null
}

async function sincronizar() {
  var pool
  try {
    console.log('[' + new Date().toISOString() + '] Conectando a SQL Server (PROMETEO)...')
    pool = await sql.connect(SQL_CONFIG)
    console.log('✅ Conexion exitosa')

    // Extraer empleados válidos de supabase (0100XXXX)
    console.log('📋 Obteniendo empleados de Supabase...')
    const { data: personal } = await supabase.from('personal').select('codigo')
    const codigosValidos = new Set((personal || []).map(p => p.codigo))
    console.log(`   → ${codigosValidos.size} empleados registrados`)

    // Consultar marcas TRAKKER desde el 21 de enero 2026 (sin truncar o agrupar)
    // flg_app IS NULL o 0 = TRAKKER
    console.log('🔍 Consultando MARCACION_BASE (TRAKKER) últimos 7 días...')
    var res = await pool.request().query(`
      SELECT 
        nro_marcacion,
        id_trabajador,
        CONVERT(varchar, fec_hra_marcacion, 23) as fecha,
        CONVERT(varchar, fec_hra_marcacion, 108) as hora,
        id_tpo_marcacion
      FROM MARCACION_BASE
      WHERE flg_anulado = 0 
        AND (flg_app IS NULL OR flg_app = 0)
        AND fec_hra_marcacion >= DATEADD(day, -7, GETDATE())
    `)

    var registrosEncontrados = res.recordset.length
    console.log(`📡 ${registrosEncontrados} marcas TRAKKER encontradas.`)

    var registrosListos = []
    
    for (var i = 0; i < registrosEncontrados; i++) {
        var row = res.recordset[i]
        var codigo = sqlIdToSupabase(row.id_trabajador)
        if (!codigo || !codigosValidos.has(codigo)) continue
        
        registrosListos.push({
            nro_marcacion: row.nro_marcacion,
            codigo_trabajador: codigo,
            fecha: row.fecha,
            hora: row.hora,
            tipo: 'TRAKKER',
            id_tpo_marcacion: row.id_tpo_marcacion
        })
    }

    console.log(`🚀 ${registrosListos.length} marcas válidas para procesar.`)

    // Upsert a Supabase en lotes
    var subidos = 0, errores = 0
    var BATCH = 500
    for (var i = 0; i < registrosListos.length; i += BATCH) {
      var lote = registrosListos.slice(i, i + BATCH)
      var resSup = await supabase.from('marcaciones_individuales').upsert(lote, { onConflict: 'nro_marcacion' })
      if (resSup.error) {
        console.error('❌ Error lote:', resSup.error.message)
        errores += lote.length
      } else {
        subidos += lote.length
      }
    }

    console.log('✅ Completado: ' + subidos + ' subidas/actualizadas, ' + errores + ' errores')
  } catch (err) {
    console.error('❌ Error fatal:', err.message)
  } finally {
    if (pool) await pool.close()
  }
}

sincronizar()
