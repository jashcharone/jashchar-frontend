import { toast } from "@/components/ui/use-toast";

/**
 * SERVICE: Safe Recovery Manager
 * Handles UI feedback and read-only mode switching.
 */

export const SAFE_MODE_FLAG = '__SAFE_READ_ONLY_MODE';

export const enableReadOnlyMode = () => {
  if (typeof window !== 'undefined') {
    window[SAFE_MODE_FLAG] = true;
    console.warn('🚨 APP SWITCHED TO SAFE READ-ONLY MODE 🚨');
  }
};

export const disableReadOnlyMode = () => {
  if (typeof window !== 'undefined') {
    window[SAFE_MODE_FLAG] = false;
    console.log('🟢 APP RESTORED TO NORMAL MODE');
  }
};

export const initiateSafeRecovery = (diagnosticResult) => {
  const { status, classification } = diagnosticResult;
  
  let title = "Connection Issue";
  let desc = "System is attempting to recover...";

  switch (status) {
    case 'NETWORK_FAIL':
      title = "Network Unavailable";
      desc = "We can't reach the server. Checking connection...";
      break;
    case 'ENV_FAIL':
      title = "Configuration Error";
      desc = "System misconfigured. Please contact support.";
      break;
    case 'PROJECT_PAUSED':
      title = "System Maintenance";
      desc = "The database is currently paused or upgrading.";
      break;
    case 'INVALID_KEYS':
      title = "Authentication Error";
      desc = "System credentials appear invalid.";
      break;
    default:
      title = "Connection Error";
      desc = classification?.message || "Unknown error occurred";
  }

  // Show toast only if not already showing critical error
  const isOffline = typeof window !== 'undefined' && window[SAFE_MODE_FLAG];
  if (!isOffline) {
      toast({
        variant: "destructive",
        title: title,
        description: desc,
        duration: 6000
      });
  }

  if (!classification?.recoverable) {
    enableReadOnlyMode();
  }
  
  return classification?.recoverable ?? false;
};

export const retryConnection = async (diagnosticFn, maxRetries = 3) => {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1))); // 1s, 2s, 4s
    
    const result = await diagnosticFn();
    if (result.status === 'HEALTHY' || result.status === 'HEALTHY_WITH_WARNINGS') {
      disableReadOnlyMode();
      return { success: true, attempts, result };
    }
  }

  enableReadOnlyMode();
  return { success: false, attempts, error: "Max retries exceeded" };
};
