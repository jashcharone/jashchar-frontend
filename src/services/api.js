import { getApiBaseUrl } from '@/utils/platform';
import { supabase } from '@/lib/customSupabaseClient';

// Platform-aware API URL (Capacitor uses full Railway URL, web uses relative /api)
const _apiBase = getApiBaseUrl();
const BASE_URL = _apiBase ? `${_apiBase}/api` : '/api';

console.log('[API] Resolved baseURL:', BASE_URL);

// Helper function to get auth token
const getAuthToken = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('[API] Error getting auth token:', error);
    return null;
  }
};

// Helper function to get user context from localStorage
const getUserContext = () => {
  return {
    organizationId: localStorage.getItem('selectedOrganizationId'),
    branchId: localStorage.getItem('selectedBranchId'),
    sessionId: localStorage.getItem('selectedSessionId')
  };
};

// Helper function for API calls
const apiCall = async (endpoint, method = 'GET', body = null) => {
  try {
    // Get auth token
    const token = await getAuthToken();
    const context = getUserContext();
    
    // Check if body is FormData (for file uploads)
    const isFormData = body instanceof FormData;
    
    const options = {
      method,
      headers: {},
    };

    // Only set Content-Type for non-FormData requests
    // For FormData, browser sets it automatically with boundary
    if (!isFormData) {
      options.headers['Content-Type'] = 'application/json';
    }

    // Add Authorization header if token exists
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add context headers for backend
    if (context.organizationId) {
      options.headers['x-organization-id'] = context.organizationId;
    }
    if (context.branchId) {
      options.headers['x-branch-id'] = context.branchId;
      options.headers['x-school-id'] = context.branchId;
    }
    if (context.sessionId) {
      options.headers['x-session-id'] = context.sessionId;
    }

    if (body) {
      options.body = isFormData ? body : JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// --- API Functions ---

export const api = {
  // Schools
  getSchools: () => apiCall('/schools'),
  getSchoolById: (id) => apiCall(`/schools/${id}`),
  addSchool: (data) => apiCall('/schools', 'POST', data),

  // Students
  getStudents: (branchId) => apiCall(`/students?branchId=${branchId}`),
  addStudent: (data) => apiCall('/students', 'POST', data),

  // Staff
  getStaff: (branchId) => apiCall(`/staff?branchId=${branchId}`),
  addStaff: (data) => apiCall('/staff', 'POST', data),

  // Academics
  getClasses: (branchId) => apiCall(`/academics/classes?branchId=${branchId}`),
  getSections: (classId) => apiCall(`/academics/sections?classId=${classId}`),
  
  // Fees
  collectFee: (data) => apiCall('/fees/collect', 'POST', data),

  // Generic
  get: (url) => apiCall(url, 'GET'),
  post: (url, data) => apiCall(url, 'POST', data),
  put: (url, data) => apiCall(url, 'PUT', data),
  delete: (url) => apiCall(url, 'DELETE'),
};

export default api;
