/**
 * STAGING MODE MANAGER
 * Controls visibility of new features via environment flags.
 */

// Configured via Vite env variables
const IS_STAGING = import.meta.env.VITE_STAGING_MODE === 'true';

export const isModuleEnabled = (moduleKey) => {
    // Core modules are always enabled
    if (moduleKey.startsWith('core_')) return true;

    // New modules require Staging Mode
    if (!IS_STAGING) {
        // Production environment: Block all beta/new modules
        return false;
    }

    // Staging environment: Allow
    return true;
};

export const getEnvironmentStatus = () => {
    return IS_STAGING ? 'STAGING (Unstable features allowed)' : 'PRODUCTION (Locked & Secure)';
};
