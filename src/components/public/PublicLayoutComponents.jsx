import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, Facebook, Twitter, Instagram, Linkedin, Youtube, 
  Phone, Mail, MapPin, LogIn, Sun, Moon, Clock, Globe, Award, GraduationCap, ChevronRight, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSchoolSlug } from '@/hooks/useSchoolSlug';
import { format } from 'date-fns';

// ============== BAR 1: News Ticker Bar (Red) ==============
export const NewsTickerBar = ({ news }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd MMMM yyyy');
    } catch {
      return '';
    }
  };

  const newsItems = news && news.length > 0 
    ? news.map(n => ({ title: n.title, date: formatDate(n.published_at || n.created_at) }))
    : [{ title: "Welcome to our school", date: "" }];

  return (
    <div className="hidden md:block bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center">
          {/* Latest News Badge */}
          <div className="shrink-0 mr-4">
            <span className="bg-yellow-400 text-red-800 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
              Latest News
            </span>
          </div>
          
          {/* News Ticker */}
          <div className="flex-grow overflow-hidden relative h-6">
            <div className="animate-marquee whitespace-nowrap absolute flex items-center">
              {newsItems.map((item, i) => (
                <span key={i} className="inline-flex items-center mx-8 text-sm">
                  {item.date && (
                    <span className="text-yellow-300 font-bold mr-2">{item.date}</span>
                  )}
                  <span className="text-white font-medium">{item.title}</span>
                  {i < newsItems.length - 1 && (
                    <span className="w-2 h-2 bg-yellow-400 rounded-full ml-8"></span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============== BAR 2: Contact & Social Bar (Dark Blue) ==============
export const ContactSocialBar = ({ settings }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    setIsDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
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

  const email = settings.contact_email || settings.contact_info?.email;
  const facebook = settings.facebook_url || settings.social_links?.facebook;
  const twitter = settings.twitter_url || settings.social_links?.twitter;
  const instagram = settings.instagram_url || settings.social_links?.instagram;
  const linkedin = settings.linkedin_url || settings.social_links?.linkedin;
  const youtube = settings.youtube_url || settings.social_links?.youtube;

  return (
    <div className="hidden md:block bg-slate-900 text-white py-2">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Left: Email */}
          <div className="flex items-center gap-2">
            {email && (
              <a href={`mailto:${email}`} className="flex items-center gap-2 text-gray-300 hover:text-white text-sm">
                <Mail size={14} className="text-gray-400" />
                <span>{email}</span>
              </a>
            )}
          </div>
          
          {/* Right: Follow Us + Social Icons */}
          <div className="flex items-center gap-4">
            <span className="text-gray-300 text-sm">Follow Us</span>
            
            <div className="flex items-center gap-1">
              {facebook && <a href={facebook} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded bg-gray-700 hover:bg-blue-600 text-white transition-colors"><Facebook size={14} /></a>}
              {twitter && <a href={twitter} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded bg-gray-700 hover:bg-sky-500 text-white transition-colors"><Twitter size={14} /></a>}
              {instagram && <a href={instagram} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded bg-gray-700 hover:bg-pink-600 text-white transition-colors"><Instagram size={14} /></a>}
              {linkedin && <a href={linkedin} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded bg-gray-700 hover:bg-blue-700 text-white transition-colors"><Linkedin size={14} /></a>}
              {youtube && <a href={youtube} target="_blank" rel="noreferrer" className="w-7 h-7 flex items-center justify-center rounded bg-gray-700 hover:bg-red-600 text-white transition-colors"><Youtube size={14} /></a>}
            </div>
            
            <div className="h-4 w-px bg-gray-600"></div>
            
            <button 
              onClick={toggleTheme} 
              className="w-7 h-7 flex items-center justify-center rounded bg-gray-700 hover:bg-amber-500 text-white transition-colors"
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============== COMBINED TOP BAR (for backward compatibility) ==============
export const TopBar = ({ settings, news }) => {
  return (
    <>
      <NewsTickerBar news={news} />
      <ContactSocialBar settings={settings} />
    </>
  );
};

// ============== BAR 3: Logo + Call Us + Login ==============
// ============== BAR 4: Navigation Menu ==============
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
    
    items.forEach(item => {
      itemMap[item.id] = { ...item, children: [] };
    });
    
    items.forEach(item => {
      if (item.parent_id && itemMap[item.parent_id]) {
        itemMap[item.parent_id].children.push(itemMap[item.id]);
      } else {
        tree.push(itemMap[item.id]);
      }
    });
    
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
      
      let linkTo = '#';
      if (item.page_id) {
        linkTo = `/${activeSlug}/${item.page_slug || item.slug || 'page-not-found'}`;
      } else if (item.url) {
        if (item.url.startsWith('http://') || item.url.startsWith('https://')) {
          linkTo = item.url;
        } else if (item.url.startsWith(`/${activeSlug}`)) {
          linkTo = item.url;
        } else if (item.url.startsWith('/')) {
          linkTo = `/${activeSlug}${item.url}`;
        } else {
          linkTo = `/${activeSlug}/${item.url}`;
        }
      }

      const isHome = item.title.toLowerCase() === 'home';
      const isActive = currentPath === linkTo || (isHome && (currentPath === `/${activeSlug}` || currentPath === `/${activeSlug}/`));

      if (hasChildren) {
        return (
          <div key={item.id} className={`relative group ${isMobile ? 'w-full' : ''}`}>
            <button className={`flex items-center gap-1 font-medium transition-all duration-300 whitespace-nowrap ${
              isMobile 
                ? 'w-full py-4 px-5 text-slate-700 dark:text-slate-200 justify-between border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800' 
                : 'px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-500'
            }`}>
              {item.title}
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isMobile ? '' : 'group-hover:rotate-180'}`} />
            </button>
            <div className={`${
              isMobile 
                ? 'pl-4 bg-slate-50 dark:bg-slate-800' 
                : 'absolute left-0 mt-0 w-56 bg-white dark:bg-slate-900 shadow-xl rounded-lg hidden group-hover:block z-50 border border-slate-100 dark:border-slate-800 overflow-hidden'
            }`}>
              {!isMobile && <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-600"></div>}
              <div className={isMobile ? '' : 'py-1'}>
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
          className={`block font-medium transition-all duration-300 whitespace-nowrap ${
            isMobile
              ? `py-4 px-5 border-b border-slate-100 dark:border-slate-800 ${isActive ? 'bg-red-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-red-600'}`
              : isSubItem 
                ? `text-sm px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 ${isActive ? 'text-red-600 bg-red-50 dark:bg-slate-800' : ''}`
                : `px-4 py-3 text-sm ${isActive ? 'text-red-600 dark:text-red-500 border-b-2 border-red-600' : 'text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-500 border-b-2 border-transparent hover:border-red-600'}`
          }`}
          onClick={() => isMobile && setMobileMenuOpen(false)}
        >
          {item.title}
        </Link>
      );
    });
  };

  const defaultMenuItems = [
    { id: 'home', title: 'Home', url: `/${activeSlug}`, sort_order: 1, parent_id: null, children: [] },
    { id: 'online-course', title: 'Online Course', url: '/online-course', sort_order: 2, parent_id: null, children: [] },
    { id: 'online-admission', title: 'Online Admission', url: '/online-admission', sort_order: 3, parent_id: null, children: [] },
    { id: 'cbse-exam', title: 'Cbse Exam Result', url: '/cbse-exam-result', sort_order: 4, parent_id: null, children: [] },
    { id: 'exam-result', title: 'Exam Result', url: '/exam-result', sort_order: 5, parent_id: null, children: [] },
    { id: 'about', title: 'About Us', url: '/about-us', sort_order: 6, parent_id: null, children: [] },
    { id: 'academics', title: 'Academics', url: '/academics', sort_order: 7, parent_id: null, children: [] },
    { id: 'gallery', title: 'Gallery', url: '/gallery', sort_order: 8, parent_id: null, children: [] },
    { id: 'events', title: 'Events', url: '/events', sort_order: 9, parent_id: null, children: [] },
    { id: 'news', title: 'News', url: '/news', sort_order: 10, parent_id: null, children: [] },
    { id: 'contact', title: 'Contact', url: '/contact', sort_order: 11, parent_id: null, children: [] },
  ];

  const mainMenu = menus?.find(m => m.position === 1 || m.position === 'header') || menus?.[0];
  const menuTree = mainMenu ? buildMenuTree(mainMenu.items) : defaultMenuItems;
  const safeMenuTree = menuTree.length > 0 ? menuTree : defaultMenuItems;

  const phoneNumber = settings?.contact_info?.phone || settings?.contact_phone || '+91 9901217003';

  return (
    <>
      {/* ============== BAR 3: Logo + Call Us + Login (White) ============== */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-3">
            
            {/* Left: Logo Only (School name is in logo) */}
            <Link to={`/${activeSlug}`} className="flex items-center group shrink-0">
              {settings?.logo_url ? (
                <img 
                  src={settings.logo_url} 
                  alt={settings.school_name} 
                  className="h-16 lg:h-20 w-auto object-contain"
                />
              ) : (
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-red-700 to-red-800 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {settings?.school_name?.charAt(0) || 'S'}
                </div>
              )}
            </Link>

            {/* Right: Call Us + Login */}
            <div className="flex items-center gap-4 shrink-0">
              {/* Call Us */}
              <a href={`tel:${phoneNumber}`} className="hidden md:flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Phone size={18} className="text-red-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Call Us</span>
                  <span className="font-bold text-red-600 text-lg">{phoneNumber}</span>
                </div>
              </a>

              {/* Login Button */}
              <Link to={`/${activeSlug}/login`}>
                <Button className="bg-red-600 hover:bg-red-700 text-white px-6 py-5 rounded-full font-semibold shadow-md hover:shadow-lg transition-all">
                  Login
                </Button>
              </Link>

              {/* Mobile Menu Toggle */}
              <button 
                className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============== BAR 4: Navigation Menu (White with border) ============== */}
      <nav className={`hidden lg:block bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 transition-shadow ${
        scrolled ? 'shadow-lg' : ''
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            {renderMenuItems(safeMenuTree)}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[88px] bg-white dark:bg-slate-900 z-50 overflow-y-auto">
          <div className="h-1 bg-red-600"></div>
          <nav className="divide-y divide-slate-100 dark:divide-slate-800">
            {renderMenuItems(safeMenuTree, true)}
          </nav>
          
          {/* Mobile Contact */}
          <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 space-y-4">
            <Link to={`/${activeSlug}/login`} onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white py-5 text-lg font-semibold rounded-full flex items-center justify-center gap-2">
                <LogIn size={20} />
                Login
              </Button>
            </Link>
            
            {phoneNumber && (
              <a href={`tel:${phoneNumber}`} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Phone size={18} className="text-red-600" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Call Us</span>
                  <span className="font-bold text-red-600">{phoneNumber}</span>
                </div>
              </a>
            )}
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
