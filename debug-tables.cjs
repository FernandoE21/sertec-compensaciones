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
        
        // Let's see all tables in MARCACION schema
        const tables = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'")
        output.tables = tables.recordset.map(t => t.TABLE_NAME)

    } catch (e) {
        output.error = e.message
    } finally {
        sql.close()
        fs.writeFileSync('debug-tables.json', JSON.stringify(output, null, 2))
    }
}

search()
