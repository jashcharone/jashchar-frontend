import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Save, Loader2, MessageSquare, Mail, Smartphone, Settings, Send } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import axios from 'axios';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

// Use relative URL - Vercel rewrites /api/* to Railway backend
const API_URL = '/api';

const GatewayConfig = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [settings, setSettings] = useState({
        TWILIO_ACCOUNT_SID: '',
        TWILIO_AUTH_TOKEN: '',
        TWILIO_SMS_FROM: '',
        TWILIO_WHATSAPP_FROM: '',
        TWILIO_WHATSAPP_TEMPLATE_SID: '',
        TWILIO_WHATSAPP_ENABLED: 'false',
        // MSG91 Settings
        MSG91_AUTH_KEY: '',
        MSG91_SENDER_ID: '',
        MSG91_DLT_TE_ID: '', // Template ID for SMS
        MSG91_WHATSAPP_ENABLED: 'false',
        ACTIVE_PROVIDER: 'twilio' // 'twilio' or 'msg91'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testNumber, setTestNumber] = useState('');
    const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
    const [testType, setTestType] = useState('whatsapp'); // 'sms' or 'whatsapp'

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('system_settings')
                    .select('value')
                    .eq('key', 'comm_config')
                    .single();

                if (error && error.code !== 'PGRST116') throw error;

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
            }
            setLoading(false);
        };
        fetchSettings();
    }, [toast]);

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        // Validation
        if (settings.ACTIVE_PROVIDER === 'twilio' && settings.TWILIO_ACCOUNT_SID && !settings.TWILIO_ACCOUNT_SID.startsWith('AC')) {
             toast({ variant: 'destructive', title: 'Invalid Configuration', description: 'Twilio Account SID must start with "AC".' });
             return;
        }
        if (settings.ACTIVE_PROVIDER === 'msg91' && !settings.MSG91_AUTH_KEY) {
             toast({ variant: 'destructive', title: 'Invalid Configuration', description: 'MSG91 Auth Key is required.' });
             return;
        }

        setSaving(true);
        try {
            const payload = { 
                key: 'comm_config', 
                value: settings,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('system_settings')
                .upsert(payload, { onConflict: 'key' });
            
            if (error) throw error;
            
            toast({ title: 'Success', description: 'Communication settings updated successfully.' });
        } catch (error) {
            console.error('Save Error:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
        setSaving(false);
    };

    const handleTestMessage = async () => {
        if (!testNumber) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a phone number.' });
            return;
        }
        
        setTesting(true);
        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token;
            const endpoint = testType === 'whatsapp' ? 'test-whatsapp' : 'test-sms';
            
            const response = await axios.post(`${API_URL}/system-settings/${endpoint}`, {
                provider: settings.ACTIVE_PROVIDER,
                config: settings,
                toNumber: testNumber,
                message: 'Hello! This is a test message from Jashchar ERP.'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast({ title: 'Success', description: `Test ${testType} sent successfully via ${settings.ACTIVE_PROVIDER.toUpperCase()}!` });
                setIsTestDialogOpen(false);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error(error);
            toast({ 
                variant: 'destructive', 
                title: 'Test Failed', 
                description: error.response?.data?.message || error.message || 'Could not send test message.' 
            });
        }
        setTesting(false);
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <form onSubmit={handleSave} className="space-y-8 bg-card p-6 rounded-lg border">
            
            {/* Provider Selection */}
            <div className="space-y-4 border-b pb-6">
                <h3 className="text-lg font-semibold">Active Provider</h3>
                <div className="flex gap-4">
                    <div 
                        className={`p-4 border rounded-lg cursor-pointer flex-1 ${settings.ACTIVE_PROVIDER === 'twilio' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                        onClick={() => handleChange('ACTIVE_PROVIDER', 'twilio')}
                    >
                        <div className="flex items-center gap-2 font-semibold">
                            <div className={`w-4 h-4 rounded-full border ${settings.ACTIVE_PROVIDER === 'twilio' ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                            Twilio
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 ml-6">Global SMS & WhatsApp Provider</p>
                    </div>
                    <div 
                        className={`p-4 border rounded-lg cursor-pointer flex-1 ${settings.ACTIVE_PROVIDER === 'msg91' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                        onClick={() => handleChange('ACTIVE_PROVIDER', 'msg91')}
                    >
                        <div className="flex items-center gap-2 font-semibold">
                            <div className={`w-4 h-4 rounded-full border ${settings.ACTIVE_PROVIDER === 'msg91' ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                            MSG91
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 ml-6">Indian SMS & WhatsApp Provider</p>
                    </div>
                </div>
            </div>

            {/* Twilio Section */}
            {settings.ACTIVE_PROVIDER === 'twilio' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Smartphone className="w-5 h-5" /> Twilio Settings</h3>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" type="button" onClick={() => { setTestType('sms'); setIsTestDialogOpen(true); }}>
                            Test SMS
                        </Button>
                        <Button variant="outline" size="sm" type="button" onClick={() => { setTestType('whatsapp'); setIsTestDialogOpen(true); }}>
                            Test WhatsApp
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Twilio Account SID</Label>
                        <Input value={settings.TWILIO_ACCOUNT_SID} onChange={e => handleChange('TWILIO_ACCOUNT_SID', e.target.value)} placeholder="AC..." />
                    </div>
                    <div>
                        <Label>Twilio Auth Token</Label>
                        <Input type="password" value={settings.TWILIO_AUTH_TOKEN} onChange={e => handleChange('TWILIO_AUTH_TOKEN', e.target.value)} placeholder="Auth Token" />
                    </div>
                    <div>
                        <Label>Twilio SMS From Number</Label>
                        <Input value={settings.TWILIO_SMS_FROM} onChange={e => handleChange('TWILIO_SMS_FROM', e.target.value)} placeholder="+1234567890" />
                    </div>
                    <div>
                        <Label>Twilio WhatsApp From Number</Label>
                        <Input value={settings.TWILIO_WHATSAPP_FROM} onChange={e => handleChange('TWILIO_WHATSAPP_FROM', e.target.value)} placeholder="whatsapp:+1234567890" />
                    </div>
                    <div>
                        <Label>Twilio WhatsApp Template SID (Optional)</Label>
                        <Input value={settings.TWILIO_WHATSAPP_TEMPLATE_SID || ''} onChange={e => handleChange('TWILIO_WHATSAPP_TEMPLATE_SID', e.target.value)} placeholder="HX..." />
                    </div>
                    <div className="flex items-center space-x-2 pt-4">
                        <Switch 
                            checked={settings.TWILIO_WHATSAPP_ENABLED === 'true'} 
                            onCheckedChange={checked => handleChange('TWILIO_WHATSAPP_ENABLED', String(checked))} 
                        />
                        <Label>Enable WhatsApp OTP</Label>
                    </div>
                </div>
            </div>
            )}

            {/* MSG91 Section */}
            {settings.ACTIVE_PROVIDER === 'msg91' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="w-5 h-5" /> MSG91 Settings</h3>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" type="button" onClick={() => { setTestType('sms'); setIsTestDialogOpen(true); }}>
                            Test SMS
                        </Button>
                        <Button variant="outline" size="sm" type="button" onClick={() => { setTestType('whatsapp'); setIsTestDialogOpen(true); }}>
                            Test WhatsApp
                        </Button>
                        <Button variant="secondary" size="sm" type="button" onClick={() => navigate('/master-admin/whatsapp-templates')}>
                            Manage Templates
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <Label>Auth Key</Label>
                        <Input type="password" value={settings.MSG91_AUTH_KEY} onChange={e => handleChange('MSG91_AUTH_KEY', e.target.value)} placeholder="Enter MSG91 Auth Key" />
                        <p className="text-xs text-muted-foreground mt-1">Found in MSG91 Dashboard &gt; API Keys</p>
                    </div>
                    <div>
                        <Label>Sender ID (SMS)</Label>
                        <Input value={settings.MSG91_SENDER_ID} onChange={e => handleChange('MSG91_SENDER_ID', e.target.value)} placeholder="e.g., JASHCH" />
                        <p className="text-xs text-muted-foreground mt-1">6-character Sender ID approved in DLT</p>
                    </div>
                    <div>
                        <Label>DLT Template ID (Default)</Label>
                        <Input value={settings.MSG91_DLT_TE_ID} onChange={e => handleChange('MSG91_DLT_TE_ID', e.target.value)} placeholder="DLT Template ID" />
                        <p className="text-xs text-muted-foreground mt-1">Required for sending SMS in India</p>
                    </div>
                    <div className="flex items-center space-x-2 pt-4">
                        <Switch 
                            checked={settings.MSG91_WHATSAPP_ENABLED === 'true'} 
                            onCheckedChange={checked => handleChange('MSG91_WHATSAPP_ENABLED', String(checked))} 
                        />
                        <Label>Enable WhatsApp Integration</Label>
                    </div>
                </div>
                <div className="bg-muted p-4 rounded-md text-sm">
                    <p className="font-semibold mb-2">Documentation:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>SMS API: <a href="https://docs.msg91.com/sms/send-sms" target="_blank" rel="noreferrer" className="text-primary hover:underline">https://docs.msg91.com/sms/send-sms</a></li>
                        <li>WhatsApp API: <a href="https://docs.msg91.com/whatsapp" target="_blank" rel="noreferrer" className="text-primary hover:underline">https://docs.msg91.com/whatsapp</a></li>
                    </ul>
                </div>
            </div>
            )}

            {/* Test Dialog */}
            <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Test {testType === 'whatsapp' ? 'WhatsApp' : 'SMS'} ({settings.ACTIVE_PROVIDER.toUpperCase()})</DialogTitle>
                        <DialogDescription>
                            Enter a phone number (with country code) to send a test message.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Recipient Number</Label>
                        <Input 
                            placeholder={settings.ACTIVE_PROVIDER === 'msg91' ? "919876543210" : "+919876543210"} 
                            value={testNumber} 
                            onChange={(e) => setTestNumber(e.target.value)} 
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            {settings.ACTIVE_PROVIDER === 'msg91' ? 'For MSG91, use format 919999999999 (No + symbol)' : 'For Twilio, use E.164 format (+91...)'}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsTestDialogOpen(false)}>Cancel</Button>
                        <Button type="button" onClick={handleTestMessage} disabled={testing}>
                            {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Send Test
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Settings
                </Button>
            </div>
        </form>
    );
};

const CommunicationSettings = () => {
    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-foreground mb-8">Communication Settings</h1>
                <Tabs defaultValue="gateway-config" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-md">
                        <TabsTrigger value="gateway-config"><Settings className="w-4 h-4 mr-2" />Gateway Config</TabsTrigger>
                    </TabsList>
                    <TabsContent value="gateway-config" className="mt-6">
                        <GatewayConfig />
                    </TabsContent>
                </Tabs>
            </motion.div>
        </DashboardLayout>
    );
};

export default CommunicationSettings;
