import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { 
    Loader2, Trash2, Edit, Save, Plus, Settings, Eye, EyeOff, 
    ChevronDown, ChevronRight, Type, LayoutList, AlignLeft, Hash, Calendar,
    CheckSquare, Circle, Upload, User, Key, Phone, Briefcase, GraduationCap, 
    CreditCard, Files, FileText, Building, Asterisk, MoreHorizontal, X, Check,
    AlertCircle, Sparkles, Layers, ToggleLeft, ListChecks
} from 'lucide-react';

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================
const SECTION_ICONS = {
    Briefcase, User, Phone, GraduationCap, CreditCard, Files, FileText, Building
};

const FIELD_TYPES = [
    { value: 'text', label: 'Text', icon: Type },
    { value: 'number', label: 'Number', icon: Hash },
    { value: 'date', label: 'Date', icon: Calendar },
    { value: 'select', label: 'Dropdown', icon: LayoutList },
    { value: 'textarea', label: 'Text Area', icon: AlignLeft },
    { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { value: 'radio', label: 'Radio', icon: Circle },
];

const getFieldTypeIcon = (type) => {
    const found = FIELD_TYPES.find(t => t.value === type);
    const Icon = found?.icon || Type;
    return <Icon className="w-4 h-4" />;
};

// ============================================================================
// DEPARTMENT SETTINGS COMPONENT
// ============================================================================
const DepartmentSettings = ({ branchId }) => {
    const { toast } = useToast();
    const [items, setItems] = useState([]);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [editId, setEditId] = useState(null);

    const fetch = useCallback(async () => {
        if (!branchId) return;
        setFetching(true);
        const { data, error } = await supabase.from('departments').select('*')
            .eq('branch_id', branchId).order('name');
        if (!error) setItems(data || []);
        setFetching(false);
    }, [branchId]);

    useEffect(() => { fetch(); }, [fetch]);

    const handleSubmit = async () => {
        if (!name.trim()) return toast({ variant: "destructive", title: "Name required" });
        setLoading(true);
        const payload = { name, branch_id: branchId };
        const { error } = editId 
            ? await supabase.from('departments').update(payload).eq('id', editId)
            : await supabase.from('departments').insert(payload);
        setLoading(false);
        if (error) return toast({ variant: "destructive", title: "Error", description: error.message });
        toast({ title: editId ? "Updated" : "Added" });
        setName(''); setEditId(null); fetch();
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this department?")) return;
        await supabase.from('departments').delete().eq('id', id);
        toast({ title: "Deleted" }); fetch();
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Building className="h-5 w-5 text-primary" />
                        {editId ? 'Edit Department' : 'Add Department'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <Input 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="Department name..."
                            className="max-w-sm"
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        />
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            <span className="ml-2">{editId ? 'Update' : 'Add'}</span>
                        </Button>
                        {editId && (
                            <Button variant="ghost" onClick={() => { setName(''); setEditId(null); }}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">All Departments</CardTitle>
                        <Badge variant="secondary">{items.length} total</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {fetching ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Building className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>No departments yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {items.map(item => (
                                <div key={item.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors">
                                    <span className="font-medium">{item.name}</span>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => { setName(item.name); setEditId(item.id); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

// ============================================================================
// DESIGNATION SETTINGS COMPONENT
// ============================================================================
const DesignationSettings = ({ branchId }) => {
    const { toast } = useToast();
    const [items, setItems] = useState([]);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [editId, setEditId] = useState(null);

    const fetch = useCallback(async () => {
        if (!branchId) return;
        setFetching(true);
        const { data, error } = await supabase.from('designations').select('*')
            .eq('branch_id', branchId).order('name');
        if (!error) setItems(data || []);
        setFetching(false);
    }, [branchId]);

    useEffect(() => { fetch(); }, [fetch]);

    const handleSubmit = async () => {
        if (!name.trim()) return toast({ variant: "destructive", title: "Name required" });
        setLoading(true);
        const payload = { name, branch_id: branchId };
        const { error } = editId 
            ? await supabase.from('designations').update(payload).eq('id', editId)
            : await supabase.from('designations').insert(payload);
        setLoading(false);
        if (error) return toast({ variant: "destructive", title: "Error" });
        toast({ title: editId ? "Updated" : "Added" });
        setName(''); setEditId(null); fetch();
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this designation?")) return;
        await supabase.from('designations').delete().eq('id', id);
        toast({ title: "Deleted" }); fetch();
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        {editId ? 'Edit Designation' : 'Add Designation'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <Input 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="Designation name..."
                            className="max-w-sm"
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        />
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            <span className="ml-2">{editId ? 'Update' : 'Add'}</span>
                        </Button>
                        {editId && (
                            <Button variant="ghost" onClick={() => { setName(''); setEditId(null); }}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">All Designations</CardTitle>
                        <Badge variant="secondary">{items.length} total</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {fetching ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>No designations yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {items.map(item => (
                                <div key={item.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors">
                                    <span className="font-medium">{item.name}</span>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => { setName(item.name); setEditId(item.id); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

// ============================================================================
// FORM FIELDS SETTINGS COMPONENT
// ============================================================================
const FormFieldsSettings = () => {
    const { school } = useAuth();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sections, setSections] = useState([]);
    const [systemFields, setSystemFields] = useState([]);
    const [customFields, setCustomFields] = useState([]);
    const [activeSection, setActiveSection] = useState(null);
    
    // Dialogs
    const [showAddField, setShowAddField] = useState(false);
    const [showEditOptions, setShowEditOptions] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [optionsText, setOptionsText] = useState('');
    
    // New field form
    const [newField, setNewField] = useState({
        field_label: '', field_type: 'text', is_required: false, field_options: '', section_key: ''
    });

    // ==================== DATA FETCHING ====================
    const fetchSettings = useCallback(async () => {
        if (!school?.id) return;
        setLoading(true);
        try {
            const { data } = await api.get('/form-settings', {
                params: { branchId: school.id, module: 'employee_registration' }
            });
            setSections(data.sections || []);
            setSystemFields(data.systemFields || []);
            setCustomFields(data.customFields || []);
            if (data.sections?.length > 0 && !activeSection) setActiveSection(data.sections[0].key);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error loading settings' });
        } finally {
            setLoading(false);
        }
    }, [school?.id, toast]);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);

    // ==================== HELPER FUNCTIONS ====================
    const getSectionKey = (field) => {
        if (field.section_key) return field.section_key;
        if (field.section) return field.section;
        if (field.field_key?.includes('__')) return field.field_key.split('__')[0];
        return null;
    };

    const getFieldsForSection = (sectionKey) => {
        const sys = systemFields.filter(f => getSectionKey(f) === sectionKey);
        const cus = customFields.filter(f => getSectionKey(f) === sectionKey);
        return [...sys, ...cus];
    };

    const getOrphanedFields = () => {
        const sectionKeys = sections.map(s => s.key);
        return customFields.filter(f => {
            const key = getSectionKey(f);
            return !key || !sectionKeys.includes(key);
        });
    };

    // ==================== FIELD OPERATIONS ====================
    const handleToggle = async (field, toggleType) => {
        const isSystem = field.is_system;
        const currentValue = toggleType === 'is_enabled' ? (field.is_enabled !== false) : !!field.is_required;
        const newValue = !currentValue;
        
        // Optimistic update
        const updateField = (f) => {
            if ((isSystem && f.key === field.key) || (!isSystem && f.id === field.id)) {
                let updated = { ...f, [toggleType]: newValue };
                if (toggleType === 'is_enabled' && !newValue) updated.is_required = false;
                if (toggleType === 'is_required' && newValue) updated.is_enabled = true;
                return updated;
            }
            return f;
        };
        
        if (isSystem) {
            setSystemFields(prev => prev.map(updateField));
        } else {
            setCustomFields(prev => prev.map(updateField));
        }

        try {
            if (isSystem) {
                await api.post('/form-settings/save', {
                    branch_id: school.id,
                    module: 'employee_registration',
                    settings: [{
                        field_key: field.key,
                        field_label: field.field_label || field.label,
                        is_enabled: toggleType === 'is_enabled' ? newValue : (field.is_enabled !== false),
                        is_required: toggleType === 'is_required' ? newValue : !!field.is_required,
                        field_options: field.field_options || [],
                        section_key: getSectionKey(field),
                        sort_order: field.sort_order || field.order || 0
                    }]
                });
            } else {
                await api.put(`/form-settings/custom-field/${field.id}`, { 
                    [toggleType]: newValue,
                    ...(toggleType === 'is_enabled' && !newValue ? { is_required: false } : {}),
                    ...(toggleType === 'is_required' && newValue ? { is_enabled: true } : {})
                });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving' });
            fetchSettings();
        }
    };

    const handleEditOptions = (field) => {
        setEditingField(field);
        const opts = field.field_options || [];
        const text = Array.isArray(opts) 
            ? opts.map(o => typeof o === 'string' ? o : o.value || '').join('\n') 
            : '';
        setOptionsText(text);
        setShowEditOptions(true);
    };

    const saveOptions = async () => {
        if (!editingField) return;
        setSaving(true);
        
        const optionsJson = optionsText.split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .map(opt => ({ value: opt, label: opt }));
        
        try {
            if (editingField.is_system) {
                await api.post('/form-settings/save', {
                    branch_id: school.id,
                    module: 'employee_registration',
                    settings: [{
                        field_key: editingField.key,
                        field_label: editingField.field_label || editingField.label,
                        is_enabled: editingField.is_enabled !== false,
                        is_required: !!editingField.is_required,
                        field_options: optionsJson,
                        section_key: getSectionKey(editingField),
                        sort_order: editingField.sort_order || 0
                    }]
                });
                setSystemFields(prev => prev.map(f => 
                    f.key === editingField.key ? { ...f, field_options: optionsJson } : f
                ));
            } else {
                await api.put(`/form-settings/custom-field/${editingField.id}`, { field_options: optionsJson });
            }
            toast({ title: 'Options saved' });
            setShowEditOptions(false);
            fetchSettings();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving options' });
        } finally {
            setSaving(false);
        }
    };

    const handleAddField = async () => {
        if (!newField.field_label || !newField.section_key) {
            toast({ variant: 'destructive', title: 'Label and Section are required' });
            return;
        }
        setSaving(true);
        
        let optionsJson = [];
        if (['select', 'radio', 'checkbox'].includes(newField.field_type) && newField.field_options) {
            optionsJson = newField.field_options.split('\n')
                .map(line => line.trim())
                .filter(Boolean)
                .map(opt => ({ value: opt, label: opt }));
        }

        try {
            await api.post('/form-settings/custom-field', {
                branch_id: school.id,
                module: 'employee_registration',
                field_label: newField.field_label,
                field_type: newField.field_type,
                is_required: newField.is_required,
                field_options: optionsJson,
                section_key: newField.section_key,
                sort_order: customFields.filter(f => getSectionKey(f) === newField.section_key).length
            });
            toast({ title: 'Field added successfully' });
            setNewField({ field_label: '', field_type: 'text', is_required: false, field_options: '', section_key: '' });
            setShowAddField(false);
            fetchSettings();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error adding field' });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteField = async (id) => {
        if (!confirm('Delete this custom field?')) return;
        try {
            await api.delete(`/form-settings/custom-field/${id}`);
            toast({ title: 'Field deleted' });
            fetchSettings();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error deleting field' });
        }
    };

    // ==================== RENDER ====================
    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading form settings...</p>
                </div>
            </div>
        );
    }

    const activeFields = activeSection ? getFieldsForSection(activeSection) : [];
    const orphaned = getOrphanedFields();
    const activeSectionData = sections.find(s => s.key === activeSection);
    const ActiveIcon = activeSectionData ? (SECTION_ICONS[activeSectionData.icon] || FileText) : AlertCircle;

    return (
        <TooltipProvider>
            <div className="flex gap-6 h-[calc(100vh-320px)]">
                {/* Left Sidebar - Sections */}
                <div className="w-64 flex-shrink-0">
                    <Card className="h-full">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Form Sections
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2">
                            <ScrollArea className="h-[calc(100vh-440px)]">
                                <div className="space-y-1">
                                    {sections.map(section => {
                                        const Icon = SECTION_ICONS[section.icon] || FileText;
                                        const fields = getFieldsForSection(section.key);
                                        const enabledCount = fields.filter(f => f.is_enabled !== false).length;
                                        const customCount = customFields.filter(f => getSectionKey(f) === section.key).length;
                                        
                                        return (
                                            <button
                                                key={section.key}
                                                onClick={() => setActiveSection(section.key)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                                                    activeSection === section.key 
                                                        ? "bg-primary text-primary-foreground shadow-sm" 
                                                        : "hover:bg-muted"
                                                )}
                                            >
                                                <Icon className="h-4 w-4 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{section.label}</p>
                                                    <p className={cn(
                                                        "text-xs",
                                                        activeSection === section.key ? "text-primary-foreground/70" : "text-muted-foreground"
                                                    )}>
                                                        {enabledCount}/{fields.length} active
                                                    </p>
                                                </div>
                                                {customCount > 0 && (
                                                    <Badge variant={activeSection === section.key ? "secondary" : "outline"} className="text-[10px] h-5">
                                                        +{customCount}
                                                    </Badge>
                                                )}
                                            </button>
                                        );
                                    })}
                                    
                                    {orphaned.length > 0 && (
                                        <>
                                            <Separator className="my-2" />
                                            <button
                                                onClick={() => setActiveSection('_orphaned')}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                                                    activeSection === '_orphaned' 
                                                        ? "bg-orange-500 text-white" 
                                                        : "hover:bg-orange-50 text-orange-600"
                                                )}
                                            >
                                                <AlertCircle className="h-4 w-4" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">Uncategorized</p>
                                                    <p className="text-xs opacity-70">{orphaned.length} fields</p>
                                                </div>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Content - Fields */}
                <div className="flex-1">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="pb-4 border-b">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <ActiveIcon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">
                                            {activeSection === '_orphaned' ? 'Uncategorized Fields' : (activeSectionData?.label || 'Select a Section')}
                                        </CardTitle>
                                        <CardDescription>
                                            {activeSection === '_orphaned' 
                                                ? 'Fields without section assignment' 
                                                : `Configure fields for this section`}
                                        </CardDescription>
                                    </div>
                                </div>
                                <Button onClick={() => { setNewField({...newField, section_key: activeSection !== '_orphaned' ? activeSection : ''}); setShowAddField(true); }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Field
                                </Button>
                            </div>
                        </CardHeader>
                        
                        <CardContent className="flex-1 p-0 overflow-hidden">
                            <ScrollArea className="h-full">
                                <div className="p-4">
                                    {(activeSection === '_orphaned' ? orphaned : activeFields).length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                            <Layers className="h-16 w-16 mb-4 opacity-20" />
                                            <p className="text-lg font-medium">No fields here</p>
                                            <p className="text-sm">Add a custom field to get started</p>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead className="w-[300px]">Field</TableHead>
                                                    <TableHead className="w-[120px]">Type</TableHead>
                                                    <TableHead className="w-[100px] text-center">Visible</TableHead>
                                                    <TableHead className="w-[100px] text-center">Required</TableHead>
                                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(activeSection === '_orphaned' ? orphaned : activeFields)
                                                    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                                                    .map(field => {
                                                        const isEnabled = field.is_enabled !== false;
                                                        const isCustom = !field.is_system;
                                                        const hasOptions = ['select', 'radio', 'checkbox'].includes(field.field_type || field.type);
                                                        
                                                        return (
                                                            <TableRow key={field.id || field.key} className={cn(!isEnabled && "opacity-50")}>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={cn(
                                                                            "p-1.5 rounded",
                                                                            isEnabled ? "bg-primary/10" : "bg-muted"
                                                                        )}>
                                                                            {getFieldTypeIcon(field.field_type || field.type)}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-medium">{field.field_label || field.label}</p>
                                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                                {field.is_system && (
                                                                                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">System</Badge>
                                                                                )}
                                                                                {isCustom && (
                                                                                    <Badge className="text-[10px] h-4 px-1.5 bg-purple-100 text-purple-700 hover:bg-purple-100">Custom</Badge>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <span className="text-sm text-muted-foreground capitalize">
                                                                        {field.field_type || field.type}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <Switch
                                                                        checked={isEnabled}
                                                                        onCheckedChange={() => handleToggle(field, 'is_enabled')}
                                                                        className="data-[state=checked]:bg-green-500"
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <Switch
                                                                        checked={!!field.is_required}
                                                                        onCheckedChange={() => handleToggle(field, 'is_required')}
                                                                        disabled={!isEnabled}
                                                                        className="data-[state=checked]:bg-red-500"
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        {hasOptions && (
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditOptions(field)}>
                                                                                        <LayoutList className="h-4 w-4 text-blue-500" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>Edit Options</TooltipContent>
                                                                            </Tooltip>
                                                                        )}
                                                                        {isCustom && (
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteField(field.id)}>
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>Delete Field</TooltipContent>
                                                                            </Tooltip>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Add Field Dialog */}
            <Dialog open={showAddField} onOpenChange={setShowAddField}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Add Custom Field
                        </DialogTitle>
                        <DialogDescription>Create a new field for the employee form</DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Field Label <span className="text-destructive">*</span></Label>
                            <Input 
                                value={newField.field_label}
                                onChange={(e) => setNewField({...newField, field_label: e.target.value})}
                                placeholder="e.g., Pan Card Number"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Section <span className="text-destructive">*</span></Label>
                            <Select value={newField.section_key} onValueChange={(v) => setNewField({...newField, section_key: v})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select section..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map(s => (
                                        <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Field Type</Label>
                            <Select value={newField.field_type} onValueChange={(v) => setNewField({...newField, field_type: v})}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FIELD_TYPES.map(t => (
                                        <SelectItem key={t.value} value={t.value}>
                                            <div className="flex items-center gap-2">
                                                <t.icon className="h-4 w-4" />
                                                {t.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {['select', 'radio', 'checkbox'].includes(newField.field_type) && (
                            <div className="space-y-2">
                                <Label>Options (one per line)</Label>
                                <Textarea 
                                    value={newField.field_options}
                                    onChange={(e) => setNewField({...newField, field_options: e.target.value})}
                                    placeholder={"Option 1\nOption 2\nOption 3"}
                                    rows={4}
                                />
                            </div>
                        )}
                        
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Switch 
                                id="required-new"
                                checked={newField.is_required}
                                onCheckedChange={(c) => setNewField({...newField, is_required: c})}
                            />
                            <Label htmlFor="required-new" className="cursor-pointer">Mark as required field</Label>
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddField(false)}>Cancel</Button>
                        <Button onClick={handleAddField} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Add Field
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Options Dialog */}
            <Dialog open={showEditOptions} onOpenChange={setShowEditOptions}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ListChecks className="h-5 w-5 text-primary" />
                            Edit Options
                        </DialogTitle>
                        <DialogDescription>
                            Edit options for "{editingField?.field_label || editingField?.label}"
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="mb-2 block">Options (one per line)</Label>
                        <Textarea 
                            value={optionsText}
                            onChange={(e) => setOptionsText(e.target.value)}
                            rows={8}
                            placeholder={"Option 1\nOption 2\nOption 3"}
                            className="font-mono"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditOptions(false)}>Cancel</Button>
                        <Button onClick={saveOptions} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Save Options
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
const EmployeeFormSettings = () => {
    const { school } = useAuth();
    const { selectedBranch } = useBranch();
    const [stats, setStats] = useState({ sections: 0, system: 0, custom: 0, active: 0 });
    
    useEffect(() => {
        const fetchStats = async () => {
            if (!school?.id) return;
            try {
                const { data } = await api.get('/form-settings', {
                    params: { branchId: school.id, module: 'employee_registration' }
                });
                const sysActive = (data.systemFields || []).filter(f => f.is_enabled !== false).length;
                const cusActive = (data.customFields || []).filter(f => f.is_enabled !== false).length;
                setStats({
                    sections: data.sections?.length || 0,
                    system: data.systemFields?.length || 0,
                    custom: data.customFields?.length || 0,
                    active: sysActive + cusActive
                });
            } catch (e) {}
        };
        fetchStats();
    }, [school?.id]);
    
    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10">
                            <Settings className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Employee Form Settings</h1>
                            <p className="text-muted-foreground">Configure registration form, departments & designations</p>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 dark:from-blue-950 dark:to-blue-900/50 dark:border-blue-800">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.sections}</p>
                                    <p className="text-sm text-blue-600/80 dark:text-blue-400/80">Sections</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-200 dark:from-violet-950 dark:to-violet-900/50 dark:border-violet-800">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-violet-500/10">
                                    <ToggleLeft className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">{stats.system}</p>
                                    <p className="text-sm text-violet-600/80 dark:text-violet-400/80">System Fields</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 dark:from-purple-950 dark:to-purple-900/50 dark:border-purple-800">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.custom}</p>
                                    <p className="text-sm text-purple-600/80 dark:text-purple-400/80">Custom Fields</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 dark:from-emerald-950 dark:to-emerald-900/50 dark:border-emerald-800">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-500/10">
                                    <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.active}</p>
                                    <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">Active Fields</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Tabs */}
                <Tabs defaultValue="fields" className="w-full">
                    <TabsList className="w-full justify-start gap-2 bg-muted/50 p-1">
                        <TabsTrigger value="fields" className="gap-2 data-[state=active]:bg-background">
                            <LayoutList className="h-4 w-4" />
                            Form Fields
                        </TabsTrigger>
                        <TabsTrigger value="departments" className="gap-2 data-[state=active]:bg-background">
                            <Building className="h-4 w-4" />
                            Departments
                        </TabsTrigger>
                        <TabsTrigger value="designations" className="gap-2 data-[state=active]:bg-background">
                            <Briefcase className="h-4 w-4" />
                            Designations
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="fields" className="mt-6">
                        <FormFieldsSettings />
                    </TabsContent>
                    
                    <TabsContent value="departments" className="mt-6">
                        <DepartmentSettings branchId={school?.id} branchId={selectedBranch?.id} />
                    </TabsContent>
                    
                    <TabsContent value="designations" className="mt-6">
                        <DesignationSettings branchId={school?.id} branchId={selectedBranch?.id} />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default EmployeeFormSettings;
