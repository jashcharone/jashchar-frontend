import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';

const MobileApp = ({ content }) => {
  if (!content || content.enabled === false) return null;

  return (
    <section className="py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            animate={{ y: [0, -15, 0] }}
            transition={{ 
              opacity: { duration: 0.6 },
              x: { duration: 0.6 },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" } 
            }}
            viewport={{ once: true }}
            className="lg:w-1/2 relative"
          >
            <div className="relative z-10">
                {content.image ? (
                    <img 
                        src={content.image} 
                        alt="Mobile App Interface" 
                        className="w-full max-w-md mx-auto"
                    />
                ) : (
                    <div className="w-full max-w-md mx-auto aspect-[9/19] bg-slate-100 rounded-[2.5rem] border-8 border-slate-900 flex items-center justify-center shadow-[0_0_50px_-10px_rgba(var(--primary),0.4)]">
                        <Smartphone className="h-24 w-24 text-slate-300" />
                    </div>
                )}
            </div>
            {/* Decorative elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[100%] bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:w-1/2 text-center lg:text-left"
          >
            <h4 className="text-primary font-semibold tracking-wide uppercase mb-2">
                {content.tagline}
            </h4>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
              {content.title}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {content.description}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              {content.playStoreLink && (
                <a href={content.playStoreLink} className="hover:opacity-80 transition-opacity">
                    <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                        alt="Get it on Google Play" 
                        className="h-14"
                    />
                </a>
              )}
              {content.appStoreLink && (
                <a href={content.appStoreLink} className="hover:opacity-80 transition-opacity">
                    <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                        alt="Download on the App Store" 
                        className="h-14"
                    />
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MobileApp;
