import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Loader2, Mail, Server, Lock, User, Key } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const EmailSettings = () => {
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        SMTP_HOST: '',
        SMTP_PORT: '',
        SMTP_USERNAME: '',
        SMTP_PASSWORD: '',
        SMTP_SECURE: 'false',
        SMTP_AUTH: 'true',
        EMAIL_FROM_ADDRESS: '',
        EMAIL_FROM_NAME: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('system_settings')
                    .select('value')
                    .eq('key', 'email_config')
                    .single();

                if (error && error.code !== 'PGRST116') throw error; // Ignore not found error

                if (data?.value) {
                    let val = data.value;
                    if (typeof val === 'string') {
                        try { val = JSON.parse(val); } catch (e) {}
                    }
                    setSettings(prev => ({
                        ...prev,
                        ...val
                    }));
                }
            } catch (error) {
                console.error(error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load settings.' });
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [toast]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (name, checked) => {
        setSettings(prev => ({ ...prev, [name]: checked.toString() }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('system_settings')
                .upsert({ 
                    key: 'email_config', 
                    value: settings,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (error) throw error;

            toast({ title: 'Success', description: 'Email settings saved successfully.' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save settings.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Email Settings</h1>
                            <p className="text-muted-foreground mt-2">
                                Configure SMTP settings for system emails (Forgot Password, Notifications, etc.)
                            </p>
                        </div>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </div>

                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Server className="h-5 w-5" />
                                    SMTP Configuration
                                </CardTitle>
                                <CardDescription>
                                    Enter your SMTP server details (e.g., Hostinger, Gmail, SendGrid).
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="SMTP_HOST">SMTP Host</Label>
                                        <Input
                                            id="SMTP_HOST"
                                            name="SMTP_HOST"
                                            value={settings.SMTP_HOST || ''}
                                            onChange={handleChange}
                                            placeholder="smtp.hostinger.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="SMTP_PORT">SMTP Port</Label>
                                        <Input
                                            id="SMTP_PORT"
                                            name="SMTP_PORT"
                                            value={settings.SMTP_PORT || ''}
                                            onChange={handleChange}
                                            placeholder="465 or 587"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="SMTP_USERNAME">SMTP Username</Label>
                                        <div className="relative">
                                            <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="SMTP_USERNAME"
                                                name="SMTP_USERNAME"
                                                value={settings.SMTP_USERNAME || ''}
                                                onChange={handleChange}
                                                className="pl-8"
                                                placeholder="no-reply@yourdomain.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="SMTP_PASSWORD">SMTP Password</Label>
                                        <div className="relative">
                                            <Key className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="SMTP_PASSWORD"
                                                name="SMTP_PASSWORD"
                                                type="password"
                                                value={settings.SMTP_PASSWORD || ''}
                                                onChange={handleChange}
                                                className="pl-8"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <Label>SMTP Secure (SSL/TLS)</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Enable for port 465
                                            </p>
                                        </div>
                                        <Switch
                                            checked={settings.SMTP_SECURE === 'true'}
                                            onCheckedChange={(checked) => handleSwitchChange('SMTP_SECURE', checked)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <Label>SMTP Authentication</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Required for most providers
                                            </p>
                                        </div>
                                        <Switch
                                            checked={settings.SMTP_AUTH === 'true'}
                                            onCheckedChange={(checked) => handleSwitchChange('SMTP_AUTH', checked)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    Sender Information
                                </CardTitle>
                                <CardDescription>
                                    Configure how emails appear to recipients.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="EMAIL_FROM_ADDRESS">From Email Address</Label>
                                        <Input
                                            id="EMAIL_FROM_ADDRESS"
                                            name="EMAIL_FROM_ADDRESS"
                                            value={settings.EMAIL_FROM_ADDRESS || ''}
                                            onChange={handleChange}
                                            placeholder="no-reply@yourdomain.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="EMAIL_FROM_NAME">From Name</Label>
                                        <Input
                                            id="EMAIL_FROM_NAME"
                                            name="EMAIL_FROM_NAME"
                                            value={settings.EMAIL_FROM_NAME || ''}
                                            onChange={handleChange}
                                            placeholder="Jashchar ERP Support"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default EmailSettings;
