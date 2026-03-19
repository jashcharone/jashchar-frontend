import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ExternalLink, ShieldCheck, Sparkles, Play, Pause, Volume2, VolumeX } from 'lucide-react';

// Helper function to extract video ID from various URL formats
const getVideoEmbedUrl = (url, autoplay = true, muted = true, loop = true) => {
  if (!url) return null;
  
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(new URL(url).search);
      videoId = urlParams.get('v');
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1]?.split('?')[0];
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=${muted ? 1 : 0}&loop=${loop ? 1 : 0}&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`;
    }
  }
  
  // Vimeo
  if (url.includes('vimeo.com')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    if (videoId) {
      return `https://player.vimeo.com/video/${videoId}?autoplay=${autoplay ? 1 : 0}&muted=${muted ? 1 : 0}&loop=${loop ? 1 : 0}&background=1`;
    }
  }
  
  // Direct video URL (mp4, webm, etc.)
  return null;
};

const Hero = ({ content, demoSettings }) => {
  // STRICT MODE: No hardcoded defaults. If DB is empty, show empty.
  const title = content?.title;
  const subtitle = content?.subtitle;
  const ctaText = content?.ctaText;
  const ctaLink = content?.ctaLink;
  
  // Image Slider Logic
  // If no images provided in DB, use empty array (or handle gracefully in UI)
  const heroImages = content?.image 
    ? (content.image.includes(',') ? content.image.split(',').map(s => s.trim()) : [content.image])
    : [];

  // Video settings
  const videoEnabled = content?.video_enabled === true;
  const videoUrl = content?.video_url;
  const videoAutoplay = content?.video_autoplay !== false;
  const videoMuted = content?.video_muted !== false;
  const videoLoop = content?.video_loop !== false;
  const videoControls = content?.video_controls === true;
  
  // Check if it's a direct video file (including Supabase storage URLs)
  const isDirectVideo = videoUrl && (
    videoUrl.endsWith('.mp4') || 
    videoUrl.endsWith('.webm') || 
    videoUrl.endsWith('.ogg') ||
    videoUrl.includes('supabase') ||
    (!videoUrl.includes('youtube') && !videoUrl.includes('youtu.be') && !videoUrl.includes('vimeo'))
  );
  const embedUrl = !isDirectVideo ? getVideoEmbedUrl(videoUrl, videoAutoplay, videoMuted, videoLoop) : null;

  // If no images, we might want to show a solid background or just one placeholder if absolutely necessary.
  // But per user request, we avoid hardcoded content.
  const displayImages = heroImages;

  // If no content is provided, return null to avoid rendering empty section
  if (!content || (!title && !subtitle && displayImages.length === 0)) {
      return null;
  }

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (displayImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayImages.length]);

  const showDemoButton = demoSettings?.demo_school_enabled !== false;
  const demoLabel = demoSettings?.demo_school_label;
  const demoUrl = demoSettings?.demo_school_url;
  const demoOpenNewTab = demoSettings?.demo_school_open_in_new_tab;

  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 bg-background text-foreground overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {/* Light Mode Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.05),transparent_35%),radial-gradient(circle_at_80%_0%,hsl(var(--primary)/0.05),transparent_30%)] dark:hidden"></div>
        {/* Dark Mode Background */}
        <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.15),transparent_35%),radial-gradient(circle_at_80%_0%,hsl(var(--primary)/0.15),transparent_30%)]"></div>
        
        <div className="absolute -top-40 -left-24 w-[520px] h-[520px] bg-primary/5 dark:bg-primary/15 blur-3xl rounded-full animate-pulse"></div>
        <div className="absolute top-10 right-0 w-[420px] h-[420px] bg-cyan-400/5 dark:bg-cyan-400/10 blur-3xl rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(210deg,rgba(0,0,0,0.01)_1px,transparent_1px)] dark:bg-[linear-gradient(120deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(210deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:140px_140px] opacity-40"></div>
      </div>
      
      <div className="container mx-auto px-4 z-10 relative">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -50 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.8, ease: 'easeOut' }} 
            className="text-center md:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 dark:bg-white/5 dark:border-white/10 text-sm text-primary dark:text-primary-100 backdrop-blur">
              <Sparkles className="h-4 w-4 text-primary" />
              Premium SaaS ERP for modern schools
            </div>
            {title && (
                <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight drop-shadow-sm">
                {title}
                </h1>
            )}
            {subtitle && (
                <p className="mt-5 text-lg md:text-xl text-slate-600 dark:text-slate-300/90 max-w-2xl mx-auto md:mx-0 leading-relaxed">
                {subtitle}
                </p>
            )}

            <div className="mt-8 grid gap-4 w-full max-w-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                {ctaText && (
                    <Button size="lg" className="h-12 px-6 bg-gradient-to-r from-primary to-indigo-500 shadow-lg shadow-primary/40 hover:shadow-primary/60 text-white" asChild>
                        <a href={ctaLink}>{ctaText} <ArrowRight className="ml-2 h-5 w-5" /></a>
                    </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-300/80">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 backdrop-blur">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  SOC2-ready security
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 backdrop-blur">
                  <ExternalLink className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                  1-click onboarding
                </div>
              </div>
            </div>

            {showDemoButton && (
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="sm" variant="secondary" className="bg-slate-100 border border-slate-200 hover:bg-slate-200 dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/15 text-slate-900 dark:text-white" asChild>
                  <a 
                    href={demoUrl} 
                    target={demoOpenNewTab ? "_blank" : undefined} 
                    rel={demoOpenNewTab ? "noopener noreferrer" : undefined}
                  >
                    {demoLabel}
                    {demoOpenNewTab ? <ExternalLink className="ml-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
                  </a>
                </Button>
              </div>
            )}
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }} 
            className="relative min-h-[300px] md:min-h-[400px] lg:min-h-[450px] w-full flex items-center justify-center"
          >
            <div className="absolute -inset-6 bg-gradient-to-br from-primary/30 via-indigo-500/20 to-cyan-400/25 rounded-3xl blur-3xl animate-pulse"></div>
            
            {/* Video Display */}
            {videoEnabled && videoUrl ? (
              <div className="relative w-full h-full min-h-[300px] md:min-h-[400px] lg:min-h-[450px] rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_80px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-900">
                {isDirectVideo ? (
                  // Direct video file (MP4, WebM, etc.) - Auto-fit any size
                  <video
                    className="w-full h-full object-contain"
                    src={videoUrl}
                    autoPlay={videoAutoplay}
                    muted={videoMuted}
                    loop={videoLoop}
                    controls={videoControls}
                    playsInline
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                  />
                ) : embedUrl ? (
                  // YouTube/Vimeo embed - Full container fit
                  <iframe
                    className="w-full h-full"
                    src={embedUrl}
                    title="Hero Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ aspectRatio: '16/9', minHeight: '300px' }}
                  />
                ) : (
                  // Fallback if video URL is invalid
                  <div className="w-full h-full flex items-center justify-center text-white bg-slate-900">
                    <p>Invalid video URL</p>
                  </div>
                )}
              </div>
            ) : displayImages.length > 0 ? (
              // Image Slider - Auto-fit any uploaded size
              <AnimatePresence mode='wait'>
                <motion.img 
                  key={currentSlide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="relative w-full h-auto max-h-[450px] lg:max-h-[500px] rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_80px_rgba(0,0,0,0.5)] object-contain border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 backdrop-blur" 
                  alt={`Jashchar ERP Slide ${currentSlide + 1}`} 
                  src={displayImages[currentSlide]}
                  style={{ maxWidth: '100%', width: 'auto', margin: '0 auto' }}
                />
              </AnimatePresence>
            ) : (
               <div className="relative w-full min-h-[300px] md:min-h-[400px] rounded-3xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400">
                  No Image Uploaded
               </div>
            )}

            {/* Slide Indicators - Only show when images are displayed (not video) */}
            {!videoEnabled && displayImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-black/20 backdrop-blur-sm px-3 py-2 rounded-full">
                {displayImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
export default Hero;
