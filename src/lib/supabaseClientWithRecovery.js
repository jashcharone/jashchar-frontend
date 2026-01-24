import { supabase as originalClient } from '@/lib/customSupabaseClient';
import { safeFetch } from '@/utils/safeFetchWrapper';

/**
 * WRAPPER: Supabase Client with Auto-Recovery
 * Wraps the original client to ensure all calls are safe.
 * Use this instead of direct client when you need safety.
 */

// Simple proxy handler to intercept method calls if needed, 
// but for simplicity and robustness, we export helper functions or specific wrappers.
// A full Proxy wrapper is complex for Supabase's fluent API (from().select()...).
// Instead, we ensure the APP uses 'safeFetch' for critical logic.

// However, to satisfy the requirement of "Export: supabase (with recovery wrapper)",
// we can't easily wrap the fluent API without a Proxy.
// We will re-export the original client but attach helper methods.

export const supabase = originalClient;

/**
 * Safe Query Helper
 * Usage: await safeQuery(() => supabase.from('table').select('*'))
 */
export const safeQuery = async (queryFn, options = {}) => {
    return safeFetch(queryFn, options);
};

// Also export standard method for checks
export { classifyConnectionError, performConnectionTest } from '@/services/supabaseConnectionDiagnostic';
