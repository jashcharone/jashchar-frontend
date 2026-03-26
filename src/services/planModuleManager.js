import { supabase } from '@/lib/customSupabaseClient';
import { ALL_MODULES } from '@/config/modules';
import { moduleSyncService } from './moduleSyncService';

/**
 * Higher-level manager for Plan <-> Module relationships.
 */
export const planModuleManager = {
  
  /**
   * Gets plan details along with its active modules.
   */
  getPlanWithModules: async (planId) => {
    try {
        const { data: plan, error: planError } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('id', planId)
            .single();
        
        if (planError) throw planError;

        const activeModules = await moduleSyncService.getModulesForPlan(planId);
        
        return { plan, modules: activeModules };
    } catch (e) {
        console.error("Failed to get plan with modules:", e);
        return { plan: null, modules: [] };
    }
  },

  /**
   * Batch update modules for a plan (Enable/Disable).
   */
  updatePlanModules: async (planId, moduleIds) => {
    try {
        // 1. Get current modules to calculate diff
        const currentModules = await moduleSyncService.getModulesForPlan(planId);
        const currentIds = currentModules.map(m => m.id);

        const toAdd = moduleIds.filter(id => !currentIds.includes(id));
        const toRemove = currentIds.filter(id => !moduleIds.includes(id));

        let updatedCount = 0;

        // 2. Add New
        for (const id of toAdd) {
            const res = await moduleSyncService.syncModuleForPlan(id, planId);
            if (res.success) updatedCount++;
        }

        // 3. Remove Old
        for (const id of toRemove) {
            const res = await moduleSyncService.removeModuleFromPlan(id, planId);
            if (res.success) updatedCount++;
        }

        return { success: true, updated: updatedCount };

    } catch (e) {
        console.error("Update plan modules failed:", e);
        return { success: false, error: e.message };
    }
  },

  /**
   * Get all plans with their modules attached.
   */
  getAllPlansWithModules: async () => {
    try {
        const { data: plans, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .order('price', { ascending: true });

        if (error) throw error;

        // Enhance with modules
        const plansWithModules = await Promise.all(plans.map(async (plan) => {
            const modules = await moduleSyncService.getModulesForPlan(plan.id);
            return { ...plan, activeModules: modules };
        }));

        return plansWithModules;
    } catch (e) {
        console.error("Get all plans failed:", e);
        return [];
    }
  }
};
