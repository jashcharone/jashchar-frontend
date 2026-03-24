import React, { useState, useEffect } from 'react';
import { formatDate } from '@/utils/dateUtils';
import { useParams, Link } from 'react-router-dom';
import publicCmsService from '@/services/publicCmsService';
import { Loader2, ArrowLeft, Calendar, User } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { PublicHeader, PublicFooter, TopBar } from '@/components/public/PublicLayoutComponents';

const SchoolPublicNewsDetail = () => {
  const { schoolSlug, id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [siteRes, newsRes] = await Promise.all([
          publicCmsService.getPublicSite(schoolSlug),
          publicCmsService.getPublicNewsDetail(schoolSlug, id)
        ]);
        
        if (siteRes.success && newsRes.success) {
          setData({ 
            settings: siteRes.data.settings, 
            menus: siteRes.data.menus, 
            tickerNews: siteRes.data.news || [],
            newsItem: newsRes.data 
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
  if (!data) return <div className="min-h-screen flex items-center justify-center">News item not found</div>;

  const { settings, menus, tickerNews, newsItem } = data;

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">
      <Helmet><title>{`${newsItem.title} | ${settings.school_name}`}</title></Helmet>
      <TopBar settings={settings} news={tickerNews} />
      <PublicHeader settings={settings} menus={menus} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} slug={schoolSlug} />
      <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
        <Link to={`/school/${schoolSlug}/news`} className="inline-flex items-center text-primary hover:underline mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to News
        </Link>
        
        <article>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{newsItem.title}</h1>
          
          <div className="flex items-center text-gray-500 text-sm mb-8 space-x-4">
            <div className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {formatDate(newsItem.date)}</div>
            {newsItem.author && <div className="flex items-center"><User className="w-4 h-4 mr-1" /> {newsItem.author}</div>}
          </div>

          {newsItem.image_url && (
            <img src={newsItem.image_url} alt={newsItem.title} className="w-full h-auto rounded-lg shadow-md mb-8" />
          )}

          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: newsItem.content || '' }} />
        </article>
      </main>
      <PublicFooter settings={settings} />
    </div>
  );
};

export default SchoolPublicNewsDetail;
