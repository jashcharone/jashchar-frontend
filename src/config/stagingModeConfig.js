export const STAGING_CONFIG = {
  enabled: import.meta.env.VITE_STAGING_MODE === 'true',
  uiStaging: import.meta.env.VITE_UI_STAGING_MODE === 'true',
  
  // Whitelist of modules allowed only in staging
  betaModules: [
    'ai-analytics',
    'advanced-forecasting',
    'dummy-module-1',
    'dummy-module-2',
    'dummy-module-3'
  ],

  shouldShowModule: (moduleKey) => {
    // If strict staging is on, hide beta modules in production
    const isStaging = import.meta.env.VITE_STAGING_MODE === 'true';
    const isBeta = STAGING_CONFIG.betaModules.includes(moduleKey);
    
    if (isBeta && !isStaging) return false;
    return true;
  }
};
