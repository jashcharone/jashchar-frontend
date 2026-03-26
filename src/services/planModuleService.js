import { supabase } from '@/lib/customSupabaseClient';

/**
 * SERVICE: Plan Modules
 * Manages the relationship between Subscription Plans and Modules (including sub-modules).
 * Uses 'plan_modules' table as the source of truth.
 * NOW USES module_registry as the centralized module source.
 */
export const planModuleService = {
  /**
   * Get all modules/sub-modules enabled for a specific plan.
   * Returns the slugs of enabled modules.
   */
  getModulesForPlan: async (planId) => {
    try {
      const { data, error } = await supabase
        .from('plan_modules')
        .select('module_key')
        .eq('plan_id', planId);

      if (error) throw error;

      // Return slugs directly - the UI component handles the rest
      const slugs = data.map(pm => pm.module_key);
      
      // Fetch full module details from module_registry (centralized table)
      const { data: modulesData, error: modulesError } = await supabase
        .from('module_registry')
        .select('id, slug, name, display_name, icon, category, parent_slug, is_active')
        .in('slug', slugs);

      if (modulesError) throw modulesError;
      return modulesData || [];

    } catch (err) {
      console.error("[PlanModuleService] Get failed:", err);
      return [];
    }
  },

  /**
   * Get just the slugs for a plan (faster, for form initialization)
   */
  getModuleSlugsForPlan: async (planId) => {
    try {
      const { data, error } = await supabase
        .from('plan_modules')
        .select('module_key')
        .eq('plan_id', planId);

      if (error) throw error;
      return data.map(pm => pm.module_key);
    } catch (err) {
      console.error("[PlanModuleService] GetSlugs failed:", err);
      return [];
    }
  },

  /**
   * Set the exact list of modules/sub-modules for a plan.
   * Handles both parent modules and sub-modules.
   * Uses module_key (slug) only - module_id has FK to deprecated modules table.
   */
  setModulesForPlan: async (planId, moduleSlugs) => {
    try {
      // 1. Get current mappings
      const { data: current, error: fetchError } = await supabase
        .from('plan_modules')
        .select('module_key')
        .eq('plan_id', planId);
      
      if (fetchError) throw fetchError;
      
      const currentSlugs = current.map(c => c.module_key);

      // 2. Calculate diff
      const toAdd = moduleSlugs.filter(s => !currentSlugs.includes(s));
      const toRemove = currentSlugs.filter(s => !moduleSlugs.includes(s));

      // 3. Remove old
      if (toRemove.length > 0) {
        const { error: delError } = await supabase
          .from('plan_modules')
          .delete()
          .eq('plan_id', planId)
          .in('module_key', toRemove);
        if (delError) throw delError;
      }

      // 4. Add new (module_key only - module_id has FK to old modules table)
      if (toAdd.length > 0) {
        const insertData = toAdd.map(slug => ({
          plan_id: planId,
          module_key: slug,
          created_at: new Date()
        }));
        
        const { error: insError } = await supabase
          .from('plan_modules')
          .insert(insertData);
        if (insError) throw insError;
      }

      // 6. Backward Compatibility: Update JSONB column on subscription_plans
      // Store only parent module slugs for the legacy column
      const { data: parentModules } = await supabase
        .from('module_registry')
        .select('slug')
        .is('parent_slug', null)
        .in('slug', moduleSlugs);
      
      const parentSlugsOnly = parentModules?.map(m => m.slug) || [];
      
      const { error: jsonError } = await supabase
        .from('subscription_plans')
        .update({ modules: parentSlugsOnly })
        .eq('id', planId);
        
      if (jsonError) console.warn("[PlanModuleService] JSONB sync warning:", jsonError);

      console.log(`[PlanModuleService] Updated plan ${planId}: +${toAdd.length} -${toRemove.length} modules`);
      return { success: true, added: toAdd.length, removed: toRemove.length };

    } catch (err) {
      console.error("[PlanModuleService] Set failed:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Check if a specific module/sub-module is enabled for a plan
   */
  isModuleEnabled: async (planId, moduleSlug) => {
    try {
      const { data, error } = await supabase
        .from('plan_modules')
        .select('id')
        .eq('plan_id', planId)
        .eq('module_key', moduleSlug)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    } catch (err) {
      console.error("[PlanModuleService] Check failed:", err);
      return false;
    }
  }
};