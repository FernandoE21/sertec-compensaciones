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

async function checkUsers() {
    let output = {}
    try {
        const pool = await sql.connect(sqlConfig)
        
        const loginUserCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Login_User'")
        output.loginUserCols = loginUserCols.recordset.map(c => c.COLUMN_NAME)

        const usuarioCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Usuario'")
        output.usuarioCols = usuarioCols.recordset.map(c => c.COLUMN_NAME)

        const trabajadorCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Trabajador'")
        output.trabajadorCols = trabajadorCols.recordset.map(c => c.COLUMN_NAME)

        if (output.loginUserCols.includes('id_usuario')) {
            const sample = await pool.request().query("SELECT TOP 5 * FROM Login_User WHERE id_usuario LIKE '%JAMAYA%'")
            output.loginUserSample = sample.recordset
        }

        if (output.usuarioCols.includes('id_usuario')) {
            const sample = await pool.request().query("SELECT TOP 5 * FROM Usuario WHERE id_usuario LIKE '%JAMAYA%'")
            output.usuarioSample = sample.recordset
        }

    } catch (e) {
        output.error = e.message
    } finally {
        sql.close()
        fs.writeFileSync('debug-mapping.json', JSON.stringify(output, null, 2))
    }
}

checkUsers()
