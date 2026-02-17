// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - CAPACITOR CONFIGURATION
// Production-ready configuration for Android + iOS
// ═══════════════════════════════════════════════════════════════════════════

import { CapacitorConfig } from '@capacitor/cli';

// Environment detection
const BUILD_ENV = process.env.VITE_BUILD_ENV || 'production';  // Default to production for bundled assets

const getServerConfig = () => {
  switch (BUILD_ENV) {
    case 'production':
      return {
        // Production: Uses bundled assets, no live server
        url: undefined,
        cleartext: false
      };
    case 'staging':
      return {
        url: 'https://staging.jashchar.com',
        cleartext: false
      };
    case 'livereload':
      // Live reload: Use this only when running dev server
      // Change IP to your machine's IP
      return {
        url: 'http://192.168.1.100:3005',
        cleartext: true
      };
    default:
      // Default: Use bundled assets
      return {
        url: undefined,
        cleartext: false
      };
  }
};

const serverConfig = getServerConfig();

const config: CapacitorConfig = {
  // App Identity
  appId: process.env.APP_ID || 'com.jashchar.erp',
  appName: process.env.APP_NAME || 'Jashchar ERP',
  webDir: 'dist',
  
  // Server Configuration
  server: {
    url: serverConfig.url,
    cleartext: serverConfig.cleartext,
    androidScheme: 'https',
    iosScheme: 'capacitor',
    hostname: 'app.jashchar.local',
    // Allowed external URLs
    allowNavigation: [
      'https://*.supabase.co',
      'https://*.jashchar.com',
      'https://api.razorpay.com',
      'https://checkout.razorpay.com',
      'https://*.google.com',
      'https://*.googleapis.com'
    ]
  },

  // Android Configuration
  android: {
    // Allow mixed content only in dev
    allowMixedContent: BUILD_ENV === 'development',
    // Capture keyboard input
    captureInput: true,
    // Enable WebView debugging in non-production
    webContentsDebuggingEnabled: BUILD_ENV !== 'production',
    // Background color (before app loads)
    backgroundColor: '#FFFFFF',
    // Flavor (for white-label builds)
    flavor: process.env.ANDROID_FLAVOR || '',
    // Build options
    buildOptions: {
      keystorePath: process.env.KEYSTORE_PATH,
      keystoreAlias: process.env.KEYSTORE_ALIAS,
      keystorePassword: process.env.KEYSTORE_PASSWORD,
      keystoreAliasPassword: process.env.KEYSTORE_ALIAS_PASSWORD,
      releaseType: 'AAB' // App Bundle for Play Store
    }
  },

  // iOS Configuration (Future Ready)
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#FFFFFF',
    preferredContentMode: 'mobile',
    scheme: 'JashcharERP',
    // Limiter for WKWebView
    limitsNavigationsToAppBoundDomains: true
  },

  // Plugin Configurations
  plugins: {
    // Splash Screen
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#FFFFFF',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      spinnerColor: '#4F46E5',
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: true
    },
    
    // Push Notifications
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    
    // Keyboard
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },
    
    // Status Bar
    StatusBar: {
      style: 'dark',
      backgroundColor: '#FFFFFF',
      overlaysWebView: false
    },
    
    // Local Notifications
    LocalNotifications: {
      smallIcon: 'ic_stat_notification',
      iconColor: '#4F46E5',
      sound: 'notification.wav'
    },
    
    // HTTP Plugin
    CapacitorHttp: {
      enabled: true
    },
    
    // Camera
    Camera: {
      // Default camera settings
    },
    
    // Filesystem
    Filesystem: {
      // Default filesystem settings
    }
  },

  // Logging
  loggingBehavior: BUILD_ENV === 'production' ? 'none' : 'debug'
};

export default config;
