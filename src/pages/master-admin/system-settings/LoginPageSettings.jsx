import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, Loader2, FileImage as ImageIcon, Image as LucideImage } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import { Switch } from '@/components/ui/switch';
import { v4 as uuidv4 } from 'uuid';
import MediaSelectorModal from '@/components/front-cms/MediaSelectorModal';

// Reusable config form for consistent data structure
const ConfigForm = ({ config, setConfig, onSave, loading, saving, title }) => {
    const [mediaField, setMediaField] = useState(null);

    const handleMediaSelect = (file) => {
        if (mediaField) {
            // MediaSelectorModal returns object with file_url
            setConfig({ ...config, [mediaField]: file.file_url || file.url });
            setMediaField(null);
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
                        <div className="flex gap-2">
                            <Input 
                                value={config.logo_url || ''} 
                                onChange={(e) => setConfig({...config, logo_url: e.target.value})} 
                                placeholder="https://..." 
                            />
                            <Button variant="outline" size="icon" onClick={() => setMediaField('logo_url')}>
                                <LucideImage className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Transparent PNG recommended.</p>
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
                                <div className="flex gap-2">
                                    <Input 
                                        value={config.background_value || ''} 
                                        onChange={(e) => setConfig({...config, background_value: e.target.value})} 
                                        placeholder="https://..." 
                                    />
                                    <Button variant="outline" size="icon" onClick={() => setMediaField('background_value')}>
                                        <LucideImage className="h-4 w-4" />
                                    </Button>
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

                <MediaSelectorModal 
                    isOpen={!!mediaField} 
                    onClose={() => setMediaField(null)} 
                    onSelect={handleMediaSelect} 
                />
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
