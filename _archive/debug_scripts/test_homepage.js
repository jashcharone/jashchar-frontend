require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleGpjY3JrZ2FlYWZ5aW1wb2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODAwODAsImV4cCI6MjA3Nzc1NjA4MH0.xrEWr1dDw5SD9FkqxCrqeafhYbmotrmIVEm9U6lMt8A';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function testHomepage() {
    try {
        console.log('=== TESTING HOMEPAGE DATA FETCH ===\n');

        // Test 1: Check if saas_website_settings table exists and has data (admin)
        console.log('1. Checking saas_website_settings table (as admin)...');
        const { data: settingsAdmin, error: settingsAdminError } = await supabaseAdmin
            .from('saas_website_settings')
            .select('*')
            .maybeSingle();
        
        if (settingsAdminError) {
            console.error('   ❌ Error (admin):', settingsAdminError.message);
        } else {
            console.log('   ✅ Settings found (admin):', settingsAdmin ? 'Yes' : 'No (empty table)');
        }

        // Test 2: Check with anon key (simulating frontend)
        console.log('\n2. Checking saas_website_settings table (as anon - like frontend)...');
        const { data: settingsAnon, error: settingsAnonError } = await supabaseAnon
            .from('saas_website_settings')
            .select('*')
            .maybeSingle();
        
        if (settingsAnonError) {
            console.error('   ❌ Error (anon):', settingsAnonError.message);
            console.error('   This means RLS is blocking public access!');
        } else {
            console.log('   ✅ Settings accessible (anon):', settingsAnon ? 'Yes' : 'No (empty)');
        }

        // Test 3: Check subscription_plans
        console.log('\n3. Checking subscription_plans table (as anon)...');
        const { data: plansAnon, error: plansAnonError } = await supabaseAnon
            .from('subscription_plans')
            .select('*')
            .eq('status', true)
            .eq('show_on_website', true);
        
        if (plansAnonError) {
            console.error('   ❌ Error (anon):', plansAnonError.message);
        } else {
            console.log('   ✅ Plans found (anon):', plansAnon?.length || 0);
        }

        // Test 4: Check system_settings
        console.log('\n4. Checking system_settings table (as anon)...');
        const { data: sysSettingsAnon, error: sysSettingsAnonError } = await supabaseAnon
            .from('system_settings')
            .select('*')
            .limit(1);
        
        if (sysSettingsAnonError) {
            console.error('   ❌ Error (anon):', sysSettingsAnonError.message);
        } else {
            console.log('   ✅ System settings accessible (anon):', sysSettingsAnon?.length || 0);
        }

        console.log('\n=== RECOMMENDATIONS ===');
        if (settingsAnonError) {
            console.log('❗ Need to enable RLS policy for public read access on saas_website_settings');
            console.log('   Run this SQL in Supabase:');
            console.log('   CREATE POLICY "Allow public read saas_website_settings" ON saas_website_settings FOR SELECT USING (true);');
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testHomepage();
