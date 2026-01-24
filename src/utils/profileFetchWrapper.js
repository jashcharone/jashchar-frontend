import { getSchoolOwnerProfile } from '@/services/schoolOwnerProfileService';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Safe wrapper to fetch profile with fallback recovery.
 */
export const fetchSchoolOwnerProfileSafe = async (userId) => {
    return getSchoolOwnerProfile(userId);
};

/**
 * Generalized safe fetch for any user profile (legacy or new).
 * Checks multiple tables: profiles, branch_users, employee_profiles, school_owner_profiles
 */
export const fetchUserProfileWithFallback = async (userId) => {
    try {
        // Try legacy profiles first (most common) - check by id first
        const { data: legacy } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (legacy) return { success: true, profile: legacy, type: 'legacy' };

        // Try profiles with user_id
        const { data: legacyByUserId } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (legacyByUserId) return { success: true, profile: legacyByUserId, type: 'legacy' };

        // Try branch_users (for staff/employees)
        const { data: branchUser } = await supabase
            .from('branch_users')
            .select('*, role:roles(id, name)')
            .eq('user_id', userId)
            .maybeSingle();

        if (branchUser) {
            return { 
                success: true, 
                profile: {
                    ...branchUser,
                    role_id: branchUser.role_id,
                    role: branchUser.role?.name
                }, 
                type: 'branch_user' 
            };
        }

        // Try employee_profiles
        const { data: empProfile } = await supabase
            .from('employee_profiles')
            .select('*, role:roles(id, name)')
            .eq('id', userId)
            .maybeSingle();

        if (empProfile) {
            return { 
                success: true, 
                profile: {
                    ...empProfile,
                    role: empProfile.role?.name
                }, 
                type: 'employee' 
            };
        }

        // Try school_owner_profiles
        const { success, profile } = await getSchoolOwnerProfile(userId);
        if (success) return { success: true, profile, type: 'school_owner' };

        return { success: false, error: "Profile not found in any table" };
    } catch (e) {
        console.error('[profileFetchWrapper] Error:', e.message);
        return { success: false, error: e.message };
    }
};
