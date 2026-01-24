import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fexjccrkgaeafyimpobv.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleGpjY3JrZ2FlYWZ5aW1wb2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTU2Mzk0MjAsImV4cCI6MjAxMTIxNTQyMH0.nfsTrq4N8tZ-uf-t_nS_2-v-cWl-pA3i2s5D_3j_yac";

// ✅ Always use the same client with session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,       // <-- saves login in browser localStorage
    autoRefreshToken: true,     // <-- keeps session alive automatically
    detectSessionInUrl: true,   // <-- reads token after redirect if needed
    storageKey: "supabase.auth.token", // optional custom key
  },
});
