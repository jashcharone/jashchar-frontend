// ═══════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - ADVANCED ATTENDANCE API SERVICE
// ═══════════════════════════════════════════════════════════════════════════════
// Frontend service for all advanced attendance features
// Supports: Devices, Cards, Face Registration, Rules, Geo-Fence, Analytics
// ═══════════════════════════════════════════════════════════════════════════════

import { supabase } from '../lib/supabase';
import { getApiBaseUrl } from '@/utils/platform';

// Platform-aware API URL (Capacitor uses full Railway URL, web uses relative /api)
const _apiBase = getApiBaseUrl();
const BASE_URL = _apiBase ? `${_apiBase}/api` : '/api';
const ADVANCED_BASE = `${BASE_URL}/attendance/advanced`;

/**
 * Helper function for authenticated API calls
 */
const apiCall = async (endpoint, method = 'GET', body = null, queryParams = {}) => {
  try {
    // Get current session token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Build URL with query params
    let url = `${ADVANCED_BASE}${endpoint}`;
    if (Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });
      url += `?${params.toString()}`;
    }

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    // Handle CSV response
    if (response.headers.get('Content-Type')?.includes('text/csv')) {
      return await response.text();
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API call failed');
    }

    return data;
  } catch (error) {
    console.error('Advanced Attendance API Error:', error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEVICE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export const deviceApi = {
  /**
   * Get all attendance devices
   * @param {Object} params - Query parameters
   * @param {string} params.branch_id - Branch ID
   * @param {string} params.device_type - Filter by device type
   * @param {string} params.status - Filter by status (online/offline/maintenance)
   */
  getAll: (params = {}) => apiCall('/devices', 'GET', null, params),

  /**
   * Create a new device
   * @param {Object} deviceData - Device data
   */
  create: (deviceData) => apiCall('/devices', 'POST', deviceData),

  /**
   * Update a device
   * @param {string} id - Device ID
   * @param {Object} deviceData - Updated device data
   */
  update: (id, deviceData) => apiCall(`/devices/${id}`, 'PUT', deviceData),

  /**
   * Delete a device
   * @param {string} id - Device ID
   */
  delete: (id) => apiCall(`/devices/${id}`, 'DELETE'),

  /**
   * Ping a device to check status
   * @param {string} id - Device ID
   */
  ping: (id) => apiCall(`/devices/${id}/ping`, 'POST'),
};

// ═══════════════════════════════════════════════════════════════════════════════
// CARD MANAGEMENT (RFID/NFC)
// ═══════════════════════════════════════════════════════════════════════════════

export const cardApi = {
  /**
   * Get all attendance cards
   * @param {Object} params - Query parameters
   */
  getAll: (params = {}) => apiCall('/cards', 'GET', null, params),

  /**
   * Issue a new card
   * @param {Object} cardData - Card data
   */
  issue: (cardData) => apiCall('/cards', 'POST', cardData),

  /**
   * Update card status
   * @param {string} id - Card ID
   * @param {string} status - New status (active/deactivated/blocked)
   * @param {string} reason - Reason for status change
   */
  updateStatus: (id, status, reason = '') => 
    apiCall(`/cards/${id}/status`, 'PATCH', { status, reason }),

  /**
   * Deactivate all expired cards
   */
  deactivateExpired: () => apiCall('/cards/deactivate-expired', 'POST'),
};

// ═══════════════════════════════════════════════════════════════════════════════
// FACE REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════════

export const faceApi = {
  /**
   * Get face registrations
   * @param {Object} params - Query parameters
   */
  getAll: (params = {}) => apiCall('/faces', 'GET', null, params),

  /**
   * Register a new face
   * @param {Object} faceData - Face data with images
   */
  register: (faceData) => apiCall('/faces', 'POST', faceData),

  /**
   * Delete face registration
   * @param {string} id - Face registration ID
   */
  delete: (id) => apiCall(`/faces/${id}`, 'DELETE'),
};

// ═══════════════════════════════════════════════════════════════════════════════
// ATTENDANCE RULES
// ═══════════════════════════════════════════════════════════════════════════════

export const rulesApi = {
  /**
   * Get all attendance rules
   * @param {Object} params - Query parameters
   */
  getAll: (params = {}) => apiCall('/rules', 'GET', null, params),

  /**
   * Create a new rule
   * @param {Object} ruleData - Rule data
   */
  create: (ruleData) => apiCall('/rules', 'POST', ruleData),

  /**
   * Update a rule
   * @param {string} id - Rule ID
   * @param {Object} ruleData - Updated rule data
   */
  update: (id, ruleData) => apiCall(`/rules/${id}`, 'PUT', ruleData),

  /**
   * Delete a rule
   * @param {string} id - Rule ID
   */
  delete: (id) => apiCall(`/rules/${id}`, 'DELETE'),

  /**
   * Toggle rule active status
   * @param {string} id - Rule ID
   */
  toggle: (id) => apiCall(`/rules/${id}/toggle`, 'PATCH'),
};

// ═══════════════════════════════════════════════════════════════════════════════
// GEO-FENCE ZONES
// ═══════════════════════════════════════════════════════════════════════════════

export const geoFenceApi = {
  /**
   * Get all geo-fence zones
   * @param {Object} params - Query parameters
   */
  getAll: (params = {}) => apiCall('/geo-fence', 'GET', null, params),

  /**
   * Create a new geo-fence zone
   * @param {Object} zoneData - Zone data
   */
  create: (zoneData) => apiCall('/geo-fence', 'POST', zoneData),

  /**
   * Update a geo-fence zone
   * @param {string} id - Zone ID
   * @param {Object} zoneData - Updated zone data
   */
  update: (id, zoneData) => apiCall(`/geo-fence/${id}`, 'PUT', zoneData),

  /**
   * Delete a geo-fence zone
   * @param {string} id - Zone ID
   */
  delete: (id) => apiCall(`/geo-fence/${id}`, 'DELETE'),

  /**
   * Check if location is within any zone
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   */
  checkLocation: (latitude, longitude) => 
    apiCall('/geo-fence/check-location', 'GET', null, { latitude, longitude }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// ATTENDANCE LOGS
// ═══════════════════════════════════════════════════════════════════════════════

export const attendanceLogApi = {
  /**
   * Record attendance from any source
   * @param {Object} attendanceData - Attendance data
   */
  record: (attendanceData) => apiCall('/log', 'POST', attendanceData),

  /**
   * Get attendance logs
   * @param {Object} params - Query parameters
   */
  getAll: (params = {}) => apiCall('/logs', 'GET', null, params),
};

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export const liveDashboardApi = {
  /**
   * Get live statistics
   */
  getStats: () => apiCall('/live/stats', 'GET'),

  /**
   * Get recent activity feed
   * @param {number} limit - Number of records to fetch
   */
  getActivity: (limit = 50) => apiCall('/live/activity', 'GET', null, { limit }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS & REPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const analyticsApi = {
  /**
   * Get analytics summary
   * @param {Object} params - Query parameters
   */
  getSummary: (params = {}) => apiCall('/analytics', 'GET', null, params),

  /**
   * Export attendance report
   * @param {Object} params - Query parameters including format (json/csv)
   */
  exportReport: (params = {}) => apiCall('/export', 'GET', null, params),
};

// ═══════════════════════════════════════════════════════════════════════════════
// DIRECT SUPABASE QUERIES (for real-time and complex queries)
// ═══════════════════════════════════════════════════════════════════════════════

export const attendanceSupabase = {
  /**
   * Subscribe to real-time attendance updates
   * @param {string} branchId - Branch ID
   * @param {Function} callback - Callback function for updates
   */
  subscribeToLogs: (branchId, callback) => {
    return supabase
      .channel('attendance-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_logs_unified',
          filter: `branch_id=eq.${branchId}`
        },
        (payload) => callback(payload.new)
      )
      .subscribe();
  },

  /**
   * Get device status in real-time
   * @param {string} branchId - Branch ID
   * @param {Function} callback - Callback function for updates
   */
  subscribeToDevices: (branchId, callback) => {
    return supabase
      .channel('device-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_devices',
          filter: `branch_id=eq.${branchId}`
        },
        (payload) => callback(payload)
      )
      .subscribe();
  },

  /**
   * Get students for face registration/card issuance
   * @param {string} branchId - Branch ID
   * @param {string} searchTerm - Search term
   */
  searchUsers: async (branchId, searchTerm, userType = 'student') => {
    let query;
    
    if (userType === 'student') {
      query = supabase
        .from('student_profiles')
        .select('id, full_name, admission_number, class_id, section_id, photo_url')
        .eq('branch_id', branchId)
        .or(`full_name.ilike.%${searchTerm}%,admission_number.ilike.%${searchTerm}%`)
        .limit(20);
    } else {
      // Use employee_profiles (staff_profiles doesn't exist)
      query = supabase
        .from('employee_profiles')
        .select('id, full_name, phone, designation_id, department_id, photo_url')
        .eq('branch_id', branchId)
        .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(20);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * Get today's attendance summary
   * @param {string} organizationId - Organization ID
   * @param {string} branchId - Branch ID
   */
  getTodaySummary: async (organizationId, branchId) => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('attendance_logs_unified')
      .select('user_type, attendance_type, source')
      .eq('organization_id', organizationId)
      .eq('branch_id', branchId)
      .gte('recorded_at', `${today}T00:00:00`)
      .lte('recorded_at', `${today}T23:59:59`);

    if (error) throw error;

    // Calculate summary
    const summary = {
      totalCheckIns: data.filter(d => d.attendance_type === 'check_in').length,
      totalCheckOuts: data.filter(d => d.attendance_type === 'check_out').length,
      students: data.filter(d => d.user_type === 'student').length,
      staff: data.filter(d => d.user_type === 'staff').length,
      bySource: {
        manual: data.filter(d => d.source === 'manual').length,
        qr_code: data.filter(d => d.source === 'qr_code').length,
        rfid: data.filter(d => d.source === 'rfid').length,
        biometric: data.filter(d => d.source === 'biometric').length,
        face_recognition: data.filter(d => d.source === 'face_recognition').length,
        gps: data.filter(d => d.source === 'gps').length
      }
    };

    return summary;
  },

  /**
   * Get devices by type
   * @param {string} organizationId - Organization ID
   * @param {string} branchId - Branch ID
   */
  getDevicesByType: async (organizationId, branchId) => {
    const { data, error } = await supabase
      .from('attendance_devices')
      .select('device_type, status')
      .eq('organization_id', organizationId)
      .eq('branch_id', branchId);

    if (error) throw error;

    // Group by type
    const byType = {};
    data.forEach(device => {
      if (!byType[device.device_type]) {
        byType[device.device_type] = { total: 0, online: 0, offline: 0 };
      }
      byType[device.device_type].total++;
      if (device.status === 'online') {
        byType[device.device_type].online++;
      } else {
        byType[device.device_type].offline++;
      }
    });

    return byType;
  }
};

// Export all APIs as default
export default {
  device: deviceApi,
  card: cardApi,
  face: faceApi,
  rules: rulesApi,
  geoFence: geoFenceApi,
  logs: attendanceLogApi,
  live: liveDashboardApi,
  analytics: analyticsApi,
  supabase: attendanceSupabase
};
