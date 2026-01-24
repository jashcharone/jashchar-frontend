import { supabase } from '@/lib/customSupabaseClient';

/**
 * CMS Service Layer for Front Website - Public Read
 */

const CACHE_TTL = 60 * 1000; 
const cacheStore = {
  data: new Map(),
  timestamps: new Map()
};

const getCached = (key) => {
  const now = Date.now();
  const timestamp = cacheStore.timestamps.get(key);
  if (timestamp && (now - timestamp < CACHE_TTL)) return cacheStore.data.get(key);
  return null;
};

const setCached = (key, data) => {
  cacheStore.data.set(key, data);
  cacheStore.timestamps.set(key, Date.now());
};

export const resolveSchoolBySlug = async (schoolSlug) => {
  const cacheKey = `school_resolve_${schoolSlug}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    console.log('[cmsService] Resolving slug:', schoolSlug);
    
    // Try branches table first (primary table in this project)
    // Use ilike for case-insensitive matching
    const { data: branchData, error: branchError } = await supabase
      .from('branches')
      .select('id, branch_name, branch_code, contact_email, contact_mobile, address')
      .or(`branch_code.ilike.${schoolSlug},branch_name.ilike.${schoolSlug}`)
      .maybeSingle();

    console.log('[cmsService] Branch query result:', { branchData, branchError });

    if (branchData) {
      // Map branch fields to expected format
      const result = {
        id: branchData.id,
        name: branchData.branch_name,
        slug: branchData.branch_code,
        cms_url_alias: branchData.branch_code,
        address: branchData.address,
        contact_email: branchData.contact_email,
        contact_number: branchData.contact_mobile
      };
      setCached(cacheKey, result);
      return result;
    }

    // Fallback to schools table
    const { data, error } = await supabase
      .from('schools')
      .select('id, name, logo_url, cms_url_alias, slug, address, contact_email, contact_number')
      .or(`cms_url_alias.ilike.${schoolSlug},slug.ilike.${schoolSlug}`)
      .maybeSingle();

    console.log('[cmsService] Schools query result:', { data, error });

    if (error) throw error;
    if (data) setCached(cacheKey, data);
    return data;
  } catch (err) {
    console.error('[cmsService] resolveSchoolBySlug error:', err);
    return null;
  }
};

export const getPublicCmsSettings = async (branchId) => {
  const cacheKey = `settings_${branchId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.from('cms_settings').select('*').eq('branch_id', branchId).maybeSingle();
    if (error) throw error;
    setCached(cacheKey, data);
    return data;
  } catch (err) { return null; }
};

export const getPublicBanners = async (branchId) => {
  const { data } = await supabase.from('cms_banners').select('*').eq('branch_id', branchId).eq('is_active', true).order('position');
  return data || [];
};

export const getPublicMenus = async (branchId) => {
  const { data } = await supabase.from('cms_menus').select('*').eq('branch_id', branchId).eq('is_active', true).order('position');
  return data || [];
};

export const getPublicPages = async (branchId) => {
  const { data } = await supabase.from('cms_pages').select('*').eq('branch_id', branchId).eq('is_published', true).order('sort_order');
  return data || [];
};

export const getPublicNews = async (branchId, limit = 5) => {
  let query = supabase.from('cms_news').select('*').eq('branch_id', branchId).eq('is_published', true).order('date', { ascending: false });
  if (limit) query = query.limit(limit);
  const { data } = await query;
  return data || [];
};

export const getPublicEvents = async (branchId, limit = 5) => {
  let query = supabase.from('cms_events').select('*').eq('branch_id', branchId).eq('is_published', true).order('start_date', { ascending: true }).gte('start_date', new Date().toISOString());
  if (limit) query = query.limit(limit);
  const { data } = await query;
  return data || [];
};

export const getPublicGalleryAlbums = async (branchId) => {
  const { data } = await supabase.from('cms_gallery_albums').select('*').eq('branch_id', branchId).eq('is_published', true).order('created_at', { ascending: false });
  return data || [];
};

export const getPublicGalleryImages = async (albumId) => {
  const { data } = await supabase.from('cms_gallery_images').select('*').eq('album_id', albumId).order('created_at');
  return data || [];
};

export const getPublicNotices = async (branchId, limit = 10) => {
  let query = supabase.from('cms_notices').select('*').eq('branch_id', branchId).eq('is_published', true).order('notice_date', { ascending: false });
  if (limit) query = query.limit(limit);
  const { data } = await query;
  return data || [];
};

export const getPublicFooterLinks = async (branchId) => {
  const { data } = await supabase.from('cms_footer_links').select('*').eq('branch_id', branchId).order('sort_order');
  return data || [];
};

// NEW: Get Public Login Settings
export const getPublicSchoolLoginSettings = async (schoolSlug) => {
  try {
    console.log('[cmsService] getPublicSchoolLoginSettings called with slug:', schoolSlug);
    const school = await resolveSchoolBySlug(schoolSlug);
    console.log('[cmsService] Resolved school:', school);
    if (!school) return null;

    const { data, error } = await supabase
      .from('school_login_settings')
      .select('*')
      .eq('branch_id', school.id)
      .maybeSingle();
    
    console.log('[cmsService] Login settings query result:', { data, error });
    if (error) throw error;
    return data;
  } catch (err) { 
    console.error('[cmsService] Error:', err);
    return null; 
  }
};

// Aggregate Data for Homepage
export const getFullSchoolData = async (schoolSlug, lang = 'en') => {
  const cacheKey = `full_home_${schoolSlug}_${lang}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const school = await resolveSchoolBySlug(schoolSlug);
  if (!school) return null;
  const branchId = school.id;

  const [settings, banners, menus, news, events, notices, albums, footerLinks] = await Promise.all([
    getPublicCmsSettings(branchId),
    getPublicBanners(branchId),
    getPublicMenus(branchId),
    getPublicNews(branchId, 6),
    getPublicEvents(branchId, 6),
    getPublicNotices(branchId, 10),
    getPublicGalleryAlbums(branchId),
    getPublicFooterLinks(branchId)
  ]);

  // Process Gallery: Get first few images from first few albums
  let recentGallery = [];
  if (albums.length > 0) {
    const { data: images } = await supabase.from('cms_gallery_images').select('*').in('album_id', albums.slice(0, 3).map(a => a.id)).limit(10);
    recentGallery = images || [];
  }

  const fullData = {
    branchId,
    school,
    settings: settings || {},
    banners,
    menus,
    news,
    events,
    notices,
    gallery: recentGallery,
    footerLinks,
    // Compatibility with old structure if needed
    cms_frontend_active: settings?.cms_frontend_active !== false,
    name_en: settings?.name_en || school.name,
    name_kn: settings?.name_kn || school.name,
    logo_url: settings?.logo_url || school.logo_url
  };

  setCached(cacheKey, fullData);
  return fullData;
};

const cmsService = {
  resolveSchoolBySlug,
  getFullSchoolData,
  getPublicSchoolLoginSettings,
  getPublicPages,
  getPublicNews,
  getPublicEvents,
  getPublicGalleryAlbums,
  getPublicGalleryImages,
  getPublicNotices
};

export default cmsService;
