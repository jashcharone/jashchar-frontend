import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useSchoolSlug } from '@/hooks/useSchoolSlug';
import { useSchoolPublicData } from '@/hooks/useSchoolPublicData';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { ROUTES } from '@/registry/routeRegistry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, GraduationCap, User, Lock, ArrowRight, Eye, EyeOff, Sparkles, Shield, BookOpen, Users, Play, Smartphone, ScanFace, KeyRound, ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet';
import cmsService from '@/services/cmsService';
import unifiedAuthV2Service from '@/services/unifiedAuthV2Service';

// Demo credentials for quick login
const DEMO_CREDENTIALS = {
  'ICSE School': {
    'Super Admin': { email: 'manjunath.gowda@jashcharicse.edu', password: 'Manjunath@123' },
    'Admin': { email: 'manjunath.gowda@jashcharicse.edu', password: 'Manjunath@123' },
    'Principal': { email: 'ramesh.kumar@jashcharicse.edu', password: 'Ramesh@123' },
    'Teacher': { email: 'meena.sharma@jashcharicse.edu', password: 'Meena@123' },
    'Accountant': { email: 'prasad.rao@jashcharicse.edu', password: 'Prasad@123' },
    'Librarian': { email: 'librarian@jashcharicse.edu', password: 'Librarian@123' },
    'Parent': { email: 'parent1@jashcharicse.edu', password: 'Parent@123' },
    'Student': { email: 'student1@jashcharicse.edu', password: 'Student@123' },
  },
  'PU College': {
    'Admin': { email: 'venkatesh.murthy@jashcharpu.edu', password: 'Venkatesh@123' },
    'Principal': { email: 'venkatesh.murthy@jashcharpu.edu', password: 'Venkatesh@123' },
    'Teacher': { email: 'priya.nair@jashcharpu.edu', password: 'Priya@123' },
    'Accountant': { email: 'accountant@jashcharpu.edu', password: 'Accountant@123' },
    'Librarian': { email: 'ganesh.bhat@jashcharpu.edu', password: 'Ganesh@123' },
    'Parent': { email: 'parent@jashcharpu.edu', password: 'Parent@123' },
    'Student': { email: 'student@jashcharpu.edu', password: 'Student@123' },
  }
};

const DEMO_ROLES = ['Admin', 'Teacher', 'Accountant', 'Librarian', 'Parent', 'Student'];

