import React, { useState, useEffect } from 'react';
import { formatDate } from '@/utils/dateUtils';
import { useParams, Link } from 'react-router-dom';
import publicCmsService from '@/services/publicCmsService';
import { Loader2, Calendar, MapPin } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { PublicHeader, PublicFooter, TopBar } from '@/components/public/PublicLayoutComponents';

const SchoolPublicEventsList = () => {
  const { schoolSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [siteRes, eventsRes] = await Promise.all([
          publicCmsService.getPublicSite(schoolSlug),
          publicCmsService.getPublicEventsList(schoolSlug)
        ]);
        
        if (siteRes.success && eventsRes.success) {
          setData({ 
            settings: siteRes.data.settings, 
            menus: siteRes.data.menus, 
            tickerNews: siteRes.data.news || [],
            events: eventsRes.data 
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

  const { settings, menus, tickerNews, events } = data;

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">
      <Helmet><title>{`Events | ${settings.school_name}`}</title></Helmet>
      <TopBar settings={settings} news={tickerNews} />
      <PublicHeader settings={settings} menus={menus} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} slug={schoolSlug} />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Upcoming Events</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <div key={event.id} className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              {event.image_url && <img src={event.image_url} alt={event.title} className="w-full h-48 object-cover" />}
              <div className="p-5 flex-grow">
                <div className="flex items-center text-primary font-semibold mb-2 text-sm">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(event.start_date)}
                </div>
                <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                {event.location && (
                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <MapPin className="w-4 h-4 mr-1" /> {event.location}
                  </div>
                )}
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{event.description}</p>
              </div>
              <div className="p-5 pt-0 mt-auto">
                <Link to={`/school/${schoolSlug}/events/${event.id}`} className="block w-full text-center bg-gray-50 hover:bg-gray-100 text-gray-800 font-medium py-2 rounded transition-colors">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
      <PublicFooter settings={settings} />
    </div>
  );
};

export default SchoolPublicEventsList;
