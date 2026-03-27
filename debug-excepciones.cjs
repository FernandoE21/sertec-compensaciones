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
        
        const resultGPS = await pool.request()
            .query(`
                SELECT DISTINCT id_usuario
                FROM usuario_gps
                WHERE fec_marca >= '2026-03-20'
                  AND id_usuario NOT LIKE '0100[0-9][0-9][0-9][0-9]'
            `)
        
        output.excepcionesApp = resultGPS.recordset

    } catch (e) {
        output.error = e.message
    } finally {
        sql.close()
        fs.writeFileSync('debug-excepciones.json', JSON.stringify(output, null, 2))
    }
}

search()
