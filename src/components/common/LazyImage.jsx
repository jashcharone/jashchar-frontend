import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Image as ImageIcon } from 'lucide-react';

const LazyImage = ({ src, alt, className, aspectRatio = 'aspect-video', placeholderClassName }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' } // Load slightly before valid
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => setIsLoaded(true);
  const handleError = () => {
    setError(true);
    setIsLoaded(true);
  };

  return (
    <div 
      ref={imgRef} 
      className={cn("relative overflow-hidden bg-muted/20", aspectRatio, className)}
    >
      {(!isLoaded && !error) && (
        <div className={cn("absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-300", placeholderClassName)}>
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400">
          <ImageIcon className="h-8 w-8" />
        </div>
      ) : (
        isInView && (
          <img
            src={src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-500",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
          />
        )
      )}
    </div>
  );
};

export default React.memo(LazyImage);
