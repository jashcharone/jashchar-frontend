
import { supabase } from '@/lib/customSupabaseClient';
import { getEnvErrors } from "@/utils/envValidation";

/**
 * SERVICE: Environment Loader
 * Safely loads Supabase config, falling back to the initialized client
 * if environment variables are missing (e.g. when hardcoded).
 */

export const loadSupabaseEnv = () => {
  let url = import.meta.env.VITE_SUPABASE_URL;
  let key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Fallback: Check if client already has config (hardcoded case)
  if (!url && supabase?.supabaseUrl) {
    url = supabase.supabaseUrl;
  }
  if (!key && supabase?.supabaseKey) {
    key = supabase.supabaseKey;
  }

  const errors = getEnvErrors(url, key);
  const loaded = errors.length === 0;

  return {
    loaded,
    url: loaded ? url : null,
    key: loaded ? key : null,
    errors,
    safe: !loaded
  };
};

export const getSupabaseConfig = () => {
  return loadSupabaseEnv();
};

export const validateSupabaseEnv = () => {
  const { loaded, errors } = loadSupabaseEnv();
  return { valid: loaded, errors };
};
