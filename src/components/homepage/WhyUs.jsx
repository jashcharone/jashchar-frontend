import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Headphones, Zap, Globe, Layout, MessageSquare, IndianRupee, RefreshCw, Award, Star, Trophy, Lightbulb, Check, Heart } from 'lucide-react';

// Icon name to component mapping
const iconMap = {
  Shield, Headphones, Zap, Globe, Layout, MessageSquare, IndianRupee, RefreshCw, Award, Star, Trophy, Lightbulb, Check, Heart,
  HeadsetIcon: Headphones
};

const WhyUs = ({ content }) => {
  if (!content || content.enabled === false) return null;

  // STRICT MODE: No defaults.
  const features = content.items || [];

  if (features.length === 0) return null;

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          {content.tagline && (
            <h4 className="text-primary font-semibold tracking-wide uppercase mb-2">
                {content.tagline}
            </h4>
          )}
          {content.title && (
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                {content.title}
            </h2>
          )}
          {content.subtitle && (
            <p className="text-lg text-muted-foreground">
                {content.subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {features.map((item, index) => {
            // Support both string icon names and component references
            const Icon = typeof item.icon === 'string' ? (iconMap[item.icon] || Layout) : (item.icon || Layout);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm group-hover:shadow-md">
                  <Icon className="h-8 w-8 text-slate-600 dark:text-slate-300 group-hover:text-white" />
                </div>
                <h3 className="font-medium text-lg mb-2">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyUs;
