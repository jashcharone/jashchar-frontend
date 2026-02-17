// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - MOBILE LAYOUT WRAPPER
// Wraps content with mobile-specific navigation and header
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { platformService } from '@/platform';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import MobileBottomNav from './MobileBottomNav';
import MobileHeader from './MobileHeader';

// Pages where we should NOT show mobile nav (public pages, login, etc.)
const HIDE_NAV_PATHS = [
  '/',
  '/login',
  '/school-login',
  '/forgot-password',
  '/reset-password',
  '/register',
  '/signup',
  '/demo',
  '/public',
  '/s/', // School public pages
];

// Pages where header should be transparent
const TRANSPARENT_HEADER_PATHS = [
  '/profile',
];

export function MobileLayout({ 
  children,
  userRole,
  unreadMessages = 0,
  unreadNotifications = 0 
}) {
  const location = useLocation();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if we're on mobile/capacitor
  const isMobile = platformService.isNative || platformService.isMobileWeb;

  // Check if we should show navigation
  const shouldShowNav = () => {
    const path = location.pathname;
    return !HIDE_NAV_PATHS.some(hidePath => 
      path === hidePath || path.startsWith(hidePath)
    );
  };

  // Check if header should be transparent
  const isTransparentHeader = () => {
    return TRANSPARENT_HEADER_PATHS.some(p => 
      location.pathname.startsWith(p)
    );
  };

  // Initialize mobile-specific features
  useEffect(() => {
    if (!platformService.isNative) {
      setIsInitialized(true);
      return;
    }

    const initMobile = async () => {
      try {
        // Configure status bar
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
        
        // Listen to keyboard events
        Keyboard.addListener('keyboardWillShow', () => {
          setKeyboardVisible(true);
        });
        
        Keyboard.addListener('keyboardWillHide', () => {
          setKeyboardVisible(false);
        });

        setIsInitialized(true);
      } catch (e) {
        console.log('[MobileLayout] Init error:', e);
        setIsInitialized(true);
      }
    };

    initMobile();

    return () => {
      Keyboard.removeAllListeners();
    };
  }, []);

  // Don't render mobile chrome for non-mobile
  if (!isMobile) {
    return <>{children}</>;
  }

  const showNav = shouldShowNav();
  const showHeader = showNav; // For now, same logic

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile Header - only on authenticated pages */}
      {showHeader && (
        <MobileHeader
          showMenu={true}
          showSearch={true}
          showNotifications={true}
          notificationCount={unreadNotifications}
          transparent={isTransparentHeader()}
        />
      )}

      {/* Main Content - with padding for header/nav */}
      <main 
        className={cn(
          "transition-all duration-200",
          showHeader && "pt-14", // Header height
          showNav && !keyboardVisible && "pb-16", // Bottom nav height
        )}
        style={{
          paddingTop: showHeader ? 'calc(56px + env(safe-area-inset-top, 0px))' : undefined,
          paddingBottom: showNav && !keyboardVisible 
            ? 'calc(64px + env(safe-area-inset-bottom, 0px))' 
            : undefined
        }}
      >
        {children}
      </main>

      {/* Bottom Navigation - hide when keyboard is visible */}
      {showNav && !keyboardVisible && (
        <MobileBottomNav
          userRole={userRole}
          unreadMessages={unreadMessages}
          unreadNotifications={unreadNotifications}
        />
      )}
    </div>
  );
}

export default MobileLayout;
