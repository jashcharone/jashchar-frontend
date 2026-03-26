
import { supabase } from '@/lib/customSupabaseClient';

/**
 * FACTORY: Safe Supabase Client
 * Simply returns the pre-configured client which is guaranteed to exist.
 */

export const getSupabaseClient = () => supabase;
export const isSupabaseReady = () => !!supabase?.supabaseUrl;
