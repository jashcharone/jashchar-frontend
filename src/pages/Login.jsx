import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
  LogIn, Loader2, User, Lock, Eye, EyeOff,
  Github, Mail, Chrome, ArrowRight, MapPin
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ROUTES } from '@/registry/routeRegistry';
import { useTheme } from '@/contexts/ThemeContext';
import LoadingFallback from '@/components/LoadingFallback';

const Login = () => {
  const { signIn, signOut, user, loading: authLoading } = useAuth();
  const { settings } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [config, setConfig] = useState({
    title: "Welcome Back",
    subtitle: "Enter your credentials to access your workspace",
    logo_url: "",
    background_type: "gradient",
    background_value: "linear-gradient(to right bottom, #1e293b, #0f172a, #020617)",
    accent_color: "#3b82f6",
    show_social_login: true,
    social_providers: ["google", "github", "microsoft"],
    company_address: "123 Education St, Tech City, Cloud State, 10101",
    company_name: "Jashchar ERP"
  });
  // OPTIMIZATION: Start with false to show UI immediately. Config will apply when loaded.
  const [configLoading, setConfigLoading] = useState(false);

  // ✅ Redirect if already logged in
  useEffect(() => {
    const fetchRoleAndRedirect = async () => {
      if (!authLoading && user) {
        // ALWAYS fetch role from branch_users first (this is the source of truth for employees)
        let role = null;
        
        try {
          // Try branch_users table first (employees use this)
          const { data: branchUserData } = await supabase
            .from('branch_users')
            .select('role:roles(name)')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (branchUserData?.role?.name) {
            role = branchUserData.role.name.toLowerCase().replace(/\s+/g, '_');
          }
          
          // Fallback to user_metadata if branch_users doesn't have role
          if (!role) {
            role = user.user_metadata?.role;
          }
          
          // Fallback: check if school owner
          if (!role) {
            const { data: ownerData } = await supabase
              .from('school_owner_profiles')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();
            if (ownerData) {
              role = 'school_owner';
            }
          }
          
          console.log("Login Page: User already logged in as", role);
          
          if (role) {
            // Role-specific dashboard URLs - Each role has their own URL (21 System Roles)
            const roleDashboards = {
              'super_admin': '/super-admin/dashboard',
              'school_owner': '/super-admin/dashboard',
              'organization_owner': '/super-admin/dashboard',
              'master_admin': '/master-admin/dashboard',
              'admin': '/Admin/dashboard',
              'principal': '/Principal/dashboard',
              'vice_principal': '/VicePrincipal/dashboard',
              'coordinator': '/Coordinator/dashboard',
              'teacher': '/Teacher/dashboard',
              'class_teacher': '/ClassTeacher/dashboard',
              'subject_teacher': '/SubjectTeacher/dashboard',
              'accountant': '/Accountant/dashboard',
              'cashier': '/Cashier/dashboard',
              'receptionist': '/Receptionist/dashboard',
              'librarian': '/Librarian/dashboard',
              'lab_assistant': '/LabAssistant/dashboard',
              'driver': '/Driver/dashboard',
              'hostel_warden': '/HostelWarden/dashboard',
              'sports_coach': '/SportsCoach/dashboard',
              'security_guard': '/SecurityGuard/dashboard',
              'maintenance_staff': '/MaintenanceStaff/dashboard',
              'peon': '/Peon/dashboard',
              'student': '/Student/dashboard',
              'parent': '/Parent/dashboard'
            };
            
            const dashboardPath = roleDashboards[role] || `/super-admin/dashboard`;
            navigate(dashboardPath, { replace: true });
          }
        } catch (error) {
          console.error('Error fetching role for redirect:', error);
        }
      }
    };
    
    fetchRoleAndRedirect();
  }, [user, authLoading, navigate]);

  // ✅ Load login page config
  useEffect(() => {
    let isMounted = true;
    // SAFETY: Force stop loading after 3 seconds if Supabase hangs
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        console.warn("Login config fetch timed out - using default");
        setConfigLoading(false);
      }
    }, 3000);

    const fetchConfig = async () => {
      try {
        // Try fetching with 'key'/'value' first (new schema)
        let { data, error } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "login_page_config")
          .maybeSingle();

        // Fallback to 'setting_key'/'setting_value' if first attempt fails or returns nothing
        if (error || !data) {
             const retry = await supabase
              .from("system_settings")
              .select("setting_value")
              .eq("setting_key", "login_page_config")
              .maybeSingle();
             
             if (retry.data) {
                 data = { value: retry.data.setting_value };
             }
        }

        if (data?.value && isMounted) {
          let configValue = data.value;
          
          if (typeof configValue === 'string') {
             try {
                if (configValue.startsWith('{')) {
                    configValue = JSON.parse(configValue);
                }
             } catch (e) {
                 console.error("Error parsing login config JSON:", e);
                 configValue = null;
             }
          }
            
          if (configValue && typeof configValue === 'object' && !Array.isArray(configValue)) {
            setConfig(prev => ({ ...prev, ...configValue }));
          }
        }
      } catch (err) {
        console.error("Error loading login config:", err);
      } finally {
        if (isMounted) {
            setConfigLoading(false);
            clearTimeout(safetyTimer);
        }
      }
    };
    fetchConfig();

    return () => {
        isMounted = false;
        clearTimeout(safetyTimer);
    };
  }, []);

  // If user is already logged in, show a different UI instead of auto-redirecting
  if (!authLoading && user) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
              <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
                  <h2 className="text-2xl font-bold mb-4">You are already logged in</h2>
                  <p className="mb-6 text-gray-600">You are currently logged in as <strong>{user.email}</strong>.</p>
                  <div className="flex flex-col gap-3">
                      <Button onClick={async () => {
                          let role = user.user_metadata?.role;
                          
                          // If role not in metadata, fetch from branch_users
                          if (!role || role === 'guest' || role === 'authenticated') {
                              try {
                                  const { data: branchUser } = await supabase
                                      .from('branch_users')
                                      .select('role:roles(name)')
                                      .eq('user_id', user.id)
                                      .maybeSingle();
                                  
                                  if (branchUser?.role?.name) {
                                      role = branchUser.role.name.toLowerCase().replace(/ /g, '_');
                                  }
                              } catch (e) {
                                  console.error('Error fetching role:', e);
                              }
                          }
                          
                          if (role && role !== 'guest' && role !== 'authenticated') {
                              // Map role to correct dashboard path - Each role has their own dashboard
                              const rolePathMap = {
                                  'super_admin': '/super-admin/dashboard',
                                  'school_owner': '/super-admin/dashboard',
                                  'organization_owner': '/super-admin/dashboard',
                                  'admin': '/Admin/dashboard',
                                  'principal': '/Principal/dashboard',
                                  'teacher': '/Teacher/dashboard',
                                  'student': '/Student/dashboard',
                                  'parent': '/Parent/dashboard',
                                  'accountant': '/Accountant/dashboard',
                                  'receptionist': '/Receptionist/dashboard',
                                  'librarian': '/Librarian/dashboard',
                                  'master_admin': '/master-admin/dashboard'
                              };
                              const dashboardPath = rolePathMap[role] || `/super-admin/dashboard`;
                              navigate(dashboardPath);
                          } else {
                              // Default to super admin dashboard for staff
                              navigate('/super-admin/dashboard');
                          }
                      }}>
                          Go to Dashboard
                      </Button>
                      <Button variant="outline" onClick={async () => {
                          await signOut();
                      }}>
                          Logout
                      </Button>
                  </div>
              </div>
          </div>
      );
  }

  // ✅ Main login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // ✅ CLEAR OLD SESSION DATA: Prevent permission leak between users
    localStorage.removeItem('selectedSchoolId');
    localStorage.removeItem('selectedBranchId');
    localStorage.removeItem('selectedOrganizationId');
    sessionStorage.removeItem('ma_target_branch_id'); // Clear Masquerade ID

    try {
      const { error } = await signIn(identifier, password, rememberMe);

      if (error) {
        // Include API URL in error for debugging on mobile
        const apiUrl = (await import('@/utils/platform')).getApiBaseUrl();
        const debugInfo = apiUrl ? ` [API: ${apiUrl}]` : ' [API: relative]';
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description:
            error.message === "Invalid login credentials"
              ? "Incorrect username or password. Please try again."
              : error.message + debugInfo,
        });
        setLoading(false);
        return;
      }

      // ✅ Immediately check for pending approval BEFORE showing success
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "No user session found. Please try again.",
        });
        setLoading(false);
        return;
      }

      // Helper for timeout
      const withTimeout = (promise, timeoutMs = 3000) => {
          return Promise.race([
            promise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
            )
          ]);
      };

      // Check for pending school request
      let request = null;
      try {
          const { data } = await withTimeout(
            supabase
                .from('school_requests')
            .select('status, created_at')
                .or(`owner_email.eq.${user.email},contact_email.eq.${user.email}`)
            .order('created_at', { ascending: false })
            .limit(1)
                .maybeSingle()
          );
          request = data;
      } catch (err) {
          console.warn("School request check timed out or failed:", err);
          // Proceed without blocking if check fails
      }

      if (request && request.status === 'pending') {
        // Pending approval - sign out immediately
        await supabase.auth.signOut();
        // Clear localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
        // Set flag to prevent AuthContext from checking again
        sessionStorage.setItem('login_pending_check', 'true');
        toast({
          variant: "destructive",
          title: "Account Pending Approval",
          description: "Your school registration is currently under review. Please wait for Jashchar ERP team approval before logging in.",
          duration: 5000
        });
        setLoading(false);
        // Use navigate instead of window.location to avoid refresh
        setTimeout(() => {
          sessionStorage.removeItem('login_pending_check');
        }, 1000);
        return;
      }

      if (request && request.status === 'rejected') {
        // Rejected - sign out immediately
        await supabase.auth.signOut();
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
        // Set flag to prevent AuthContext from checking again
        sessionStorage.setItem('login_rejected_check', 'true');
        toast({
          variant: "destructive",
          title: "Registration Rejected",
          description: "Your school registration request has been rejected. Please contact support.",
          duration: 5000
        });
        setLoading(false);
        setTimeout(() => {
          sessionStorage.removeItem('login_rejected_check');
        }, 1000);
        return;
      }

      // Check if role is guest (pending approval)
      // Note: undefined role is OK (might not be set yet in metadata but profile/school exists)
      // Only block if explicitly set to "guest"
      const role = user.user_metadata?.role;
      if (role === "guest") {
        // Guest role means pending approval - sign out immediately
        await supabase.auth.signOut();
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
        // Set flag to prevent AuthContext from checking again
        sessionStorage.setItem('login_guest_check', 'true');
        toast({
          variant: "destructive",
          title: "Account Pending Approval",
          description: "Your registration is pending approval. Please wait for Jashchar ERP team approval before logging in.",
          duration: 5000
        });
        setLoading(false);
        setTimeout(() => {
          sessionStorage.removeItem('login_guest_check');
        }, 1000);
        return;
      }

      // ✅ Only show success if user is approved
      toast({
        title: "Welcome back!",
        description: "Successfully logged in to your account.",
      });

      // ✅ CRITICAL: Fetch role from branch_users FIRST (most reliable source)
      let finalRole = null;
      
      // Always try to fetch from branch_users first - this is the source of truth for employees
      try {
        const { data: branchUser } = await supabase
          .from('branch_users')
          .select('role:roles(name)')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (branchUser?.role?.name) {
          finalRole = branchUser.role.name.toLowerCase().replace(/ /g, '_');
          console.log('Login: Role from branch_users:', finalRole);
        }
      } catch (e) {
        console.error('Error fetching role from branch_users:', e);
      }
      
      // Fallback to user_metadata if branch_users didn't have role
      if (!finalRole) {
        finalRole = role; // from guest check above
        console.log('Login: Role from metadata:', finalRole);
      }
      
      console.log('Login redirect - finalRole:', finalRole);

      if (finalRole === "master_admin") {
        navigate(ROUTES.MASTER_ADMIN.DASHBOARD, { replace: true });
      } else if (finalRole === "school_owner" || finalRole === "super_admin" || finalRole === "organization_owner") {
        navigate(ROUTES.SUPER_ADMIN.DASHBOARD, { replace: true });
      } else if (finalRole === "admin") {
        navigate(ROUTES.ADMIN.DASHBOARD, { replace: true });
      } else if (finalRole === "principal") {
        navigate(ROUTES.PRINCIPAL.DASHBOARD, { replace: true });
      } else if (finalRole === "teacher") {
        navigate(ROUTES.TEACHER.DASHBOARD, { replace: true });
      } else if (finalRole === "student") {
        navigate(ROUTES.STUDENT.DASHBOARD, { replace: true });
      } else if (finalRole === "parent") {
        navigate(ROUTES.PARENT.DASHBOARD, { replace: true });
      } else if (finalRole === "accountant") {
        navigate(ROUTES.ACCOUNTANT.DASHBOARD, { replace: true });
      } else if (finalRole === "receptionist") {
        navigate(ROUTES.RECEPTIONIST.DASHBOARD, { replace: true });
      } else if (finalRole === "librarian") {
        navigate(ROUTES.LIBRARIAN.DASHBOARD, { replace: true });
      } else {
        // Default for any authenticated user - go to super-admin dashboard
        navigate(ROUTES.SUPER_ADMIN.DASHBOARD, { replace: true });
      }

    } catch (err) {
      console.error("Unexpected login error:", err);
      toast({
        variant: "destructive",
        title: "System Error",
        description: "An unexpected error occurred. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const bgStyle =
    config.background_type === "image"
      ? {
          backgroundImage: `url(${config.background_value})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : { background: config.background_value };

  const accentStyle = {
    "--login-accent": config.accent_color,
  };

  if (configLoading) {
    return <LoadingFallback />;
  }

  return (
    <>
      <Helmet>
        <title>Login | {config.title || "Master Admin"}</title>
      </Helmet>
      <div
        className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-x-hidden overflow-y-auto transition-all duration-500"
        style={{ ...bgStyle, ...accentStyle }}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[var(--login-accent)] rounded-full blur-[128px] opacity-20 animate-pulse" />
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500 rounded-full blur-[128px] opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[1000px] z-10 grid grid-cols-1 lg:grid-cols-2 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden min-h-[600px]"
        >
          {/* Left Panel */}
          <div className="hidden lg:flex flex-col justify-center items-center p-12 relative bg-gradient-to-br from-black/60 to-black/30 text-center">
            <div className="relative z-10 flex flex-col items-center">
              {config.logo_url ? (
                <img
                  src={config.logo_url}
                  alt="Logo"
                  className="h-32 w-auto mb-6 object-contain drop-shadow-lg"
                />
              ) : (
                <div className="h-32 w-32 rounded-2xl bg-[var(--login-accent)] flex items-center justify-center mb-6 shadow-2xl shadow-[var(--login-accent)]/40">
                  <LogIn className="text-white h-16 w-16" />
                </div>
              )}

              <h1 className="text-3xl font-bold text-white mb-3 tracking-tight drop-shadow-md">
                {config.company_name || "Jashchar ERP"}
              </h1>
              <div className="flex items-start justify-center gap-2 text-gray-200 max-w-xs mx-auto bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 shadow-inner">
                <MapPin className="h-5 w-5 shrink-0 mt-0.5 text-[var(--login-accent)]" />
                <p className="text-sm leading-relaxed font-medium">
                  {config.company_address}
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-slate-950 relative">
            <div className="mb-8 text-center lg:text-left">
              <div className="lg:hidden mb-6 flex justify-center">
                {config.logo_url ? (
                  <img src={config.logo_url} alt="Logo" className="h-16 w-auto" />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-[var(--login-accent)] flex items-center justify-center shadow-lg text-white">
                    <LogIn className="h-8 w-8" />
                  </div>
                )}
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {config.title}
              </h2>
              <p className="text-slate-500 dark:text-slate-400">{config.subtitle}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="identifier">Email / Admission No. / Mobile</Label>
                <Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Email, Admission No. or Mobile No."
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm font-medium text-primary hover:underline"
                    style={{ color: config.accent_color }}
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                  style={{ '--tw-ring-color': config.accent_color }}
                />
                <label 
                  htmlFor="remember" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600 dark:text-slate-400"
                >
                  Keep me logged in
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={loading}
                style={{ backgroundColor: config.accent_color }}
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Sign In"}
              </Button>
            </form>
            
            {/* TC-03 FIX: Contact Support Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Need help?{' '}
                <a 
                  href="mailto:support@jashchar.com" 
                  className="font-medium text-primary hover:underline"
                  style={{ color: config.accent_color }}
                >
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;
