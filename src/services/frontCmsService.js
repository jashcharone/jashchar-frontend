import api from '@/lib/api';

const API_URL = '/front-cms';

// Helper to get headers with optional school ID
const getHeaders = (branchId = null) => {
  // Priority: 1. Passed branchId, 2. Session storage (for master admin impersonation)
  const targetSchoolId = branchId || sessionStorage.getItem('ma_target_branch_id');
  
  // console.log('[FrontCmsService] Target School ID:', targetSchoolId);
  
  if (targetSchoolId && targetSchoolId !== 'null' && targetSchoolId !== 'undefined') {
    return { headers: { 'x-school-id': targetSchoolId } };
  }
  // console.warn('[FrontCmsService] No valid school ID found. Request may fail.');
  return {};
};

const frontCmsService = {
  // Public
  getPublicSettings: async (slug) => {
    const response = await api.get(`/public/site/${slug}`);
    return response.data;
  },

  // Settings
  getSettings: async (branchId = null) => {
    const response = await api.get(`${API_URL}/settings`, getHeaders(branchId));
    return response.data;
  },
  updateSettings: async (data, branchId = null) => {
    const response = await api.put(`${API_URL}/settings`, data, getHeaders(branchId));
    return response.data;
  },

  // Online Admission Settings
  getOnlineAdmissionSettings: async (branchId = null) => {
    const response = await api.get(`${API_URL}/online-admission-settings`, getHeaders(branchId));
    return response.data;
  },
  updateOnlineAdmissionSettings: async (data, branchId = null) => {
    const response = await api.put(`${API_URL}/online-admission-settings`, data, getHeaders(branchId));
    return response.data;
  },

  // Menus
  getMenus: async (branchId = null) => {
    const response = await api.get(`${API_URL}/menus`, getHeaders(branchId));
    return response.data;
  },
  createMenu: async (data, branchId = null) => {
    const response = await api.post(`${API_URL}/menus`, data, getHeaders(branchId));
    return response.data;
  },
  updateMenu: async (id, data, branchId = null) => {
    const response = await api.put(`${API_URL}/menus/${id}`, data, getHeaders(branchId));
    return response.data;
  },
  deleteMenu: async (id, branchId = null) => {
    const response = await api.delete(`${API_URL}/menus/${id}`, getHeaders(branchId));
    return response.data;
  },

  // Menu Items
  getMenuItems: async (menuId, branchId = null) => {
    const response = await api.get(`${API_URL}/menu-items/${menuId}`, getHeaders(branchId));
    return response.data;
  },
  createMenuItem: async (data, branchId = null) => {
    const response = await api.post(`${API_URL}/menu-items`, data, getHeaders(branchId));
    return response.data;
  },
  updateMenuItem: async (id, data, branchId = null) => {
    const response = await api.put(`${API_URL}/menu-items/${id}`, data, getHeaders(branchId));
    return response.data;
  },
  deleteMenuItem: async (id, branchId = null) => {
    const response = await api.delete(`${API_URL}/menu-items/${id}`, getHeaders(branchId));
    return response.data;
  },

  // Pages
  getPages: async (branchId = null) => {
    const response = await api.get(`${API_URL}/pages`, getHeaders(branchId));
    return response.data;
  },
  getPage: async (id, branchId = null) => {
    const response = await api.get(`${API_URL}/pages/${id}`, getHeaders(branchId));
    return response.data;
  },
  createPage: async (data, branchId = null) => {
    const response = await api.post(`${API_URL}/pages`, data, getHeaders(branchId));
    return response.data;
  },
  updatePage: async (id, data, branchId = null) => {
    const response = await api.put(`${API_URL}/pages/${id}`, data, getHeaders(branchId));
    return response.data;
  },
  deletePage: async (id, branchId = null) => {
    const response = await api.delete(`${API_URL}/pages/${id}`, getHeaders(branchId));
    return response.data;
  },

  // Events
  getEvents: async (branchId = null) => {
    const response = await api.get(`${API_URL}/events`, getHeaders(branchId));
    return response.data;
  },
  createEvent: async (data, branchId = null) => {
    const response = await api.post(`${API_URL}/events`, data, getHeaders(branchId));
    return response.data;
  },
  updateEvent: async (id, data, branchId = null) => {
    const response = await api.put(`${API_URL}/events/${id}`, data, getHeaders(branchId));
    return response.data;
  },
  deleteEvent: async (id, branchId = null) => {
    const response = await api.delete(`${API_URL}/events/${id}`, getHeaders(branchId));
    return response.data;
  },

  // Gallery
  getGalleries: async (branchId = null) => {
    const response = await api.get(`${API_URL}/gallery`, getHeaders(branchId));
    return response.data;
  },
  getGallery: async (id, branchId = null) => {
    const response = await api.get(`${API_URL}/gallery/${id}`, getHeaders(branchId));
    return response.data;
  },
  createGallery: async (data, branchId = null) => {
    const response = await api.post(`${API_URL}/gallery`, data, getHeaders(branchId));
    return response.data;
  },
  updateGallery: async (id, data, branchId = null) => {
    const response = await api.put(`${API_URL}/gallery/${id}`, data, getHeaders(branchId));
    return response.data;
  },
  deleteGallery: async (id, branchId = null) => {
    const response = await api.delete(`${API_URL}/gallery/${id}`, getHeaders(branchId));
    return response.data;
  },

  // Gallery Images
  getGalleryImages: async (galleryId, branchId = null) => {
    const response = await api.get(`${API_URL}/gallery/${galleryId}/images`, getHeaders(branchId));
    return response.data;
  },
  addGalleryImage: async (data, branchId = null) => {
    const response = await api.post(`${API_URL}/gallery/images`, data, getHeaders(branchId));
    return response.data;
  },
  deleteGalleryImage: async (id, branchId = null) => {
    const response = await api.delete(`${API_URL}/gallery/images/${id}`, getHeaders(branchId));
    return response.data;
  },

  // News
  getNews: async (branchId = null) => {
    const response = await api.get(`${API_URL}/news`, getHeaders(branchId));
    return response.data;
  },
  getNewsItem: async (id, branchId = null) => {
    const response = await api.get(`${API_URL}/news/${id}`, getHeaders(branchId));
    return response.data;
  },
  createNews: async (data, branchId = null) => {
    const response = await api.post(`${API_URL}/news`, data, getHeaders(branchId));
    return response.data;
  },
  updateNews: async (id, data, branchId = null) => {
    const response = await api.put(`${API_URL}/news/${id}`, data, getHeaders(branchId));
    return response.data;
  },
  deleteNews: async (id, branchId = null) => {
    const response = await api.delete(`${API_URL}/news/${id}`, getHeaders(branchId));
    return response.data;
  },

  // Banners
  getBanners: async (branchId = null) => {
    const response = await api.get(`${API_URL}/banners`, getHeaders(branchId));
    return response.data;
  },
  createBanner: async (data, branchId = null) => {
    const response = await api.post(`${API_URL}/banners`, data, getHeaders(branchId));
    return response.data;
  },
  updateBanner: async (id, data, branchId = null) => {
    const response = await api.put(`${API_URL}/banners/${id}`, data, getHeaders(branchId));
    return response.data;
  },
  deleteBanner: async (id, branchId = null) => {
    const response = await api.delete(`${API_URL}/banners/${id}`, getHeaders(branchId));
    return response.data;
  },

  // Media
  getMedia: async (branchId = null) => {
    const response = await api.get(`${API_URL}/media`, getHeaders(branchId));
    return response.data;
  },
  createMedia: async (data, branchId = null) => {
    const response = await api.post(`${API_URL}/media`, data, getHeaders(branchId));
    return response.data;
  },
  deleteMedia: async (id, branchId = null) => {
    const response = await api.delete(`${API_URL}/media/${id}`, getHeaders(branchId));
    return response.data;
  },
};

export default frontCmsService;
