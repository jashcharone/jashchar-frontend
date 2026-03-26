import { supabase } from '@/lib/customSupabaseClient';
import { schoolModuleMap } from '@/lib/schoolModules';

/**
 * Loads modules for a specific school based on their active subscription plan.
 * If no branchId is provided, it returns ALL modules (for Master Admin).
 */
export const getSchoolOwnerModules = async (branchId = null) => {
  try {
    let allowedModuleIds = null;

    // 1. If branchId is provided, fetch the active plan's modules
    if (branchId) {
        console.log(`Fetching modules for school: ${branchId}`);
        // Fetch active subscription -> plan -> modules (and plan_modules as fallback)
        // Note: We select both module_id and module_key from plan_modules to support both schema versions
        const { data: subData, error: subError } = await supabase
            .from('school_subscriptions')
            .select('plan:subscription_plans(id, modules, plan_modules(module_id, module_key))')
            .eq('branch_id', branchId)
            .in('status', ['active', 'trialing'])
            .maybeSingle();

        if (subError) {
            console.error("Error fetching school subscription:", subError);
        }

        if (!subError && subData?.plan) {
            // PRIORITY: Check 'plan_modules' relation FIRST (this is the correct source)
            if (subData.plan.plan_modules && subData.plan.plan_modules.length > 0) {
                // Support both UUIDs (module_id) and Slugs (module_key)
                allowedModuleIds = subData.plan.plan_modules.map(pm => pm.module_key || pm.module_id).filter(Boolean);
            } 
            // Fallback: Check 'modules' column (legacy)
            else if (subData.plan.modules && subData.plan.modules.length > 0) {
                allowedModuleIds = subData.plan.modules;
            }
            
            if (allowedModuleIds) {
                console.log("Allowed Module IDs from Plan (Supabase):", allowedModuleIds);
            }
        }
        
        if (!allowedModuleIds) {
            console.warn("No modules found in subscription. Checking if Master Admin...");
            // If no modules found, it might be because we are Master Admin viewing a school
            // and RLS is blocking us from seeing the school's subscription details directly
            // OR the plan has no modules.
            
            // Since we are on Hostinger (Static), we cannot call localhost:5000.
            // We must rely on Supabase.
            
            // Try fetching plan_id directly from school table (less secure but works for Master Admin view)
            const { data: schoolData } = await supabase
                .from('schools')
                .select('plan_id')
                .eq('id', branchId)
                .single();
                
            if (schoolData?.plan_id) {
                 // Try to fetch modules from plan_modules table
                 // We try to select both module_id and module_key
                 const { data: planModules } = await supabase
                    .from('plan_modules')
                    .select('module_id, module_key')
                    .eq('plan_id', schoolData.plan_id);
                    
                 if (planModules && planModules.length > 0) {
                     allowedModuleIds = planModules.map(pm => pm.module_key || pm.module_id).filter(Boolean);
                 } else {
                     // Fallback: Check subscription_plans.modules JSON column
                     const { data: planData } = await supabase
                        .from('subscription_plans')
                        .select('modules')
                        .eq('id', schoolData.plan_id)
                        .single();
                        
                     if (planData?.modules && planData.modules.length > 0) {
                         allowedModuleIds = planData.modules;
                     }
                 }
            }
        }
        
        // Backend API Fallback Removed for Hostinger Compatibility
    }

    // 2. Fetch ALL modules from module_registry (centralized module management)
    // We need to fetch all to map IDs to Names/Slugs
    const { data: dbModules, error } = await supabase
      .from('module_registry')
      .select('id, name, slug, category, parent_slug')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) console.warn("DB Fetch Warning (module_registry):", error.message);

    // 3. Filter modules if allowedModuleIds exists
    // Only keep TOP LEVEL modules (parent_slug is null) to avoid duplicates/ghost modules
    let finalModules = dbModules?.filter(m => !m.parent_slug) || [];

    if (allowedModuleIds && allowedModuleIds.length > 0) {
        console.log('=== FILTERING MODULES ===');
        console.log('DB Modules:', dbModules?.length || 0);
        console.log('Allowed from plan:', allowedModuleIds);
        
        // Filter: Only include modules whose slug or name is in the allowed list
        // Note: allowedModuleIds contains module slugs/names (strings) from the plan JSON
        finalModules = finalModules.filter(m => {
            const slugMatch = allowedModuleIds.includes(m.slug);
            const nameMatch = allowedModuleIds.includes(m.name);
            const idMatch = allowedModuleIds.includes(m.id);
            const matched = slugMatch || nameMatch || idMatch;
            
            if (matched) {
                console.log(`? Matched: ${m.name} (${m.slug}) - slug:${slugMatch}, name:${nameMatch}, id:${idMatch}`);
            }
            
            return matched;
        });
        
        console.log(`Filtered from ${dbModules?.length || 0} to ${finalModules.length} modules`);
        console.log('Final modules:', finalModules.map(m => m.slug));
    } else if (branchId) {
        // If branchId is provided but no allowedModuleIds found, it means NO PLAN or NO MODULES.
        // We should return EMPTY list, not ALL modules.
        console.warn(`No active plan/modules found for school ${branchId}. Returning empty list.`);
        return [];
    } else {
        console.warn('No allowedModuleIds and no branchId - returning ALL modules (Master Admin View)');
    }

    return finalModules;

  } catch (err) {
    console.error('Error loading school owner modules:', err);
    return [];
  }
};

/**
 * Gets all module slugs currently associated with a plan.
 */
export const getPlanModules = async (planId) => {
  try {
    const { data, error } = await supabase
      .from('plan_modules')
      .select('module_key')
      .eq('plan_id', planId);

    if (error) throw error;
    return data?.map(m => m.module_key) || [];
  } catch (err) {
    console.error('Error loading plan modules:', err);
    return [];
  }
};
