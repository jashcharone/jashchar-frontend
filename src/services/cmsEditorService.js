import { supabase } from '@/lib/customSupabaseClient';
import { masterAdminSafetyService } from '@/services/masterAdminSafetyService';
import axios from 'axios';

// Get auth token for API calls
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
};

/**
 * Validates if the target table is safe to write to.
 * @param {string} table 
 */
const ensureSafety = (table) => {
    masterAdminSafetyService.blockUnauthorizedModification(table);
};

export const cmsEditorService = {
  // --- CMS SETTINGS ---
  getSettings: async (branchId) => {
    const { data, error } = await supabase.from('school_website_settings').select('*').eq('branch_id', branchId).maybeSingle();
    if (error) throw error;
    return data;
  },

  updateSettings: async (branchId, settings) => {
    ensureSafety('school_website_settings'); // Safe
    const { data: existing } = await supabase.from('school_website_settings').select('id').eq('branch_id', branchId).maybeSingle();
    
    if (existing) {
      const { error } = await supabase.from('school_website_settings').update({ ...settings, updated_at: new Date() }).eq('branch_id', branchId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('school_website_settings').insert({ ...settings, branch_id: branchId });
      if (error) throw error;
    }
  },

  // --- SCHOOL LOGIN SETTINGS (via Backend API to bypass RLS) ---
  getSchoolLoginSettings: async (branchId) => {
    try {
      const token = await getAuthToken();
      const response = await axios.get('/api/front-cms/login-settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-school-id': branchId
        }
      });
      return response.data.data || null;
    } catch (error) {
      console.error('[cmsEditorService] getSchoolLoginSettings error:', error);
      // Fallback to direct Supabase for read (might work if RLS allows select)
      const { data, error: dbError } = await supabase.from('school_login_settings').select('*').eq('branch_id', branchId).maybeSingle();
      if (dbError) throw dbError;
      return data;
    }
  },

  upsertSchoolLoginSettings: async (branchId, data) => {
    const token = await getAuthToken();
    const response = await axios.put('/api/front-cms/login-settings', data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-school-id': branchId
      }
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to save login settings');
    }
    return response.data.data;
  },

  // --- BANNERS ---
  getBanners: async (branchId) => {
    const { data, error } = await supabase.from('front_cms_banners').select('*').eq('branch_id', branchId).order('position');
    if (error) throw error;
    return data;
  },
  upsertBanner: async (bannerData) => {
    ensureSafety('front_cms_banners');
    const { error } = await supabase.from('front_cms_banners').upsert(bannerData);
    if (error) throw error;
  },
  deleteBanner: async (id) => {
    ensureSafety('front_cms_banners');
    const { error } = await supabase.from('front_cms_banners').delete().eq('id', id);
    if (error) throw error;
  },

  // --- PAGES ---
  getPages: async (branchId) => {
    const { data, error } = await supabase.from('front_cms_pages').select('*').eq('branch_id', branchId).order('created_at');
    if (error) throw error;
    return data;
  },
  upsertPage: async (pageData) => {
    ensureSafety('front_cms_pages');
    const { error } = await supabase.from('front_cms_pages').upsert(pageData);
    if (error) throw error;
  },
  deletePage: async (id) => {
    ensureSafety('front_cms_pages');
    const { error } = await supabase.from('front_cms_pages').delete().eq('id', id);
    if (error) throw error;
  },

  // --- NEWS ---
  getNews: async (branchId) => {
    const { data, error } = await supabase.from('front_cms_news').select('*').eq('branch_id', branchId).order('published_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  upsertNews: async (newsData) => {
    ensureSafety('front_cms_news');
    const { error } = await supabase.from('front_cms_news').upsert(newsData);
    if (error) throw error;
  },
  deleteNews: async (id) => {
    ensureSafety('front_cms_news');
    const { error } = await supabase.from('front_cms_news').delete().eq('id', id);
    if (error) throw error;
  },

  // --- EVENTS ---
  getEvents: async (branchId) => {
    const { data, error } = await supabase.from('front_cms_events').select('*').eq('branch_id', branchId).order('start_date');
    if (error) throw error;
    return data;
  },
  upsertEvent: async (eventData) => {
    ensureSafety('front_cms_events');
    const { error } = await supabase.from('front_cms_events').upsert(eventData);
    if (error) throw error;
  },
  deleteEvent: async (id) => {
    ensureSafety('front_cms_events');
    const { error } = await supabase.from('front_cms_events').delete().eq('id', id);
    if (error) throw error;
  },

  // --- GALLERY ---
  getAlbums: async (branchId) => {
    const { data, error } = await supabase.from('front_cms_gallery_albums').select('*').eq('branch_id', branchId).order('created_at');
    if (error) throw error;
    return data;
  },
  upsertAlbum: async (albumData) => {
    ensureSafety('front_cms_gallery_albums');
    const { error } = await supabase.from('front_cms_gallery_albums').upsert(albumData);
    if (error) throw error;
  },
  deleteAlbum: async (id) => {
    ensureSafety('front_cms_gallery_albums');
    const { error } = await supabase.from('front_cms_gallery_albums').delete().eq('id', id);
    if (error) throw error;
  },
  getImages: async (albumId) => {
    const { data, error } = await supabase.from('front_cms_gallery_items').select('*').eq('album_id', albumId).order('created_at');
    if (error) throw error;
    return data;
  },
  upsertImage: async (imageData) => {
    ensureSafety('front_cms_gallery_items');
    const { error } = await supabase.from('front_cms_gallery_items').upsert(imageData);
    if (error) throw error;
  },
  deleteImage: async (id) => {
    ensureSafety('front_cms_gallery_items');
    const { error } = await supabase.from('front_cms_gallery_items').delete().eq('id', id);
    if (error) throw error;
  },

  // --- NOTICES ---
  getNotices: async (branchId) => {
    const { data, error } = await supabase.from('front_cms_notices').select('*').eq('branch_id', branchId).order('published_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  upsertNotice: async (noticeData) => {
    ensureSafety('front_cms_notices');
    const { error } = await supabase.from('front_cms_notices').upsert(noticeData);
    if (error) throw error;
  },
  deleteNotice: async (id) => {
    ensureSafety('front_cms_notices');
    const { error } = await supabase.from('front_cms_notices').delete().eq('id', id);
    if (error) throw error;
  },

  // --- MENUS ---
  getMenus: async (branchId) => {
    const { data, error } = await supabase.from('front_cms_menus').select('*').eq('branch_id', branchId).order('created_at');
    if (error) throw error;
    return data;
  },
  upsertMenu: async (menuData) => {
    ensureSafety('front_cms_menus');
    const { error } = await supabase.from('front_cms_menus').upsert(menuData);
    if (error) throw error;
  },
  deleteMenu: async (id) => {
    ensureSafety('front_cms_menus');
    const { error } = await supabase.from('front_cms_menus').delete().eq('id', id);
    if (error) throw error;
  },

  // --- MENU ITEMS ---
  getMenuItems: async (menuId) => {
    const { data, error } = await supabase.from('front_cms_menu_items').select('*, front_cms_pages:page_id(title)').eq('menu_id', menuId).order('order_index');
    if (error) throw error;
    return data;
  },
  upsertMenuItem: async (itemData) => {
    ensureSafety('front_cms_menu_items');
    const { error } = await supabase.from('front_cms_menu_items').upsert(itemData);
    if (error) throw error;
  },
  deleteMenuItem: async (id) => {
    ensureSafety('front_cms_menu_items');
    const { error } = await supabase.from('front_cms_menu_items').delete().eq('id', id);
    if (error) throw error;
  },

  // --- FOOTER LINKS ---
  getFooterLinks: async (branchId) => {
    const { data, error } = await supabase.from('front_cms_footer_links').select('*').eq('branch_id', branchId).order('sort_order');
    if (error) throw error;
    return data;
  },
  upsertFooterLink: async (linkData) => {
    ensureSafety('front_cms_footer_links');
    const { error } = await supabase.from('front_cms_footer_links').upsert(linkData);
    if (error) throw error;
  },
  deleteFooterLink: async (id) => {
    ensureSafety('front_cms_footer_links');
    const { error } = await supabase.from('front_cms_footer_links').delete().eq('id', id);
    if (error) throw error;
  },

  // --- MEDIA ---
  getMedia: async (branchId) => {
    const { data, error } = await supabase.from('front_cms_media').select('*').eq('branch_id', branchId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  deleteMedia: async (id) => {
    ensureSafety('front_cms_media');
    // Get the file path first
    const { data: media } = await supabase.from('front_cms_media').select('file_path').eq('id', id).single();
    
    if (media?.file_path) {
      await supabase.storage.from('cms-media').remove([media.file_path]);
    }

    const { error } = await supabase.from('front_cms_media').delete().eq('id', id);
    if (error) throw error;
  }
};
