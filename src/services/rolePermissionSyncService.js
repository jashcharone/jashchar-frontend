import { supabase } from '@/lib/customSupabaseClient';
import { planModuleService } from './planModuleService';
import { ALL_MODULES } from '@/config/modules'; // For fallbacks

/**
 * SERVICE: Role Permission Sync
 * Ensures that all roles in a school have the correct permissions
 * based on the school's subscription plan.
 */
export const rolePermissionSyncService = {
  
  /**
   * Returns default permissions configuration for a given role type.
   */
  getDefaultPermissionsForRole: (roleName) => {
    const r = roleName.toLowerCase().replace(/_/g, ' ').trim();
    
    const fullAccess = { can_view: true, can_add: true, can_edit: true, can_delete: true };
    const viewOnly = { can_view: true, can_add: false, can_edit: false, can_delete: false };
    const standardStaff = { can_view: true, can_add: true, can_edit: true, can_delete: false };

    if (r === 'school owner' || r === 'school_owner') return fullAccess;
    if (r === 'admin') return { ...standardStaff, can_delete: false }; // Admins usually can't delete critical data by default safety
    if (r === 'student' || r === 'parent') return viewOnly;
    if (r === 'teacher' || r === 'accountant' || r === 'librarian' || r === 'receptionist') return standardStaff;
    
    return viewOnly;
  },

  /**
   * Syncs permissions for a specific school based on its assigned plan.
   * Safe to call multiple times.
   */
  syncPermissionsForSchool: async (branchId) => {
    console.log(`[PermissionSync] Syncing for school ${branchId}`);
    try {
      // 1. Get School's Plan
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('subscription_plan')
        .eq('id', branchId)
        .single();
      
      if (schoolError || !school?.subscription_plan) {
        console.warn(`[PermissionSync] School ${branchId} has no plan.`);
        return { success: false, error: 'No plan found' };
      }

      // 2. Get Enabled Modules for that Plan
      const modules = await planModuleService.getModulesForPlan(school.subscription_plan);
      if (!modules || modules.length === 0) {
        console.warn(`[PermissionSync] Plan has no modules.`);
        return { success: true, count: 0 }; // Nothing to sync
      }

      // 3. Get All Roles for School
      const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select('id, name')
        .eq('branch_id', branchId);
      
      if (rolesError) throw rolesError;

      // 4. Prepare Upsert Data
      const permissionsToUpsert = [];
      
      for (const role of roles) {
        const defaults = rolePermissionSyncService.getDefaultPermissionsForRole(role.name);
        
        for (const mod of modules) {
          permissionsToUpsert.push({
            role_id: role.id,
            module: mod.slug,
            can_view: defaults.can_view,
            can_add: defaults.can_add,
            can_edit: defaults.can_edit,
            can_delete: defaults.can_delete,
            updated_at: new Date() // Ensure we update timestamp
          });
        }
      }

      // 5. Upsert in batches (to be safe, though usually small enough)
      if (permissionsToUpsert.length > 0) {
        const { error: upsertError } = await supabase
          .from('permissions')
          .upsert(permissionsToUpsert, { onConflict: 'role_id, module' });
        
        if (upsertError) throw upsertError;
      }

      console.log(`[PermissionSync] Synced ${permissionsToUpsert.length} permissions for school ${branchId}`);
      return { success: true, count: permissionsToUpsert.length };

    } catch (err) {
      console.error("[PermissionSync] Failed:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Utility to call after school creation.
   */
  syncPermissionsForNewSchool: async (branchId, planId) => {
    // We ignore planId arg here because we fetch it from DB to be sure, 
    // but we could use it to optimize if needed.
    return rolePermissionSyncService.syncPermissionsForSchool(branchId);
  }
};
