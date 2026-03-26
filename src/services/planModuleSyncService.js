import { supabase } from '@/lib/customSupabaseClient';
import { ACADEMICS_MODULE } from '@/constants/academicsModule';

/**
 * Ensures the 'Academics' module exists in the master modules table.
 */
export const ensureAcademicsModuleExists = async () => {
  try {
    const { data: existing } = await supabase
      .from('module_registry')
      .select('id')
      .eq('slug', ACADEMICS_MODULE.slug)
      .maybeSingle();

    if (!existing) {
        console.log('Seeding Academics module...');
        const { error } = await supabase.from('module_registry').insert([{
            name: ACADEMICS_MODULE.name,
            slug: ACADEMICS_MODULE.slug,
            category: ACADEMICS_MODULE.category,
            is_active: true,
            created_at: new Date()
        }]);
        if (error) console.error("Failed to seed Academics module", error);
    }
  } catch (e) {
    console.warn("module_registry table check skipped or failed", e);
  }
  return true;
};

/**
 * Syncs plan modules to School Owner permissions.
 * STRICT: Grants FULL access (View/Add/Edit/Delete) for all plan modules to School Owner.
 */
export const syncPlanModulesToSchoolOwnerPermissions = async (branchId, planId) => {
  if (!branchId || !planId) return { error: 'Missing School ID or Plan ID' };

  try {
    // 1. Ensure Module Master Data integrity
    await ensureAcademicsModuleExists();

    // 2. Identify target modules for the plan
    let moduleKeys = [];
    
    // Try 'plan_modules' table first (normalized)
    const { data: planModulesData } = await supabase
      .from('plan_modules')
      .select('module_key')
      .eq('plan_id', planId);

    if (planModulesData && planModulesData.length > 0) {
      moduleKeys = planModulesData.map(m => m.module_key);
    } else {
      // Fallback: 'subscription_plans.modules' JSONB
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('modules')
        .eq('id', planId)
        .single();
        
      if (plan?.modules) {
        if (Array.isArray(plan.modules)) {
             moduleKeys = plan.modules.map(m => typeof m === 'string' ? m : m.value || m.key);
        } else if (typeof plan.modules === 'object') {
             moduleKeys = Object.keys(plan.modules).filter(k => plan.modules[k] === true);
        }
      }
    }

    // Force include 'academics' if it looks like it should be there but isn't mapped explicitly yet
    // This is a hotfix safety net.
    if (!moduleKeys.includes('academics')) {
       moduleKeys.push('academics');
    }

    // 3. Get School Owner Role ID
    const { data: role } = await supabase
      .from('roles')
      .select('id')
      .eq('branch_id', branchId)
      .ilike('name', 'school_owner')
      .maybeSingle();

    if (!role) return { error: 'School Owner role not found' };

    // 4. Construct Upsert Payload (Force True)
    const permissionsPayload = moduleKeys.map(key => ({
      role_id: role.id,
      module: key,
      can_view: true,
      can_add: true,
      can_edit: true,
      can_delete: true,
      updated_at: new Date()
    }));

    // 5. Perform Upsert
    if (permissionsPayload.length > 0) {
        const { error } = await supabase
            .from('permissions')
            .upsert(permissionsPayload, { onConflict: 'role_id, module' });
            
        if (error) throw error;
    }

    return { success: true, count: permissionsPayload.length };

  } catch (err) {
    console.error("Sync Plan Modules failed:", err);
    return { error: err.message };
  }
};

/**
 * Auto-repairs permissions for a school owner by re-syncing with their active plan.
 */
export const autoRepairSchoolOwnerPermissions = async (branchId) => {
    const { data: school } = await supabase
      .from('schools')
      .select('subscription_plan')
      .eq('id', branchId)
      .single();

    if (!school?.subscription_plan) return 0;

    const { success, count } = await syncPlanModulesToSchoolOwnerPermissions(branchId, school.subscription_plan);
    return success ? count : 0;
};
