import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeInitialize } from '@/utils/initializationGuard';
import { startMonitoring, stopMonitoring } from '@/services/connectionStatusMonitor';
import { enableReadOnlyMode, disableReadOnlyMode, SAFE_MODE_FLAG } from '@/services/safeRecoveryManager';

const RecoveryContext = createContext(null);

export const RecoveryProvider = ({ children }) => {
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const syncState = () => {
    const globalSafe = typeof window !== 'undefined' ? window[SAFE_MODE_FLAG] : false;
    setIsReadOnly(!!globalSafe);
  };

  useEffect(() => {
    const runInit = async () => {
      const { success, result } = await safeInitialize();
      setDiagnosticResult(result);
      if (!success) {
        enableReadOnlyMode();
      } else {
        disableReadOnlyMode();
      }
      syncState();
      setInitializing(false);
    };

    runInit();

    // Start Monitor
    startMonitoring((isConnected) => {
      // Callback when monitor detects change
      syncState();
      // Update diagnostic result if needed (monitor doesn't pass it back directly in this simplified version, but we could)
    });

    return () => stopMonitoring();
  }, []);

  const forceRetry = async () => {
    setInitializing(true);
    const { success, result } = await safeInitialize();
    setDiagnosticResult(result);
    if (success) {
      disableReadOnlyMode();
    }
    syncState();
    setInitializing(false);
    return success;
  };

  return (
    <RecoveryContext.Provider value={{ isReadOnly, diagnosticResult, initializing, forceRetry }}>
      {children}
    </RecoveryContext.Provider>
  );
};

export const useRecovery = () => useContext(RecoveryContext);
