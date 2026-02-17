// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - BRANDING HOOKS
// React hooks for branding management
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { brandingService } from './BrandingService';
import { TenantBranding, defaultBranding } from './brandingSchema';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Branding Context
 */
interface BrandingContextType {
  branding: TenantBranding;
  loading: boolean;
  error: Error | null;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  loading: false,
  error: null,
  refreshBranding: async () => {}
});

/**
 * Branding Provider Component
 */
export function BrandingProvider({ children }: { children: ReactNode }) {
  const { organizationId } = useAuth();
  const [branding, setBranding] = useState<TenantBranding>(defaultBranding);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadBranding = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let fetchedBranding: TenantBranding;

      if (organizationId) {
        // Load by organization ID
        fetchedBranding = await brandingService.getBrandingByOrganization(organizationId);
      } else {
        // Try domain-based detection (for web)
        const domain = window.location.hostname;
        if (domain && domain !== 'localhost' && !domain.includes('127.0.0.1')) {
          fetchedBranding = await brandingService.getBrandingByDomain(domain);
        } else {
          fetchedBranding = defaultBranding;
        }
      }

      // Apply branding
      brandingService.applyBranding(fetchedBranding);
      setBranding(fetchedBranding);

    } catch (err) {
      console.error('[useBranding] Error:', err);
      setError(err as Error);
      setBranding(defaultBranding);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  return (
    <BrandingContext.Provider
      value={{
        branding,
        loading,
        error,
        refreshBranding: loadBranding
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

/**
 * Hook to access branding
 */
export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within BrandingProvider');
  }
  return context;
}

/**
 * Hook for branded colors
 */
export function useBrandedColors() {
  const { branding } = useBranding();
  return branding.colors;
}

/**
 * Hook for app details
 */
export function useAppDetails() {
  const { branding } = useBranding();
  return branding.appDetails;
}

/**
 * Hook for feature flags
 */
export function useBrandedFeatures() {
  const { branding } = useBranding();
  return branding.features;
}

/**
 * Hook for branded logo
 */
export function useBrandedLogo() {
  const { branding } = useBranding();
  return branding.logo;
}
