import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2, Settings, CreditCard, UserCog, Hash, Building2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// ID Auto Generation Settings Tab
const IdAutoGenerationSettings = ({ settings, handleChange }) => (
    <div className="space-y-6">
        {/* Student Admission No */}
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                        <Hash className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Student Admission No. Auto Generation</CardTitle>
                        <CardDescription>Configure automatic admission number generation for students</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <Label className="font-medium">Auto Admission No.</Label>
                    <RadioGroup 
                        value={String(settings.student_admission_no_auto_generation)} 
                        onValueChange={(val) => handleChange('student_admission_no_auto_generation', val === 'true')} 
                        className="flex gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id="stud-ad-dis" />
                            <Label htmlFor="stud-ad-dis" className="font-normal cursor-pointer">Disabled</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id="stud-ad-en" />
                            <Label htmlFor="stud-ad-en" className="font-normal cursor-pointer">Enabled</Label>
                        </div>
                    </RadioGroup>
                </div>
                {settings.student_admission_no_auto_generation && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="stud-prefix">Admission No. Prefix</Label>
                            <Input id="stud-prefix" placeholder="e.g., STU" value={settings.student_admission_no_prefix || ''} onChange={(e) => handleChange('student_admission_no_prefix', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stud-digit">Admission No. Digit</Label>
                            <Select value={String(settings.student_admission_no_digit || '')} onValueChange={(v) => handleChange('student_admission_no_digit', parseInt(v))}>
                                <SelectTrigger><SelectValue placeholder="Select digits" /></SelectTrigger>
                                <SelectContent>{[2,3,4,5,6,7,8,9,10].map(d => <SelectItem key={d} value={String(d)}>{d} digits</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stud-start">Start From</Label>
                            <Input id="stud-start" placeholder="e.g., 1001" value={settings.student_admission_start_from || ''} onChange={(e) => handleChange('student_admission_start_from', e.target.value)} />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Employee ID */}
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10 dark:bg-green-500/20">
                        <UserCog className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Employee ID Auto Generation</CardTitle>
                        <CardDescription>Configure automatic ID generation for staff members</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <Label className="font-medium">Auto Employee ID</Label>
                    <RadioGroup 
                        value={String(settings.staff_id_auto_generation)} 
                        onValueChange={(val) => handleChange('staff_id_auto_generation', val === 'true')} 
                        className="flex gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id="staff-id-dis" />
                            <Label htmlFor="staff-id-dis" className="font-normal cursor-pointer">Disabled</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id="staff-id-en" />
                            <Label htmlFor="staff-id-en" className="font-normal cursor-pointer">Enabled</Label>
                        </div>
                    </RadioGroup>
                </div>
                {settings.staff_id_auto_generation && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="staff-prefix">Employee ID Prefix</Label>
                            <Input id="staff-prefix" placeholder="e.g., EMP" value={settings.staff_id_prefix || ''} onChange={(e) => handleChange('staff_id_prefix', e.target.value)} />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Username & Password */}
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 dark:bg-purple-500/20">
                        <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Username & Password Auto Generation</CardTitle>
                        <CardDescription>Configure automatic credentials for new users</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-card">
                        <div className="flex items-center justify-between">
                            <Label className="font-medium">Student Username</Label>
                            <RadioGroup 
                                value={String(settings.student_username_auto_generation)} 
                                onValueChange={(val) => handleChange('student_username_auto_generation', val === 'true')} 
                                className="flex gap-3"
                            >
                                <div className="flex items-center space-x-1.5">
                                    <RadioGroupItem value="false" id="stud-user-dis" className="h-4 w-4" />
                                    <Label htmlFor="stud-user-dis" className="text-sm font-normal cursor-pointer">Off</Label>
                                </div>
                                <div className="flex items-center space-x-1.5">
                                    <RadioGroupItem value="true" id="stud-user-en" className="h-4 w-4" />
                                    <Label htmlFor="stud-user-en" className="text-sm font-normal cursor-pointer">On</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        {settings.student_username_auto_generation && (
                            <div className="space-y-2">
                                <Label htmlFor="stud-user-prefix" className="text-sm">Username Prefix</Label>
                                <Input id="stud-user-prefix" placeholder="e.g., student_" value={settings.student_username_prefix || ''} onChange={(e) => handleChange('student_username_prefix', e.target.value)} />
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-card">
                        <div className="flex items-center justify-between">
                            <Label className="font-medium">Default Password</Label>
                            <RadioGroup 
                                value={String(settings.password_auto_generation)} 
                                onValueChange={(val) => handleChange('password_auto_generation', val === 'true')} 
                                className="flex gap-3"
                            >
                                <div className="flex items-center space-x-1.5">
                                    <RadioGroupItem value="false" id="pass-dis" className="h-4 w-4" />
                                    <Label htmlFor="pass-dis" className="text-sm font-normal cursor-pointer">Off</Label>
                                </div>
                                <div className="flex items-center space-x-1.5">
                                    <RadioGroupItem value="true" id="pass-en" className="h-4 w-4" />
                                    <Label htmlFor="pass-en" className="text-sm font-normal cursor-pointer">On</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        {settings.password_auto_generation && (
                            <div className="space-y-2">
                                <Label htmlFor="pass-default" className="text-sm">Default Password</Label>
                                <Input id="pass-default" placeholder="e.g., Welcome@123" value={settings.password_default || ''} onChange={(e) => handleChange('password_default', e.target.value)} />
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
);

// Fees Settings Tab
const FeesSettings = ({ settings, handleChange, handleQuillChange }) => (
    <div className="space-y-6">
        {/* Payment Settings */}
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10 dark:bg-orange-500/20">
                        <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Payment Settings</CardTitle>
                        <CardDescription>Configure payment options and student panel access</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                        <Label className="font-medium">Offline Bank Payment</Label>
                        <p className="text-sm text-muted-foreground">Allow students to pay via bank transfer</p>
                    </div>
                    <RadioGroup 
                        value={String(settings.offline_bank_payment_enabled)} 
                        onValueChange={(v) => handleChange('offline_bank_payment_enabled', v === 'true')} 
                        className="flex gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id="offline-pay-dis" />
                            <Label htmlFor="offline-pay-dis" className="font-normal cursor-pointer">Disabled</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id="offline-pay-en" />
                            <Label htmlFor="offline-pay-en" className="font-normal cursor-pointer">Enabled</Label>
                        </div>
                    </RadioGroup>
                </div>

                {settings.offline_bank_payment_enabled && (
                    <div className="space-y-2">
                        <Label>Payment Instructions</Label>
                        <div className="rounded-lg border border-border overflow-hidden">
                            <ReactQuill 
                                theme="snow" 
                                value={settings.offline_bank_payment_instruction || ''} 
                                onChange={handleQuillChange} 
                                className="bg-background [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-border [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[120px]"
                            />
                        </div>
                    </div>
                )}

                <Separator />

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                        <Label className="font-medium">Lock Student Panel on Due Fees</Label>
                        <p className="text-sm text-muted-foreground">Restrict access when fees are pending</p>
                    </div>
                    <RadioGroup 
                        value={String(settings.lock_student_panel_on_due_fees)} 
                        onValueChange={(v) => handleChange('lock_student_panel_on_due_fees', v === 'true')} 
                        className="flex gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id="lock-panel-dis" />
                            <Label htmlFor="lock-panel-dis" className="font-normal cursor-pointer">Disabled</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id="lock-panel-en" />
                            <Label htmlFor="lock-panel-en" className="font-normal cursor-pointer">Enabled</Label>
                        </div>
                    </RadioGroup>
                </div>

                {settings.lock_student_panel_on_due_fees && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                        <div className="space-y-2">
                            <Label htmlFor="grace-period">Grace Period (Days)</Label>
                            <Input id="grace-period" type="number" placeholder="e.g., 15" value={settings.fees_payment_grace_period_days || ''} onChange={(e) => handleChange('fees_payment_grace_period_days', e.target.value)} />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Receipt Settings */}
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-base">Receipt & Print Settings</CardTitle>
                <CardDescription>Configure fees receipt printing options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <Label className="font-medium mb-3 block">Print Receipt Copies</Label>
                    <div className="flex flex-wrap gap-6">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="office-copy" checked={!!settings.print_receipt_office_copy} onCheckedChange={(c) => handleChange('print_receipt_office_copy', c)} />
                            <Label htmlFor="office-copy" className="font-normal cursor-pointer">Office Copy</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="student-copy" checked={!!settings.print_receipt_student_copy} onCheckedChange={(c) => handleChange('print_receipt_student_copy', c)} />
                            <Label htmlFor="student-copy" className="font-normal cursor-pointer">Student Copy</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="bank-copy" checked={!!settings.print_receipt_bank_copy} onCheckedChange={(c) => handleChange('print_receipt_bank_copy', c)} />
                            <Label htmlFor="bank-copy" className="font-normal cursor-pointer">Bank Copy</Label>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <Label className="font-medium">Single Page Print</Label>
                        <RadioGroup 
                            value={String(settings.single_page_fees_print)} 
                            onValueChange={(v) => handleChange('single_page_fees_print', v === 'true')} 
                            className="flex gap-3"
                        >
                            <div className="flex items-center space-x-1.5">
                                <RadioGroupItem value="false" id="single-page-dis" className="h-4 w-4" />
                                <Label htmlFor="single-page-dis" className="text-sm font-normal cursor-pointer">Off</Label>
                            </div>
                            <div className="flex items-center space-x-1.5">
                                <RadioGroupItem value="true" id="single-page-en" className="h-4 w-4" />
                                <Label htmlFor="single-page-en" className="text-sm font-normal cursor-pointer">On</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <Label className="font-medium">Back Date Collection</Label>
                        <RadioGroup 
                            value={String(settings.collect_fees_in_back_date)} 
                            onValueChange={(v) => handleChange('collect_fees_in_back_date', v === 'true')} 
                            className="flex gap-3"
                        >
                            <div className="flex items-center space-x-1.5">
                                <RadioGroupItem value="false" id="back-date-dis" className="h-4 w-4" />
                                <Label htmlFor="back-date-dis" className="text-sm font-normal cursor-pointer">Off</Label>
                            </div>
                            <div className="flex items-center space-x-1.5">
                                <RadioGroupItem value="true" id="back-date-en" className="h-4 w-4" />
                                <Label htmlFor="back-date-en" className="text-sm font-normal cursor-pointer">On</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="carry-forward">Carry Forward Due Days</Label>
                        <Input id="carry-forward" type="number" placeholder="e.g., 30" value={settings.carry_forward_fees_due_days || ''} onChange={(e) => handleChange('carry_forward_fees_due_days', e.target.value)} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 h-fit">
                        <Label className="font-medium">Panel Fees Discount</Label>
                        <RadioGroup 
                            value={String(settings.student_panel_fees_discount)} 
                            onValueChange={(v) => handleChange('student_panel_fees_discount', v === 'true')} 
                            className="flex gap-3"
                        >
                            <div className="flex items-center space-x-1.5">
                                <RadioGroupItem value="false" id="panel-discount-dis" className="h-4 w-4" />
                                <Label htmlFor="panel-discount-dis" className="text-sm font-normal cursor-pointer">Off</Label>
                            </div>
                            <div className="flex items-center space-x-1.5">
                                <RadioGroupItem value="true" id="panel-discount-en" className="h-4 w-4" />
                                <Label htmlFor="panel-discount-en" className="text-sm font-normal cursor-pointer">On</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
);

// General Settings Tab
const GeneralSettings = ({ settings, handleChange }) => (
    <div className="space-y-6">
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20">
                        <Settings className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <CardTitle className="text-base">General Configuration</CardTitle>
                        <CardDescription>Basic system settings and preferences</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <p>General settings will be added here as needed.</p>
                </div>
            </CardContent>
        </Card>
    </div>
);

const GeneralSetting = () => {
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [activeTab, setActiveTab] = useState('fees');
    const [settings, setSettings] = useState({});

    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const fetchSettings = useCallback(async () => {
        if (!branchId) {
            console.log('[GeneralSetting] No branchId available');
            return;
        }
        console.log('[GeneralSetting] Fetching settings for branch:', branchId);
        setIsFetching(true);
        
        // Get settings from branches table directly
        const { data, error } = await supabase
            .from('branches')
            .select('*')
            .eq('id', branchId)
            .single();
        
        if (error) {
            console.error('[GeneralSetting] Error fetching settings:', error);
            toast({ variant: 'destructive', title: 'Failed to fetch settings', description: error.message });
        } else if (data) {
            console.log('[GeneralSetting] Settings loaded for:', data.branch_name, data);
            setSettings({ ...data, branch_id: branchId });
        }
        setIsFetching(false);
    }, [branchId, toast]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };
    
    const handleQuillChange = (value) => handleChange('offline_bank_payment_instruction', value);

    const handleSave = async () => {
        setLoading(true);
        
        // Save to branches table
        if (branchId) {
            // Remove non-updatable fields
            const { id, branch_id, created_at, organization_id, ...updateData } = settings;
            
            const { error } = await supabase
                .from('branches')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', branchId);
            
            if (error) {
                toast({ variant: 'destructive', title: 'Failed to save settings', description: error.message });
            } else {
                toast({ title: 'Success!', description: `Settings saved for ${settings.branch_name || selectedBranch?.branch_name || 'branch'}.` });
            }
        } else {
            toast({ variant: 'destructive', title: 'No branch selected', description: 'Please select a branch first.' });
        }
        setLoading(false);
    };

    if (isFetching) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading settings...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">General Settings</h1>
                        <p className="text-muted-foreground">Configure system preferences and options for {settings.branch_name || selectedBranch?.branch_name || 'your branch'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {(settings.branch_name || selectedBranch?.branch_name) && (
                            <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
                                <Building2 className="h-3.5 w-3.5" />
                                {settings.branch_name || selectedBranch?.branch_name}
                            </Badge>
                        )}
                        <Button onClick={handleSave} disabled={loading} className="gap-2">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="border-b border-border">
                        <TabsList className="h-auto p-0 bg-transparent gap-4">
                            <TabsTrigger 
                                value="general" 
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-1 pb-3 pt-2"
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                General
                            </TabsTrigger>
                            <TabsTrigger 
                                value="fees" 
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-1 pb-3 pt-2"
                            >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Fees
                            </TabsTrigger>
                            <TabsTrigger 
                                value="id-auto-gen" 
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-1 pb-3 pt-2"
                            >
                                <Hash className="h-4 w-4 mr-2" />
                                ID Auto Generation
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="general" className="mt-6">
                        <GeneralSettings settings={settings} handleChange={handleChange} />
                    </TabsContent>

                    <TabsContent value="fees" className="mt-6">
                        <FeesSettings settings={settings} handleChange={handleChange} handleQuillChange={handleQuillChange} />
                    </TabsContent>

                    <TabsContent value="id-auto-gen" className="mt-6">
                        <IdAutoGenerationSettings settings={settings} handleChange={handleChange} />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default GeneralSetting;
