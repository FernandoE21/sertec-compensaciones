const sql = require('mssql')
const fs = require('fs')

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

async function search() {
    let output = {}
    try {
        const pool = await sql.connect(sqlConfig)
        
        // Let's check MARCACION_BASE for Jorge using wildcard
        const trakker = await pool.request()
            .query(`
                SELECT TOP 10
                    nro_marcacion, id_trabajador, fec_hra_marcacion, id_tpo_marcacion, flg_app
                FROM MARCACION_BASE
                WHERE id_trabajador LIKE '%000473%'
                ORDER BY fec_hra_marcacion DESC
            `)
        
        output.jorgeTrakker = trakker.recordset

        // Also check if any other table has '01000473' vs '010101000473'
        const checkFormat = await pool.request()
            .query(`
                SELECT TOP 5 id_trabajador FROM MARCACION_BASE WHERE id_trabajador LIKE '0100%'
            `)
        output.standardFormatSample = checkFormat.recordset

    } catch (e) {
        output.error = e.message
    } finally {
        sql.close()
        fs.writeFileSync('debug-jorge-base.json', JSON.stringify(output, null, 2))
    }
}

search()
