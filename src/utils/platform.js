// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - Platform Detection Utility
// Detects whether app is running in Capacitor (Android/iOS) or Web browser
// ═══════════════════════════════════════════════════════════════════════════

import { Capacitor } from '@capacitor/core';

/**
 * Check if running inside Capacitor native shell (Android/iOS)
 */
export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Get current platform: 'android' | 'ios' | 'web'
 */
export const getPlatform = () => {
  return Capacitor.getPlatform();
};

/**
 * Check if running on Android
 */
export const isAndroid = () => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Check if running on iOS
 */
export const isIOS = () => {
  return Capacitor.getPlatform() === 'ios';
};

/**
 * Check if running in web browser
 */
export const isWeb = () => {
  return Capacitor.getPlatform() === 'web';
};

/**
 * Check if a Capacitor plugin is available on the current platform
 * @param {string} pluginName - Name of the plugin (e.g., 'Camera', 'Filesystem')
 */
export const isPluginAvailable = (pluginName) => {
  return Capacitor.isPluginAvailable(pluginName);
};

/**
 * Check if device is likely a tablet based on screen size
 * Works on both web and native
 */
export const isTablet = () => {
  const width = window.screen.width;
  const height = window.screen.height;
  const minDimension = Math.min(width, height);
  // Tablets typically have a minimum dimension of 600px+
  return minDimension >= 600;
};

/**
 * Get safe area insets for notch devices
 * Returns CSS env() values
 */
export const getSafeAreaInsets = () => {
  return {
    top: 'env(safe-area-inset-top, 0px)',
    bottom: 'env(safe-area-inset-bottom, 0px)',
    left: 'env(safe-area-inset-left, 0px)',
    right: 'env(safe-area-inset-right, 0px)',
  };
};

/**
 * Get the correct API base URL based on platform.
 * - Web (localhost): uses VITE_API_BASE_URL (e.g., http://localhost:5000)
 * - Web (production/Vercel): uses '' (relative /api, Vercel rewrites to Railway)
 * - Capacitor (Android/iOS): uses the Railway backend URL directly
 *   because there is no Vercel rewrite layer inside a WebView.
 *
 * IMPORTANT: Do NOT use import.meta.env.VITE_API_BASE_URL for native builds!
 * Vite bakes the .env value (http://localhost:5000) into the JS at build time,
 * which points to the developer's machine, not the production backend.
 */

// Production Railway backend URL (the single source of truth for mobile)
const RAILWAY_BACKEND_URL = 'https://web-production-971d3.up.railway.app';

/**
 * Check if we are inside a Capacitor WebView.
 * Uses multiple detection methods for reliability:
 * 1. Capacitor.isNativePlatform() from @capacitor/core
 * 2. window.Capacitor injected by native bridge
 * 3. Hostname check (capacitor.config.ts sets hostname to 'app.jashchar.local')
 */
const isCapacitorApp = () => {
  try {
    // Method 1: Official Capacitor API
    if (Capacitor.isNativePlatform()) return true;
  } catch (e) { /* ignore */ }

  // Method 2: Direct window check (native bridge injects this)
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) return true;

  // Method 3: Hostname detection (set in capacitor.config.ts)
  if (typeof window !== 'undefined' && window.location.hostname === 'app.jashchar.local') return true;

  return false;
};

export const getApiBaseUrl = () => {
  // Capacitor native app → must use full production backend URL
  if (isCapacitorApp()) {
    // 1. Runtime override (can be set after build)
    const runtime = (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) || {};
    if (runtime.VITE_CAPACITOR_API_URL) return runtime.VITE_CAPACITOR_API_URL;

    // 2. Dedicated Capacitor env var (not the localhost dev one)
    if (import.meta.env.VITE_CAPACITOR_API_URL) return import.meta.env.VITE_CAPACITOR_API_URL;

    // 3. Production Railway backend (hardcoded fallback)
    // NOTE: We intentionally skip VITE_API_BASE_URL here because it contains
    // http://localhost:5000 which doesn't work on a phone/emulator.
    console.log('[Platform] Capacitor detected → using Railway URL:', RAILWAY_BACKEND_URL);
    return RAILWAY_BACKEND_URL;
  }

  // Web browser
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (isLocalhost) {
    const runtime = (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) || {};
    return runtime.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || '';
  }

  // Production web (Vercel) → relative path, Vercel rewrites to Railway
  return '';
};

export default {
  isNativePlatform,
  getPlatform,
  isAndroid,
  isIOS,
  isWeb,
  isPluginAvailable,
  isTablet,
  getSafeAreaInsets,
  getApiBaseUrl,
};
