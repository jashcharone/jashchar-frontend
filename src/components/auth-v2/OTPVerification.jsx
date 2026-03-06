/**
 * OTP VERIFICATION COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 6-digit OTP input with auto-focus and verification
 * 
 * Features:
 * - Individual digit boxes
 * - Auto-focus to next box
 * - Paste support
 * - Countdown timer for resend
 * - Beautiful animations
 * 
 * Created: March 5, 2026
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, CheckCircle, RefreshCw } from 'lucide-react';
import { verifyOTP, sendOTP } from '@/services/unifiedAuthV2Service';

const OTPVerification = ({
    mobile,
    displayMobile,
    channel,
    expiresAt,
    canResendAt,
    onVerified,
    onBack,
    onError,
    primaryColor = '#3b82f6'
}) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(0);
    const inputRefs = useRef([]);
    
    // Initialize refs array
    useEffect(() => {
        inputRefs.current = inputRefs.current.slice(0, 6);
    }, []);
    
    // Auto-focus first input
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);
    
    // Resend countdown timer
    useEffect(() => {
        if (canResendAt) {
            const canResendTime = new Date(canResendAt).getTime();
            const updateTimer = () => {
                const now = Date.now();
                const remaining = Math.max(0, Math.ceil((canResendTime - now) / 1000));
                setResendTimer(remaining);
            };
            
            updateTimer();
            const interval = setInterval(updateTimer, 1000);
            
            return () => clearInterval(interval);
        }
    }, [canResendAt]);
    
    // Handle single digit input
    const handleChange = (index, value) => {
        // Only allow digits
        const digit = value.replace(/\D/g, '').slice(-1);
        
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);
        setError('');
        
        // Auto-focus next input
        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
        
        // Auto-submit when all 6 digits entered
        if (digit && index === 5) {
            const fullOtp = newOtp.join('');
            if (fullOtp.length === 6) {
                handleVerify(fullOtp);
            }
        }
    };
    
    // Handle paste
    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        
        if (pastedData.length === 6) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            inputRefs.current[5]?.focus();
            handleVerify(pastedData);
        }
    };
    
    // Handle backspace
    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };
    
    // Verify OTP
    const handleVerify = async (otpString = null) => {
        const otpCode = otpString || otp.join('');
        
        if (otpCode.length !== 6) {
            setError('ದಯವಿಟ್ಟು 6 ಅಂಕಿಯ OTP ನಮೂದಿಸಿ');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const result = await verifyOTP(mobile, otpCode);
            
            if (result.success) {
                onVerified({
                    user: result.user,
                    token: result.token,
                    roles: result.roles,
                    isNewUser: result.isNewUser,
                    requiresProfile: result.requiresProfile
                });
            } else {
                setError(result.error || 'Invalid OTP');
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
                onError?.(result.error);
            }
        } catch (err) {
            const errorMsg = err.message || 'Verification failed';
            setError(errorMsg);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            onError?.(errorMsg);
        } finally {
            setLoading(false);
        }
    };
    
    // Resend OTP
    const handleResend = async () => {
        if (resendTimer > 0) return;
        
        setResending(true);
        setError('');
        
        try {
            const result = await sendOTP(mobile, 'login', channel);
            
            if (result.success) {
                setResendTimer(60); // Reset to 60 seconds
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            } else {
                setError(result.error || 'Resend failed');
            }
        } catch (err) {
            setError(err.message || 'Resend failed');
        } finally {
            setResending(false);
        }
    };
    
    return (
        <Card className="w-full max-w-md mx-auto shadow-xl border-0">
            <CardHeader className="text-center pb-2">
                <div className="flex items-center mb-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="mr-auto"
                        disabled={loading}
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        ಹಿಂದೆ
                    </Button>
                </div>
                
                <div className="text-5xl mb-2">🔐</div>
                
                <CardTitle className="text-2xl font-bold">
                    OTP ನಮೂದಿಸಿ
                </CardTitle>
                <CardDescription className="text-base">
                    <span className="font-medium text-gray-700">{displayMobile}</span>
                    <br />
                    ಗೆ {channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} ಮೂಲಕ OTP ಕಳುಹಿಸಲಾಗಿದೆ
                </CardDescription>
            </CardHeader>
            
            <CardContent>
                <div className="space-y-6">
                    {/* OTP Input Boxes */}
                    <div className="flex justify-center gap-2">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => inputRefs.current[index] = el}
                                type="text"
                                inputMode="numeric"
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={index === 0 ? handlePaste : undefined}
                                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg 
                                    focus:outline-none focus:ring-2 transition-all
                                    ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                           : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'}
                                    ${loading ? 'bg-gray-100' : 'bg-white'}`}
                                disabled={loading}
                                maxLength={1}
                            />
                        ))}
                    </div>
                    
                    {/* Error Message */}
                    {error && (
                        <p className="text-sm text-red-500 text-center flex items-center justify-center gap-1">
                            ⚠️ {error}
                        </p>
                    )}
                    
                    {/* Verify Button */}
                    <Button
                        onClick={() => handleVerify()}
                        className="w-full h-12 text-lg font-semibold"
                        style={{ backgroundColor: primaryColor }}
                        disabled={loading || otp.join('').length !== 6}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ಪರಿಶೀಲಿಸುತ್ತಿದೆ...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-5 w-5" />
                                OTP ಪರಿಶೀಲಿಸಿ
                            </>
                        )}
                    </Button>
                    
                    {/* Resend OTP */}
                    <div className="text-center">
                        {resendTimer > 0 ? (
                            <p className="text-sm text-gray-500">
                                🕐 {resendTimer} ಸೆಕೆಂಡ್ ನಂತರ ಮತ್ತೆ ಕಳುಹಿಸಬಹುದು
                            </p>
                        ) : (
                            <Button
                                variant="ghost"
                                onClick={handleResend}
                                disabled={resending}
                                className="text-blue-600 hover:text-blue-700"
                            >
                                {resending ? (
                                    <>
                                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                        ಕಳುಹಿಸುತ್ತಿದೆ...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="mr-1 h-4 w-4" />
                                        OTP ಮತ್ತೆ ಕಳುಹಿಸಿ
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
                
                {/* Help Text */}
                <div className="mt-6 pt-4 border-t">
                    <p className="text-xs text-gray-400 text-center">
                        💡 OTP ಬರಲಿಲ್ಲವೇ? Spam/Junk folder ಪರಿಶೀಲಿಸಿ ಅಥವಾ 
                        ಮತ್ತೆ ಕಳುಹಿಸಿ ಒತ್ತಿ
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default OTPVerification;
