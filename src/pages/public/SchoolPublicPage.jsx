import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import publicCmsService from '@/services/publicCmsService';
import { Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { PublicHeader, PublicFooter, TopBar } from '@/components/public/PublicLayoutComponents';
import OnlineAdmission from './OnlineAdmission';

const SchoolPublicPage = () => {
  const { schoolSlug, pageSlug } = useParams();
  
  // Default to 'homepage' if pageSlug is missing (for root school route)
  const effectivePageSlug = pageSlug || 'homepage';
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!schoolSlug) return;
      try {
        setLoading(true);
        // We need site data (menus, settings) AND page data
        // Also fetching news for the TopBar ticker
        const [pageResult, newsResult] = await Promise.all([
          publicCmsService.getPublicPage(schoolSlug, effectivePageSlug),
          publicCmsService.getPublicNewsList(schoolSlug)
        ]);

        if (pageResult.success) {
          setData({ 
            ...pageResult.data, 
            news: newsResult.success ? newsResult.data : [] 
          });
        } else {
          setError(pageResult.message);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [schoolSlug, effectivePageSlug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (error || !data) return <div className="min-h-screen flex items-center justify-center">Page not found</div>;

  const { settings, menus, page, news } = data;

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white dark:bg-gray-900 dark:text-white transition-colors duration-300">
      <Helmet>
        <title>{`${page.title} | ${settings.school_name}`}</title>
        <meta name="description" content={page.meta_description || page.title} />
        <meta name="keywords" content={page.meta_keywords} />
      </Helmet>
      <TopBar settings={settings} news={news} />
      <PublicHeader settings={settings} menus={menus} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} slug={schoolSlug} />
      <main className="flex-grow container mx-auto px-4 py-12">
        {page.page_type === 'online_admission' ? (
          <div className="max-w-6xl mx-auto">
             {/* We don't render the standard title/image here because OnlineAdmission has its own header */}
             <OnlineAdmission />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">{page.title}</h1>
            {(page.feature_image || page.featured_image) && (
              <img src={page.feature_image || page.featured_image} alt={page.title} className="w-full h-96 object-cover rounded-lg mb-8 shadow-sm" />
            )}
            <div className="prose prose-lg max-w-none text-gray-700 dark:text-gray-300 dark:prose-invert" dangerouslySetInnerHTML={{ __html: page.content || page.content_html || '' }} />
          </div>
        )}
      </main>
      <PublicFooter settings={settings} />
    </div>
  );
};

export default SchoolPublicPage;
