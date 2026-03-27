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

async function checkCols() {
    let output = {}
    try {
        const pool = await sql.connect(sqlConfig)
        
        const cols = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'usuario_gps'")
        output.columns = cols.recordset

        const sample = await pool.request().query("SELECT TOP 5 * FROM usuario_gps WHERE id_marca LIKE '%JAMAYA%'")
        output.sample = sample.recordset

    } catch (e) {
        output.error = e.message
    } finally {
        sql.close()
        fs.writeFileSync('debug-gps-cols.json', JSON.stringify(output, null, 2))
    }
}

checkCols()
