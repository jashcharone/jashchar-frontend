import { loadSupabaseEnv } from "@/services/envLoader";

export const maskEnvValue = (value) => {
  if (!value) return "MISSING";
  if (value.length < 15) return "******";
  return `${value.substring(0, 10)}...${value.substring(value.length - 5)}`;
};

export const logEnvStatus = () => {
  const { loaded, url, key, errors } = loadSupabaseEnv();
  
  console.groupCollapsed("🛡️ Supabase Environment Status");
  console.log(`Status: ${loaded ? "? LOADED" : "? MISSING / INVALID"}`);
  console.log(`URL: ${maskEnvValue(import.meta.env.VITE_SUPABASE_URL)}`);
  console.log(`Key: ${maskEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY)}`);
  
  if (!loaded) {
    console.error("Errors:", errors);
    console.warn(" ️ APP RUNNING IN SAFE MOCK MODE (DB Disconnected)");
  } else {
    console.log("? Safe Mode: INACTIVE (Normal Operation)");
  }
  console.groupEnd();
};

export const logEnvErrors = (errors) => {
  if (errors && errors.length > 0) {
    console.error("Environment Configuration Errors:", errors);
  }
};
