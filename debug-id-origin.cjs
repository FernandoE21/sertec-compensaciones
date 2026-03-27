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

async function check() {
    let output = {}
    try {
        const pool = await sql.connect(sqlConfig)
        const result = await pool.request().query(`
          SELECT * FROM usuario_gps WHERE id_marca = '1001059579' OR id_marca LIKE '%1001059579%'
        `)
        output.res = result.recordset
    } catch (e) {
        output.error = e.message
    } finally {
        sql.close()
        fs.writeFileSync('debug-id-origin.json', JSON.stringify(output, null, 2))
    }
}

check()
