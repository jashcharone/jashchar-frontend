import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Save, Loader2, Briefcase, User, Phone, GraduationCap, CreditCard, Files, FileText, LayoutList } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import api from '@/lib/api';
import DatePicker from '@/components/ui/DatePicker';
import ImageUploader from '@/components/ImageUploader';

// Icon mapping
const SECTION_ICONS = {
    Briefcase, User, Phone, GraduationCap, CreditCard, Files, FileText, LayoutList
};

const getIconComponent = (iconName) => {
    return SECTION_ICONS[iconName] || FileText;
};

const DynamicField = ({ field, value, onChange, error, relatedData }) => {
    const isRequired = field.is_required;
    const label = (
        <Label htmlFor={field.key} className="mb-2 block">
            {field.field_label || field.label} {isRequired && <span className="text-red-500">*</span>}
        </Label>
    );

    // Handle special dynamic fields
    if (field.type === 'dynamic') {
        if (field.key === 'department_id') {
            return (
                <div>
                    {label}
                    <Select value={value || ''} onValueChange={onChange}>
                        <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                        <SelectContent>
                            {relatedData.departments?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            );
        }
        if (field.key === 'designation_id') {
            return (
                <div>
                    {label}
                    <Select value={value || ''} onValueChange={onChange}>
                        <SelectTrigger><SelectValue placeholder="Select Designation" /></SelectTrigger>
                        <SelectContent>
                            {relatedData.designations?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            );
        }
        // Fallback for other dynamic fields
        return null;
    }

    if (field.type === 'select' || field.field_type === 'select') {
        const options = field.field_options || field.defaultOptions || [];
        return (
            <div>
                {label}
                <Select value={value || ''} onValueChange={onChange}>
                    <SelectTrigger className={error ? "border-red-500" : ""}><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                        {options.map((opt, idx) => {
                            const val = typeof opt === 'object' ? opt.value : opt;
                            const lab = typeof opt === 'object' ? opt.label : opt;
                            return <SelectItem key={idx} value={val}>{lab}</SelectItem>;
                        })}
                    </SelectContent>
                </Select>
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>
        );
    }

    if (field.type === 'date' || field.field_type === 'date') {
        return (
            <div>
                <DatePicker 
                    id={field.key}
                    label={field.field_label || field.label}
                    required={isRequired}
                    value={value}
                    onChange={onChange}
                />
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>
        );
    }

    if (field.type === 'textarea' || field.field_type === 'textarea') {
        return (
            <div className="md:col-span-2">
                {label}
                <Textarea 
                    id={field.key} 
                    value={value || ''} 
                    onChange={(e) => onChange(e.target.value)}
                    className={error ? "border-red-500" : ""}
                />
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>
        );
    }

    if (field.type === 'file' || field.field_type === 'file') {
        return (
            <div>
                {label}
                <ImageUploader 
                    onFileChange={(file) => onChange(file)} 
                    initialPreview={value} 
                    key={field.key}
                />
            </div>
        );
    }

    if (field.type === 'radio' || field.field_type === 'radio') {
        const options = field.field_options || [];
        return (
            <div>
                {label}
                <RadioGroup value={value || ''} onValueChange={onChange} className="flex flex-col space-y-2">
                    {options.map((opt, idx) => {
                        const val = typeof opt === 'object' ? opt.value : opt;
                        const lab = typeof opt === 'object' ? opt.label : opt;
                        return (
                            <div key={idx} className="flex items-center space-x-2">
                                <RadioGroupItem value={val} id={`${field.key}-${idx}`} />
                                <Label htmlFor={`${field.key}-${idx}`} className="font-normal">{lab}</Label>
                            </div>
                        );
                    })}
                </RadioGroup>
            </div>
        );
    }

    return (
        <div>
            {label}
            <Input 
                id={field.key}
                type={field.type === 'number' || field.field_type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};

const FormSection = ({ title, icon, children }) => {
    const Icon = getIconComponent(icon);
    return (
        <div className="bg-card p-6 rounded-2xl shadow-sm border mb-6">
            <div className="flex items-center gap-4 mb-6 pb-3 border-b border-border">
                <div className="bg-primary/10 p-2.5 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {children}
            </div>
        </div>
    );
};

const AddStaff = () => {
    const navigate = useNavigate();
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);

    // Form Configuration
    const [sections, setSections] = useState([]);
    const [systemFields, setSystemFields] = useState([]);
    const [customFields, setCustomFields] = useState([]);

    // Form Data
    const [formData, setFormData] = useState({});
    const [files, setFiles] = useState({});
    const [customFieldValues, setCustomFieldValues] = useState({});
    
    // Related Data
    const [roles, setRoles] = useState([]);
    const [relatedData, setRelatedData] = useState({ departments: [], designations: [] });
    const [errors, setErrors] = useState({});

    // Fetch Settings & Data
    useEffect(() => {
        const init = async () => {
            // Use selectedBranch.id (current branch context) for fetching data
            const branchId = selectedBranch?.id || user?.profile?.branch_id;
            if (!branchId) return;
            try {
                // 1. Fetch Form Settings
                const { data: settings } = await api.get('/form-settings', {
                    params: { branchId, module: 'employee_registration' }
                });
                setSections(settings.sections || []);
                setSystemFields(settings.systemFields || []);
                setCustomFields(settings.customFields || []);

                // 2. Fetch Related Data (Roles, Depts, Desigs) - using selectedBranch
                const [rolesRes, deptsRes, desigsRes] = await Promise.all([
                    supabase.from('roles').select('id, name').eq('branch_id', branchId),
                    supabase.from('departments').select('id, name').eq('branch_id', branchId),
                    supabase.from('designations').select('id, name').eq('branch_id', branchId)
                ]);

                // Process roles logic
                let fetchedRoles = rolesRes.data || [];
                const restrictedRoles = ['student', 'parent', 'master_admin', 'school_owner'];
                fetchedRoles = fetchedRoles.filter(r => !restrictedRoles.includes(r.name.toLowerCase()));
                // Deduplicate roles logic...
                const roleMap = new Map();
                fetchedRoles.forEach(r => {
                    const k = r.name.toLowerCase();
                    if (!roleMap.has(k) || (r.name[0] === r.name[0].toUpperCase())) roleMap.set(k, r);
                });
                setRoles(Array.from(roleMap.values()));

                setRelatedData({
                    departments: deptsRes.data || [],
                    designations: desigsRes.data || []
                });

            } catch (err) {
                console.error("Init Error:", err);
                toast({ variant: 'destructive', title: 'Failed to load form settings' });
            } finally {
                setInitializing(false);
            }
        };
        init();
    }, [user, selectedBranch?.id, toast]);

    const handleFieldChange = (key, value, isCustom = false) => {
        if (isCustom) {
            setCustomFieldValues(prev => ({ ...prev, [key]: value }));
        } else {
            setFormData(prev => ({ ...prev, [key]: value }));
        }
        // Clear error
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
    };

    const handleFileChange = (key, file) => {
        setFiles(prev => ({ ...prev, [key]: file }));
    };

    const uploadFile = async (file, path) => {
        if (!file) return null;
        const fileName = `${uuidv4()}-${file.name}`;
        const { data, error } = await supabase.storage.from('staff-documents').upload(`${path}/${fileName}`, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('staff-documents').getPublicUrl(data.path);
        return publicUrl;
    };

    const validateForm = () => {
        const newErrors = {};
        
        // Check Role
        if (!formData.role_id) newErrors.role_id = "Role is required";

        // Check System Fields
        systemFields.forEach(field => {
            if (field.is_enabled && field.is_required && !formData[field.key]) {
                newErrors[field.key] = `${field.field_label || field.label} is required`;
            }
        });

        // Check Custom Fields
        customFields.forEach(field => {
            if (field.is_enabled && field.is_required && !customFieldValues[field.id]) {
                newErrors[field.id] = `${field.field_label} is required`;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill all required fields.' });
            return;
        }

        setLoading(true);
        try {
            // 1. Upload Files
            const uploadedUrls = {};
            for (const [key, file] of Object.entries(files)) {
                if (file) {
                    const url = await uploadFile(file, 'documents');
                    uploadedUrls[key] = url;
                }
            }

            // 2. Prepare Metadata
            const full_name = `${formData.first_name} ${formData.last_name || ''}`.trim();
            const password = `password_${uuidv4().substring(0,8)}`;
            
            // Get organization_id & branch_id from selectedBranch context
            const currentBranchId = selectedBranch?.id || user.profile.branch_id;
            let final_organization_id = organizationId;
            if (!final_organization_id && currentBranchId) {
                const { data: schoolData } = await supabase.from('schools').select('organization_id').eq('id', currentBranchId).single();
                final_organization_id = schoolData?.organization_id;
            }

            // Combine form data with uploaded files
            const metadata = {
                ...formData,
                ...uploadedUrls,
                full_name,
                branch_id: currentBranchId,
                organization_id: final_organization_id,
                custom_fields: customFieldValues
            };
            
            // Clean metadata
            Object.keys(metadata).forEach(key => {
                if (metadata[key] === '' || metadata[key] === undefined) delete metadata[key];
            });

            // 3. Create User
            const { error: functionError } = await supabase.functions.invoke('create-user', {
                body: { 
                    email: formData.email, 
                    password, 
                    metadata 
                },
            });

            if (functionError) throw functionError;

            // 4. Save Custom Fields if needed (if stored separately)
             // Using create-user metadata for now as per previous implementation logic
             // If you have a separate table for custom data, insert it here.

            toast({
                title: 'Staff Created Successfully!',
                description: `Invitation sent to ${formData.email}.`,
            });
            navigate('/school-owner/human-resource/staff-directory');

        } catch (error) {
            console.error('Submit Error:', error);
            const errorMessage = error.message.includes("User already registered") 
                ? "This email is already registered. Please use a different email."
                : (error.message || 'An unexpected error occurred.');

            toast({
                variant: 'destructive',
                title: 'Failed to create staff',
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    if (initializing) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Add New Staff</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Role Selection - Always First */}
                    <div className="bg-card p-6 rounded-2xl shadow-sm border">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-primary/10 p-2 rounded-lg"><User className="h-5 w-5 text-primary"/></div>
                            <h3 className="text-lg font-semibold">Role Selection</h3>
                        </div>
                        <div className="max-w-md">
                            <Label>Role <span className="text-red-500">*</span></Label>
                            <Select value={formData.role_id} onValueChange={(v) => handleFieldChange('role_id', v)}>
                                <SelectTrigger className={errors.role_id ? "border-red-500" : ""}><SelectValue placeholder="Select Role" /></SelectTrigger>
                                <SelectContent>
                                    {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name.replace(/_/g, ' ')}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.role_id && <p className="text-xs text-red-500 mt-1">{errors.role_id}</p>}
                        </div>
                    </div>

                    {/* Dynamic Sections */}
                    {sections.map(section => {
                        const sectionFields = systemFields.filter(f => (f.section_key || f.section) === section.key && f.is_enabled);
                        const sectionCustomFields = customFields.filter(f => f.section_key === section.key && f.is_enabled);
                        
                        // Sort all fields by sort_order
                        const allFields = [
                            ...sectionFields.map(f => ({ ...f, _isCustom: false })), 
                            ...sectionCustomFields.map(f => ({ ...f, _isCustom: true }))
                        ].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

                        if (allFields.length === 0) return null;

                        return (
                            <FormSection key={section.key} title={section.label} icon={section.icon}>
                                {allFields.map(field => {
                                    const fieldKey = field._isCustom ? field.id : field.key;
                                    const val = field._isCustom ? customFieldValues[field.id] : formData[field.key];
                                    
                                    if (field.type === 'file' || field.field_type === 'file') {
                                        return (
                                            <DynamicField 
                                                key={fieldKey} 
                                                field={field} 
                                                value={null} // Files handled differently
                                                onChange={(file) => handleFileChange(fieldKey, file)}
                                                error={null}
                                            />
                                        );
                                    }

                                    return (
                                        <DynamicField 
                                            key={fieldKey} 
                                            field={field}
                                            value={val}
                                            onChange={(val) => handleFieldChange(fieldKey, val, field._isCustom)}
                                            error={errors[fieldKey]}
                                            relatedData={relatedData}
                                        />
                                    );
                                })}
                            </FormSection>
                        );
                    })}

                    <div className="flex justify-end gap-3 p-4">
                        <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Staff
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default AddStaff;
