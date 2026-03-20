// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - AI ENGINE API SERVICE
// Service for communicating with Python AI Engine (Face Detection, Recognition, FAISS)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { getApiBaseUrl } from '@/utils/platform';
import { supabase } from '@/lib/customSupabaseClient';

// API Base URL (goes through Node.js backend which proxies to Python AI Engine)
const _apiBase = getApiBaseUrl();
const BASE_URL = _apiBase ? `${_apiBase}/api` : '/api';

// Shared refresh lock to prevent multiple parallel refresh calls
let _refreshPromise = null;

const refreshTokenOnce = async () => {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = supabase.auth.refreshSession().finally(() => {
    _refreshPromise = null;
  });
  return _refreshPromise;
};

// Helper function to get auth token
const getAuthToken = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('[AI Engine API] Error getting auth token:', error);
    return null;
  }
};

// Helper function to get user context
const getUserContext = () => {
  return {
    organizationId: localStorage.getItem('selectedOrganizationId'),
    branchId: localStorage.getItem('selectedBranchId'),
    sessionId: localStorage.getItem('selectedSessionId')
  };
};

// Generic API call helper
const apiCall = async (endpoint, method = 'GET', body = null, _retry = false) => {
  try {
    const token = await getAuthToken();
    const context = getUserContext();
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add context headers
    if (context.organizationId) {
      options.headers['x-organization-id'] = context.organizationId;
    }
    if (context.branchId) {
      options.headers['x-branch-id'] = context.branchId;
    }
    if (context.sessionId) {
      options.headers['x-session-id'] = context.sessionId;
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    // On 401, refresh session (deduplicated) and retry once
    if (response.status === 401 && !_retry) {
      try {
        const { error } = await refreshTokenOnce();
        if (!error) {
          return apiCall(endpoint, method, body, true);
        }
      } catch (_) { /* fall through to throw */ }
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || 'AI Engine API error');
    }

    return data;
  } catch (error) {
    console.error('[AI Engine API] Error:', error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// AI ENGINE API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

export const aiEngineApi = {
  // ─────────────────────────────────────────────────────────────────────────────
  // CAMERA MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Get all cameras for branch
  getCameras: () => apiCall('/camera/cameras'),
  
  // Get camera by ID
  getCameraById: (id) => apiCall(`/camera/cameras/${id}`),
  
  // Create new camera
  createCamera: (data) => apiCall('/camera/cameras', 'POST', data),
  
  // Update camera
  updateCamera: (id, data) => apiCall(`/camera/cameras/${id}`, 'PUT', data),
  
  // Delete camera
  deleteCamera: (id) => apiCall(`/camera/cameras/${id}`, 'DELETE'),
  
  // Test camera connection
  testCameraConnection: (id) => apiCall(`/camera/cameras/${id}/test`, 'POST'),

  // ─────────────────────────────────────────────────────────────────────────────
  // RECOGNITION SETTINGS
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Get recognition settings
  getRecognitionSettings: () => apiCall('/camera/settings'),
  
  // Update recognition settings
  updateRecognitionSettings: (settings) => apiCall('/camera/settings', 'PUT', settings),

  // ─────────────────────────────────────────────────────────────────────────────
  // AI ENGINE (Face Detection & Recognition)
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Check AI Engine health
  checkHealth: () => apiCall('/camera/ai/health'),

  // Get detailed AI Engine status (proxied through backend)
  getAIStatus: () => apiCall('/camera/ai/status'),
  
  // Detect faces in image (returns bounding boxes)
  detectFaces: (imageBase64) => apiCall('/camera/ai/detect', 'POST', { image: imageBase64 }),
  
  // Recognize face (search in FAISS index)
  recognizeFace: (imageBase64, threshold = 0.6) => apiCall('/camera/ai/recognize', 'POST', { 
    image: imageBase64, 
    threshold 
  }),
  
  // Enroll new face (add to FAISS index)
  enrollFace: (personId, personType, personName, imageBase64) => apiCall('/camera/ai/enroll', 'POST', {
    person_id: personId,
    person_type: personType,
    person_name: personName,
    image: imageBase64
  }),
  
  // Get FAISS index status
  getIndexStatus: () => apiCall('/camera/ai/index/status'),
  
  // Rebuild FAISS index
  rebuildIndex: (branchId) => apiCall('/camera/ai/index/rebuild', 'POST', { branch_id: branchId }),

  // ─────────────────────────────────────────────────────────────────────────────
  // ENROLLMENT APIs (Day 14)
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Batch enroll multiple faces
  enrollFaceBatch: (branchId, enrollments) => apiCall('/camera/ai/enroll-batch', 'POST', {
    branch_id: branchId,
    enrollments
  }),
  
  // Multi-angle enrollment (front, left, right)
  enrollFaceMultiAngle: (branchId, personId, personName, personType, images) => apiCall('/camera/ai/enroll-multi-angle', 'POST', {
    branch_id: branchId,
    person_id: personId,
    person_name: personName,
    person_type: personType,
    images
  }),
  
  // Get enrolled faces list
  getEnrollments: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.personType) queryParams.append('person_type', params.personType);
    if (params.search) queryParams.append('search', params.search);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);
    
    const queryString = queryParams.toString();
    return apiCall(`/camera/enrollments${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get enrollment by person ID
  getEnrollmentByPersonId: (personId) => apiCall(`/camera/enrollments/${personId}`),
  
  // Delete enrollment
  deleteEnrollment: (personId) => apiCall(`/camera/enrollments/${personId}`, 'DELETE'),
  
  // Get enrollment counts
  getEnrollmentCount: (personType) => {
    const queryParams = personType ? `?person_type=${personType}` : '';
    return apiCall(`/camera/enrollments-count${queryParams}`);
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // RECOGNITION LOGS
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Get recognition logs
  getRecognitionLogs: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);
    if (params.date) queryParams.append('date', params.date);
    if (params.personType) queryParams.append('person_type', params.personType);
    
    const queryString = queryParams.toString();
    return apiCall(`/camera/logs${queryString ? `?${queryString}` : ''}`);
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FACE ATTENDANCE (Day 20 - Live Recognition Attendance)
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Mark face attendance from recognition
  markFaceAttendance: (data) => apiCall('/camera/attendance/mark', 'POST', data),
  
  // Get today's face attendance
  getTodayFaceAttendance: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.personType) queryParams.append('person_type', params.personType);
    if (params.classId) queryParams.append('class_id', params.classId);
    
    const queryString = queryParams.toString();
    return apiCall(`/camera/attendance/today${queryString ? `?${queryString}` : ''}`);
  },
  
  // Check attendance cooldown
  checkAttendanceCooldown: (personId, cooldownMinutes = 60) => {
    return apiCall(`/camera/attendance/cooldown-check?person_id=${personId}&cooldown_minutes=${cooldownMinutes}`);
  },
  
  // Get face attendance statistics
  getFaceAttendanceStats: (date) => {
    const queryParams = date ? `?date=${date}` : '';
    return apiCall(`/camera/attendance/stats${queryParams}`);
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ANTI-SPOOFING / LIVENESS DETECTION (Day 25-28)
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Check liveness status
  getLivenessStatus: () => apiCall('/camera/ai/liveness/status'),
  
  // Perform liveness check on image
  checkLiveness: (imageBase64) => apiCall('/camera/ai/liveness/check', 'POST', { 
    image: imageBase64 
  }),
  
  // Recognize with liveness (combined recognition + anti-spoofing)
  recognizeWithLiveness: (imageBase64, threshold = 0.6) => apiCall('/camera/ai/recognize-with-liveness', 'POST', {
    image: imageBase64,
    threshold
  }),
  
  // Get spoof alerts
  getSpoofAlerts: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.days) queryParams.append('days', params.days);
    if (params.status) queryParams.append('status', params.status);
    if (params.severity) queryParams.append('severity', params.severity);
    if (params.spoofType) queryParams.append('spoof_type', params.spoofType);
    
    const queryString = queryParams.toString();
    return apiCall(`/camera/spoof-alerts${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get spoof alerts summary
  getSpoofAlertsSummary: (days = 7) => apiCall(`/camera/spoof-alerts/summary?days=${days}`),
  
  // Log spoof alert
  logSpoofAlert: (alertData) => apiCall('/camera/spoof-alerts', 'POST', alertData),
  
  // Review spoof alert
  reviewSpoofAlert: (alertId, reviewData) => apiCall(`/camera/spoof-alerts/${alertId}/review`, 'PUT', reviewData),

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPER FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Convert canvas/video element to base64
  canvasToBase64: (canvas) => {
    return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
  },
  
  // Convert file to base64
  fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
  
  // Capture frame from video element
  captureVideoFrame: (videoElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
  }
};

export default aiEngineApi;
