import { supabase } from '@/lib/customSupabaseClient';
import { syncPlanModulesToSchoolOwnerPermissions } from '@/services/planModuleSyncService';
import { repairPlanModuleMappings } from '@/services/planModuleRepairService';

export const rolesService = {
  /**
   * Creates BRANCH-LEVEL default roles only.
   * NOTE: Super Admin & Admin are ORGANIZATION-level roles (stored in org_roles table)
   *       They should NOT be created here - they are created when organization is created.
   * 
   * Branch-level roles: Principal, Teacher, Student, Parent, etc.
   */
  createDefaultRoles: async (branchId, planId = null) => {
    // Modules are managed via backend/database
    
    // SAFETY: Ensure the plan maps to modules correctly
    await repairPlanModuleMappings();

    // ⚠️ IMPORTANT: Super Admin & Admin are ORGANIZATION-level roles
    // They belong in org_roles table, NOT in roles table
    // DO NOT add 'school_owner', 'super_admin', or 'admin' here!
    const defaultRoles = [
      'Principal',
      'Accountant',
      'Librarian',
      'Receptionist',
      'Teacher',
      'Student',
      'Parent'
    ];

    const rolesPayload = defaultRoles.map(name => ({
      branch_id: branchId,
      name: name.toLowerCase().replace(' ', '_'), // slugify name
      is_system_role: true,
      is_active: true,
    }));

    // Upsert roles
    const { data, error } = await supabase
      .from('roles')
      .upsert(rolesPayload, { onConflict: 'branch_id, name' })
      .select();

    if (error) throw error;

    // CRITICAL: If a planId is provided, immediately sync permissions for the School Owner
    if (planId) {
        const syncRes = await syncPlanModulesToSchoolOwnerPermissions(branchId, planId);
        if (syncRes.error) {
             console.error("Role creation warning: Permission sync failed", syncRes.error);
        }
    }

    return data;
  }
};
