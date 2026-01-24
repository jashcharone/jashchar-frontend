const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Columns:', data.length > 0 ? Object.keys(data[0]) : 'Table empty, cannot infer columns easily without schema query');
    if (data.length === 0) {
        // Try to insert a dummy to see error or just check schema via rpc if available
        console.log("Table is empty.");
    }
  }
}

checkColumns();
