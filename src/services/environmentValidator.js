
import { supabase } from '@/lib/customSupabaseClient';

/**
 * SERVICE: Environment Validator
 * Validates environment configuration, respecting hardcoded client values.
 */

export const validateEnvironment = () => {
  let url = import.meta.env.VITE_SUPABASE_URL;
  let key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const errors = [];
  const warnings = [];

  // Intelligent Fallback: Check initialized client if Env vars are missing
  if (!url || !key) {
    if (supabase?.supabaseUrl) {
      url = supabase.supabaseUrl;
      // Found in client, so it's valid!
    }
    if (supabase?.supabaseKey) {
      key = supabase.supabaseKey;
      // Found in client, so it's valid!
    }
  }

  // Existence Check
  if (!url) errors.push("VITE_SUPABASE_URL is missing");
  if (!key) errors.push("VITE_SUPABASE_ANON_KEY is missing");

  // URL Format Check
  if (url) {
    try {
      const parsed = new URL(url);
      if (!parsed.protocol.startsWith('https')) {
        warnings.push("Supabase URL should use HTTPS");
      }
    } catch (e) {
      errors.push(`Invalid Supabase URL format: ${url}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    hasUrl: !!url,
    hasKey: !!key
  };
};

export const getEnvironmentStatus = () => {
  let url = import.meta.env.VITE_SUPABASE_URL || '';
  let key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  // Fallback for display
  if (!url && supabase?.supabaseUrl) url = supabase.supabaseUrl;
  if (!key && supabase?.supabaseKey) key = supabase.supabaseKey;

  const mask = (str) => {
    if (!str || str.length < 10) return '******';
    return `${str.substring(0, 8)}...${str.substring(str.length - 4)}`;
  };

  const validation = validateEnvironment();

  return {
    url: mask(url),
    key: mask(key),
    valid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings
  };
};
