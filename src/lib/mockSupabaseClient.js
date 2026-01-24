/**
 * MOCK CLIENT: Safe Fallback for Missing Env
 * Prevents app crash when Supabase keys are missing.
 * Logs warnings and blocks all writes.
 */

const logWarning = (action) => {
  console.warn(`[MockSupabase] Action blocked: ${action}. Supabase environment variables are missing.`);
};

const createMockBuilder = () => {
  const builder = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    eq: () => builder,
    neq: () => builder,
    gt: () => builder,
    lt: () => builder,
    gte: () => builder,
    lte: () => builder,
    in: () => builder,
    is: () => builder,
    like: () => builder,
    ilike: () => builder,
    contains: () => builder,
    range: () => builder,
    order: () => builder,
    limit: () => builder,
    single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
    maybeSingle: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
    then: (resolve) => resolve({ data: null, error: { message: "Supabase not configured" } })
  };
  return builder;
};

export const createMockClient = () => {
  logWarning("Initializing Mock Client");
  
  return {
    from: (table) => {
      logWarning(`Query on table '${table}'`);
      return createMockBuilder();
    },
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: null, error: { message: "Sign in disabled - Env missing" } }),
      signOut: async () => ({ error: null }),
      signUp: async () => ({ data: null, error: { message: "Sign up disabled - Env missing" } }),
      resetPasswordForEmail: async () => ({ data: null, error: { message: "Reset disabled - Env missing" } }),
      updateUser: async () => ({ data: null, error: { message: "Update disabled - Env missing" } }),
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: { message: "Upload disabled - Env missing" } }),
        download: async () => ({ data: null, error: { message: "Download disabled - Env missing" } }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      })
    },
    functions: {
      invoke: async () => ({ data: null, error: { message: "Functions disabled - Env missing" } })
    },
    realtime: {
        channel: () => ({
            on: () => ({ subscribe: () => {} }),
            subscribe: () => {}
        })
    },
    rpc: async () => ({ data: null, error: { message: "RPC disabled - Env missing" } })
  };
};
