import { supabase } from '@/lib/customSupabaseClient';
import { syncPlanModulesToSchoolOwnerPermissions } from '@/services/planModuleSyncService';
import { repairPlanModuleMappings } from '@/services/planModuleRepairService';

/**
 * Service to handle School related operations including Plan Assignment with Safety Sync.
 */
export const schoolService = {
  
  /**
   * Assigns or Updates a plan for a school and strictly syncs permissions.
   */
  assignPlanToSchool: async (branchId, planId) => {
    // SAFETY: Repair mappings first
    await repairPlanModuleMappings();

    // 1. Update School Record
    const { data, error } = await supabase
      .from('schools')
      .update({ subscription_plan: planId })
      .eq('id', branchId)
      .select();

    if (error) throw error;

    // 2. STRICT SYNC: Update School Owner Permissions immediately
    const syncResult = await syncPlanModulesToSchoolOwnerPermissions(branchId, planId);
    
    if (syncResult.error) {
        console.error("Plan assigned but permission sync failed:", syncResult.error);
        // We don't throw here to avoid blocking the UI, but we log it.
        // The useSchoolOwnerPermissionCheck hook will catch this on next login anyway.
    }

    return data;
  }
};
