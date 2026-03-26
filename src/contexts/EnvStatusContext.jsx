import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadSupabaseEnv } from '@/services/envLoader';
import { isSupabaseReady } from '@/lib/supabaseClientSafe';

const EnvStatusContext = createContext(null);

export const EnvStatusProvider = ({ children }) => {
  const [envStatus, setEnvStatus] = useState({
    envLoaded: false,
    supabaseReady: false,
    errors: [],
    config: { url: null, key: null }
  });

  useEffect(() => {
    const { loaded, url, key, errors } = loadSupabaseEnv();
    const ready = isSupabaseReady();
    
    setEnvStatus({
      envLoaded: loaded,
      supabaseReady: ready,
      errors,
      config: { url, key }
    });
  }, []);

  return (
    <EnvStatusContext.Provider value={envStatus}>
      {children}
    </EnvStatusContext.Provider>
  );
};

export const useEnvStatus = () => useContext(EnvStatusContext);
