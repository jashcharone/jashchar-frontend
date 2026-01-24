import { errorLoggerService } from '@/services/errorLoggerService';

/**
 * Initializes global error handlers to catch uncaught exceptions and unhandled rejections.
 * This ensures that errors outside of React's ErrorBoundary (like async errors, event handlers)
 * are also logged to the Queries Finder.
 */
export const initGlobalErrorHandlers = () => {
  if (window.__globalErrorHandlersInitialized) return;
  window.__globalErrorHandlersInitialized = true;

  // 1. Catch Global Uncaught Exceptions (Synchronous & some Async)
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('[Global Error Handler] Caught exception:', message);

    const errorObj = error || new Error(message);
    
    // Add extra context if available
    if (!errorObj.stack) {
      errorObj.stack = `${message}\n    at ${source}:${lineno}:${colno}`;
    }

    errorLoggerService.logError(errorObj, {
      componentStack: `Global Window Error: ${source}:${lineno}:${colno}`
    }, {
      type: 'Uncaught Exception',
      dashboard: 'unknown', // Will be inferred from URL in service
      module: 'system'
    });

    // Return false to let the default handler run (log to console)
    return false;
  };

  // 2. Catch Unhandled Promise Rejections (Async/API failures)
  window.onunhandledrejection = (event) => {
    console.error('[Global Error Handler] Unhandled Rejection:', event.reason);

    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));

    errorLoggerService.logError(error, {
      componentStack: 'Unhandled Promise Rejection'
    }, {
      type: 'Unhandled Rejection',
      dashboard: 'unknown',
      module: 'system'
    });
  };

  // 3. Intercept console.error (to catch handled but logged errors)
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Call original first so we see it in DevTools
    originalConsoleError.apply(console, args);

    // Prevent infinite loops: Don't log errors from the logger itself
    // The logger prints "Failed to log error to system" if it fails.
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Failed to log error')) {
      return;
    }
    
    // Also ignore [Global Error Handler] logs to avoid double logging
    if (args[0] && typeof args[0] === 'string' && args[0].includes('[Global Error Handler]')) {
      return;
    }

    // Ignore Supabase 403 session_not_found errors (handled by AuthContext)
    if (args[0] && typeof args[0] === 'string' && (
        args[0].includes('session_not_found') || 
        (args[0].includes('403') && args[0].includes('auth/v1/user'))
    )) {
        return;
    }

    try {
      // Convert args to a meaningful error message
      const message = args.map(arg => 
        arg instanceof Error ? arg.message : 
        typeof arg === 'object' ? JSON.stringify(arg) : 
        String(arg)
      ).join(' ');

      const errorObj = args.find(arg => arg instanceof Error) || new Error(message);
      
      // We use a special flag or check to ensure we don't re-log things we just logged via other handlers
      // But since we filtered out [Global Error Handler], we should be safe-ish.
      
      errorLoggerService.logError(errorObj, {
        componentStack: 'Console Error Intercept'
      }, {
        type: 'Console Error',
        dashboard: 'unknown',
        module: 'system'
      });
    } catch (e) {
      // Do nothing if interception fails, to be safe
    }
  };

  console.log('[Queries Finder] Global error handlers initialized.');
};
