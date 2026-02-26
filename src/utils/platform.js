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

export default {
  isNativePlatform,
  getPlatform,
  isAndroid,
  isIOS,
  isWeb,
  isPluginAvailable,
  isTablet,
  getSafeAreaInsets,
};
