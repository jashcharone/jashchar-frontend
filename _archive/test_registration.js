// Test Registration Flow
const supabase = require('./backend/src/config/supabase');

async function testRegistrationFlow() {
  console.log('\n========================================');
  console.log('REGISTRATION FLOW TEST');
  console.log('========================================\n');

  // 1. Check if registration_type column exists
  console.log('1. Checking school_requests table structure...');
  const { data: columns, error: colError } = await supabase
    .from('school_requests')
    .select('*')
    .limit(1);
  
  if (colError) {
    console.log('   ❌ Error:', colError.message);
    return;
  }
  console.log('   ✅ Table accessible');

  // 2. Check existing requests
  console.log('\n2. Checking existing school_requests...');
  const { data: requests, error: reqError } = await supabase
    .from('school_requests')
    .select('id, school_name, registration_type, status, owner_email')
    .order('created_at', { ascending: false })
    .limit(5);

  if (reqError) {
    console.log('   ❌ Error:', reqError.message);
  } else if (!requests || requests.length === 0) {
    console.log('   ⚠️  No requests found in database');
  } else {
    console.log('   ✅ Found', requests.length, 'requests:');
    requests.forEach((r, i) => {
      console.log(`      ${i+1}. ${r.school_name} | Type: ${r.registration_type || 'N/A'} | Status: ${r.status}`);
    });
  }

  // 3. Check subscription plans
  console.log('\n3. Checking subscription_plans...');
  const { data: plans, error: planError } = await supabase
    .from('subscription_plans')
    .select('id, name, modules')
    .limit(5);

  if (planError) {
    console.log('   ❌ Error:', planError.message);
  } else if (!plans || plans.length === 0) {
    console.log('   ⚠️  No plans found');
  } else {
    console.log('   ✅ Found', plans.length, 'plans:');
    plans.forEach((p, i) => {
      const hasMultiBranch = p.modules && (
        (Array.isArray(p.modules) && p.modules.includes('multi_branch')) ||
        (typeof p.modules === 'string' && p.modules.includes('multi_branch'))
      );
      console.log(`      ${i+1}. ${p.name} | Multi-Branch: ${hasMultiBranch ? '✅' : '❌'}`);
    });
  }

  // 4. Check schools
  console.log('\n4. Checking schools table...');
  const { data: schools, error: schoolError } = await supabase
    .from('schools')
    .select('id, name, slug, status')
    .order('created_at', { ascending: false })
    .limit(5);

  if (schoolError) {
    console.log('   ❌ Error:', schoolError.message);
  } else if (!schools || schools.length === 0) {
    console.log('   ⚠️  No schools found');
  } else {
    console.log('   ✅ Found', schools.length, 'schools:');
    schools.forEach((s, i) => {
      console.log(`      ${i+1}. ${s.name} | Slug: ${s.slug} | Status: ${s.status}`);
    });
  }

  // 5. Check branches
  console.log('\n5. Checking branches table...');
  const { data: branches, error: branchError } = await supabase
    .from('branches')
    .select('id, branch_name, school_id, is_active')
    .order('created_at', { ascending: false })
    .limit(5);

  if (branchError) {
    console.log('   ❌ Error:', branchError.message);
  } else if (!branches || branches.length === 0) {
    console.log('   ⚠️  No branches found');
  } else {
    console.log('   ✅ Found', branches.length, 'branches:');
    branches.forEach((b, i) => {
      console.log(`      ${i+1}. ${b.branch_name} | Active: ${b.is_active !== false ? '✅' : '❌'}`);
    });
  }

  console.log('\n========================================');
  console.log('TEST COMPLETE');
  console.log('========================================\n');
}

testRegistrationFlow().catch(console.error);
