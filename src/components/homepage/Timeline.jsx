import React from 'react';
import { motion } from 'framer-motion';

const Timeline = ({ content }) => {
  if (!content || content.enabled === false) return null;

  // STRICT MODE: No defaults.
  const steps = content.items || [];

  if (steps.length === 0) return null;

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
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

        <div className="relative">
          {/* Line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-border -translate-y-1/2 hidden md:block">
             <div className="absolute top-0 left-0 h-full bg-primary/30 w-full blur-sm"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.1, y: -10 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center group cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-background border-4 border-primary flex items-center justify-center font-bold text-primary shadow-lg mb-4 z-20 group-hover:shadow-primary/50 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  {step.year}
                </div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Timeline;