const PublicSchoolLogin = () => {
  const schoolAlias = useSchoolSlug();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { school, settings, loading: dataLoading } = useSchoolPublicData(schoolAlias);

  const { signIn } = useAuth();
  const { toast } = useToast();
  
  const [loginSettings, setLoginSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null); // Track which demo button is loading
  
  // Check if demo mode is enabled via URL param
  const isDemoMode = searchParams.get('demo') === 'true' || searchParams.get('demo') === '1';

  // V2 Auth State
  const [loginMethod, setLoginMethod] = useState('password'); // password, otp, face, pin
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpChannel, setOtpChannel] = useState('whatsapp');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [otpStep, setOtpStep] = useState('mobile'); // mobile, otp, role
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [userRoles, setUserRoles] = useState([]);
  const [unifiedUserId, setUnifiedUserId] = useState(null);
  
  // Refs for OTP/PIN inputs
  const otpRefs = useRef([]);
  const pinRefs = useRef([]);
  const videoRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [faceScanning, setFaceScanning] = useState(false);

  useEffect(() => {
    const fetchLoginSettings = async () => {
      if (!schoolAlias) return;
      try {
        console.log('[PublicSchoolLogin] Fetching settings for:', schoolAlias);
        const data = await cmsService.getPublicSchoolLoginSettings(schoolAlias);
        console.log('[PublicSchoolLogin] Settings received:', data);
        if (data) setLoginSettings(data);
      } catch (err) {
        console.error('[PublicSchoolLogin] Error fetching settings:', err);
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchLoginSettings();
  }, [schoolAlias]);

  // Slider logic with smooth transitions
  useEffect(() => {
    if (loginSettings?.background_type === 'slider') {
      const images = [loginSettings.slider_image_1, loginSettings.slider_image_2, loginSettings.slider_image_3].filter(Boolean);
      if (images.length > 1) {
        const interval = setInterval(() => {
          setSliderIndex(prev => (prev + 1) % images.length);
        }, 6000);
        return () => clearInterval(interval);
      }
    }
  }, [loginSettings]);

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // V2 Auth Handlers
  const handleSendOTP = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      toast({ variant: 'destructive', title: 'Invalid Mobile', description: '10 ಅಂಕಿಯ ಮೊಬೈಲ್ ನಂಬರ್ ನಮೂದಿಸಿ' });
      return;
    }
    setOtpLoading(true);
    try {
      const response = await unifiedAuthV2Service.sendOTP(`+91${mobileNumber}`, otpChannel);
      if (response.success) {
        toast({ title: 'OTP ಕಳುಹಿಸಲಾಗಿದೆ', description: `${otpChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'} ಗೆ OTP ಕಳುಹಿಸಲಾಗಿದೆ` });
        setOtpStep('otp');
        setOtpCountdown(60);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: response.error || 'OTP ಕಳುಹಿಸಲು ವಿಫಲವಾಗಿದೆ' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setOtpLoading(false);
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast({ variant: 'destructive', title: 'Invalid OTP', description: '6 ಅಂಕಿಯ OTP ನಮೂದಿಸಿ' });
      return;
    }
    setOtpLoading(true);
    try {
      const response = await unifiedAuthV2Service.verifyOTP(`+91${mobileNumber}`, otpCode);
      if (response.success) {
        setUnifiedUserId(response.user.id);
        const rolesResponse = await unifiedAuthV2Service.getRoles(response.user.id);
        if (rolesResponse.success && rolesResponse.roles.length > 0) {
          setUserRoles(rolesResponse.roles);
          setOtpStep('role');
        } else {
          toast({ variant: 'destructive', title: 'No Roles', description: 'ಈ ಮೊಬೈಲ್ ನಂಬರ್‌ಗೆ ಯಾವುದೇ role ಲಿಂಕ್ ಆಗಿಲ್ಲ' });
          resetV2State();
        }
      } else {
        toast({ variant: 'destructive', title: 'Invalid OTP', description: response.error || 'OTP ತಪ್ಪಾಗಿದೆ' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setOtpLoading(false);
  };

  const handleRoleSelect = async (role) => {
    setOtpLoading(true);
    try {
      const response = await unifiedAuthV2Service.selectRole(unifiedUserId, role.id);
      if (response.success) {
        toast({ title: 'ಯಶಸ್ವಿ!', description: `${role.role_type} ಆಗಿ ಲಾಗಿನ್ ಆಗಿದೆ` });
        localStorage.setItem('unified_session', JSON.stringify(response.session));
        navigate('/dashboard');
      } else {
        toast({ variant: 'destructive', title: 'Error', description: response.error });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setOtpLoading(false);
  };

  const handlePinLogin = async () => {
    const pinCode = pin.join('');
    if (!mobileNumber || mobileNumber.length !== 10) {
      toast({ variant: 'destructive', title: 'Invalid Mobile', description: '10 ಅಂಕಿಯ ಮೊಬೈಲ್ ನಂಬರ್ ನಮೂದಿಸಿ' });
      return;
    }
    if (pinCode.length !== 6) {
      toast({ variant: 'destructive', title: 'Invalid PIN', description: '6 ಅಂಕಿಯ PIN ನಮೂದಿಸಿ' });
      return;
    }
    setOtpLoading(true);
    try {
      const response = await unifiedAuthV2Service.loginWithPin(`+91${mobileNumber}`, pinCode);
      if (response.success) {
        setUnifiedUserId(response.user.id);
        const rolesResponse = await unifiedAuthV2Service.getRoles(response.user.id);
        if (rolesResponse.success && rolesResponse.roles.length > 0) {
          setUserRoles(rolesResponse.roles);
          setOtpStep('role');
          setLoginMethod('otp');
        } else {
          toast({ variant: 'destructive', title: 'No Roles', description: 'ಈ ಮೊಬೈಲ್ ನಂಬರ್‌ಗೆ ಯಾವುದೇ role ಲಿಂಕ್ ಆಗಿಲ್ಲ' });
        }
      } else {
        toast({ variant: 'destructive', title: 'Invalid PIN', description: response.error || 'PIN ತಪ್ಪಾಗಿದೆ' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setOtpLoading(false);
  };

  const startFaceScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setFaceScanning(true);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Camera Error', description: 'ಕ್ಯಾಮರಾ ಆಕ್ಸೆಸ್ ಅನುಮತಿ ನೀಡಿ' });
    }
  };

  const captureFace = async () => {
    if (!videoRef.current) return;
    setOtpLoading(true);
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    const faceData = canvas.toDataURL('image/jpeg', 0.8);
    
    try {
      const response = await unifiedAuthV2Service.loginWithFace(faceData);
      if (response.success) {
        setUnifiedUserId(response.user.id);
        const rolesResponse = await unifiedAuthV2Service.getRoles(response.user.id);
        if (rolesResponse.success && rolesResponse.roles.length > 0) {
          setUserRoles(rolesResponse.roles);
          setOtpStep('role');
          setLoginMethod('otp');
          stopCamera();
        }
      } else {
        toast({ variant: 'destructive', title: 'Face Not Recognized', description: 'ಮುಖ ಗುರುತಿಸಲಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setOtpLoading(false);
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setFaceScanning(false);
  };

  const resetV2State = () => {
    setMobileNumber('');
    setOtp(['', '', '', '', '', '']);
    setPin(['', '', '', '', '', '']);
    setOtpStep('mobile');
    setUserRoles([]);
    setUnifiedUserId(null);
    stopCamera();
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    if (value && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e, type) => {
    if (e.key === 'Backspace') {
      const arr = type === 'otp' ? otp : pin;
      const refs = type === 'otp' ? otpRefs : pinRefs;
      if (!arr[index] && index > 0) {
        refs.current[index - 1]?.focus();
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!school) return;
    
    setLoading(true);
    try {
      const { data, error } = await signIn(formData.email, formData.password, rememberMe);
      if (error) throw error;

      toast({ title: "Success", description: "Logged in successfully!" });

      const signedInUser = data?.user || data?.session?.user;
      let role = signedInUser?.user_metadata?.role;

      if (!role && signedInUser?.id) {
        // FIRST: Try branch_users table (employees use this)
        const { data: branchUserData } = await supabase
          .from('branch_users')
          .select('role:roles(name)')
          .eq('user_id', signedInUser.id)
          .maybeSingle();

        if (branchUserData?.role?.name) {
          role = branchUserData.role.name.toLowerCase().replace(/\s+/g, '_');
        } else {
          // SECOND: Check if school owner
          const { data: ownerProfile } = await supabase
            .from('school_owner_profiles')
            .select('id')
            .eq('user_id', signedInUser.id)
            .maybeSingle();

          if (ownerProfile) {
            role = 'school_owner';
          }
        }
      }

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
      
      const target = roleDashboards[role] || '/super-admin/dashboard';
      console.log('PublicSchoolLogin: Redirecting to', target, 'for role', role);

      navigate(target, { replace: true });
    } catch (error) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    } finally {
      setLoading(false);
      setDemoLoading(null);
    }
  };

  // Demo quick login - auto login with preset credentials
  const handleDemoLogin = async (role, schoolKey = 'ICSE School') => {
    const creds = DEMO_CREDENTIALS[schoolKey]?.[role];
    if (!creds) {
      toast({ variant: "destructive", title: "Demo Not Available", description: `No demo credentials for ${role}` });
      return;
    }
    
    setDemoLoading(role);
    setFormData({ email: creds.email, password: creds.password });
    
    // Small delay to show the credentials in form, then auto-login
    setTimeout(async () => {
      try {
        const { data, error } = await signIn(creds.email, creds.password, true);
        if (error) throw error;

        toast({ title: "Demo Login Success!", description: `Logged in as ${role}` });

        const signedInUser = data?.user || data?.session?.user;
        let userRole = signedInUser?.user_metadata?.role;

        if (!userRole && signedInUser?.id) {
          const { data: branchUserData } = await supabase
            .from('branch_users')
            .select('role:roles(name)')
            .eq('user_id', signedInUser.id)
            .maybeSingle();

          if (branchUserData?.role?.name) {
            userRole = branchUserData.role.name.toLowerCase().replace(/\s+/g, '_');
          }
        }

        // Each role has their own dashboard URL (21 System Roles)
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
        
        const target = roleDashboards[userRole] || '/super-admin/dashboard';
        navigate(target, { replace: true });
      } catch (error) {
        toast({ variant: "destructive", title: "Demo Login Failed", description: error.message });
        setDemoLoading(null);
      }
    }, 500);
  };

  const handleSocialLogin = async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            school_slug: schoolAlias
          }
        },
      });
      if (error) throw error;
    } catch (error) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    }
  };

  if (dataLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-400/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-blue-400 animate-bounce" />
            </div>
          </div>
          <p className="mt-4 text-blue-200 text-sm animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!school) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
        <div className="text-center text-white">
          <GraduationCap className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold">School Not Found</h2>
          <p className="text-white/60 mt-2">{schoolAlias}</p>
        </div>
      </div>
    );
  }

  // Fallback / Default values
  const bgType = loginSettings?.background_type || 'gradient';
  const accentColor = loginSettings?.accent_color || '#3b82f6';
  const pageTitle = loginSettings?.page_title || settings?.cms_title || school.name;
  const subtitle = loginSettings?.subtitle || "Excellence in Education";
  const logo = loginSettings?.logo_url || settings?.logo_url || school.logo_url;
  const welcomeText = loginSettings?.welcome_text || "Welcome Back";
  const formSubtitle = loginSettings?.form_subtitle || "Sign in to access your dashboard";
  
  // Determine background
  let sliderImages = [];
  if (bgType === 'slider') {
    sliderImages = [loginSettings?.slider_image_1, loginSettings?.slider_image_2, loginSettings?.slider_image_3].filter(Boolean);
  }

  const basePath = location.pathname.startsWith('/s/')
    ? `/s/${schoolAlias}`
    : location.pathname === '/login'
      ? ''
      : `/${schoolAlias}`;

  const forgotPasswordHref = basePath ? `${basePath}/forgot-password` : '/forgot-password';

  // Feature highlights
  const features = [
    { icon: Shield, title: 'Secure Access', desc: 'Bank-grade security' },
    { icon: BookOpen, title: 'Smart Learning', desc: 'AI-powered insights' },
    { icon: Users, title: 'Connected', desc: 'Parents, Teachers, Students' },
  ];

  return (
    <div className="min-h-screen flex w-full overflow-hidden relative">
      <Helmet><title>{pageTitle} - Login</title></Helmet>

      {/* ===== LEFT SIDE - VISUAL SHOWCASE ===== */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden">
        
        {/* Background Layer */}
        <div className="absolute inset-0">
          {bgType === 'slider' && sliderImages.length > 0 ? (
            <>
              {sliderImages.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`absolute inset-0 transition-all duration-[2000ms] ease-in-out ${
                    idx === sliderIndex 
                      ? 'opacity-100 scale-100' 
                      : 'opacity-0 scale-110'
                  }`}
                  style={{ 
                    backgroundImage: `url(${img})`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center' 
                  }}
                />
              ))}
            </>
          ) : bgType === 'image' && loginSettings?.background_image_url ? (
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${loginSettings.background_image_url})` }}
            />
          ) : (
            /* Default Premium Gradient */
            <div 
              className="absolute inset-0"
              style={{ 
                background: `linear-gradient(135deg, ${accentColor} 0%, #1e1b4b 50%, #0f172a 100%)`
              }}
            />
          )}
        </div>

        {/* Animated Overlay Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/70 z-10"></div>
        
        {/* Floating Animated Elements */}
        <div className="absolute inset-0 z-10 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-16 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Content */}
        <div className="relative z-20 flex flex-col justify-between p-12 w-full">
          
          {/* Top - Logo & Brand */}
          <div className="flex items-center gap-4">
            {logo ? (
              <div className="relative group">
                <div className="absolute -inset-2 bg-white/20 rounded-2xl blur-xl group-hover:bg-white/30 transition-all duration-500"></div>
                <img src={logo} alt="Logo" className="relative h-24 w-auto object-contain drop-shadow-lg" />
              </div>
            ) : (
              <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                <GraduationCap className="h-12 w-12 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{pageTitle}</h1>
              <p className="text-white/60 text-sm">{subtitle}</p>
            </div>
          </div>

          {/* Middle - Hero Content */}
          <div className="max-w-lg">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <span className="text-amber-400 font-medium text-sm uppercase tracking-wider">Education Excellence</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Empowering
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                Future Leaders
              </span>
            </h2>
            <p className="text-lg text-white/70 leading-relaxed mb-8">
              {settings?.website_status_message || "Join thousands of students, teachers, and parents in our digital learning ecosystem."}
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {features.map((feature, idx) => (
                <div 
                  key={idx}
                  className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1"
                >
                  <feature.icon className="h-8 w-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="text-white font-semibold text-sm">{feature.title}</h4>
                  <p className="text-white/50 text-xs mt-1">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom - Footer */}
          <div className="flex items-center justify-between">
            <p className="text-white/40 text-sm">
              &copy; {new Date().getFullYear()} {school.name}
            </p>
            {bgType === 'slider' && sliderImages.length > 1 && (
              <div className="flex gap-2">
                {sliderImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSliderIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === sliderIndex ? 'bg-white w-8' : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== RIGHT SIDE - LOGIN FORM ===== */}
      <div 
        className="w-full lg:w-[45%] flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 relative"
        style={{
          '--background': '#ffffff',
          '--foreground': '#0f172a',
          '--input': '#f1f5f9',
          '--border': '#e2e8f0',
          '--muted': 'hsl(220 14.3% 95.9% / 0.7)',
          '--muted-foreground': '#64748b',
        }}
      >
        
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="relative z-10 w-full max-w-md px-8 py-12 login-form-light">
          
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            {logo ? (
              <img src={logo} alt="Logo" className="h-16 mx-auto mb-4" />
            ) : (
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
            )}
            <h1 className="text-xl font-bold text-slate-800">{pageTitle}</h1>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{welcomeText}</h2>
            <p className="text-slate-500">{formSubtitle}</p>
          </div>

          {/* Login Method Tabs */}
          <div className="flex gap-1 mb-6 p-1.5 rounded-xl border" style={{ backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }}>
            <button
              type="button"
              onClick={() => { setLoginMethod('password'); resetV2State(); }}
              className={`flex-1 py-2.5 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                loginMethod === 'password' 
                  ? 'bg-white shadow-sm text-slate-800' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <Lock size={14} />
              <span>Password</span>
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod('otp'); resetV2State(); }}
              className={`flex-1 py-2.5 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                loginMethod === 'otp' 
                  ? 'bg-white shadow-sm text-slate-800' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <Smartphone size={14} />
              <span>OTP</span>
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod('face'); resetV2State(); }}
              className={`flex-1 py-2.5 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                loginMethod === 'face' 
                  ? 'bg-white shadow-sm text-slate-800' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <ScanFace size={14} />
              <span>Face</span>
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod('pin'); resetV2State(); }}
              className={`flex-1 py-2.5 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                loginMethod === 'pin' 
                  ? 'bg-white shadow-sm text-slate-800' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <KeyRound size={14} />
              <span>PIN</span>
            </button>
          </div>

          {/* ===== DEMO QUICK LOGIN PANEL ===== */}
          {isDemoMode && loginMethod === 'password' && (
            <div className="mb-8 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Play className="h-5 w-5 text-amber-600" />
                <h3 className="font-bold text-amber-800">Quick Demo Login</h3>
              </div>
              <p className="text-xs text-amber-700 mb-4">Click any role to instantly login and explore the dashboard</p>
              
              {/* Demo Role Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DEMO_ROLES.map((role) => (
                  <Button
                    key={role}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDemoLogin(role, 'ICSE School')}
                    disabled={demoLoading !== null}
                    className={`
                      relative h-10 text-xs font-semibold transition-all duration-300
                      ${demoLoading === role 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-slate-800 text-white border-slate-800 hover:bg-slate-700 hover:scale-105'
                      }
                    `}
                  >
                    {demoLoading === role ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      role
                    )}
                  </Button>
                ))}
              </div>
              
              {/* Super Admin Special Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDemoLogin('Super Admin', 'ICSE School')}
                disabled={demoLoading !== null}
                className={`
                  w-full mt-3 h-10 text-sm font-bold transition-all duration-300
                  ${demoLoading === 'Super Admin' 
                    ? 'bg-amber-600 text-white border-amber-600' 
                    : 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600 hover:scale-[1.02]'
                  }
                `}
              >
                {demoLoading === 'Super Admin' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Super Admin Access
                  </>
                )}
              </Button>
            </div>
          )}

          {/* ===== PASSWORD LOGIN FORM ===== */}
          {loginMethod === 'password' && (
            <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Email Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Email / Admission No. / Mobile</Label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 blur transition duration-300"></div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    className="w-full pl-12 h-12 rounded-xl border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all shadow-sm text-sm" 
                    style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                    placeholder="Email, Admission No. or Mobile" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium text-slate-700">Password</Label>
                <Link 
                  to={forgotPasswordHref} 
                  className="text-xs font-medium hover:underline transition-colors"
                  style={{ color: accentColor }}
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 blur transition duration-300"></div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="w-full pl-12 pr-12 h-12 rounded-xl border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all shadow-sm text-sm" 
                    style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                    placeholder="••••••••" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="remember" 
                className="h-5 w-5 rounded border-slate-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" 
                checked={rememberMe}
                onCheckedChange={setRememberMe}
              />
              <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer select-none">
                Keep me logged in for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit"
              className="w-full h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5" 
              disabled={loading}
              style={{ 
                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`,
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  Sign In 
                  <ArrowRight className={`ml-2 h-5 w-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                </>
              )}
            </Button>

            {/* Social Login */}
            {loginSettings?.social_login_enabled && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-4 text-slate-400 uppercase tracking-wider">Or continue with</span>
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-12 rounded-xl border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all" 
                  onClick={() => handleSocialLogin('google')}
                >
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
              </>
            )}
          </form>
          )}

          {/* ===== OTP LOGIN ===== */}
          {loginMethod === 'otp' && (
            <div className="space-y-5">
              {otpStep === 'mobile' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Mobile Number</Label>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl opacity-0 group-hover:opacity-20 blur transition duration-300"></div>
                      <div className="relative flex gap-2">
                        <div className="flex items-center px-4 rounded-xl text-sm font-medium border bg-slate-50 border-slate-200 text-slate-600">
                          +91
                        </div>
                        <input
                          type="tel"
                          placeholder="9876543210"
                          maxLength={10}
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                          disabled={otpLoading}
                          className="flex-1 h-12 px-4 rounded-xl border focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:outline-none transition-all shadow-sm text-sm"
                          style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">OTP Channel</Label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setOtpChannel('whatsapp')}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
                          otpChannel === 'whatsapp' 
                            ? 'border-green-500 bg-green-50 text-green-700' 
                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        📱 WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => setOtpChannel('sms')}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
                          otpChannel === 'sms' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        💬 SMS
                      </button>
                    </div>
                  </div>
                  <Button 
                    onClick={handleSendOTP} 
                    className="w-full h-12 text-base font-semibold rounded-xl shadow-lg"
                    disabled={otpLoading}
                    style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)` }}
                  >
                    {otpLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Send OTP'}
                  </Button>
                </>
              )}

              {otpStep === 'otp' && (
                <>
                  <button
                    type="button"
                    onClick={() => setOtpStep('mobile')}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2"
                  >
                    <ArrowLeft size={16} /> Change Number
                  </button>
                  <div className="text-center mb-4 p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">OTP sent to</p>
                    <p className="font-semibold text-slate-800">+91 {mobileNumber}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Enter 6-digit OTP</Label>
                    <div className="flex gap-2 justify-center">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e, 'otp')}
                          className="w-12 h-14 text-center text-xl font-bold rounded-xl border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                          style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                          disabled={otpLoading}
                        />
                      ))}
                    </div>
                  </div>
                  <Button 
                    onClick={handleVerifyOTP} 
                    className="w-full h-12 text-base font-semibold rounded-xl shadow-lg"
                    disabled={otpLoading}
                    style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)` }}
                  >
                    {otpLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Verify OTP'}
                  </Button>
                  <div className="text-center">
                    {otpCountdown > 0 ? (
                      <p className="text-sm text-slate-500">Resend OTP in {otpCountdown}s</p>
                    ) : (
                      <button type="button" onClick={handleSendOTP} className="text-sm font-medium" style={{ color: accentColor }}>
                        Resend OTP
                      </button>
                    )}
                  </div>
                </>
              )}

              {otpStep === 'role' && (
                <>
                  <div className="text-center mb-4">
                    <p className="text-sm text-slate-500">Select your role to continue</p>
                  </div>
                  <div className="space-y-3">
                    {userRoles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => handleRoleSelect(role)}
                        disabled={otpLoading}
                        className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4 text-left"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          role.role_type === 'parent' ? 'bg-blue-100 text-blue-600' :
                          role.role_type === 'student' ? 'bg-green-100 text-green-600' :
                          role.role_type === 'teacher' ? 'bg-purple-100 text-purple-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          <User size={24} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 capitalize">{role.role_type}</p>
                          <p className="text-xs text-slate-500">{role.branch_name || school?.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ===== FACE SCAN LOGIN ===== */}
          {loginMethod === 'face' && (
            <div className="space-y-5">
              {!faceScanning ? (
                <div className="text-center">
                  <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    <ScanFace size={56} className="text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Face Recognition Login</h3>
                  <p className="text-sm text-slate-500 mb-6">Use your camera to scan your face and login instantly</p>
                  <Button 
                    onClick={startFaceScan} 
                    className="w-full h-12 text-base font-semibold rounded-xl shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)` }}
                  >
                    Start Face Scan
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="relative mb-4 rounded-2xl overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full rounded-2xl"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-44 h-56 border-4 border-white/70 rounded-full" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">Position your face within the frame</p>
                  <div className="flex gap-3">
                    <Button onClick={stopCamera} variant="outline" className="flex-1 h-12 rounded-xl">
                      Cancel
                    </Button>
                    <Button 
                      onClick={captureFace} 
                      className="flex-1 h-12 rounded-xl"
                      disabled={otpLoading}
                      style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)` }}
                    >
                      {otpLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Capture & Login'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== PIN LOGIN ===== */}
          {loginMethod === 'pin' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Mobile Number</Label>
                <div className="relative flex gap-2">
                  <div className="flex items-center px-4 rounded-xl text-sm font-medium border bg-slate-50" style={{ borderColor: '#e2e8f0', color: '#475569' }}>
                    +91
                  </div>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    disabled={otpLoading}
                    className="flex-1 h-12 px-4 rounded-xl border focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all shadow-sm text-sm"
                    style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Enter 6-digit PIN</Label>
                <div className="flex gap-2 justify-center">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (pinRefs.current[index] = el)}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e, 'pin')}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl border focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                      style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                      disabled={otpLoading}
                    />
                  ))}
                </div>
              </div>
              <Button 
                onClick={handlePinLogin} 
                className="w-full h-12 text-base font-semibold rounded-xl shadow-lg"
                disabled={otpLoading}
                style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)` }}
              >
                {otpLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Login with PIN'}
              </Button>
            </div>
          )}

          {/* Footer Links - TC-03: Contact Support Page Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Need help? <Link to={`/${schoolAlias}/contact`} className="font-medium hover:underline" style={{ color: accentColor }}>Contact Support</Link>
            </p>
          </div>

          {/* Powered By */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-center text-xs text-slate-400">
              Powered by <span className="font-semibold text-slate-500">JashChar ERP</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicSchoolLogin;
