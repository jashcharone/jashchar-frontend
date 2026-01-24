import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Instagram, Send, Globe, Youtube, MapPin, Phone, Mail, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Footer = ({ content, contact }) => {
  // STRICT MODE: No defaults.
  const aboutText = content?.aboutText;
  const copyrightText = content?.copyrightText;
  const logo = content?.logo;
  const showPaymentIcons = content?.showPaymentIcons !== false;
  const showBackToTop = content?.showBackToTop !== false;

  if (!content || content.enabled === false) return null;

  // Support both camelCase and snake_case field names
  const quickLinks = content?.quickLinks || content?.quick_links || [];
  const socialLinks = content?.socialLinks || content?.social_links || [];
  const legalLinks = content?.legalLinks || content?.legal_links || [];

  // Helper to map social names to icons
  const getSocialIcon = (name) => {
      const n = (name || '').toLowerCase();
      if (n.includes('facebook')) return Facebook;
      if (n.includes('twitter') || n.includes('x')) return Twitter;
      if (n.includes('linkedin')) return Linkedin;
      if (n.includes('instagram')) return Instagram;
      if (n.includes('youtube')) return Youtube;
      if (n.includes('google')) return Globe;
      return Globe;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative overflow-hidden bg-secondary text-secondary-foreground border-t border-border">
      <div className="container mx-auto px-4 py-14 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Column 1: Logo & About */}
          <div className="space-y-4">
            {logo ? (
                <img src={logo} alt="Logo" className="h-12 object-contain" />
            ) : (
                <h2 className="text-2xl font-bold text-primary">Jashchar ERP</h2>
            )}
            {aboutText && <p className="text-sm text-muted-foreground leading-relaxed">{aboutText}</p>}
          </div>

          {/* Column 2: Quick Links */}
          <div>
              <h4 className="font-bold text-lg mb-6 text-white">Quick Link</h4>
              <ul className="space-y-3 text-sm text-gray-400">
              {quickLinks.length > 0 ? quickLinks.map((link, idx) => (
                  <li key={idx}>
                  <a href={link.href} className="hover:text-primary transition-colors flex items-center gap-2">
                      <span className="text-primary">º</span> {link.name}
                  </a>
                  </li>
              )) : (
                  <>
                    <li><Link to="/" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-primary">º</span> Home</Link></li>
                    <li><Link to="/#features" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-primary">º</span> Features</Link></li>
                    <li><Link to="/#pricing" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-primary">º</span> Pricing</Link></li>
                    <li><Link to="/#faq" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-primary">º</span> Faq</Link></li>
                    <li><Link to="/contact" className="hover:text-primary transition-colors flex items-center gap-2"><span className="text-primary">º</span> Contact</Link></li>
                  </>
              )}
              </ul>
              
              {/* Legal Links */}
              {legalLinks.length > 0 && (
                <div className="mt-6">
                  <h5 className="font-semibold text-sm mb-3 text-white">Legal</h5>
                  <ul className="space-y-2 text-sm text-gray-400">
                    {legalLinks.map((link, idx) => (
                      <li key={idx}>
                        <a href={link.href} className="hover:text-primary transition-colors flex items-center gap-2">
                          <span className="text-primary">º</span> {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>

          {/* Column 3: Address (Contact Info) */}
          <div>
              <h4 className="font-bold text-lg mb-6 text-white">Address</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                  {contact?.address && (
                      <li className="flex gap-3 items-start">
                          <div className="p-2 border border-blue-500/30 rounded bg-blue-500/10 text-blue-400 shrink-0">
                              <MapPin className="h-4 w-4" />
                          </div>
                          <span className="leading-relaxed">{contact.address}</span>
                      </li>
                  )}
                  {contact?.phone && (
                      <li className="flex gap-3 items-center">
                          <div className="p-2 border border-blue-500/30 rounded bg-blue-500/10 text-blue-400 shrink-0">
                              <Phone className="h-4 w-4" />
                          </div>
                          <a href={`tel:${contact.phone}`} className="hover:text-primary transition-colors">{contact.phone}</a>
                      </li>
                  )}
                  {contact?.email && (
                      <li className="flex gap-3 items-center">
                          <div className="p-2 border border-blue-500/30 rounded bg-blue-500/10 text-blue-400 shrink-0">
                              <Mail className="h-4 w-4" />
                          </div>
                          <a href={`mailto:${contact.email}`} className="hover:text-primary transition-colors">{contact.email}</a>
                      </li>
                  )}
              </ul>
          </div>

          {/* Column 4: Social Links */}
          <div>
              <h4 className="font-bold text-lg mb-6 text-white">Social Link</h4>
              <div className="flex flex-wrap gap-3">
              {(socialLinks.length > 0 ? socialLinks : [
                  { platform: 'facebook', href: '#' },
                  { platform: 'twitter', href: '#' },
                  { platform: 'instagram', href: '#' },
                  { platform: 'linkedin', href: '#' },
                  { platform: 'youtube', href: '#' },
                  { platform: 'google', href: '#' }
              ]).map((social, index) => {
                  const Icon = getSocialIcon(social.name || social.platform);
                  return (
                      <a key={index} href={social.href} target="_blank" rel="noopener noreferrer" className="p-2.5 border border-white/20 rounded hover:border-primary hover:text-primary transition-colors">
                          <Icon className="h-4 w-4" />
                      </a>
                  );
              })}
              </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-white text-slate-800 py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm font-medium text-center md:text-left">
            {copyrightText || 'Copyright Â© 2025 Jashchar ERP School Management - Developed by Jashchar Pvt Ltd'}
          </div>
          
          <div className="flex items-center gap-6">
              {showPaymentIcons && (
                  <div className="flex items-center gap-4 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-8" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="GPay" className="h-6" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-6" />
                  </div>
              )}
              
              {showBackToTop && (
                  <button 
                    onClick={scrollToTop}
                    className="h-10 w-10 bg-primary text-white rounded flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg"
                  >
                      <ChevronUp className="h-6 w-6" />
                  </button>
              )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
