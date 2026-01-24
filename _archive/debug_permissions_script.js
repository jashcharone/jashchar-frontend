
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), 'frontend/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    const email = 'jashchar2024@gmail.com';
    console.log(`Debugging for user: ${email}`);

    // 1. Get User ID
    // Note: We can't query auth.users directly with anon key usually, but let's try to find profile
    // Or we use the UUID provided in the prompt: 50feafa3-a391-4e87-9ea7-66580c334507
    const userId = '50feafa3-a391-4e87-9ea7-66580c334507';

    // 2. Get Profile & School ID
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (profileError) {
        console.error("Profile Error:", profileError);
        return;
    }
    console.log("Profile:", profile);
    const schoolId = profile.school_id;

    // 3. Get Active Subscription
    const { data: sub, error: subError } = await supabase
        .from('school_subscriptions')
        .select(`
            *,
            plan:subscription_plans (
                id,
                name,
                modules,
                plan_modules (
                    module_id,
                    module:modules ( slug, name )
                )
            )
        `)
        .eq('school_id', schoolId)
        .in('status', ['active', 'trialing'])
        .maybeSingle();

    if (subError) {
        console.error("Subscription Error:", subError);
        return;
    }
    
    console.log("Subscription:", JSON.stringify(sub, null, 2));

    if (!sub) {
        console.log("No active subscription found.");
        return;
    }

    // 4. Check Modules
    const legacyModules = sub.plan.modules;
    const relationalModules = sub.plan.plan_modules;

    console.log("Legacy Modules (JSON):", legacyModules);
    console.log("Relational Modules:", JSON.stringify(relationalModules, null, 2));

}

debug();
