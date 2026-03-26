import { moduleSyncService } from './moduleSyncService';
import { rolePermissionAutoSync } from './rolePermissionAutoSync';

/**
 * Triggers to handle lifecycle events.
 * Call these from relevant service points (like when creating a school).
 */
export const planModuleSyncTrigger = {
    
    onSchoolCreated: async (branchId, planId) => {
        console.log(`[Trigger] School Created: ${branchId}, Plan: ${planId}`);
        // 1. Ensure plan modules are mapped (redundant check)
        // 2. Sync permissions for this new school
        await rolePermissionAutoSync.syncRolePermissionsForNewSchool(branchId, planId);
    },

    onPlanUpdated: async (planId) => {
        // In future: update permissions for all schools with this plan
        // This is heavy, so maybe background job.
        // For now, we assume School Owner checks permissions on login (auto-repair).
        console.log(`[Trigger] Plan Updated: ${planId}`);
    }
};
