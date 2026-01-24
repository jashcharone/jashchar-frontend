/**
 * AUTOMATION VALIDATION SUITE
 * Verifies success criteria after each phase.
 */

import { supabase } from '@/lib/customSupabaseClient';

export const validateSchoolCreation = async (branchId) => {
    if (!branchId) throw new Error('Validation Failed: No School ID returned.');
    
    const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .eq('id', branchId)
        .single();

    if (error || !data) throw new Error('Validation Failed: School record not found in DB.');
    return true;
};

export const validateUserLogin = async (email) => {
    // Check if user exists in public profiles as a proxy for successful auth/creation
    const { data, error } = await supabase
        .from('school_owner_profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

    if (error) throw new Error(`Validation Failed: Profile lookup error - ${error.message}`);
    if (!data) throw new Error(`Validation Failed: School Owner profile not created for ${email}`);
    return true;
};

export const validateSubscriptionActive = async (branchId) => {
    const { data, error } = await supabase
        .from('school_subscriptions')
        .select('status')
        .eq('branch_id', branchId)
        .eq('status', 'active')
        .maybeSingle();

    if (error || !data) throw new Error('Validation Failed: No active subscription found.');
    return true;
};
