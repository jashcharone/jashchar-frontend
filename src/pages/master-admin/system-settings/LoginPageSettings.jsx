import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, Loader2, Image as ImageIcon, Upload, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { v4 as uuidv4 } from 'uuid';

// Reusable config form for consistent data structure
const ConfigForm = ({ config, setConfig, onSave, loading, saving, title }) => {
    const { toast } = useToast();
    const [uploading, setUploading] = useState({});
    const logoInputRef = useRef(null);
    const bgInputRef = useRef(null);

    // Direct upload to platform-files bucket for Master Admin
    const handleDirectUpload = async (file, fieldName) => {
        if (!file) return;
        
        setUploading(prev => ({ ...prev, [fieldName]: true }));
        try {
            const fileExt = file.name.split('.').pop();
            const uniqueName = `login-assets/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('platform-files')
                .upload(uniqueName, file, { 
                    upsert: true,
                    contentType: file.type 
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('platform-files')
                .getPublicUrl(uniqueName);

            setConfig({ ...config, [fieldName]: publicUrl });
            toast({ title: 'Success', description: 'Image uploaded successfully!' });
        } catch (error) {
            console.error('Upload error:', error);
            toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
        } finally {
            setUploading(prev => ({ ...prev, [fieldName]: false }));
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Configure the visual appearance of the login page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Page Title</Label>
                        <Input 
                            value={config.title || ''} 
                            onChange={(e) => setConfig({...config, title: e.target.value})} 
                            placeholder="e.g. Welcome to School Name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Subtitle / Tagline</Label>
                        <Input 
                            value={config.subtitle || ''} 
                            onChange={(e) => setConfig({...config, subtitle: e.target.value})} 
                            placeholder="e.g. Sign in to continue"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Company Name</Label>
                        <Input 
                            value={config.company_name || ''} 
                            onChange={(e) => setConfig({...config, company_name: e.target.value})} 
                            placeholder="e.g. Jashchar ERP"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Company Address</Label>
                        <Input 
                            value={config.company_address || ''} 
                            onChange={(e) => setConfig({...config, company_address: e.target.value})} 
                            placeholder="e.g. 123 Education St..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Brand Logo</Label>
                        <div className="space-y-3">
                            {/* Preview */}
                            {config.logo_url && (
                                <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    <img src={config.logo_url} alt="Logo Preview" className="w-full h-full object-contain" />
                                    <Button 
                                        variant="destructive" 
                                        size="icon" 
                                        className="absolute top-1 right-1 h-6 w-6"
                                        onClick={() => setConfig({...config, logo_url: ''})}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                            {/* Upload Button */}
                            <div className="flex gap-2">
                                <input 
                                    type="file" 
                                    ref={logoInputRef}
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handleDirectUpload(e.target.files[0], 'logo_url')}
                                />
                                <Button 
                                    variant="outline" 
                                    onClick={() => logoInputRef.current?.click()}
                                    disabled={uploading.logo_url}
                                    className="flex-1"
                                >
                                    {uploading.logo_url ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Upload className="mr-2 h-4 w-4" />
                                    )}
                                    {uploading.logo_url ? 'Uploading...' : 'Upload Logo'}
                                </Button>
                            </div>
                            {/* Manual URL */}
                            <Input 
                                value={config.logo_url || ''} 
                                onChange={(e) => setConfig({...config, logo_url: e.target.value})} 
                                placeholder="Or paste image URL..." 
                                className="text-xs"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Transparent PNG recommended.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Accent Color</Label>
                        <div className="flex gap-2">
                            <Input 
                                type="color" 
                                value={config.accent_color || '#2563eb'} 
                                onChange={(e) => setConfig({...config, accent_color: e.target.value})} 
                                className="w-12 h-10 p-1"
                            />
                            <Input 
                                value={config.accent_color || '#2563eb'} 
                                onChange={(e) => setConfig({...config, accent_color: e.target.value})} 
                                className="flex-1"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold flex items-center"><ImageIcon className="h-4 w-4 mr-2"/> Background Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Background Style</Label>
                            <Select 
                                value={config.background_type || 'gradient'} 
                                onValueChange={(val) => setConfig({...config, background_type: val})}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gradient">CSS Gradient</SelectItem>
                                    <SelectItem value="image">Custom Image</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {config.background_type === 'gradient' ? (
                            <div className="space-y-2">
                                <Label>Gradient CSS Value</Label>
                                <Textarea 
                                    value={config.background_value || ''} 
                                    onChange={(e) => setConfig({...config, background_value: e.target.value})} 
                                    placeholder="linear-gradient(...)"
                                    className="font-mono text-xs"
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Background Image</Label>
                                <div className="space-y-3">
                                    {/* Preview */}
                                    {config.background_value && (
                                        <div className="relative w-full h-32 border rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                                            <img src={config.background_value} alt="Background Preview" className="w-full h-full object-cover" />
                                            <Button 
                                                variant="destructive" 
                                                size="icon" 
                                                className="absolute top-1 right-1 h-6 w-6"
                                                onClick={() => setConfig({...config, background_value: ''})}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                    {/* Upload Button */}
                                    <div className="flex gap-2">
                                        <input 
                                            type="file" 
                                            ref={bgInputRef}
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={(e) => handleDirectUpload(e.target.files[0], 'background_value')}
                                        />
                                        <Button 
                                            variant="outline" 
                                            onClick={() => bgInputRef.current?.click()}
                                            disabled={uploading.background_value}
                                            className="flex-1"
                                        >
                                            {uploading.background_value ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Upload className="mr-2 h-4 w-4" />
                                            )}
                                            {uploading.background_value ? 'Uploading...' : 'Upload Background'}
                                        </Button>
                                    </div>
                                    {/* Manual URL */}
                                    <Input 
                                        value={config.background_value || ''} 
                                        onChange={(e) => setConfig({...config, background_value: e.target.value})} 
                                        placeholder="Or paste image URL..." 
                                        className="text-xs"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                     <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Social Login Buttons</Label>
                            <p className="text-sm text-muted-foreground">Show options for Google/Microsoft login.</p>
                        </div>
                        <Switch 
                            checked={config.show_social_login || false} 
                            onCheckedChange={(checked) => setConfig({...config, show_social_login: checked})}
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={onSave} disabled={saving} className="w-full md:w-auto">
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Configuration
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

const LoginPageSettings = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Default Structure
    const defaultConfig = {
        title: 'Welcome Back',
        subtitle: 'Sign in to your account',
        company_name: 'Jashchar ERP',
        company_address: '123 Education St, Tech City, Cloud State, 10101',
        logo_url: '',
        background_type: 'gradient',
        background_value: 'linear-gradient(to right bottom, #1e293b, #0f172a, #020617)',
        accent_color: '#3b82f6',
        show_social_login: true
    };

    const [masterConfig, setMasterConfig] = useState(defaultConfig);

    // Load Master Config
    useEffect(() => {
        const loadMaster = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'login_page_config')
                .maybeSingle();
            
            if (data?.value) {
                let val = data.value;
                if (typeof val === 'string') {
                    try { 
                        val = JSON.parse(val); 
                    } catch (e) { 
                        console.error("JSON Parse Error", e); 
                        val = null;
                    }
                }
                if (val && typeof val === 'object' && !Array.isArray(val)) {
                    setMasterConfig(prev => ({ ...prev, ...val }));
                }
            }
            setLoading(false);
        };
        loadMaster();
    }, []);

    const saveMaster = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('system_settings')
            .upsert({ key: 'login_page_config', value: masterConfig }, { onConflict: 'key' });
        
        if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
        else toast({ title: 'Saved', description: 'Master login settings updated.' });
        setSaving(false);
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Login Page Customizer</h1>
            </div>

            <ConfigForm 
                config={masterConfig} 
                setConfig={setMasterConfig} 
                onSave={saveMaster} 
                loading={loading}
                saving={saving}
                title="Master Admin Login Config"
            />
        </DashboardLayout>
    );
};

export default LoginPageSettings;
