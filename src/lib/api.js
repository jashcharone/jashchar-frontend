import axios from 'axios';
import { supabase } from '@/lib/customSupabaseClient';
import { getApiBaseUrl } from '@/utils/platform';
import { getCapacitorAdapter } from '@/lib/capacitorHttpAdapter';

// Default timeout: 30 seconds, Long operations: 5 minutes
const DEFAULT_TIMEOUT = 30000;
const LONG_TIMEOUT = 300000; // 5 minutes for heavy operations like approval

// Lazily compute API base URL to ensure Capacitor bridge is ready.
// The URL is cached after first call.
let _cachedApiBaseUrl = null;
function resolveApiBaseUrl() {
  if (_cachedApiBaseUrl === null) {
    const base = getApiBaseUrl();
    _cachedApiBaseUrl = base ? `${base}/api` : '/api';
    console.log('[API] Resolved baseURL:', _cachedApiBaseUrl);
  }
  return _cachedApiBaseUrl;
}

// On Capacitor native: use custom adapter that calls CapacitorHttp.request() directly
// This bypasses WebView XHR entirely ? ZERO CORS issues on Android/iOS
const nativeAdapter = getCapacitorAdapter();

const api = axios.create({
  baseURL: '/api', // placeholder — overridden by request interceptor below
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  ...(nativeAdapter ? { adapter: nativeAdapter } : {}),
});

// Ensure every request uses the lazily-resolved base URL
// This runs BEFORE the auth interceptor below.
api.interceptors.request.use((config) => {
  config.baseURL = resolveApiBaseUrl();
  return config;
});

import { errorLoggerService } from '@/services/errorLoggerService';

// ---------------------------------------------------------------
// SESSION TOKEN MANAGEMENT
// ---------------------------------------------------------------
// Problem: Multiple simultaneous API calls each called supabase.auth.getSession()
// which triggered parallel token refreshes. When Supabase's "Detect compromised
// refresh tokens" is ON, using the old refresh token after a new one was issued
// causes ALL tokens to be revoked ? user gets logged out unexpectedly.
//
// Solution: Cache the access token and use a single refresh promise (mutex)
// so concurrent requests share one refresh instead of racing.
// ---------------------------------------------------------------
let cachedAccessToken = null;
let tokenExpiresAt = 0; // Unix timestamp in seconds
let refreshPromise = null; // Mutex: only one refresh at a time
let isRedirectingToLogin = false; // Prevent multiple redirects

// Listen to auth state changes to keep token cache in sync
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.access_token) {
    cachedAccessToken = session.access_token;
    // Supabase tokens typically expire in 3600s. Refresh 60s early to be safe.
    tokenExpiresAt = session.expires_at ? session.expires_at - 60 : (Date.now() / 1000) + 3540;
  } else if (event === 'SIGNED_OUT') {
    cachedAccessToken = null;
    tokenExpiresAt = 0;
  }
});

// Initialize token cache from existing session (for page reload)
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.access_token) {
    cachedAccessToken = session.access_token;
    tokenExpiresAt = session.expires_at ? session.expires_at - 60 : (Date.now() / 1000) + 3540;
  }
});

/**
 * Get a valid access token. Uses cache if still valid, 
 * otherwise triggers a single shared refresh.
 */
async function getValidToken() {
  const now = Date.now() / 1000;
  
  // Token still valid ? return cached
  if (cachedAccessToken && now < tokenExpiresAt) {
    return cachedAccessToken;
  }

  // Token expired or missing ? refresh (but only one refresh at a time)
  if (!refreshPromise) {
    refreshPromise = supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error || !session?.access_token) {
          cachedAccessToken = null;
          tokenExpiresAt = 0;
          return null;
        }
        cachedAccessToken = session.access_token;
        tokenExpiresAt = session.expires_at ? session.expires_at - 60 : (now + 3540);
        return cachedAccessToken;
      })
      .catch(() => {
        cachedAccessToken = null;
        tokenExpiresAt = 0;
        return null;
      })
      .finally(() => {
        refreshPromise = null; // Release the mutex
      });
  }

  return refreshPromise;
}

