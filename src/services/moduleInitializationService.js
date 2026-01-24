import { moduleSyncService } from './moduleSyncService';
import { supabase } from '@/lib/customSupabaseClient';
import { ALL_MODULES } from '@/config/modules';

export const moduleInitializationService = {
  /**
   * Main initialization routine.
   * - Syncs modules table.
   * - Ensures default plans have default modules.
   */
  initializeModuleSync: async () => {
    console.log("[ModuleInit] Starting sync...");
    
    // 1. Sync Code -> DB Modules
    await moduleSyncService.syncModulesToDatabase();

    // 2. Auto-Assign Defaults to Plans (if missing)
    // Fetch all plans
    const { data: plans } = await supabase.from('subscription_plans').select('id, name');
    
    if (plans) {
        for (const plan of plans) {
            // Find matching default config based on name fuzzy match
            const planName = plan.name.toLowerCase();
            // Check which modules should be here
            const defaultModules = ALL_MODULES.filter(m => 
                m.default_in_plans.some(dp => planName.includes(dp))
            );

            for (const mod of defaultModules) {
                // Try to sync. It upserts, so it's safe.
                await moduleSyncService.syncModuleForPlan(mod.id, plan.id);
            }
        }
    }

    console.log("[ModuleInit] Sync complete.");
    return { success: true };
  },

  runModuleSyncOnStartup: async () => {
      // Small delay to not block initial render
      setTimeout(() => {
          moduleInitializationService.initializeModuleSync();
      }, 2000);
  }
};
