import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { HomepageHeader } from '@/components/homepage/Header';
import Footer from '@/components/homepage/Footer';
import { defaultCmsContent } from '@/config/defaultCmsContent';

const SaasPublicPage = ({ slug }) => {
  const { pageSlug } = useParams();
  const activeSlug = slug || pageSlug;
  const [page, setPage] = useState(null);
  const [cmsContent, setCmsContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("SaasPublicPage: Starting fetch for slug:", activeSlug);
        
        // Use backend API to bypass RLS
        const apiBase = '/api';
        const url = `${apiBase}/public/saas/homepage`;
        console.log("SaasPublicPage: Fetching from URL:", url);

        const response = await fetch(url);
        console.log("SaasPublicPage: Response status:", response.status);

        if (!response.ok) {
            const text = await response.text();
            console.error("SaasPublicPage: Fetch failed:", text);
            throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log("SaasPublicPage: API Result:", result);

        if (!result.success) {
            console.error("SaasPublicPage: API Error:", result.message);
            throw new Error(result.message);
        }

        const settingsData = result.data?.settings;

        let settings = defaultCmsContent;
        if (settingsData) {
             console.log("SaasPublicPage: Settings found in response");
             settings = {
                ...defaultCmsContent,
                ...settingsData,
                header: settingsData.header || defaultCmsContent.header,
                footer: settingsData.footer || defaultCmsContent.footer,
             };
             
             // Find page
             const pages = settingsData.pages || settingsData.general_settings?.pages || [];
             console.log(`SaasPublicPage: Searching ${pages.length} pages for slug: ${activeSlug}`);
             
             // Robust matching: normalize both stored slug and active slug
             // Replace spaces with hyphens to handle user input variations
             // Also strip 'page/' prefix if it was accidentally saved in the DB slug
             const normalize = (s) => (s || '').toLowerCase()
                .replace(/^page\//, '') 
                .replace(/^\/+|\/+$/g, '')
                .replace(/\s+/g, '-')
                .trim();
             const targetSlug = normalize(activeSlug);

             const foundPage = pages.find(p => normalize(p.slug) === targetSlug);
             
             if (foundPage) {
                 console.log("SaasPublicPage: Page FOUND:", foundPage.title);
                 setPage(foundPage);
             } else {
                 console.warn("SaasPublicPage: Page NOT FOUND for slug:", activeSlug);
                 // Log available slugs for debugging
                 console.log("Available slugs:", pages.map(p => p.slug));
             }
        } else {
            console.log("SaasPublicPage: No settings data found in DB.");
        }
        setCmsContent(settings);
      } catch (error) {
        console.error("SaasPublicPage: Exception:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (activeSlug) {
        fetchData();
    } else {
        console.error("SaasPublicPage: No slug provided!");
        setLoading(false);
    }
  }, [activeSlug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-bold text-primary">Jashchar ERP</div>;
  
  if (error) return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Page</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded">Retry</button>
      </div>
  );

  if (!page) return (
      <div className="min-h-screen flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p>Could not find content for: {activeSlug}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Check console for details.</p>
      </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HomepageHeader settings={cmsContent} />
      <main className="flex-grow">
        {/* Render content directly to allow full-width sections */}
        <div dangerouslySetInnerHTML={{ __html: page.content }} />
      </main>
      <Footer content={cmsContent?.footer} contact={cmsContent?.contact} header={cmsContent?.header} />
    </div>
  );
};

export default SaasPublicPage;