// Add auth token and branch context to requests
api.interceptors.request.use(async (config) => {
  // Skip auth for login endpoints
  const isAuthEndpoint = config.url?.includes('/auth/unified-login') || 
                         config.url?.includes('/auth/login') ||
                         config.url?.includes('/auth/forgot-password') ||
                         config.url?.includes('/auth/reset-password');
  
  let session = null;
  if (!isAuthEndpoint) {
    const token = await getValidToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Also get full session for metadata (from cache, not a new call)
      const { data } = await supabase.auth.getSession();
      session = data?.session;
    }
  }

  // ? PRESERVE EXPLICIT HEADERS: If x-school-id is already passed, DO NOT overwrite it.
  if (config.headers['x-school-id']) {
      // Do nothing, respect the component's explicit request
  }
  // ? MASTER ADMIN OVERRIDE: Use selected school ID if available
  else {
      let maTargetSchoolId = null;
      if (typeof window !== 'undefined' && window.sessionStorage) {
          maTargetSchoolId = sessionStorage.getItem('ma_target_branch_id');
      }
      
      if (maTargetSchoolId && maTargetSchoolId !== 'null' && maTargetSchoolId !== 'undefined') {
          config.headers['x-school-id'] = maTargetSchoolId;
      } 
      // ? STANDARD USER + SCHOOL OWNER OVERRIDE via LocalStorage
      // Checks localStorage 'selectedSchoolId' first (set by PermissionContext for owners who switch schools)
      else {
          let targetSchoolId = null;
          if (typeof window !== 'undefined') {
              targetSchoolId = localStorage.getItem('selectedSchoolId') || localStorage.getItem('branchId');
          }

          if (targetSchoolId && targetSchoolId !== 'null' && targetSchoolId !== 'undefined') {
              config.headers['x-school-id'] = targetSchoolId;
          } else if (session?.user) {
              // Fallback to metadata
              const metaSchoolId = session.user.user_metadata?.branch_id || 
                              session.user.raw_user_meta_data?.branch_id;
              if (metaSchoolId) {
                  config.headers['x-school-id'] = metaSchoolId;
              }
          }
      }
  }

  // Add Organization ID if selected (Strict Multi-Tenant)
  const organizationId = localStorage.getItem('selectedOrganizationId');
  if (organizationId && organizationId !== 'null' && organizationId !== 'undefined') {
    config.headers['x-organization-id'] = organizationId;
  }

  // Add Branch ID if selected
  const branchId = localStorage.getItem('selectedBranchId');
  if (branchId && branchId !== 'all') {
    config.headers['x-branch-id'] = branchId;
  }

  // Add Session ID if selected (Strict Session Isolation)
  const sessionId = localStorage.getItem('selectedSessionId');
  if (sessionId) {
    config.headers['x-session-id'] = sessionId;
  }

  return config;
});

// Response Interceptor for Global Error Logging & Session Expiry Handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized — Try ONE token refresh before giving up
    if (error.response?.status === 401 && !originalRequest._retried) {
      originalRequest._retried = true;
      
      console.warn('[API] 401 received. Attempting token refresh before logout...');
      
      // Force a fresh session refresh (bypasses cache)
      try {
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (!refreshError && session?.access_token) {
          // Token refreshed successfully ? update cache and retry the request
          cachedAccessToken = session.access_token;
          tokenExpiresAt = session.expires_at ? session.expires_at - 60 : (Date.now() / 1000 + 3540);
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
          console.log('[API] Token refreshed successfully. Retrying request...');
          return api(originalRequest);
        }
      } catch (refreshErr) {
        console.error('[API] Token refresh failed:', refreshErr);
      }
      
      // Refresh failed ? session truly expired, redirect to login
      if (!isRedirectingToLogin) {
        isRedirectingToLogin = true;
        console.warn('[API] Session expired. Redirecting to login...');
        
        // Clear stored auth data
        localStorage.removeItem('selectedSchoolId');
        localStorage.removeItem('branchId');
        localStorage.removeItem('selectedOrganizationId');
        localStorage.removeItem('selectedBranchId');
        localStorage.removeItem('selectedSessionId');
        sessionStorage.removeItem('ma_target_branch_id');
        cachedAccessToken = null;
        tokenExpiresAt = 0;
        
        // Sign out from Supabase to clear session
        try {
          await supabase.auth.signOut();
        } catch (signOutErr) {
          console.error('[API] Error during sign out:', signOutErr);
        }
        
        // Redirect to login if not already there
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login?session_expired=true';
        }
        
        // Reset redirect flag after a delay
        setTimeout(() => { isRedirectingToLogin = false; }, 3000);
      }
      
      return Promise.reject(error);
    }
    
    // Log other errors to Queries Finder
    errorLoggerService.logError(error, { componentStack: 'API Interceptor' }, {
      type: 'API_ERROR',
      module: 'backend',
      dashboard: 'unknown'
    });
    
    return Promise.reject(error);
  }
);

export default api;

/**
 * Invokes a Supabase Edge Function to make a secure API call.
 * This function calls the 'example-api-call' Edge Function.
 *
 * @returns {Promise<any>} The data returned from the third-party API.
 */
export const fetchThirdPartyData = async () => {
  const { data, error } = await supabase.functions.invoke('example-api-call');

  if (error) {
    console.error('Error invoking Supabase function:', error);
    throw new Error(`Failed to fetch data from the API: ${error.message}`);
  }

  return data;
};
