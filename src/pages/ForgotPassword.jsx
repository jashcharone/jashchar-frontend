import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Mail, ArrowRight, CheckCircle, Smartphone, Lock, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import axios from 'axios';

// Use relative URL - Vercel rewrites /api/* to Railway backend
const API_URL = '/api';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Input, 2: OTP, 3: New Password, 4: Success
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('email'); // 'email' or 'mobile'
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const alias = location.pathname.split('/')[1];
  const isSchoolRoute = alias && alias !== 'forgot-password';
  const loginPath = isSchoolRoute ? `/${alias}/login` : '/login';

  // Helper to check if string is email
  const isEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  const isMobile = (str) => /^[0-9+\-\s]{10,}$/.test(str);

  // Handle Input Change with Validation
  const handleInputChange = (e) => {
      const val = e.target.value;
      // If purely numeric, restrict to 10 digits
      if (/^\d+$/.test(val)) {
          if (val.length <= 10) {
              setIdentifier(val);
          }
      } else {
          // Allow other characters (for email or +91 format if user insists, but we prefer 10 digits)
          setIdentifier(val);
      }
  };

  // STEP 1: Identify User & Send OTP/Link
  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEmail(identifier)) {
        setMethod('email');
        // Use Backend API for Email OTP (Unified Flow)
        const response = await axios.post(`${API_URL}/auth/forgot-password`, {
            identifier: identifier,
            channel: 'email'
        });

        if (response.data.otp_sent) {
            toast({ title: "OTP Sent", description: "Please check your Email for the OTP." });
            setStep(2); // Move to OTP Step
        } else {
            throw new Error(response.data.message || 'Failed to send OTP');
        }

      } else if (isMobile(identifier)) {
        setMethod('mobile');
        // Use Backend API for WhatsApp OTP
        const response = await axios.post(`${API_URL}/auth/forgot-password`, {
            identifier: identifier,
            channel: 'whatsapp'
        });

        if (response.data.otp_sent) {
            toast({ title: "OTP Sent", description: "Please check your WhatsApp for the OTP." });
            setStep(2); // Move to OTP Step
        } else {
            throw new Error(response.data.message || 'Failed to send OTP');
        }
      } else {
        toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please enter a valid email or mobile number.' });
      }

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || error.message });
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const response = await axios.post(`${API_URL}/auth/verify-otp`, {
            identifier: identifier,
            otp: otp
        });

        if (response.data.success && response.data.resetToken) {
            setResetToken(response.data.resetToken);
            setStep(3); // Move to New Password Step
            toast({ title: "Verified", description: "OTP verified successfully. Please set a new password." });
        } else {
            throw new Error('Invalid OTP');
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Verification Failed', description: error.response?.data?.message || 'Invalid OTP' });
    } finally {
        setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const response = await axios.post(`${API_URL}/auth/reset-password`, {
            token: resetToken,
            newPassword: newPassword
        });

        toast({ title: "Success", description: "Password reset successfully. You can now login." });
        navigate(loginPath);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Reset Failed', description: error.response?.data?.message || 'Failed to reset password' });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg dark:bg-gray-800"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Verify OTP'}
            {step === 3 && 'Set New Password'}
            {step === 4 && 'Check Email'}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {step === 1 && "Enter your email or mobile number to reset password."}
            {step === 2 && `Enter the OTP sent to your ${method === 'email' ? 'Email' : 'WhatsApp'} (${identifier}).`}
            {step === 3 && "Enter your new password below."}
            {step === 4 && "We have sent a link to your email."}
          </p>
        </div>

        {/* STEP 1: Input Identifier */}
        {step === 1 && (
          <form onSubmit={handleSend} className="space-y-6">
            <div>
              <Label>Email or Mobile Number</Label>
              <div className="mt-1 relative">
                <Input
                  value={identifier}
                  onChange={handleInputChange}
                  placeholder="email@example.com or 10-digit Mobile"
                  required
                  className="pl-10"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Enter your registered Email or 10-digit Mobile Number.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Send OTP
            </Button>
          </form>
        )}

        {/* STEP 2: OTP Input */}
        {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                    <Label>Enter OTP</Label>
                    <div className="mt-1 relative">
                        <Input
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="123456"
                            required
                            className="pl-10 tracking-widest text-lg"
                            maxLength={6}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <KeyRound className="h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Verify OTP
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setStep(1)}>
                    Change Number
                </Button>
            </form>
        )}

        {/* STEP 3: New Password */}
        {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                    <Label>New Password</Label>
                    <div className="mt-1 relative">
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                            className="pl-10"
                            minLength={6}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <SaveIcon className="mr-2 h-4 w-4" />}
                    Reset Password
                </Button>
            </form>
        )}

        {/* STEP 4: Email Success */}
        {step === 4 && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Check your Email</h3>
            <p className="text-gray-600">
                We have sent a password reset link to <strong>{identifier}</strong>. 
                Please check your inbox (and spam folder).
            </p>
            <Button onClick={() => navigate(loginPath)} className="w-full mt-4">
                Back to Login
            </Button>
          </div>
        )}

        {step !== 4 && (
        <div className="text-center">
          <Link to={loginPath} className="text-sm font-medium text-primary hover:text-primary/80">
            Back to Login
          </Link>
        </div>
        )}
      </motion.div>
    </div>
  );
};

// Helper icon
const SaveIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);

export default ForgotPassword;
