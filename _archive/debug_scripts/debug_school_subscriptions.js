require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SCHOOL_ID = '2b729d32-3d03-470c-9283-48d67146f42b';

async function checkSchoolSubscriptions() {
  console.log(`Checking school_subscriptions for school ${SCHOOL_ID}...`);

  const { data: subscriptions, error } = await supabase
    .from('school_subscriptions')
    .select('*')
    .eq('school_id', SCHOOL_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Subscriptions found:', subscriptions.length);
  console.log(JSON.stringify(subscriptions, null, 2));
}

checkSchoolSubscriptions();
