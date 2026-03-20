/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FACE ATTENDANCE ANALYTICS API SERVICE - Day 30
 * ─────────────────────────────────────────────────────────────────────────────
 * Frontend service for Face Attendance Analytics Dashboard
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import api from './api';

const FACE_ANALYTICS_BASE = '/face-analytics';

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get daily attendance statistics
 * @param {Object} params - { branch_id, session_id?, date? }
 */
export const getDailyStats = async (params) => {
    return api.get(`${FACE_ANALYTICS_BASE}/stats/daily`, { params });
};

/**
 * Get weekly attendance trends
 * @param {Object} params - { branch_id, session_id?, days? }
 */
export const getWeeklyTrends = async (params) => {
    return api.get(`${FACE_ANALYTICS_BASE}/stats/weekly`, { params });
};

/**
 * Get class-wise attendance breakdown
 * @param {Object} params - { branch_id, session_id?, date? }
 */
export const getClassWiseStats = async (params) => {
    return api.get(`${FACE_ANALYTICS_BASE}/stats/class-wise`, { params });
};

/**
 * Get face recognition performance metrics
 * @param {Object} params - { branch_id, days? }
 */
export const getPerformanceStats = async (params) => {
    return api.get(`${FACE_ANALYTICS_BASE}/stats/performance`, { params });
};

// ═══════════════════════════════════════════════════════════════════════════════
// HEATMAP & VISUALIZATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get hourly recognition heatmap data
 * @param {Object} params - { branch_id, days? }
 */
export const getHourlyHeatmap = async (params) => {
    return api.get(`${FACE_ANALYTICS_BASE}/heatmap/hourly`, { params });
};

/**
 * Get camera-wise recognition heatmap
 * @param {Object} params - { branch_id, date? }
 */
export const getCameraHeatmap = async (params) => {
    return api.get(`${FACE_ANALYTICS_BASE}/heatmap/camera`, { params });
};

// ═══════════════════════════════════════════════════════════════════════════════
// LATE ARRIVALS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get late arrivals list
 * @param {Object} params - { branch_id, session_id?, date?, limit? }
 */
export const getLateArrivals = async (params) => {
    return api.get(`${FACE_ANALYTICS_BASE}/late-arrivals`, { params });
};

/**
 * Get late arrivals summary statistics
 * @param {Object} params - { branch_id, session_id?, date? }
 */
export const getLateArrivalsSummary = async (params) => {
    return api.get(`${FACE_ANALYTICS_BASE}/late-arrivals/summary`, { params });
};

// ═══════════════════════════════════════════════════════════════════════════════
// UNKNOWN FACES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get unknown faces list
 * @param {Object} params - { branch_id, date?, limit?, status? }
 */
export const getUnknownFaces = async (params) => {
    return api.get(`${FACE_ANALYTICS_BASE}/unknown-faces`, { params });
};

/**
 * Manually identify an unknown face
 * @param {string} id - Face recognition log ID
 * @param {Object} data - { person_id, person_type }
 */
export const identifyUnknownFace = async (id, data) => {
    return api.post(`${FACE_ANALYTICS_BASE}/unknown-faces/${id}/identify`, data);
};

/**
 * Dismiss an unknown face
 * @param {string} id - Face recognition log ID
 * @param {Object} data - { reason? }
 */
export const dismissUnknownFace = async (id, data = {}) => {
    return api.post(`${FACE_ANALYTICS_BASE}/unknown-faces/${id}/dismiss`, data);
};

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS & EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get attendance report
 * @param {Object} params - { branch_id, session_id?, start_date, end_date, class_id?, section_id? }
 */
export const getAttendanceReport = async (params) => {
    return api.get(`${FACE_ANALYTICS_BASE}/reports/attendance`, { params });
};

/**
 * Get recognition report
 * @param {Object} params - { branch_id, start_date, end_date, camera_id? }
 */
export const getRecognitionReport = async (params) => {
    return api.get(`${FACE_ANALYTICS_BASE}/reports/recognition`, { params });
};

/**
 * Export analytics data
 * @param {string} type - 'attendance' or 'recognition'
 * @param {Object} params - { branch_id, start_date, end_date, format? }
 */
export const exportAnalytics = async (type, params) => {
    const response = await api.get(`${FACE_ANALYTICS_BASE}/export/${type}`, { 
        params,
        responseType: params.format === 'csv' ? 'blob' : 'json'
    });
    return response;
};

// ═══════════════════════════════════════════════════════════════════════════════
// SPOOF DETECTION STATS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get spoof detection statistics
 * @param {Object} params - { branch_id, date? }
 */
export const getSpoofStats = async (params) => {
    return api.get(`${FACE_ANALYTICS_BASE}/spoof-stats`, { params });
};

/**
 * Get spoof attempt trends
 * @param {Object} params - { branch_id, days? }
 */
export const getSpoofTrends = async (params) => {
    return api.get(`${FACE_ANALYTICS_BASE}/spoof-stats/trends`, { params });
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER - Download Export File
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Download exported file
 * @param {Blob} blob - File blob
 * @param {string} filename - File name
 */
export const downloadExportFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

export default {
    // Dashboard Stats
    getDailyStats,
    getWeeklyTrends,
    getClassWiseStats,
    getPerformanceStats,
    // Heatmap & Visualizations
    getHourlyHeatmap,
    getCameraHeatmap,
    // Late Arrivals
    getLateArrivals,
    getLateArrivalsSummary,
    // Unknown Faces
    getUnknownFaces,
    identifyUnknownFace,
    dismissUnknownFace,
    // Reports & Export
    getAttendanceReport,
    getRecognitionReport,
    exportAnalytics,
    downloadExportFile,
    // Spoof Stats
    getSpoofStats,
    getSpoofTrends
};
