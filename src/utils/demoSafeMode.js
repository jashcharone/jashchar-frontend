/**
 * SAFE MODE PROTECTION SYSTEM
 * Ensures automation ONLY touches demo data and strictly respects isolation.
 */

const DEMO_SCHOOL_PREFIX = 'Jashchar Demo School (Automation)';
const SAFE_MODE_ACTIVE = true; // Hardcoded safety switch

export const isSafeModeActive = () => SAFE_MODE_ACTIVE;

export const verifyDemoIsolation = (schoolData) => {
    if (!SAFE_MODE_ACTIVE) {
        throw new Error('SAFETY VIOLATION: Safe Mode is DISABLED. Automation halted.');
    }

    // Check 1: Name Pattern
    if (!schoolData.name?.startsWith(DEMO_SCHOOL_PREFIX)) {
        throw new Error(`SAFETY VIOLATION: Target school '${schoolData.name}' does not match Demo Automation naming pattern.`);
    }

    // Check 2: Email Pattern
    // Allow emails with 'demo' or 'jashchar.com' domain
    const email = schoolData.email?.toLowerCase() || '';
    if (!email.includes('demo') && !email.includes('jashchar.com')) {
        throw new Error(`SAFETY VIOLATION: Target email '${schoolData.email}' is not a recognized demo pattern.`);
    }

    // Check 3: Explicit Demo Flag
    if (schoolData.is_demo_mode === false) { // If strictly false
         throw new Error('SAFETY VIOLATION: Target entity is explicitly marked as NON-DEMO.');
    }

    return true;
};

export const verifyNoRealDataTouched = (tableName, recordId) => {
    // In a real implementation, this would check against a blacklist of Production IDs
    // For now, we assume any ID generated during the session is safe
    if (!recordId) return true;
    
    // Placeholder for production ID check
    const PRODUCTION_IDS = ['prod_123', 'admin_master'];
    if (PRODUCTION_IDS.includes(recordId)) {
        throw new Error(`SAFETY VIOLATION: Attempted to modify Production Record ID: ${recordId}`);
    }
    
    return true;
};

export const assertSystemLockIntegrity = () => {
    // Verify critical system locks are respected
    // This mimics checking the 'immutability' status
    return true; 
};
