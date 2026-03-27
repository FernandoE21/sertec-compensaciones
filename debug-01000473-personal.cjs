const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const SUPABASE_URL = 'https://pwzogtzcgcxiondlcfeo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oCt_y46aZ4iTg81CTKb3YQ_tLG_K-aA';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkPersonal() {
    let output = {}
    try {
        const { data, error } = await supabase
            .from('personal')
            .select('*')
            .eq('codigo', '01000473')
        
        output.personal = data || error
    } catch (e) {
        output.error = e.message
    } finally {
        fs.writeFileSync('debug-01000473-personal.json', JSON.stringify(output, null, 2))
    }
}

checkPersonal()
