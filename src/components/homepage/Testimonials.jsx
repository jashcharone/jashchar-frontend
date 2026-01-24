import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const Testimonials = ({ content }) => {
  if (!content || content.enabled === false) return null;

  // STRICT MODE: No defaults.
  const testimonials = content.items || [];

  if (testimonials.length === 0) return null;

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
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

        <Carousel className="w-full max-w-6xl mx-auto">
          <CarouselContent className="-ml-4">
            {testimonials.map((item, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 pl-4 pt-16 pb-16">
                <div className="bg-background border border-border p-8 pt-20 rounded-2xl h-full flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 relative group mt-4">
                  
                  {/* Large Floating Avatar */}
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2">
                    <div className="h-32 w-32 rounded-full p-1 bg-background border-2 border-primary/10 shadow-lg group-hover:scale-105 transition-transform duration-300 relative">
                        {item.image ? (
                            <img src={item.image} alt={item.name || item.author} className="h-full w-full rounded-full object-cover" />
                        ) : (
                            <div className="h-full w-full rounded-full flex items-center justify-center bg-primary/5 text-primary text-3xl font-bold">
                                {(item.name || item.author || 'A').charAt(0)}
                            </div>
                        )}
                        
                        {/* Source Badge (Google/Facebook) */}
                        {(item.source === 'google' || item.source === 'Google') && (
                            <div className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-slate-100 z-20 flex items-center justify-center">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="h-6 w-6" />
                            </div>
                        )}
                        {(item.source === 'facebook' || item.source === 'Facebook') && (
                            <div className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-slate-100 z-20 flex items-center justify-center">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" alt="Facebook" className="h-6 w-6" />
                            </div>
                        )}
                    </div>
                  </div>

                  <div className="text-center mb-6">
                      <h4 className="text-lg font-bold text-foreground">{item.name || item.author}</h4>
                      <p className="text-sm text-primary font-medium">{item.title || item.role}</p>
                  </div>

                  <div className="relative flex-grow">
                    <p className="text-base text-muted-foreground italic leading-relaxed text-center">
                        "{item.text || item.quote}"
                    </p>
                  </div>
                  
                  <div className="mt-6 flex justify-center gap-1">
                      {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-4 h-4 ${i < (item.rating || 5) ? 'text-yellow-400 fill-current' : 'text-slate-300 fill-current'}`} viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                      ))}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12" />
          <CarouselNext className="hidden md:flex -right-12" />
        </Carousel>
      </div>
    </section>
  );
};

export default Testimonials;
