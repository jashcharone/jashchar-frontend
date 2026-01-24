require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .limit(1);
    
  if (data && data.length > 0) {
      console.log('Columns in schools table:', Object.keys(data[0]));
  } else {
      console.log('No data in schools table or error:', error);
  }
}

checkSchema();
