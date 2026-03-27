const { createClient } = require('@supabase/supabase-js')
const sql = require('mssql')

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

async function testFinal() {
    console.log("PROBANDO NUEVA LÓGICA DE MAPEO PARA JORGE AMAYA...");
    try {
        const pool = await sql.connect(sqlConfig)
        const result = await pool.request().query(`
          SELECT 
            g.id_usuario,
            COALESCE(u.id_trabajador, g.id_usuario) as worker_id_source
          FROM usuario_gps g
          LEFT JOIN Usuario u ON g.id_usuario = u.id_usuario
          WHERE g.id_usuario = '0101JAMAYA'
        `);

        if (result.recordset.length > 0) {
            const row = result.recordset[0];
            const rawId = row.worker_id_source;
            const finalCode = rawId.length >= 8 ? rawId.slice(-8) : rawId;
            console.log(`ID Original: ${row.id_usuario}`);
            console.log(`ID Mapeado (Source): ${rawId}`);
            console.log(`Código Final (slice -8): ${finalCode}`);

            // Verificar si está en Supabase
            const { data } = await supabase.from('personal').select('codigo').eq('codigo', finalCode);
            if (data && data.length > 0) {
                console.log("✅ EL CÓDIGO EXISTE EN SUPABASE. LA SINCRONIZACIÓN SERÁ EXITOSA.");
            } else {
                console.log("❌ EL CÓDIGO NO EXISTE EN SUPABASE.");
            }
        } else {
            console.log("No se encontraron registros de JAMAYA en SQL para la prueba.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        sql.close();
    }
}

testFinal();
