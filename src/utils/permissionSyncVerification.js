import { supabase } from '@/lib/customSupabaseClient';

/**
 * Verify if a School Owner has permissions for all modules in their plan.
 */
export const verifyPlanModuleSync = async (branchId, planId) => {
  try {
    // Get Plan Modules
    const { data: planModulesData } = await supabase
      .from('plan_modules')
      .select('module_key')
      .eq('plan_id', planId);
      
    const expectedModules = planModulesData?.map(pm => pm.module_key) || [];

    // Get Super Admin Role
    const { data: role } = await supabase
      .from('roles')
      .select('id')
      .eq('branch_id', branchId)
      .ilike('name', 'Super Admin')
      .maybeSingle();

    if (!role) return { synced: false, error: 'Role not found' };

    // Get Actual Permissions
    const { data: currentPermissions } = await supabase
      .from('permissions')
      .select('module')
      .eq('role_id', role.id);

    const actualModules = currentPermissions?.map(p => p.module) || [];

    // Check for missing modules
    const missing = expectedModules.filter(m => !actualModules.includes(m));

    return {
      synced: missing.length === 0,
      missing
    };

  } catch (e) {
    console.error("Verification failed", e);
    return { synced: false, error: e.message };
  }
};
