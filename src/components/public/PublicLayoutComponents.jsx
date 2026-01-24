import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, Facebook, Twitter, Instagram, Linkedin, Youtube, 
  Phone, Mail, MapPin, LogIn, Sun, Moon, Clock, Globe, Award, GraduationCap, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSchoolSlug } from '@/hooks/useSchoolSlug';
import { format } from 'date-fns';

export const TopBar = ({ settings, news }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (!settings) return null;

  const phone = settings.contact_phone || settings.contact_info?.phone;
  const email = settings.contact_email || settings.contact_info?.email;
  
  const facebook = settings.facebook_url || settings.social_links?.facebook;
  const twitter = settings.twitter_url || settings.social_links?.twitter;
  const instagram = settings.instagram_url || settings.social_links?.instagram;
  const linkedin = settings.linkedin_url || settings.social_links?.linkedin;
  const youtube = settings.youtube_url || settings.social_links?.youtube;

  // Format news for marquee with dates
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd - MMMM');
    } catch {
      return '';
    }
  };

  const newsItems = news && news.length > 0 
    ? news.map(n => ({ title: n.title, date: formatDate(n.published_at || n.created_at) }))
    : [{ title: "Welcome to our school", date: "" }];

  return (
    <div className="hidden md:block font-sans relative overflow-hidden">
      {/* Premium Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
      
      <div className="relative container mx-auto px-4 py-2.5">
        <div className="flex justify-between items-center">
          {/* Left: News Ticker with Premium Badge */}
          <div className="flex items-center flex-1 overflow-hidden">
            <div className="relative flex items-center shrink-0 mr-4">
              <span className="relative z-10 bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-red-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                Latest News
              </span>
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-r from-red-600 to-red-500 rotate-45 -z-10"></div>
            </div>
            <div className="flex-grow overflow-hidden relative h-6 flex items-center">
               <div className="animate-marquee whitespace-nowrap absolute flex items-center">
                 {newsItems.map((item, i) => (
                   <span key={i} className="inline-flex items-center mx-6 text-sm">
                     {item.date && (
                       <span className="text-amber-400 font-bold mr-2 bg-amber-400/10 px-2 py-0.5 rounded text-xs">{item.date}</span>
                     )}
                     <span className="text-slate-300 hover:text-white transition-colors cursor-pointer font-medium">{item.title}</span>
                     {i < newsItems.length - 1 && <span className="w-1.5 h-1.5 bg-gradient-to-r from-red-500 to-amber-500 rounded-full ml-6 animate-pulse"></span>}
                   </span>
                 ))}
               </div>
            </div>
          </div>

          {/* Right: Contact & Social with Modern Design */}
          <div className="flex items-center gap-4 shrink-0 ml-4">
            {email && (
              <a href={`mailto:${email}`} className="flex items-center gap-2 text-slate-300 hover:text-white transition-all duration-300 text-sm group">
                <span className="p-1.5 bg-amber-500/20 rounded-lg group-hover:bg-amber-500/30 transition-colors">
                  <Mail size={12} className="text-amber-400" />
                </span>
                <span className="hidden lg:inline font-medium">{email}</span>
              </a>
            )}
            
            <div className="h-4 w-px bg-gradient-to-b from-transparent via-slate-600 to-transparent"></div>
            
            <div className="flex items-center gap-2">
              {facebook && <a href={facebook} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-blue-600 text-slate-400 hover:text-white transition-all duration-300 hover:scale-110"><Facebook size={13} /></a>}
              {twitter && <a href={twitter} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-sky-500 text-slate-400 hover:text-white transition-all duration-300 hover:scale-110"><Twitter size={13} /></a>}
              {instagram && <a href={instagram} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500 text-slate-400 hover:text-white transition-all duration-300 hover:scale-110"><Instagram size={13} /></a>}
              {linkedin && <a href={linkedin} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-blue-700 text-slate-400 hover:text-white transition-all duration-300 hover:scale-110"><Linkedin size={13} /></a>}
              {youtube && <a href={youtube} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-600 text-slate-400 hover:text-white transition-all duration-300 hover:scale-110"><Youtube size={13} /></a>}
            </div>
            
            <div className="h-4 w-px bg-gradient-to-b from-transparent via-slate-600 to-transparent"></div>
            
            <button 
               onClick={toggleTheme} 
               className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 transition-all duration-300"
               title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
             >
               {isDarkMode ? <Sun size={13} /> : <Moon size={13} />}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PublicHeader = ({ settings, menus, mobileMenuOpen, setMobileMenuOpen, slug }) => {
  const hookSlug = useSchoolSlug();
  const location = useLocation();
  const activeSlug = slug || hookSlug;
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for sticky header effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const buildMenuTree = (items) => {
    if (!items) return [];
    const itemMap = {};
    const tree = [];
    
    // First pass: map items by ID and initialize children
    items.forEach(item => {
      itemMap[item.id] = { ...item, children: [] };
    });
    
    // Second pass: link children to parents
    items.forEach(item => {
      if (item.parent_id && itemMap[item.parent_id]) {
        itemMap[item.parent_id].children.push(itemMap[item.id]);
      } else {
        tree.push(itemMap[item.id]);
      }
    });
    
    // Sort by sort_order
    const sortItems = (list) => {
      list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      list.forEach(item => {
        if (item.children.length > 0) sortItems(item.children);
      });
    };
    
    sortItems(tree);
    return tree;
  };

  const renderMenuItems = (items, isMobile = false) => {
    const currentPath = location.pathname;
    
    return items.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const linkTo = item.page_id 
        ? `/${activeSlug}/${item.page_slug || item.slug || 'page-not-found'}` 
        : item.url || '#';

      // Check if this is the active/current link
      const isHome = item.title.toLowerCase() === 'home';
      const isActive = currentPath === linkTo || (isHome && (currentPath === `/${activeSlug}` || currentPath === `/${activeSlug}/`));

      if (hasChildren) {
        return (
          <div key={item.id} className={`relative group ${isMobile ? 'w-full' : ''}`}>
            <button className={`flex items-center gap-1 font-semibold transition-all duration-300 whitespace-nowrap ${
              isMobile 
                ? 'w-full py-4 px-5 text-slate-700 dark:text-slate-200 justify-between border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800' 
                : 'px-4 py-2.5 text-[13px] uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-500 relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-red-600 hover:after:w-full after:transition-all after:duration-300'
            }`}>
              {item.title}
              <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isMobile ? '' : 'rotate-90 group-hover:rotate-180'}`} />
            </button>
            <div className={`${
              isMobile 
                ? 'pl-4 bg-slate-50 dark:bg-slate-800' 
                : 'absolute left-1/2 -translate-x-1/2 mt-0 w-64 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-xl hidden group-hover:block z-50 border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200'
            }`}>
              {!isMobile && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600"></div>}
              <div className={isMobile ? '' : 'py-2'}>
                {renderMenuItems(item.children, isMobile)}
              </div>
            </div>
          </div>
        );
      }
      
      const isSubItem = item.parent_id !== null;
      
      return (
        <Link 
          key={item.id} 
          to={linkTo} 
          className={`block font-semibold transition-all duration-300 whitespace-nowrap ${
            isMobile
              ? `py-4 px-5 border-b border-slate-100 dark:border-slate-800 ${isActive ? 'bg-gradient-to-r from-red-600 to-red-500 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-red-600'}`
              : isSubItem 
                ? `text-sm px-5 py-3 text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 flex items-center gap-2 group/item ${isActive ? 'text-red-600 bg-red-50 dark:bg-slate-800' : ''}`
                : `px-4 py-2.5 text-[13px] uppercase tracking-wider relative ${isActive ? 'text-red-600 dark:text-red-500' : 'text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-500'} after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 ${isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'} after:h-0.5 after:bg-red-600 after:transition-all after:duration-300`
          }`}
          onClick={() => isMobile && setMobileMenuOpen(false)}
        >
          {isSubItem && !isMobile && <ChevronRight className="w-3 h-3 opacity-0 -ml-2 group-hover/item:opacity-100 group-hover/item:ml-0 transition-all duration-200" />}
          {item.title}
        </Link>
      );
    });
  };

  // Fallback Menu Items if no menu is defined
  const defaultMenuItems = [
    { id: 'home', title: 'Home', url: `/${activeSlug}`, sort_order: 1, parent_id: null, children: [] },
    { id: 'about', title: 'About Us', url: `/${activeSlug}/about-us`, sort_order: 2, parent_id: null, children: [] },
    { id: 'news', title: 'News', url: `/${activeSlug}/news`, sort_order: 3, parent_id: null, children: [] },
    { id: 'events', title: 'Events', url: `/${activeSlug}/events`, sort_order: 4, parent_id: null, children: [] },
    { id: 'gallery', title: 'Gallery', url: `/${activeSlug}/gallery`, sort_order: 5, parent_id: null, children: [] },
    { id: 'contact', title: 'Contact', url: `/${activeSlug}/contact`, sort_order: 6, parent_id: null, children: [] },
  ];

  const mainMenu = menus?.find(m => m.position === 1 || m.position === 'header') || menus?.[0];
  const menuTree = mainMenu ? buildMenuTree(mainMenu.items) : defaultMenuItems;
  
  // Safety: If buildMenuTree returns empty (e.g. empty menu created), use default
  const safeMenuTree = menuTree.length > 0 ? menuTree : defaultMenuItems;

  const phoneNumber = settings?.contact_info?.phone || settings?.contact_phone || '+91 9901217003';

  return (
    <>
      {/* Main Header */}
      <header className={`bg-white dark:bg-slate-900 sticky top-0 z-40 transition-all duration-500 font-sans ${
        scrolled 
          ? 'shadow-xl shadow-slate-200/50 dark:shadow-none border-b border-slate-100 dark:border-slate-800' 
          : 'shadow-lg border-b border-slate-100/50 dark:border-slate-800/50'
      }`}>
        <div className="container mx-auto px-4">
          <div className={`flex justify-between items-center transition-all duration-500 ${scrolled ? 'h-20' : 'h-24'}`}>
            
            {/* Left: Premium Logo Section */}
            <Link to={`/${activeSlug}`} className="flex items-center gap-4 group shrink-0">
              {settings?.logo_url ? (
                <div className="relative">
                  <img 
                    src={settings.logo_url} 
                    alt={settings.school_name} 
                    className={`w-auto transition-all duration-500 object-contain drop-shadow-lg group-hover:scale-105 ${scrolled ? 'h-14' : 'h-16 lg:h-20'}`}
                  />
                  {/* Decorative glow effect */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-red-600/20 via-amber-500/20 to-red-600/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  {/* Premium Logo Placeholder */}
                  <div className={`relative transition-all duration-500 ${scrolled ? 'w-12 h-12' : 'w-14 h-14 lg:w-16 lg:h-16'}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-500 to-amber-500 rounded-2xl rotate-6 opacity-80 group-hover:rotate-12 transition-transform duration-300"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center text-white font-bold text-xl lg:text-2xl shadow-xl">
                      {settings?.school_name?.charAt(0) || 'S'}
                    </div>
                  </div>
                  <div className="hidden lg:flex flex-col">
                    <span className={`font-bold text-slate-800 dark:text-white tracking-tight leading-tight transition-all duration-500 ${scrolled ? 'text-lg' : 'text-xl lg:text-2xl'}`}>
                      {settings?.school_name || 'School Name'}
                    </span>
                    {settings?.tagline && (
                      <span className={`text-slate-500 dark:text-slate-400 font-medium transition-all duration-500 ${scrolled ? 'text-[10px]' : 'text-xs'}`}>
                        {settings.tagline}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Link>

            {/* Center: Navigation with Premium Styling */}
            <nav className="hidden xl:flex items-center justify-center h-full">
              <div className="flex items-center gap-1">
                {renderMenuItems(safeMenuTree)}
              </div>
            </nav>

            {/* Right: Premium CTA Section */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
               {/* Phone Card with Premium Design */}
               <a 
                 href={`tel:${phoneNumber}`} 
                 className="flex items-center gap-3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 hover:from-slate-100 hover:to-slate-50 dark:hover:from-slate-700 dark:hover:to-slate-800 px-4 py-2.5 rounded-2xl transition-all duration-300 group border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg hover:shadow-green-500/10"
               >
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500 rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-green-500 to-green-600 p-2.5 rounded-full shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                       <Phone size={16} className="text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest">Call Us Now</span>
                     <span className={`font-bold text-slate-800 dark:text-white transition-all duration-500 ${scrolled ? 'text-sm' : 'text-base'}`}>
                        {phoneNumber}
                     </span>
                  </div>
               </a>

               {/* Premium Login Button */}
               <Link to={`/${activeSlug}/login`}>
                 <Button className={`relative overflow-hidden bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 flex items-center gap-2 group ${scrolled ? 'px-5 py-5 text-sm' : 'px-6 py-6 text-base'}`}>
                   <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                   <LogIn size={18} className="relative z-10" />
                   <span className="relative z-10">Login</span>
                 </Button>
               </Link>
            </div>

            {/* Mobile Toggle with Animation */}
            <button 
              className="xl:hidden p-3 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </header>

      {/* Premium Mobile Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 top-20 bg-white dark:bg-slate-900 z-50 overflow-y-auto animate-in slide-in-from-top-5 fade-in duration-300">
          {/* Decorative Header */}
          <div className="sticky top-0 bg-gradient-to-r from-red-600 via-red-500 to-amber-500 h-1"></div>
          
          <div className="flex flex-col">
            {/* Menu Items */}
            <nav className="divide-y divide-slate-100 dark:divide-slate-800">
              {renderMenuItems(menuTree, true)}
            </nav>
            
            {/* Mobile Actions with Premium Styling */}
            <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-t border-slate-200 dark:border-slate-700 space-y-6 mt-auto">
               {/* Login Button */}
               <Link to={`/${activeSlug}/login`} onClick={() => setMobileMenuOpen(false)}>
                 <Button className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white py-6 text-lg font-bold shadow-lg shadow-red-500/30 rounded-2xl flex items-center justify-center gap-2">
                   <LogIn size={22} />
                   Login to Portal
                 </Button>
               </Link>

               {/* Contact Info Cards */}
               <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-6 h-px bg-gradient-to-r from-red-500 to-transparent"></span>
                    Contact Info
                  </h4>
                  {phoneNumber && (
                    <a href={`tel:${phoneNumber}`} className="flex items-center gap-4 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                         <Phone size={18} />
                       </div>
                       <div>
                         <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Phone</span>
                         <span className="font-bold text-slate-800 dark:text-white">{phoneNumber}</span>
                       </div>
                    </a>
                  )}
                  {(settings?.contact_email || settings?.contact_info?.email) && (
                    <a href={`mailto:${settings.contact_email || settings.contact_info?.email}`} className="flex items-center gap-4 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                         <Mail size={18} />
                       </div>
                       <div>
                         <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Email</span>
                         <span className="font-bold text-slate-800 dark:text-white text-sm">{settings.contact_email || settings.contact_info?.email}</span>
                       </div>
                    </a>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const PublicFooter = ({ settings, school }) => {
  const hookSlug = useSchoolSlug();
  // If settings has cms_url_alias, use it, otherwise fallback to hook
  const activeSlug = settings?.cms_url_alias || hookSlug;

  // Extract nested data from settings
  const contact = settings?.contact_info || {};
  const social = settings?.social_links || {};
  const theme = settings?.theme || {};

  // Get values with fallbacks
  const phone = contact.phone || settings?.phone || '';
  const email = contact.email || settings?.email || '';
  const address = contact.address || settings?.address || '';
  const footerAbout = contact.footer_about_text || contact.footer_about || '';
  const copyright = contact.copyright_text || contact.copyright || '';
  const schoolName = school?.name || settings?.school_name || 'School';

  // Social links (support both object and array format)
  const getSocialUrl = (key) => {
    if (Array.isArray(social)) {
      return social.find(s => s.platform === key)?.url || '';
    }
    return social[key] || settings?.[`${key}_url`] || '';
  };

  const facebook = getSocialUrl('facebook');
  const twitter = getSocialUrl('twitter');
  const instagram = getSocialUrl('instagram');
  const linkedin = getSocialUrl('linkedin');
  const youtube = getSocialUrl('youtube');

  // Theme colors with defaults
  const footerBg = theme.footer_bg_color || '#111';
  const footerText = theme.footer_text_color || '#fff';
  const copyrightBg = theme.copyright_bg_color || '#000';
  const copyrightText = theme.copyright_text_color || '#9ca3af';

  return (
    <footer className="text-white pt-16 pb-8 font-sans" style={{ backgroundColor: footerBg, color: footerText }}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Column 1: About */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-bold mb-6 uppercase border-b-2 border-red-600 inline-block pb-1">About Us</h3>
            {footerAbout ? (
              <p className="text-sm text-gray-400 leading-relaxed">{footerAbout}</p>
            ) : (
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to={`/${activeSlug}`} className="hover:text-red-500 transition-colors">Home</Link></li>
                <li><Link to={`/${activeSlug}/about`} className="hover:text-red-500 transition-colors">About Us</Link></li>
                <li><Link to={`/${activeSlug}/contact`} className="hover:text-red-500 transition-colors">Contact Us</Link></li>
              </ul>
            )}
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6 uppercase border-b-2 border-red-600 inline-block pb-1">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to={`/${activeSlug}/news`} className="hover:text-red-500 transition-colors">News</Link></li>
              <li><Link to={`/${activeSlug}/events`} className="hover:text-red-500 transition-colors">Events</Link></li>
              <li><Link to={`/${activeSlug}/gallery`} className="hover:text-red-500 transition-colors">Gallery</Link></li>
              {settings?.contact_info?.online_admission !== false && (
                <li><Link to={`/${activeSlug}/online-admission`} className="hover:text-red-500 transition-colors">Online Admission</Link></li>
              )}
            </ul>
          </div>

          {/* Column 3: Follow Us */}
          <div>
            <h3 className="text-lg font-bold mb-6 uppercase border-b-2 border-red-600 inline-block pb-1">Follow Us</h3>
            <div className="flex gap-2 flex-wrap">
              {facebook && <a href={facebook} target="_blank" rel="noreferrer" className="w-8 h-8 bg-gray-800 flex items-center justify-center hover:bg-red-600 transition-colors rounded"><Facebook size={14} /></a>}
              {twitter && <a href={twitter} target="_blank" rel="noreferrer" className="w-8 h-8 bg-gray-800 flex items-center justify-center hover:bg-red-600 transition-colors rounded"><Twitter size={14} /></a>}
              {instagram && <a href={instagram} target="_blank" rel="noreferrer" className="w-8 h-8 bg-gray-800 flex items-center justify-center hover:bg-red-600 transition-colors rounded"><Instagram size={14} /></a>}
              {linkedin && <a href={linkedin} target="_blank" rel="noreferrer" className="w-8 h-8 bg-gray-800 flex items-center justify-center hover:bg-red-600 transition-colors rounded"><Linkedin size={14} /></a>}
              {youtube && <a href={youtube} target="_blank" rel="noreferrer" className="w-8 h-8 bg-gray-800 flex items-center justify-center hover:bg-red-600 transition-colors rounded"><Youtube size={14} /></a>}
            </div>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="text-lg font-bold mb-6 uppercase border-b-2 border-red-600 inline-block pb-1">Contact</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              {phone && (
                <li className="flex items-start gap-3">
                  <Phone className="mt-1 text-red-500" size={16} /> 
                  <div>
                    <span className="block text-xs uppercase text-gray-500">Phone</span>
                    <span className="text-white">{phone}</span>
                  </div>
                </li>
              )}
              {email && (
                <li className="flex items-start gap-3">
                  <Mail className="mt-1 text-red-500" size={16} /> 
                  <div>
                    <span className="block text-xs uppercase text-gray-500">Email</span>
                    <span className="text-white">{email}</span>
                  </div>
                </li>
              )}
              {address && (
                <li className="flex items-start gap-3">
                  <MapPin className="mt-1 text-red-500" size={16} /> 
                  <div>
                    <span className="block text-xs uppercase text-gray-500">Address</span>
                    <span className="text-white">{address}</span>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-6 text-center text-xs uppercase tracking-wider" style={{ color: copyrightText }}>
          {copyright || `© ${schoolName} ${new Date().getFullYear()} All rights reserved`}
        </div>
      </div>
    </footer>
  );
};
