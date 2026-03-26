import axios from 'axios';

const API_URL = '/api/public';

const publicCmsService = {
  getSchoolSettings: async (slug) => {
    const response = await axios.get(`${API_URL}/site/${slug}`);
    return response.data;
  },
  getBanners: async (branchId) => {
    const response = await axios.get(`${API_URL}/banners/${branchId}`);
    return response.data;
  },
  getPublicSite: async (slug) => {
    const response = await axios.get(`${API_URL}/site/${slug}`);
    return response.data;
  },
  getPublicPage: async (slug, pageSlug) => {
    try {
      const response = await axios.get(`${API_URL}/page/${slug}/${pageSlug}`);
      return response.data;
    } catch (error) {
      // Return empty response for 404 (page not found) - this is expected for optional pages
      if (error.response?.status === 404) {
        return { success: false, data: { page: null } };
      }
      throw error;
    }
  },
  getPublicNewsList: async (slug) => {
    const response = await axios.get(`${API_URL}/news/${slug}`);
    return response.data;
  },
  getPublicNewsDetail: async (slug, id) => {
    const response = await axios.get(`${API_URL}/news/${slug}/${id}`);
    return response.data;
  },
  getPublicEventsList: async (slug) => {
    const response = await axios.get(`${API_URL}/events/${slug}`);
    return response.data;
  },
  getPublicEventDetail: async (slug, id) => {
    const response = await axios.get(`${API_URL}/events/${slug}/${id}`);
    return response.data;
  },
  getPublicGalleriesList: async (slug) => {
    const response = await axios.get(`${API_URL}/gallery/${slug}`);
    return response.data;
  },
  getPublicGalleryDetail: async (slug, id) => {
    const response = await axios.get(`${API_URL}/gallery/${slug}/${id}`);
    return response.data;
  },
  getOnlineAdmissionSettings: async (slug) => {
    const response = await axios.get(`${API_URL}/online-admission-settings/${slug}`);
    return response.data;
  },
  getPublicClasses: async (slug) => {
    const response = await axios.get(`${API_URL}/classes/${slug}`);
    return response.data;
  },
  // Get classes filtered by branch ID
  getClassesByBranch: async (slug, branchId) => {
    const response = await axios.get(`${API_URL}/classes/${slug}?branchId=${branchId}`);
    return response.data;
  },
  // Get student categories by branch ID
  getCategoriesByBranch: async (slug, branchId) => {
    const response = await axios.get(`${API_URL}/categories/${slug}?branchId=${branchId}`);
    return response.data;
  },
  getBranches: async (slug) => {
    const response = await axios.get(`${API_URL}/branches/${slug}`);
    return response.data;
  },
  submitAdmission: async (slug, data) => {
    const response = await axios.post(`${API_URL}/admission/${slug}`, data);
    return response.data;
  },
  // New Dynamic Sections
  getCourses: async (slug) => {
    const response = await axios.get(`${API_URL}/courses/${slug}`);
    return response.data;
  },
  getAchievements: async (slug) => {
    const response = await axios.get(`${API_URL}/achievements/${slug}`);
    return response.data;
  },
  getTeam: async (slug) => {
    const response = await axios.get(`${API_URL}/team/${slug}`);
    return response.data;
  },
  getTestimonials: async (slug) => {
    const response = await axios.get(`${API_URL}/testimonials/${slug}`);
    return response.data;
  },
  getPublicExams: async (slug) => {
    const response = await axios.get(`${API_URL}/site/${slug}/exams`);
    return response.data;
  },
  getPublicExamResult: async (slug, data) => {
    const response = await axios.post(`${API_URL}/site/${slug}/exam-result`, data);
    return response.data;
  }
};

export default publicCmsService;
