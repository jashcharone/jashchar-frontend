import { errorLoggerService } from '@/services/errorLoggerService';

/**
 * Initializes global error handlers to catch uncaught exceptions and unhandled rejections.
 * This ensures that errors outside of React's ErrorBoundary (like async errors, event handlers)
 * are also logged to the Queries Finder.
 */
// -- Console Log Buffer Constants ---------------------------------------------
const MAX_CONSOLE_LOGS = 200;
const MAX_ERROR_LOGS = 50;

/**
 * Formats console args into a single string for storage
 */
const formatConsoleArgs = (args) => {
  return args.map(arg => {
    if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
    if (typeof arg === 'object') {
      try { return JSON.stringify(arg); } catch { return String(arg); }
    }
    return String(arg);
  }).join(' ');
};

export const initGlobalErrorHandlers = () => {
  if (window.__globalErrorHandlersInitialized) return;
  window.__globalErrorHandlersInitialized = true;

  // -- Initialize global console log buffers ----------------------------------
  // These are read by BugReportModal.captureConsoleLogs()
  window.__JASHCHAR_CONSOLE_LOGS__ = window.__JASHCHAR_CONSOLE_LOGS__ || [];
  window.__JASHCHAR_LAST_ERRORS__ = window.__JASHCHAR_LAST_ERRORS__ || [];

  // -- Intercept console.log / console.warn / console.info -------------------
  const originalConsoleLog = console.log;
  const originalConsoleInfo = console.info;
  const originalConsoleWarn = console.warn;

  const pushToLogBuffer = (type, args) => {
    const entry = {
      type,
      message: formatConsoleArgs(args),
      timestamp: new Date().toISOString()
    };
    window.__JASHCHAR_CONSOLE_LOGS__.push(entry);
    // Keep buffer bounded
    if (window.__JASHCHAR_CONSOLE_LOGS__.length > MAX_CONSOLE_LOGS) {
      window.__JASHCHAR_CONSOLE_LOGS__ = window.__JASHCHAR_CONSOLE_LOGS__.slice(-MAX_CONSOLE_LOGS);
    }
  };

  console.log = (...args) => {
    originalConsoleLog.apply(console, args);
    pushToLogBuffer('log', args);
  };

  console.info = (...args) => {
    originalConsoleInfo.apply(console, args);
    pushToLogBuffer('info', args);
  };

  console.warn = (...args) => {
    originalConsoleWarn.apply(console, args);
    pushToLogBuffer('warn', args);
  };

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
    // -- AI Engine offline errors: downgrade to warn (not red error) --------------
    // Python AI engine being offline is expected during dev. Don't show red errors.
    const isAIEngineError =
      (args[0] && typeof args[0] === 'string' && (
        args[0].includes('[AI Engine API]') ||
        args[0].includes('AI Engine is not available') ||
        args[0].includes('ai/health') ||
        args[0].includes('ai/index/status') ||
        args[0].includes('Fetch error from') ||
        args[0].includes('Face recognition failed')
      )) ||
      args.some(arg => arg instanceof Error && (
        arg.message.includes('AI Engine is not available') ||
        arg.message.includes('Failed to get index status') ||
        arg.message.includes('Face recognition failed')
      ));

    if (isAIEngineError) {
      // Show as yellow warning instead of red error — still visible but not alarming
      originalConsoleWarn.apply(console, ['[AI Engine offline]', ...args]);
      return; // Skip backend logging
    }

    // -- Call original console.error for all other real errors -------------------
    originalConsoleError.apply(console, args);

    // -- Store in global buffers for Bug Report capture --------------------------
    const errorEntry = {
      type: 'error',
      message: formatConsoleArgs(args),
      timestamp: new Date().toISOString()
    };
    window.__JASHCHAR_CONSOLE_LOGS__.push(errorEntry);
    if (window.__JASHCHAR_CONSOLE_LOGS__.length > MAX_CONSOLE_LOGS) {
      window.__JASHCHAR_CONSOLE_LOGS__ = window.__JASHCHAR_CONSOLE_LOGS__.slice(-MAX_CONSOLE_LOGS);
    }
    window.__JASHCHAR_LAST_ERRORS__.push(errorEntry);
    if (window.__JASHCHAR_LAST_ERRORS__.length > MAX_ERROR_LOGS) {
      window.__JASHCHAR_LAST_ERRORS__ = window.__JASHCHAR_LAST_ERRORS__.slice(-MAX_ERROR_LOGS);
    }

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

    // Ignore Vite HMR WebSocket connection errors (dev-only, not a real issue)
    if (args[0] && typeof args[0] === 'string' && (
        args[0].includes('[vite] failed to connect to websocket') ||
        args[0].includes('WebSocket connection') ||
        args[0].includes('@vite/client')
    )) {
        return;
    }

    // Ignore security messages that are not actual errors
    if (args[0] && typeof args[0] === 'string' && (
        args[0].includes('If account exists') ||
        args[0].includes('Check your inbox')
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
