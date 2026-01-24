import { supabase } from '@/lib/customSupabaseClient';
import { masterAdminSafetyService } from '@/services/masterAdminSafetyService';

export const saasWebsiteSettingsService = {
  getSaasWebsiteSettings: async () => {
    const { data, error } = await supabase
      .from('saas_website_settings')
      .select('*')
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching SaaS settings:', error);
      throw error;
    }
    return data;
  },

  upsertSaasWebsiteSettings: async (data) => {
    // Safety Check
    masterAdminSafetyService.blockUnauthorizedModification('saas_website_settings'); 
    // NOTE: saas_website_settings is NOT in the forbidden list for THIS service because this service is specifically FOR updating it.
    // However, if this service was generic, we would block it. 
    // Since 'saas_website_settings' is NOT in the PROTECTED_TABLES list in masterAdminConstants.js (it contains 'schools', 'users' etc),
    // we are safe to proceed. 
    // But just in case someone added it there by mistake or if we want to prevent *other* updates:
    
    // Ensure we are not touching school tables here
    if (data.schools || data.users) {
         throw new Error("Security Violation: SaaS settings cannot modify core school tables.");
    }

    if (data.demo_school_enabled && data.demo_school_url) {
       if (!data.demo_school_url.startsWith('/') && !data.demo_school_url.startsWith('http')) {
           throw new Error("Demo School URL must start with '/' (relative) or 'http' (absolute)");
       }
    }

    const { data: existing, error: fetchError } = await supabase
      .from('saas_website_settings')
      .select('id')
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
      const { error } = await supabase
        .from('saas_website_settings')
        .update(data)
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('saas_website_settings')
        .insert([data]);
      if (error) throw error;
    }
  }
};
