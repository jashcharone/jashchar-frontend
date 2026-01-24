import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import publicCmsService from '@/services/publicCmsService';
import { Loader2, Bell } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { PublicHeader, PublicFooter, TopBar } from '@/components/public/PublicLayoutComponents';

const SchoolPublicNotices = () => {
  const { schoolSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // For now, we just fetch the site settings. 
        // In the future, we can add a specific API for notices or filter news by category 'notice'
        const siteRes = await publicCmsService.getPublicSite(schoolSlug);
        
        if (siteRes.success) {
          setData({ 
            settings: siteRes.data.settings, 
            menus: siteRes.data.menus,
            news: siteRes.data.news || []
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [schoolSlug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center">School not found</div>;

  const { settings, menus, news } = data;

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">
      <Helmet><title>{`Notices | ${settings.school_name}`}</title></Helmet>
      <TopBar settings={settings} news={news} />
      <PublicHeader settings={settings} menus={menus} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} slug={schoolSlug} />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 flex items-center">
          <Bell className="mr-3 h-8 w-8 text-primary" />
          School Notices
        </h1>
        
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-8 text-center">
          <p className="text-lg text-blue-800">No notices at this time.</p>
          <p className="text-sm text-blue-600 mt-2">Please check back later for updates.</p>
        </div>
      </main>
      <PublicFooter settings={settings} />
    </div>
  );
};

export default SchoolPublicNotices;
