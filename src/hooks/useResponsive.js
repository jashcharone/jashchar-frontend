// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - Responsive Hook
// Detects screen size, orientation, and device type for consistent responsive behavior
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';

/**
 * Breakpoint definitions (matches tailwind.config.js)
 */
export const BREAKPOINTS = {
  sm: 640,      // Mobile landscape
  md: 768,      // Tablet portrait
  tablet: 900,  // Tablet landscape / small laptops
  lg: 1024,     // Desktop / iPad Pro landscape
  xl: 1280,     // Large desktop
  '2xl': 1536,  // Extra large
};

/**
 * Custom hook for responsive design
 * Provides consistent device detection across the app
 */
export function useResponsive() {
  const getState = useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: false,
        isTabletPortrait: false,
        isTabletLandscape: false,
        isDesktop: true,
        isLandscape: true,
        isPortrait: false,
        isTouchDevice: false,
        breakpoint: 'lg',
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Device type detection
    const isMobile = width < BREAKPOINTS.md;
    const isTabletPortrait = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg && !isLandscape;
    const isTabletLandscape = width >= BREAKPOINTS.md && width < BREAKPOINTS.xl && isLandscape && height < 900;
    const isTablet = isTabletPortrait || isTabletLandscape;
    const isDesktop = !isMobile && !isTablet;

    // Current breakpoint
    let breakpoint = 'xs';
    if (width >= BREAKPOINTS['2xl']) breakpoint = '2xl';
    else if (width >= BREAKPOINTS.xl) breakpoint = 'xl';
    else if (width >= BREAKPOINTS.lg) breakpoint = 'lg';
    else if (width >= BREAKPOINTS.tablet) breakpoint = 'tablet';
    else if (width >= BREAKPOINTS.md) breakpoint = 'md';
    else if (width >= BREAKPOINTS.sm) breakpoint = 'sm';

    return {
      width,
      height,
      isMobile,
      isTablet,
      isTabletPortrait,
      isTabletLandscape,
      isDesktop,
      isLandscape,
      isPortrait: !isLandscape,
      isTouchDevice,
      breakpoint,
    };
  }, []);

  const [state, setState] = useState(getState);

  useEffect(() => {
    const handleResize = () => {
      setState(getState());
    };

    // Debounce resize events
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', () => {
      // Delay to allow orientation change to complete
      setTimeout(handleResize, 150);
    });

    // Initial state
    handleResize();

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timeoutId);
    };
  }, [getState]);

  return state;
}

/**
 * Hook to check if current breakpoint is at or above a given breakpoint
 * @param {string} breakpoint - 'sm' | 'md' | 'tablet' | 'lg' | 'xl' | '2xl'
 */
export function useBreakpoint(breakpoint) {
  const { width } = useResponsive();
  return width >= (BREAKPOINTS[breakpoint] || 0);
}

/**
 * Hook specifically for sidebar behavior
 * Returns whether sidebar should be in drawer mode (overlay) or fixed mode
 */
export function useSidebarMode() {
  const { isMobile, isTabletPortrait, isLandscape, width } = useResponsive();
  
  // Drawer mode for:
  // - Mobile phones
  // - Tablets in portrait
  // Fixed mode for:
  // - Tablets in landscape
  // - Desktop
  const isDrawerMode = isMobile || isTabletPortrait;
  const shouldAutoExpand = width >= BREAKPOINTS.lg;
  
  return {
    isDrawerMode,
    shouldAutoExpand,
  };
}

export default useResponsive;
