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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { 
    Loader2, Trash2, Edit, Save, Plus, Settings, GripVertical,
    ChevronDown, ChevronRight, Type, LayoutList, AlignLeft, Hash, Calendar,
    CheckSquare, Circle, Upload, User, Key, Phone, Briefcase, GraduationCap, 
    CreditCard, Files, FileText, Building
} from 'lucide-react';

// Icon mapping for sections
const SECTION_ICONS = {
    Briefcase, User, Phone, GraduationCap, CreditCard, Files, FileText, Building
};

const getIconComponent = (iconName) => {
    return SECTION_ICONS[iconName] || FileText;
};

// Field type icons
const getFieldTypeIcon = (type) => {
    switch(type) {
        case 'text': return <Type className="w-3.5 h-3.5" />;
        case 'number': return <Hash className="w-3.5 h-3.5" />;
        case 'date': return <Calendar className="w-3.5 h-3.5" />;
        case 'select': case 'dynamic': return <LayoutList className="w-3.5 h-3.5" />;
        case 'radio': return <Circle className="w-3.5 h-3.5" />;
        case 'checkbox': return <CheckSquare className="w-3.5 h-3.5" />;
        case 'textarea': return <AlignLeft className="w-3.5 h-3.5" />;
        case 'file': return <Upload className="w-3.5 h-3.5" />;
        case 'email': return <Type className="w-3.5 h-3.5" />;
        case 'password': return <Key className="w-3.5 h-3.5" />;
        default: return <Type className="w-3.5 h-3.5" />;
    }
};

