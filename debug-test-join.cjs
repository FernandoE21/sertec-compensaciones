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

async function testJoin() {
    let output = {}
    try {
        const pool = await sql.connect(sqlConfig)
        
        const result = await pool.request()
            .query(`
                SELECT TOP 10 
                    g.id_usuario, 
                    u.id_trabajador,
                    u.nom_usuario
                FROM usuario_gps g
                LEFT JOIN Usuario u ON g.id_usuario = u.id_usuario
                WHERE g.id_usuario IN ('0101JAMAYA', '0101ANTONIO', '0101WQUISPE')
            `)
        
        output.joinResult = result.recordset

    } catch (e) {
        output.error = e.message
    } finally {
        sql.close()
        fs.writeFileSync('debug-test-join.json', JSON.stringify(output, null, 2))
    }
}

testJoin()
