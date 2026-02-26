import React, { createContext, useContext, useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { safeInitialize } from '@/utils/initializationGuard';
import { startMonitoring, stopMonitoring } from '@/services/connectionStatusMonitor';
import { enableReadOnlyMode, disableReadOnlyMode, SAFE_MODE_FLAG } from '@/services/safeRecoveryManager';

const RecoveryContext = createContext(null);

/** Check if Capacitor native (triple-detect) */
const _isCapacitorNative = () => {
  try { if (Capacitor.isNativePlatform()) return true; } catch (e) { /* ignore */ }
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) return true;
  if (typeof window !== 'undefined' && window.location.hostname === 'app.jashchar.local') return true;
  return false;
};

export const RecoveryProvider = ({ children }) => {
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const syncState = () => {
    const globalSafe = typeof window !== 'undefined' ? window[SAFE_MODE_FLAG] : false;
    setIsReadOnly(!!globalSafe);
  };

  useEffect(() => {
    // On Capacitor native, skip all initialization diagnostics.
    // The native HTTP layer handles connectivity; WebView-based Supabase
    // health checks can give false negatives.
    if (_isCapacitorNative()) {
      console.log('[RecoveryContext] Capacitor native → skipping initialization diagnostics');
      disableReadOnlyMode();
      setDiagnosticResult({ status: 'HEALTHY', message: 'Native app' });
      setIsReadOnly(false);
      setInitializing(false);
      return;
    }

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

    // Start Monitor (only on web — skipped internally on native too)
    startMonitoring((isConnected) => {
      syncState();
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
