import React, { useState, useEffect } from 'react';
import { formatDate, getMonthShortName } from '@/utils/dateUtils';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Users,
  Award,
  Building,
  UserCheck,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSchoolSlug } from '@/hooks/useSchoolSlug';
import publicCmsService from '@/services/publicCmsService';
import { PublicHeader, PublicFooter, TopBar } from '@/components/public/PublicLayoutComponents';

// --- SECTIONS ---

const HeroSlider = ({ slides }) => {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((curr) => (curr + 1) % slides.length);
  const prev = () => setCurrent((curr) => (curr - 1 + slides.length) % slides.length);

  if (!slides || slides.length === 0) return null;

  return (
    <div className="relative h-[500px] md:h-[600px] overflow-hidden bg-gray-900">
      {slides.map((slide, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: index === current ? 1 : 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img
            src={slide.image_url || slide.imageUrl}
            alt={slide.title || 'School'}
            className="w-full h-full object-cover opacity-80"
            loading="eager"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1600&q=80&auto=format&fit=crop';
            }}
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center px-4">
            <div className="max-w-4xl">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: index === current ? 0 : 20, opacity: index === current ? 1 : 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg"
              >
                {slide.title}
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: index === current ? 0 : 20, opacity: index === current ? 1 : 0 }}
                transition={{ delay: 0.5 }}
                className="text-xl md:text-2xl text-gray-200 mb-8 drop-shadow-md"
              >
                {slide.subtitle || slide.description}
              </motion.p>
              {slide.link && (
                <motion.a
                  href={slide.link}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: index === current ? 0 : 20, opacity: index === current ? 1 : 0 }}
                  transition={{ delay: 0.7 }}
                  className="inline-block bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full font-semibold transition-colors"
                >
                  Learn More
                </motion.a>
              )}
            </div>
          </div>
        </motion.div>
      ))}
      
      {slides.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-2 rounded-full text-white transition-colors">
            <ChevronLeft size={32} />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-2 rounded-full text-white transition-colors">
            <ChevronRight size={32} />
          </button>
        </>
      )}
    </div>
  );
};

const FeatureCards = () => (
  <div className="container mx-auto px-4 -mt-16 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
    {[
      { icon: GraduationCap, title: 'Expert Faculty', desc: 'Highly qualified teachers dedicated to student success.' },
      { icon: BookOpen, title: 'Modern Curriculum', desc: 'Innovative learning approaches for the 21st century.' },
      { icon: Users, title: 'Community Focus', desc: 'Building strong relationships between school and home.' },
    ].map((item, i) => (
      <div key={i} className="bg-white p-8 rounded-lg shadow-lg border-t-4 border-primary hover:-translate-y-1 transition-transform duration-300">
        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
          <item.icon className="text-primary h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-center mb-2">{item.title}</h3>
        <p className="text-gray-600 text-center">{item.desc}</p>
      </div>
    ))}
  </div>
);

