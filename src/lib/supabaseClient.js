
import { supabase as client } from '@/lib/customSupabaseClient';

/**
 * MAIN EXPORT: Supabase Client
 * Re-exports the pre-configured client from customSupabaseClient.js
 * This ensures we use the single source of truth for credentials.
 */

export const supabase = client;
export const isSupabaseReady = () => !!client?.supabaseUrl;
