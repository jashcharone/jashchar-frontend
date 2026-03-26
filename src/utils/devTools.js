// 🧠 Jashchar Debug Helper Toolkit
// Version: 1.0 � Made for instant issue detection in React + Supabase apps

import { supabase } from "@/lib/customSupabaseClient";

/**
 * ? Basic Debug Logger
 * Use anywhere: debug("User Session", session);
 */
export const debug = (label, data) => {
  try {
    const value = typeof data === "object" ? JSON.stringify(data, null, 2) : data;
    console.log(`%c🧩 ${label}:`, "color:#3b82f6; font-weight:bold;", value);
  } catch (err) {
    console.log(` ️ ${label} (error parsing):`, data);
  }
};

/**
 * ? Auth Checker
 * Quickly log Supabase user + session
 */
export const checkAuth = async () => {
  console.group("%c🟢 Supabase Auth Check", "color:green; font-weight:bold;");
  const { data, error } = await supabase.auth.getSession();
  if (error) console.error("Auth error:", error);
  else if (data?.session) {
    console.log("? Session Active:", data.session);
    console.log("👤 User:", data.session.user);
  } else console.warn(" ️ No active User Session (Not Logged In).");
  console.groupEnd();
};

/**
 * ? Query Inspector
 * Wrap any Supabase query to log result + timing
 * Example:
 *   await inspectQuery("Fetch Schools", supabase.from('schools').select('*'));
 */
export const inspectQuery = async (label, queryPromise) => {
  const start = performance.now();
  const { data, error } = await queryPromise;
  const time = (performance.now() - start).toFixed(2);
  console.group(`?️ ${label} (${time} ms)`);
  if (error) console.error("? Error:", error);
  else console.log("? Data:", data);
  console.groupEnd();
  return { data, error };
};

/**
 * ? Route Logger
 * Track navigation changes instantly
 * Place this inside your Layout or Router component
 */
export const trackRoutes = (navigate, location) => {
  console.log(`📍 Navigated to: ${location.pathname}`);
};

/**
 * ? Performance Snapshot
 * Run once to check app performance stats
 */
export const performanceStats = () => {
  console.group("📊 Performance Snapshot");
  console.log("JS Heap Size:", performance.memory?.usedJSHeapSize || "N/A");
  console.log("User Agent:", navigator.userAgent);
  console.log("Time:", new Date().toLocaleTimeString());
  console.groupEnd();
};

/**
 * ? Auto Debug Init
 * You can call initDevTools() at app start
 * Example: in main.jsx, inside useEffect(() => initDevTools(), []);
 */
export const initDevTools = () => {
  console.log("%c🚀 DevTools Initialized � Debug Mode ON", "color:#22c55e; font-weight:bold;");
  checkAuth();
  performanceStats();
};
