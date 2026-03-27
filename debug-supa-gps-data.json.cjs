const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const SUPABASE_URL = 'https://pwzogtzcgcxiondlcfeo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oCt_y46aZ4iTg81CTKb3YQ_tLG_K-aA';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    let output = {}
    try {
        const { data, count, error } = await supabase
            .from('marcaciones_gps')
            .select('id_marca', { count: 'exact' })
            .limit(5)
        
        output.data = data
        output.count = count
        output.error = error
    } catch (e) {
        output.error = e.message
    } finally {
        fs.writeFileSync('debug-supa-gps-data.json', JSON.stringify(output, null, 2))
    }
}

check()
