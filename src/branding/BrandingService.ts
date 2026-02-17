// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - BRANDING SERVICE
// Runtime branding management for white-label multi-tenant apps
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '@/lib/supabase';
import { TenantBranding, defaultBranding, mergeBranding } from './brandingSchema';
import { secureStorage } from '@/platform/SecureStorage';

/**
 * Branding service for runtime theming
 */
class BrandingService {
  private cache: Map<string, TenantBranding> = new Map();
  private currentBranding: TenantBranding = defaultBranding;
  private isApplied = false;

  /**
   * Get branding by organization ID
   */
  async getBrandingByOrganization(organizationId: string): Promise<TenantBranding> {
    // Check memory cache
    if (this.cache.has(organizationId)) {
      return this.cache.get(organizationId)!;
    }

    // Check local storage cache
    const cached = await secureStorage.get<TenantBranding>(`branding_${organizationId}`);
    if (cached) {
      this.cache.set(organizationId, cached);
      return cached;
    }

    // Fetch from database
    try {
      const { data, error } = await supabase
        .from('organization_branding')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (error || !data) {
        console.warn('[Branding] No branding found for org, using default');
        return defaultBranding;
      }

      const branding = this.mapFromDatabase(data);
      
      // Cache locally
      this.cache.set(organizationId, branding);
      await secureStorage.set(`branding_${organizationId}`, branding);

      return branding;
    } catch (err) {
      console.error('[Branding] Failed to fetch:', err);
      return defaultBranding;
    }
  }

  /**
   * Get branding by custom domain
   */
  async getBrandingByDomain(domain: string): Promise<TenantBranding> {
    try {
      const { data, error } = await supabase
        .from('organization_domains')
        .select(`
          organization_id,
          organizations(
            id,
            name,
            organization_branding(*)
          )
        `)
        .eq('domain', domain)
        .single();

      if (error || !data) {
        return defaultBranding;
      }

      const brandingData = (data as any).organizations?.organization_branding?.[0];
      if (!brandingData) return defaultBranding;

      return this.mapFromDatabase(brandingData);
    } catch (err) {
      console.error('[Branding] Domain lookup failed:', err);
      return defaultBranding;
    }
  }

  /**
   * Apply branding to the application
   */
  applyBranding(branding: TenantBranding): void {
    this.currentBranding = branding;
    const root = document.documentElement;

    // Apply colors as CSS variables
    root.style.setProperty('--color-primary', branding.colors.primary);
    root.style.setProperty('--color-primary-light', branding.colors.primaryLight);
    root.style.setProperty('--color-primary-dark', branding.colors.primaryDark);
    root.style.setProperty('--color-secondary', branding.colors.secondary);
    root.style.setProperty('--color-accent', branding.colors.accent);
    root.style.setProperty('--color-background', branding.colors.background);
    root.style.setProperty('--color-surface', branding.colors.surface);
    root.style.setProperty('--color-error', branding.colors.error);
    root.style.setProperty('--color-success', branding.colors.success);
    root.style.setProperty('--color-warning', branding.colors.warning);
    root.style.setProperty('--color-info', branding.colors.info);
    root.style.setProperty('--color-text-primary', branding.colors.text.primary);
    root.style.setProperty('--color-text-secondary', branding.colors.text.secondary);
    root.style.setProperty('--color-text-disabled', branding.colors.text.disabled);
    root.style.setProperty('--color-text-inverse', branding.colors.text.inverse);

    // Apply typography
    root.style.setProperty('--font-family', branding.typography.fontFamily);
    root.style.setProperty('--font-heading', branding.typography.headingFont);

    // Apply to Tailwind CSS primary colors
    this.applyTailwindColors(branding.colors);

    // Update document title
    document.title = branding.appDetails.appName;

    // Update meta theme-color (for browser/mobile)
    this.updateMetaTheme(branding.colors.primary);

    // Update status bar on native
    this.updateStatusBar(branding.colors.primary);

    this.isApplied = true;
    console.log('[Branding] Applied:', branding.organizationName);
  }

  /**
   * Apply colors to Tailwind CSS
   */
  private applyTailwindColors(colors: TenantBranding['colors']): void {
    const root = document.documentElement;
    
    // Convert hex to HSL for Tailwind
    const primaryHSL = this.hexToHSL(colors.primary);
    root.style.setProperty('--primary', `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`);
    root.style.setProperty('--primary-foreground', colors.text.inverse);
    
    const secondaryHSL = this.hexToHSL(colors.secondary);
    root.style.setProperty('--secondary', `${secondaryHSL.h} ${secondaryHSL.s}% ${secondaryHSL.l}%`);
    
    const accentHSL = this.hexToHSL(colors.accent);
    root.style.setProperty('--accent', `${accentHSL.h} ${accentHSL.s}% ${accentHSL.l}%`);
    
    const destructiveHSL = this.hexToHSL(colors.error);
    root.style.setProperty('--destructive', `${destructiveHSL.h} ${destructiveHSL.s}% ${destructiveHSL.l}%`);
  }

  /**
   * Convert hex color to HSL
   */
  private hexToHSL(hex: string): { h: number; s: number; l: number } {
    // Remove #
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  /**
   * Update meta theme color
   */
  private updateMetaTheme(color: string): void {
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', color);
  }

  /**
   * Update native status bar
   */
  private async updateStatusBar(color: string): Promise<void> {
    try {
      const { StatusBar } = await import('@capacitor/status-bar');
      await StatusBar.setBackgroundColor({ color });
    } catch (e) {
      // Not on native platform
    }
  }

  /**
   * Map database record to TenantBranding
   */
  private mapFromDatabase(data: any): TenantBranding {
    return mergeBranding({
      organizationId: data.organization_id,
      organizationName: data.organization_name || data.name,
      logo: data.logo,
      colors: data.colors,
      typography: data.typography,
      appDetails: data.app_details,
      features: data.features,
      loginScreen: data.login_screen,
      dashboard: data.dashboard
    });
  }

  /**
   * Get current branding
   */
  getCurrentBranding(): TenantBranding {
    return this.currentBranding;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Reset to default branding
   */
  resetToDefault(): void {
    this.applyBranding(defaultBranding);
  }
}

export const brandingService = new BrandingService();
