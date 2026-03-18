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
    const response = await api.get(`${FACE_ANALYTICS_BASE}/stats/daily`, { params });
    return response.data;
};

/**
 * Get weekly attendance trends
 * @param {Object} params - { branch_id, session_id?, days? }
 */
export const getWeeklyTrends = async (params) => {
    const response = await api.get(`${FACE_ANALYTICS_BASE}/stats/weekly`, { params });
    return response.data;
};

/**
 * Get class-wise attendance breakdown
 * @param {Object} params - { branch_id, session_id?, date? }
 */
export const getClassWiseStats = async (params) => {
    const response = await api.get(`${FACE_ANALYTICS_BASE}/stats/class-wise`, { params });
    return response.data;
};

/**
 * Get face recognition performance metrics
 * @param {Object} params - { branch_id, days? }
 */
export const getPerformanceStats = async (params) => {
    const response = await api.get(`${FACE_ANALYTICS_BASE}/stats/performance`, { params });
    return response.data;
};

// ═══════════════════════════════════════════════════════════════════════════════
// HEATMAP & VISUALIZATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get hourly recognition heatmap data
 * @param {Object} params - { branch_id, days? }
 */
export const getHourlyHeatmap = async (params) => {
    const response = await api.get(`${FACE_ANALYTICS_BASE}/heatmap/hourly`, { params });
    return response.data;
};

/**
 * Get camera-wise recognition heatmap
 * @param {Object} params - { branch_id, date? }
 */
export const getCameraHeatmap = async (params) => {
    const response = await api.get(`${FACE_ANALYTICS_BASE}/heatmap/camera`, { params });
    return response.data;
};

// ═══════════════════════════════════════════════════════════════════════════════
// LATE ARRIVALS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get late arrivals list
 * @param {Object} params - { branch_id, session_id?, date?, limit? }
 */
export const getLateArrivals = async (params) => {
    const response = await api.get(`${FACE_ANALYTICS_BASE}/late-arrivals`, { params });
    return response.data;
};

/**
 * Get late arrivals summary statistics
 * @param {Object} params - { branch_id, session_id?, date? }
 */
export const getLateArrivalsSummary = async (params) => {
    const response = await api.get(`${FACE_ANALYTICS_BASE}/late-arrivals/summary`, { params });
    return response.data;
};

// ═══════════════════════════════════════════════════════════════════════════════
// UNKNOWN FACES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get unknown faces list
 * @param {Object} params - { branch_id, date?, limit?, status? }
 */
export const getUnknownFaces = async (params) => {
    const response = await api.get(`${FACE_ANALYTICS_BASE}/unknown-faces`, { params });
    return response.data;
};

/**
 * Manually identify an unknown face
 * @param {string} id - Face recognition log ID
 * @param {Object} data - { person_id, person_type }
 */
export const identifyUnknownFace = async (id, data) => {
    const response = await api.post(`${FACE_ANALYTICS_BASE}/unknown-faces/${id}/identify`, data);
    return response.data;
};

/**
 * Dismiss an unknown face
 * @param {string} id - Face recognition log ID
 * @param {Object} data - { reason? }
 */
export const dismissUnknownFace = async (id, data = {}) => {
    const response = await api.post(`${FACE_ANALYTICS_BASE}/unknown-faces/${id}/dismiss`, data);
    return response.data;
};

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS & EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get attendance report
 * @param {Object} params - { branch_id, session_id?, start_date, end_date, class_id?, section_id? }
 */
export const getAttendanceReport = async (params) => {
    const response = await api.get(`${FACE_ANALYTICS_BASE}/reports/attendance`, { params });
    return response.data;
};

/**
 * Get recognition report
 * @param {Object} params - { branch_id, start_date, end_date, camera_id? }
 */
export const getRecognitionReport = async (params) => {
    const response = await api.get(`${FACE_ANALYTICS_BASE}/reports/recognition`, { params });
    return response.data;
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
    const response = await api.get(`${FACE_ANALYTICS_BASE}/spoof-stats`, { params });
    return response.data;
};

/**
 * Get spoof attempt trends
 * @param {Object} params - { branch_id, days? }
 */
export const getSpoofTrends = async (params) => {
    const response = await api.get(`${FACE_ANALYTICS_BASE}/spoof-stats/trends`, { params });
    return response.data;
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
