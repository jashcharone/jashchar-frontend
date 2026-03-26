import React from 'react';
import { motion } from 'framer-motion';
import { HomepageHeader } from '@/components/homepage/Header';
import Hero from '@/components/homepage/Hero';
import Offerings from '@/components/homepage/Offerings';
import MobileApp from '@/components/homepage/MobileApp';
import Timeline from '@/components/homepage/Timeline';
import WhyUs from '@/components/homepage/WhyUs';
import Features from '@/components/homepage/Features';
import Panels from '@/components/homepage/Panels';
import Clients from '@/components/homepage/Clients';
import Achievements from '@/components/homepage/Achievements';
import Testimonials from '@/components/homepage/Testimonials';
import Pricing from '@/components/homepage/Pricing';
import FAQ from '@/components/homepage/FAQ';
import Contact from '@/components/homepage/Contact';
import Stats from '@/components/homepage/Stats';
import Footer from '@/components/homepage/Footer';
import { Button } from '@/components/ui/button';

export const SaaSCmsPreview = ({ settings, activePlans = [], viewMode = 'desktop' }) => {
  if (!settings) return <div className="p-4 text-center">Loading preview...</div>;

  const containerClass = viewMode === 'mobile' 
    ? 'w-[375px] min-h-[667px] border-x border-b shadow-2xl mx-auto bg-white overflow-y-auto overflow-x-hidden h-[800px]' 
    : 'w-full min-h-screen bg-white overflow-y-auto';

  // Hardcoded sections from Homepage.jsx to match the exact look
  const QuickCTABanner = () => {
    if (settings.quick_cta_banner?.enabled === false) return null;
    return (
    <section className="py-10 px-4">
      <div className="container mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white px-6 py-10 md:px-10 shadow-[0_20px_80px_rgba(76,106,255,0.35)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_32%)]" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-white/80">{settings.quick_cta_banner?.subheadline || 'Enterprise-ready'}</p>
              <h3 className="text-2xl md:text-3xl font-semibold leading-tight">{settings.quick_cta_banner?.headline || 'Start your school digitally with Jashchar ERP'}</h3>
              <p className="text-white/80">{settings.quick_cta_banner?.description || 'Launch in days, not months. Secure, scalable, and tailored for every board.'}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-white/90">{settings.quick_cta_banner?.buttonText || 'Request Demo'}</Button>
              <Button size="lg" variant="outline" className="border-white/70 text-white hover:bg-white/10">{settings.quick_cta_banner?.secondaryButtonText || 'See Live Sandbox'}</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
    );
  };

  const QuickTags = () => {
    if (settings.quick_links?.enabled === false) return null;
    const quickTags = settings.quick_links?.tags || [
        'CBSE', 'ICSE', 'State Boards', 'NEP-ready', 'Multi-branch', 'AI Insights', 'Transport', 'Fees', 'Admissions', 'Front CMS', 'Mobile Apps'
    ];
    return (
        <section className="py-10 bg-slate-50 dark:bg-[#0b1224] px-4">
            <div className="container mx-auto">
            <div className="flex items-center gap-3 mb-4 text-slate-900 dark:text-white">
                <span className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300/80">{settings.quick_links?.title || 'Fast links'}</span>
                <div className="h-px flex-1 bg-gradient-to-r from-primary/60 via-indigo-500/30 to-transparent"></div>
            </div>
            <div className="flex flex-wrap gap-3">
                {quickTags.map((tag) => (
                <span key={tag} className="px-4 py-2 rounded-full bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 text-sm text-slate-600 dark:text-slate-200 hover:border-primary/60 hover:shadow-[0_0_30px_rgba(93,135,255,0.25)] transition-all">
                    {tag}
                </span>
                ))}
            </div>
            </div>
        </section>
    );
  };

  return (
    <div className={containerClass}>
        <div className="bg-white dark:bg-[#0b1021] text-slate-900 dark:text-white relative overflow-hidden">
             {/* Global Background from Homepage */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse dark:block hidden"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse dark:block hidden" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[150px] animate-pulse dark:block hidden" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-100/50 rounded-full blur-[100px] animate-pulse dark:hidden block"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-100/50 rounded-full blur-[100px] animate-pulse dark:hidden block" style={{ animationDelay: '1.5s' }}></div>
            </div>

            <div className="relative z-10">
                <HomepageHeader settings={settings} isSticky={false} />
                <main>
                    {/* Render sections based on section_order */}
                    {(settings.section_order || []).map(section => {
                        if (section === 'hero') return <Hero key="hero" content={settings.hero} demoSettings={settings} />;
                        if (section === 'quick_cta_banner') return <QuickCTABanner key="quick_cta_banner" />;
                        if (section === 'offerings') return <Offerings key="offerings" content={settings.offerings} />;
                        if (section === 'features') return <Features key="features" content={settings.features} />;
                        if (section === 'panels') return <Panels key="panels" content={settings.panels} />;
                        if (section === 'stats') return <Stats key="stats" content={settings.stats} />;
                        if (section === 'quick_links') return <QuickTags key="quick_links" />;
                        if (section === 'mobile_app') return <MobileApp key="mobile_app" content={settings.mobile_app} />;
                        if (section === 'timeline') return <Timeline key="timeline" content={settings.timeline} />;
                        if (section === 'why_us') return <WhyUs key="why_us" content={settings.why_us} />;
                        if (section === 'clients') return <Clients key="clients" content={settings.clients} />;
                        if (section === 'achievements') return <Achievements key="achievements" content={settings.achievements} />;
                        if (section === 'testimonials') return <Testimonials key="testimonials" content={settings.testimonials} />;
                        if (section === 'pricing') return <Pricing key="pricing" content={settings.pricing} plans={activePlans} />;
                        if (section === 'faq') return <FAQ key="faq" content={settings.faq} />;
                        if (section === 'contact') return <Contact key="contact" content={settings.contact} />;
                        if (section === 'cta') return null; // CTA is usually handled differently or merged, skipping for now if not explicit component
                        return null;
                    })}
                </main>
                <Footer content={settings.footer} contact={settings.contact} header={settings.header} />
            </div>
        </div>
    </div>
  );
};
