const { createClient } = require('@supabase/supabase-js')
const sql = require('mssql')
const fs = require('fs')

const SUPABASE_URL = 'https://pwzogtzcgcxiondlcfeo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oCt_y46aZ4iTg81CTKb3YQ_tLG_K-aA';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sqlConfig = {
  user: 'USERDESK',
  password: 'GPTY2K5',
  server: '172.16.30.18',
  port: 1200,
  database: 'MARCACION',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function debugUsuario(codigo) {
    let output = {}
    try {
        const pool = await sql.connect(sqlConfig)
        
        const resultGPS = await pool.request()
            .query(`
                SELECT TOP 10
                    id_marca, id_usuario, fec_marca, latitud, longitud
                FROM usuario_gps
                WHERE id_usuario LIKE '%${codigo}%'
                ORDER BY fec_marca DESC
            `)
        
        output.sqlUsuarioGPS = resultGPS.recordset

        const resultTrakker = await pool.request()
            .query(`
                SELECT TOP 10
                    nro_marcacion, id_trabajador, fec_hra_marcacion, id_tpo_marcacion, flg_app
                FROM MARCACION_BASE
                WHERE id_trabajador = '${codigo}'
                ORDER BY fec_hra_marcacion DESC
            `)
        output.sqlTrakker = resultTrakker.recordset

        const { data: gpsData, error: gpsError } = await supabase
            .from('marcaciones_gps')
            .select('codigo_trabajador, fecha_marca, latitud, longitud, observacion')
            .eq('codigo_trabajador', codigo)
            .order('fecha_marca', { ascending: false })
            .limit(10)

        output.supaGpsError = gpsError
        output.supaGpsData = gpsData
        
        const { data: indData, error: indError } = await supabase
            .from('marcaciones_individuales')
            .select('codigo_trabajador, fecha, hora, tipo')
            .eq('codigo_trabajador', codigo)
            .eq('tipo', 'APP')
            .order('fecha', { ascending: false })
            .order('hora', { ascending: false })
            .limit(10)

        output.supaIndError = indError
        output.supaIndData = indData

    } catch (e) {
        output.error = e.message
    } finally {
        sql.close()
        fs.writeFileSync('debug-01000473.json', JSON.stringify(output, null, 2))
    }
}

debugUsuario("01000473")
