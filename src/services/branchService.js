import api from '@/lib/api';
import { supabase } from '@/lib/customSupabaseClient';

export const branchService = {
  // Get all branches for the current user's school (Owner gets all, Staff gets assigned)
  getBranches: async (branchId) => {
    const { data } = await api.get('/branches', {
        headers: { 'x-school-id': branchId }
    });
    return data.data || [];
  },

  // Get single branch by ID
  getBranch: async (branchId) => {
    const { data } = await api.get(`/branches/${branchId}`);
    return data.data;
  },

  // Create a new branch
  createBranch: async (branchData) => {
    const { data } = await api.post('/branches', branchData);
    return data.data;
  },

  // Update a branch
  updateBranch: async (branchId, branchData) => {
    const { data } = await api.put(`/branches/${branchId}`, branchData);
    return data.data;
  },

  // Delete a branch
  deleteBranch: async (branchId) => {
    const { data } = await api.delete(`/branches/${branchId}`);
    return data;
  },

  // Assign principal to branch
  assignPrincipal: async (branchId, userId) => {
    const { data } = await api.post(`/branches/${branchId}/assign-principal`, { user_id: userId });
    return data;
  },

  // Get branch settings
  getBranchSettings: async (branchId) => {
    const { data } = await api.get(`/branches/${branchId}/settings`);
    return data.data;
  },

  // Update branch settings
  updateBranchSettings: async (branchId, settings) => {
    const { data } = await api.put(`/branches/${branchId}/settings`, { settings });
    return data;
  },

  // Get current user's school (helper)
  getMySchool: async (userId) => {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('owner_user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Get branches where user is assigned (for staff/students)
  getMyBranches: async (branchId) => {
    const { data } = await api.get('/branches', {
        headers: { 'x-school-id': branchId }
    });
    return data.data || [];
  },

  // Get branch statistics
  getBranchStats: async (branchId) => {
    try {
      const { data } = await api.get(`/branches/${branchId}/stats`);
      return data.data;
    } catch (error) {
      // Return default stats if endpoint doesn't exist
      return { students: 0, staff: 0, classes: 0, sections: 0 };
    }
  }
};
