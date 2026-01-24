import { supabase } from '@/lib/customSupabaseClient';

/**
 * Checks the integrity of critical tables.
 */
export const checkDatabaseIntegrity = async () => {
    const issues = [];
    const warnings = [];
    let modulesTableExists = false;

    // 1. Check Module Registry Table (centralized module management)
    const { error: modulesError } = await supabase.from('module_registry').select('id').limit(1);
    if (modulesError) {
        issues.push({ type: 'critical', message: 'module_registry table inaccessible or missing', details: modulesError });
    } else {
        modulesTableExists = true;
    }

    // 2. Check if User is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        warnings.push({ type: 'auth', message: 'No active session, health check limited' });
    }

    return {
        healthy: issues.length === 0,
        modulesTableExists,
        issues,
        warnings
    };
};

export const reportDatabaseIssues = async () => {
    const health = await checkDatabaseIntegrity();
    if (!health.healthy) {
        console.error("Database Health Issues:", health.issues);
    }
    return health;
};
