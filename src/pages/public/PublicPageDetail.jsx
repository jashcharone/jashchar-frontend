import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSchoolSlug } from '@/hooks/useSchoolSlug';
import publicCmsService from '@/services/publicCmsService';
import { PublicHeader, PublicFooter, TopBar } from '@/components/public/PublicLayoutComponents';
import InactiveSchoolNotification from '@/components/public/InactiveSchoolNotification';
import { Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet';

const PublicPageDetail = () => {
  const { schoolSlug, pageSlug } = useParams();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch site data (settings, menus) AND page data
        const [siteRes, pageRes] = await Promise.all([
          publicCmsService.getPublicSite(schoolSlug),
          publicCmsService.getPublicPage(schoolSlug, pageSlug)
        ]);

        if (siteRes.success) {
          setData(siteRes.data);
        }
        if (pageRes.success && pageRes.data) {
          setPage(pageRes.data.page || pageRes.data);
          // Also check school status from pageRes if available
          if (pageRes.data.school && pageRes.data.school.status === 'Inactive') {
            setData(prev => ({ ...prev, school: pageRes.data.school }));
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [schoolSlug, pageSlug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!data || !page) return <div className="min-h-screen flex items-center justify-center">Page not found</div>;

  const { settings, menus, school } = data;

  // Check if school is inactive
  if (school?.status === 'Inactive') {
    return <InactiveSchoolNotification settings={settings} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900">
      <Helmet>
        <title>{`${page.title} - ${settings?.site_title}`}</title>
      </Helmet>

      <TopBar settings={settings} news={data.news} />
      <PublicHeader 
        settings={settings} 
        menus={menus} 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
        slug={schoolSlug} 
      />

      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{page.title}</h1>
            {page.featured_image && (
              <img src={page.featured_image} alt={page.title} className="w-full h-[400px] object-cover rounded-lg mb-8" />
            )}
            <div className="prose prose-lg max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: page.content }} />
          </div>
        </div>
      </main>

      <PublicFooter settings={settings} />
    </div>
  );
};
export default PublicPageDetail;
