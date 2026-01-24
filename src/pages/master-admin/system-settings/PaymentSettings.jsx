import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Save, Loader2 } from 'lucide-react';

const PaymentSettings = () => {
    const { toast } = useToast();
    const [razorpayKeyId, setRazorpayKeyId] = useState('');
    const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'razorpay_settings')
                .maybeSingle();
            
            if (error) {
                toast({ variant: 'destructive', title: 'Error fetching settings', description: error.message });
            } else if (data) {
                let settings = data.value || {};
                if (typeof settings === 'string') {
                    try { settings = JSON.parse(settings); } catch (e) { console.error("JSON Parse Error", e); }
                }
                
                setRazorpayKeyId(settings.key_id || '');
                setRazorpayKeySecret(settings.key_secret || '');
                if (settings.key_id && settings.key_secret) {
                  setIsActive(true);
                }
            }
            setLoading(false);
        };

        fetchSettings();
    }, [toast]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        
        const settingsPayload = {
            key_id: razorpayKeyId,
            key_secret: razorpayKeySecret
        };

        // Check if row exists to decide between insert or update (though upsert works best)
        const { data, error } = await supabase
            .from('system_settings')
            .upsert({ 
                key: 'razorpay_settings', 
                value: settingsPayload 
            }, { onConflict: 'key' })
            .select();

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to save settings',
                description: error.message,
            });
        } else if (!data || data.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: 'Database policy prevented saving. Please ensure you are logged in as Master Admin.',
            });
        } else {
            toast({ title: 'Success!', description: 'Payment settings saved successfully.' });
            if (razorpayKeyId && razorpayKeySecret) {
                setIsActive(true);
            }
        }
        
        setSaving(false);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Payment Settings</h1>
                    {isActive && <div className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Payment Gateway is Active</div>}
                </div>
                
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Razorpay Credentials</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                <Label htmlFor="razorpay-key-id" className="md:text-right">Razorpay Key Id</Label>
                                <div className="md:col-span-2">
                                    <Input 
                                        id="razorpay-key-id" 
                                        value={razorpayKeyId} 
                                        onChange={(e) => setRazorpayKeyId(e.target.value)} 
                                        required 
                                        placeholder="rzp_test_..."
                                    />
                                </div>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                <Label htmlFor="razorpay-key-secret" className="md:text-right">Razorpay Key Secret</Label>
                                <div className="md:col-span-2">
                                    <Input 
                                        id="razorpay-key-secret" 
                                        type="password" 
                                        value={razorpayKeySecret} 
                                        onChange={(e) => setRazorpayKeySecret(e.target.value)}
                                        required
                                        placeholder="Enter your Razorpay Key Secret"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">This will be stored securely in your database.</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button type="submit" disabled={saving}>
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Settings
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </motion.div>
        </DashboardLayout>
    );
};

export default PaymentSettings;
