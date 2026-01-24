import { supabase } from '@/lib/customSupabaseClient';
import { ALL_MODULES } from '@/config/modules';

/**
 * SERVICE: Module Registry
 * Acts as the interface for the 'module_registry' table - the Single Source of Truth.
 */
export const moduleRegistryService = {
  /**
   * Seed or Sync the database module_registry table from the code configuration.
   * IDEMPOTENT: Safe to run multiple times.
   */
  ensureModulesSeededFromConfig: async () => {
    console.log("[ModuleRegistry] Seeding modules...");
    try {
      const updates = ALL_MODULES.map(mod => ({
        slug: mod.slug,
        name: mod.name,
        category: mod.category,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }));

      // Upsert modules based on slug (unique constraint assumed)
      const { error } = await supabase
        .from('module_registry')
        .upsert(updates, { onConflict: 'slug' });

      if (error) throw error;
      console.log(`[ModuleRegistry] Seeded ${updates.length} modules.`);
      return { success: true, count: updates.length };
    } catch (error) {
      console.error("[ModuleRegistry] Seeding failed:", error);
      return { success: false, error };
    }
  },

  /**
   * Get all modules, optionally filtered by category.
   */
  getAllModules: async (category = null) => {
    let query = supabase.from('module_registry').select('*').eq('is_active', true).order('name');
    if (category) {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error) {
      console.error("[ModuleRegistry] Fetch failed:", error);
      return [];
    }
    return data || [];
  },

  /**
   * Specifically get modules relevant for School Owners.
   */
  getSchoolOwnerModules: async () => {
    // You might want to exclude 'master_admin' category if you add it later
    return moduleRegistryService.getAllModules();
  }
};
