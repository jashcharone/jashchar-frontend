// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - Enhanced Responsive Hook v2.0
// Detects screen size, orientation, and device type for consistent responsive behavior
// Supports: 320px Mobile S to 4K Ultra-wide (2560px+)
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Extended breakpoint definitions (matches tailwind.config.js & responsive.css)
 */
export const BREAKPOINTS = {
  xs: 375,      // Mobile S (iPhone SE, Galaxy Fold)
  sm: 640,      // Mobile L landscape
  md: 768,      // Tablet portrait (iPad)
  tablet: 900,  // Tablet landscape / small laptops
  lg: 1024,     // Desktop / iPad Pro landscape
  xl: 1280,     // Large desktop
  '2xl': 1536,  // Extra large
  '3xl': 1920,  // Full HD monitors
  '4xl': 2560,  // 4K / Ultra-wide
};

/**
 * Device categories for easy reference
 */
export const DEVICE_CATEGORIES = {
  mobileS: { min: 0, max: 374 },
  mobileM: { min: 375, max: 424 },
  mobileL: { min: 425, max: 639 },
  tablet: { min: 640, max: 1023 },
  laptop: { min: 1024, max: 1439 },
  laptopL: { min: 1440, max: 1919 },
  desktop4K: { min: 1920, max: Infinity },
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

    // Device type detection (enhanced)
    const isMobileS = width < BREAKPOINTS.xs;
    const isMobile = width < BREAKPOINTS.md;
    const isTabletPortrait = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg && !isLandscape;
    const isTabletLandscape = width >= BREAKPOINTS.md && width < BREAKPOINTS.xl && isLandscape && height < 900;
    const isTablet = isTabletPortrait || isTabletLandscape;
    const isDesktop = !isMobile && !isTablet;
    const isLargeDesktop = width >= BREAKPOINTS['2xl'];
    const is4K = width >= BREAKPOINTS['3xl'];
    const isUltraWide = width >= BREAKPOINTS['4xl'];

    // Current breakpoint (enhanced with all breakpoints)
    let breakpoint = 'xs';
    if (width >= BREAKPOINTS['4xl']) breakpoint = '4xl';
    else if (width >= BREAKPOINTS['3xl']) breakpoint = '3xl';
    else if (width >= BREAKPOINTS['2xl']) breakpoint = '2xl';
    else if (width >= BREAKPOINTS.xl) breakpoint = 'xl';
    else if (width >= BREAKPOINTS.lg) breakpoint = 'lg';
    else if (width >= BREAKPOINTS.tablet) breakpoint = 'tablet';
    else if (width >= BREAKPOINTS.md) breakpoint = 'md';
    else if (width >= BREAKPOINTS.sm) breakpoint = 'sm';
    else if (width >= BREAKPOINTS.xs) breakpoint = 'xs';
    else breakpoint = 'xxs'; // Below 375px (very small devices)

    // Device category detection
    let deviceCategory = 'mobileS';
    if (width >= 1920) deviceCategory = 'desktop4K';
    else if (width >= 1440) deviceCategory = 'laptopL';
    else if (width >= 1024) deviceCategory = 'laptop';
    else if (width >= 640) deviceCategory = 'tablet';
    else if (width >= 425) deviceCategory = 'mobileL';
    else if (width >= 375) deviceCategory = 'mobileM';

    return {
      // Dimensions
      width,
      height,
      
      // Device types
      isMobileS,
      isMobile,
      isTablet,
      isTabletPortrait,
      isTabletLandscape,
      isDesktop,
      isLargeDesktop,
      is4K,
      isUltraWide,
      
      // Orientation
      isLandscape,
      isPortrait: !isLandscape,
      
      // Input type
      isTouchDevice,
      
      // Breakpoint info
      breakpoint,
      deviceCategory,
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
 * @param {string} breakpoint - 'xs' | 'sm' | 'md' | 'tablet' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
 */
export function useBreakpoint(breakpoint) {
  const { width } = useResponsive();
  return width >= (BREAKPOINTS[breakpoint] || 0);
}

/**
 * Hook to check if width is between two breakpoints
 * @param {string} min - minimum breakpoint
 * @param {string} max - maximum breakpoint
 */
export function useBreakpointBetween(min, max) {
  const { width } = useResponsive();
  const minWidth = BREAKPOINTS[min] || 0;
  const maxWidth = BREAKPOINTS[max] || Infinity;
  return width >= minWidth && width < maxWidth;
}

/**
 * Hook for custom media query
 * @param {string} query - CSS media query string (e.g., '(min-width: 768px)')
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    
    // Modern API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    // Legacy API
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, [query]);

  return matches;
}

/**
 * Hook to get recommended grid columns for current screen size
 * @param {Object} columns - { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }
 */
export function useGridColumns(columns = {}) {
  const { breakpoint } = useResponsive();
  
  const defaultColumns = {
    xxs: 1,
    xs: 1,
    sm: 2,
    md: 2,
    tablet: 3,
    lg: 4,
    xl: 4,
    '2xl': 5,
    '3xl': 6,
    '4xl': 6,
    ...columns,
  };
  
  return defaultColumns[breakpoint] || 1;
}

/**
 * Hook to get responsive font size class
 * Based on responsive.css fluid typography
 */
export function useFluidTextSize() {
  const { deviceCategory } = useResponsive();
  
  const sizeMap = {
    mobileS: 'text-sm',
    mobileM: 'text-sm',
    mobileL: 'text-base',
    tablet: 'text-base',
    laptop: 'text-base',
    laptopL: 'text-lg',
    desktop4K: 'text-lg',
  };
  
  return sizeMap[deviceCategory] || 'text-base';
}

/**
 * Hook for responsive padding/spacing
 */
export function useFluidSpacing() {
  const { breakpoint, is4K } = useResponsive();
  
  // Returns Tailwind spacing classes based on breakpoint
  const spacingMap = {
    xxs: { p: 'p-2', px: 'px-2', py: 'py-2', gap: 'gap-2' },
    xs: { p: 'p-2', px: 'px-3', py: 'py-2', gap: 'gap-2' },
    sm: { p: 'p-3', px: 'px-4', py: 'py-3', gap: 'gap-3' },
    md: { p: 'p-4', px: 'px-4', py: 'py-3', gap: 'gap-4' },
    tablet: { p: 'p-4', px: 'px-5', py: 'py-4', gap: 'gap-4' },
    lg: { p: 'p-5', px: 'px-6', py: 'py-4', gap: 'gap-5' },
    xl: { p: 'p-6', px: 'px-6', py: 'py-5', gap: 'gap-6' },
    '2xl': { p: 'p-6', px: 'px-8', py: 'py-6', gap: 'gap-6' },
    '3xl': { p: 'p-8', px: 'px-10', py: 'py-6', gap: 'gap-8' },
    '4xl': { p: 'p-10', px: 'px-12', py: 'py-8', gap: 'gap-10' },
  };
  
  return spacingMap[breakpoint] || spacingMap.md;
}

/**
 * Hook specifically for sidebar behavior
 * Returns whether sidebar should be in drawer mode (overlay) or fixed mode
 */
export function useSidebarMode() {
  const { isMobile, isTablet, isTabletPortrait, isLandscape, width } = useResponsive();
  
  // Drawer mode (overlay sidebar) for:
  // - Mobile phones (< 768px)
  // - All tablets (768px - 1024px) - BOTH portrait AND landscape
  //   (Tablets don't have enough space for fixed sidebar)
  // Fixed sidebar for:
  // - Desktop/Laptop (>= 1024px)
  const isDrawerMode = isMobile || isTablet;
  const shouldAutoExpand = width >= BREAKPOINTS.lg;
  
  return {
    isDrawerMode,
    shouldAutoExpand,
  };
}

/**
 * Hook for table display mode
 * Returns whether to show cards or table based on screen size
 */
export function useTableDisplayMode() {
  const { isMobile, isTablet, width } = useResponsive();
  
  // Card mode for mobile, table for larger screens
  const showCards = isMobile;
  const showCompactTable = width >= BREAKPOINTS.sm && width < BREAKPOINTS.lg;
  const showFullTable = width >= BREAKPOINTS.lg;
  
  return {
    showCards,
    showCompactTable,
    showFullTable,
    mode: showCards ? 'cards' : showCompactTable ? 'compact' : 'full',
  };
}

/**
 * Hook to get container max-width class for current screen
 */
export function useContainerWidth() {
  const { is4K, isUltraWide, breakpoint } = useResponsive();
  
  if (isUltraWide) return 'max-w-[2200px]';
  if (is4K) return 'max-w-[1800px]';
  
  const widthMap = {
    xxs: 'max-w-full',
    xs: 'max-w-full',
    sm: 'max-w-full',
    md: 'max-w-3xl',
    tablet: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    '3xl': 'max-w-[1600px]',
    '4xl': 'max-w-[1800px]',
  };
  
  return widthMap[breakpoint] || 'max-w-full';
}

export default useResponsive;
