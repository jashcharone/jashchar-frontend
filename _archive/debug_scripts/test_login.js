require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLogin() {
    try {
        // Check if users table exists and has data
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('email, role, mobile')
            .limit(3);

        console.log('\n=== USERS IN DATABASE ===');
        if (usersError) {
            console.error('Error fetching users:', usersError);
        } else if (users && users.length > 0) {
            console.log('Found', users.length, 'users:');
            users.forEach(u => console.log(`  - Email: ${u.email}, Role: ${u.role}, Mobile: ${u.mobile}`));
        } else {
            console.log('No users found in database');
        }

        // Check school_owner_profiles
        const { data: owners, error: ownersError } = await supabase
            .from('school_owner_profiles')
            .select('user_id, full_name')
            .limit(3);

        console.log('\n=== SCHOOL OWNER PROFILES ===');
        if (ownersError) {
            console.error('Error fetching owners:', ownersError);
        } else if (owners && owners.length > 0) {
            console.log('Found', owners.length, 'owner profiles:');
            owners.forEach(o => console.log(`  - User ID: ${o.user_id}, Name: ${o.full_name}`));
        } else {
            console.log('No owner profiles found');
        }

        // Check profiles table
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, full_name, role')
            .limit(3);

        console.log('\n=== PROFILES ===');
        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
        } else if (profiles && profiles.length > 0) {
            console.log('Found', profiles.length, 'profiles:');
            profiles.forEach(p => console.log(`  - User ID: ${p.user_id}, Name: ${p.full_name}, Role: ${p.role}`));
        } else {
            console.log('No profiles found');
        }

        // Test auth with a specific email
        console.log('\n=== TESTING AUTH ===');
        const testEmail = 'priyankagouda854@gmail.com';
        const testPassword = '123456';
        
        console.log(`Attempting to sign in with: ${testEmail}`);
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });

        if (authError) {
            console.error('Auth Error:', authError.message);
        } else {
            console.log('✅ Login successful!');
            console.log('User ID:', authData.user.id);
            console.log('Email:', authData.user.email);
            console.log('Role:', authData.user.user_metadata?.role);
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testLogin();
