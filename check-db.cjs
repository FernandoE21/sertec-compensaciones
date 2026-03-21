const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pwzogtzcgcxiondlcfeo.supabase.co'
const supabaseKey = 'sb_publishable_oCt_y46aZ4iTg81CTKb3YQ_tLG_K-aA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    console.log('--- GRUPOS HORARIOS ---')
    let { data: horarios, error: errH } = await supabase.from('grupos_horarios').select('*')
    if (errH) console.error(errH)
    else console.log(horarios)

    console.log('--- PERSONAL SAMPLE ---')
    let { data: pers, error: errP } = await supabase.from('personal').select('codigo, nombres, apellidos, grupo_horario_id').limit(5)
    if (errP) console.error(errP)
    else console.log(pers)
}
check()