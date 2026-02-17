// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - TENANT BRANDING SCHEMA
// Defines the branding configuration structure for white-label apps
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Complete tenant branding configuration
 */
export interface TenantBranding {
  // Identity
  organizationId: string;
  organizationName: string;
  
  // Visual Identity
  logo: {
    primary: string;         // Main logo URL
    secondary: string;       // Alternate logo (white version)
    favicon: string;         // Small icon
    size: 'small' | 'medium' | 'large';
  };
  
  // Color Palette
  colors: {
    primary: string;         // Main brand color
    primaryLight: string;    // Lighter shade
    primaryDark: string;     // Darker shade
    secondary: string;       // Secondary color
    accent: string;          // Accent/highlight color
    background: string;      // Main background
    surface: string;         // Card/surface background
    error: string;           // Error state
    success: string;         // Success state
    warning: string;         // Warning state
    info: string;            // Info state
    text: {
      primary: string;       // Main text color
      secondary: string;     // Secondary text
      disabled: string;      // Disabled text
      inverse: string;       // Text on dark backgrounds
    };
  };
  
  // Typography
  typography: {
    fontFamily: string;
    headingFont: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
  };
  
  // App Details
  appDetails: {
    appName: string;
    tagline: string;
    supportEmail: string;
    supportPhone: string;
    websiteUrl: string;
    termsUrl: string;
    privacyUrl: string;
  };
  
  // Features Toggles
  features: {
    showPoweredBy: boolean;  // Show "Powered by Jashchar"
    customLoginMessage: string;
    enableDarkMode: boolean;
    enableBiometric: boolean;
    enablePushNotifications: boolean;
    enableChat: boolean;
    enableOfflineMode: boolean;
  };
  
  // Login Screen
  loginScreen: {
    backgroundImage?: string;
    showSchoolLogo: boolean;
    welcomeText: string;
    showRememberMe: boolean;
  };
  
  // Dashboard
  dashboard: {
    showQuickActions: boolean;
    showAnnouncements: boolean;
    showCalendar: boolean;
    defaultView: 'cards' | 'list';
  };
}

/**
 * Default branding (Jashchar ERP)
 */
export const defaultBranding: TenantBranding = {
  organizationId: '',
  organizationName: 'Jashchar ERP',
  
  logo: {
    primary: '/logos/jashchar-logo.png',
    secondary: '/logos/jashchar-logo-white.png',
    favicon: '/logos/favicon.png',
    size: 'medium'
  },
  
  colors: {
    primary: '#4F46E5',      // Indigo
    primaryLight: '#818CF8',
    primaryDark: '#3730A3',
    secondary: '#10B981',    // Emerald
    accent: '#F59E0B',       // Amber
    background: '#F9FAFB',
    surface: '#FFFFFF',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    info: '#3B82F6',
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      disabled: '#9CA3AF',
      inverse: '#FFFFFF'
    }
  },
  
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headingFont: 'Inter, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem'
    }
  },
  
  appDetails: {
    appName: 'Jashchar ERP',
    tagline: 'Complete School Management Solution',
    supportEmail: 'support@jashchar.com',
    supportPhone: '+91-9999999999',
    websiteUrl: 'https://jashchar.com',
    termsUrl: 'https://jashchar.com/terms',
    privacyUrl: 'https://jashchar.com/privacy'
  },
  
  features: {
    showPoweredBy: false,
    customLoginMessage: '',
    enableDarkMode: true,
    enableBiometric: true,
    enablePushNotifications: true,
    enableChat: true,
    enableOfflineMode: true
  },
  
  loginScreen: {
    showSchoolLogo: true,
    welcomeText: 'Welcome Back!',
    showRememberMe: true
  },
  
  dashboard: {
    showQuickActions: true,
    showAnnouncements: true,
    showCalendar: true,
    defaultView: 'cards'
  }
};

/**
 * Validate branding configuration
 */
export function validateBranding(branding: Partial<TenantBranding>): string[] {
  const errors: string[] = [];
  
  if (!branding.organizationName) {
    errors.push('Organization name is required');
  }
  
  if (branding.colors) {
    const requiredColors = ['primary', 'secondary', 'background', 'surface'];
    for (const color of requiredColors) {
      if (!(branding.colors as any)[color]) {
        errors.push(`Color '${color}' is required`);
      }
    }
    
    // Validate color format
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    for (const [key, value] of Object.entries(branding.colors)) {
      if (typeof value === 'string' && !colorRegex.test(value)) {
        errors.push(`Invalid color format for '${key}': ${value}`);
      }
    }
  }
  
  return errors;
}

/**
 * Merge partial branding with defaults
 */
export function mergeBranding(partial: Partial<TenantBranding>): TenantBranding {
  return {
    ...defaultBranding,
    ...partial,
    logo: { ...defaultBranding.logo, ...partial.logo },
    colors: {
      ...defaultBranding.colors,
      ...partial.colors,
      text: { ...defaultBranding.colors.text, ...partial.colors?.text }
    },
    typography: {
      ...defaultBranding.typography,
      ...partial.typography,
      fontSize: { ...defaultBranding.typography.fontSize, ...partial.typography?.fontSize }
    },
    appDetails: { ...defaultBranding.appDetails, ...partial.appDetails },
    features: { ...defaultBranding.features, ...partial.features },
    loginScreen: { ...defaultBranding.loginScreen, ...partial.loginScreen },
    dashboard: { ...defaultBranding.dashboard, ...partial.dashboard }
  };
}
