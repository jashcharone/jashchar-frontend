import { useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import frontCmsService from '@/services/frontCmsService';
import { supabase } from '@/lib/customSupabaseClient';

const FaviconUpdater = () => {
  const { school } = useAuth();

  useEffect(() => {
    const updateFavicon = async () => {
      let faviconUrl = '/favicon.svg'; // Default

      if (school?.slug) {
        try {
          // Try to get from school settings first if available in context, 
          // otherwise fetch public settings
          const response = await frontCmsService.getPublicSettings(school.slug);
          if (response.success && response.data?.settings?.favicon_url) {
            faviconUrl = response.data.settings.favicon_url;
          }
        } catch (e) {
          console.error("Failed to fetch favicon settings", e);
        }
      } else {
        // SaaS Homepage / Master Admin context
        try {
            const { data: settingsData } = await supabase
                .from('saas_website_settings')
                .select('general_settings')
                .maybeSingle();
            
            if (settingsData?.general_settings?.favicon_url) {
                faviconUrl = settingsData.general_settings.favicon_url;
            } else if (settingsData?.general_settings?.pwa_icon_url) {
                 // Fallback to PWA icon if favicon is missing
                 faviconUrl = settingsData.general_settings.pwa_icon_url;
            }
        } catch (e) {
            console.error("Failed to fetch SaaS favicon settings", e);
        }
      }

      const link = document.querySelector("link[rel~='icon']");
      if (!link) {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        document.head.appendChild(newLink);
        newLink.href = faviconUrl;
      } else {
        link.href = faviconUrl;
      }
    };

    updateFavicon();
  }, [school?.slug]);

  return null;
};

export default FaviconUpdater;
