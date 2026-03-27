const sql = require('mssql');
async function debug() {
  const pool = await sql.connect({
    server: 'PROMETEO', port: 1200, database: 'MARCACION', user: 'USERDESK', password: 'GPTY2K5',
    options: { encrypt: false, trustServerCertificate: true, enableArithAbort: true }
  });
  const res = await pool.request().query("SELECT CAST(id_marca AS VARCHAR(50)) as id_marca, latitud, longitud FROM usuario_gps WHERE id_usuario LIKE '%01002044%' AND fec_marca >= '2026-03-26 18:00:00' AND fec_marca <= '2026-03-26 19:00:00'");
  console.log(JSON.stringify(res.recordset, null, 2));
  await pool.close();
}
debug().catch(console.error);
