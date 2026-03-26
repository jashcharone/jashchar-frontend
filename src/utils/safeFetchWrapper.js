import { canWrite } from "./safeWriteGuard";
import { toast } from "@/components/ui/use-toast";

const DEFAULT_OPTIONS = {
  maxRetries: 3,
  timeout: 8000,
  retryDelay: 1000,
  isWrite: false
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export const safeFetch = async (asyncFn, options = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (opts.isWrite && !canWrite()) {
    return { data: null, error: { message: "System is in safe read-only mode" } };
  }

  let attempt = 0;
  let lastError = null;

  while (attempt < opts.maxRetries) {
    try {
      // Race against timeout
      const result = await Promise.race([
        asyncFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Request timed out")), opts.timeout)
        )
      ]);

      // Supabase often returns { data, error } structure without throwing
      if (result && result.error) {
        throw result.error; // Throw to trigger retry logic if it's a network-like error
      }

      return result; // Success
    } catch (err) {
      lastError = err;
      attempt++;
      
      // Don't retry if it's a logic error (400s) unless it's 429 (Too Many Requests)
      // Assuming standard Fetch error or Supabase error
      const isNetworkError = err.message?.includes('fetch') || err.message?.includes('network');
      
      if (!isNetworkError && attempt < opts.maxRetries) {
         // Logic error, probably shouldn't retry unless we are sure
         break;
      }

      if (attempt < opts.maxRetries) {
        const delay = opts.retryDelay * Math.pow(2, attempt - 1);
        // Use console.warn sparingly to avoid cluttering logs in production
        if (import.meta.env.DEV) {
            console.warn(`[SafeFetch] Attempt ${attempt} failed. Retrying in ${delay}ms...`, err.message);
        }
        await sleep(delay);
      }
    }
  }

  // If it was a critical failure, we might log it but usually the caller handles the UI
  return { data: null, error: lastError };
};
