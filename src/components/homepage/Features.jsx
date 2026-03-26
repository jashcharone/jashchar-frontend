import React from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

const defaultFeatures = [
  { icon: 'Users', title: 'Student Management', description: 'Centralize student records, admissions, and profiles.' },
  { icon: 'BookOpen', title: 'Academic Management', description: 'Manage classes, subjects, and curriculum with ease.' },
  { icon: 'Calendar', title: 'Timetable Scheduling', description: 'Create and manage dynamic class schedules effortlessly.' },
  { icon: 'ClipboardCheck', title: 'Attendance Tracking', description: 'Automate attendance and generate insightful reports.' },
  { icon: 'Wallet', title: 'Fees Collection', description: 'Streamline fee payments, invoicing, and reminders.' },
  { icon: 'FileText', title: 'Exam & Result Management', description: 'Conduct exams and publish results with a few clicks.' },
  { icon: 'BarChart', title: 'Reports & Analytics', description: 'Gain deep insights with comprehensive data reports.' },
  { icon: 'Settings', title: 'Teacher Management', description: 'Manage teacher profiles, schedules, and assignments.' },
];

const FeatureCard = ({ icon, title, description, index }) => {
  const IconComponent = LucideIcons[icon] || LucideIcons.Star;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
      className="relative overflow-hidden bg-card border border-border backdrop-blur p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 via-primary/5 to-primary/5"></div>
      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
        <IconComponent className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-bold text-card-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
};

const Features = ({ content }) => {
  // STRICT MODE: No defaults.
  const items = Array.isArray(content) ? content : (content?.items || []);
  const title = !Array.isArray(content) ? content?.title : null;
  const subtitle = !Array.isArray(content) ? content?.subtitle : null;
  const tag = !Array.isArray(content) ? content?.tag : null;

  if (!items || items.length === 0) return null; 

  return (
    <section id="features" className="py-20 md:py-28 bg-background text-foreground">
      <div className="container mx-auto px-4">
        {(title || subtitle || tag) && (
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
            >
            {tag && <div className="inline-flex px-3 py-1 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-200/90">{tag}</div>}
            {title && <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mt-4">{title}</h2>}
            {subtitle && <p className="mt-4 text-lg text-slate-600 dark:text-slate-200/80 max-w-2xl mx-auto leading-relaxed">{subtitle}</p>}
            </motion.div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 group">
          {items.map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
