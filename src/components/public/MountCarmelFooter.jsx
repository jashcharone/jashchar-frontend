import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MountCarmelFooter = ({ school, settings, alias }) => {
  return (
    <footer className="bg-[#0f172a] text-white pt-16 pb-8 font-sans">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Column 1: Links */}
          <div>
            <h3 className="text-xl font-bold mb-6 border-l-4 border-[#fbce07] pl-3">Links</h3>
            <ul className="space-y-3">
              {['Home', 'About Us', 'Course', 'Gallery', 'Events', 'Contact Us'].map((item, i) => (
                <li key={i}>
                  <Link to="#" className="text-gray-400 hover:text-[#fbce07] transition-colors flex items-center text-sm">
                    <ChevronRight size={14} className="mr-2" /> {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Follow Us */}
          <div>
            <h3 className="text-xl font-bold mb-6 border-l-4 border-[#fbce07] pl-3">Follow Us</h3>
            <div className="flex gap-3 mb-6">
              {[Facebook, Twitter, Instagram, Linkedin, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="bg-white/10 p-2 rounded-full hover:bg-[#fbce07] hover:text-black transition-all">
                  <Icon size={18} />
                </a>
              ))}
            </div>
            <h3 className="text-xl font-bold mb-4 border-l-4 border-[#fbce07] pl-3">Feedback</h3>
            <Link to={`/s/${alias}/page/contact-us`} className="flex items-center text-gray-300 hover:text-white group">
               <div className="bg-white/10 p-2 rounded-md mr-3 group-hover:bg-[#fbce07] group-hover:text-black transition-all">
                 <Mail size={20} />
               </div>
               <span className="font-medium">Complain / Feedback</span>
            </Link>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="text-xl font-bold mb-6 border-l-4 border-[#fbce07] pl-3">Contact</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Phone className="text-[#fbce07] mt-1 shrink-0" size={20} />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                  <p className="font-semibold">{settings?.phone || "89562423934"}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="text-[#fbce07] mt-1 shrink-0" size={20} />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Email</p>
                  <p className="font-semibold">{settings?.email || "mountcarmeltest@gmail.com"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 4: Address */}
          <div>
            <h3 className="text-xl font-bold mb-6 border-l-4 border-[#fbce07] pl-3">Address</h3>
            <div className="flex items-start gap-4">
              <MapPin className="text-[#fbce07] mt-1 shrink-0" size={20} />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Location</p>
                <p className="font-semibold leading-relaxed">
                  {settings?.address || "25 Kings Street, CA, United States"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-sm text-gray-500">
            Â© {new Date().getFullYear()} {school?.name || "Mount Carmel School"}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default MountCarmelFooter;
