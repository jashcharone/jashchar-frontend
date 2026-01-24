import api from '../api';
import { supabase } from '../customSupabaseClient';

export const staffApi = {
    addStaff: async (staffData) => {
        // Uses api instance which automatically adds auth token and context headers
        const response = await api.post('/staff', staffData);
        return response.data;
    },

    searchStaffByMobile: async (mobile) => {
        // Normalize mobile (remove +91 or 91 prefix for search if needed, or search both)
        // We'll search via Supabase directly for speed/simplicity as per current pattern
        // or add a backend endpoint. Let's use Supabase directly here as it's a read op.
        
        const cleanMobile = mobile.replace(/\D/g, '');
        // Search for exact match or with +91
        const { data, error } = await supabase
            .from('employee_profiles')
            .select(`
                id, 
                full_name, 
                username, 
                phone, 
                email, 
                designation:designations(name),
                branch:schools(name) 
            `) // Note: branch might be schools or branches table depending on schema. 
               // Assuming 'schools' for now based on 'branch_id'.
            .or(`phone.eq.${cleanMobile},phone.eq.+91${cleanMobile},phone.eq.91${cleanMobile}`)
            .maybeSingle();
            
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    checkUserExistence: async (mobile, email) => {
        const params = new URLSearchParams();
        if (mobile) params.append('mobile', mobile);
        if (email) params.append('email', email);

        const response = await api.get(`/staff/check-existence?${params.toString()}`);
        return response.data;
    },

    disableStaff: async (id, data) => {
        const response = await api.put(`/staff/${id}/disable`, data);
        return response.data;
    },

    getPincodeDetails: async (pincode) => {
        // Use the backend proxy to avoid CSP issues with external APIs
        const response = await api.get(`/address/pincode/${pincode}`);
        return response.data;
    },

    getBankDetails: async (ifsc) => {
        // Proxy bank lookup to backend
        const response = await api.get(`/address/bank-ifsc/${ifsc}`);
        return response.data;
    }
};
