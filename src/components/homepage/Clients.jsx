import React from 'react';
import { motion } from 'framer-motion';

const Clients = ({ content }) => {
  if (!content || content.enabled === false) return null;

  // Support both 'items' and 'logos' array names
  const clients = content.items || content.logos || [];

  if (clients.length === 0) return null;

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
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
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-start">
          {clients.map((client, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center group"
            >
              <div className="h-24 w-full flex items-center justify-center mb-5 relative">
                {/* Glow effect behind logo */}
                <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-75" />
                
                {client.logo ? (
                  <img 
                    src={client.logo} 
                    alt={client.name} 
                    className="relative h-full w-auto object-contain transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]" 
                  />
                ) : (
                  <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-xs text-muted-foreground relative z-10">
                    No Logo
                  </div>
                )}
              </div>
              
              <h5 className="text-base font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 group-hover:from-blue-600 group-hover:to-purple-600 bg-clip-text text-transparent transition-all duration-300 leading-tight mb-2">
                {client.name}
              </h5>
              
              {client.branches && (
                <span className="text-sm font-bold bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                  {client.branches}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Clients;
