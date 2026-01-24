import { getEnvironmentStatus } from "@/services/environmentValidator";

export const maskSensitiveData = (value) => {
  if (!value) return 'UNDEFINED';
  if (value.length < 10) return '******';
  return `${value.substring(0, 8)}...${value.substring(value.length - 4)}`;
};

export const logEnvironmentStatus = () => {
  const status = getEnvironmentStatus();
  console.groupCollapsed("ðŸ” Environment Diagnostic");
  console.log("Supabase URL:", status.url);
  console.log("Supabase Key:", status.key);
  console.log("Config Valid:", status.valid);
  if (status.warnings.length > 0) {
    console.warn("Warnings:", status.warnings);
  }
  if (status.errors.length > 0) {
    console.error("Errors:", status.errors);
  }
  console.log("User Agent:", navigator.userAgent);
  console.groupEnd();
};

export const logDiagnosticResult = (result) => {
  console.group("ðŸ›  Connection Diagnostic Result");
  console.log("Status:", result.status);
  console.log("Details:", result.details);
  if (result.classification) {
    console.table(result.classification);
  }
  if (result.error) {
    console.error("Raw Error:", result.error);
  }
  console.groupEnd();
};
