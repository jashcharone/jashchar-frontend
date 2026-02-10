/**
 * ORGANIZATION CONTEXT
 * ═══════════════════════════════════════════════════════════════
 * Manages organization-specific branding and configuration
 * - Fetches org config from subdomain
 * - Applies white-label theming
 * - Provides org context to entire app
 * 
 * Used for PWA white-labeling:
 * - Different logo per organization
 * - Different colors per organization
 * - Different name/tagline per organization
 * 
 * Created: February 10, 2026
 * ═══════════════════════════════════════════════════════════════
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const OrganizationContext = createContext();

/**
 * Extract organization slug from hostname
 * Examples:
 * - mangalorecolleg.jashcharerp.com → "mangalorecolleg"
 * - localhost:5173 → "demo" (fallback for development)
 * - master.jashcharerp.com → "master"
 */
const getOrganizationSlug = () => {
    const hostname = window.location.hostname;
    
    // Development fallback
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Check if slug is stored in localStorage for dev
        const devSlug = localStorage.getItem('dev-org-slug');
        return devSlug || 'demo';
    }
    
    // Production: Extract subdomain
    const parts = hostname.split('.');
    if (parts.length >= 3) {
        // subdomain.jashcharerp.com → subdomain
        return parts[0];
    }
    
    // Single domain (might be custom domain)
    return hostname;
};

/**
 * Apply organization theme colors to CSS variables
 */
const applyThemeColors = (branding) => {
    if (!branding) return;
    
    const root = document.documentElement;
    
    // Apply primary color
    if (branding.primaryColor) {
        root.style.setProperty('--primary-color', branding.primaryColor);
        root.style.setProperty('--primary', branding.primaryColor);
    }
    
    // Apply secondary color
    if (branding.secondaryColor) {
        root.style.setProperty('--secondary-color', branding.secondaryColor);
        root.style.setProperty('--secondary', branding.secondaryColor);
    }
    
    // Update theme-color meta tag
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta && branding.primaryColor) {
        themeColorMeta.setAttribute('content', branding.primaryColor);
    } else if (branding.primaryColor) {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = branding.primaryColor;
        document.head.appendChild(meta);
    }
    
    console.log('[Organization Theme] Applied colors:', branding);
};

/**
 * Update document title and favicon
 */
const updatePageMeta = (orgConfig) => {
    if (!orgConfig) return;
    
    // Update page title
    document.title = orgConfig.name || 'School ERP';
    
    // Update favicon if logo is available
    if (orgConfig.logo) {
        let favicon = document.querySelector("link[rel~='icon']");
        if (!favicon) {
            favicon = document.createElement('link');
            favicon.rel = 'icon';
            document.head.appendChild(favicon);
        }
        favicon.href = orgConfig.logo;
    }
};

/**
 * Organization Provider Component
 */
export const OrganizationProvider = ({ children }) => {
    const [orgConfig, setOrgConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [slug, setSlug] = useState(null);
    
    useEffect(() => {
        fetchOrganizationConfig();
    }, []);
    
    const fetchOrganizationConfig = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Get organization slug from URL
            const orgSlug = getOrganizationSlug();
            setSlug(orgSlug);
            
            console.log('[Organization] Fetching config for:', orgSlug);
            
            // Fetch organization configuration
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await axios.get(
                `${apiUrl}/api/public/org-config?slug=${orgSlug}`
            );
            
            if (response.data.success) {
                const config = response.data.organization;
                setOrgConfig(config);
                
                // Apply theme colors
                applyThemeColors(config.branding);
                
                // Update page meta
                updatePageMeta(config);
                
                // Store in localStorage for offline access
                localStorage.setItem('org-config', JSON.stringify(config));
                
                console.log('[Organization] Config loaded:', config.name);
            } else {
                throw new Error('Failed to fetch organization config');
            }
            
        } catch (err) {
            console.error('[Organization] Error fetching config:', err);
            setError(err.message || 'Failed to load organization configuration');
            
            // Try to load from localStorage (offline fallback)
            const cachedConfig = localStorage.getItem('org-config');
            if (cachedConfig) {
                try {
                    const config = JSON.parse(cachedConfig);
                    setOrgConfig(config);
                    applyThemeColors(config.branding);
                    updatePageMeta(config);
                    console.log('[Organization] Loaded from cache');
                } catch (e) {
                    console.error('[Organization] Failed to parse cached config');
                }
            }
        } finally {
            setLoading(false);
        }
    };
    
    /**
     * Refresh organization config
     * Useful after organization updates their branding
     */
    const refreshOrgConfig = () => {
        fetchOrganizationConfig();
    };
    
    /**
     * For development: Set organization slug manually
     */
    const setDevOrganization = (devSlug) => {
        if (window.location.hostname === 'localhost') {
            localStorage.setItem('dev-org-slug', devSlug);
            window.location.reload();
        }
    };
    
    const value = {
        orgConfig,
        loading,
        error,
        slug,
        refreshOrgConfig,
        setDevOrganization,
        
        // Helper getters
        organizationId: orgConfig?.id,
        organizationName: orgConfig?.name,
        organizationSlug: orgConfig?.slug,
        logo: orgConfig?.logo,
        branding: orgConfig?.branding,
        contact: orgConfig?.contact
    };
    
    return (
        <OrganizationContext.Provider value={value}>
            {children}
        </OrganizationContext.Provider>
    );
};

/**
 * Hook to use organization context
 * 
 * Usage:
 * const { orgConfig, logo, branding } = useOrganization();
 */
export const useOrganization = () => {
    const context = useContext(OrganizationContext);
    
    if (context === undefined) {
        throw new Error('useOrganization must be used within OrganizationProvider');
    }
    
    return context;
};

export default OrganizationContext;
