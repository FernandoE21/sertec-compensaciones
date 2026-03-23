import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = 'https://pwzogtzcgcxiondlcfeo.supabase.co'
export const supabaseKey = 'sb_publishable_oCt_y46aZ4iTg81CTKb3YQ_tLG_K-aA'

export const supabase = createClient(supabaseUrl, supabaseKey)


