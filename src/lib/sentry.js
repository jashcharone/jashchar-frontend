// Sentry Configuration for Jashchar ERP Frontend
import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.MODE || 'development';

export function initSentry() {
  // Only initialize if DSN is provided
  if (!SENTRY_DSN) {
    console.log('[Sentry] DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    
    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Capture 10% of sessions for replay
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Performance sample rate (1.0 = 100% of transactions)
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.2 : 1.0,
    
    // Session Replay sample rate
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Filter out known non-critical errors
    beforeSend(event, hint) {
      // Ignore network errors that are expected
      const error = hint.originalException;
      if (error && error.message) {
        // Ignore cancelled requests
        if (error.message.includes('cancelled') || 
            error.message.includes('aborted') ||
            error.message.includes('Network Error')) {
          return null;
        }
      }
      return event;
    },

    // Add user context
    initialScope: {
      tags: {
        app: 'jashchar-erp-frontend',
        version: '1.0.0',
      },
    },
  });

  console.log(`[Sentry] Initialized for ${ENVIRONMENT} environment`);
}

// Export Sentry for use in components
export { Sentry };

// Helper to set user context after login
export function setSentryUser(user) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.user_metadata?.name || user.email,
    });
  } else {
    Sentry.setUser(null);
  }
}

// Helper to capture custom errors with context
export function captureError(error, context = {}) {
  Sentry.captureException(error, {
    extra: context,
  });
}

// Helper to add breadcrumb for tracking user actions
export function addBreadcrumb(message, category = 'user-action', data = {}) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}
