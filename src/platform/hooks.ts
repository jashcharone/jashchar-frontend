// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - PLATFORM HOOKS
// React hooks for platform features
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { platformService, Platform } from './index';
import { networkService } from './Network';
import { capacitorApp } from './CapacitorApp';
import { ConnectionStatus } from '@capacitor/network';

/**
 * Hook for platform detection
 */
export function usePlatform() {
  const [platform] = useState<Platform>(platformService.platform);

  return {
    platform,
    isNative: platformService.isNative,
    isWeb: platformService.isWeb,
    isAndroid: platformService.isAndroid,
    isIOS: platformService.isIOS,
    isTablet: platformService.isTablet(),
    isPWA: platformService.isPWAInstalled()
  };
}

/**
 * Hook for network status
 */
export function useNetwork() {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: true,
    connectionType: 'unknown'
  });
  const [quality, setQuality] = useState<'good' | 'poor' | 'offline'>('good');

  useEffect(() => {
    // Initialize
    networkService.initialize().then(() => {
      networkService.getStatus().then(setStatus);
    });

    // Subscribe to changes
    const unsubscribe = networkService.onStatusChange((newStatus) => {
      setStatus(newStatus);
      // Update quality when status changes
      if (newStatus.connected) {
        networkService.checkConnectionQuality().then(setQuality);
      } else {
        setQuality('offline');
      }
    });

    return unsubscribe;
  }, []);

  return {
    isConnected: status.connected,
    isWifi: status.connectionType === 'wifi',
    isCellular: status.connectionType === 'cellular',
    connectionType: status.connectionType,
    quality
  };
}

/**
 * Hook for back button handling (Android)
 */
export function useBackButton(handler: () => boolean | Promise<boolean>, deps: any[] = []) {
  useEffect(() => {
    if (!platformService.isAndroid) return;

    capacitorApp.initialize();
    const unsubscribe = capacitorApp.onBackButton(handler);

    return unsubscribe;
  }, deps);
}

/**
 * Hook for app state (foreground/background)
 */
export function useAppState() {
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!platformService.isNative) {
      // Web: Use visibility API
      const handleVisibilityChange = () => {
        setIsActive(!document.hidden);
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }

    // Native: Use Capacitor
    capacitorApp.initialize();
    const unsubscribe = capacitorApp.onAppStateChange((active) => {
      setIsActive(active);
    });

    return unsubscribe;
  }, []);

  return isActive;
}

/**
 * Hook for deep links
 */
export function useDeepLink(handler: (url: string) => void) {
  useEffect(() => {
    if (!platformService.isNative) return;

    capacitorApp.initialize();
    const unsubscribe = capacitorApp.onDeepLink(handler);

    return unsubscribe;
  }, [handler]);
}

/**
 * Hook for safe area insets
 */
export function useSafeArea() {
  const [insets, setInsets] = useState({ top: 0, bottom: 0, left: 0, right: 0 });

  useEffect(() => {
    // Set CSS safe area variables
    const root = document.documentElement;
    root.style.setProperty('--sat', 'env(safe-area-inset-top)');
    root.style.setProperty('--sab', 'env(safe-area-inset-bottom)');
    root.style.setProperty('--sal', 'env(safe-area-inset-left)');
    root.style.setProperty('--sar', 'env(safe-area-inset-right)');

    // Get computed values
    const computed = platformService.getSafeAreaInsets();
    setInsets(computed);
  }, []);

  return insets;
}

/**
 * Hook for keyboard visibility
 */
export function useKeyboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!platformService.isNative) {
      // Web: Detect keyboard via viewport resize (mobile browsers)
      const initialHeight = window.innerHeight;
      
      const handleResize = () => {
        const heightDiff = initialHeight - window.innerHeight;
        if (heightDiff > 150) { // Keyboard likely visible
          setIsVisible(true);
          setKeyboardHeight(heightDiff);
        } else {
          setIsVisible(false);
          setKeyboardHeight(0);
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    // Native: Use Capacitor Keyboard plugin
    import('@capacitor/keyboard').then(({ Keyboard }) => {
      Keyboard.addListener('keyboardWillShow', (info) => {
        setIsVisible(true);
        setKeyboardHeight(info.keyboardHeight);
      });

      Keyboard.addListener('keyboardWillHide', () => {
        setIsVisible(false);
        setKeyboardHeight(0);
      });
    });
  }, []);

  return { isVisible, keyboardHeight };
}

/**
 * Hook for status bar management
 */
export function useStatusBar() {
  const setBackgroundColor = useCallback(async (color: string) => {
    if (!platformService.isNative) return;
    
    const { StatusBar } = await import('@capacitor/status-bar');
    await StatusBar.setBackgroundColor({ color });
  }, []);

  const setStyle = useCallback(async (style: 'light' | 'dark') => {
    if (!platformService.isNative) return;
    
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ 
      style: style === 'dark' ? Style.Dark : Style.Light 
    });
  }, []);

  const hide = useCallback(async () => {
    if (!platformService.isNative) return;
    
    const { StatusBar } = await import('@capacitor/status-bar');
    await StatusBar.hide();
  }, []);

  const show = useCallback(async () => {
    if (!platformService.isNative) return;
    
    const { StatusBar } = await import('@capacitor/status-bar');
    await StatusBar.show();
  }, []);

  return { setBackgroundColor, setStyle, hide, show };
}
