import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Sun, Moon, Phone, Mail, Facebook, Instagram, Youtube, Linkedin, Twitter, ChevronDown, ExternalLink } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const HomepageHeader = ({ settings, isSticky = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { toggleMode } = useTheme();
  const location = useLocation();
  
  // STRICT MODE: No defaults. If DB is empty, show empty.
  const companyName = settings?.header?.company_name;
  const companyLogo = settings?.header?.company_logo;

  // Top Bar Settings
  const showTopBar = settings?.header?.top_bar_enabled !== false;
  const salesText = settings?.header?.sales_enquiry_text;
  const phoneNumber = settings?.header?.phone_number;
  const emailAddress = settings?.header?.email_address;
  const showFbSignup = settings?.header?.facebook_signup_enabled !== false;
  const fbSignupUrl = settings?.header?.facebook_signup_url;
  const socialLinks = settings?.header?.social_links || {};

  // Login Button Settings
  const loginText = settings?.header?.login_button_text || 'Login';
  const loginUrl = settings?.header?.login_button_url || '/login';

  // Demo School Button Logic
  const showDemoButton = settings?.demo_school_enabled !== false;
  const demoLabel = settings?.demo_school_label;
  const demoUrl = settings?.demo_school_url;
  const demoOpenNewTab = settings?.demo_school_open_in_new_tab;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = settings?.header?.menu_items || [];

  // Helper to render links (internal vs external)
  const renderNavLink = (href, name, className, onClick) => {
      const isExternal = href?.startsWith('http') || href?.startsWith('//');
      const isHash = href?.startsWith('#');
      
      if (isExternal) {
          return (
              <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
                  {name}
              </a>
          );
      }
      
      if (isHash) {
           return (
              <a href={href} className={className} onClick={onClick}>
                  {name}
              </a>
          );
      }

      // Ensure internal links start with / to prevent relative path nesting issues
      let internalHref = href || '/';
      if (internalHref && !internalHref.startsWith('/')) {
          internalHref = '/' + internalHref;
      }

      return (
          <Link to={internalHref} className={className} onClick={onClick}>
              {name}
          </Link>
      );
  };

  return (
    <>
      {/* Top Bar - Static */}
      {showTopBar && (
      <div className="bg-muted/80 border-b border-border hidden md:block text-muted-foreground backdrop-blur-sm relative z-50">
        <div className="container mx-auto px-4 h-8 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
                {salesText && <span className="text-primary font-bold bg-primary/10 px-3 py-1 rounded-full text-[11px] uppercase tracking-wider shadow-sm border border-primary/20">{salesText}</span>}
                
                <div className="flex items-center gap-3 bg-background/60 px-3 py-1 rounded-full border border-border/40 shadow-sm">
                    {phoneNumber && (
                        <a href={`tel:${phoneNumber.replace(/\s/g, '')}`} className="flex items-center gap-1.5 text-foreground font-semibold hover:text-primary transition-colors">
                            <Phone className="h-3.5 w-3.5 text-primary fill-primary/10" /> {phoneNumber}
                        </a>
                    )}
                    {emailAddress && (
                        <>
                            <span className="h-3 w-px bg-border"></span>
                            <a href={`mailto:${emailAddress}`} className="flex items-center gap-1.5 text-foreground font-semibold hover:text-primary transition-colors">
                                <Mail className="h-3.5 w-3.5 text-primary fill-primary/10" /> {emailAddress}
                            </a>
                        </>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-3">
                {showFbSignup && (
                    <Button size="sm" className="h-6 text-[10px] bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-3" asChild>
                        <a href={fbSignupUrl} target="_blank" rel="noopener noreferrer">
                            <Facebook className="h-2.5 w-2.5 mr-1" /> Sign Up
                        </a>
                    </Button>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">Follow Us</span>
                    {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-transform hover:scale-110"><Facebook className="h-3 w-3" /></a>}
                    {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 transition-transform hover:scale-110"><Instagram className="h-3 w-3" /></a>}
                    {socialLinks.youtube && <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-red-600 transition-transform hover:scale-110"><Youtube className="h-3 w-3" /></a>}
                    {socialLinks.linkedin && <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-blue-700 transition-transform hover:scale-110"><Linkedin className="h-3 w-3" /></a>}
                    {socialLinks.twitter && <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-sky-500 transition-transform hover:scale-110"><Twitter className="h-3 w-3" /></a>}
                </div>
            </div>
        </div>
      </div>
      )}

      <header 
        style={{ 
            position: isSticky ? 'sticky' : 'relative',
            top: isSticky ? 0 : 'auto',
            zIndex: 50
        }}
        className={`transition-all duration-300 ${
            isSticky 
                ? (scrolled ? 'bg-background/90 backdrop-blur-lg border-b border-border shadow-sm' : 'bg-background/50 backdrop-blur-sm border-b border-transparent')
                : 'bg-transparent border-b border-transparent'
        }`}
      >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-auto py-1.5">
          <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2 group">
            {companyLogo ? (
                <img src={companyLogo} alt={companyName} className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
            ) : (
                <div className="flex flex-col leading-none">
                    <span className="text-xl font-extrabold tracking-tighter text-slate-900 dark:text-white group-hover:text-primary transition-colors">{companyName || 'Jashchar ERP'}</span>
                </div>
            )}
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navLinks.map((link, idx) => (
              link.children && link.children.length > 0 ? (
                <DropdownMenu key={idx}>
                  <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-white hover:text-primary transition-colors outline-none group">
                    {link.name} <ChevronDown className="h-3 w-3 group-data-[state=open]:rotate-180 transition-transform duration-200 opacity-50 group-hover:opacity-100" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 p-1 animate-in fade-in-0 zoom-in-95">
                    {link.children.map((child, cIdx) => (
                      <DropdownMenuItem key={cIdx} asChild className="focus:bg-primary/5 focus:text-primary cursor-pointer rounded-sm text-sm">
                        {renderNavLink(child.href, child.name, "py-1.5 px-2 w-full block")}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <React.Fragment key={idx}>
                    {renderNavLink(
                        link.href, 
                        link.name, 
                        "text-sm font-medium text-slate-700 dark:text-white hover:text-primary transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                    )}
                </React.Fragment>
              )
            ))}
          </nav>

          <div className="hidden lg:flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={toggleMode} className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <Button variant="ghost" size="sm" className="h-8 text-sm font-medium text-slate-700 dark:text-white hover:text-primary hover:bg-primary/5" asChild>
              <Link to={loginUrl}>{loginText}</Link>
            </Button>

            <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 shadow-md hover:shadow-lg transition-all duration-300 rounded-full" asChild>
              <Link to="/register-school">Register School</Link>
            </Button>

            {showDemoButton && (
                <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 shadow-md shadow-blue-200 hover:shadow-blue-300 transition-all duration-300 rounded-full" asChild>
                  <a 
                    href={demoUrl} 
                    target={demoOpenNewTab ? "_blank" : undefined} 
                    rel={demoOpenNewTab ? "noopener noreferrer" : undefined}
                  >
                    {demoLabel}
                  </a>
                </Button>
            )}
          </div>
          <div className="lg:hidden flex items-center gap-2">
             <Button variant="ghost" size="icon" onClick={toggleMode} className="h-8 w-8">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button onClick={() => setIsOpen(!isOpen)} variant="ghost" size="icon" className="h-8 w-8">
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden bg-white dark:bg-[#0b1021] border-t border-slate-200 dark:border-white/10 h-[calc(100vh-80px)] overflow-y-auto"
          >
            <div className="px-4 pt-2 pb-4 space-y-2">
              <Accordion type="single" collapsible className="w-full">
                {navLinks.map((link, idx) => (
                  link.children && link.children.length > 0 ? (
                    <AccordionItem key={idx} value={`item-${idx}`} className="border-b-0">
                      <AccordionTrigger className="py-2 text-base font-medium hover:no-underline text-slate-900 dark:text-white">
                        {link.name}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col space-y-2 pl-4">
                          {link.children.map((child, cIdx) => (
                            <React.Fragment key={cIdx}>
                                {renderNavLink(child.href, child.name, "block py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary", () => setIsOpen(false))}
                            </React.Fragment>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ) : (
                    <React.Fragment key={idx}>
                        {renderNavLink(
                            link.href, 
                            link.name, 
                            "block py-3 border-b border-slate-200 dark:border-white/10 text-base font-medium text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5",
                            () => setIsOpen(false)
                        )}
                    </React.Fragment>
                  )
                ))}
              </Accordion>

              <div className="border-t border-border pt-4 space-y-2 mt-4">
                {showDemoButton && (
                    <Button variant="outline" className="w-full" asChild>
                      <a 
                        href={demoUrl} 
                        target={demoOpenNewTab ? "_blank" : undefined} 
                        rel={demoOpenNewTab ? "noopener noreferrer" : undefined}
                      >
                        {demoLabel}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                )}
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link to="/register-school">Register School</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </header>
    </>
  );
};
