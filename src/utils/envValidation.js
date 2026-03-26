/**
 * UTILITY: Environment Variable Validation
 * Validates the format and presence of Supabase keys.
 */

export const validateSupabaseUrl = (url) => {
  if (!url) return false;
  return url.startsWith('https://') && url.includes('supabase.co');
};

export const validateSupabaseKey = (key) => {
  if (!key) return false;
  // Basic JWT format check (3 parts separated by dots) and reasonable length
  return key.length > 20 && key.split('.').length === 3;
};

export const getEnvErrors = (url, key) => {
  const errors = [];
  if (!url) {
    errors.push("VITE_SUPABASE_URL is missing");
  } else if (!validateSupabaseUrl(url)) {
    errors.push("VITE_SUPABASE_URL format is invalid (must be https://...supabase.co)");
  }

  if (!key) {
    errors.push("VITE_SUPABASE_ANON_KEY is missing");
  } else if (!validateSupabaseKey(key)) {
    errors.push("VITE_SUPABASE_ANON_KEY format is invalid (must be a valid JWT)");
  }

  return errors;
};
