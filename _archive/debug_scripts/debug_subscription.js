require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EMAIL = 'priyankagouda8541@gmail.com';

async function checkSubscription() {
  console.log(`Checking subscription for ${EMAIL}...`);

  // 1. Get User ID
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === EMAIL);

  if (!user) {
    console.log('User not found in Auth');
    return;
  }
  console.log('User ID:', user.id);

  // 2. Get School Owner Profile
  const { data: ownerProfile } = await supabase
    .from('school_owner_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!ownerProfile) {
    console.log('School Owner Profile not found');
  } else {
    console.log('Owner Profile:', ownerProfile);
  }

  // 3. Get School(s) owned by user
  const { data: schools } = await supabase
    .from('schools')
    .select('*')
    .eq('owner_user_id', user.id);

  if (!schools || schools.length === 0) {
    console.log('No schools found for this user');
    return;
  }

  console.log(`Found ${schools.length} schools.`);

  for (const school of schools) {
    console.log(`\n--- School: ${school.name} (${school.id}) ---`);
    console.log('Plan ID:', school.plan_id);
    console.log('Subscription Status:', school.subscription_status);
    console.log('Subscription End Date:', school.subscription_end_date);
    
    // 4. Get Subscription Plan details
    if (school.plan_id) {
        const { data: plan } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('id', school.plan_id)
            .single();
        console.log('Plan Details:', plan);
    }

    // 5. Check recent invoices/transactions
    const { data: invoices } = await supabase
        .from('subscription_invoices')
        .select('*')
        .eq('school_id', school.id)
        .order('created_at', { ascending: false })
        .limit(5);
    
    console.log('Recent Invoices:', invoices);
  }
}

checkSubscription();
