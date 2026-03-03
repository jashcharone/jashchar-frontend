// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - useIsMobile Hook
// Shared hook for responsive breakpoint detection
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';

/**
 * Detect if screen is mobile, tablet, or desktop
 * @param {number} breakpoint - Mobile breakpoint (default: 768)
 * @returns {{ isMobile: boolean, isTablet: boolean, isDesktop: boolean, width: number }}
 */
export function useIsMobile(breakpoint = 768) {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return {
    isMobile: width <= breakpoint,
    isTablet: width > breakpoint && width <= 1024,
    isDesktop: width > 1024,
    width,
  };
}

export default useIsMobile;
