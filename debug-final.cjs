const sql = require('mssql');
function sqlIdToSupabase(id) {
  return id ? id.trim().substring(4) : null;
}
async function debug() {
  const pool = await sql.connect({
    server: 'PROMETEO', port: 1200, database: 'MARCACION', user: 'USERDESK', password: 'GPTY2K5',
    options: { encrypt: false, trustServerCertificate: true, enableArithAbort: true }
  });
  const res = await pool.request().query("SELECT CAST(id_marca AS VARCHAR(50)) as id_marca, fec_marca, id_usuario, observacion, cliente, otr_referencia, latitud, longitud FROM usuario_gps WHERE flg_anulado = 0 AND fec_marca IS NOT NULL AND id_usuario LIKE '%01002044%' AND fec_marca >= '2026-03-26 18:00:00' AND fec_marca <= '2026-03-26 19:00:00' ORDER BY fec_marca DESC");
  
  const lote = res.recordset.map(row => ({
    id_marca: row.id_marca,
    codigo_trabajador: sqlIdToSupabase(row.id_usuario),
    fecha_marca: row.fec_marca,
    observacion: row.observacion || null,
    cliente: row.cliente ? row.cliente.trim() : null,
    otr_referencia: row.otr_referencia || null,
    latitud: row.latitud || null,
    longitud: row.longitud || null,
  }));
  console.log(JSON.stringify(lote, null, 2));
  await pool.close();
}
debug().catch(console.error);
