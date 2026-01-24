require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SCHOOL_ID = '2b729d32-3d03-470c-9283-48d67146f42b'; // From previous debug

async function checkSchoolDetails() {
  const { data: school } = await supabase
    .from('schools')
    .select('id, name, subscription_status, auto_renewal, bill_generate_date, bill_due_date, bill_amount, plan_id')
    .eq('id', SCHOOL_ID)
    .single();

  console.log('School Details:', school);
}

checkSchoolDetails();
