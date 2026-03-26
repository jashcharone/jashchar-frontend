import { isRouteLocked } from './routeImmutabilityLock';
import { isSidebarItemLocked } from './sidebarImmutabilityLock';
import { takeSystemSnapshot, rollbackToSnapshot } from './snapshotManager';

/**
 * BREAKAGE FIREWALL
 * The active guardian that intercepts and blocks dangerous actions.
 */

export const firewallInterceptor = async (actionType, resourceId, executeAction) => {
    console.log(`[Firewall] Analyzing action: ${actionType} on ${resourceId}`);

    // 1. Check Route Locks
    if (actionType === 'MODIFY_ROUTE' && isRouteLocked(resourceId)) {
        const violation = `FIREWALL BLOCK: Route '${resourceId}' is IMMUTABLE.`;
        console.error(violation);
        alert(violation); // User-facing alert
        return false;
    }

    // 2. Check Sidebar Locks
    if (actionType === 'MODIFY_SIDEBAR' && isSidebarItemLocked(resourceId)) {
        const violation = `FIREWALL BLOCK: Sidebar item '${resourceId}' is IMMUTABLE.`;
        console.error(violation);
        return false;
    }

    // 3. Auto-Snapshot before proceeding
    const snapshotId = takeSystemSnapshot(`pre_${actionType}`);

    try {
        // 4. Execute the risky action
        const result = await executeAction();
        return result;
    } catch (error) {
        console.error(`[Firewall] Action failed! Initiating Auto-Rollback to ${snapshotId}`, error);
        rollbackToSnapshot(snapshotId);
        return false;
    }
};
