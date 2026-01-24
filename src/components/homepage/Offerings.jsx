import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BookOpen, Users, IndianRupee, Briefcase, Smartphone, UserCheck, Bus, GraduationCap, Video, FileText, ClipboardList, CheckSquare, Layout, Edit, Search, Monitor, Barcode, QrCode, MessageCircle, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

// Map string icon names to Lucide components
const iconMap = {
  BookOpen, Users, IndianRupee, DollarSign: IndianRupee, Briefcase, Smartphone, UserCheck, Bus, GraduationCap, 
  Video, FileText, ClipboardList, CheckSquare, Layout, Edit, Search, Monitor, 
  Barcode, QrCode, MessageCircle, Mic, Settings: Briefcase
};

const Offerings = ({ content }) => {
  if (!content || content.enabled === false) return null;

  // Handle both old (flat items) and new (categories) structure
  const categories = content.categories || [
    { id: 'default', label: 'All Offerings', items: content.items || [] }
  ];

  const [activeTab, setActiveTab] = useState(categories[0]?.id);

  const activeCategory = categories.find(c => c.id === activeTab) || categories[0];
  const activeItems = activeCategory?.items || [];

  return (
    <section className="py-20 md:py-28 bg-muted/30 text-foreground relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,hsl(var(--primary)/0.05),transparent_35%),radial-gradient(circle_at_90%_0%,hsl(var(--primary)/0.05),transparent_32%)] dark:hidden"></div>
         <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(circle_at_10%_10%,hsl(var(--primary)/0.12),transparent_35%),radial-gradient(circle_at_90%_0%,hsl(var(--primary)/0.12),transparent_32%)]"></div>
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-10">
          {content.title && (
            <h2 className="text-3xl md:text-4xl font-extrabold mt-4 mb-3 text-foreground">
                {content.title}
            </h2>
          )}
          {content.subtitle && (
            <p className="text-lg text-muted-foreground leading-relaxed">
                {content.subtitle}
            </p>
          )}
        </div>

        {/* Tabs */}
        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 border",
                  activeTab === cat.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25"
                    : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-400"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {activeItems.map((item, index) => {
                // Resolve Icon
                let IconComponent = BookOpen;
                if (item.icon && iconMap[item.icon]) {
                    IconComponent = iconMap[item.icon];
                } else if (typeof item.icon === 'object') {
                    IconComponent = item.icon; // Fallback if it's already a component
                }

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-white/5 backdrop-blur border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all group flex flex-col h-full"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center shrink-0",
                        "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      )}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{item.title}</h3>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 flex-grow">
                      {item.description}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5">
                      <a href={item.link || "#"} className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors gap-1 group-hover:gap-2">
                        Read More <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default Offerings;
