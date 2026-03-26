import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Smartphone, ScanFace, KeyRound, User, ArrowLeft, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet';
import LoadingFallback from '@/components/LoadingFallback';
import unifiedAuthV2Service from '@/services/unifiedAuthV2Service';

function SchoolLogin() {
  const { alias } = useParams();
  const { signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Traditional login state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState(null);
  const [loginSettings, setLoginSettings] = useState({});

  // New V2 auth state
  const [loginMethod, setLoginMethod] = useState('traditional'); // traditional, mobile, face, pin
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
    const fetchSchoolInfo = async () => {
      setLoading(true);
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('id, name, logo_url, cms_url_alias, status')
        .eq('cms_url_alias', alias)
        .maybeSingle();

      if (schoolError || !schoolData) {
        console.error('Error fetching school:', schoolError?.message);
        toast({ variant: 'destructive', title: 'Invalid School', description: "The school you're trying to access doesn't exist." });
        navigate('/');
        return;
      }
      
      // ? Check if school is inactive
      if (schoolData.status === 'Inactive') {
        toast({ 
          variant: 'destructive', 
          title: 'School Account Inactive', 
          description: 'This school account has been deactivated. Please contact your administrator.',
          duration: 10000
        });
        navigate('/');
        return;
      }
      
      setSchool(schoolData);

            const { data: settingsData, error: settingsError } = await supabase
        .from('login_page_settings')
        .select('setting_value')
        .eq('branch_id', schoolData.id)
        .eq('setting_key', 'school_login_config')
        .maybeSingle();

      if (settingsError) {
        console.error('Error fetching login settings:', settingsError.message);
      }
      
      if (settingsData?.setting_value) {
        setLoginSettings(settingsData.setting_value);
      }
      
      setLoading(false);
    };

    fetchSchoolInfo();
  }, [alias, navigate, toast]);

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

  // Send OTP handler
  const handleSendOTP = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      toast({ variant: 'destructive', title: 'Invalid Mobile', description: '10 ????????' });
      return;
    }
    setOtpLoading(true);
    try {
      const response = await unifiedAuthV2Service.sendOTP(`+91${mobileNumber}`, otpChannel);
      if (response.success) {
        toast({ title: 'OTP ????????????', description: `${otpChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'} OTP ????????????` });
        setOtpStep('otp');
        setOtpCountdown(60);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: response.error || 'OTP ?????????????' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setOtpLoading(false);
  };

  // Verify OTP handler
  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast({ variant: 'destructive', title: 'Invalid OTP', description: '6 OTP ???????' });
      return;
    }
    setOtpLoading(true);
    try {
      const response = await unifiedAuthV2Service.verifyOTP(`+91${mobileNumber}`, otpCode);
      if (response.success) {
        setUnifiedUserId(response.user.id);
        // Get user roles
        const rolesResponse = await unifiedAuthV2Service.getRoles(response.user.id);
        if (rolesResponse.success && rolesResponse.roles.length > 0) {
          setUserRoles(rolesResponse.roles);
          setOtpStep('role');
        } else {
          toast({ variant: 'destructive', title: 'No Roles', description: '? ?????role ??????' });
          resetV2State();
        }
      } else {
        toast({ variant: 'destructive', title: 'Invalid OTP', description: response.error || 'OTP ?????????' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setOtpLoading(false);
  };

  // Select role and complete login
  const handleRoleSelect = async (role) => {
    setOtpLoading(true);
    try {
      const response = await unifiedAuthV2Service.selectRole(unifiedUserId, role.id);
      if (response.success) {
        toast({ title: '??????!', description: `${role.role_type} ??????` });
        // Store session and redirect
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

  // PIN Login handler
  const handlePinLogin = async () => {
    const pinCode = pin.join('');
    if (!mobileNumber || mobileNumber.length !== 10) {
      toast({ variant: 'destructive', title: 'Invalid Mobile', description: '10 ????????' });
      return;
    }
    if (pinCode.length !== 6) {
      toast({ variant: 'destructive', title: 'Invalid PIN', description: '6 PIN ???????' });
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
          setLoginMethod('mobile'); // Switch to show role selector
        } else {
          toast({ variant: 'destructive', title: 'No Roles', description: '? ?????role ??????' });
        }
      } else {
        toast({ variant: 'destructive', title: 'Invalid PIN', description: response.error || 'PIN ?????????' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setOtpLoading(false);
  };

  // Face Scan handler
  const startFaceScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setFaceScanning(true);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Camera Error', description: '?????????' });
    }
  };

  const captureFace = async () => {
    if (!videoRef.current) return;
    setOtpLoading(true);
    
    // Create canvas and capture frame
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
          setLoginMethod('mobile');
          stopCamera();
        }
      } else {
        toast({ variant: 'destructive', title: 'Face Not Recognized', description: '???????????????. ??????????.' });
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

  // Reset V2 state
  const resetV2State = () => {
    setMobileNumber('');
    setOtp(['', '', '', '', '', '']);
    setPin(['', '', '', '', '', '']);
    setOtpStep('mobile');
    setUserRoles([]);
    setUnifiedUserId(null);
    stopCamera();
  };

  // OTP input handler
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // PIN input handler
  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    if (value && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  // OTP/PIN backspace handler
  const handleKeyDown = (index, e, type) => {
    if (e.key === 'Backspace') {
      const arr = type === 'otp' ? otp : pin;
      const refs = type === 'otp' ? otpRefs : pinRefs;
      if (!arr[index] && index > 0) {
        refs.current[index - 1]?.focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!school) {
      toast({ variant: 'destructive', title: 'Error', description: 'School not identified. Cannot log in.' });
      return;
    }
    await signIn(identifier, password, school.id);
  };

  if (loading) {
    return <LoadingFallback />;
  }

  const pageStyle = {
    backgroundColor: loginSettings.page_background_color || '#f3f4f6',
  };

  const cardStyle = {
    backgroundColor: loginSettings.form_background_color || '#ffffff',
    color: loginSettings.form_text_color || '#000000',
  };
  
  const buttonStyle = {
    backgroundColor: loginSettings.button_color || '#1f2937',
    color: loginSettings.button_text_color || '#ffffff',
    '--button-hover-color': loginSettings.button_hover_color || '#374151',
  };

  return (
    <>
      <Helmet>
          <title>{`${school?.name || 'School'} Login`}</title>
          <meta name="description" content={`Login page for ${school?.name || 'our school'}.`} />
      </Helmet>
      <div className="flex items-center justify-center min-h-screen p-4" style={pageStyle}>
        <style>
          {`
            .hover-bg-dynamic:hover {
              background-color: var(--button-hover-color) !important;
            }
          `}
        </style>
        <Card className="w-full max-w-sm" style={cardStyle}>
          <CardHeader className="text-center">
            {school?.logo_url ? (
              <img src={school.logo_url} alt={`${school.name} Logo`} className="mx-auto h-16 w-auto" />
            ) : (
              <CardTitle className="text-2xl font-bold" style={{ color: cardStyle.color }}>{school.name}</CardTitle>
            )}
            <CardDescription style={{ color: cardStyle.color, opacity: 0.8 }}>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Login Method Tabs */}
            <div className="flex gap-1 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <button
                type="button"
                onClick={() => { setLoginMethod('traditional'); resetV2State(); }}
                className={`flex-1 py-2 px-2 text-xs rounded-md flex items-center justify-center gap-1 transition-all ${
                  loginMethod === 'traditional' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <User size={14} />
                <span>Password</span>
              </button>
              <button
                type="button"
                onClick={() => { setLoginMethod('mobile'); resetV2State(); }}
                className={`flex-1 py-2 px-2 text-xs rounded-md flex items-center justify-center gap-1 transition-all ${
                  loginMethod === 'mobile' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Smartphone size={14} />
                <span>OTP</span>
              </button>
              <button
                type="button"
                onClick={() => { setLoginMethod('face'); resetV2State(); }}
                className={`flex-1 py-2 px-2 text-xs rounded-md flex items-center justify-center gap-1 transition-all ${
                  loginMethod === 'face' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <ScanFace size={14} />
                <span>Face</span>
              </button>
              <button
                type="button"
                onClick={() => { setLoginMethod('pin'); resetV2State(); }}
                className={`flex-1 py-2 px-2 text-xs rounded-md flex items-center justify-center gap-1 transition-all ${
                  loginMethod === 'pin' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <KeyRound size={14} />
                <span>PIN</span>
              </button>
            </div>

            {/* Traditional Login Form */}
            {loginMethod === 'traditional' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier" style={{ color: cardStyle.color }}>Username or Email</Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="john.doe"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={authLoading}
                  />
                </div>
                <div className="space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" style={{ color: cardStyle.color }}>Password</Label>
                    <Link to={`/forgot-password?school=${alias}`} className="text-sm text-blue-600 hover:underline" style={{ color: loginSettings.link_color || '#2563eb' }}>
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={authLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-500 dark:text-gray-400"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <Button type="submit" className="w-full hover-bg-dynamic" disabled={authLoading} style={buttonStyle}>
                  {authLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            )}

            {/* Mobile OTP Login */}
            {loginMethod === 'mobile' && (
              <div className="space-y-4">
                {otpStep === 'mobile' && (
                  <>
                    <div className="space-y-2">
                      <Label style={{ color: cardStyle.color }}>Mobile Number</Label>
                      <div className="flex gap-2">
                        <div className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300">
                          +91
                        </div>
                        <Input
                          type="tel"
                          placeholder="9876543210"
                          maxLength={10}
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                          disabled={otpLoading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label style={{ color: cardStyle.color }}>OTP Channel</Label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setOtpChannel('whatsapp')}
                          className={`flex-1 py-2 px-3 rounded-md text-sm border transition-all ${
                            otpChannel === 'whatsapp' ? 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => setOtpChannel('sms')}
                          className={`flex-1 py-2 px-3 rounded-md text-sm border transition-all ${
                            otpChannel === 'sms' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          SMS
                        </button>
                      </div>
                    </div>
                    <Button onClick={handleSendOTP} className="w-full hover-bg-dynamic" disabled={otpLoading} style={buttonStyle}>
                      {otpLoading ? <><Loader2 className="animate-spin mr-2" size={16} /> Sending...</> : 'Send OTP'}
                    </Button>
                  </>
                )}

                {otpStep === 'otp' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setOtpStep('mobile')}
                      className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
                    >
                      <ArrowLeft size={16} /> Change Number
                    </button>
                    <div className="text-center mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">OTP ????????????</p>
                      <p className="font-medium">+91 {mobileNumber}</p>
                    </div>
                    <div className="space-y-2">
                      <Label style={{ color: cardStyle.color }}>Enter OTP</Label>
                      <div className="flex gap-2 justify-center">
                        {otp.map((digit, index) => (
                          <Input
                            key={index}
                            ref={(el) => (otpRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e, 'otp')}
                            className="w-10 h-12 text-center text-lg font-bold"
                            disabled={otpLoading}
                          />
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleVerifyOTP} className="w-full hover-bg-dynamic" disabled={otpLoading} style={buttonStyle}>
                      {otpLoading ? <><Loader2 className="animate-spin mr-2" size={16} /> Verifying...</> : 'Verify OTP'}
                    </Button>
                    <div className="text-center">
                      {otpCountdown > 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Resend OTP in {otpCountdown}s</p>
                      ) : (
                        <button type="button" onClick={handleSendOTP} className="text-sm text-blue-600 hover:underline">
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </>
                )}

                {otpStep === 'role' && (
                  <>
                    <div className="text-center mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">role ????????</p>
                    </div>
                    <div className="space-y-2">
                      {userRoles.map((role) => (
                        <button
                          key={role.id}
                          onClick={() => handleRoleSelect(role)}
                          disabled={otpLoading}
                          className="w-full p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-3 text-left"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            role.role_type === 'parent' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' :
                            role.role_type === 'student' ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400' :
                            role.role_type === 'teacher' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' :
                            'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}>
                            <User size={20} />
                          </div>
                          <div>
                            <p className="font-medium capitalize">{role.role_type}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{role.branch_name || 'Main Branch'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Face Scan Login */}
            {loginMethod === 'face' && (
              <div className="space-y-4">
                {!faceScanning ? (
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                      <ScanFace size={48} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">?????????</p>
                    <Button onClick={startFaceScan} className="w-full hover-bg-dynamic" style={buttonStyle}>
                      Start Face Scan
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="relative mb-4">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full rounded-lg"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-40 h-52 border-4 border-white rounded-full opacity-50" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={stopCamera} variant="outline" className="flex-1">
                        Cancel
                      </Button>
                      <Button onClick={captureFace} className="flex-1 hover-bg-dynamic" disabled={otpLoading} style={buttonStyle}>
                        {otpLoading ? <Loader2 className="animate-spin" size={16} /> : 'Capture'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PIN Login */}
            {loginMethod === 'pin' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label style={{ color: cardStyle.color }}>Mobile Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300">
                      +91
                    </div>
                    <Input
                      type="tel"
                      placeholder="9876543210"
                      maxLength={10}
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                      disabled={otpLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label style={{ color: cardStyle.color }}>6-Digit PIN</Label>
                  <div className="flex gap-2 justify-center">
                    {pin.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => (pinRefs.current[index] = el)}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePinChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e, 'pin')}
                        className="w-10 h-12 text-center text-lg font-bold"
                        disabled={otpLoading}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={handlePinLogin} className="w-full hover-bg-dynamic" disabled={otpLoading} style={buttonStyle}>
                  {otpLoading ? <><Loader2 className="animate-spin mr-2" size={16} /> Logging in...</> : 'Login with PIN'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default SchoolLogin;
