import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Phone, Mail, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ModernSchoolHeader = ({ school, alias }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', path: `/s/${alias}` },
    { label: 'About', path: `/s/${alias}/page/about-us` },
    { label: 'Admissions', path: `/s/${alias}/online_admission` },
    { label: 'Academics', path: `/s/${alias}/page/academics` },
    { label: 'Gallery', path: `/s/${alias}/gallery` },
    { label: 'Contact', path: `/s/${alias}/contact` },
  ];

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
        scrolled ? "bg-white/80 backdrop-blur-md shadow-sm border-white/20 py-2" : "bg-transparent py-4"
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to={`/s/${alias}`} className="flex items-center gap-3">
          {school?.logo_url ? (
            <img src={school.logo_url} alt={school.name} className="h-12 w-auto object-contain" />
          ) : (
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {school?.name?.charAt(0) || 'S'}
            </div>
          )}
          <span className={cn(
            "font-bold text-xl hidden md:block",
            scrolled ? "text-foreground" : "text-white drop-shadow-md"
          )}>
            {school?.name || 'School Name'}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link 
              key={link.path} 
              to={link.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                scrolled ? "text-foreground" : "text-white/90 hover:text-white drop-shadow-sm"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Button 
            variant={scrolled ? "default" : "secondary"}
            size="sm"
            asChild
            className="ml-4 shadow-md"
          >
            <Link to="/login">
              <LogIn className="mr-2 h-4 w-4" /> Login
            </Link>
          </Button>
        </nav>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className={scrolled ? "text-foreground" : "text-white"} />
          ) : (
            <Menu className={scrolled ? "text-foreground" : "text-white"} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-b shadow-lg p-4 md:hidden flex flex-col gap-4 animate-in slide-in-from-top-5">
          {navLinks.map(link => (
            <Link 
              key={link.path} 
              to={link.path}
              className="text-foreground font-medium py-2 border-b border-border/50"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Button asChild className="w-full mt-2">
            <Link to="/login">Login</Link>
          </Button>
        </div>
      )}
    </header>
  );
};

export default ModernSchoolHeader;
