import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { HomepageHeader } from '@/components/homepage/Header';
import Footer from '@/components/homepage/Footer';
import { defaultCmsContent } from '@/config/defaultCmsContent';
import { Button } from '@/components/ui/button';
import { Smartphone, CheckCircle, Download, Star, Shield, Zap, Bell, Calendar, BookOpen } from 'lucide-react';

const SchoolMobileApp = () => {
  const [cmsContent, setCmsContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const fetchWithTimeout = (promise, timeoutMs) => {
              return Promise.race([
                promise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeoutMs))
              ]);
            };

            const apiBase = '/api'; 
            const apiResponse = await fetchWithTimeout(
                fetch(`${apiBase}/public/saas/homepage`),
                15000
            );

            if (!apiResponse.ok) throw new Error(`API returned ${apiResponse.status}`);

            const apiPayload = await apiResponse.json();
            const settings = apiPayload?.data?.settings;

            if (settings) {
              const extra = settings.general_settings || {};
              const mergedSettings = {
                ...defaultCmsContent,
                ...settings,
                header: { ...defaultCmsContent.header, ...settings.header },
                footer: { ...defaultCmsContent.footer, ...settings.footer },
                contact: { ...defaultCmsContent.contact, ...settings.contact },
              };
              setCmsContent(mergedSettings);
            } else {
              setCmsContent(defaultCmsContent);
            }
        } catch (err) {
            console.error("Error fetching CMS data:", err);
            setCmsContent(defaultCmsContent);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const features = [
    {
      icon: <Bell className="h-6 w-6 text-blue-500" />,
      title: "Instant Notifications",
      description: "Get real-time updates on homework, attendance, and circulars directly on your phone."
    },
    {
      icon: <Calendar className="h-6 w-6 text-green-500" />,
      title: "Academic Calendar",
      description: "Keep track of exams, holidays, and events with the integrated school calendar."
    },
    {
      icon: <BookOpen className="h-6 w-6 text-purple-500" />,
      title: "Homework & Assignments",
      description: "View and submit homework assignments with ease. Never miss a deadline."
    },
    {
      icon: <Shield className="h-6 w-6 text-red-500" />,
      title: "Secure Data",
      description: "Your data is encrypted and secure. Only authorized users can access student information."
    },
    {
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
      title: "Fast & Responsive",
      description: "Optimized for performance, ensuring a smooth experience on all devices."
    },
    {
      icon: <Star className="h-6 w-6 text-orange-500" />,
      title: "Exam Results",
      description: "Check exam results and performance analysis reports instantly."
    }
  ];

  return (
    <>
      <Helmet>
        <title>School Mobile App - {cmsContent?.header?.company_name || 'Jashchar ERP'}</title>
        <meta name="description" content="Download our official school mobile app for parents, students, and teachers. Stay connected with your school." />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <HomepageHeader settings={cmsContent} />

        <main className="flex-grow">
          {/* Hero Section */}
          <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
            <div className="container mx-auto px-4">
              <div className="flex flex-col lg:flex-row items-center gap-12">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="lg:w-1/2 text-center lg:text-left"
                >
                  <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                    Your School in <span className="text-primary">Your Pocket</span>
                  </h1>
                  <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                    Stay connected with your school anytime, anywhere. The official mobile app for parents, students, and teachers to manage academics, communication, and more.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Button size="lg" className="gap-2 h-14 px-8 text-lg">
                      <Download className="h-5 w-5" />
                      Download for Android
                    </Button>
                    <Button size="lg" variant="outline" className="gap-2 h-14 px-8 text-lg">
                      <Smartphone className="h-5 w-5" />
                      Download for iOS
                    </Button>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="lg:w-1/2 relative"
                >
                  <div className="relative z-10 mx-auto max-w-[300px]">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full transform translate-y-10"></div>
                    <img 
                      src="https://placehold.co/300x600/png?text=App+Preview" 
                      alt="Mobile App Preview" 
                      className="relative rounded-[2.5rem] border-[8px] border-slate-900 shadow-2xl"
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
                <p className="text-muted-foreground text-lg">
                  Everything you need to manage your school life efficiently, all in one place.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow"
                  >
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 bg-primary text-primary-foreground">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to get started?</h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Download the app today and experience the future of school management.
              </p>
              <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-semibold">
                Get the App Now
              </Button>
            </div>
          </section>
        </main>

        <Footer content={cmsContent?.footer} contact={cmsContent?.contact} header={cmsContent?.header} />
      </div>
    </>
  );
};

export default SchoolMobileApp;
