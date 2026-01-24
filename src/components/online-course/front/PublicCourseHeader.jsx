import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, Phone, Mail, Facebook, Twitter, Youtube, Instagram, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSchoolSlug } from '@/hooks/useSchoolSlug';
import { getSubdomain } from '@/utils/subdomain';

const PublicCourseHeader = ({ school, cartCount }) => {
  const schoolAlias = useSchoolSlug();
  const isSubdomain = !!getSubdomain();
  const prefix = isSubdomain ? '' : `/${schoolAlias}`;

  return (
    <div className="flex flex-col w-full">
      {/* Top Bar (News & Socials) */}
      <div className="bg-[#2e2e2e] text-white text-xs py-2 px-4 hidden md:flex justify-between items-center">
        <div className="flex items-center gap-4 overflow-hidden max-w-3xl">
          <span className="bg-[#d0021b] px-2 py-0.5 font-bold uppercase">Latest News</span>
          <div className="truncate animate-marquee whitespace-nowrap">
            Admission open for 2024-25 session. Online classes available. Contact school office for more details.
          </div>
        </div>
        <div className="flex items-center gap-3">
          {school?.contact_email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {school.contact_email}</span>}
          <div className="flex gap-2 ml-2">
            <Facebook className="h-3 w-3 cursor-pointer hover:text-gray-300" />
            <Twitter className="h-3 w-3 cursor-pointer hover:text-gray-300" />
            <Youtube className="h-3 w-3 cursor-pointer hover:text-gray-300" />
            <Instagram className="h-3 w-3 cursor-pointer hover:text-gray-300" />
          </div>
        </div>
      </div>

      {/* Middle Bar (Logo, Contact, Cart) */}
      <div className="bg-white py-4 px-4 md:px-8 border-b flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          {school?.logo_url ? (
            <img src={school.logo_url} alt={school.name} className="h-16 w-auto object-contain" />
          ) : (
            <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center text-xs text-center p-1 font-bold text-gray-500">Logo</div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-[#8a3c3c] uppercase tracking-wide">{school?.name || 'School Name'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {school?.contact_number && (
            <div className="hidden md:flex items-center gap-3 text-right">
              <div className="bg-white border border-red-100 p-2 rounded-full text-[#d0021b]">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Call Us</p>
                <p className="text-sm font-bold text-[#d0021b]">{school.contact_number}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Select defaultValue="USD">
              <SelectTrigger className="w-[80px] h-9 rounded-full border-gray-300 bg-transparent">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="INR">INR</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <div className="border border-[#d0021b] text-[#d0021b] p-2 rounded-full cursor-pointer hover:bg-red-50 transition-colors">
                <ShoppingCart className="h-5 w-5" />
              </div>
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-5 flex items-center justify-center bg-[#d0021b] text-white text-[10px] border-2 border-white rounded-full">
                  {cartCount}
                </Badge>
              )}
            </div>

            <Link to={`${prefix}/login`}>
              <Button className="rounded-full bg-[#d0021b] hover:bg-[#a80216] px-6 h-9">
                <User className="h-4 w-4 mr-2" /> Login
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="bg-white border-b shadow-sm overflow-x-auto">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-6 text-sm font-medium whitespace-nowrap min-w-max">
            <Link to={isSubdomain ? '/' : `/${schoolAlias}`} className="py-4 border-b-2 border-transparent hover:border-[#d0021b] hover:text-[#d0021b] transition-all">Home</Link>
            <Link to={`${prefix}/online-course`} className="py-4 border-b-2 border-[#d0021b] text-[#d0021b] transition-all">Online Course</Link>
            <Link to={`${prefix}/admission`} className="py-4 border-b-2 border-transparent hover:border-[#d0021b] hover:text-[#d0021b] transition-all">Online Admission</Link>
            <Link to={`${prefix}/exam-result`} className="py-4 border-b-2 border-transparent hover:border-[#d0021b] hover:text-[#d0021b] transition-all">Exam Result</Link>
            <Link to="#" className="py-4 border-b-2 border-transparent hover:border-[#d0021b] hover:text-[#d0021b] transition-all">About Us</Link>
            <Link to="#" className="py-4 border-b-2 border-transparent hover:border-[#d0021b] hover:text-[#d0021b] transition-all">Academics</Link>
            <Link to={`${prefix}/gallery`} className="py-4 border-b-2 border-transparent hover:border-[#d0021b] hover:text-[#d0021b] transition-all">Gallery</Link>
            <Link to={`${prefix}/events`} className="py-4 border-b-2 border-transparent hover:border-[#d0021b] hover:text-[#d0021b] transition-all">Events</Link>
            <Link to={`${prefix}/news`} className="py-4 border-b-2 border-transparent hover:border-[#d0021b] hover:text-[#d0021b] transition-all">News</Link>
            <Link to="#" className="py-4 border-b-2 border-transparent hover:border-[#d0021b] hover:text-[#d0021b] transition-all">Contact</Link>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default PublicCourseHeader;
