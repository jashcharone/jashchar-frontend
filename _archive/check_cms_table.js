const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkTable() {
  console.log('Checking cms_settings table...');
  
  const { data, error } = await supabase
    .from('cms_settings')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error accessing cms_settings:', error);
  } else {
    console.log('cms_settings table exists. Sample data:', data);
  }

  console.log('Checking RLS policies...');
  const { data: policies, error: policyError } = await supabase
    .rpc('get_policies', { table_name: 'cms_settings' }); // This RPC might not exist, so I'll just try to insert/select as a user if needed.
    
  // Instead of RPC, let's just try to select as a service role (which bypasses RLS) to confirm table existence.
}

checkTable();
