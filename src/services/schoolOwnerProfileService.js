import { supabase } from '@/lib/customSupabaseClient';

/**
 * Ensures a School Owner profile exists for a given user ID.
 * If missing, it creates it using data from auth metadata or defaults.
 */
export const ensureSchoolOwnerProfile = async (userId, branchId) => {
  if (!userId || !branchId) return { success: false, error: "Missing User ID or School ID" };

  try {
    // 1. Check if profile exists in school_owner_profiles
    const { data: existing, error: fetchError } = await supabase
        .from('school_owner_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

    if (existing) {
        return { success: true, profile: existing, created: false };
    }
    
    // If fetch error was something other than "no rows" (though maybeSingle handles 0 rows gracefully)
    if (fetchError) {
        console.warn("Error checking profile:", fetchError);
    }

    // 2. Get Role ID for 'school_owner'
    const { data: role } = await supabase
        .from('roles')
        .select('id')
        .eq('branch_id', branchId)
        .ilike('name', 'school_owner') // Use ilike for case-insensitive match
        .maybeSingle(); // Use maybeSingle to avoid 406 error if not found
    
    if (!role) {
         return { success: false, error: "School Owner role not found" };
    }

    // 3. Get User Metadata for name/email
    const { data: { user } } = await supabase.auth.getUser();
    
    const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'School Owner';
    const email = user?.email;
    const username = user?.user_metadata?.username || email?.split('@')[0];

    // 4. Insert Profile
    const { data: newProfile, error: insertError } = await supabase
        .from('school_owner_profiles')
        .insert([{
            id: userId,
            branch_id: branchId,
            role_id: role.id,
            full_name: fullName,
            email: email,
            username: username,
            created_at: new Date(),
            updated_at: new Date()
        }])
        .select()
        .single();

    if (insertError) throw insertError;

    return { success: true, profile: newProfile, created: true };

  } catch (e) {
    console.error("Ensure School Owner Profile failed:", e);
    return { success: false, error: e.message };
  }
};

/**
 * Wrapper to auto-recover profile using metadata if School ID is known.
 */
export const autoRecoverSchoolOwnerProfile = async (userId) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const branchId = user?.user_metadata?.branch_id;

        if (!branchId) {
             return { success: false, error: "No School ID in user metadata" };
        }

        return ensureSchoolOwnerProfile(userId, branchId);
    } catch (e) {
        return { success: false, error: e.message };
    }
};

/**
 * Tries to fetch profile, and if it fails due to missing row, auto-recovers.
 */
export const getSchoolOwnerProfile = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('school_owner_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (data) return { success: true, profile: data };

        // If error is "row not found" (PGRST116) or similar
        if (error && (error.code === 'PGRST116' || !data)) {
            console.log("Profile missing, attempting auto-recovery...");
            return autoRecoverSchoolOwnerProfile(userId);
        }

        throw error;
    } catch (e) {
        console.error("Get Profile failed:", e);
        // Last ditch attempt at recovery if it was a weird error
        return autoRecoverSchoolOwnerProfile(userId);
    }
};
