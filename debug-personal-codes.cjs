const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const SUPABASE_URL = 'https://pwzogtzcgcxiondlcfeo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oCt_y46aZ4iTg81CTKb3YQ_tLG_K-aA';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    let output = {}
    try {
        const { data, error } = await supabase
            .from('personal')
            .select('codigo')
            .limit(10)
        
        output.personal = data || error
    } catch (e) {
        output.error = e.message
    } finally {
        fs.writeFileSync('debug-personal-codes.json', JSON.stringify(output, null, 2))
    }
}

check()
