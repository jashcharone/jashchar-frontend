import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import publicCmsService from '@/services/publicCmsService';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { PublicHeader, PublicFooter, TopBar } from '@/components/public/PublicLayoutComponents';

const SchoolPublicGallery = () => {
  const { schoolSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [siteRes, galleryRes] = await Promise.all([
          publicCmsService.getPublicSite(schoolSlug),
          publicCmsService.getPublicGalleriesList(schoolSlug)
        ]);
        
        if (siteRes.success && galleryRes.success) {
          setData({ 
            settings: siteRes.data.settings, 
            menus: siteRes.data.menus, 
            news: siteRes.data.news || [],
            galleries: galleryRes.data 
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

  const { settings, menus, news, galleries } = data;

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">
      <Helmet><title>{`Gallery | ${settings.school_name}`}</title></Helmet>
      <TopBar settings={settings} news={news} />
      <PublicHeader settings={settings} menus={menus} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} slug={schoolSlug} />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Photo Gallery</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleries.map(gallery => (
            <Link key={gallery.id} to={`/${schoolSlug}/read/${gallery.id}`} className="group block relative bg-white shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="relative h-64 w-full bg-gray-200">
                {gallery.cover_image ? (
                  <img src={gallery.cover_image} alt={gallery.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-[#c72027] py-3 px-4">
                <h3 className="text-white font-bold text-center text-lg truncate">{gallery.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <PublicFooter settings={settings} />
    </div>
  );
};

export default SchoolPublicGallery;
