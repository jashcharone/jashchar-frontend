import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Settings, Sun, Moon, Menu, Clock, Bell, Download, Search, Command, Calendar, Mail, Key, Briefcase, Bug, MessageCircle, Trash2, Loader2, ClipboardList, History } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import SessionSwitcher from './SessionSwitcher';
import BranchSelector from './BranchSelector';
import BugReportModal from './BugReportModal';
import { RoleSwitcher } from './auth-v2';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = ({ toggleSidebar, onThemeSettingsClick, onChatbotToggle, isDrawerMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, school } = useAuth();
  
  // Extract roleSlug from current URL path (e.g., /cashier/fees-collection/... → cashier)
  const currentPathSlug = location.pathname.split('/')[1] || 'super-admin';
  const { settings, toggleMode } = useTheme();
  const { toast } = useToast();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [canInstall, setCanInstall] = useState(false);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  
  // Get role from all possible sources for consistency
  // Note: user?.role might be "authenticated" (Supabase default) - check user_metadata first
  const getRealRole = () => {
    // Priority: user_metadata.role > profile.role > app_metadata.role > role (if not "authenticated")
    const metaRole = user?.user_metadata?.role;
    if (metaRole && metaRole !== 'authenticated') return metaRole;
    
    const profileRole = user?.profile?.role?.name || user?.profile?.role;
    if (profileRole && profileRole !== 'authenticated') return profileRole;
    
    const appRole = user?.app_metadata?.role;
    if (appRole && appRole !== 'authenticated') return appRole;
    
    const directRole = user?.role;
    if (directRole && directRole !== 'authenticated') return directRole;
    
    return null;
  };
  
  const rawRole = getRealRole();
  const role = rawRole?.toLowerCase()?.replace(/\s+/g, '_');
  const userType = user?.userType || user?.profile?.type; // 'owner' or 'staff'

  const getRoleBasedPath = (type) => {
    // For school staff, use the current URL path slug to maintain navigation context
    // This ensures /cashier/profile stays as /cashier/profile, not /super-admin/profile
    const isSchoolStaff = ['super_admin', 'school_owner', 'organization_owner', 'admin', 'teacher', 'principal', 'accountant', 'receptionist', 'librarian', 'cashier'].includes(role);
    const staffBasePath = isSchoolStaff ? `/${currentPathSlug}` : '/super-admin';
    
    switch (type) {
      case 'profile':
        if (role === 'master_admin') return '/master-admin/profile';
        if (isSchoolStaff) return `${staffBasePath}/profile`;
        if (role === 'student') return '/Student/profile';
        if (role === 'parent') return '/Parent/profile';
        // Fallback to Student/profile if role is unknown (better than broken /profile route)
        console.warn('[Header] Unknown role for profile path:', role, '- defaulting to Student profile');
        return '/Student/profile';
        
      case 'reset-password':
        if (role === 'master_admin') return '/master-admin/reset-password';
        if (isSchoolStaff) return `${staffBasePath}/reset-password`;
        if (role === 'student') return '/Student/reset-password';
        if (role === 'parent') return '/Parent/reset-password';
        return '/reset-password';
        
      case 'settings':
        if (role === 'master_admin') return '/master-admin/settings';
        return null;
        
      default:
        return '#';
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkInstall = () => setCanInstall(!!window.pwaInstallPrompt);
    window.addEventListener('pwa-install-available', checkInstall);
    checkInstall();
    return () => window.removeEventListener('pwa-install-available', checkInstall);
  }, []);

  const handleInstallApp = async () => {
    if (!window.pwaInstallPrompt) return;
    window.pwaInstallPrompt.prompt();
    const { outcome } = await window.pwaInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      window.pwaInstallPrompt = null;
      setCanInstall(false);
    }
  };

  // Cache Clear Function - Clears all browser storage and caches (PRESERVES AUTH)
  const handleCacheClear = async () => {
    if (isClearingCache) return; // Prevent double-click
    
    setIsClearingCache(true);
    try {
      // 1. PRESERVE Supabase auth data before clearing localStorage
      const authKeysToPreserve = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Preserve all Supabase auth-related keys
        if (key && (
          key.startsWith('sb-') || 
          key.includes('supabase') || 
          key.includes('auth') ||
          key.includes('session')
        )) {
          authKeysToPreserve.push({ key, value: localStorage.getItem(key) });
        }
      }
      
      // 2. Clear localStorage
      localStorage.clear();
      
      // 3. RESTORE auth data immediately
      authKeysToPreserve.forEach(({ key, value }) => {
        if (value) localStorage.setItem(key, value);
      });
      
      // 4. Clear sessionStorage (but preserve auth-related if any)
      const sessionAuthKeys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
          sessionAuthKeys.push({ key, value: sessionStorage.getItem(key) });
        }
      }
      sessionStorage.clear();
      sessionAuthKeys.forEach(({ key, value }) => {
        if (value) sessionStorage.setItem(key, value);
      });
      
      // 5. Clear Service Worker caches (PWA) - Safe, doesn't affect auth
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // 6. Unregister Service Workers - Safe, doesn't affect auth
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      
      // 7. Clear IndexedDB EXCEPT Supabase auth databases
      if ('indexedDB' in window && indexedDB.databases) {
        try {
          const databases = await indexedDB.databases();
          for (const db of databases) {
            // Skip Supabase auth-related databases
            if (db.name && !db.name.includes('supabase') && !db.name.includes('auth')) {
              indexedDB.deleteDatabase(db.name);
            }
          }
        } catch (e) {
          console.log('IndexedDB clear skipped:', e);
        }
      }
      
      toast({
        title: "✅ Cache Cleared",
        description: "App cache cleared successfully. Reloading...",
        variant: "default",
      });
      
      // Reload page after short delay to show toast
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Cache clear error:', error);
      setIsClearingCache(false);
      toast({
        title: "❌ Error",
        description: "Failed to clear some caches. Try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="px-2 sm:px-6 pt-2 sm:pt-3 pb-1 sm:pb-2 sticky top-0 z-40">
      <div 
        className={cn(
          "border shadow-sm backdrop-blur-xl px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between transition-all duration-300",
          "bg-background/80 supports-[backdrop-filter]:bg-background/60"
        )}
        style={{
            borderRadius: `${settings.headerRadius ?? 24}px`,
            ...(settings.colors.headerBackground ? { backgroundColor: settings.colors.headerBackground } : {}),
            ...(settings.colors.border && { borderColor: settings.colors.border })
        }}
      >
        {/* LEFT: Mobile/Tablet Toggle & Time */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(isDrawerMode ? "flex" : "lg:hidden", "rounded-xl h-9 w-9")}
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Digital Clock & Session - Hidden on tablet to save space */}
          <div className="hidden lg:flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-mono font-bold text-sm text-primary">
                  {currentDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
             </div>
             
             {/* Session Switcher - Only for branch-level roles (NOT master_admin) */}
             {(role === 'super_admin' || role === 'school_owner' || role === 'organization_owner') && role !== 'master_admin' && (
               <SessionSwitcher />
             )}
          </div>
        </div>

        {/* CENTER: Branch Selector - Hidden on mobile, shown on tablet+ */}
        <div className="hidden md:block flex-1 max-w-xs lg:max-w-md mx-2 lg:mx-4">
             {(role === 'super_admin' || role === 'school_owner' || role === 'organization_owner' || role === 'admin' || userType === 'owner') && <BranchSelector />}
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          
          {/* Role Switcher - For V2 Auth multi-role users - Hidden on tablet */}
          <div className="hidden lg:block">
            <RoleSwitcher />
          </div>
          
          {/* PWA Install - Hidden on tablet */}
          {canInstall && (
            <Button 
                variant="outline" 
                size="sm" 
                className="hidden lg:flex gap-2 rounded-xl border-primary/20 text-primary hover:bg-primary/10"
                onClick={handleInstallApp}
            >
                <Download className="h-4 w-4" />
                <span className="text-xs font-bold">Install App</span>
            </Button>
          )}

          {/* Theme Toggle - Always visible */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMode}
            className="rounded-xl hover:bg-muted transition-transform hover:scale-105"
          >
            {settings.mode === 'dark' ? (
              <Moon className="h-5 w-5 text-blue-400 fill-blue-400/20" />
            ) : (
              <Sun className="h-5 w-5 text-orange-500 fill-orange-500/20" />
            )}
          </Button>

          {/* AI Chatbot Toggle - Hidden on tablet to save space */}
          {onChatbotToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onChatbotToggle}
              className="hidden lg:flex rounded-xl hover:bg-blue-500/10 transition-transform hover:scale-105 relative"
              title="AI Chatbot"
            >
              <MessageCircle className="h-5 w-5 text-blue-500" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-green-500 rounded-full border border-background" />
            </Button>
          )}

          {/* Bug Report - Hidden on tablet */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsBugModalOpen(true)}
            className="hidden lg:flex rounded-xl hover:bg-pink-500/10 transition-transform hover:scale-105"
            title="Report Bug/Issue"
          >
            <Bug className="h-5 w-5 text-pink-500" />
          </Button>

          {/* My Bug Reports - Hidden on tablet */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/${currentPathSlug}/my-bug-reports`)}
            className="hidden lg:flex rounded-xl hover:bg-orange-500/10 transition-transform hover:scale-105"
            title="My Bug Reports"
          >
            <History className="h-5 w-5 text-orange-500" />
          </Button>

          {/* View Bug Reports - Master Admin Only - Hidden on tablet */}
          {role === 'master_admin' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/master-admin/bug-reports')}
              className="hidden lg:flex rounded-xl hover:bg-purple-500/10 transition-transform hover:scale-105"
              title="View All Bug Reports"
            >
              <ClipboardList className="h-5 w-5 text-purple-500" />
            </Button>
          )}

          {/* Cache Clear Button - Hidden on tablet */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCacheClear}
            disabled={isClearingCache}
            className="hidden lg:flex rounded-xl hover:bg-red-500/10 transition-transform hover:scale-105"
            title="Clear Cache"
          >
            {isClearingCache ? (
              <Loader2 className="h-5 w-5 text-red-500 animate-spin" />
            ) : (
              <Trash2 className="h-5 w-5 text-red-500" />
            )}
          </Button>

          {/* MORE DROPDOWN - Visible only on tablet (md-lg) to show hidden icons */}
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl hover:bg-muted"
                >
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {onChatbotToggle && (
                  <DropdownMenuItem onClick={onChatbotToggle} className="gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    AI Chatbot
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem onClick={() => setIsBugModalOpen(true)} className="gap-2">
                  <Bug className="h-4 w-4 text-pink-500" />
                  Report Bug
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => navigate(`/${currentPathSlug}/my-bug-reports`)} className="gap-2">
                  <History className="h-4 w-4 text-orange-500" />
                  My Bug Reports
                </DropdownMenuItem>
                
                {role === 'master_admin' && (
                  <DropdownMenuItem onClick={() => navigate('/master-admin/bug-reports')} className="gap-2">
                    <ClipboardList className="h-4 w-4 text-purple-500" />
                    All Bug Reports
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleCacheClear} disabled={isClearingCache} className="gap-2">
                  {isClearingCache ? (
                    <Loader2 className="h-4 w-4 text-red-500 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-red-500" />
                  )}
                  Clear Cache
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={onThemeSettingsClick} className="gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Theme Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Notifications - Always visible */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-muted transition-transform hover:scale-105 relative"
            onClick={() => toast({ title: "No new notifications" })}
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Button>

          {/* Settings (Theme Studio) - Always visible */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeSettingsClick}
            className="rounded-xl hover:bg-muted transition-transform hover:scale-105"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full ml-2">
                <Avatar className="h-10 w-10 border-2 border-primary/10 transition-transform hover:scale-105">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name} />
                  <AvatarFallback className="bg-primary/5 text-primary font-bold">
                    {user?.user_metadata?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72" align="end" forceMount>
              <div className="flex items-center gap-4 p-4">
                <Avatar className="h-16 w-16 border-2 border-primary/10">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name} />
                  <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold">
                    {user?.user_metadata?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1">
                  <p className="text-lg font-semibold leading-none">{user?.user_metadata?.full_name || 'User'}</p>
                  <p className="text-xs font-medium text-muted-foreground">{user?.user_metadata?.role || 'Role'}</p>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="h-7 px-3 text-xs mt-1 w-fit"
                    onClick={() => signOut(school?.slug ? `/${school.slug}` : '/')}
                  >
                    <LogOut className="h-3 w-3 mr-1" /> Logout
                  </Button>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer py-2.5" onClick={() => navigate(getRoleBasedPath('profile'))}>
                <User className="mr-3 h-4 w-4 text-muted-foreground" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-2.5" onClick={() => navigate(getRoleBasedPath('reset-password'))}>
                <Key className="mr-3 h-4 w-4 text-muted-foreground" />
                <span>Reset Password</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-2.5" onClick={() => toast({ title: "Mailbox", description: "This feature is coming soon!" })}>
                <Mail className="mr-3 h-4 w-4 text-muted-foreground" />
                <span>Mailbox</span>
              </DropdownMenuItem>
              {getRoleBasedPath('settings') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer py-2.5" onClick={() => navigate(getRoleBasedPath('settings'))}>
                    <Briefcase className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span>Global Settings</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer py-2.5 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50" onClick={() => signOut(school?.slug ? `/${school.slug}` : '/')}>
                <LogOut className="mr-3 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Bug Report Modal */}
      <BugReportModal 
        isOpen={isBugModalOpen} 
        onClose={() => setIsBugModalOpen(false)} 
      />
    </header>
  );
};

export default Header;

