import { supabase } from '@/lib/customSupabaseClient';
import { syncPlanModulesToSchoolOwnerPermissions } from '@/services/planModuleSyncService';
import { seedCoreModules } from '@/seeds/seedCoreModules';
import { repairPlanModuleMappings } from '@/services/planModuleRepairService';

export const rolesService = {
  /**
   * Creates 9 default roles and ensures Permissions are synced for School Owner.
   * Includes Pre-flight checks for Modules and Plan Mappings.
   */
  createDefaultRoles: async (branchId, planId = null) => {
    // SAFETY: Ensure core modules exist before we start assigning them
    await seedCoreModules();
    
    // SAFETY: Ensure the plan maps to modules correctly
    await repairPlanModuleMappings();

    const defaultRoles = [
      'School Owner',
      'Admin',
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
