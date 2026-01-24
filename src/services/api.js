// Always use relative /api path - Vercel rewrites to backend
// Only use VITE_API_BASE_URL for local development
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const apiBaseUrl = isLocalhost ? import.meta.env.VITE_API_BASE_URL : null;
const BASE_URL = apiBaseUrl ? `${apiBaseUrl}/api` : '/api';

// Helper function for API calls
const apiCall = async (endpoint, method = 'GET', body = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
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
