import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchoolSlug } from '@/hooks/useSchoolSlug';
import publicCmsService from '@/services/publicCmsService';
import { supabase } from '@/lib/customSupabaseClient';
import { PublicHeader, PublicFooter, TopBar } from '@/components/public/PublicLayoutComponents';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  BookOpen, 
  FileSearch, 
  Award, 
  ArrowRight, 
  Sparkles,
  Users,
  School,
  Loader2,
  Star,
  Trophy,
  Target,
  TrendingUp,
  Zap,
  Globe
} from 'lucide-react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

const SchoolServicesHub = () => {
  const schoolAlias = useSchoolSlug();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);
  const [menus, setMenus] = useState([]);
  const [news, setNews] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalAdmissions: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [siteRes, newsRes] = await Promise.all([
          publicCmsService.getPublicSite(schoolAlias),
          publicCmsService.getPublicNewsList(schoolAlias)
        ]);

        if (siteRes.success) {
          setSchool(siteRes.data.school);
          setSiteSettings(siteRes.data.settings);
          setMenus(siteRes.data.menus || []);
          
          // Fetch some basic stats
          const branchId = siteRes.data.school.id;
          
          const [coursesRes, studentsRes] = await Promise.all([
            supabase.from('online_courses').select('id', { count: 'exact' }).eq('branch_id', branchId).eq('is_published', true),
            supabase.from('student_profiles').select('id', { count: 'exact' }).eq('branch_id', branchId).eq('is_active', true)
          ]);
          
          setStats({
            totalCourses: coursesRes.count || 0,
            totalStudents: studentsRes.count || 0,
            totalAdmissions: Math.floor((studentsRes.count || 0) * 0.15) // Simulated
          });
        }
        
        if (newsRes.success) {
          setNews(newsRes.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (schoolAlias) {
      fetchData();
    }
  }, [schoolAlias]);

  const services = [
    {
      id: 'online-course',
      title: 'Online Courses',
      description: 'Explore our comprehensive collection of online courses designed by expert educators. Learn at your own pace.',
      icon: BookOpen,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      features: ['Expert-led courses', 'Interactive content', 'Certificate on completion'],
      link: `/${schoolAlias}/online-course`,
      stats: `${stats.totalCourses}+ Courses`
    },
    {
      id: 'online-admission',
      title: 'Online Admission',
      description: 'Apply for admission online. Quick, paperless, and hassle-free application process for all classes.',
      icon: GraduationCap,
      color: 'from-emerald-500 to-green-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      features: ['Easy application', 'Document upload', 'Track status online'],
      link: `/${schoolAlias}/online-admission`,
      stats: 'Open for 2025-26'
    },
    {
      id: 'cbse-exam-result',
      title: 'CBSE Exam Results',
      description: 'Check your CBSE board examination results. View detailed subject-wise marks, grades, and CGPA.',
      icon: Award,
      color: 'from-purple-500 to-violet-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      features: ['Subject-wise marks', 'CGPA calculation', 'Print result card'],
      link: `/${schoolAlias}/cbse-exam-result`,
      stats: 'Results Available'
    },
    {
      id: 'exam-result',
      title: 'School Exam Results',
      description: 'View your internal examination results. Check marks, grades, and class performance analysis.',
      icon: FileSearch,
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      features: ['Multiple exams', 'Progress tracking', 'Performance analytics'],
      link: `/${schoolAlias}/exam-result`,
      stats: 'Unit Tests & Finals'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Helmet>
        <title>Services Hub | {school?.name || 'School'}</title>
      </Helmet>

      <TopBar settings={siteSettings} news={news} />
      <PublicHeader 
        settings={siteSettings} 
        menus={menus} 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen}
        slug={schoolAlias}
      />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30 px-4 py-1">
                <Sparkles className="h-4 w-4 mr-2 inline" />
                Welcome to {school?.name || 'Our School'}
              </Badge>
              
              <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                Your Gateway to
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> Excellence</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Access all our digital services in one place. From online courses to exam results, 
                everything you need is just a click away.
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center gap-8 mt-10">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4"
                >
                  <Users className="h-8 w-8 text-blue-400" />
                  <div className="text-left">
                    <p className="text-2xl font-bold text-white">{stats.totalStudents.toLocaleString()}+</p>
                    <p className="text-sm text-gray-400">Students</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4"
                >
                  <BookOpen className="h-8 w-8 text-emerald-400" />
                  <div className="text-left">
                    <p className="text-2xl font-bold text-white">{stats.totalCourses}+</p>
                    <p className="text-sm text-gray-400">Courses</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4"
                >
                  <Trophy className="h-8 w-8 text-amber-400" />
                  <div className="text-left">
                    <p className="text-2xl font-bold text-white">A+</p>
                    <p className="text-sm text-gray-400">Grade Rating</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="container mx-auto px-4 py-16 -mt-10 relative z-20">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 gap-8"
          >
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group">
                  <CardContent className="p-0">
                    {/* Top Colored Bar */}
                    <div className={`h-2 bg-gradient-to-r ${service.color}`}></div>
                    
                    <div className="p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className={`p-4 rounded-2xl ${service.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                          <service.icon className={`h-8 w-8 ${service.textColor}`} />
                        </div>
                        <Badge variant="outline" className={`${service.textColor} border-current`}>
                          {service.stats}
                        </Badge>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {service.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {service.description}
                      </p>
                      
                      {/* Features */}
                      <div className="space-y-2 mb-6">
                        {service.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-500">
                            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${service.color}`}></div>
                            {feature}
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        onClick={() => navigate(service.link)}
                        className={`w-full bg-gradient-to-r ${service.color} hover:opacity-90 text-white font-semibold py-6 rounded-xl group-hover:shadow-lg transition-all`}
                      >
                        Explore Now
                        <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Why Choose Us Section */}
        <section className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
              <Star className="h-4 w-4 mr-1" /> Why Choose Us
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900">World-Class Digital Experience</h2>
          </motion.div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: 'Lightning Fast', desc: 'Instant access to all services' },
              { icon: Target, title: 'User Friendly', desc: 'Simple and intuitive interface' },
              { icon: Globe, title: 'Always Available', desc: '24/7 access from anywhere' },
              { icon: TrendingUp, title: 'Real-time Updates', desc: 'Latest results & info' }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-4">
                  <item.icon className="h-7 w-7 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter settings={siteSettings} />
    </div>
  );
};

export default SchoolServicesHub;
