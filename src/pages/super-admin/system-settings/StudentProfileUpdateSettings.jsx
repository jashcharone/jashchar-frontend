import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Save, Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const studentProfileFields = [
    { key: 'full_name', label: 'Full Name' }, { key: 'first_name', label: 'First Name' }, { key: 'last_name', label: 'Last Name' },
    { key: 'admission_date', label: 'Admission Date' }, { key: 'is_rte_student', label: 'RTE' }, { key: 'photo_url', label: 'Image' },
    { key: 'phone', label: 'Mobile Number' }, { key: 'email', label: 'Email' }, { key: 'religion', label: 'Religion' },
    { key: 'caste', label: 'Caste' }, { key: 'dob', label: 'Date of Birth' }, { key: 'blood_group', label: 'Blood Group' },
    { key: 'house_id', label: 'Student House' }, { key: 'gender', label: 'Gender' }, { key: 'present_address', label: 'Current Address' },
    { key: 'permanent_address', label: 'Permanent Address' }, { key: 'father_name', label: 'Father Name' }, { key: 'father_phone', label: 'Father Phone' },
    { key: 'father_occupation', label: 'Father Occupation' }, { key: 'father_photo_url', label: 'Father Photo' }, { key: 'mother_name', label: 'Mother Name' },
    { key: 'mother_phone', label: 'Mother Phone' }, { key: 'mother_occupation', label: 'Mother Occupation' }, { key: 'mother_photo_url', label: 'Mother Photo' },
    { key: 'guardian_is_father_mother_or_other', label: 'If Guardian Is' }, { key: 'guardian_name', label: 'Guardian Name' }, { key: 'guardian_relation', label: 'Guardian Relation' },
    { key: 'guardian_email', label: 'Guardian Email' }, { key: 'guardian_phone', label: 'Guardian Phone' }, { key: 'guardian_occupation', label: 'Guardian Occupation' },
    { key: 'guardian_address', label: 'Guardian Address' }, { key: 'guardian_photo_url', label: 'Guardian Photo' },
];

const StudentProfileUpdateSettings = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [allowUpdate, setAllowUpdate] = useState(false);
    const [fieldPermissions, setFieldPermissions] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const branchId = user?.profile?.branch_id;

    const fetchSettings = useCallback(async () => {
        if (!branchId) return;
        setIsFetching(true);
        const [{ data: schoolData, error: schoolError }, { data: permissionsData, error: permissionsError }] = await Promise.all([
            supabase.from('schools').select('allow_student_profile_update').eq('id', branchId).single(),
            supabase.from('student_profile_edit_permissions').select('*').eq('branch_id', branchId)
        ]);

        if (schoolError) toast({ variant: 'destructive', title: 'Failed to fetch settings' });
        else if (schoolData) setAllowUpdate(schoolData.allow_student_profile_update);

        if (permissionsError) toast({ variant: 'destructive', title: 'Failed to fetch field permissions' });
        else if (permissionsData) {
            const perms = permissionsData.reduce((acc, perm) => {
                acc[perm.field_name] = perm.is_editable;
                return acc;
            }, {});
            
            const initialPerms = studentProfileFields.reduce((acc, field) => {
                acc[field.key] = perms[field.key] ?? true;
                return acc;
            }, {});
            setFieldPermissions(initialPerms);
        }
        setIsFetching(false);
    }, [branchId, toast]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleFieldToggle = (fieldKey, isEditable) => {
        setFieldPermissions(prev => ({ ...prev, [fieldKey]: isEditable }));
    };

    const handleSave = async () => {
        setLoading(true);
        
        const { error: schoolUpdateError } = await supabase
            .from('schools')
            .update({ allow_student_profile_update: allowUpdate })
            .eq('id', branchId);

        if (schoolUpdateError) {
            toast({ variant: 'destructive', title: 'Error saving setting', description: schoolUpdateError.message });
            setLoading(false);
            return;
        }

        const permissionsToUpsert = Object.entries(fieldPermissions).map(([field_name, is_editable]) => ({
            branch_id: branchId,
            field_name,
            is_editable,
        }));
        
        const { error: permissionsUpsertError } = await supabase
            .from('student_profile_edit_permissions')
            .upsert(permissionsToUpsert, { onConflict: 'branch_id, field_name' });
            
        if (permissionsUpsertError) {
            toast({ variant: 'destructive', title: 'Error saving field permissions', description: permissionsUpsertError.message });
        } else {
            toast({ title: 'Success!', description: 'Settings have been saved.' });
        }

        setLoading(false);
    };

    const filteredFields = studentProfileFields.filter(field =>
        field.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-6">Student Profile Update</h1>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <Label htmlFor="allow-update" className="text-lg font-semibold">Allow Editable Form Fields</Label>
                            <RadioGroup id="allow-update" value={String(allowUpdate)} onValueChange={(v) => setAllowUpdate(v === 'true')} className="flex">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="false" id="allow-dis" /><Label htmlFor="allow-dis">Disabled</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="true" id="allow-en" /><Label htmlFor="allow-en">Enabled</Label></div>
                            </RadioGroup>
                        </div>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <CardTitle className="text-xl mb-4">Allowed edit form fields on student profile</CardTitle>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search fields..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {isFetching ? (
                        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="divide-y">
                                {filteredFields.map(field => (
                                    <div key={field.key} className="flex items-center justify-between p-4 hover:bg-muted/50">
                                        <Label htmlFor={field.key} className="font-medium">{field.label}</Label>
                                        <Switch
                                            id={field.key}
                                            checked={fieldPermissions[field.key] ?? true}
                                            onCheckedChange={(checked) => handleFieldToggle(field.key, checked)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default StudentProfileUpdateSettings;
