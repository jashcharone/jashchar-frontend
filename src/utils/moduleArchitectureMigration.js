import { moduleRegistryService } from '@/services/moduleRegistryService';
import { rolePermissionSyncService } from '@/services/rolePermissionSyncService';
import { planModuleService } from '@/services/planModuleService';
import { supabase } from '@/lib/customSupabaseClient';
import { ALL_MODULES } from '@/config/modules';

/**
 * ONE-TIME MIGRATION SCRIPT
 * Converts the system to the new Modules -> Plan -> Roles architecture.
 */
export const runModuleArchitectureMigration = async () => {
  const report = {
    step1_modules_seeded: false,
    step2_plans_synced: 0,
    step3_schools_synced: 0,
    errors: []
  };

  console.log("ðŸš€ STARTING MODULE ARCHITECTURE MIGRATION...");

  // STEP 1: Seed Modules Table
  try {
    await moduleRegistryService.ensureModulesSeededFromConfig();
    report.step1_modules_seeded = true;
  } catch (e) {
    report.errors.push({ step: 1, error: e.message });
  }

  // STEP 2: Populate plan_modules from existing plans JSON
  try {
    const { data: plans } = await supabase.from('subscription_plans').select('*');
    if (plans) {
      for (const plan of plans) {
        // Get modules from legacy JSON column or config default
        let modulesToSync = [];
        
        if (plan.modules && Array.isArray(plan.modules) && plan.modules.length > 0) {
          modulesToSync = plan.modules;
        } else {
          // Fallback to default_in_plans logic if JSON is empty
          const planKey = plan.name.toLowerCase();
          modulesToSync = ALL_MODULES.filter(m => m.default_in_plans.includes(planKey)).map(m => m.slug);
        }

        // Sync to new table
        if (modulesToSync.length > 0) {
          await planModuleService.setModulesForPlan(plan.id, modulesToSync);
          report.step2_plans_synced++;
        }
      }
    }
  } catch (e) {
    report.errors.push({ step: 2, error: e.message });
  }

  // STEP 3: Sync Permissions for All Schools
  try {
    const { data: schools } = await supabase.from('schools').select('id');
    if (schools) {
      for (const school of schools) {
        await rolePermissionSyncService.syncPermissionsForSchool(school.id);
        report.step3_schools_synced++;
      }
    }
  } catch (e) {
    report.errors.push({ step: 3, error: e.message });
  }

  console.log("✅ MIGRATION COMPLETE", report);
  return report;
};
