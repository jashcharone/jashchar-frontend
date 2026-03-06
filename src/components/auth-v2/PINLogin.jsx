/**
 * PIN LOGIN COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 6-digit PIN login with mobile number
 * 
 * Features:
 * - Mobile number input
 * - 6-digit PIN input (masked)
 * - Quick login for returning users
 * - Option to switch to OTP
 * 
 * Created: March 5, 2026
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
    Lock, Smartphone, Eye, EyeOff, Loader2, 
    ArrowRight, KeyRound, MessageCircle
} from 'lucide-react';
import { loginWithPin } from '@/services/unifiedAuthV2Service';

const PINLogin = ({
    onLoginSuccess,
    onSwitchToOTP,
    onError,
    savedMobile,
    primaryColor = '#3b82f6'
}) => {
    const [mobile, setMobile] = useState(savedMobile || '');
    const [pin, setPin] = useState(['', '', '', '', '', '']);
    const [showPin, setShowPin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const mobileRef = useRef(null);
    const pinRefs = useRef([]);
    
    // Auto-focus
    useEffect(() => {
        if (savedMobile) {
            pinRefs.current[0]?.focus();
        } else {
            mobileRef.current?.focus();
        }
    }, [savedMobile]);
    
    // Format mobile number
    const formatMobile = (value) => {
        let digits = value.replace(/\D/g, '');
        if (digits.length > 10) {
            digits = digits.slice(-10);
        }
        if (digits.length > 5) {
            return digits.slice(0, 5) + ' ' + digits.slice(5);
        }
        return digits;
    };
    
    const handleMobileChange = (e) => {
        const formatted = formatMobile(e.target.value);
        setMobile(formatted);
        setError('');
    };
    
    const getRawMobile = () => {
        return mobile.replace(/\D/g, '');
    };
    
    const isValidMobile = () => {
        return getRawMobile().length === 10;
    };
    
    // Handle PIN digit input
    const handlePinChange = (index, value) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        
        const newPin = [...pin];
        newPin[index] = digit;
        setPin(newPin);
        setError('');
        
        // Auto-focus next
        if (digit && index < 5) {
            pinRefs.current[index + 1]?.focus();
        }
        
        // Auto-submit when complete
        if (digit && index === 5) {
            const fullPin = newPin.join('');
            if (fullPin.length === 6 && isValidMobile()) {
                handleLogin(fullPin);
            }
        }
    };
    
    // Handle backspace
    const handlePinKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            pinRefs.current[index - 1]?.focus();
        }
    };
    
    // Handle paste
    const handlePinPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        
        if (pastedData.length === 6) {
            const newPin = pastedData.split('');
            setPin(newPin);
            pinRefs.current[5]?.focus();
            
            if (isValidMobile()) {
                handleLogin(pastedData);
            }
        }
    };
    
    // Login
    const handleLogin = async (pinString = null) => {
        const pinCode = pinString || pin.join('');
        
        if (!isValidMobile()) {
            setError('ದಯವಿಟ್ಟು 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ನಂಬರ್ ನಮೂದಿಸಿ');
            return;
        }
        
        if (pinCode.length !== 6) {
            setError('ದಯವಿಟ್ಟು 6 ಅಂಕಿಯ PIN ನಮೂದಿಸಿ');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const result = await loginWithPin('+91' + getRawMobile(), pinCode);
            
            if (result.success) {
                onLoginSuccess({
                    user: result.user,
                    token: result.token,
                    roles: result.roles
                });
            } else {
                setError(result.error || 'ಲಾಗಿನ್ ವಿಫಲವಾಯಿತು');
                setPin(['', '', '', '', '', '']);
                pinRefs.current[0]?.focus();
                onError?.(result.error);
            }
        } catch (err) {
            const errorMsg = err.message || 'ಲಾಗಿನ್ ವಿಫಲವಾಯಿತು';
            setError(errorMsg);
            setPin(['', '', '', '', '', '']);
            pinRefs.current[0]?.focus();
            onError?.(errorMsg);
        } finally {
            setLoading(false);
        }
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        handleLogin();
    };
    
    return (
        <Card className="w-full max-w-md mx-auto shadow-xl border-0">
            <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 
                              rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="h-8 w-8 text-white" />
                </div>
                
                <CardTitle className="text-2xl font-bold">
                    PIN ಲಾಗಿನ್
                </CardTitle>
                <CardDescription className="text-base">
                    ನಿಮ್ಮ ಮೊಬೈಲ್ ಮತ್ತು 6-ಅಂಕಿಯ PIN ನಮೂದಿಸಿ
                </CardDescription>
            </CardHeader>
            
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Mobile Input */}
                    <div className="space-y-2">
                        <Label htmlFor="pin-mobile" className="text-sm font-medium">
                            📱 ಮೊಬೈಲ್ ನಂಬರ್
                        </Label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500 font-medium">
                                <span className="text-lg">🇮🇳</span>
                                <span>+91</span>
                            </div>
                            <Input
                                ref={mobileRef}
                                id="pin-mobile"
                                type="tel"
                                value={mobile}
                                onChange={handleMobileChange}
                                placeholder="98765 43210"
                                className="pl-20 h-12"
                                maxLength={11}
                                disabled={loading}
                            />
                            <Smartphone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                    
                    {/* PIN Input */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">
                                🔐 6-ಅಂಕಿಯ PIN
                            </Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPin(!showPin)}
                                className="text-xs"
                            >
                                {showPin ? (
                                    <>
                                        <EyeOff className="h-3 w-3 mr-1" />
                                        ಮರೆಮಾಡಿ
                                    </>
                                ) : (
                                    <>
                                        <Eye className="h-3 w-3 mr-1" />
                                        ತೋರಿಸಿ
                                    </>
                                )}
                            </Button>
                        </div>
                        
                        <div className="flex justify-center gap-2">
                            {pin.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => pinRefs.current[index] = el}
                                    type={showPin ? 'text' : 'password'}
                                    inputMode="numeric"
                                    value={digit}
                                    onChange={(e) => handlePinChange(index, e.target.value)}
                                    onKeyDown={(e) => handlePinKeyDown(index, e)}
                                    onPaste={index === 0 ? handlePinPaste : undefined}
                                    className={`w-11 h-12 text-center text-xl font-bold border-2 rounded-lg 
                                        focus:outline-none focus:ring-2 transition-all
                                        ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                               : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'}
                                        ${loading ? 'bg-gray-100' : 'bg-white'}`}
                                    disabled={loading}
                                    maxLength={1}
                                />
                            ))}
                        </div>
                    </div>
                    
                    {/* Error Message */}
                    {error && (
                        <p className="text-sm text-red-500 text-center flex items-center justify-center gap-1">
                            ⚠️ {error}
                        </p>
                    )}
                    
                    {/* Login Button */}
                    <Button
                        type="submit"
                        className="w-full h-12 text-lg font-semibold"
                        style={{ backgroundColor: primaryColor }}
                        disabled={loading || !isValidMobile() || pin.join('').length !== 6}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ಲಾಗಿನ್ ಆಗುತ್ತಿದೆ...
                            </>
                        ) : (
                            <>
                                <Lock className="mr-2 h-5 w-5" />
                                ಲಾಗಿನ್ ಮಾಡಿ
                            </>
                        )}
                    </Button>
                    
                    {/* Switch to OTP */}
                    <div className="text-center pt-4 border-t">
                        <p className="text-sm text-gray-500 mb-2">
                            PIN ಮರೆತಿರಾ?
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onSwitchToOTP}
                            className="w-full"
                        >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            OTP ಮೂಲಕ ಲಾಗಿನ್ ಮಾಡಿ
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default PINLogin;
