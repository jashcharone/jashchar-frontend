export const STAGING_CONFIG = {
  // Enable staging mode via environment variable or manual toggle
  // In Vite, we use import.meta.env.VITE_STAGING_MODE
  isStaging: import.meta.env.VITE_STAGING_MODE === 'true',
  
  // Feature flags for gradual rollout
  features: {
    newModules: true, // Allow loading modules from routes.new.js
    betaUI: false,    // Toggle experimental UI components
    strictMode: true  // Enforce route validation
  },

  // Version info
  version: '1.0.0-safety-shield',
  lastUpdated: new Date().toISOString()
};

export const isFeatureEnabled = (featureName) => {
  return STAGING_CONFIG.isStaging || STAGING_CONFIG.features[featureName];
};
