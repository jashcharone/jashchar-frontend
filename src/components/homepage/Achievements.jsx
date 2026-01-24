import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Star, Lightbulb, Medal } from 'lucide-react';

// Icon mapping
const iconMap = {
  Trophy, Award, Star, Lightbulb, Medal
};

const Achievements = ({ content }) => {
  if (!content || content.enabled === false) return null;

  const items = content.items || [];

  // If we have items, show grid layout
  if (items.length > 0) {
    return (
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {items.map((item, index) => {
              const Icon = typeof item.icon === 'string' ? (iconMap[item.icon] || Trophy) : Trophy;
              const bgColors = ['bg-yellow-50', 'bg-blue-50', 'bg-green-50', 'bg-purple-50'];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`${bgColors[index % 4]} dark:bg-slate-800 rounded-xl p-6 text-center hover:shadow-lg transition-shadow`}
                >
                  <div className="text-4xl mb-4 flex justify-center">
                    <Icon className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.organization}</p>
                  {item.year && <p className="text-xs text-primary font-medium mt-1">{item.year}</p>}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Fallback to original image-based layout
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:w-1/2"
          >
            {content.tagline && (
                <h4 className="text-primary font-semibold tracking-wide uppercase mb-2">
                    {content.tagline}
                </h4>
            )}
            {content.title && (
                <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground leading-tight">
                {content.title}
                </h2>
            )}
            {content.description && (
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {content.description}
                </p>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:w-1/2 flex justify-center"
          >
             {content.image ? (
                <img 
                    src={content.image} 
                    alt="Awards" 
                    className="w-full max-w-lg rounded-xl shadow-2xl"
                />
             ) : (
                <div className="w-full max-w-lg aspect-video bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300">
                    <div className="text-center text-slate-400">
                        <Trophy className="h-16 w-16 mx-auto mb-2" />
                        <span>Achievement Image</span>
                    </div>
                </div>
             )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Achievements;
