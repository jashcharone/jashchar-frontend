import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';

const HeroCarousel = ({ banners, settings }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    
    // Auto-play functionality
    const autoplay = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, 5000); // 5 seconds per slide

    return () => {
      emblaApi.off('select', onSelect);
      clearInterval(autoplay);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  if (!banners || banners.length === 0) {
    // Fallback to static hero if no banners
    const heroStyle = {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${settings?.hero_images?.[0] || 'https://source.unsplash.com/random/1600x900/?school,education'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };
    return (
        <section style={heroStyle} className="h-[70vh] flex items-center justify-center text-white text-center relative">
            <div className="max-w-3xl px-4">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">{settings?.cms_title}</h1>
                <p className="mt-4 text-lg md:text-xl">{settings?.hero?.description || 'Welcome to our school'}</p>
                <div className="mt-8 flex justify-center gap-4">
                    <Button className="school-primary-btn text-white">View Services</Button>
                    <Button variant="outline" className="text-white border-white hover:bg-white/20">Learn More</Button>
                </div>
            </div>
        </section>
    );
  }

  return (
    <div className="relative h-[70vh] overflow-hidden group">
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {banners.map((banner, index) => (
            <div className="flex-[0_0_100%] min-w-0 relative h-full" key={banner.id || index}>
              {/* Background Media */}
              <div className="absolute inset-0 w-full h-full">
                {banner.banner_type === 'video' ? (
                  <video 
                    src={banner.video_url} 
                    className="w-full h-full object-cover" 
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                  />
                ) : (
                  <img 
                    src={banner.image_url} 
                    alt={banner.title} 
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40" />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex items-center justify-center text-center text-white px-4">
                <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4 drop-shadow-lg">
                    {banner.title || settings?.cms_title}
                  </h1>
                  {banner.subtitle && (
                    <p className="text-lg md:text-2xl mb-8 drop-shadow-md max-w-2xl mx-auto">
                      {banner.subtitle}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap justify-center gap-4">
                    {banner.button_text && (
                      <Button 
                        className="school-primary-btn text-white text-lg px-8 py-6"
                        onClick={() => banner.link_url && (window.location.href = banner.link_url)}
                      >
                        {banner.button_text}
                      </Button>
                    )}
                    {banner.banner_type === 'popup' && (
                      <Button 
                        variant="outline" 
                        className="text-white border-white hover:bg-white/20 text-lg px-8 py-6 gap-2"
                        onClick={() => window.open(banner.video_url, '_blank')}
                      >
                        <PlayCircle className="w-6 h-6" /> Watch Video
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-black/20 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={scrollPrev}
      >
        <ChevronLeft className="h-10 w-10" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-black/20 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={scrollNext}
      >
        <ChevronRight className="h-10 w-10" />
      </Button>

      {/* Dots */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all ${
              index === selectedIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'
            }`}
            onClick={() => emblaApi && emblaApi.scrollTo(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
