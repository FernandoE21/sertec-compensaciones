const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://pwzogtzcgcxiondlcfeo.supabase.co', 'sb_publishable_oCt_y46aZ4iTg81CTKb3YQ_tLG_K-aA');

async function debug() {
  const rs = await supabase.from('marcaciones_individuales').select('*').eq('codigo_trabajador', '01000831');
  console.log('En marcaciones_individuales:');
  console.log(JSON.stringify(rs.data, null, 2));
}
debug().catch(console.error);
