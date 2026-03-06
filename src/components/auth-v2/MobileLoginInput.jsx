/**
 * MOBILE LOGIN COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * Mobile number input with OTP request
 * 
 * Features:
 * - Indian mobile format (+91)
 * - Auto-formatting
 * - WhatsApp/SMS channel selection
 * - Beautiful UI with animations
 * 
 * Created: March 5, 2026
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Smartphone, MessageCircle, Send, Loader2, ArrowRight } from 'lucide-react';
import { sendOTP } from '@/services/unifiedAuthV2Service';

const MobileLoginInput = ({ 
    onOTPSent, 
    onError,
    schoolLogo,
    schoolName,
    primaryColor = '#3b82f6'
}) => {
    const [mobile, setMobile] = useState('');
    const [channel, setChannel] = useState('whatsapp'); // 'whatsapp' | 'sms'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef(null);
    
    useEffect(() => {
        // Auto-focus input
        inputRef.current?.focus();
    }, []);
    
    // Format mobile number as user types
    const formatMobile = (value) => {
        // Remove all non-digits
        let digits = value.replace(/\D/g, '');
        
        // Limit to 10 digits (Indian mobile)
        if (digits.length > 10) {
            digits = digits.slice(-10);
        }
        
        // Format as XXXXX XXXXX
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
        const raw = getRawMobile();
        return raw.length === 10;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isValidMobile()) {
            setError('ದಯವಿಟ್ಟು 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ನಂಬರ್ ನಮೂದಿಸಿ');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const result = await sendOTP('+91' + getRawMobile(), 'login', channel);
            
            if (result.success) {
                onOTPSent({
                    mobile: '+91' + getRawMobile(),
                    displayMobile: mobile,
                    channel: channel,
                    isNewUser: result.isNewUser,
                    expiresAt: result.expiresAt,
                    canResendAt: result.canResendAt
                });
            } else {
                setError(result.error || 'OTP ಕಳುಹಿಸಲು ವಿಫಲವಾಯಿತು');
                onError?.(result.error);
            }
        } catch (err) {
            const errorMsg = err.message || 'ಏನೋ ತಪ್ಪಾಗಿದೆ, ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ';
            setError(errorMsg);
            onError?.(errorMsg);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Card className="w-full max-w-md mx-auto shadow-xl border-0">
            <CardHeader className="text-center pb-2">
                {schoolLogo && (
                    <img 
                        src={schoolLogo} 
                        alt={schoolName || 'School Logo'} 
                        className="h-16 w-auto mx-auto mb-4"
                    />
                )}
                <CardTitle className="text-2xl font-bold">
                    🔐 ಲಾಗಿನ್ ಮಾಡಿ
                </CardTitle>
                <CardDescription className="text-base">
                    ನಿಮ್ಮ ಮೊಬೈಲ್ ನಂಬರ್ ನಮೂದಿಸಿ
                </CardDescription>
            </CardHeader>
            
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Mobile Number Input */}
                    <div className="space-y-2">
                        <Label htmlFor="mobile" className="text-sm font-medium">
                            📱 ಮೊಬೈಲ್ ನಂಬರ್
                        </Label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500 font-medium">
                                <span className="text-lg">🇮🇳</span>
                                <span>+91</span>
                            </div>
                            <Input
                                ref={inputRef}
                                id="mobile"
                                type="tel"
                                value={mobile}
                                onChange={handleMobileChange}
                                placeholder="98765 43210"
                                className="pl-20 h-14 text-lg tracking-wider"
                                maxLength={11} // 10 digits + 1 space
                                disabled={loading}
                                autoComplete="tel"
                            />
                            <Smartphone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        </div>
                        {error && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                ⚠️ {error}
                            </p>
                        )}
                    </div>
                    
                    {/* Channel Selection */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            📨 OTP ಎಲ್ಲಿ ಬೇಕು?
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setChannel('whatsapp')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                                    channel === 'whatsapp'
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                disabled={loading}
                            >
                                <MessageCircle className="h-5 w-5" />
                                <span className="font-medium">WhatsApp</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setChannel('sms')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                                    channel === 'sms'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                disabled={loading}
                            >
                                <Send className="h-5 w-5" />
                                <span className="font-medium">SMS</span>
                            </button>
                        </div>
                    </div>
                    
                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className="w-full h-12 text-lg font-semibold"
                        style={{ backgroundColor: primaryColor }}
                        disabled={loading || !isValidMobile()}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                OTP ಕಳುಹಿಸುತ್ತಿದೆ...
                            </>
                        ) : (
                            <>
                                OTP ಕಳುಹಿಸಿ
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </Button>
                </form>
                
                {/* Help Text */}
                <div className="mt-6 pt-4 border-t">
                    <p className="text-sm text-gray-500 text-center">
                        💡 Parent ಆಗಿದ್ದರೆ, ನಿಮ್ಮ ಮೊಬೈಲ್ ನಂಬರ್ ನಮೂದಿಸಿ.
                        <br />
                        Student/Teacher ಆಗಿದ್ದರೂ ಸಹ ಇದೇ ನಂಬರ್ ಬಳಸಿ.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default MobileLoginInput;
