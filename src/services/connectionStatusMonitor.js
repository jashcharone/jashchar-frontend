import { diagnoseSupabaseConnection } from "./supabaseConnectionDiagnostic";
import { disableReadOnlyMode, enableReadOnlyMode } from "./safeRecoveryManager";
import { Capacitor } from '@capacitor/core';

let monitorInterval = null;
let isMonitoring = false;
let consecutiveFailures = 0;
const FAILURE_THRESHOLD = 3; // Require 3 consecutive failures before read-only mode

/**
 * Check if running inside Capacitor native (Android/iOS).
 * On native, CapacitorHttp handles all networking through the native layer,
 * and direct Supabase PostgREST queries from the WebView can give false
 * negatives. So we skip the connection monitor entirely on native.
 */
const _isNative = () => {
  try { if (Capacitor.isNativePlatform()) return true; } catch (e) { /* ignore */ }
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) return true;
  if (typeof window !== 'undefined' && window.location.hostname === 'app.jashchar.local') return true;
  return false;
};

export const getConnectionStatus = async () => {
  // On Capacitor native, always report healthy (native HTTP handles connectivity)
  if (_isNative()) {
    return { status: 'HEALTHY', message: 'Native app - monitoring skipped' };
  }
  const result = await diagnoseSupabaseConnection();
  return result;
};

export const startMonitoring = (onStatusChange) => {
  if (isMonitoring) return;

  // Skip monitoring entirely on Capacitor native
  if (_isNative()) {
    console.log('[ConnectionMonitor] Skipped — running on Capacitor native');
    isMonitoring = true;
    // Ensure read-only mode is OFF on native
    if (typeof window !== 'undefined' && window['__SAFE_READ_ONLY_MODE']) {
      disableReadOnlyMode();
      if (onStatusChange) onStatusChange(true);
    }
    return;
  }

  isMonitoring = true;

  monitorInterval = setInterval(async () => {
    const result = await getConnectionStatus();
    
    if (result.status === 'HEALTHY' || result.status === 'HEALTHY_WITH_WARNINGS') {
      consecutiveFailures = 0;
      if (typeof window !== 'undefined' && window['__SAFE_READ_ONLY_MODE']) {
         disableReadOnlyMode();
         if (onStatusChange) onStatusChange(true);
      }
    } else {
       consecutiveFailures++;
       if (consecutiveFailures >= FAILURE_THRESHOLD && typeof window !== 'undefined' && !window['__SAFE_READ_ONLY_MODE']) {
         enableReadOnlyMode();
         if (onStatusChange) onStatusChange(false);
       }
    }
  }, 30000); // Check every 30s
};

export const stopMonitoring = () => {
  if (monitorInterval) clearInterval(monitorInterval);
  isMonitoring = false;
};
