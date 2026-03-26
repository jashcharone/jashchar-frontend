import React, { useState, useEffect } from 'react';
import { formatDate } from '@/utils/dateUtils';
import { useParams, Link } from 'react-router-dom';
import publicCmsService from '@/services/publicCmsService';
import { Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { PublicHeader, PublicFooter, TopBar } from '@/components/public/PublicLayoutComponents';

const SchoolPublicNewsList = () => {
  const { schoolSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [siteRes, newsRes] = await Promise.all([
          publicCmsService.getPublicSite(schoolSlug),
          publicCmsService.getPublicNewsList(schoolSlug)
        ]);
        
        if (siteRes.success && newsRes.success) {
          setData({ 
            settings: siteRes.data.settings, 
            menus: siteRes.data.menus, 
            tickerNews: siteRes.data.news || [],
            news: newsRes.data 
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

  const { settings, menus, tickerNews, news } = data;

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">
      <Helmet><title>{`News | ${settings.school_name}`}</title></Helmet>
      <TopBar settings={settings} news={tickerNews} />
      <PublicHeader settings={settings} menus={menus} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} slug={schoolSlug} />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">School News</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {news.map(item => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover" />}
              <div className="p-5">
                <div className="text-xs text-primary font-semibold mb-2">{formatDate(item.date)}</div>
                <h3 className="text-xl font-bold mb-2 line-clamp-2">{item.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{item.summary}</p>
                <Link to={`/school/${schoolSlug}/news/${item.id}`} className="text-primary text-sm font-medium hover:underline">Read More &rarr;</Link>
              </div>
            </div>
          ))}
        </div>
      </main>
      <PublicFooter settings={settings} />
    </div>
  );
};

export default SchoolPublicNewsList;
