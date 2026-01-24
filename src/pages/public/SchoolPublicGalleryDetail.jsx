import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import publicCmsService from '@/services/publicCmsService';
import { Loader2, ArrowLeft, Maximize2, X } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { PublicHeader, PublicFooter, TopBar } from '@/components/public/PublicLayoutComponents';

const SchoolPublicGalleryDetail = () => {
  const { schoolSlug, id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [siteRes, galleryRes] = await Promise.all([
          publicCmsService.getPublicSite(schoolSlug),
          publicCmsService.getPublicGalleryDetail(schoolSlug, id)
        ]);
        
        if (siteRes.success && galleryRes.success) {
          setData({ 
            settings: siteRes.data.settings, 
            menus: siteRes.data.menus, 
            news: siteRes.data.news || [],
            gallery: galleryRes.data.gallery,
            images: galleryRes.data.images
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [schoolSlug, id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center">Gallery not found</div>;

  const { settings, menus, news, gallery, images } = data;

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">
      <Helmet><title>{`${gallery.title} | ${settings.school_name}`}</title></Helmet>
      <TopBar settings={settings} news={news} />
      <PublicHeader settings={settings} menus={menus} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} slug={schoolSlug} />
      <main className="flex-grow container mx-auto px-4 py-12">
        <Link to={`/${schoolSlug}/gallery`} className="inline-flex items-center text-primary hover:underline mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Galleries
        </Link>
        
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-4">{gallery.title}</h1>
          <p className="text-gray-600 max-w-3xl">{gallery.description}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images && images.map((img, index) => (
            <div 
              key={index} 
              className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
              onClick={() => setSelectedImage(img)}
            >
              <img src={img.url || img.image_url} alt={img.caption || `Gallery image ${index + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Maximize2 className="text-white w-8 h-8 drop-shadow-lg" />
              </div>
              {img.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-2 truncate">
                  {img.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      <PublicFooter settings={settings} />

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300 p-2">
            <X className="w-8 h-8" />
          </button>
          <div className="max-w-5xl max-h-screen w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img src={selectedImage.url || selectedImage.image_url} alt={selectedImage.caption} className="max-w-full max-h-[80vh] object-contain rounded-sm shadow-2xl" />
            {selectedImage.caption && (
              <p className="text-white mt-4 text-center text-lg font-medium">{selectedImage.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolPublicGalleryDetail;
