import { supabase } from '@/lib/customSupabaseClient';
import { validateEnvironment } from './environmentValidator';

/**
 * SERVICE: Supabase Connection Diagnostic
 * STRICT SAFETY: Read-only diagnostic queries only.
 */

export const classifyConnectionError = (error) => {
  if (!error) return null;
  const msg = error.message?.toLowerCase() || '';
  
  if (msg.includes('failed to fetch') || msg.includes('network request failed')) {
    return {
      errorType: 'NETWORK_FAIL',
      severity: 'critical',
      message: 'Network unreachable or connection blocked',
      recoverable: true
    };
  }
  
  if (msg.includes('apikey') || msg.includes('jwt')) {
    return {
      errorType: 'INVALID_KEYS',
      severity: 'critical',
      message: 'Authentication configuration error',
      recoverable: false
    };
  }

  if (msg.includes('503') || msg.includes('paused')) {
    return {
      errorType: 'PROJECT_PAUSED',
      severity: 'critical',
      message: 'Supabase project is paused or undergoing maintenance',
      recoverable: false
    };
  }

  return {
    errorType: 'UNKNOWN_ERROR',
    severity: 'warning',
    message: error.message || 'Unknown connection error',
    recoverable: true
  };
};

export const performConnectionTest = async () => {
  const start = Date.now();
  try {
    // Lightweight query: Get 1 row from module_registry (publicly readable and ad-blocker safe)
    // Changed from 'subscription_plans' to avoid ad-blocker false positives
    const { data, error } = await supabase
      .from('module_registry')
      .select('id')
      .limit(1);

    const latency = Date.now() - start;

    if (error) {
      // If error is permission related (401/403), we are connected but denied.
      // If error is fetch failed, we are disconnected.
      if (error.code === 'PGRST301' || error.code === '401' || error.status === 403) {
         return { connected: true, latency, error: null, status: 'CONNECTED_RESTRICTED' };
      }
      throw error;
    }

    return { connected: true, latency, error: null, status: 'OPTIMAL' };
  } catch (err) {
    return { connected: false, latency: 0, error: err };
  }
};

export const diagnoseSupabaseConnection = async () => {
  // Step 1: Env Check
  const envCheck = validateEnvironment();
  if (!envCheck.valid) {
    // Even if env check fails, try actual connection if client exists
    // This handles cases where environmentValidator is too strict but client works
    const testResult = await performConnectionTest();
    if (testResult.connected) {
       return {
         status: 'HEALTHY_WITH_WARNINGS',
         latency: testResult.latency,
         details: 'Connected despite env warnings',
         warnings: envCheck.errors
       };
    }

    return {
      status: 'ENV_FAIL',
      details: envCheck.errors,
      recommendation: 'Check .env file configuration'
    };
  }

  // Step 2: Connection Test
  const testResult = await performConnectionTest();
  
  if (testResult.connected) {
    return {
      status: 'HEALTHY',
      latency: testResult.latency,
      details: 'Connection successful'
    };
  }

  // Step 3: Classify Error
  const classification = classifyConnectionError(testResult.error);
  
  return {
    status: classification.errorType,
    error: testResult.error,
    classification,
    details: classification.message,
    recommendation: classification.recoverable ? 'Retry connection' : 'Check Project Status'
  };
};
