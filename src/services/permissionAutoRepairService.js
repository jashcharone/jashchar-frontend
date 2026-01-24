import { supabase } from '@/lib/customSupabaseClient';
import { syncPlanModulesToSchoolOwnerPermissions } from '@/services/planModuleSyncService';

/**
 * Auto-repairs permissions specifically for the Academics module for the School Owner.
 */
export const autoRepairSchoolOwnerAcademicsPermission = async (branchId) => {
    try {
        // 1. Get School Owner Role
        const { data: role } = await supabase
            .from('roles')
            .select('id')
            .eq('branch_id', branchId)
            .ilike('name', 'school_owner')
            .maybeSingle();
        
        if (!role) return { success: false, error: "Role not found" };

        // 2. Upsert Permission for 'academics'
        const { error } = await supabase
            .from('permissions')
            .upsert({
                role_id: role.id,
                module: 'academics',
                can_view: true,
                can_add: true,
                can_edit: true,
                can_delete: true,
                updated_at: new Date()
            }, { onConflict: 'role_id, module' });

        if (error) throw error;
        return { success: true, created: true };

    } catch (e) {
        console.error("Auto-repair academics permission failed:", e);
        return { success: false, error: e.message };
    }
};

/**
 * Comprehensive repair for all permissions based on the school's plan.
 */
export const autoRepairAllSchoolOwnerPermissions = async (branchId) => {
    try {
        const { data: school } = await supabase
            .from('schools')
            .select('subscription_plan')
            .eq('id', branchId)
            .single();

        if (!school?.subscription_plan) return { success: false, error: "No plan found" };

        // Re-use the robust sync service
        const result = await syncPlanModulesToSchoolOwnerPermissions(branchId, school.subscription_plan);
        
        return { success: result.success, repaired: result.count, error: result.error };

    } catch (e) {
        console.error("Auto-repair all permissions failed:", e);
        return { success: false, error: e.message };
    }
};
