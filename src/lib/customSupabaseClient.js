import { createClient } from '@supabase/supabase-js';

const runtime = (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) || {};
const supabaseUrl = runtime.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = runtime.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = typeof supabaseUrl === 'string' && supabaseUrl.startsWith('http') && !!supabaseAnonKey;

// Debug: log masked URL; avoid throwing on missing config so static pages still load
try {
    const maskedUrl = supabaseUrl ? supabaseUrl.replace(/^(https?:\/\/[^/]+).*/, '$1') : 'UNDEFINED';
    console.log(`[Supabase] Initializing client with URL: ${maskedUrl}`);
    if (!isConfigured) {
        console.warn('[Supabase] Not configured. Auth/data will be disabled.');
    }
} catch {}

const errorResult = { error: { message: 'Supabase not configured', code: 'NO_SUPABASE' }, data: null };

function makeStubClient() {
    const makeSelectBuilder = () => ({
        eq: () => makeSelectBuilder(),
        order: () => Promise.resolve(errorResult),
        maybeSingle: () => Promise.resolve(errorResult),
        single: () => Promise.resolve(errorResult),
    });

    const makeTableBuilder = () => ({
        select: () => makeSelectBuilder(),
        insert: () => Promise.resolve(errorResult),
        update: () => Promise.resolve(errorResult),
        delete: () => Promise.resolve(errorResult),
        eq: () => makeTableBuilder(),
        order: () => Promise.resolve(errorResult),
    });

    return {
        from: () => makeTableBuilder(),
        rpc: () => Promise.resolve(errorResult),
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            getUser: async () => ({ data: { user: null }, error: null }),
            signInWithPassword: async () => ({ data: null, error: errorResult.error }),
            signOut: async () => ({ error: null }),
            updateUser: async () => ({ data: null, error: errorResult.error }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        },
    };
}

const client = isConfigured ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'supabase-auth-token',
        flowType: 'pkce'
    }
}) : makeStubClient();

export default client;
export { client as customSupabaseClient, client as supabase, isConfigured as isSupabaseConfigured };
