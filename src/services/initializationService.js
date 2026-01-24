import { runSafeMigrations } from '@/services/migrationService';

/**
 * System initialization routine.
 * Should be called once on app load to ensure integrity.
 */
export const initializeSystemOnStartup = async () => {
    console.log("Initializing System...");
    const result = await runSafeMigrations();
    
    if (!result.success) {
        console.error("System Initialization Issues:", result.errors);
    } else {
        console.log("System Initialized Successfully.", result);
    }

    return result;
};
