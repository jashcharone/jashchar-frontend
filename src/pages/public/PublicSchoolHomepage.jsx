import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useSchoolSlug } from '@/hooks/useSchoolSlug';
import { useSchoolPublicData } from '@/hooks/useSchoolPublicData';
import PublicSchoolHeader from '@/components/public/PublicSchoolHeader';
import PublicSchoolFooter from '@/components/public/PublicSchoolFooter';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight, Image as ImageIcon, GraduationCap, BookOpen, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const PublicSchoolHomepage = () => {
  const schoolAlias = useSchoolSlug();
  const { school, settings, loading, error } = useSchoolPublicData(schoolAlias);
  const [banners, setBanners] = useState([]);
  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);
  const [gallery, setGallery] = useState([]);

  // Theme colors from settings
  const primaryColor = settings?.primary_color || '#2563eb';
  const buttonHoverColor = settings?.button_hover_color || '#1d4ed8';
  const textColor = settings?.text_color || '#1e293b';
  const textSecondaryColor = settings?.text_secondary_color || '#64748b';

  useEffect(() => {
    if (school?.id) {
      fetchContent(school.id);
    }
  }, [school?.id]);

  const fetchContent = async (branchId) => {
    // Parallel fetching for performance - using front_cms_* tables
    const [bannersRes, newsRes, eventsRes, galleryRes] = await Promise.all([
      supabase.from('front_cms_banners').select('*').eq('branch_id', branchId).eq('is_active', true).order('position', { ascending: true }),
      supabase.from('front_cms_news').select('*').eq('branch_id', branchId).eq('is_published', true).order('published_at', { ascending: false }).limit(3),
      supabase.from('front_cms_events').select('*').eq('branch_id', branchId).eq('is_published', true).order('start_date', { ascending: true }).gte('start_date', new Date().toISOString().split('T')[0]).limit(3),
      supabase.from('front_cms_gallery_albums').select('*').eq('branch_id', branchId).eq('is_published', true).order('created_at', { ascending: false }).limit(4)
    ]);

    if (bannersRes.data) setBanners(bannersRes.data);
    if (newsRes.data) setNews(newsRes.data);
    if (eventsRes.data) setEvents(eventsRes.data);
    if (galleryRes.data) setGallery(galleryRes.data);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (error) return <div className="h-screen flex items-center justify-center text-red-500">Error: {error}</div>;
  if (!school) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Helmet>
        <title>{settings?.cms_title || school?.name || 'School Website'}</title>
        <meta name="description" content={settings?.meta_description || `Welcome to ${school?.name || 'our school'}`} />
        {settings?.favicon_url && <link rel="icon" href={settings.favicon_url} />}
      </Helmet>

      <PublicSchoolHeader school={school} settings={settings} alias={schoolAlias} />

      <main className="flex-grow">
        {/* Hero Slider */}
        {banners.length > 0 ? (
          <div className="relative w-full h-[400px] md:h-[600px] overflow-hidden bg-slate-900">
            {/* Simplified slider - just showing first image for stability, could be carousel */}
            <img src={banners[0].image_url} alt="Banner" className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="text-center text-white px-4 max-w-4xl animate-fade-in-up">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight drop-shadow-lg">{settings?.cms_title || school?.name}</h1>
                <p className="text-lg md:text-xl opacity-90 mb-8 drop-shadow-md">Nurturing Excellence, Inspiring Innovation.</p>
                <div className="flex gap-4 justify-center">
                  <Button size="lg" style={{ backgroundColor: primaryColor }} className="border-none text-white hover:opacity-90" asChild>
                    <Link to={`/${schoolAlias}/signup`}>Apply Now</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-slate-900" asChild>
                    <Link to={`/${schoolAlias}/pages/about-us`}>Discover More</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-white" style={{ background: `linear-gradient(to right, ${primaryColor}, #0f172a)` }}>
            <h1 className="text-4xl font-bold">{settings?.cms_title || school?.name}</h1>
          </div>
        )}

        {/* Feature Boxes Section */}
        <section className="bg-red-600 py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white text-center">
              <div className="flex flex-col items-center p-6">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <GraduationCap className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold mb-2">Scholarship Facility</h3>
                <p className="text-white/80 text-sm">Merit-based scholarships for deserving students to support their educational journey.</p>
              </div>
              <div className="flex flex-col items-center p-6">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold mb-2">Books & Library</h3>
                <p className="text-white/80 text-sm">Well-stocked library with thousands of books, journals, and digital resources.</p>
              </div>
              <div className="flex flex-col items-center p-6">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold mb-2">Certified Teachers</h3>
                <p className="text-white/80 text-sm">Highly qualified and experienced faculty dedicated to student success.</p>
              </div>
            </div>
          </div>
        </section>

        {/* News & Events Section */}
        <section className="py-16 container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Latest News */}
            <div>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-bold" style={{ color: textColor }}>Latest News</h2>
                  <div className="h-1 w-20 mt-2" style={{ backgroundColor: primaryColor }}></div>
                </div>
                <Link to={`/${schoolAlias}/news`} className="text-sm font-semibold flex items-center" style={{ color: primaryColor }}>View All <ArrowRight className="h-4 w-4 ml-1" /></Link>
              </div>
              <div className="space-y-6">
                {news.map((item) => (
                  <div key={item.id} className="flex gap-4 group cursor-pointer">
                    <div className="w-24 h-24 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.image_url || item.featured_image || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=200"} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold mb-1" style={{ color: primaryColor }}>{item.published_at ? format(new Date(item.published_at), 'MMM dd, yyyy') : (item.date ? format(new Date(item.date), 'MMM dd, yyyy') : '')}</div>
                      <h3 className="font-bold group-hover:opacity-80 transition-opacity line-clamp-2" style={{ color: textColor }}>{item.title}</h3>
                      <div className="text-sm mt-2 line-clamp-2" style={{ color: textSecondaryColor }} dangerouslySetInnerHTML={{ __html: item.summary || item.description }} />
                    </div>
                  </div>
                ))}
                {news.length === 0 && <p style={{ color: textSecondaryColor }}>No news updates available.</p>}
              </div>
            </div>

            {/* Upcoming Events */}
            <div>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-bold" style={{ color: textColor }}>Upcoming Events</h2>
                  <div className="h-1 w-20 mt-2" style={{ backgroundColor: primaryColor }}></div>
                </div>
                <Link to={`/${schoolAlias}/events`} className="text-sm font-semibold flex items-center" style={{ color: primaryColor }}>View All <ArrowRight className="h-4 w-4 ml-1" /></Link>
              </div>
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4 items-center transition-shadow hover:shadow-md">
                    <div className="rounded-lg p-3 text-center min-w-[70px]" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                      <span className="block text-2xl font-bold">{event.start_date ? format(new Date(event.start_date), 'dd') : '00'}</span>
                      <span className="block text-xs font-bold uppercase">{event.start_date ? format(new Date(event.start_date), 'MMM') : 'JAN'}</span>
                    </div>
                    <div>
                      <h3 className="font-bold" style={{ color: textColor }}>{event.title}</h3>
                      <div className="text-sm flex items-center gap-2 mt-1" style={{ color: textSecondaryColor }}>
                        <Calendar className="h-3 w-3" />
                        {event.location || event.venue || 'School Campus'}
                      </div>
                    </div>
                  </div>
                ))}
                {events.length === 0 && <p style={{ color: textSecondaryColor }}>No upcoming events.</p>}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Gallery */}
        <section className="py-16 bg-slate-100">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold" style={{ color: textColor }}>Our Campus Life</h2>
              <p className="mt-2 max-w-2xl mx-auto" style={{ color: textSecondaryColor }}>Explore the vibrant moments captured within our school campus.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gallery.map((item) => (
                <Link to={`/${schoolAlias}/gallery`} key={item.id} className="group relative overflow-hidden rounded-xl aspect-square">
                  <img src={item.cover_image_url || item.cover_image || item.featured_image || "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80"} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white font-medium truncate w-full">{item.title}</span>
                  </div>
                </Link>
              ))}
            </div>
            {gallery.length === 0 && <div className="text-center text-slate-500">No gallery images yet.</div>}
            <div className="text-center mt-8">
              <Button variant="outline" asChild><Link to={`/${schoolAlias}/gallery`}>View Gallery</Link></Button>
            </div>
          </div>
        </section>
      </main>

      <PublicSchoolFooter school={school} settings={settings} alias={schoolAlias} />
    </div>
  );
};

export default PublicSchoolHomepage;
