import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Settings, Sun, Moon, Menu, Clock, Bell, Download, Search, Command, Calendar, Mail, Key, Briefcase, Bug, MessageCircle } from 'lucide-react';
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

const Header = ({ toggleSidebar, onThemeSettingsClick, onChatbotToggle }) => {
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
        {/* LEFT: Mobile Toggle & Time */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden rounded-xl h-9 w-9"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Digital Clock & Session */}
          <div className="hidden md:flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-mono font-bold text-sm text-primary">
                  {currentDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
             </div>
             
             {/* Session Switcher - Only for super_admin & school_owner roles */}
             {(role === 'super_admin' || role === 'school_owner' || role === 'organization_owner' || role === 'master_admin') && (
               <SessionSwitcher />
             )}
          </div>
        </div>

        {/* CENTER: Branch Selector - Only for Admin roles */}
        <div className="hidden md:block flex-1 max-w-md mx-4">
             {(role === 'super_admin' || role === 'school_owner' || role === 'organization_owner' || role === 'admin' || userType === 'owner') && <BranchSelector />}
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          
          {/* Role Switcher - For V2 Auth multi-role users */}
          <div className="hidden sm:block">
            <RoleSwitcher />
          </div>
          
          {/* PWA Install */}
          {canInstall && (
            <Button 
                variant="outline" 
                size="sm" 
                className="hidden sm:flex gap-2 rounded-xl border-primary/20 text-primary hover:bg-primary/10"
                onClick={handleInstallApp}
            >
                <Download className="h-4 w-4" />
                <span className="text-xs font-bold">Install App</span>
            </Button>
          )}

          {/* Theme Toggle */}
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

          {/* AI Chatbot Toggle */}
          {onChatbotToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onChatbotToggle}
              className="rounded-xl hover:bg-blue-500/10 transition-transform hover:scale-105 relative"
              title="AI Chatbot"
            >
              <MessageCircle className="h-5 w-5 text-blue-500" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-green-500 rounded-full border border-background" />
            </Button>
          )}

          {/* Bug Report */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsBugModalOpen(true)}
            className="rounded-xl hover:bg-pink-500/10 transition-transform hover:scale-105"
            title="Report Bug/Issue"
          >
            <Bug className="h-5 w-5 text-pink-500" />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-muted transition-transform hover:scale-105 relative"
            onClick={() => toast({ title: "No new notifications" })}
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {/* TC-04 FIX: Red dot removed - only show when there are actual notifications */}
          </Button>

          {/* Settings (Theme Studio) */}
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

