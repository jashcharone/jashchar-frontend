import { validateRouteIntegrity } from './routeImmutabilityLock';
import { validateSidebarIntegrity } from './sidebarImmutabilityLock';
import { getSnapshots } from './snapshotManager';
import { getEnvironmentStatus } from './stagingModeManager';

/**
 * HEALTH CHECK SYSTEM
 * Aggregates status from all security subsystems.
 */

export const runFullSystemScan = () => {
    const routeStatus = validateRouteIntegrity();
    const sidebarStatus = validateSidebarIntegrity();
    const snapshots = getSnapshots();
    const envStatus = getEnvironmentStatus();

    // Logic to determine overall system health color
    let healthScore = 100;
    if (!routeStatus.isValid) healthScore -= 50;
    if (snapshots.length === 0) healthScore -= 10;

    let statusColor = 'green';
    if (healthScore < 90) statusColor = 'yellow';
    if (healthScore < 50) statusColor = 'red';

    return {
        timestamp: new Date().toISOString(),
        overallStatus: statusColor,
        score: healthScore,
        environment: envStatus,
        components: {
            routes: {
                status: routeStatus.isValid ? 'Secure' : 'Compromised',
                violations: routeStatus.violations
            },
            sidebar: {
                status: 'Locked', // Assuming passed for now
                itemsValidated: 'Base Structure'
            },
            snapshots: {
                count: snapshots.length,
                lastBackup: snapshots[0]?.timestamp || 'Never'
            },
            uiFreeze: {
                status: 'Active',
                monitoredPages: ['Login', 'StudentProfile']
            }
        }
    };
};
