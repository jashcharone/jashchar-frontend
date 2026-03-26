import { SAFE_MODE_FLAG } from "@/services/safeRecoveryManager";
import { toast } from "@/components/ui/use-toast";

export const canWrite = () => {
  if (typeof window !== 'undefined' && window[SAFE_MODE_FLAG]) {
    return false;
  }
  return true;
};

export const guardWrite = (asyncFn) => {
  return async (...args) => {
    if (!canWrite()) {
      toast({
        variant: "destructive",
        title: "Read-Only Mode",
        description: "System is currently offline. Changes cannot be saved.",
      });
      return { success: false, error: "Read-only mode active" };
    }
    return asyncFn(...args);
  };
};

export const guardFormSubmit = (onSubmit) => {
  return (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!canWrite()) {
      toast({
        variant: "destructive",
        title: "Form Disabled",
        description: "Cannot submit forms in offline mode.",
      });
      return;
    }
    return onSubmit(e);
  };
};
