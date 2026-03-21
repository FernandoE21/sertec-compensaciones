const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('https://pwzogtzcgcxiondlcfeo.supabase.co', 'sb_publishable_oCt_y46aZ4iTg81CTKb3YQ_tLG_K-aA')

async function check() {
    let { data, error } = await supabase.from('personal').select('*').limit(1)
    console.log(Object.keys(data[0]))
}
check()