import React, { useState, useEffect } from 'react';
import { useSchoolSlug } from '@/hooks/useSchoolSlug';
import publicCmsService from '@/services/publicCmsService';
import { getMonthShortName } from '@/utils/dateUtils';
import { Loader2, Calendar, MapPin, Clock } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { PublicHeader, PublicFooter, TopBar } from '@/components/public/PublicLayoutComponents';
import InactiveSchoolNotification from '@/components/public/InactiveSchoolNotification';

const PublicEvents = () => {
  const schoolSlug = useSchoolSlug();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!schoolSlug) return;
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
            events: eventsRes.data,
            school: siteRes.data.school
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

  const { settings, menus, tickerNews, events, school } = data;

  // Check if school is inactive
  if (school?.status === 'Inactive') {
    return <InactiveSchoolNotification settings={settings} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">
      <Helmet><title>{`Events | ${settings.school_name}`}</title></Helmet>
      <TopBar settings={settings} news={tickerNews} />
      <PublicHeader settings={settings} menus={menus} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} slug={schoolSlug} />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Upcoming Events</h1>
        <div className="space-y-6 max-w-4xl mx-auto">
          {events.map(event => (
            <div key={event.id} className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col md:flex-row gap-6">
              <div className="bg-primary/10 text-primary rounded-lg p-4 text-center min-w-[100px] flex flex-col justify-center">
                <span className="block text-3xl font-bold">{new Date(event.start_date).getDate()}</span>
                <span className="block text-sm font-bold uppercase">{getMonthShortName(event.start_date)}</span>
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {event.venue || 'Campus'}</span>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <PublicFooter settings={settings} />
    </div>
  );
};

export default PublicEvents;
