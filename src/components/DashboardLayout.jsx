import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { usePermissions } from "@/contexts/PermissionContext";
import ThemeCustomizer from "@/components/ThemeCustomizer";
import AIChatbot from "@/components/AIChatbot";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Capacitor } from '@capacitor/core';

const DashboardLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const { detectedRole } = usePermissions();
  const navigate = useNavigate();
  const role = detectedRole || user?.role || user?.profile?.role || user?.user_metadata?.role || "guest";
  const location = useLocation();

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 768 && window.innerWidth <= 1024);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Detect if running inside Capacitor native app (NOT web browser)
  // Bottom nav + compact header ONLY for native app. Website stays original.
  const isCapacitorApp = (() => {
    try { if (Capacitor.isNativePlatform()) return true; } catch(e) {}
    if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) return true;
    if (typeof window !== 'undefined' && window.location.hostname === 'app.jashchar.local') return true;
    return false;
  })();

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const mobile = width <= 768;
      const tablet = width > 768 && width <= 1024;
      const landscape = width > height;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      setIsLandscape(landscape);
      
      // Auto-collapse sidebar behavior:
      // - Mobile: Always collapsed (drawer mode)
      // - Tablet portrait: Collapsed by default
      // - Tablet landscape: Expanded by default
      // - Desktop: Expanded by default
      if (mobile) {
        setIsSidebarOpen(false);
      } else if (tablet && !landscape) {
        // Tablet portrait - keep current state or collapse
        // Don't auto-toggle on resize to avoid jarring UX
      } else if (width > 1024) {
        // Desktop - expand
        setIsSidebarOpen(true);
      }
    };
    
    window.addEventListener("resize", handleResize);
    // Also listen for orientation change (especially important for tablets)
    window.addEventListener("orientationchange", () => {
      setTimeout(handleResize, 100); // Small delay for orientation to complete
    });
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  // Only close sidebar on mobile when navigating to a completely different module
  // Not when navigating within submenu items of the same module
  const previousPathRef = React.useRef(location.pathname);
  
  useEffect(() => {
    if (isMobile) {
      const prevPath = previousPathRef.current;
      const currentPath = location.pathname;
      
      // Get the parent path (e.g., /school/transport from /school/transport/routes)
      const prevParent = prevPath.split('/').slice(0, 4).join('/');
      const currentParent = currentPath.split('/').slice(0, 4).join('/');
      
      // Only close sidebar if navigating to a different module section
      if (prevParent !== currentParent) {
        setIsSidebarOpen(false);
      }
      
      previousPathRef.current = currentPath;
    }
  }, [location, isMobile]);

  // ? REMOVED: Don't auto-redirect - ProtectedRoute handles auth
  // The useEffect was causing race condition where user state wasn't loaded yet

  // ? If loading takes too long, auto-timeout
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  // ? In case user is null after loading
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-red-600">Authentication failed. Please login again.</p>
      </div>
    );
  }

  // Determine effective sidebar width state for margin calculation
  const isExpanded = isSidebarOpen || (isSidebarHovered && !isMobile);

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="relative min-h-screen flex">
        {/* Mobile/Tablet overlay for sidebar drawer */}
        {(isMobile || (isTablet && !isLandscape)) && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
        
        {/* Sidebar — shown on website (all sizes), hidden ONLY on Capacitor native app */}
        {!isCapacitorApp && (
          <Sidebar
            role={role}
            isSidebarOpen={isSidebarOpen}
            isMobile={isMobile || (isTablet && !isLandscape)}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onHoverChange={setIsSidebarHovered}
          />
        )}
        
        <div
          className={cn(
            "flex-1 flex flex-col transition-all duration-300 ease-out min-w-0",
            // Margin calculation:
            // - Mobile: No margin (sidebar is overlay drawer)
            // - Tablet portrait: No margin (sidebar is overlay drawer)
            // - Tablet landscape: Margin for sidebar
            // - Desktop: Margin for sidebar
            !isCapacitorApp && !isMobile && !(isTablet && !isLandscape) && isExpanded ? "lg:ml-[270px] ml-[80px]" : 
            !isCapacitorApp && !isMobile && !(isTablet && !isLandscape) ? "md:ml-[80px]" : ""
          )}
        >
          {/* Header — full Header on website, compact on Capacitor native only */}
          {!isCapacitorApp ? (
            <Header
              toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              onThemeSettingsClick={() => setIsCustomizerOpen(true)}
              onChatbotToggle={() => setIsChatbotOpen(!isChatbotOpen)}
            />
          ) : (
            <MobileCompactHeader 
              onThemeClick={() => setIsCustomizerOpen(true)}
              onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          )}
          
          <main 
            className={cn(
              "flex-1 overflow-y-auto",
              isCapacitorApp ? "p-3 pb-20" : "p-4 sm:p-6",
            )} 
            id="main-content"
          >
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </main>
        </div>
        <ThemeCustomizer
          isOpen={isCustomizerOpen}
          onClose={() => setIsCustomizerOpen(false)}
        />
        {/* AI Chatbot - controlled from Header icon */}
        <AIChatbot 
          isOpen={isChatbotOpen} 
          onClose={() => setIsChatbotOpen(false)} 
        />
      </div>
      
      {/* Bottom Navigation is now rendered globally by MobileAppShell in App.jsx */}
    </div>
  );
};

// ─── MOBILE COMPACT HEADER ──────────────────────────────────────────────────
// Slim header for mobile that doesn't waste screen space
function MobileCompactHeader({ onThemeClick, onMenuClick }) {
  const { user, school } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { detectedRole } = usePermissions();
  const role = detectedRole || user?.role || user?.profile?.role || user?.user_metadata?.role || 'user';
  
  // Extract roleSlug from current URL path (e.g., /cashier/fees-collection/... → cashier)
  const currentPathSlug = location.pathname.split('/')[1] || 'super-admin';
  
  const getProfilePath = () => {
    switch (role) {
      case 'master_admin': return '/master-admin/profile';
      case 'student': return '/Student/profile';
      case 'parent': return '/Parent/profile';
      default: return `/${currentPathSlug}/profile`;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50">
      <div 
        className="flex items-center justify-between h-14 px-4"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* Left: App name */}
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-foreground tracking-tight">
            {school?.name || 'Jashchar ERP'}
          </h1>
        </div>

        {/* Right: Theme + Avatar */}
        <div className="flex items-center gap-1">
          <button
            onClick={onThemeClick}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button 
            onClick={() => navigate(getProfilePath())}
            className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ml-1"
          >
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-primary">
                {user?.user_metadata?.full_name?.charAt(0) || 'U'}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export default DashboardLayout;

