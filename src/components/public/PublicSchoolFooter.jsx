import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Youtube, Linkedin, Instagram, MapPin, Phone, Mail } from 'lucide-react';
import { getSubdomain } from '@/utils/subdomain';

const PublicSchoolFooter = ({ school, settings, alias }) => {
  if (!settings) return null;
  const isSubdomain = !!getSubdomain();
  const prefix = isSubdomain ? '' : `/${alias}`;

  // Get values with fallbacks
  const footerBgColor = settings.footer_bg_color || '#0f172a';
  const footerTextColor = settings.footer_text_color || '#94a3b8';
  const copyrightBgColor = settings.copyright_bg_color || '#020617';
  const copyrightTextColor = settings.copyright_text_color || '#64748b';
  const primaryColor = settings.primary_color || '#2563eb';
  
  const contactMobile = settings.contact_mobile || settings.mobile_no || settings.contact_number || '';
  const contactEmail = settings.contact_email || '';
  const address = settings.address || '';
  const footerAboutText = settings.footer_about_text || settings.footer_text || "Providing quality education and fostering holistic development for future leaders.";
  const copyrightText = settings.copyright_text || settings.footer_copyright_text || `© ${new Date().getFullYear()} ${settings.cms_title || school?.name}. All Rights Reserved.`;

  return (
    <footer style={{ backgroundColor: footerBgColor, color: footerTextColor }} className="pt-16 pb-8">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* About */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg" style={{ color: '#ffffff' }}>{settings.cms_title || school?.name}</h3>
          <p className="text-sm leading-relaxed opacity-80">
            {footerAboutText}
          </p>
          <div className="flex gap-4 pt-2">
            {settings.social_facebook_url && <a href={settings.social_facebook_url} target="_blank" rel="noreferrer" className="hover:opacity-100 opacity-70 transition-opacity"><Facebook size={18} /></a>}
            {settings.social_twitter_url && <a href={settings.social_twitter_url} target="_blank" rel="noreferrer" className="hover:opacity-100 opacity-70 transition-opacity"><Twitter size={18} /></a>}
            {settings.social_youtube_url && <a href={settings.social_youtube_url} target="_blank" rel="noreferrer" className="hover:opacity-100 opacity-70 transition-opacity"><Youtube size={18} /></a>}
            {settings.social_linkedin_url && <a href={settings.social_linkedin_url} target="_blank" rel="noreferrer" className="hover:opacity-100 opacity-70 transition-opacity"><Linkedin size={18} /></a>}
            {settings.social_instagram_url && <a href={settings.social_instagram_url} target="_blank" rel="noreferrer" className="hover:opacity-100 opacity-70 transition-opacity"><Instagram size={18} /></a>}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg" style={{ color: '#ffffff' }}>Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to={isSubdomain ? '/' : `/${alias}`} className="hover:opacity-100 opacity-70 transition-opacity">Home</Link></li>
            <li><Link to={`${prefix}/news`} className="hover:opacity-100 opacity-70 transition-opacity">Latest News</Link></li>
            <li><Link to={`${prefix}/events`} className="hover:opacity-100 opacity-70 transition-opacity">Events</Link></li>
            <li><Link to={`${prefix}/gallery`} className="hover:opacity-100 opacity-70 transition-opacity">Gallery</Link></li>
            <li><Link to={`${prefix}/exam-result`} className="hover:opacity-100 opacity-70 transition-opacity">Exam Results</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg" style={{ color: '#ffffff' }}>Contact Us</h3>
          <ul className="space-y-3 text-sm">
            {address && (
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 shrink-0" style={{ color: primaryColor }} />
                <span>{address}</span>
              </li>
            )}
            {contactMobile && (
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0" style={{ color: primaryColor }} />
                <a href={`tel:${contactMobile}`} className="hover:opacity-100 opacity-80">{contactMobile}</a>
              </li>
            )}
            {contactEmail && (
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0" style={{ color: primaryColor }} />
                <a href={`mailto:${contactEmail}`} className="hover:opacity-100 opacity-80">{contactEmail}</a>
              </li>
            )}
          </ul>
          {settings.working_hours && (
            <div className="mt-4 text-sm opacity-70">
              <strong>Working Hours:</strong><br/>
              {settings.working_hours}
            </div>
          )}
        </div>

        {/* Map/Extra */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg" style={{ color: '#ffffff' }}>Location</h3>
          {settings.map_embed_url ? (
            <iframe 
              src={settings.map_embed_url} 
              className="w-full h-40 rounded-lg"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="w-full h-40 rounded-lg flex flex-col items-center justify-center text-xs" style={{ backgroundColor: copyrightBgColor }}>
              <MapPin className="h-8 w-8 mb-2 opacity-30" />
              <span className="opacity-50">Map View</span>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12 pt-8 border-t text-center text-xs" style={{ borderColor: copyrightBgColor, color: copyrightTextColor, backgroundColor: copyrightBgColor, margin: '3rem auto 0', padding: '1.5rem 1rem' }}>
        <p>{copyrightText}</p>
      </div>
    </footer>
  );
};

export default PublicSchoolFooter;
