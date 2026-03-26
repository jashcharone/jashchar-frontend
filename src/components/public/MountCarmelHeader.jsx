import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Phone, Mail, Facebook, Twitter, Instagram, Linkedin, Youtube, 
  Search, Menu, X, ChevronDown, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MountCarmelHeader = ({ school, settings, alias }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const menuItems = [
    { label: 'Home', path: `/s/${alias}` },
    { label: 'Online Course', path: `/s/${alias}/online_course` },
    { label: 'Online Admission', path: `/s/${alias}/online_admission` },

    { label: 'Exam Result', path: `/s/${alias}/examresult` },
    { label: 'Annual Calendar', path: `/s/${alias}/annual_calendar` },
    { 
      label: 'About Us', 
      path: '#',
      submenu: [
        { label: 'About School', path: `/s/${alias}/page/about-us` },
        { label: 'Principal Message', path: `/s/${alias}/page/principal-message` },
        { label: 'Know Us', path: `/s/${alias}/page/know-us` },
        { label: 'Approach', path: `/s/${alias}/page/approach` },
        { label: 'Teacher', path: `/s/${alias}/page/teacher` },
        { label: 'Houses & Mentoring', path: `/s/${alias}/page/houses-mentoring` },
        { label: 'Student Council', path: `/s/${alias}/page/student-council` },
        { label: 'Career Counselling', path: `/s/${alias}/page/career-counselling` },
      ]
    },
    { 
      label: 'Academics', 
      path: '#',
      submenu: [
        { label: 'Facilities', path: `/s/${alias}/page/facilities` },
        { label: 'Annual Sports Day', path: `/s/${alias}/page/annual-sports-day` },
        { label: 'Course', path: `/s/${alias}/page/course` },
        { label: 'School Uniform', path: `/s/${alias}/page/school-uniform` },
        { label: 'School Management', path: `/s/${alias}/page/school-management` },
        { label: 'Pre Primary', path: `/s/${alias}/page/pre-primary` },
      ]
    },
    { label: 'Gallery', path: `/s/${alias}/page/gallery` },
    { label: 'Events', path: `/s/${alias}/page/events` },
    { label: 'News', path: `/s/${alias}/page/news` },
    { label: 'Contact', path: `/s/${alias}/page/contact-us` },
  ];

  return (
    <header className="w-full font-sans">
      {/* Top Bar */}
      <div className="bg-[#2e2e2e] text-white text-xs py-2 px-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-4 overflow-hidden w-full md:w-auto">
            <span className="bg-[#fbce07] text-black font-bold px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-wider">Latest News</span>
            <div className="truncate max-w-[300px] md:max-w-md text-gray-300">
              <span className="text-[#fbce07] font-semibold mr-2">15 November 2025</span>
              The Opening Ceremony of Computer Science Month
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-gray-400">Follow Us</span>
            <div className="flex gap-3" aria-label="Social links">
              <a href="#" aria-label="Facebook" className="hover:text-[#fbce07] transition-colors"><Facebook size={14} /></a>
              <a href="#" aria-label="Twitter" className="hover:text-[#fbce07] transition-colors"><Twitter size={14} /></a>
              <a href="#" aria-label="Instagram" className="hover:text-[#fbce07] transition-colors"><Instagram size={14} /></a>
              <a href="#" aria-label="LinkedIn" className="hover:text-[#fbce07] transition-colors"><Linkedin size={14} /></a>
              <a href="#" aria-label="YouTube" className="hover:text-[#fbce07] transition-colors"><Youtube size={14} /></a>
            </div>
          </div>
        </div>
      </div>

      {/* Branding Bar */}
      <div className="bg-white py-4 border-b border-gray-100">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src={settings?.logo_url || "https://demo.smart-school.in/uploads/school_content/logo/1.png"} 
              alt="School Logo" 
              className="h-16 w-auto"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#800000] leading-tight">
                {school?.name || "Mount Carmel School"}
              </h1>
              <p className="text-xs text-gray-500 tracking-widest uppercase hidden md:block">
                {settings?.tagline || "Education for Life"}
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 text-right">
              <div className="bg-red-50 p-2 rounded-full text-[#800000]">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Call Us</p>
                <p className="text-sm font-bold text-gray-800">{settings?.phone || "89562423934"}</p>
              </div>
            </div>
            
            <Button 
              onClick={() => navigate(`/s/${alias}/login`)}
              className="bg-[#c70039] hover:bg-[#a0002d] text-white rounded-full px-6 font-semibold shadow-md transition-all hover:shadow-lg"
            >
              <User size={16} className="mr-2" /> Login
            </Button>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-gray-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white border-b border-gray-200 hidden md:block shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-center" role="navigation" aria-label="Primary">
            <ul className="flex items-center gap-1">
              {menuItems.map((item, index) => (
                <li 
                  key={index} 
                  className="relative group"
                  onMouseEnter={() => setActiveDropdown(index)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link 
                    to={item.path}
                    className={cn(
                      "block px-4 py-4 text-sm font-medium text-gray-700 hover:text-[#c70039] transition-colors border-b-2 border-transparent hover:border-[#c70039]",
                      item.submenu && "flex items-center gap-1"
                    )}
                    aria-haspopup={item.submenu ? 'menu' : undefined}
                    aria-expanded={item.submenu ? activeDropdown === index : undefined}
                  >
                    {item.label}
                    {item.submenu && <ChevronDown size={12} />}
                  </Link>

                  {/* Dropdown */}
                  {item.submenu && (
                    <div className={cn(
                      "absolute top-full left-0 w-56 bg-white shadow-xl rounded-b-md border-t-2 border-[#c70039] py-2 transition-all duration-200 opacity-0 invisible translate-y-2",
                      "group-hover:opacity-100 group-hover:visible group-hover:translate-y-0",
                      "group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0"
                    )}>
                      {item.submenu.map((sub, subIndex) => (
                        <Link 
                          key={subIndex} 
                          to={sub.path}
                          className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#c70039] border-l-2 border-transparent hover:border-[#c70039] transition-all"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 absolute w-full z-50 shadow-xl">
          <ul className="py-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50">
                  <Link 
                    to={item.path} 
                    className="text-gray-800 font-medium"
                    onClick={() => !item.submenu && setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.submenu && (
                    <button onClick={() => setActiveDropdown(activeDropdown === index ? null : index)}>
                      <ChevronDown size={16} className={cn("transition-transform", activeDropdown === index && "rotate-180")} />
                    </button>
                  )}
                </div>
                
                {item.submenu && activeDropdown === index && (
                  <div className="bg-gray-50 py-2 px-4">
                    {item.submenu.map((sub, subIndex) => (
                      <Link 
                        key={subIndex} 
                        to={sub.path}
                        className="block py-2 text-sm text-gray-600"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
};

export default MountCarmelHeader;
