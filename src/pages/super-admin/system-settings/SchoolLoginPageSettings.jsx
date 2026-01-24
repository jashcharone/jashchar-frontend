import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, Loader2, FileImage as ImageIcon } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import { Switch } from '@/components/ui/switch';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const SchoolLoginPageSettings = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [branchId, setSchoolId] = useState(null);

    const defaultConfig = {
        title: 'Welcome Back',
        subtitle: 'Sign in to your account',
        logo_url: '',
        background_type: 'gradient',
        background_value: 'linear-gradient(to right bottom, #1e293b, #0f172a, #020617)',
        accent_color: '#3b82f6',
        show_social_login: false,
        slider_image_1: '',
        slider_image_2: '',
        slider_image_3: ''
    };

    const [config, setConfig] = useState(defaultConfig);

    useEffect(() => {
        const fetchSchoolId = async () => {
            if (!user) return;
            // Assuming user metadata has branch_id or we fetch it
            const { data: schoolData } = await supabase
                .from('schools')
                .select('id')
                .eq('owner_id', user.id)
                .maybeSingle();
            
            if (schoolData) {
                setSchoolId(schoolData.id);
            } else {
                // Fallback: Check if user is staff/admin linked to a school
                const { data: staffData } = await supabase
                    .from('staff')
                    .select('branch_id')
                    .eq('user_id', user.id)
                    .maybeSingle();
                if (staffData) setSchoolId(staffData.branch_id);
            }
        };
        fetchSchoolId();
    }, [user]);

    useEffect(() => {
        const loadConfig = async () => {
            if (!branchId) return;
            setLoading(true);
            const { data } = await supabase
                .from('login_page_settings')
                .select('setting_value')
                .eq('branch_id', branchId)
                .eq('setting_key', 'school_login_config')
                .maybeSingle();
            
            if (data?.setting_value) {
                setConfig(prev => ({ ...prev, ...data.setting_value }));
            }
            setLoading(false);
        };
        loadConfig();
    }, [branchId]);

    const uploadFile = async (file) => {
        if (!file) return null;
        const fileName = `${uuidv4()}-${file.name}`;
        const { data, error } = await supabase.storage.from('school-logos').upload(fileName, file);
        if (error) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
            return null;
        }
        const { data: { publicUrl } } = supabase.storage.from('school-logos').getPublicUrl(data.path);
        return publicUrl;
    };

    const handleLogoUpload = async (file) => {
        const url = await uploadFile(file);
        if (url) setConfig({ ...config, logo_url: url });
    };

    const handleBgUpload = async (file) => {
        const url = await uploadFile(file);
        if (url) setConfig({ ...config, background_value: url, background_type: 'image' });
    };

    const handleSliderUpload = async (file, index) => {
        const url = await uploadFile(file);
        if (url) setConfig({ ...config, [`slider_image_${index}`]: url });
    };

    const handleSave = async () => {
        if (!branchId) return;
        setSaving(true);
        const { error } = await supabase
            .from('login_page_settings')
            .upsert({ branch_id: branchId, setting_key: 'school_login_config', setting_value: config }, { onConflict: 'branch_id, setting_key' });

        if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
        else toast({ title: 'Saved', description: 'Login page settings updated successfully.' });
        setSaving(false);
    };

    if (!branchId && !loading) return <div className="p-8">Loading school information...</div>;

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Login Page Settings</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Customize Login Experience</CardTitle>
                    <CardDescription>Configure how your students and staff see the login page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Page Title</Label>
                                    <Input 
                                        value={config.title || ''} 
                                        onChange={(e) => setConfig({...config, title: e.target.value})} 
                                        placeholder="e.g. Welcome to Our School"
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
                                    <Label>School Logo</Label>
                                    <ImageUploader onFileChange={handleLogoUpload} initialPreview={config.logo_url} />
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
                                                <SelectItem value="slider">Image Slider</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    {config.background_type === 'gradient' && (
                                        <div className="space-y-2">
                                            <Label>Gradient CSS Value</Label>
                                            <Textarea 
                                                value={config.background_value || ''} 
                                                onChange={(e) => setConfig({...config, background_value: e.target.value})} 
                                                placeholder="linear-gradient(...)"
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                    )}

                                    {config.background_type === 'image' && (
                                        <div className="space-y-2">
                                            <Label>Background Image</Label>
                                            <ImageUploader onFileChange={handleBgUpload} initialPreview={config.background_value} />
                                        </div>
                                    )}
                                </div>

                                {config.background_type === 'slider' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                        <div className="space-y-2">
                                            <Label>Slide 1</Label>
                                            <ImageUploader onFileChange={(f) => handleSliderUpload(f, 1)} initialPreview={config.slider_image_1} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Slide 2</Label>
                                            <ImageUploader onFileChange={(f) => handleSliderUpload(f, 2)} initialPreview={config.slider_image_2} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Slide 3</Label>
                                            <ImageUploader onFileChange={(f) => handleSliderUpload(f, 3)} initialPreview={config.slider_image_3} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Settings
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default SchoolLoginPageSettings;
