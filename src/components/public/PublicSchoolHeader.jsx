import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, Mail, LogIn, ChevronDown, MapPin, Clock, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { getSubdomain } from '@/utils/subdomain';

const PublicSchoolHeader = ({ school, settings, alias }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [news, setNews] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isSubdomain = !!getSubdomain();

  useEffect(() => {
    if (school?.id) {
      fetchMenu();
      fetchNews();
    }
  }, [school?.id]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchMenu = async () => {
    try {
      const { data: menu } = await supabase
        .from('cms_menus')
        .select('id')
        .eq('branch_id', school.id)
        .ilike('title', '%Main Menu%')
        .single();

      if (menu) {
        const { data: items } = await supabase
          .from('cms_menu_items')
          .select('*')
          .eq('menu_id', menu.id)
          .order('sort_order');
        setMenuItems(items || []);
      }
    } catch (error) {
      console.error("Error fetching menu", error);
    }
  };

  const fetchNews = async () => {
    try {
      const { data } = await supabase
        .from('front_cms_news')
        .select('id, title, published_at')
        .eq('branch_id', school.id)
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(5);
      setNews(data || []);
    } catch (error) {
      console.error("Error fetching news", error);
    }
  };

  const getLink = (item) => {
    if (item.type === 'external' && item.external_url) {
      const prefix = isSubdomain ? '' : `/${alias}`;
      let url = item.external_url;
      if (!url.startsWith('/') && !url.startsWith('http')) url = '/' + url;
      if (url.startsWith('http')) return url;
      return `${prefix}${url}`;
    }
    if (item.is_external) return item.url || item.external_url;
    const prefix = isSubdomain ? '' : `/${alias}`;
    if (item.page_id) {
      return `${prefix}/pages/${item.url || item.external_url || item.page_id}`;
    }
    let url = item.url || item.external_url || '';
    if (!url.startsWith('/')) url = '/' + url;
    return `${prefix}${url}`;
  };

  const loginLink = isSubdomain ? '/login' : `/${alias}/login`;
  const homeLink = isSubdomain ? '/' : `/${alias}`;
  const currentPath = location.pathname;

  const contactEmail = settings?.contact_email || 'info@school.edu.in';
  const contactMobile = settings?.contact_mobile || settings?.mobile_no || settings?.contact_number || '';
  const logoUrl = settings?.logo_url || '';
  const cmsTitle = settings?.cms_title || school?.name || '';
  const primaryColor = settings?.primary_color || '#1e40af';

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <header className="w-full font-sans">
      {/* News Ticker Bar */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white py-2.5 border-b border-slate-700/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* News Ticker */}
            <div className="flex items-center flex-1 overflow-hidden">
              <span className="bg-red-600 text-white px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider mr-4 shrink-0 shadow-lg">
                Latest News
              </span>
              <div className="overflow-hidden relative flex-1">
                <div className="animate-marquee whitespace-nowrap flex items-center">
                  {news.length > 0 ? news.map((item, i) => (
                    <span key={item.id} className="inline-flex items-center mx-6 text-sm">
                      <span className="text-amber-400 font-semibold mr-2">{formatDate(item.published_at)}</span>
                      <span className="text-slate-300 hover:text-white transition-colors cursor-pointer">{item.title}</span>
                      {i < news.length - 1 && <span className="w-1.5 h-1.5 bg-red-500 rounded-full ml-6"></span>}
                    </span>
                  )) : (
                    <span className="text-slate-400 text-sm">Welcome to {cmsTitle}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Contact & Social */}
            <div className="hidden lg:flex items-center gap-6 shrink-0 ml-4">
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 text-slate-300 hover:text-white text-sm transition-colors">
                  <Mail size={14} className="text-amber-400" />
                  <span>{contactEmail}</span>
                </a>
              )}
              <div className="flex items-center gap-3 border-l border-slate-700 pl-4">
                <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors"><Facebook size={14} /></a>
                <a href="#" className="text-slate-400 hover:text-sky-400 transition-colors"><Twitter size={14} /></a>
                <a href="#" className="text-slate-400 hover:text-pink-400 transition-colors"><Instagram size={14} /></a>
                <a href="#" className="text-slate-400 hover:text-red-500 transition-colors"><Youtube size={14} /></a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${scrolled ? 'shadow-xl' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            {/* Logo & School Name */}
            <Link to={homeLink} className="flex items-center gap-4 group">
              {logoUrl ? (
                <img src={logoUrl} alt={school?.name} className="h-14 md:h-16 w-auto object-contain transition-transform group-hover:scale-105" />
              ) : (
                <div 
                  className="h-14 w-14 rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-lg transition-transform group-hover:scale-105"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
                >
                  {school?.name?.substring(0, 2).toUpperCase() || 'JG'}
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="font-bold text-xl md:text-2xl text-slate-800 leading-tight group-hover:text-slate-900 transition-colors">
                  {cmsTitle}
                </h1>
                {settings?.tagline && (
                  <p className="text-xs text-slate-500 mt-0.5">{settings.tagline}</p>
                )}
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center">
              <ul className="flex items-center">
                <li>
                  <Link 
                    to={homeLink}
                    className={`px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-all duration-200 rounded-lg mx-0.5
                      ${currentPath === homeLink || currentPath === `/${alias}` 
                        ? 'bg-red-600 text-white shadow-md' 
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
                  >
                    Home
                  </Link>
                </li>
                {menuItems.map((item) => (
                  <li key={item.id}>
                    {item.is_external || item.type === 'external' ? (
                      <a 
                        href={item.external_url || item.url} 
                        target={item.open_in_new_tab ? "_blank" : "_self"}
                        rel="noreferrer"
                        className="px-4 py-2 text-sm font-semibold uppercase tracking-wide text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 rounded-lg mx-0.5"
                      >
                        {item.title}
                      </a>
                    ) : (
                      <Link 
                        to={getLink(item)}
                        className={`px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-all duration-200 rounded-lg mx-0.5
                          ${currentPath === getLink(item) 
                            ? 'bg-red-600 text-white shadow-md' 
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
                      >
                        {item.title}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Phone */}
              {contactMobile && (
                <a href={`tel:${contactMobile}`} className="hidden md:flex items-center gap-3 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 rounded-xl transition-colors group">
                  <div className="bg-green-500 p-2 rounded-full shadow-md group-hover:scale-110 transition-transform">
                    <Phone size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-medium tracking-wide">Call Us</p>
                    <p className="text-sm font-bold text-slate-800">{contactMobile}</p>
                  </div>
                </a>
              )}

              {/* Login Button */}
              <Link to={loginLink}>
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 py-2.5 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                >
                  <LogIn size={16} />
                  <span className="hidden sm:inline">Login</span>
                </Button>
              </Link>

              {/* Mobile Menu Toggle */}
              <button 
                className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" 
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t shadow-xl">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col gap-1">
              <Link 
                to={homeLink} 
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentPath === homeLink ? 'bg-red-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              {menuItems.map((item) => (
                <Link 
                  key={item.id} 
                  to={getLink(item)}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    currentPath === getLink(item) ? 'bg-red-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.title}
                </Link>
              ))}
              <hr className="my-2 border-slate-200" />
              {contactMobile && (
                <a href={`tel:${contactMobile}`} className="flex items-center gap-3 px-4 py-3 text-slate-700">
                  <Phone size={18} className="text-green-600" />
                  <span className="font-medium">{contactMobile}</span>
                </a>
              )}
              <Link 
                to={loginLink} 
                className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg font-semibold mt-2"
                onClick={() => setIsOpen(false)}
              >
                <LogIn size={18} />
                Login to Portal
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Marquee Animation Styles */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </header>
  );
};

export default PublicSchoolHeader;
