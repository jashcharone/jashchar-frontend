import axios from 'axios';
import { supabase } from '../customSupabaseClient';

// Use relative URL - Vercel rewrites /api/* to Railway backend
const API_URL = '/api';

export const humanResourceApi = {
    getEmploymentCategories: async (branchId) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        const params = new URLSearchParams();
        if (branchId) params.append('branchId', branchId);
        
        const response = await axios.get(`${API_URL}/human-resource/employment-categories?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getDepartments: async (branchId) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        const params = new URLSearchParams();
        if (branchId) params.append('branchId', branchId);

        const response = await axios.get(`${API_URL}/human-resource/departments?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getDesignations: async (branchId) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        const params = new URLSearchParams();
        if (branchId) params.append('branchId', branchId);

        const response = await axios.get(`${API_URL}/human-resource/designations?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};
