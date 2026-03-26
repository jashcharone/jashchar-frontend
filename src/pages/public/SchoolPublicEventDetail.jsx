import React, { useState, useEffect } from 'react';
import { formatDate } from '@/utils/dateUtils';
import { useParams, Link } from 'react-router-dom';
import publicCmsService from '@/services/publicCmsService';
import { Loader2, ArrowLeft, Calendar, MapPin, Clock, ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { PublicHeader, PublicFooter, TopBar } from '@/components/public/PublicLayoutComponents';

const SchoolPublicEventDetail = () => {
  const { schoolSlug, id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [siteRes, eventRes] = await Promise.all([
          publicCmsService.getPublicSite(schoolSlug),
          publicCmsService.getPublicEventDetail(schoolSlug, id)
        ]);
        
        if (siteRes.success && eventRes.success) {
          setData({ 
            settings: siteRes.data.settings, 
            menus: siteRes.data.menus, 
            tickerNews: siteRes.data.news || [],
            event: eventRes.data.event,
            recentEvents: eventRes.data.recentEvents
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
  if (!data || !data.event) return <div className="min-h-screen flex items-center justify-center">Event not found</div>;

  const { settings, menus, tickerNews, event, recentEvents } = data;
  const showSidebar = event.sidebar_setting;

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">
      <Helmet>
        <title>{`${event.title} | ${settings.school_name}`}</title>
        {event.meta_title && <meta name="title" content={event.meta_title} />}
        {event.meta_description && <meta name="description" content={event.meta_description} />}
        {event.meta_keyword && <meta name="keywords" content={event.meta_keyword} />}
      </Helmet>
      <TopBar settings={settings} news={tickerNews} />
      <PublicHeader settings={settings} menus={menus} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} slug={schoolSlug} />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <Link to={`/school/${schoolSlug}/events`} className="inline-flex items-center text-primary hover:underline mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
        </Link>
        
        <div className={`grid grid-cols-1 ${showSidebar ? 'lg:grid-cols-3 gap-8' : 'max-w-4xl mx-auto'}`}>
          
          {/* Main Content */}
          <div className={showSidebar ? 'lg:col-span-2' : ''}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {event.image_url && (
                <img src={event.image_url} alt={event.title} className="w-full h-64 md:h-96 object-cover" />
              )}
              
              <div className="p-6 md:p-10">
                <h1 className="text-3xl font-bold mb-6">{event.title}</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-primary mr-3" />
                    <div>
                      <div className="text-xs text-gray-500 uppercase font-bold">Date</div>
                      <div className="font-medium">
                        {formatDate(event.start_date)} 
                        {event.end_date && ` - ${formatDate(event.end_date)}`}
                      </div>
                    </div>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-primary mr-3" />
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-bold">Location</div>
                        <div className="font-medium">{event.location}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="prose max-w-none">
                  <h3 className="text-lg font-bold mb-2">About this Event</h3>
                  <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: event.description }} />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          {showSidebar && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Recent Events</h3>
                <div className="space-y-4">
                  {recentEvents && recentEvents.length > 0 ? (
                    recentEvents.map(re => (
                      <Link key={re.id} to={`/school/${schoolSlug}/events/${re.id}`} className="block group">
                        <div className="text-sm text-gray-500 mb-1">{formatDate(re.start_date)}</div>
                        <div className="font-medium group-hover:text-primary transition-colors line-clamp-2">
                          {re.title}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm">No other events found.</div>
                  )}
                </div>
                <div className="mt-6 pt-4 border-t">
                  <Link to={`/school/${schoolSlug}/events`} className="text-primary text-sm font-medium hover:underline flex items-center">
                    View All Events <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
      <PublicFooter settings={settings} />
    </div>
  );
};

export default SchoolPublicEventDetail;
