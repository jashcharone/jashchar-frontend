import { supabase } from '@/lib/customSupabaseClient';

/**
 * Service for Website Settings (New Module)
 * Separated to ensure safety and prevent overwriting existing cmsEditorService
 */
export const cmsWebsiteSettingsService = {
  /**
   * Get website settings for a school
   * Uses maybeSingle() to avoid PGRST116 error if no settings exist yet
   * @param {string} branchId 
   * @returns {object} settings
   */
  getSettings: async (branchId) => {
    try {
      const { data, error } = await supabase
        .from('cms_settings')
        .select('*')
        .eq('branch_id', branchId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching website settings:', error);
      throw error;
    }
  },

  /**
   * Upsert website settings
   * @param {string} branchId 
   * @param {object} data 
   * @returns {object} result
   */
  upsertSettings: async (branchId, data) => {
    try {
      // Check if URL Alias is unique (exclude current school)
      if (data.cms_url_alias) {
        const { data: existingAlias, error: aliasError } = await supabase
          .from('cms_settings')
          .select('branch_id')
          .eq('cms_url_alias', data.cms_url_alias)
          .neq('branch_id', branchId) 
          .maybeSingle();
        
        if (aliasError) throw aliasError;
        if (existingAlias) {
          throw new Error('URL Alias is already taken by another school.');
        }
      }

      // Prepare payload
      const payload = {
        branch_id: branchId,
        cms_title: data.cms_title,
        cms_url_alias: data.cms_url_alias,
        cms_frontend_active: data.cms_frontend_active,
        website_status_message: data.website_status_message,
        default_public_language: data.default_public_language,
        site_board_type: data.site_board_type,
        seo_index_enabled: data.seo_index_enabled,
        theme_variant: data.theme_variant,
        updated_at: new Date().toISOString()
      };

      // Use upsert with maybeSingle to handle return value safely
      const { data: result, error } = await supabase
        .from('cms_settings')
        .upsert(payload, { onConflict: 'branch_id' })
        .select()
        .maybeSingle();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error saving website settings:', error);
      throw error;
    }
  }
};
