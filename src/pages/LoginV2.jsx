/**
 * LOGIN V2 PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Future-proof Login Page - 100 Years Plan
 * 
 * Login Flow:
 * 1. Choose login method (OTP / Face / PIN)
 * 2. Authenticate
 * 3. Select role (if multiple roles)
 * 4. Redirect to dashboard
 * 
 * Created: March 5, 2026
 * Architecture: 100 Years Future Plan
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';
import { 
    Smartphone, Scan, KeyRound, ArrowLeft, 
    Sparkles, Shield, Fingerprint
} from 'lucide-react';
import LoadingFallback from '@/components/LoadingFallback';
import { supabase } from '@/lib/customSupabaseClient';

// Auth V2 Components
import {
    MobileLoginInput,
    OTPVerification,
    RoleSelector,
    FaceScanLogin,
    PINLogin
} from '@/components/auth-v2';

// Auth V2 Service
import { 
    validateSession, 
    getCurrentUser, 
    getStoredRoles,
    selectRole
} from '@/services/unifiedAuthV2Service';

// Login Methods
const LOGIN_METHODS = {
    OTP: 'otp',
    FACE: 'face',
    PIN: 'pin'
};

// Login Steps
const STEPS = {
    METHOD_SELECT: 'method_select',
    MOBILE_INPUT: 'mobile_input',
    OTP_VERIFY: 'otp_verify',
    FACE_SCAN: 'face_scan',
    PIN_LOGIN: 'pin_login',
    ROLE_SELECT: 'role_select',
    LOADING: 'loading'
};

const LoginV2Page = () => {
    const { alias } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    // State
    const [step, setStep] = useState(STEPS.LOADING);
    const [loginMethod, setLoginMethod] = useState(null);
    const [school, setSchool] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Auth State
    const [otpData, setOtpData] = useState(null);
    const [authResult, setAuthResult] = useState(null);
    
    // Theme
    const primaryColor = school?.primary_color || '#3b82f6';
    
    // Check for existing session on mount
    useEffect(() => {
        const checkExistingSession = async () => {
            try {
                const session = await validateSession();
                
                if (session.success) {
                    // Already logged in
                    const roles = session.roles || getStoredRoles();
                    
                    if (roles.length > 1) {
                        setAuthResult({
                            user: session.user,
                            roles: roles
                        });
                        setStep(STEPS.ROLE_SELECT);
                    } else if (roles.length === 1) {
                        // Auto-select single role
                        await selectRole(roles[0]);
                        redirectToDashboard(roles[0]);
                    } else {
                        setStep(STEPS.METHOD_SELECT);
                    }
                } else {
                    setStep(STEPS.METHOD_SELECT);
                }
            } catch (error) {
                console.log('No existing session');
                setStep(STEPS.METHOD_SELECT);
            }
        };
        
        checkExistingSession();
    }, []);
    
    // Fetch school info
    useEffect(() => {
        const fetchSchoolInfo = async () => {
            if (!alias) {
                setLoading(false);
                return;
            }
            
            try {
                const { data: schoolData, error } = await supabase
                    .from('schools')
                    .select('id, name, logo_url, cms_url_alias, status, primary_color')
                    .eq('cms_url_alias', alias)
                    .maybeSingle();
                
                if (error || !schoolData) {
                    toast({
                        variant: 'destructive',
                        title: 'ಶಾಲೆ ಕಂಡುಬಂದಿಲ್ಲ',
                        description: 'ಈ URL ಅಮಾನ್ಯವಾಗಿದೆ'
                    });
                    navigate('/');
                    return;
                }
                
                if (schoolData.status === 'Inactive') {
                    toast({
                        variant: 'destructive',
                        title: 'ಶಾಲೆ ನಿಷ್ಕ್ರಿಯವಾಗಿದೆ',
                        description: 'ಈ ಶಾಲೆಯ ಖಾತೆ ನಿಷ್ಕ್ರಿಯಗೊಂಡಿದೆ'
                    });
                    navigate('/');
                    return;
                }
                
                setSchool(schoolData);
            } catch (err) {
                console.error('School fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchSchoolInfo();
    }, [alias, navigate, toast]);
    
    // Redirect to appropriate dashboard
    const redirectToDashboard = (role) => {
        const dashboardMap = {
            parent: '/parent/dashboard',
            student: '/student/dashboard',
            teacher: '/teacher-dashboard',
            staff: '/staff-dashboard',
            admin: '/admin-dashboard',
            principal: '/principal-dashboard'
        };
        
        const path = dashboardMap[role.role_type] || '/dashboard';
        navigate(path);
    };
    
    // Handle method selection
    const handleMethodSelect = (method) => {
        setLoginMethod(method);
        
        switch (method) {
            case LOGIN_METHODS.OTP:
                setStep(STEPS.MOBILE_INPUT);
                break;
            case LOGIN_METHODS.FACE:
                setStep(STEPS.FACE_SCAN);
                break;
            case LOGIN_METHODS.PIN:
                setStep(STEPS.PIN_LOGIN);
                break;
            default:
                setStep(STEPS.MOBILE_INPUT);
        }
    };
    
    // Handle OTP sent
    const handleOTPSent = (data) => {
        setOtpData(data);
        setStep(STEPS.OTP_VERIFY);
    };
    
    // Handle OTP verified / Login success
    const handleLoginSuccess = (result) => {
        setAuthResult(result);
        
        if (result.isNewUser || result.requiresProfile) {
            // TODO: Show profile setup
            toast({
                title: 'ಸ್ವಾಗತ!',
                description: 'ನಿಮ್ಮ ಖಾತೆ ರಚಿಸಲಾಗಿದೆ'
            });
        }
        
        if (result.roles && result.roles.length > 1) {
            setStep(STEPS.ROLE_SELECT);
        } else if (result.roles && result.roles.length === 1) {
            // Auto-select single role
            selectRole(result.roles[0]);
            toast({
                title: 'ಲಾಗಿನ್ ಯಶಸ್ವಿ!',
                description: `${result.user?.full_name || 'User'} ಆಗಿ ಲಾಗಿನ್ ಆಗಿದ್ದೀರಿ`
            });
            redirectToDashboard(result.roles[0]);
        } else {
            toast({
                variant: 'destructive',
                title: 'Role ಇಲ್ಲ',
                description: 'ನಿಮಗೆ ಯಾವುದೇ role assign ಆಗಿಲ್ಲ. Admin ಅನ್ನು ಸಂಪರ್ಕಿಸಿ.'
            });
        }
    };
    
    // Handle role selected
    const handleRoleSelected = (role) => {
        toast({
            title: 'ಲಾಗಿನ್ ಯಶಸ್ವಿ!',
            description: `${role.role_type} ಆಗಿ ಲಾಗಿನ್ ಆಗಿದ್ದೀರಿ`
        });
        redirectToDashboard(role);
    };
    
    // Handle errors
    const handleError = (error) => {
        toast({
            variant: 'destructive',
            title: 'ದೋಷ',
            description: error
        });
    };
    
    // Go back
    const goBack = () => {
        switch (step) {
            case STEPS.OTP_VERIFY:
                setStep(STEPS.MOBILE_INPUT);
                break;
            case STEPS.MOBILE_INPUT:
            case STEPS.FACE_SCAN:
            case STEPS.PIN_LOGIN:
                setStep(STEPS.METHOD_SELECT);
                break;
            default:
                setStep(STEPS.METHOD_SELECT);
        }
    };
    
    // Loading state
    if (loading || step === STEPS.LOADING) {
        return <LoadingFallback />;
    }
    
    return (
        <>
            <Helmet>
                <title>{school?.name ? `${school.name} - ಲಾಗಿನ್` : 'ಲಾಗಿನ್'}</title>
            </Helmet>
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 
                          flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    
                    {/* METHOD SELECT */}
                    {step === STEPS.METHOD_SELECT && (
                        <div className="space-y-6">
                            {/* Logo & Title */}
                            <div className="text-center">
                                {school?.logo_url && (
                                    <img 
                                        src={school.logo_url} 
                                        alt={school.name}
                                        className="h-20 w-auto mx-auto mb-4"
                                    />
                                )}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    🔐 ಲಾಗಿನ್ ಮಾಡಿ
                                </h1>
                                <p className="text-gray-600">
                                    {school?.name || 'Jashchar ERP'}
                                </p>
                            </div>
                            
                            {/* Method Cards */}
                            <div className="space-y-3">
                                {/* OTP Login */}
                                <button
                                    onClick={() => handleMethodSelect(LOGIN_METHODS.OTP)}
                                    className="w-full p-4 bg-white rounded-xl border-2 border-gray-200 
                                             hover:border-blue-400 hover:bg-blue-50 transition-all
                                             flex items-center gap-4 text-left group"
                                >
                                    <div className="p-3 bg-blue-500 rounded-xl text-white 
                                                  group-hover:scale-110 transition-transform">
                                        <Smartphone className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="font-semibold text-gray-900 block">
                                            📱 Mobile OTP
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            WhatsApp/SMS ಮೂಲಕ OTP ಪಡೆಯಿರಿ
                                        </span>
                                    </div>
                                    <Sparkles className="h-5 w-5 text-blue-400" />
                                </button>
                                
                                {/* Face Login */}
                                <button
                                    onClick={() => handleMethodSelect(LOGIN_METHODS.FACE)}
                                    className="w-full p-4 bg-white rounded-xl border-2 border-gray-200 
                                             hover:border-purple-400 hover:bg-purple-50 transition-all
                                             flex items-center gap-4 text-left group"
                                >
                                    <div className="p-3 bg-purple-500 rounded-xl text-white
                                                  group-hover:scale-110 transition-transform">
                                        <Scan className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="font-semibold text-gray-900 block">
                                            🤳 Face Scan
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            ಮುಖ ಗುರುತಿಸಿ ಲಾಗಿನ್ ಮಾಡಿ
                                        </span>
                                    </div>
                                    <Fingerprint className="h-5 w-5 text-purple-400" />
                                </button>
                                
                                {/* PIN Login */}
                                <button
                                    onClick={() => handleMethodSelect(LOGIN_METHODS.PIN)}
                                    className="w-full p-4 bg-white rounded-xl border-2 border-gray-200 
                                             hover:border-green-400 hover:bg-green-50 transition-all
                                             flex items-center gap-4 text-left group"
                                >
                                    <div className="p-3 bg-green-500 rounded-xl text-white
                                                  group-hover:scale-110 transition-transform">
                                        <KeyRound className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="font-semibold text-gray-900 block">
                                            🔢 PIN Login
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            6-ಅಂಕಿಯ PIN ಬಳಸಿ ಲಾಗಿನ್ ಮಾಡಿ
                                        </span>
                                    </div>
                                    <Shield className="h-5 w-5 text-green-400" />
                                </button>
                            </div>
                            
                            {/* Security Note */}
                            <p className="text-xs text-center text-gray-400 mt-6">
                                🔒 ನಿಮ್ಮ ಡೇಟಾ ಸುರಕ್ಷಿತವಾಗಿದೆ • 256-bit SSL ಎನ್‌ಕ್ರಿಪ್ಶನ್
                            </p>
                        </div>
                    )}
                    
                    {/* MOBILE INPUT */}
                    {step === STEPS.MOBILE_INPUT && (
                        <div className="space-y-4">
                            <Button
                                variant="ghost"
                                onClick={goBack}
                                className="mb-2"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                ಹಿಂದೆ
                            </Button>
                            
                            <MobileLoginInput
                                onOTPSent={handleOTPSent}
                                onError={handleError}
                                schoolLogo={school?.logo_url}
                                schoolName={school?.name}
                                primaryColor={primaryColor}
                            />
                        </div>
                    )}
                    
                    {/* OTP VERIFY */}
                    {step === STEPS.OTP_VERIFY && otpData && (
                        <OTPVerification
                            mobile={otpData.mobile}
                            displayMobile={otpData.displayMobile}
                            channel={otpData.channel}
                            expiresAt={otpData.expiresAt}
                            canResendAt={otpData.canResendAt}
                            onVerified={handleLoginSuccess}
                            onBack={goBack}
                            onError={handleError}
                            primaryColor={primaryColor}
                        />
                    )}
                    
                    {/* FACE SCAN */}
                    {step === STEPS.FACE_SCAN && (
                        <div className="space-y-4">
                            <Button
                                variant="ghost"
                                onClick={goBack}
                                className="mb-2"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                ಹಿಂದೆ
                            </Button>
                            
                            <FaceScanLogin
                                onLoginSuccess={handleLoginSuccess}
                                onSwitchToOTP={() => handleMethodSelect(LOGIN_METHODS.OTP)}
                                onError={handleError}
                                primaryColor={primaryColor}
                            />
                        </div>
                    )}
                    
                    {/* PIN LOGIN */}
                    {step === STEPS.PIN_LOGIN && (
                        <div className="space-y-4">
                            <Button
                                variant="ghost"
                                onClick={goBack}
                                className="mb-2"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                ಹಿಂದೆ
                            </Button>
                            
                            <PINLogin
                                onLoginSuccess={handleLoginSuccess}
                                onSwitchToOTP={() => handleMethodSelect(LOGIN_METHODS.OTP)}
                                onError={handleError}
                                primaryColor={primaryColor}
                            />
                        </div>
                    )}
                    
                    {/* ROLE SELECT */}
                    {step === STEPS.ROLE_SELECT && authResult && (
                        <RoleSelector
                            user={authResult.user}
                            roles={authResult.roles}
                            onRoleSelected={handleRoleSelected}
                            primaryColor={primaryColor}
                        />
                    )}
                    
                </div>
            </div>
        </>
    );
};

export default LoginV2Page;
