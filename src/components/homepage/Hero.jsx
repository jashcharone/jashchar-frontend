import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ExternalLink, ShieldCheck, Sparkles, Play, Pause, Volume2, VolumeX, RefreshCw, Brain, FileCheck, ScanFace, Zap } from 'lucide-react';

// -------------------------------------------------------------------------------
// AI FEATURES DATA - 4 Powerful AI Tools
// -------------------------------------------------------------------------------
const AI_FEATURES = [
  { 
    id: 'jashsync', 
    name: 'JashSync', 
    icon: RefreshCw, 
    color: 'from-blue-500 to-cyan-400',
    bgColor: 'bg-blue-500/10 dark:bg-blue-400/10',
    borderColor: 'border-blue-500/30 dark:border-blue-400/30',
    description: 'Real-time Data Sync',
    stat: '99.9%',
    statLabel: 'Uptime'
  },
  { 
    id: 'cortex', 
    name: 'Cortex AI', 
    icon: Brain, 
    color: 'from-purple-500 to-pink-400',
    bgColor: 'bg-purple-500/10 dark:bg-purple-400/10',
    borderColor: 'border-purple-500/30 dark:border-purple-400/30',
    description: 'AI Assistant',
    stat: '50ms',
    statLabel: 'Response'
  },
  { 
    id: 'evaluation', 
    name: 'AI Evaluation', 
    icon: FileCheck, 
    color: 'from-emerald-500 to-teal-400',
    bgColor: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    borderColor: 'border-emerald-500/30 dark:border-emerald-400/30',
    description: 'Auto Paper Check',
    stat: '94.2%',
    statLabel: 'Accuracy'
  },
  { 
    id: 'face', 
    name: 'Face Attendance', 
    icon: ScanFace, 
    color: 'from-orange-500 to-yellow-400',
    bgColor: 'bg-orange-500/10 dark:bg-orange-400/10',
    borderColor: 'border-orange-500/30 dark:border-orange-400/30',
    description: 'Face Recognition',
    stat: '<1s',
    statLabel: 'Detection'
  }
];

// -------------------------------------------------------------------------------
// STYLE 1: Floating 4-Cards Grid
// -------------------------------------------------------------------------------
const AIStyleFloatingCards = () => (
  <div className="grid grid-cols-2 gap-3 mt-6">
    {AI_FEATURES.map((feature, index) => {
      const Icon = feature.icon;
      return (
        <motion.div
          key={feature.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className={`relative p-3 rounded-xl ${feature.bgColor} border ${feature.borderColor} backdrop-blur-sm cursor-pointer group overflow-hidden`}
        >
          <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-gradient-to-r ${feature.color}`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">{feature.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{feature.description}</p>
            </div>
          </div>
        </motion.div>
      );
    })}
  </div>
);

// -------------------------------------------------------------------------------
// STYLE 2: Scrolling Badge Marquee
// -------------------------------------------------------------------------------
const AIStyleScrollingBadge = () => (
  <div className="mt-6 overflow-hidden rounded-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm">
    <div className="flex animate-marquee-fast whitespace-nowrap py-2">
      {[...AI_FEATURES, ...AI_FEATURES, ...AI_FEATURES].map((feature, index) => {
        const Icon = feature.icon;
        return (
          <div key={`${feature.id}-${index}`} className="inline-flex items-center gap-2 mx-6">
            <div className={`p-1 rounded-md bg-gradient-to-r ${feature.color}`}>
              <Icon className="h-3 w-3 text-white" />
            </div>
            <span className={`text-sm font-medium bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
              {feature.name}
            </span>
            <span className="text-slate-400 dark:text-slate-500">•</span>
          </div>
        );
      })}
    </div>
  </div>
);

// -------------------------------------------------------------------------------
// STYLE 3: Rotating Showcase (One at a time)
// -------------------------------------------------------------------------------
const AIStyleRotatingShowcase = () => {
  const [current, setCurrent] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % AI_FEATURES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const feature = AI_FEATURES[current];
  const Icon = feature.icon;

  return (
    <div className="mt-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={feature.id}
          initial={{ opacity: 0, x: 30, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -30, scale: 0.95 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className={`p-4 rounded-2xl ${feature.bgColor} border ${feature.borderColor} backdrop-blur-sm`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-gradient-to-r ${feature.color} shadow-lg`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{feature.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{feature.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>{feature.stat}</p>
              <p className="text-[10px] text-slate-400">{feature.statLabel}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      {/* Progress Dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {AI_FEATURES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${idx === current ? 'w-6 bg-gradient-to-r from-primary to-indigo-500' : 'w-1.5 bg-slate-300 dark:bg-slate-600'}`}
          />
        ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------------------------
// STYLE 4: Icon Row with Tooltips
// -------------------------------------------------------------------------------
const AIStyleIconRow = () => {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-center gap-4 p-3 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm">
        <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
        <span className="text-xs text-slate-500 dark:text-slate-400">Powered by</span>
        {AI_FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.id} className="relative">
              <motion.div
                whileHover={{ scale: 1.2, rotate: 10 }}
                onHoverStart={() => setHoveredId(feature.id)}
                onHoverEnd={() => setHoveredId(null)}
                className={`p-2 rounded-xl bg-gradient-to-r ${feature.color} cursor-pointer shadow-lg`}
              >
                <Icon className="h-4 w-4 text-white" />
              </motion.div>
              <AnimatePresence>
                {hoveredId === feature.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium whitespace-nowrap z-50 shadow-xl"
                  >
                    {feature.name}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// -------------------------------------------------------------------------------
// STYLE 5: Stats Counter Combo
// -------------------------------------------------------------------------------
const AIStyleStatsCombo = () => (
  <div className="mt-6 space-y-3">
    {/* Scrolling Header */}
    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
      <Zap className="h-3 w-3 text-yellow-500" />
      <span>AI-Powered Features</span>
      <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-700" />
    </div>
    {/* Stats Grid */}
    <div className="grid grid-cols-4 gap-2">
      {AI_FEATURES.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="text-center p-2 rounded-xl bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10"
          >
            <div className={`mx-auto w-8 h-8 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-1`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <p className={`text-sm font-bold bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>{feature.stat}</p>
            <p className="text-[9px] text-slate-400 truncate">{feature.name}</p>
          </motion.div>
        );
      })}
    </div>
  </div>
);

// -------------------------------------------------------------------------------
// AI FEATURES SHOWCASE - Daily Rotation
// -------------------------------------------------------------------------------
const AIFeaturesShowcase = () => {
  // Get day of year to determine which style to show (rotates every day)
  const getDayOfYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  // Check URL param for testing: ?aiStyle=0 to ?aiStyle=4
  const getStyleFromUrl = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const style = params.get('aiStyle');
      if (style !== null && !isNaN(parseInt(style))) {
        return parseInt(style) % 5;
      }
    }
    return null;
  };

  const urlStyle = getStyleFromUrl();
  const styleIndex = urlStyle !== null ? urlStyle : (getDayOfYear() % 5);

  const styles = [
    <AIStyleFloatingCards key="cards" />,
    <AIStyleScrollingBadge key="badge" />,
    <AIStyleRotatingShowcase key="rotating" />,
    <AIStyleIconRow key="icons" />,
    <AIStyleStatsCombo key="stats" />
  ];

  return styles[styleIndex];
};

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
                <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight drop-shadow-sm bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-cyan-400 dark:via-emerald-400 dark:to-yellow-300 bg-clip-text text-transparent animate-gradient-x">
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

              {/* AI Features Showcase - Rotates daily through 5 styles */}
              <AIFeaturesShowcase />
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
