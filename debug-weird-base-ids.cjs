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
        
        const result = await pool.request()
            .query(`
                SELECT DISTINCT TOP 20 id_trabajador
                FROM MARCACION_BASE
                WHERE id_trabajador NOT LIKE '0101[0-9]%'
                  AND fec_hra_marcacion >= '2026-03-20'
            `)
        
        output.weirdBaseIds = result.recordset

    } catch (e) {
        output.error = e.message
    } finally {
        sql.close()
        fs.writeFileSync('debug-weird-base-ids.json', JSON.stringify(output, null, 2))
    }
}

search()
