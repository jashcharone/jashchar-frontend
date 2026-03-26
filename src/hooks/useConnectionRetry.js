import { useState } from 'react';
import { diagnoseSupabaseConnection } from '@/services/supabaseConnectionDiagnostic';
import { retryConnection } from '@/services/safeRecoveryManager';

export const useConnectionRetry = () => {
  const [retrying, setRetrying] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const attemptRetry = async () => {
    setRetrying(true);
    try {
        const { success, result } = await retryConnection(diagnoseSupabaseConnection);
        setLastResult(result);
        return success;
    } finally {
        setRetrying(false);
    }
  };

  return {
    retrying,
    attemptRetry,
    lastResult
  };
};
