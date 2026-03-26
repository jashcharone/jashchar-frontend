import { supabase } from '@/lib/customSupabaseClient';

/**
 * Repairs plan_modules mappings by ensuring all plans have their modules
 * correctly mapped in the plan_modules table using correct slugs.
 */
export const repairPlanModuleMappings = async () => {
  try {
    // 1. Get all subscription plans
    const { data: plans, error } = await supabase.from('subscription_plans').select('*');
    if (error) throw error;

    let repairedCount = 0;

    for (const plan of plans) {
       if (!plan.modules) continue;

       let moduleSlugs = [];
       // Parse modules from JSONB
       if (Array.isArray(plan.modules)) {
          // It might be an array of strings or objects
          moduleSlugs = plan.modules.map(m => typeof m === 'string' ? m : (m.value || m.key));
       } else if (typeof plan.modules === 'object') {
          // Keys as slugs
          moduleSlugs = Object.keys(plan.modules).filter(k => plan.modules[k] === true);
       }

       // Force 'academics' if it's a school plan (Business Logic Rule)
       if (!moduleSlugs.includes('academics')) {
           moduleSlugs.push('academics');
       }

       // 2. Sync to plan_modules table
       const syncResult = await ensurePlanHasModules(plan.id, moduleSlugs);
       if (syncResult.success) {
           repairedCount += syncResult.synced;
       }
    }

    return { success: true, repaired: repairedCount, message: "Plan module mappings repaired." };

  } catch (e) {
    console.error("Plan module repair failed:", e);
    return { success: false, message: e.message };
  }
};

/**
 * Ensures a plan has specific modules mapped in plan_modules table.
 */
export const ensurePlanHasModules = async (planId, moduleSlugs) => {
    if (!moduleSlugs || moduleSlugs.length === 0) return { success: true, synced: 0 };

    try {
        const payload = moduleSlugs.map(slug => ({
            plan_id: planId,
            module_key: slug,
            created_at: new Date()
        }));

        // Use upsert to avoid duplicates
        const { error } = await supabase
            .from('plan_modules')
            .upsert(payload, { onConflict: 'plan_id, module_key' });

        if (error) throw error;

        return { success: true, synced: payload.length };
    } catch (e) {
        console.error(`Failed to sync modules for plan ${planId}:`, e);
        return { success: false, error: e.message };
    }
};
