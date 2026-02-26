// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - MOBILE APP SHELL
// Global wrapper for Capacitor native: shows MobileBottomNav on ALL pages.
// Renders nothing on web (website is unaffected).
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';

// Public routes where bottom nav should NOT appear
const PUBLIC_ROUTES = ['/', '/login', '/forgot-password', '/reset-password', '/update-password', '/demo', '/demo-login', '/register-school', '/register-organization', '/signup', '/school-login'];

/** Detect Capacitor native (triple-check) */
const isCapacitorNative = (() => {
  try { if (Capacitor.isNativePlatform()) return true; } catch (e) { /* ignore */ }
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) return true;
  if (typeof window !== 'undefined' && window.location.hostname === 'app.jashchar.local') return true;
  return false;
})();

/**
 * MobileAppShell — renders the bottom navigation on ALL pages in the 
 * Capacitor native app (except login/public). On web, renders nothing.
 * 
 * Place this inside PermissionProvider (MobileBottomNav uses usePermissions).
 */
const MobileAppShell = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Only show on Capacitor native
  if (!isCapacitorNative) return null;

  // Only show when user is authenticated
  if (!user) return null;

  // Don't show on public/login pages  
  const path = location.pathname.toLowerCase();
  if (PUBLIC_ROUTES.some(r => path === r || path === r + '/')) return null;

  return <MobileBottomNav />;
};

export default MobileAppShell;
