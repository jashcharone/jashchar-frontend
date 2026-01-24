import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import publicCmsService from '@/services/publicCmsService';
import { 
  Loader2, Phone, MapPin, Mail, Facebook, Twitter, Youtube, 
  Linkedin, Instagram, ChevronRight, ChevronLeft, Plus, Minus, 
  GraduationCap, Users, Trophy, BookOpen, UserCheck, Quote, Clock, CheckCircle, User,
  Calendar, Newspaper, PlayCircle, X, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';
import { PublicHeader, PublicFooter, TopBar } from '@/components/public/PublicLayoutComponents';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSchoolSlug } from '@/hooks/useSchoolSlug';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import InactiveSchoolNotification from '@/components/public/InactiveSchoolNotification';

// Theme Color Defaults
const DEFAULT_PRIMARY = '#c72027';
const DEFAULT_DARK = '#1e293b';

// Placeholder image generator using placehold.co (more reliable than via.placeholder.com)
const getPlaceholder = (width, height, text) => 
  `https://placehold.co/${width}x${height}/e2e8f0/64748b?text=${encodeURIComponent(text)}`;

// --- Components ---

const HeroSlider = ({ banners, primaryColor = DEFAULT_PRIMARY }) => {
  const [current, setCurrent] = useState(0);
  const [videoOpen, setVideoOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  
  const defaultBanners = [
    {
      id: 'default-1',
      image_url: 'https://demo.smart-school.in/uploads/gallery/media/banner1.jpg',
      title: 'A Unique Culture Of Inclusive',
      subtitle: 'Education Which Encourages Unity In Diversity',
      banner_type: 'image'
    }
  ];

  const displayBanners = banners?.length > 0 ? banners : defaultBanners;

  useEffect(() => {
    if (displayBanners.length <= 1 || videoOpen) return;
    const timer = setInterval(() => setCurrent(p => (p + 1) % displayBanners.length), 5000);
    return () => clearInterval(timer);
  }, [displayBanners, videoOpen]);

  const handleVideoClick = (videoUrl) => {
    setCurrentVideo(videoUrl);
    setVideoOpen(true);
  };

  return (
    <div className="relative h-[500px] md:h-[600px] bg-gray-900 overflow-hidden group">
      {displayBanners.map((banner, index) => {
        // Device Visibility Check (CSS based)
        const visibilityClass = 
          banner.device_visibility === 'mobile' ? 'block md:hidden' :
          banner.device_visibility === 'desktop' ? 'hidden md:block' :
          'block';

        return (
          <div key={banner.id} className={`absolute inset-0 transition-opacity duration-1000 ${index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'} ${visibilityClass}`}>
            
            {/* Media Render */}
            {banner.banner_type === 'video' ? (
              <video 
                src={banner.video_url} 
                className="w-full h-full object-cover opacity-80" 
                autoPlay 
                muted 
                loop 
                playsInline 
              />
            ) : (
              <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover opacity-80" />
            )}

            {/* Overlay & Content */}
            <div className="absolute inset-0 bg-black/30" /> {/* Dark Overlay */}
            
            <div className="absolute inset-0 flex items-center justify-start container mx-auto px-4">
              <div className="text-left text-white max-w-2xl animate-fade-in-up pl-8 md:pl-16">
                <h2 className="text-4xl md:text-6xl font-normal mb-4 leading-tight text-white drop-shadow-md">
                  {banner.title}
                </h2>
                <h3 className="text-2xl md:text-4xl font-normal text-white leading-tight drop-shadow-md mb-6">
                  {banner.subtitle}
                </h3>
                
                <div className="flex gap-4">
                  {banner.button_text && banner.link_url && (
                    <a 
                      href={banner.link_url} 
                      className="inline-block text-white px-8 py-3 rounded-full font-semibold transition-opacity hover:opacity-90"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {banner.button_text}
                    </a>
                  )}
                  
                  {banner.banner_type === 'popup' && banner.video_url && (
                    <button 
                      onClick={() => handleVideoClick(banner.video_url)}
                      className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-8 py-3 rounded-full font-semibold transition-colors border border-white/50"
                    >
                      <PlayCircle size={20} /> Watch Video
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {displayBanners.length > 1 && (
        <>
            <button 
                onClick={() => setCurrent(c => (c - 1 + displayBanners.length) % displayBanners.length)} 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20"
                style={{ backgroundColor: primaryColor }}
            >
                <ChevronLeft />
            </button>
            <button 
                onClick={() => setCurrent(c => (c + 1) % displayBanners.length)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20"
                style={{ backgroundColor: primaryColor }}
            >
                <ChevronRight />
            </button>
        </>
      )}

      {/* Video Modal */}
      {videoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
            <button 
              onClick={() => { setVideoOpen(false); setCurrentVideo(null); }}
              className="absolute top-4 right-4 text-white hover:text-red-500 z-10 bg-black/50 rounded-full p-2"
            >
              <X size={24} />
            </button>
            <video 
              src={currentVideo} 
              className="w-full h-full" 
              controls 
              autoPlay 
            />
          </div>
        </div>
      )}
    </div>
  );
};

const FeatureBar = ({ primaryColor = DEFAULT_PRIMARY }) => {
  const features = [
    { icon: <GraduationCap size={40} />, title: 'Scholarship Facility', desc: 'Eimply dummy text printing ypese tting industry.' },
    { icon: <BookOpen size={40} />, title: 'Books & Liberary', desc: 'Eimply dummy text printing ypese tting industry.' },
    { icon: <Users size={40} />, title: 'Certified Teachers', desc: 'Eimply dummy text printing ypese tting industry.' },
  ];

  return (
    <div className="text-white py-8 relative z-10 -mt-10 container mx-auto rounded-md shadow-xl max-w-6xl"
         style={{ backgroundColor: primaryColor }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-4 border-r last:border-0 border-white/30 pr-4">
            <div className="p-2 bg-white/10 rounded-full">{React.cloneElement(f.icon, { size: 32 })}</div>
            <div>
              <h4 className="font-bold text-lg">{f.title}</h4>
              <p className="text-sm opacity-90">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AboutSection = ({ content, primaryColor = DEFAULT_PRIMARY }) => {
  // Merged Welcome/About section to match reference layout (Image Left, Accordion Right)
  return (
    <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full -z-10"></div>
            <img src="https://demo.smart-school.in/uploads/gallery/media/welcome.jpg" alt="Classroom" className="rounded-lg shadow-2xl w-full" />
            <div className="absolute -bottom-6 -right-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl hidden md:block">
              <div className="flex items-center gap-3">
                <div className="text-white p-2 rounded-full" style={{ backgroundColor: primaryColor }}>
                  <Quote size={16} />
                </div>
                <div>
                  <p className="font-bold text-base dark:text-white">Best Education</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Award 2023</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-1" style={{ backgroundColor: primaryColor }}></span>
              <span className="font-bold uppercase tracking-wider text-base" style={{ color: primaryColor }}>Welcome</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white leading-tight">
              WELCOME TO MOUNT CARMEL
            </h2>
            <div dangerouslySetInnerHTML={{ __html: content || "<p>We are dedicated to providing a nurturing environment where students can grow academically, socially, and emotionally. Our holistic approach ensures that every child receives the attention they need to succeed.</p>" }} 
                 className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed text-lg prose dark:prose-invert max-w-none" />
            
            <Accordion type="single" collapsible className="w-full space-y-3">
              <AccordionItem value="item-1" className="border-none">
                <AccordionTrigger 
                  className="bg-gray-900 text-white px-5 py-3 rounded hover:opacity-90 hover:no-underline transition-colors data-[state=open]:bg-opacity-90 dark:data-[state=open]:bg-gray-800 text-base font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  Collapsible Group Item #1
                </AccordionTrigger>
                <AccordionContent className="p-5 border border-t-0 rounded-b bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 dark:border-gray-700 text-base">
                  Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. 3 wolf moon officia aute, non cupidatat skateboard dolor brunch.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-none">
                <AccordionTrigger 
                  className="bg-gray-900 text-white px-5 py-3 rounded hover:opacity-90 hover:no-underline transition-colors data-[state=open]:bg-opacity-90 dark:data-[state=open]:bg-gray-800 text-base font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  Collapsible Group Item #2
                </AccordionTrigger>
                <AccordionContent className="p-5 border border-t-0 rounded-b bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 dark:border-gray-700 text-base">
                  Food truck quinoa nesciunt laborum eiusmod. Brunch 3 wolf moon tempor, sunt aliqua put a bird on it squid single-origin coffee nulla assumenda shoreditch et.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-none">
                <AccordionTrigger 
                  className="bg-gray-900 text-white px-5 py-3 rounded hover:opacity-90 hover:no-underline transition-colors data-[state=open]:bg-opacity-90 dark:data-[state=open]:bg-gray-800 text-base font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  Collapsible Group Item #3
                </AccordionTrigger>
                <AccordionContent className="p-5 border border-t-0 rounded-b bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 dark:border-gray-700 text-base">
                  Nihil anim keffiyeh helvetica, craft beer labore wes anderson cred nesciunt sapiente ea proident. Ad vegan excepteur butcher vice lomo.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
};

const WelcomeSection = ({ content }) => {
  // Merged into AboutSection to match the reference image layout better
  return null; 
};

const CoursesSection = ({ slug, primaryColor = DEFAULT_PRIMARY }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await publicCmsService.getCourses(slug);
        if (res.success) setCourses(res.data);
      } catch (err) {
        console.error("Failed to fetch courses", err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchCourses();
  }, [slug]);

  if (loading) return null;
  if (!courses || courses.length === 0) return null;

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="w-8 h-1" style={{ backgroundColor: primaryColor }}></span>
            <span className="font-bold uppercase tracking-wider text-base" style={{ color: primaryColor }}>Academics</span>
            <span className="w-8 h-1" style={{ backgroundColor: primaryColor }}></span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Our Popular Courses</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {courses.map((c, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-md group hover:shadow-xl transition-all duration-300">
              <div className="relative h-56 overflow-hidden">
                <img 
                  src={c.image_url || getPlaceholder(400, 300, 'Course')} 
                  alt={c.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button 
                    className="text-white px-5 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 text-base font-medium"
                    style={{ backgroundColor: primaryColor }}
                  >
                    View Details
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full" style={{ color: primaryColor }}>
                    {c.title}
                  </span>
                  <div className="flex text-yellow-400 text-sm">
                    {'✨'.repeat(Math.round(c.rating || 5))}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white hover:opacity-80 transition-opacity" style={{ color: 'inherit' }}>
                  {c.subtitle}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 line-clamp-3 text-base">
                  {c.description}
                </p>
                <div className="border-t dark:border-gray-800 pt-4 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <User size={14} /> {c.student_count || '0'} Students
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {c.duration || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const AchievementsSection = ({ slug, primaryColor = DEFAULT_PRIMARY }) => {
  const [stats, setStats] = useState([]);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await publicCmsService.getAchievements(slug);
        if (res.success && res.data.length > 0) {
            setStats(res.data);
        } else {
            // Fallback to defaults if no data
            setStats([
                { icon_name: 'GraduationCap', count_value: '448', label: 'GRADUATES' },
                { icon_name: 'UserCheck', count_value: '224', label: 'CERTIFIED TEACHERS' },
                { icon_name: 'MapPin', count_value: '44', label: 'STUDENT CAMPUSES' },
                { icon_name: 'Users', count_value: '2815', label: 'STUDENTS' },
            ]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (slug) fetchStats();
  }, [slug]);

  const getIcon = (name) => {
      const props = { className: "h-10 w-10", style: { color: primaryColor } };
      switch(name) {
          case 'GraduationCap': return <GraduationCap {...props} />;
          case 'UserCheck': return <UserCheck {...props} />;
          case 'MapPin': return <MapPin {...props} />;
          case 'Users': return <Users {...props} />;
          default: return <Trophy {...props} />;
      }
  };

  return (
    <section className="py-16 bg-[#1e293b] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://demo.smart-school.in/uploads/gallery/media/pattern.png')] opacity-5"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="lg:w-1/3">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-1" style={{ backgroundColor: primaryColor }}></span>
              <span className="font-bold uppercase tracking-wider text-base" style={{ color: primaryColor }}>Our Success</span>
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Achievements & <br/>
              <span style={{ color: primaryColor }}>Recognitions</span>
            </h2>
            <p className="text-gray-400 mb-6 leading-relaxed text-lg">
              Our commitment to excellence has been recognized through various awards and achievements. We take pride in our students' success and our contribution to the field of education.
            </p>
            <div className="relative rounded-lg overflow-hidden group">
                <img 
                  src="https://demo.smart-school.in/uploads/gallery/media/achivement.jpg" 
                  alt="Graduation" 
                  className="rounded-lg shadow-2xl transform group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                  <p className="text-white font-bold text-lg">Class of 2024 Graduation Ceremony</p>
                </div>
            </div>
          </div>
          
          <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-8 border border-gray-700 bg-[#263345]/50 backdrop-blur-sm rounded-lg hover:bg-[#263345] transition-colors duration-300 group">
                <div className="mb-4 p-3 bg-[#1e293b] rounded-full group-hover:scale-110 transition-transform duration-300 shadow-lg border border-gray-700">
                  {getIcon(s.icon_name)}
                </div>
                <h3 className="text-5xl font-bold mb-1 text-white">{s.count_value}</h3>
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{s.label}</span>
                <div className="w-12 h-1 mt-4 rounded-full group-hover:w-20 transition-all duration-300" style={{ backgroundColor: primaryColor }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const StaffSection = ({ slug, primaryColor = DEFAULT_PRIMARY }) => {
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await publicCmsService.getTeam(slug);
        if (res.success && res.data.length > 0) setStaff(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (slug) fetchTeam();
  }, [slug]);

  if (!staff || staff.length === 0) return null;

  return (
    <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="w-8 h-1" style={{ backgroundColor: primaryColor }}></span>
          <span className="font-bold uppercase tracking-wider text-base" style={{ color: primaryColor }}>Our Team</span>
          <span className="w-8 h-1" style={{ backgroundColor: primaryColor }}></span>
        </div>
        <h2 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">Our Experienced Staff</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto text-lg">
          Our team of dedicated professionals is committed to providing the best educational experience for your children.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {staff.map((s, i) => (
            <div key={i} className="flex flex-col items-center group">
              <div className="relative w-48 h-48 mb-4">
                <div className="absolute inset-0 rounded-full transform translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-300" style={{ backgroundColor: primaryColor }}></div>
                <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-full border-4 border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300 z-10"
                     style={{ borderColor: primaryColor ? undefined : '' }}
                     onMouseEnter={(e) => e.currentTarget.style.borderColor = primaryColor}
                     onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
                >
                  <img src={s.image_url || getPlaceholder(200, 200, 'Staff')} alt={s.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                </div>
              </div>
              <h3 className="font-bold text-xl mb-1 text-gray-900 dark:text-white hover:opacity-80 transition-colors" style={{ color: 'inherit' }}>{s.name}</h3>
              <p className="text-sm font-medium uppercase tracking-wide" style={{ color: primaryColor }}>{s.role}</p>
              
              <div className="flex gap-4 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                {/* Social icons could go here */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TestimonialsSection = ({ slug, primaryColor = DEFAULT_PRIMARY }) => {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await publicCmsService.getTestimonials(slug);
        if (res.success && res.data.length > 0) setTestimonials(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (slug) fetchTestimonials();
  }, [slug]);

  if (!testimonials || testimonials.length === 0) return null;

  const active = testimonials[0];

  return (
    <section className="py-16 bg-[#1e293b] text-white text-center relative">
      <div className="absolute top-0 left-0 w-full h-2" style={{ background: `linear-gradient(to right, ${primaryColor}, #ffffff80, ${primaryColor})` }}></div>
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-10">
          <div className="inline-block p-3 bg-opacity-20 rounded-full mb-3" style={{ backgroundColor: `${primaryColor}33` }}>
            <Quote size={24} style={{ color: primaryColor }} />
          </div>
          <h2 className="text-4xl font-bold mb-3">What Parents Say</h2>
          <p className="text-gray-400 text-lg">We are proud of the trust parents place in us.</p>
        </div>

        <div className="bg-[#263345] p-8 rounded-2xl shadow-xl relative">
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#1e293b] shadow-lg">
                    <img src={active.image_url || getPlaceholder(100, 100, 'User')} alt="User" className="w-full h-full object-cover" />
                </div>
            </div>
            
            <div className="mt-10">
              <h3 className="font-bold text-xl mb-1">{active.name}</h3>
              <p className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: primaryColor }}>{active.role}</p>
              <p className="text-lg italic text-gray-300 leading-relaxed mb-6">
                "{active.content}"
              </p>
              
              <div className="flex justify-center gap-3">
                  {testimonials.map((_, i) => (
                      <button 
                        key={i} 
                        className={`w-2 h-2 rounded-full transition-all hover:scale-125`}
                        style={{ backgroundColor: i === 0 ? primaryColor : '#4b5563' }}
                      ></button>
                  ))}
              </div>
            </div>
        </div>
      </div>
    </section>
  );
};

const GallerySection = ({ galleries, slug, primaryColor = DEFAULT_PRIMARY }) => {
  if (!galleries || galleries.length === 0) return null;

  return (
    <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="w-8 h-1" style={{ backgroundColor: primaryColor }}></span>
            <span className="font-bold uppercase tracking-wider text-base" style={{ color: primaryColor }}>Campus Life</span>
            <span className="w-8 h-1" style={{ backgroundColor: primaryColor }}></span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Our Gallery</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {galleries.slice(0, 8).map((gallery) => (
            <Link key={gallery.id} to={`/${slug}/gallery/${gallery.id}`} className="group">
              <div className="relative h-64 overflow-hidden rounded-lg shadow-md">
                <img 
                  src={gallery.cover_image_url || getPlaceholder(400, 300, 'Gallery')} 
                  alt={gallery.title} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="text-center p-4">
                    <ImageIcon className="h-8 w-8 text-white mx-auto mb-2" />
                    <h3 className="text-white font-bold text-lg">{gallery.title}</h3>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="text-center mt-10">
          <Link to={`/${slug}/gallery`}>
            <Button variant="outline" className="text-base hover:bg-gray-50" style={{ color: primaryColor, borderColor: primaryColor }}>
              View All Gallery
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

const NewsSection = ({ news, slug, primaryColor = DEFAULT_PRIMARY }) => {
  if (!news || news.length === 0) return null;

  return (
    <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="w-8 h-1" style={{ backgroundColor: primaryColor }}></span>
            <span className="font-bold uppercase tracking-wider text-base" style={{ color: primaryColor }}>Latest Updates</span>
            <span className="w-8 h-1" style={{ backgroundColor: primaryColor }}></span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white">School News</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {news.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={item.image_url || getPlaceholder(400, 300, 'News')} 
                  alt={item.title} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
                />
                <div className="absolute top-3 left-3 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider" style={{ backgroundColor: primaryColor }}>
                  News
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <Calendar size={12} style={{ color: primaryColor }} />
                  {new Date(item.published_at).toLocaleDateString()}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 transition-colors line-clamp-2 hover:opacity-80">
                  <Link to={`/${slug}/news/${item.id}`} style={{ color: primaryColor }}>{item.title}</Link>
                </h3>
                <p className="text-gray-600 mb-3 line-clamp-3 text-base leading-relaxed">
                  {item.summary}
                </p>
                <Link 
                  to={`/${slug}/news/${item.id}`} 
                  className="inline-flex items-center font-semibold transition-colors text-sm uppercase tracking-wide hover:opacity-80"
                  style={{ color: primaryColor }}
                >
                  Read More <ChevronRight size={14} className="ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-10">
          <Link to={`/${slug}/news`}>
            <Button variant="outline" className="text-base hover:bg-gray-50" style={{ color: primaryColor, borderColor: primaryColor }}>
              View All News
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

const EventsSection = ({ events, slug, primaryColor = DEFAULT_PRIMARY }) => {
  if (!events || events.length === 0) return null;

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-1" style={{ backgroundColor: primaryColor }}></span>
              <span className="font-bold uppercase tracking-wider text-base" style={{ color: primaryColor }}>Calendar</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Upcoming Events</h2>
          </div>
          <Link to={`/${slug}/events`}>
            <Button className="bg-gray-900 hover:opacity-90 text-white dark:bg-gray-800 text-base">View All Events</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white dark:bg-gray-900 p-5 rounded-lg shadow-sm flex flex-col sm:flex-row gap-5 hover:shadow-lg transition-shadow duration-300 border-l-4" style={{ borderColor: primaryColor }}>
              <div className="sm:w-1/3 relative overflow-hidden rounded-lg h-40 sm:h-auto">
                <img 
                  src={event.image_url || getPlaceholder(300, 300, 'Event')} 
                  alt={event.title} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute top-2 left-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-1.5 rounded text-center min-w-[50px] shadow-sm">
                  <span className="block text-xl font-bold" style={{ color: primaryColor }}>{new Date(event.start_date).getDate()}</span>
                  <span className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase">{new Date(event.start_date).toLocaleString('default', { month: 'short' })}</span>
                </div>
              </div>
              <div className="sm:w-2/3 flex flex-col justify-center">
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide font-semibold">
                  <span className="flex items-center gap-1">
                    <Clock size={12} style={{ color: primaryColor }} />
                    {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} style={{ color: primaryColor }} />
                    {event.location || 'Campus'}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white hover:opacity-80 transition-colors">
                  <Link to={`/${slug}/events/${event.id}`}>{event.title}</Link>
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2 text-sm">
                  {event.description}
                </p>
                <Link 
                  to={`/${slug}/events/${event.id}`} 
                  className="text-sm font-bold hover:opacity-80 uppercase tracking-wider flex items-center gap-1"
                  style={{ color: primaryColor }}
                >
                  Event Details <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const SchoolPublicHome = () => {
  const schoolSlug = useSchoolSlug();
  const [settings, setSettings] = useState(null);
  const [school, setSchool] = useState(null);
  const [banners, setBanners] = useState([]);
  const [menus, setMenus] = useState([]);
  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [pages, setPages] = useState({});
  const [loading, setLoading] = useState(true);

  // Extract Theme
  const theme = settings?.theme || {};
  const primaryColor = theme.primary_color || DEFAULT_PRIMARY;
  
  // Inject global styles
  useEffect(() => {
    if (primaryColor) {
      document.documentElement.style.setProperty('--primary-color', primaryColor);
    }
  }, [primaryColor]);

  useEffect(() => {
    // Reduce text size by 10% (scale down root font size)
    const originalFontSize = document.documentElement.style.fontSize;
    document.documentElement.style.fontSize = '90%';
    
    return () => {
      document.documentElement.style.fontSize = originalFontSize;
    };
  }, []);

  // Force update favicon from settings
  useEffect(() => {
    if (settings?.favicon_url) {
      // Find existing favicon or create new one
      let link = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.favicon_url;
      // Also update apple-touch-icon if needed
      let appleLink = document.querySelector("link[rel='apple-touch-icon']");
      if (appleLink) appleLink.href = settings.favicon_url;
    }
  }, [settings?.favicon_url]);

  const [schoolStatus, setSchoolStatus] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch settings
        const settingsRes = await publicCmsService.getSchoolSettings(schoolSlug);
        if (settingsRes.success) {
          // Handle aggregated response from getPublicSite
          if (settingsRes.data.settings) {
            setSettings(settingsRes.data.settings);
            setBanners(settingsRes.data.banners || []);
            setMenus(settingsRes.data.menus || []);
            setNews(settingsRes.data.news || []);
            setEvents(settingsRes.data.events || []);
            
            // Check school status and set school data
            if (settingsRes.data.school) {
              setSchool(settingsRes.data.school);
              setSchoolStatus(settingsRes.data.school.status);
            }
            
            // Fetch galleries separately as they might not be in the initial bundle
            const galleryRes = await publicCmsService.getPublicGalleriesList(schoolSlug);
            if (galleryRes.success) {
                // Filter for sidebar_setting (Show on Home) if needed, or just show all
                // Based on user request "sidebar setting", we might want to filter.
                // But usually "sidebar" means sidebar widget. Let's show those with sidebar_setting=true on home?
                // Or just show recent ones. Let's show all for now, or maybe filter by sidebar_setting if that's the intent.
                // User said: "select Sidebar Setting to show/hide sidebar".
                // If I look at the code I wrote for AddEditGallery, sidebar_setting is a boolean.
                // Let's assume sidebar_setting=true means "Featured/Home".
                // But to be safe, I'll show all published ones, and maybe prioritize sidebar_setting ones if I were sorting.
                // For now, just set all.
                setGalleries(galleryRes.data || []);
            }
            
            // Fetch specific pages for sections
            // Note: getPublicSite might not return all pages, so we might need a separate call or update getPublicSite
            // For now, let's assume we need to fetch pages if they are not in the initial bundle
            if (settingsRes.data.settings.branch_id) {
               // We need a way to get pages by slug or all pages. 
               // publicCmsService.getPages is not defined in the snippet I saw earlier, but let's check if it exists or use getPublicPage
               // Actually, let's just fetch the two specific pages we need
               const [welcomeRes, aboutRes] = await Promise.all([
                 publicCmsService.getPublicPage(schoolSlug, 'home-welcome'),
                 publicCmsService.getPublicPage(schoolSlug, 'home-about')
               ]);
               
               const newPages = {};
               if (welcomeRes.success && welcomeRes.data.page) newPages['home-welcome'] = welcomeRes.data.page;
               if (aboutRes.success && aboutRes.data.page) newPages['home-about'] = aboutRes.data.page;
               setPages(newPages);
            }

          } else {
            setSettings(settingsRes.data);
            
            // Fetch banners if not included
            if (settingsRes.data.branch_id) {
               const bannersRes = await publicCmsService.getBanners(settingsRes.data.branch_id);
               if (bannersRes.success) setBanners(bannersRes.data);
            }
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [schoolSlug]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!settings) {
    return <div className="h-screen flex items-center justify-center">School not found</div>;
  }

  // Check if school is inactive or frontend is disabled in settings
  if (schoolStatus === 'Inactive' || (settings && settings.is_active === false)) {
    return <InactiveSchoolNotification settings={settings} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Helmet>
        <title>{settings.homepage_title || 'School Home'}</title>
        {settings.favicon_url && <link rel="icon" href={settings.favicon_url} />}
      </Helmet>

      <TopBar settings={settings} news={news} />
      <PublicHeader settings={settings} menus={menus} slug={schoolSlug} />

      <main className="flex-grow">
        <HeroSlider banners={banners} primaryColor={primaryColor} />
        <FeatureBar primaryColor={primaryColor} />
        
        {/* Welcome / About Section */}
        <AboutSection 
            content={pages['home-welcome']?.content_html || pages['home-welcome']?.content} 
            primaryColor={primaryColor} 
        />
        
        {/* Courses */}
        <CoursesSection slug={schoolSlug} primaryColor={primaryColor} />
        
        {/* Achievements */}
        <AchievementsSection slug={schoolSlug} primaryColor={primaryColor} />
        
        {/* Staff / Team */}
        <StaffSection slug={schoolSlug} primaryColor={primaryColor} />

        {/* News & Updates */}
        {news.length > 0 && (
           <NewsSection news={news} slug={schoolSlug} primaryColor={primaryColor} />
        )}
        
        {/* Events */}
        {events.length > 0 && (
           <EventsSection events={events} slug={schoolSlug} primaryColor={primaryColor} />
        )}

        {/* Gallery */}
        <GallerySection galleries={galleries} slug={schoolSlug} primaryColor={primaryColor} />
        
        {/* Testimonials */}
        <TestimonialsSection slug={schoolSlug} primaryColor={primaryColor} />
      </main>

      <PublicFooter settings={settings} school={school} />
    </div>
  );
};

export default SchoolPublicHome;
