import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';

const CbseSettings = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        school_name: '',
        exam_center: '',
        printing_date: null,
    });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const fetchSettings = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('cbse_settings')
            .select('setting_value')
            .eq('branch_id', branchId)
            .eq('setting_key', 'marksheet_print_settings');

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching settings', description: error.message });
        } else if (data && data.length > 0) {
            setSettings(prev => ({ ...prev, ...data[0].setting_value }));
        }
        setLoading(false);
    }, [branchId, toast]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date) => {
        setSettings(prev => ({ ...prev, printing_date: date }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const { error } = await supabase
            .from('cbse_settings')
            .upsert({
                branch_id: branchId,
                setting_key: 'marksheet_print_settings',
                setting_value: settings,
                session_id: currentSessionId,
                organization_id: organizationId,
            }, { onConflict: 'branch_id,setting_key' });

        if (error) {
            toast({ variant: 'destructive', title: 'Error saving settings', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Settings saved successfully.' });
        }
        setIsSaving(false);
    };

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-4">CBSE Marksheet Print Settings</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Marksheet Settings</CardTitle>
                    <CardDescription>These settings will be used when printing CBSE marksheet.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center h-32">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-4 max-w-2xl">
                            <div>
                                <Label htmlFor="school_name">School Name</Label>
                                <Input
                                    id="school_name"
                                    name="school_name"
                                    value={settings.school_name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <Label htmlFor="exam_center">Exam Center</Label>
                                <Input
                                    id="exam_center"
                                    name="exam_center"
                                    value={settings.exam_center}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <Label>Printing Date</Label>
                                {/* The DatePicker component was removed as it's not defined in this file.
                                    A standard input is used as a placeholder.
                                    To use a date picker, ensure the component is correctly imported. */}
                                <Input
                                    type="date"
                                    value={settings.printing_date || ''}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Settings
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default CbseSettings;
