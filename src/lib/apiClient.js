import { supabase } from './customSupabaseClient';
import { getApiBaseUrl } from '@/utils/platform';

/**
 * Centralized API Client with automatic authentication
 * All requests automatically include the Authorization header with the current user's token
 * Also includes x-branch-id and x-session-id headers for multi-tenant context
 */

// Platform-aware API URL (Capacitor uses full Railway URL, web uses relative /api)
const API_BASE_URL = getApiBaseUrl();

// Default timeout: 30 seconds
// Long timeout endpoints (approval, setup): 5 minutes
const DEFAULT_TIMEOUT = 30000;
const LONG_TIMEOUT = 300000; // 5 minutes for heavy operations

// Endpoints that need longer timeout
const LONG_TIMEOUT_ENDPOINTS = [
  '/admin/approve-request',
  '/admin/reject-request',
  '/admin/setup-school',
  '/module-registry/sync',
];

/**
 * Get user context from localStorage for multi-tenant isolation
 * @returns {Object} Context with organizationId, branchId, sessionId
 */
const getUserContext = () => {
  return {
    organizationId: localStorage.getItem('selectedOrganizationId'),
    branchId: localStorage.getItem('selectedBranchId'),
    sessionId: localStorage.getItem('selectedSessionId')
  };
};

const apiClient = {
  /**
   * Generic request handler
   * @param {string} endpoint - API endpoint (e.g., '/subscriptions/plans')
   * @param {object} options - Fetch options (method, body, headers, etc.)
   * @returns {Promise<any>} Response data
   */
  async request(endpoint, options = {}) {
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Get user context for multi-tenant isolation
      const context = getUserContext();
      
      // Build headers
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Add Authorization header if session exists
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      // Add context headers for multi-tenant backend filtering
      // CRITICAL: These headers enable branch & session wise data isolation
      if (context.organizationId) {
        headers['x-organization-id'] = context.organizationId;
      }
      if (context.branchId) {
        headers['x-branch-id'] = context.branchId;
      }
      if (context.sessionId) {
        headers['x-session-id'] = context.sessionId;
      }

      // Build full URL - use API_BASE_URL for production
      const baseUrl = API_BASE_URL ? `${API_BASE_URL}/api` : '/api';

      // Determine timeout based on endpoint
      const isLongOperation = LONG_TIMEOUT_ENDPOINTS.some(ep => endpoint.includes(ep));
      const timeout = options.timeout || (isLongOperation ? LONG_TIMEOUT : DEFAULT_TIMEOUT);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        // Make the request with timeout
        const response = await fetch(`${baseUrl}${endpoint}`, {
          ...options,
          headers,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

      // Parse response safely
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        // If response is not JSON, use text as message
        if (!response.ok) {
             throw new Error(text || `Request failed with status ${response.status}`);
        }
        // If success but not JSON (unexpected), just return text
        return text;
      }

      // Handle errors
      if (!response.ok) {
        const errorMessage = data?.message || data?.error || data?.details || `Request failed with status ${response.status}`;
        const error = new Error(errorMessage);
        error.response = { data, status: response.status };
        throw error;
      }

      return data;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          const error = new Error('Request timed out. The operation is taking longer than expected. Please wait and check if it completed.');
          error.response = { status: 408, data: { message: 'Request timeout' } };
          throw error;
        }
        throw fetchError;
      }
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  /**
   * POST request
   */
  async post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * PUT request
   */
  async put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  /**
   * PATCH request
   */
  async patch(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  },
};

export default apiClient;
