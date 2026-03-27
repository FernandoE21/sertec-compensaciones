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
                SELECT TOP 10
                    id_marca, id_usuario, fec_marca, latitud, longitud
                FROM usuario_gps
                WHERE id_usuario LIKE '%41246069%' OR id_usuario LIKE '%AMAYA%' OR id_usuario LIKE '%JORGE%' OR id_usuario LIKE '%GALIANO%'
                ORDER BY fec_marca DESC
            `)
        
        output.sqlUsuarioGPS = resultGPS.recordset

    } catch (e) {
        output.error = e.message
    } finally {
        sql.close()
        fs.writeFileSync('debug-01000473-dni.json', JSON.stringify(output, null, 2))
    }
}

search()
