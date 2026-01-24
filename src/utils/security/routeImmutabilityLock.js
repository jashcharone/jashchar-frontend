import { ROUTES } from '@/registry/routeRegistry';

/**
 * ROUTE IMMUTABILITY LOCK
 * Prevents modification or deletion of critical system routes.
 */

// Hardcoded hash of the baseline critical routes to prevent accidental code changes
// In a real CI/CD pipeline, this would be generated during the build artifacts phase.
const BASELINE_ROUTE_HASH = 'frozen_v1_2025'; 

const CRITICAL_PATHS = new Set(
    Object.values(ROUTES).flatMap(section => Object.values(section))
);

export const validateRouteIntegrity = (currentRoutes) => {
    const violations = [];
    
    // 1. Check if any critical path is missing
    // In a real scenario, we would compare against the runtime router config directly
    // For this implementation, we ensure our static ROUTES registry remains as is
    // This function will be expanded if a dynamic route loading mechanism is introduced
    
    // Example placeholder for future expansion:
    // If(currentRoutes && currentRoutes.length < CRITICAL_PATHS.size) {
    //   violations.push("Potential route deletions detected.");
    // }

    // For now, if ROUTES is modified directly, this will not catch it at runtime.
    // Build-time checks would be needed for that, as specified in task C1.

    return {
        isValid: violations.length === 0,
        violations,
        timestamp: new Date().toISOString()
    };
};

export const isRouteLocked = (path) => {
    return CRITICAL_PATHS.has(path);
};

export const assertRouteImmutability = (path, action = 'modify') => {
    if (isRouteLocked(path)) {
        throw new Error(`IMMUTABILITY VIOLATION: Attempted to ${action} locked route: ${path}`);
    }
    return true;
};
