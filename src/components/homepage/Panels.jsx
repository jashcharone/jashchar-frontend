import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const Panels = ({ content }) => {
  // STRICT MODE: No defaults.
  // Handle if content is array (old style) or object (new style)
  const items = Array.isArray(content) ? content : (content?.items || []);
  const title = !Array.isArray(content) ? content?.title : null;
  const subtitle = !Array.isArray(content) ? content?.subtitle : null;
  const tag = !Array.isArray(content) ? content?.tag : null;

  if (!items || items.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-slate-50 dark:bg-[#0b0f1c] text-slate-900 dark:text-white">
      <div className="container mx-auto px-4">
        {(title || subtitle || tag) && (
            <div className="text-center mb-14">
            {tag && <div className="inline-flex px-3 py-1 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-200/90">{tag}</div>}
            {title && <h2 className="text-3xl md:text-4xl font-extrabold mt-4 text-slate-900 dark:text-white">{title}</h2>}
            {subtitle && <p className="mt-4 text-lg text-slate-600 dark:text-slate-200/80 max-w-2xl mx-auto leading-relaxed">{subtitle}</p>}
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((panel, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur shadow-lg dark:shadow-[0_18px_70px_rgba(0,0,0,0.35)] hover:shadow-xl dark:hover:shadow-[0_20px_90px_rgba(93,135,255,0.35)] hover:-translate-y-1.5 transition-all duration-300"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 via-indigo-500/5 to-cyan-400/5 dark:from-primary/20 dark:via-indigo-500/10 dark:to-cyan-400/20"></div>
              {panel.image && (
                <div className="relative h-44 w-full overflow-hidden">
                  <img src={panel.image} alt={panel.title} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="relative p-6 space-y-3">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{panel.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-200/80 leading-relaxed">{panel.description}</p>
                <div className="inline-flex items-center gap-2 text-cyan-600 dark:text-cyan-200 text-sm font-medium">
                  View workspace <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Panels;