const AcademicsOverviewSection = ({ items }) => {
  const list = items?.length
    ? items
    : [
        { title: 'Pre Primary', description: 'Early learning and foundational skills.', link: '/page/pre-primary' },
        { title: 'Primary', description: 'Core concepts and confidence building.', link: '/page/course' },
        { title: 'Secondary', description: 'Depth learning and exam readiness support.', link: '/page/course' },
      ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 uppercase">Academics</h2>
          <div className="w-20 h-1 bg-[#c70039] mx-auto mb-4"></div>
          <p className="text-gray-500">An overview of classes and learning tracks.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {list.map((it) => (
            <div key={it.title} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-8">
              <h3 className="text-lg font-bold text-gray-800">{it.title}</h3>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">{it.description}</p>
              <Button
                asChild
                size="sm"
                className="mt-5 bg-[#c70039] hover:bg-[#a0002d] text-white rounded-sm"
              >
                <a href={it.link}>Read More</a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FacilitiesPreviewSection = ({ facilities }) => {
  const list = facilities?.length
    ? facilities
    : [
        {
          title: 'Library',
          description: 'Reading corner and curated learning resources.',
          imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=900&q=80&auto=format&fit=crop',
        },
        {
          title: 'Science Labs',
          description: 'Hands-on experiments with safe lab practices.',
          imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=900&q=80&auto=format&fit=crop',
        },
        {
          title: 'Sports',
          description: 'Indoor and outdoor sports and athletics training.',
          imageUrl: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=900&q=80&auto=format&fit=crop',
        },
      ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 uppercase">Facilities</h2>
          <div className="w-20 h-1 bg-[#c70039] mx-auto mb-4"></div>
          <p className="text-gray-500">A quick preview of campus facilities.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {list.map((f) => (
            <div key={f.title} className="bg-white shadow-md hover:shadow-xl transition-shadow">
              <div className="h-48 overflow-hidden">
                <img
                  src={f.imageUrl}
                  alt={f.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=80&auto=format&fit=crop';
                  }}
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800">{f.title}</h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{f.description}</p>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="mt-4 rounded-sm border-gray-200"
                >
                  <a href="/page/facilities">View All</a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const PrincipalMessageSection = ({ principal }) => {
  const p = principal || {};
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4 uppercase">Principal Message</h2>
            <div className="w-20 h-1 bg-[#c70039] mb-6"></div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {p.excerpt ||
                'This is placeholder content for Phase 1. In Phase 2, the Front-CMS will allow admins to edit this message.'}
            </p>
            <div className="mt-6">
              <div className="font-bold text-gray-800">{p.name || 'Principal (Sample)'}</div>
              <div className="text-sm text-gray-500">{p.role || 'Principal'}</div>
            </div>
            <Button asChild className="mt-6 bg-[#c70039] hover:bg-[#a0002d] rounded-sm">
              <a href={p.link || '/page/principal-message'}>Read More</a>
            </Button>
          </div>
          <div className="flex justify-center md:justify-end">
            <div className="w-full max-w-md">
              <img
                src={
                  p.imageUrl ||
                  'https://images.unsplash.com/photo-1557862921-37829c790f19?w=700&q=80&auto=format&fit=crop'
                }
                alt="Principal"
                className="rounded-lg shadow-lg w-full h-[360px] object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=700&q=80&auto=format&fit=crop';
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const LatestNewsSection = ({ news, slug }) => {
  if (!news || news.length === 0) return null;
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h4 className="text-primary font-bold uppercase tracking-wider mb-2">Latest Updates</h4>
          <h2 className="text-3xl font-bold text-gray-900">School News</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {news.slice(0, 3).map((item) => (
            <div key={item.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className="h-48 overflow-hidden">
                <img 
                  src={item.image_url || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80"} 
                  alt={item.title} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(item.date || item.published_at)}</span>
                </div>
                <h3 className="text-xl font-bold mb-3 line-clamp-2">{item.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{item.summary || item.description?.replace(/<[^>]*>/g, '').substring(0, 100)}...</p>
                <a href={`/${slug}/news/${item.id}`} className="text-primary font-medium hover:underline">Read More &rarr;</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const UpcomingEventsSection = ({ events, slug }) => {
  if (!events || events.length === 0) return null;
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h4 className="text-primary font-bold uppercase tracking-wider mb-2">Mark Your Calendar</h4>
            <h2 className="text-3xl font-bold text-gray-900">Upcoming Events</h2>
          </div>
          <a href={`/${slug}/events`} className="hidden md:inline-block text-primary font-medium hover:underline">View All Events &rarr;</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.slice(0, 3).map((event) => (
            <div key={event.id} className="flex bg-gray-50 rounded-lg overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
              <div className="bg-primary text-white p-4 flex flex-col items-center justify-center min-w-[80px]">
                <span className="text-2xl font-bold">{new Date(event.start_date).getDate()}</span>
                <span className="text-xs uppercase font-bold">{getMonthShortName(event.start_date)}</span>
              </div>
              <div className="p-4 flex-grow">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <MapPin className="h-3 w-3" />
                  <span>{event.venue || 'Campus'}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{event.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{event.description?.replace(/<[^>]*>/g, '')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const GalleryPreviewSection = ({ gallery }) => {
  const items = Array.isArray(gallery) ? gallery.slice(0, 8) : [];
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 uppercase">Gallery</h2>
          <div className="w-20 h-1 bg-[#c70039] mx-auto mb-4"></div>
          <p className="text-gray-500">A glimpse into school life.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((g) => (
            <a key={g.id} href="/page/gallery" className="block group">
              <div className="border rounded-md overflow-hidden">
                <img
                  src={g.imageUrl}
                  alt={g.title}
                  className="w-full h-36 object-cover group-hover:scale-[1.03] transition-transform"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=80&auto=format&fit=crop';
                  }}
                />
              </div>
            </a>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button asChild className="bg-[#c70039] hover:bg-[#a0002d] rounded-sm">
            <a href="/page/gallery">View Full Gallery</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

const ContactStripSection = ({ phone, email }) => (
  <section className="bg-[#c70039] text-white py-12">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        <div>
          <h2 className="text-2xl font-bold uppercase">Contact</h2>
          <p className="text-white/80 text-sm mt-2">We are happy to help. Reach out any time.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/15 p-3 rounded-full"><Phone size={20} /></div>
          <div>
            <div className="text-xs text-white/80">Call Us</div>
            <div className="font-semibold">{phone || '+91 90000 00000'}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 md:justify-end">
          <div className="bg-white/15 p-3 rounded-full"><Mail size={20} /></div>
          <div>
            <div className="text-xs text-white/80">Email</div>
            <div className="font-semibold">{email || 'info@school.example'}</div>
          </div>
        </div>
      </div>

      <div className="text-center mt-8">
        <Button asChild className="bg-white text-[#c70039] hover:bg-white/90 rounded-sm">
          <a href="/page/contact-us">Contact Us</a>
        </Button>
      </div>
    </div>
  </section>
);

const AboutSection = ({ settings }) => (
  <section className="py-20 bg-white">
    <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
      <div className="md:w-1/2">
        <div className="relative">
          <img 
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80" 
            alt="About School" 
            className="rounded-lg shadow-xl w-full"
          />
          <div className="absolute -bottom-6 -right-6 bg-primary text-white p-8 rounded-lg hidden md:block">
            <p className="text-4xl font-bold">25+</p>
            <p className="text-sm uppercase tracking-wider">Years of Excellence</p>
          </div>
        </div>
      </div>
      <div className="md:w-1/2">
        <h4 className="text-primary font-bold uppercase tracking-wider mb-2">About Us</h4>
        <h2 className="text-4xl font-bold text-gray-900 mb-6">Welcome to {settings?.school_name || 'Our School'}</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          {settings?.about_text || "We are dedicated to providing a nurturing environment where students can excel academically, socially, and emotionally. Our holistic approach ensures that every child reaches their full potential."}
        </p>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Award className="text-primary h-6 w-6" />
            <span className="font-medium">Certified Education</span>
          </div>
          <div className="flex items-center gap-3">
            <Building className="text-primary h-6 w-6" />
            <span className="font-medium">Modern Facilities</span>
          </div>
          <div className="flex items-center gap-3">
            <UserCheck className="text-primary h-6 w-6" />
            <span className="font-medium">Expert Teachers</span>
          </div>
          <div className="flex items-center gap-3">
            <Users className="text-primary h-6 w-6" />
            <span className="font-medium">Active Community</span>
          </div>
        </div>
        <Button className="bg-primary hover:bg-primary/90">Discover More</Button>
      </div>
    </div>
  </section>
);

const CoursesSection = () => {
  const courses = [
    { title: "Science", sub: "Electrical Engineering", img: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&q=80" },
    { title: "Science", sub: "Electrical Engineering", img: "https://images.unsplash.com/photo-1581092921461-eab62e97a782?w=600&q=80" },
    { title: "Science", sub: "Electrical Engineering", img: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&q=80" },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 uppercase">Our Main Courses</h2>
          <div className="w-20 h-1 bg-[#c70039] mx-auto mb-4"></div>
          <p className="text-gray-500">Fusce sem dolor, interdum in efficitur at</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {courses.map((c, i) => (
            <div key={i} className="bg-white shadow-md hover:shadow-xl transition-shadow group">
              <div className="h-48 overflow-hidden relative">
                <img src={c.img} alt={c.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute bottom-4 right-4 bg-[#c70039] text-white p-2 rounded-full">
                  <ChevronRight size={16} />
                </div>
              </div>
              <div className="p-6">
                <span className="text-[#c70039] text-xs font-bold uppercase tracking-wider">{c.title}</span>
                <h3 className="text-xl font-bold mt-2 mb-3 text-gray-800">{c.sub}</h3>
                <p className="text-gray-500 text-sm mb-4">All over the world, human beings create an immense and ever-increasing volume of data.</p>
                <Button size="sm" className="bg-[#c70039] hover:bg-[#a0002d] text-white rounded-sm px-6">APPLY NOW</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const StatsSection = () => {
  const stats = [
    { num: "315", label: "GRADUATES", icon: GraduationCap },
    { num: "157", label: "CERTIFIED TEACHERS", icon: Award },
    { num: "7", label: "STUDENT CAMPUSES", icon: Building },
    { num: "471", label: "STUDENTS", icon: Users },
  ];

  return (
    <section className="py-20 bg-[#1e293b] text-white relative overflow-hidden">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-bold mb-4 uppercase">ACHIEVEMENTS</h2>
          <p className="text-gray-400 mb-8 max-w-md">
            A wonderful serenity has taken possession of my entire soul, like these sweet mornings of spring which I enjoy with my whole heart like mine.
          </p>
          <img 
            src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&q=80" 
            alt="Graduation" 
            className="rounded-lg shadow-lg opacity-80"
          />
        </div>
        <div className="grid grid-cols-2 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center border border-gray-700 p-8 hover:border-[#fbce07] transition-colors group">
              <s.icon size={40} className="text-[#fbce07] mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-4xl font-bold mb-2">{s.num}</h3>
              <p className="text-xs font-bold tracking-widest uppercase text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const StaffSection = () => {
  const staff = [
    { name: "Stella Roffin", role: "Drawing Teacher", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80" },
    { name: "Princy Flora", role: "English Tutor", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80" },
    { name: "Jesica Matt", role: "Art Teacher", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80" },
    { name: "Janaton Doe", role: "Math Teacher", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80" },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4 uppercase">OUR EXPERIENCED STAFFS</h2>
        <p className="text-gray-500 mb-12">Considering desire as primary motivation for the generation of narratives is a useful concept.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {staff.map((s, i) => (
            <div key={i} className="text-center group">
              <div className="w-40 h-40 mx-auto rounded-full overflow-hidden mb-4 border-4 border-gray-100 group-hover:border-[#c70039] transition-colors">
                <img src={s.img} alt={s.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">{s.name}</h3>
              <p className="text-sm text-gray-500">{s.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TestimonialsSection = () => (
  <section className="py-20 bg-[#1e293b] text-white text-center">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl font-bold mb-4 uppercase">WHAT PEOPLE SAYS</h2>
      <p className="text-gray-400 mb-12">Fusce sem dolor, interdum in efficitur at, faucibus nec lorem. Sed nec molestie justo.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {[1, 2].map((_, i) => (
          <div key={i} className="bg-[#2e3b4e] p-8 rounded-lg relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full overflow-hidden border-2 border-[#fbce07]">
              <img src={`https://i.pravatar.cc/150?img=${i + 10}`} alt="User" />
            </div>
            <h3 className="mt-6 font-bold text-white uppercase tracking-wider">SIDNEY W. YARBER</h3>
            <p className="text-xs text-gray-400 mb-4">Manager</p>
            <p className="text-sm text-gray-300 italic leading-relaxed">
              "Etiam non elit nec augue tempor gravida et sed velit. Aliquam tempus eget lorem ut malesuada. Phasellus dictum est sed libero posuere dignissim."
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// --- MAIN PAGE ---

const SchoolHomepage = () => {
  const schoolSlug = useSchoolSlug();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!schoolSlug) return;
      try {
        const res = await publicCmsService.getPublicSite(schoolSlug);
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [schoolSlug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center">School not found</div>;

  const { settings, menus, banners, news, events } = data;

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">
      <Helmet>
        <title>{settings.school_name || 'School Home'}</title>
      </Helmet>
      
      <TopBar settings={settings} news={news} />
      <PublicHeader settings={settings} menus={menus} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} slug={schoolSlug} />
      
      <main className="flex-grow">
        <HeroSlider slides={banners} />
        <FeatureCards />
        <AboutSection settings={settings} />
        <LatestNewsSection news={news} slug={schoolSlug} />
        <UpcomingEventsSection events={events} slug={schoolSlug} />
        <StatsSection />
        <StaffSection />
        <TestimonialsSection />
        <ContactStripSection phone={settings?.phone || settings?.contact_number} email={settings?.email || settings?.contact_email} />
      </main>
      
      <PublicFooter settings={settings} />
    </div>
  );
};

export default SchoolHomepage;