// ============================================================================
// DEPARTMENT SETTINGS SUB-COMPONENT
// ============================================================================
const DepartmentSettings = ({ branchId, branchId }) => {
    const { toast } = useToast();
    const [departments, setDepartments] = useState([]);
    const [departmentName, setDepartmentName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [editingId, setEditingId] = useState(null);

    const fetchDepartments = async () => {
        if (!branchId || !branchId) return;
        setIsFetching(true);
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .eq('branch_id', branchId)
            .eq('branch_id', branchId)
            .order('name');
        
        if (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error fetching departments" });
        } else {
            setDepartments(data || []);
        }
        setIsFetching(false);
    };

    useEffect(() => {
        if (branchId && branchId) {
            fetchDepartments();
        }
    }, [branchId, branchId]);

    const handleSubmit = async () => {
        if (!departmentName.trim()) {
            toast({ variant: "destructive", title: "Name is required" });
            return;
        }
        setLoading(true);
        
        const payload = { name: departmentName, branch_id: branchId, branch_id: branchId };

        let error;
        if (editingId) {
            const { error: updateError } = await supabase.from('departments').update(payload).eq('id', editingId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('departments').insert(payload);
            error = insertError;
        }

        setLoading(false);

        if (error) {
            toast({ variant: "destructive", title: "Error saving department", description: error.message });
        } else {
            toast({ title: "Success", description: "Department saved successfully" });
            setDepartmentName('');
            setEditingId(null);
            fetchDepartments();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this department?")) return;
        const { error } = await supabase.from('departments').delete().eq('id', id);
        if (error) {
            toast({ variant: "destructive", title: "Error deleting department" });
        } else {
            toast({ title: "Deleted successfully" });
            fetchDepartments();
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle className="text-base">{editingId ? 'Edit' : 'Add'} Department</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Department Name *</Label>
                        <Input value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} placeholder="e.g., Science" />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            {editingId ? 'Update' : 'Add'}
                        </Button>
                        {editingId && (
                            <Button variant="outline" onClick={() => { setDepartmentName(''); setEditingId(null); }}>Cancel</Button>
                        )}
                    </div>
                </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="text-base">Departments List</CardTitle>
                </CardHeader>
                <CardContent>
                    {isFetching ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                    ) : departments.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No departments added yet</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {departments.map(dept => (
                                    <TableRow key={dept.id}>
                                        <TableCell>{dept.name}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => { setDepartmentName(dept.name); setEditingId(dept.id); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(dept.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

// ============================================================================
// DESIGNATION SETTINGS SUB-COMPONENT
// ============================================================================
const DesignationSettings = ({ branchId, branchId }) => {
    const { toast } = useToast();
    const [designations, setDesignations] = useState([]);
    const [designationName, setDesignationName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [editingId, setEditingId] = useState(null);

    const fetchDesignations = async () => {
        if (!branchId || !branchId) return;
        setIsFetching(true);
        const { data, error } = await supabase
            .from('designations')
            .select('*')
            .eq('branch_id', branchId)
            .eq('branch_id', branchId)
            .order('name');
        
        if (error) {
            console.error(error);
        } else {
            setDesignations(data || []);
        }
        setIsFetching(false);
    };

    useEffect(() => {
        if (branchId && branchId) {
            fetchDesignations();
        }
    }, [branchId, branchId]);

    const handleSubmit = async () => {
        if (!designationName.trim()) {
            toast({ variant: "destructive", title: "Name is required" });
            return;
        }
        setLoading(true);
        
        const payload = { name: designationName, branch_id: branchId, branch_id: branchId };

        let error;
        if (editingId) {
            const { error: updateError } = await supabase.from('designations').update(payload).eq('id', editingId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('designations').insert(payload);
            error = insertError;
        }

        setLoading(false);

        if (error) {
            toast({ variant: "destructive", title: "Error saving designation" });
        } else {
            toast({ title: "Success", description: "Designation saved" });
            setDesignationName('');
            setEditingId(null);
            fetchDesignations();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this designation?")) return;
        const { error } = await supabase.from('designations').delete().eq('id', id);
        if (!error) {
            toast({ title: "Deleted" });
            fetchDesignations();
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle className="text-base">{editingId ? 'Edit' : 'Add'} Designation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Designation Name *</Label>
                        <Input value={designationName} onChange={(e) => setDesignationName(e.target.value)} placeholder="e.g., Principal" />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            {editingId ? 'Update' : 'Add'}
                        </Button>
                        {editingId && (
                            <Button variant="outline" onClick={() => { setDesignationName(''); setEditingId(null); }}>Cancel</Button>
                        )}
                    </div>
                </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="text-base">Designations List</CardTitle>
                </CardHeader>
                <CardContent>
                    {isFetching ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                    ) : designations.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No designations added yet</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {designations.map(des => (
                                    <TableRow key={des.id}>
                                        <TableCell>{des.name}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => { setDesignationName(des.name); setEditingId(des.id); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(des.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

// ============================================================================
// FIELD CARD COMPONENT
// ============================================================================
const FieldCard = ({ field, onToggle, onEdit, onDelete, isCustom }) => {
    const isEnabled = field.is_enabled !== false;
    
    return (
        <div
            className={cn(
                "group flex items-center gap-2 p-2.5 rounded-lg border transition-all",
                isEnabled 
                    ? "bg-card border-border hover:border-primary/50 hover:shadow-sm" 
                    : "bg-muted/30 border-dashed border-muted-foreground/30 opacity-60"
            )}
        >
            <div className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "p-1 rounded",
                        isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                        {getFieldTypeIcon(field.type || field.field_type)}
                    </span>
                    <span className={cn(
                        "font-medium text-sm truncate",
                        !isEnabled && "text-muted-foreground"
                    )}>
                        {field.field_label || field.label}
                    </span>
                    {field.is_required && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Required</Badge>
                    )}
                    {field.is_system && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">System</Badge>
                    )}
                    {isCustom && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-purple-500 text-purple-500">Custom</Badge>
                    )}
                </div>
                {field.key && (
                    <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">{field.key}</p>
                )}
            </div>

            <div className="flex items-center gap-1">
                <div className="flex items-center gap-2 mr-2">
                    <span className="text-xs text-muted-foreground">Show</span>
                    <Switch 
                        checked={isEnabled}
                        onCheckedChange={() => onToggle(field, 'is_enabled')}
                        className="scale-75 data-[state=checked]:bg-green-500"
                    />
                </div>
                <div className="flex items-center gap-2 mr-2">
                    <span className="text-xs text-muted-foreground">Required</span>
                    <Switch 
                        checked={field.is_required}
                        onCheckedChange={() => onToggle(field, 'is_required')}
                        disabled={!isEnabled}
                        className="scale-75 data-[state=checked]:bg-red-500"
                    />
                </div>
                {(field.type === 'select' || field.field_type === 'select') && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500" onClick={() => onEdit(field)}>
                        <Edit className="h-3.5 w-3.5" />
                    </Button>
                )}
                {isCustom && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => onDelete(field.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// SECTION CONTAINER COMPONENT
// ============================================================================
const SectionContainer = ({ section, fields, customFields, onFieldToggle, onFieldEdit, onFieldDelete, expandedSections, toggleSection }) => {
    const Icon = getIconComponent(section.icon);
    const isExpanded = expandedSections[section.key] !== false;
    const allFields = [...fields, ...customFields];
    const enabledCount = allFields.filter(f => f.is_enabled !== false).length;
    
    return (
        <Collapsible open={isExpanded} onOpenChange={() => toggleSection(section.key)}>
            <Card className="border-l-4 border-l-primary/50 overflow-hidden">
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Icon className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-semibold">{section.label}</CardTitle>
                                    <CardDescription className="text-xs">
                                        {enabledCount} of {allFields.length} fields visible
                                    </CardDescription>
                                </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">{allFields.length} fields</Badge>
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="pt-0 pb-3 px-4">
                        <div className="space-y-1.5">
                            {allFields.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                    No fields in this section
                                </div>
                            ) : (
                                <>
                                    {fields.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((field) => (
                                        <FieldCard key={field.key} field={field} onToggle={onFieldToggle} onEdit={onFieldEdit} onDelete={onFieldDelete} isCustom={false} />
                                    ))}
                                    {customFields.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((field) => (
                                        <FieldCard key={field.id} field={field} onToggle={onFieldToggle} onEdit={onFieldEdit} onDelete={onFieldDelete} isCustom={true} />
                                    ))}
                                </>
                            )}
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
};

// ============================================================================
// EMPLOYEE FORM FIELDS SETTINGS COMPONENT
// ============================================================================
const EmployeeFormFieldsSettings = () => {
    const { school } = useAuth();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(true);
    const [sections, setSections] = useState([]);
    const [systemFields, setSystemFields] = useState([]);
    const [customFields, setCustomFields] = useState([]);
    const [expandedSections, setExpandedSections] = useState({});
    
    const [showAddCustomField, setShowAddCustomField] = useState(false);
    const [newField, setNewField] = useState({
        field_label: '', field_type: 'text', is_required: false, field_options: '', section_key: ''
    });
    
    const [optionEditModalOpen, setOptionEditModalOpen] = useState(false);
    const [currentEditingField, setCurrentEditingField] = useState(null);
    const [optionText, setOptionText] = useState('');

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
            
            const expanded = {};
            (data.sections || []).forEach(s => expanded[s.key] = true);
            setExpandedSections(expanded);
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast({ variant: 'destructive', title: 'Error loading settings' });
        } finally {
            setLoading(false);
        }
    }, [school?.id, toast]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
    };

    const handleFieldToggle = async (field, toggleType) => {
        const isSystem = field.is_system;
        const currentValue = toggleType === 'is_enabled' ? (field.is_enabled !== false) : field.is_required;
        const newValue = !currentValue;
        
        if (isSystem) {
            setSystemFields(prev => prev.map(f => {
                if (f.key === field.key) {
                    let updated = { ...f, [toggleType]: newValue };
                    if (toggleType === 'is_enabled' && !newValue) updated.is_required = false;
                    if (toggleType === 'is_required' && newValue) updated.is_enabled = true;
                    return updated;
                }
                return f;
            }));
        } else {
            setCustomFields(prev => prev.map(f => {
                if (f.id === field.id) {
                    let updated = { ...f, [toggleType]: newValue };
                    if (toggleType === 'is_enabled' && !newValue) updated.is_required = false;
                    if (toggleType === 'is_required' && newValue) updated.is_enabled = true;
                    return updated;
                }
                return f;
            }));
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
                        is_required: toggleType === 'is_required' ? newValue : field.is_required,
                        field_options: field.field_options || [],
                        section_key: field.section_key || field.section,
                        sort_order: field.sort_order || field.order || 0
                    }]
                });
            } else {
                await api.put(`/form-settings/custom-field/${field.id}`, { [toggleType]: newValue });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving changes' });
            fetchSettings();
        }
    };

    const handleFieldEdit = (field) => {
        setCurrentEditingField(field);
        const opts = field.field_options || [];
        const text = Array.isArray(opts) ? opts.map(o => typeof o === 'string' ? o : o.value || '').join(', ') : '';
        setOptionText(text);
        setOptionEditModalOpen(true);
    };

    const saveOptions = async () => {
        if (!currentEditingField) return;
        
        const optionsJson = optionText.split(',').map(opt => {
            const [val, lab] = opt.includes(':') ? opt.split(':') : [opt, opt];
            return { value: val.trim(), label: lab?.trim() || val.trim() };
        }).filter(o => o.value);
        
        try {
            if (currentEditingField.is_system) {
                setSystemFields(prev => prev.map(f => f.key === currentEditingField.key ? { ...f, field_options: optionsJson } : f));
                await api.post('/form-settings/save', {
                    branch_id: school.id,
                    module: 'employee_registration',
                    settings: [{
                        field_key: currentEditingField.key,
                        field_label: currentEditingField.field_label || currentEditingField.label,
                        is_enabled: currentEditingField.is_enabled !== false,
                        is_required: currentEditingField.is_required || false,
                        field_options: optionsJson,
                        section_key: currentEditingField.section_key || currentEditingField.section,
                        sort_order: currentEditingField.sort_order || 0
                    }]
                });
            } else {
                await api.put(`/form-settings/custom-field/${currentEditingField.id}`, { field_options: optionsJson });
                fetchSettings();
            }
            toast({ title: 'Options updated' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error updating options' });
        }
        
        setOptionEditModalOpen(false);
        setCurrentEditingField(null);
    };

    const handleAddCustomField = async () => {
        if (!newField.field_label || !newField.section_key) {
            toast({ variant: 'destructive', title: 'Field label and section are required' });
            return;
        }
        
        let optionsJson = [];
        if (['select', 'radio', 'checkbox'].includes(newField.field_type) && newField.field_options) {
            optionsJson = newField.field_options.split(',').map(opt => {
                const [val, lab] = opt.includes(':') ? opt.split(':') : [opt, opt];
                return { value: val.trim(), label: lab?.trim() || val.trim() };
            }).filter(o => o.value);
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
                sort_order: customFields.filter(f => f.section_key === newField.section_key).length
            });
            
            toast({ title: 'Custom field added' });
            setNewField({ field_label: '', field_type: 'text', is_required: false, field_options: '', section_key: '' });
            setShowAddCustomField(false);
            fetchSettings();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error adding custom field' });
        }
    };

    const handleDeleteCustomField = async (id) => {
        if (!confirm('Delete this custom field?')) return;
        try {
            await api.delete(`/form-settings/custom-field/${id}`);
            toast({ title: 'Field deleted' });
            fetchSettings();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error deleting field' });
        }
    };

    const getSystemFieldsForSection = (sectionKey) => systemFields.filter(f => (f.section_key || f.section) === sectionKey);
    
    const getCustomFieldsForSection = (sectionKey) => {
        return customFields.filter(f => {
            // Check explicit section_key first
            if (f.section_key === sectionKey) return true;
            // Fallback: Extract from field_key (e.g., "personal_details__test_field")
            if (f.field_key && f.field_key.includes('__')) {
                const derivedSection = f.field_key.split('__')[0];
                return derivedSection === sectionKey;
            }
            return false;
        });
    };
    
    // Get custom fields that don't belong to any section (orphaned)
    const getOrphanedCustomFields = () => {
        const sectionKeys = sections.map(s => s.key);
        return customFields.filter(f => {
            const sKey = f.section_key || (f.field_key?.includes('__') ? f.field_key.split('__')[0] : null);
            return !sKey || !sectionKeys.includes(sKey);
        });
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg">
                <div>
                    <h2 className="text-lg font-semibold">Form Fields Configuration</h2>
                    <p className="text-sm text-muted-foreground">Configure fields for the employee registration form</p>
                </div>
                <Button onClick={() => setShowAddCustomField(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Custom Field
                </Button>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="text-2xl font-bold text-primary">{sections.length}</div>
                    <div className="text-sm text-muted-foreground">Sections</div>
                </Card>
                <Card className="p-4">
                    <div className="text-2xl font-bold text-blue-500">{systemFields.length}</div>
                    <div className="text-sm text-muted-foreground">System Fields</div>
                </Card>
                <Card className="p-4">
                    <div className="text-2xl font-bold text-purple-500">{customFields.length}</div>
                    <div className="text-sm text-muted-foreground">Custom Fields</div>
                </Card>
                <Card className="p-4">
                    <div className="text-2xl font-bold text-green-500">
                        {systemFields.filter(f => f.is_enabled !== false).length + customFields.filter(f => f.is_enabled !== false).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Fields</div>
                </Card>
            </div>

            <ScrollArea className="h-[calc(100vh-420px)]">
                <div className="space-y-3 pr-4">
                    {sections.map(section => (
                        <SectionContainer 
                            key={section.key}
                            section={section}
                            fields={getSystemFieldsForSection(section.key)}
                            customFields={getCustomFieldsForSection(section.key)}
                            onFieldToggle={handleFieldToggle}
                            onFieldEdit={handleFieldEdit}
                            onFieldDelete={handleDeleteCustomField}
                            expandedSections={expandedSections}
                            toggleSection={toggleSection}
                        />
                    ))}
                    
                    {/* Orphaned Custom Fields (no section assigned) */}
                    {getOrphanedCustomFields().length > 0 && (
                        <Card className="border-l-4 border-l-orange-500 overflow-hidden">
                            <CardHeader className="py-3 px-4 bg-orange-50 dark:bg-orange-900/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                                        <Files className="h-4 w-4 text-orange-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-400">Uncategorized Fields</CardTitle>
                                        <CardDescription className="text-xs">Fields without a section assignment</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-3 pb-3 px-4">
                                <div className="space-y-1.5">
                                    {getOrphanedCustomFields().map((field) => (
                                        <FieldCard key={field.id} field={field} onToggle={handleFieldToggle} onEdit={handleFieldEdit} onDelete={handleDeleteCustomField} isCustom={true} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </ScrollArea>

            {/* Add Custom Field Dialog */}
            <Dialog open={showAddCustomField} onOpenChange={setShowAddCustomField}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle><Plus className="h-5 w-5 text-primary inline mr-2" />Add Custom Field</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Field Label *</Label>
                            <Input value={newField.field_label} onChange={(e) => setNewField({...newField, field_label: e.target.value})} placeholder="e.g., Pan Number" />
                        </div>
                        <div className="space-y-2">
                            <Label>Section *</Label>
                            <Select value={newField.section_key} onValueChange={(val) => setNewField({...newField, section_key: val})}>
                                <SelectTrigger><SelectValue placeholder="Select section..." /></SelectTrigger>
                                <SelectContent>
                                    {sections.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Field Type</Label>
                            <Select value={newField.field_type} onValueChange={(val) => setNewField({...newField, field_type: val})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="select">Dropdown</SelectItem>
                                    <SelectItem value="textarea">Text Area</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {['select', 'radio'].includes(newField.field_type) && (
                            <div className="space-y-2">
                                <Label>Options (comma separated)</Label>
                                <Textarea value={newField.field_options} onChange={(e) => setNewField({...newField, field_options: e.target.value})} placeholder="Option A, Option B" />
                            </div>
                        )}
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                            <Switch checked={newField.is_required} onCheckedChange={(c) => setNewField({...newField, is_required: c})} className="data-[state=checked]:bg-red-500" />
                            <Label className="cursor-pointer text-sm">Mark as Required</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddCustomField(false)}>Cancel</Button>
                        <Button onClick={handleAddCustomField}>Add Field</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Options Dialog */}
            <Dialog open={optionEditModalOpen} onOpenChange={setOptionEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Options</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="mb-2 block">Options (comma separated)</Label>
                        <Textarea value={optionText} onChange={(e) => setOptionText(e.target.value)} rows={6} className="font-mono text-sm" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOptionEditModalOpen(false)}>Cancel</Button>
                        <Button onClick={saveOptions}>Save Options</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
const EmployeeFormSettings = () => {
    const { school } = useAuth();
    const { selectedBranch } = useBranch();
    
    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-6xl mx-auto p-6">
                <div className="flex items-center gap-4 pb-4 border-b">
                    <div className="p-3 rounded-xl bg-primary/10">
                        <Settings className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Employee Form Settings</h1>
                        <p className="text-muted-foreground">Configure form fields, departments, and designations</p>
                    </div>
                </div>

                <Tabs defaultValue="form-fields" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="form-fields" className="gap-2">
                            <LayoutList className="h-4 w-4" /> Form Fields
                        </TabsTrigger>
                        <TabsTrigger value="departments" className="gap-2">
                            <Building className="h-4 w-4" /> Departments
                        </TabsTrigger>
                        <TabsTrigger value="designations" className="gap-2">
                            <Briefcase className="h-4 w-4" /> Designations
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="form-fields" className="mt-6">
                        <EmployeeFormFieldsSettings />
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
