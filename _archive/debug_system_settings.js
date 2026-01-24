const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSettings() {
    console.log('--- Checking system_settings table ---');
    
    // 1. Fetch all rows
    const { data, error } = await supabase
        .from('system_settings')
        .select('key, value, created_at');

    if (error) {
        console.error('Error fetching settings:', error);
        return;
    }

    console.log(`Found ${data.length} settings entries:`);
    data.forEach(row => {
        console.log(`\nKey: ${row.key}`);
        console.log('Value Preview:', JSON.stringify(row.value).substring(0, 100) + '...');
    });

    // 2. Check specific keys expected by frontend
    const expectedKeys = ['comm_config', 'payment_config', 'email_config'];
    const foundKeys = data.map(r => r.key);
    
    const missing = expectedKeys.filter(k => !foundKeys.includes(k));
    if (missing.length > 0) {
        console.log('\n⚠️ MISSING KEYS:', missing);
    } else {
        console.log('\n✅ All expected keys found.');
    }

    // 3. Check RLS Policies (via SQL injection if possible, or just manual review reminder)
    console.log('\n--- RLS Policy Check (Simulation) ---');
    console.log('Ensure that "system_settings" has a policy allowing SELECT for authenticated users.');
}

checkSettings();