const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://pwzogtzcgcxiondlcfeo.supabase.co', 'sb_publishable_oCt_y46aZ4iTg81CTKb3YQ_tLG_K-aA');

async function debug() {
  const payload = {
    id_marca: 1002044281,
    codigo_trabajador: '01002044',
    fecha_marca: new Date('2026-03-26T18:12:54.54Z').toISOString(),
    observacion: 'FIN DE ACTIVIDADES TEST',
    cliente: 'CIPSA',
    otr_referencia: '2026001530',
    latitud: "-12.03208106",
    longitud: "-77.0168803"
  };

  console.log('Inserting payload:', payload);
  const { data, error } = await supabase.from('marcaciones_gps').upsert(payload, { onConflict: 'id_marca' }).select();
  console.log('Result:', JSON.stringify({ data, error }, null, 2));

  // now let's read it back
  const { data: q } = await supabase.from('marcaciones_gps').select('*').eq('id_marca', 1002044281).single();
  console.log('Read back:', q);
}
debug().catch(console.error);
