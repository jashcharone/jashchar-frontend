// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - MOBILE HOOKS
// Custom hooks for mobile-specific functionality
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { platformService } from '@/platform';

/**
 * Hook to detect if running on mobile
 */
export function useMobileDetect() {
  const [isMobile, setIsMobile] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState('web');

  useEffect(() => {
    setIsMobile(platformService.isMobileWeb || platformService.isNative);
    setIsNative(platformService.isNative);
    setPlatform(platformService.platform);
  }, []);

  return { isMobile, isNative, platform };
}

/**
 * Hook for haptic feedback
 */
export function useHapticFeedback() {
  const isNative = platformService.isNative;

  // Light impact - for button taps
  const lightTap = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Haptics not available
    }
  }, [isNative]);

  // Medium impact - for important actions
  const mediumTap = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {}
  }, [isNative]);

  // Heavy impact - for destructive actions
  const heavyTap = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {}
  }, [isNative]);

  // Selection change - for list selections
  const selectionTap = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.selectionChanged();
    } catch (e) {}
  }, [isNative]);

  // Success notification
  const successVibrate = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {}
  }, [isNative]);

  // Warning notification
  const warningVibrate = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (e) {}
  }, [isNative]);

  // Error notification
  const errorVibrate = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (e) {}
  }, [isNative]);

  return {
    lightTap,
    mediumTap,
    heavyTap,
    selectionTap,
    successVibrate,
    warningVibrate,
    errorVibrate,
    isHapticsAvailable: isNative
  };
}

/**
 * Hook for pull-to-refresh functionality
 */
export function usePullToRefresh(onRefresh, enabled = true) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const THRESHOLD = 80;

  const handleTouchStart = useCallback((e) => {
    if (!enabled || window.scrollY > 0) return;
    // Track start position
  }, [enabled]);

  const handleTouchMove = useCallback((e) => {
    if (!enabled || window.scrollY > 0) return;
    // Calculate pull distance
  }, [enabled]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > THRESHOLD && onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  }, [pullDistance, onRefresh]);

  return {
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(pullDistance / THRESHOLD, 1),
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
}

/**
 * Hook for keyboard visibility
 */
export function useKeyboardVisibility() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!platformService.isNative) return;

    const loadKeyboard = async () => {
      try {
        const { Keyboard } = await import('@capacitor/keyboard');
        
        Keyboard.addListener('keyboardWillShow', (info) => {
          setIsKeyboardVisible(true);
          setKeyboardHeight(info.keyboardHeight);
        });

        Keyboard.addListener('keyboardWillHide', () => {
          setIsKeyboardVisible(false);
          setKeyboardHeight(0);
        });

        return () => {
          Keyboard.removeAllListeners();
        };
      } catch (e) {
        // Keyboard plugin not available
      }
    };

    loadKeyboard();
  }, []);

  return { isKeyboardVisible, keyboardHeight };
}

/**
 * Hook for safe area insets
 */
export function useSafeArea() {
  const [insets, setInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });

  useEffect(() => {
    const computeInsets = () => {
      const style = getComputedStyle(document.documentElement);
      setInsets({
        top: parseInt(style.getPropertyValue('--sat') || '0', 10) || 
             parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0', 10),
        bottom: parseInt(style.getPropertyValue('--sab') || '0', 10) ||
                parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10),
        left: parseInt(style.getPropertyValue('--sal') || '0', 10) ||
              parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0', 10),
        right: parseInt(style.getPropertyValue('--sar') || '0', 10) ||
               parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0', 10)
      });
    };

    computeInsets();
    window.addEventListener('resize', computeInsets);
    return () => window.removeEventListener('resize', computeInsets);
  }, []);

  return insets;
}
