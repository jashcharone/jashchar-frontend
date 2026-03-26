import { supabase } from '@/lib/customSupabaseClient';
import { ALL_MODULES } from '@/config/modules';

/**
 * Service to synchronize the code-based Module Registry with the Database.
 */
export const moduleSyncService = {
  
  /**
   * Syncs all defined modules to the 'modules' table.
   * Does NOT delete modules from DB that are not in code (for safety).
   */
  syncModulesToDatabase: async () => {
    try {
      // 1. Sync Modules Table
      const modulesPayload = ALL_MODULES.map(m => ({
        name: m.name,
        slug: m.slug,
        category: m.category,
        created_at: new Date() // UPSERT will ignore this if exists
      }));

      const { error: modError } = await supabase
        .from('module_registry')
        .upsert(modulesPayload, { onConflict: 'slug' });

      if (modError) throw modError;

      console.log(`[ModuleSync] Synced ${modulesPayload.length} modules to DB.`);
      return { success: true, count: modulesPayload.length };

    } catch (e) {
      console.error("[ModuleSync] Failed:", e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Syncs a specific module to a specific plan in the DB.
   */
  syncModuleForPlan: async (moduleId, planId) => {
    try {
        // Ensure module exists in DB first (by slug)
        const moduleDef = ALL_MODULES.find(m => m.id === moduleId || m.slug === moduleId);
        if (!moduleDef) return { success: false, error: "Module not found in registry" };

        const { error } = await supabase
            .from('plan_modules')
            .upsert({
                plan_id: planId,
                module_key: moduleDef.slug
            }, { onConflict: 'plan_id, module_key' });

        if (error) throw error;
        return { success: true };
    } catch (e) {
        console.error("[ModuleSync] Plan sync failed:", e);
        return { success: false, error: e.message };
    }
  },

  /**
   * Removes a module from a plan.
   */
  removeModuleFromPlan: async (moduleId, planId) => {
    try {
        const moduleDef = ALL_MODULES.find(m => m.id === moduleId || m.slug === moduleId);
        if (!moduleDef) return { success: false, error: "Module not found in registry" };

        const { error } = await supabase
            .from('plan_modules')
            .delete()
            .eq('plan_id', planId)
            .eq('module_key', moduleDef.slug);

        if (error) throw error;
        return { success: true };
    } catch (e) {
        console.error("[ModuleSync] Remove from plan failed:", e);
        return { success: false, error: e.message };
    }
  },

  /**
   * Gets all active modules for a specific plan (merged code + db).
   */
  getModulesForPlan: async (planId) => {
    try {
        const { data, error } = await supabase
            .from('plan_modules')
            .select('module_key')
            .eq('plan_id', planId);

        if (error) throw error;

        const activeSlugs = data.map(pm => pm.module_key);
        return ALL_MODULES.filter(m => activeSlugs.includes(m.slug));
    } catch (e) {
        console.error("[ModuleSync] Get modules failed:", e);
        return [];
    }
  }
};
