/**
 * Examination API Service
 * Handles all API calls for examination module
 * @file jashchar-frontend/src/services/examinationService.js
 * @date 2026-03-09
 */

import apiClient from '@/lib/apiClient';

const BASE_URL = '/examinations';

// ============================================================================
// BOARD CONFIGURATION
// ============================================================================

export const boardConfigService = {
    /**
     * Get all board configurations
     * @param {Object} params - Query params { is_active }
     */
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/boards${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get single board configuration
     * @param {string} id - Board config ID
     */
    getById: async (id) => {
        return apiClient.get(`${BASE_URL}/boards/${id}`);
    },

    /**
     * Create board configuration
     * @param {Object} data - Board config data
     */
    create: async (data) => {
        return apiClient.post(`${BASE_URL}/boards`, data);
    },

    /**
     * Update board configuration
     * @param {string} id - Board config ID
     * @param {Object} data - Updated data
     */
    update: async (id, data) => {
        return apiClient.put(`${BASE_URL}/boards/${id}`, data);
    },

    /**
     * Delete board configuration
     * @param {string} id - Board config ID
     */
    delete: async (id) => {
        return apiClient.delete(`${BASE_URL}/boards/${id}`);
    }
};

// ============================================================================
// TERM MANAGEMENT
// ============================================================================

export const termService = {
    /**
     * Get all terms
     * @param {Object} params - Query params { is_active }
     */
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/terms${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get current active term
     */
    getCurrent: async () => {
        return apiClient.get(`${BASE_URL}/terms/current`);
    },

    /**
     * Get single term
     * @param {string} id - Term ID
     */
    getById: async (id) => {
        return apiClient.get(`${BASE_URL}/terms/${id}`);
    },

    /**
     * Create term
     * @param {Object} data - Term data
     */
    create: async (data) => {
        return apiClient.post(`${BASE_URL}/terms`, data);
    },

    /**
     * Update term
     * @param {string} id - Term ID
     * @param {Object} data - Updated data
     */
    update: async (id, data) => {
        return apiClient.put(`${BASE_URL}/terms/${id}`, data);
    },

    /**
     * Delete term
     * @param {string} id - Term ID
     */
    delete: async (id) => {
        return apiClient.delete(`${BASE_URL}/terms/${id}`);
    }
};

// ============================================================================
// EXAM TYPES
// ============================================================================

export const examTypeService = {
    /**
     * Get all exam types
     * @param {Object} params - Query params { is_active, category }
     */
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/exam-types${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get single exam type
     * @param {string} id - Exam type ID
     */
    getById: async (id) => {
        return apiClient.get(`${BASE_URL}/exam-types/${id}`);
    },

    /**
     * Create exam type
     * @param {Object} data - Exam type data
     */
    create: async (data) => {
        return apiClient.post(`${BASE_URL}/exam-types`, data);
    },

    /**
     * Update exam type
     * @param {string} id - Exam type ID
     * @param {Object} data - Updated data
     */
    update: async (id, data) => {
        return apiClient.put(`${BASE_URL}/exam-types/${id}`, data);
    },

    /**
     * Delete exam type
     * @param {string} id - Exam type ID
     */
    delete: async (id) => {
        return apiClient.delete(`${BASE_URL}/exam-types/${id}`);
    },

    /**
     * Seed default exam types
     */
    seedDefaults: async () => {
        return apiClient.post(`${BASE_URL}/exam-types/seed-defaults`);
    }
};

// ============================================================================
// GRADE SCALES
// ============================================================================

export const gradeScaleService = {
    /**
     * Get all grade scales
     * @param {Object} params - Query params { is_active, include_details }
     */
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/grade-scales${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get grade scale presets
     */
    getPresets: async () => {
        return apiClient.get(`${BASE_URL}/grade-scales/presets`);
    },

    /**
     * Get single grade scale with details
     * @param {string} id - Grade scale ID
     */
    getById: async (id) => {
        return apiClient.get(`${BASE_URL}/grade-scales/${id}`);
    },

    /**
     * Create grade scale with details
     * @param {Object} data - Grade scale data with details array
     */
    create: async (data) => {
        return apiClient.post(`${BASE_URL}/grade-scales`, data);
    },

    /**
     * Update grade scale with details
     * @param {string} id - Grade scale ID
     * @param {Object} data - Updated data with details array
     */
    update: async (id, data) => {
        return apiClient.put(`${BASE_URL}/grade-scales/${id}`, data);
    },

    /**
     * Delete grade scale
     * @param {string} id - Grade scale ID
     */
    delete: async (id) => {
        return apiClient.delete(`${BASE_URL}/grade-scales/${id}`);
    },

    /**
     * Duplicate grade scale
     * @param {string} id - Grade scale ID to duplicate
     * @param {string} newName - Name for the new scale
     */
    duplicate: async (id, newName) => {
        return apiClient.post(`${BASE_URL}/grade-scales/${id}/duplicate`, { new_scale_name: newName });
    }
};

// ============================================================================
// Exam Group Service
// ============================================================================
export const examGroupService = {
    /**
     * Get all exam groups
     * @param {Object} params - Filter parameters
     */
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiClient.get(`${BASE_URL}/exam-groups${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get single exam group with subjects
     * @param {string} id - Exam group ID
     */
    getById: async (id) => {
        return apiClient.get(`${BASE_URL}/exam-groups/${id}`);
    },

    /**
     * Create exam group
     * @param {Object} data - Exam group data
     */
    create: async (data) => {
        return apiClient.post(`${BASE_URL}/exam-groups`, data);
    },

    /**
     * Update exam group
     * @param {string} id - Exam group ID
     * @param {Object} data - Update data
     */
    update: async (id, data) => {
        return apiClient.put(`${BASE_URL}/exam-groups/${id}`, data);
    },

    /**
     * Delete exam group
     * @param {string} id - Exam group ID
     */
    delete: async (id) => {
        return apiClient.delete(`${BASE_URL}/exam-groups/${id}`);
    },

    /**
     * Publish exam group
     * @param {string} id - Exam group ID
     */
    publish: async (id) => {
        return apiClient.post(`${BASE_URL}/exam-groups/${id}/publish`);
    },

    /**
     * Get subjects for exam group
     * @param {string} id - Exam group ID
     */
    getSubjects: async (id) => {
        return apiClient.get(`${BASE_URL}/exam-groups/${id}/subjects`);
    },

    /**
     * Add subject to exam group
     * @param {string} id - Exam group ID
     * @param {Object} subjectData - Subject configuration
     */
    addSubject: async (id, subjectData) => {
        return apiClient.post(`${BASE_URL}/exam-groups/${id}/subjects`, subjectData);
    },

    /**
     * Update exam group subject
     * @param {string} groupId - Exam group ID
     * @param {string} subjectId - Subject record ID
     * @param {Object} data - Update data
     */
    updateSubject: async (groupId, subjectId, data) => {
        return apiClient.put(`${BASE_URL}/exam-groups/${groupId}/subjects/${subjectId}`, data);
    },

    /**
     * Remove subject from exam group
     * @param {string} groupId - Exam group ID
     * @param {string} subjectId - Subject record ID
     */
    deleteSubject: async (groupId, subjectId) => {
        return apiClient.delete(`${BASE_URL}/exam-groups/${groupId}/subjects/${subjectId}`);
    }
};

export default {
    boardConfigService,
    termService,
    examTypeService,
    gradeScaleService,
    examGroupService
};
