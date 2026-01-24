import axios from 'axios';
import { supabase } from '@/lib/customSupabaseClient';

// Create axios instance for backend API calls
// Always use relative /api path - Vercel rewrites to Railway backend
// Only use VITE_API_BASE_URL for local development
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const runtimeApiBase = typeof window !== 'undefined' && window.__RUNTIME_CONFIG__ && window.__RUNTIME_CONFIG__.VITE_API_BASE_URL;
const envApiBase = import.meta.env.VITE_API_BASE_URL;

// Use configured URL only for localhost, otherwise always use relative /api
const apiBaseUrl = isLocalhost ? (runtimeApiBase || envApiBase) : null;

// Default timeout: 30 seconds, Long operations: 5 minutes
const DEFAULT_TIMEOUT = 30000;
const LONG_TIMEOUT = 300000; // 5 minutes for heavy operations like approval

const api = axios.create({
  baseURL: apiBaseUrl ? `${apiBaseUrl}/api` : '/api',
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

import { errorLoggerService } from '@/services/errorLoggerService';

// Add auth token and branch context to requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  // ✅ PRESERVE EXPLICIT HEADERS: If x-school-id is already passed, DO NOT overwrite it.
  if (config.headers['x-school-id']) {
      // Do nothing, respect the component's explicit request
  }
  // ✅ MASTER ADMIN OVERRIDE: Use selected school ID if available
  else {
      let maTargetSchoolId = null;
      if (typeof window !== 'undefined' && window.sessionStorage) {
          maTargetSchoolId = sessionStorage.getItem('ma_target_branch_id');
      }
      
      if (maTargetSchoolId && maTargetSchoolId !== 'null' && maTargetSchoolId !== 'undefined') {
          config.headers['x-school-id'] = maTargetSchoolId;
      } 
      // ✅ STANDARD USER + SCHOOL OWNER OVERRIDE via LocalStorage
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

// Response Interceptor for Global Error Logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error to Queries Finder
    if (error.response?.status !== 401) { // Ignore 401 (Auth) to avoid spam during session expiry
      errorLoggerService.logError(error, { componentStack: 'API Interceptor' }, {
        type: 'API_ERROR',
        module: 'backend',
        dashboard: 'unknown'
      });
    }
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
