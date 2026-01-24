require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase.from('school_requests').select('*').limit(1);
    if (error) console.error(error);
    else {
        if (data.length > 0) console.log(Object.keys(data[0]));
        else console.log("Table empty, cannot infer columns from data.");
    }
}

check();