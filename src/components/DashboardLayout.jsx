import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { usePermissions } from "@/contexts/PermissionContext";
import ThemeCustomizer from "@/components/ThemeCustomizer";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const DashboardLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const { detectedRole } = usePermissions(); // ? Get role from PermissionContext
  const navigate = useNavigate();
  // ? Priority: detectedRole (from profile) > user.role > user_metadata.role > guest
  const role = detectedRole || user?.role || user?.profile?.role || user?.user_metadata?.role || "guest";
  const location = useLocation();

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
        <Sidebar
          role={role}
          isSidebarOpen={isSidebarOpen}
          isMobile={isMobile}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onHoverChange={setIsSidebarHovered}
        />
        <div
          className={cn(
            "flex-1 flex flex-col transition-all duration-300 ease-out",
            isExpanded && !isMobile ? "md:ml-[290px]" : "md:ml-[100px]"
          )}
        >
          <Header
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onThemeSettingsClick={() => setIsCustomizerOpen(true)}
          />
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto" id="main-content">
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
      </div>
    </div>
  );
};

export default DashboardLayout;

