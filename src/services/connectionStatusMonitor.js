import { diagnoseSupabaseConnection } from "./supabaseConnectionDiagnostic";
import { disableReadOnlyMode, enableReadOnlyMode } from "./safeRecoveryManager";

let monitorInterval = null;
let isMonitoring = false;

export const getConnectionStatus = async () => {
  const result = await diagnoseSupabaseConnection();
  return result;
};

export const startMonitoring = (onStatusChange) => {
  if (isMonitoring) return;
  isMonitoring = true;

  monitorInterval = setInterval(async () => {
    const result = await getConnectionStatus();
    
    if (result.status === 'HEALTHY' || result.status === 'HEALTHY_WITH_WARNINGS') {
      if (typeof window !== 'undefined' && window['__SAFE_READ_ONLY_MODE']) {
         disableReadOnlyMode();
         if (onStatusChange) onStatusChange(true);
      }
    } else {
       if (typeof window !== 'undefined' && !window['__SAFE_READ_ONLY_MODE']) {
         enableReadOnlyMode();
         if (onStatusChange) onStatusChange(false);
       }
    }
  }, 30000); // Check every 30s
};

export const stopMonitoring = () => {
  if (monitorInterval) clearInterval(monitorInterval);
  isMonitoring = false;
};
