import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Menu, X, Sun, Moon, Activity, ExternalLink, ChevronDown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/customSupabaseClient';
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

import Hero from '@/components/homepage/Hero';
import Offerings from '@/components/homepage/Offerings';
import MobileApp from '@/components/homepage/MobileApp';
import Timeline from '@/components/homepage/Timeline';
import WhyUs from '@/components/homepage/WhyUs';
import Features from '@/components/homepage/Features';
import Panels from '@/components/homepage/Panels';
import Stats from '@/components/homepage/Stats';
import Clients from '@/components/homepage/Clients';
import Achievements from '@/components/homepage/Achievements';
import Testimonials from '@/components/homepage/Testimonials';
import Pricing from '@/components/homepage/Pricing';
import FAQ from '@/components/homepage/FAQ';
import Contact from '@/components/homepage/Contact';
import { HomepageHeader } from '@/components/homepage/Header';
import Footer from '@/components/homepage/Footer';
import { defaultCmsContent } from '@/config/defaultCmsContent';
import { Phone, Mail, Facebook, Instagram, Youtube, Linkedin, Twitter } from 'lucide-react';

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-background z-[100] flex items-center justify-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="text-center"
    >
      <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
        Jashchar ERP
      </h1>
    </motion.div>
  </div>
);



const Homepage = () => {
  // Capacitor native app: hostname is 'app.jashchar.local' (set in capacitor.config.ts)
  // Skip marketing homepage entirely — go straight to login
  if (typeof window !== 'undefined' && window.location.hostname === 'app.jashchar.local') {
    return <Navigate to="/login" replace />;
  }

  // OPTIMIZATION: Start with false to show default content immediately
  const [loading, setLoading] = useState(true);
  // Initialize with null so we don't show defaults
  const [cmsContent, setCmsContent] = useState(null);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
        try {
            console.log("Fetching Homepage data...");

            const fetchWithTimeout = (promise, timeoutMs) => {
              return Promise.race([
                promise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeoutMs))
              ]);
            };

            // Always use relative /api path - Vercel will proxy to backend
            const apiBase = '/api';
            console.log("Step 1: Fetching SaaS homepage from backend API...");

            let apiPayload = null;
            let usedFallback = false;

            try {
              const apiResponse = await fetchWithTimeout(
                  fetch(`${apiBase}/public/saas/homepage`),
                  10000 // 10 second timeout
              );

              if (apiResponse.ok) {
                apiPayload = await apiResponse.json();
              }
            } catch (apiErr) {
              console.warn("Backend API failed, using Supabase fallback:", apiErr.message);
              usedFallback = true;
            }

            // Fallback: Fetch directly from Supabase if backend API fails
            if (!apiPayload?.success && usedFallback) {
              console.log("Step 2: Fallback - Fetching from Supabase directly...");
              const [settingsResult, plansResult] = await Promise.all([
                supabase.from('saas_homepage_settings').select('*').limit(1).single(),
                supabase.from('saas_subscription_plans').select('*').eq('is_active', true).order('sort_order')
              ]);

              if (settingsResult.data) {
                apiPayload = {
                  success: true,
                  data: {
                    settings: settingsResult.data,
                    plans: plansResult.data || []
                  }
                };
                console.log("Supabase fallback successful");
              }
            }

            if (!apiPayload?.success) {
              console.warn("No homepage data available, using defaults");
              setCmsContent(defaultCmsContent);
              setPlans([]);
              setLoading(false);
              return;
            }

            const settings = apiPayload?.data?.settings;
            const plansData = apiPayload?.data?.plans;

            if (settings) {
              console.log("Homepage settings loaded via backend:", settings);
              const extra = settings.general_settings || {};

              // STRICT MODE: Use DB settings directly. Do not merge with defaultCmsContent values.
              // This ensures that what is in the DB is exactly what is shown.
              const mergedSettings = {
                ...settings,
                header: settings.header || {},
                hero: settings.hero || {},
                offerings: settings.offerings || extra.offerings,
                mobile_app: settings.mobile_app || extra.mobile_app,
                timeline: settings.timeline || extra.timeline,
                why_us: settings.why_us || extra.why_us,
                clients: settings.clients || extra.clients,
                achievements: settings.achievements || extra.achievements,
                testimonials: settings.testimonials || extra.testimonials,
                quick_cta_banner: settings.quick_cta_banner || extra.quick_cta_banner,
                quick_links: settings.quick_links || extra.quick_links,
                contact: settings.contact || extra.contact,
                stats: settings.stats || extra.stats,
                // Use DB section order if available, otherwise empty array
                section_order: settings.section_order || []
              };
              console.log("Merged Settings:", mergedSettings); // DEBUG LOG
              setCmsContent(mergedSettings);
            } else {
              console.warn("No settings found in API.");
              setCmsContent({});
            }

            setPlans(plansData || []);
            
        } catch (err) {
            console.error("Unexpected error fetching homepage data:", err);
            // Use default CMS content as fallback
            setCmsContent(defaultCmsContent);
            setPlans([]);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  // Default values to prevent crash if CMS content is missing specific keys
  const companyName = cmsContent?.header?.company_name;
  const title = cmsContent?.seo_settings?.meta_title || cmsContent?.hero?.title || companyName || '';
  const description = cmsContent?.seo_settings?.meta_description || cmsContent?.hero?.subtitle || '';
  const favicon = cmsContent?.general_settings?.favicon_url;

  const quickTags = cmsContent?.quick_links?.tags || [];

  if (loading) return <LoadingScreen />;
  if (error) return <div className="flex items-center justify-center h-screen text-red-500">Error loading homepage: {error}</div>;
  
  // If cmsContent is empty object, we still want to render the structure, just with empty data
  // But if it's null (initial state), we wait.
  if (cmsContent === null) return null; 

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        {favicon && <link rel="icon" type="image/png" href={favicon} />}
        {cmsContent?.seo_settings?.keywords && <meta name="keywords" content={cmsContent.seo_settings.keywords} />}
      </Helmet>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-[#0b1021] text-slate-900 dark:text-white relative overflow-hidden"
      >
        {/* World Best Visual Effects - Global Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
            {/* Dark Mode Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse dark:block hidden"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse dark:block hidden" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[150px] animate-pulse dark:block hidden" style={{ animationDelay: '2s' }}></div>

            {/* Light Mode Glows - More Vibrant */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-100/50 rounded-full blur-[100px] animate-pulse dark:hidden block"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-100/50 rounded-full blur-[100px] animate-pulse dark:hidden block" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="relative z-10">
            <HomepageHeader settings={cmsContent} isSticky={false} />
            <main>
              {(cmsContent?.section_order && cmsContent.section_order.length > 0 ? cmsContent.section_order : []).map(section => {
                if (section === 'hero') return <Hero key="hero" content={cmsContent?.hero} demoSettings={cmsContent} />;
                
                if (section === 'quick_cta_banner') {
                   if (cmsContent?.quick_cta_banner?.enabled === false) return null;
                   return (
                    <section key="quick_cta_banner" className="py-10 px-4">
                      <div className="container mx-auto">
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white px-6 py-10 md:px-10 shadow-[0_20px_80px_rgba(76,106,255,0.35)]">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_32%)]" />
                          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div className="space-y-2">
                              <p className="text-sm uppercase tracking-[0.2em] text-white/80">{cmsContent?.quick_cta_banner?.subheadline}</p>
                              <h3 className="text-2xl md:text-3xl font-semibold leading-tight">{cmsContent?.quick_cta_banner?.headline}</h3>
                              <p className="text-white/80">{cmsContent?.quick_cta_banner?.description}</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <Button size="lg" className="bg-white text-indigo-700 hover:bg-white/90">{cmsContent?.quick_cta_banner?.buttonText}</Button>
                              <Button size="lg" variant="outline" className="border-white/70 text-white hover:bg-white/10">{cmsContent?.quick_cta_banner?.secondaryButtonText}</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                   );
                }

                if (section === 'offerings') return <Offerings key="offerings" content={cmsContent?.offerings} />;
                if (section === 'features') return <Features key="features" content={cmsContent?.features} />;
                if (section === 'panels') return <Panels key="panels" content={cmsContent?.panels} />;
                if (section === 'stats') return <Stats key="stats" content={cmsContent?.stats} />;
                
                if (section === 'quick_links') {
                    if (cmsContent?.quick_links?.enabled === false) return null;
                    return (
                    <section key="quick_links" className="py-10 bg-slate-50 dark:bg-[#0b1224] px-4">
                      <div className="container mx-auto">
                        <div className="flex items-center gap-3 mb-4 text-slate-900 dark:text-white">
                          <span className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300/80">{cmsContent?.quick_links?.title}</span>
                          <div className="h-px flex-1 bg-gradient-to-r from-primary/60 via-indigo-500/30 to-transparent"></div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {(cmsContent?.quick_links?.tags || quickTags).map((tag) => (
                            <span key={tag} className="px-4 py-2 rounded-full bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 text-sm text-slate-600 dark:text-slate-200 hover:border-primary/60 hover:shadow-[0_0_30px_rgba(93,135,255,0.25)] transition-all">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </section>
                    );
                }

                if (section === 'mobile_app') return <MobileApp key="mobile_app" content={cmsContent?.mobile_app} />;
                if (section === 'timeline') return <Timeline key="timeline" content={cmsContent?.timeline} />;
                if (section === 'why_us') return <WhyUs key="why_us" content={cmsContent?.why_us} />;
                if (section === 'clients') return <Clients key="clients" content={cmsContent?.clients} />;
                if (section === 'achievements') return <Achievements key="achievements" content={cmsContent?.achievements} />;
                if (section === 'testimonials') return <Testimonials key="testimonials" content={cmsContent?.testimonials} />;
                if (section === 'pricing') return <Pricing key="pricing" content={cmsContent?.pricing} plans={plans} />;
                if (section === 'faq') return <FAQ key="faq" content={cmsContent?.faq} />;
                if (section === 'contact') return <Contact key="contact" content={cmsContent?.contact} />;
                return null;
              })}
            </main>
            <Footer content={cmsContent?.footer} contact={cmsContent?.contact} header={cmsContent?.header} />
        </div>
      </motion.div>
    </>
  );
};

export default Homepage;
