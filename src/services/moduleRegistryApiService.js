/**
 * MODULE REGISTRY API SERVICE (Enhanced)
 * Frontend API service for centralized Module Registry management
 * 
 * Features:
 * - CRUD operations for modules
 * - Sync operations (plans, schools)
 * - Version control
 * - Audit log
 */

import apiClient from '@/lib/apiClient';

const BASE_URL = '/module-registry';

export const moduleRegistryApiService = {
  // ==================== READ OPERATIONS ====================
  
  /**
   * Get all modules in tree structure (hierarchical)
   */
  getModuleTree: async () => {
    try {
      const response = await apiClient.get(BASE_URL);
      return response.data;
    } catch (error) {
      console.error('getModuleTree Error:', error);
      throw error;
    }
  },

  /**
   * Get all modules as flat list
   */
  getModulesFlat: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE_URL}/flat`, { params });
      return response.data;
    } catch (error) {
      console.error('getModulesFlat Error:', error);
      throw error;
    }
  },

  /**
   * Get single module by slug
   */
  getModule: async (slug) => {
    try {
      const response = await apiClient.get(`${BASE_URL}/${slug}`);
      return response.data;
    } catch (error) {
      console.error('getModule Error:', error);
      throw error;
    }
  },

  /**
   * Get all categories
   */
  getCategories: async () => {
    try {
      const response = await apiClient.get(`${BASE_URL}/categories`);
      return response.data;
    } catch (error) {
      console.error('getCategories Error:', error);
      throw error;
    }
  },

  /**
   * Get statistics
   */
  getStats: async () => {
    try {
      const response = await apiClient.get(`${BASE_URL}/stats`);
      return response.data;
    } catch (error) {
      console.error('getStats Error:', error);
      throw error;
    }
  },

  /**
   * Get version history
   */
  getVersionHistory: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE_URL}/versions`, { params });
      return response.data;
    } catch (error) {
      console.error('getVersionHistory Error:', error);
      throw error;
    }
  },

  /**
   * Get audit log
   */
  getAuditLog: async (params = {}) => {
    try {
      const response = await apiClient.get(`${BASE_URL}/audit-log`, { params });
      return response.data;
    } catch (error) {
      console.error('getAuditLog Error:', error);
      throw error;
    }
  },

  // ==================== WRITE OPERATIONS ====================

  /**
   * Create new module
   */
  createModule: async (moduleData) => {
    try {
      const response = await apiClient.post(BASE_URL, moduleData);
      return response.data;
    } catch (error) {
      console.error('createModule Error:', error);
      throw error;
    }
  },

  /**
   * Update module
   */
  updateModule: async (slug, updates) => {
    try {
      const response = await apiClient.put(`${BASE_URL}/${slug}`, updates);
      return response.data;
    } catch (error) {
      console.error('updateModule Error:', error);
      throw error;
    }
  },

  /**
   * Delete module (soft delete by default)
   */
  deleteModule: async (slug, hard = false) => {
    try {
      const response = await apiClient.delete(`${BASE_URL}/${slug}`, { params: { hard } });
      return response.data;
    } catch (error) {
      console.error('deleteModule Error:', error);
      throw error;
    }
  },

  /**
   * Bulk upsert modules
   */
  bulkUpsertModules: async (modules, autoSync = true) => {
    try {
      const response = await apiClient.post(`${BASE_URL}/bulk`, { modules, auto_sync: autoSync });
      return response.data;
    } catch (error) {
      console.error('bulkUpsertModules Error:', error);
      throw error;
    }
  },

  // ==================== SYNC OPERATIONS ====================

  /**
   * Sync modules to all plans
   */
  syncToAllPlans: async () => {
    try {
      const response = await apiClient.post(`${BASE_URL}/sync-all`);
      return response.data;
    } catch (error) {
      console.error('syncToAllPlans Error:', error);
      throw error;
    }
  },

  /**
   * Sync modules to specific plan
   */
  syncToPlan: async (planId) => {
    try {
      const response = await apiClient.post(`${BASE_URL}/sync-plan/${planId}`);
      return response.data;
    } catch (error) {
      console.error('syncToPlan Error:', error);
      throw error;
    }
  },

  /**
   * Sync school permissions
   */
  syncSchoolPermissions: async (branchId) => {
    try {
      const response = await apiClient.post(`${BASE_URL}/sync-school/${branchId}`);
      return response.data;
    } catch (error) {
      console.error('syncSchoolPermissions Error:', error);
      throw error;
    }
  },

  /**
   * Sync all schools for a plan
   */
  syncPlanSchools: async (planId) => {
    try {
      const response = await apiClient.post(`${BASE_URL}/sync-plan-schools/${planId}`);
      return response.data;
    } catch (error) {
      console.error('syncPlanSchools Error:', error);
      throw error;
    }
  },

  // ==================== VERSION CONTROL ====================

  /**
   * Rollback to specific version
   */
  rollbackToVersion: async (versionId) => {
    try {
      const response = await apiClient.post(`${BASE_URL}/rollback/${versionId}`);
      return response.data;
    } catch (error) {
      console.error('rollbackToVersion Error:', error);
      throw error;
    }
  },

  /**
   * Create manual snapshot
   */
  createSnapshot: async (changeSummary = 'Manual snapshot') => {
    try {
      const response = await apiClient.post(`${BASE_URL}/snapshot`, { change_summary: changeSummary });
      return response.data;
    } catch (error) {
      console.error('createSnapshot Error:', error);
      throw error;
    }
  }
};

export default moduleRegistryApiService;
