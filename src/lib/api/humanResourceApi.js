import api from '../api';

// Uses shared api instance which auto-attaches auth token + x-school-id header
export const humanResourceApi = {
    getEmploymentCategories: async (branchId) => {
        const params = {};
        if (branchId) params.branchId = branchId;
        
        const response = await api.get('/human-resource/employment-categories', { params });
        return response.data;
    },

    getDepartments: async (branchId) => {
        const params = {};
        if (branchId) params.branchId = branchId;

        const response = await api.get('/human-resource/departments', { params });
        return response.data;
    },

    getDesignations: async (branchId) => {
        const params = {};
        if (branchId) params.branchId = branchId;

        const response = await api.get('/human-resource/designations', { params });
        return response.data;
    }
};
