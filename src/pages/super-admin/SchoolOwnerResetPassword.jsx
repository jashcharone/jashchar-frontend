import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Save, Loader2 } from 'lucide-react';

const SchoolOwnerResetPassword = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast({ variant: 'destructive', title: 'Passwords do not match!' });
            return;
        }
        if (newPassword.length < 6) {
            toast({ variant: 'destructive', title: 'Password too short', description: 'New password must be at least 6 characters long.' });
            return;
        }

        setLoading(true);
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword,
        });

        if (signInError) {
            toast({ variant: 'destructive', title: 'Authentication failed', description: 'Your current password was incorrect.' });
            setLoading(false);
            return;
        }

        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

        if (updateError) {
            toast({ variant: 'destructive', title: 'Failed to update password', description: updateError.message });
        } else {
            toast({ title: 'Success!', description: 'Your password has been changed.' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
        setLoading(false);
    };

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-foreground mb-8">Change Password</h1>
                <div className="w-full max-w-2xl mx-auto bg-card p-8 rounded-xl shadow-lg border">
                    <form onSubmit={handleChangePassword} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password *</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="pl-10" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password *</Label>
                             <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="pl-10" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password *</Label>
                             <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="pl-10" />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={loading} size="lg">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                                {loading ? 'Updating...' : 'Update Password'}
                            </Button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </DashboardLayout>
    );
};

export default SchoolOwnerResetPassword;
