import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, Key, Loader2, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
           // Handled by default. No specific action needed here.
        }
    });

    return () => {
        subscription.unsubscribe();
    };
  }, []);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Passwords do not match.' });
      return;
    }
    if (password.length < 6) {
      toast({ variant: 'destructive', title: 'Error', description: 'Password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      if (error.message?.includes("Session from session_id claim in JWT does not exist") || error.code === 403) {
        toast({ variant: 'destructive', title: 'Session Expired', description: 'Please request a new password reset link.' });
        navigate('/login');
        return;
      }
      toast({ variant: 'destructive', title: 'Error resetting password', description: error.message });
      setMessage('Failed to reset password. The link might be expired or invalid.');
    } else {
      setMessage('Your password has been successfully reset. You will be redirected to login shortly.');
      toast({ title: 'Success!', description: 'Password updated successfully.', className: 'bg-green-500 text-white' });
      setTimeout(() => navigate('/login'), 4000);
    }

    setLoading(false);
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')",
      }}
    >
        <div className="absolute inset-0 bg-black/60"></div>
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-card/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-foreground border"
        >
        <div className="text-center mb-8">
            <Key className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold">Set a New Password</h1>
            <p className="text-muted-foreground mt-2">Create a strong, new password for your account.</p>
        </div>

        {message ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
          >
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
            <p className="text-green-300">{message}</p>
          </motion.div>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New Password"
                required
                className="pl-10 h-12"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                required
                className="pl-10 h-12"
              />
            </div>
            <Button
              type="submit"
              className="w-full text-base font-semibold py-3 h-12"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
            <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center group"
            >
                <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                Back to Login
            </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
