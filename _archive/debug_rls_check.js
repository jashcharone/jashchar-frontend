
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  console.log('Checking role_permissions...');
  
  const { data: perms, error } = await supabase
    .from('role_permissions')
    .select('*')
    .eq('role_name', 'School Owner')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Permissions found:', perms.length);
  perms.forEach(p => {
      console.log(`ID: ${p.id}, School: ${p.school_id}, RoleID: ${p.role_id}, RoleName: ${p.role_name}, Module: ${p.module_slug}`);
  });
}

check();
