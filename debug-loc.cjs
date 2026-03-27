const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const sql = require('mssql');
const supabase = createClient('https://pwzogtzcgcxiondlcfeo.supabase.co', 'sb_publishable_oCt_y46aZ4iTg81CTKb3YQ_tLG_K-aA');

async function debug() {
  let log = '';
  const println = (m) => { log += m + '\n'; console.log(m); }
  
  println('Buscando en marcaciones_gps (Supabase) hoooy...');
  const { data: m } = await supabase.from('marcaciones_gps').select('*')
    .ilike('codigo_trabajador', '%')
    .gte('fecha_marca', '2026-03-26T00:00:00')
    .order('fecha_marca', { ascending: false }).limit(10);
  if (m) println(JSON.stringify(m, null, 2));

  println('\\nSQL Server (usuario_gps)...');
  const pool = await sql.connect({
    server: 'PROMETEO', port: 1200, database: 'MARCACION', user: 'USERDESK', password: 'GPTY2K5',
    options: { encrypt: false, trustServerCertificate: true, enableArithAbort: true }
  });
  const res = await pool.request().query("SELECT TOP 5 fec_marca, latitud, longitud, id_usuario FROM usuario_gps WHERE fec_marca >= '2026-03-26' ORDER BY fec_marca DESC");
  if (res.recordset) println(JSON.stringify(res.recordset, null, 2));
  
  await pool.close();
  fs.writeFileSync('debug_loc.txt', log, 'utf8');
}
debug().catch(console.error);
