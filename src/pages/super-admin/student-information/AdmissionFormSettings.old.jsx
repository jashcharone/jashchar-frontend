import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
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
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { 
    Loader2, Trash2, Edit, Save, Plus, Settings, Eye, EyeOff, GripVertical,
    ChevronDown, ChevronRight, Type, LayoutList, AlignLeft, Hash, Calendar,
    CheckSquare, Circle, Upload, BookOpen, User, Key, Shield, Users, UserCog,
    FileText, MapPin, Bus, Building, Phone, Briefcase, GraduationCap, CreditCard, Files
} from 'lucide-react';

// Sub-modules
import StudentCategories from './StudentCategories';
import StudentHouse from './StudentHouse';

// Icon mapping for sections
const SECTION_ICONS = {
    BookOpen, User, Key, Shield, Users, UserCog, FileText, MapPin, Bus, Building,
    Phone, Briefcase, GraduationCap, CreditCard, Files
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
            {/* Drag Handle */}
            <div className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Field Info */}
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

            {/* Actions */}
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
                {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox' || 
                  field.field_type === 'select' || field.field_type === 'radio' || field.field_type === 'checkbox') && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => onEdit(field)} title="Edit Options">
                        <Edit className="h-3.5 w-3.5" />
                    </Button>
                )}
                {isCustom && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(field.id)} title="Delete Field">
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
                                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
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
                            <div className="flex items-center gap-2">
                                {customFields.length > 0 && (
                                    <Badge variant="outline" className="text-xs border-purple-500 text-purple-500">
                                        +{customFields.length} custom
                                    </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                    {allFields.length} fields
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="pt-0 pb-3 px-4">
                        <div className="space-y-1.5">
                            {allFields.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-lg bg-muted/20">
                                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    No fields in this section
                                </div>
                            ) : (
                                <>
                                    {fields
                                        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                                        .map((field) => (
                                            <FieldCard 
                                                key={field.key}
                                                field={field}
                                                onToggle={onFieldToggle}
                                                onEdit={onFieldEdit}
                                                onDelete={onFieldDelete}
                                                isCustom={false}
                                            />
                                        ))
                                    }
                                    {customFields
                                        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                                        .map((field) => (
                                            <FieldCard 
                                                key={field.id}
                                                field={field}
                                                onToggle={onFieldToggle}
                                                onEdit={onFieldEdit}
                                                onDelete={onFieldDelete}
                                                isCustom={true}
                                            />
                                        ))
                                    }
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
// MAIN FORM FIELDS SETTINGS COMPONENT
// ============================================================================
const AdmissionFormFieldsSettings = () => {
    const { school } = useAuth();
    const { toast } = useToast();
    
    // State
    const [loading, setLoading] = useState(true);
    const [sections, setSections] = useState([]);
    const [systemFields, setSystemFields] = useState([]);
    const [customFields, setCustomFields] = useState([]);
    const [expandedSections, setExpandedSections] = useState({});
    
    // Custom field modal
    const [showAddCustomField, setShowAddCustomField] = useState(false);
    const [newField, setNewField] = useState({
        field_label: '',
        field_type: 'text',
        is_required: false,
        field_options: '',
        section_key: ''
    });
    
    // Option editing
    const [optionEditModalOpen, setOptionEditModalOpen] = useState(false);
    const [currentEditingField, setCurrentEditingField] = useState(null);
    const [optionText, setOptionText] = useState('');

    // ==================== DATA FETCHING ====================
    const fetchSettings = useCallback(async () => {
        if (!school?.id) return;
        setLoading(true);
        try {
            const { data } = await api.get('/form-settings', {
                params: { branchId: school.id, module: 'student_admission' }
            });
            setSections(data.sections || []);
            setSystemFields(data.systemFields || []);
            setCustomFields(data.customFields || []);
            
            // Expand all sections by default
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

    // ==================== FIELD OPERATIONS ====================
    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    const handleFieldToggle = async (field, toggleType) => {
        const isSystem = field.is_system;
        const currentValue = toggleType === 'is_enabled' ? (field.is_enabled !== false) : field.is_required;
        const newValue = !currentValue;
        
        // Optimistic update
        if (isSystem) {
            setSystemFields(prev => prev.map(f => {
                if (f.key === field.key) {
                    let updated = { ...f, [toggleType]: newValue };
                    // If disabling, also set not required
                    if (toggleType === 'is_enabled' && !newValue) {
                        updated.is_required = false;
                    }
                    // If setting required, must be enabled
                    if (toggleType === 'is_required' && newValue) {
                        updated.is_enabled = true;
                    }
                    return updated;
                }
                return f;
            }));
        } else {
            setCustomFields(prev => prev.map(f => {
                if (f.id === field.id) {
                    let updated = { ...f, [toggleType]: newValue };
                    if (toggleType === 'is_enabled' && !newValue) {
                        updated.is_required = false;
                    }
                    if (toggleType === 'is_required' && newValue) {
                        updated.is_enabled = true;
                    }
                    return updated;
                }
                return f;
            }));
        }

        // Save to backend
        try {
            if (isSystem) {
                const updatedField = systemFields.find(f => f.key === field.key);
                let finalValue = newValue;
                let additionalUpdates = {};
                
                if (toggleType === 'is_enabled' && !newValue) {
                    additionalUpdates.is_required = false;
                }
                if (toggleType === 'is_required' && newValue) {
                    additionalUpdates.is_enabled = true;
                }
                
                await api.post('/form-settings/save', {
                    branch_id: school.id,
                    module: 'student_admission',
                    settings: [{
                        field_key: field.key,
                        field_label: field.field_label || field.label,
                        is_enabled: toggleType === 'is_enabled' ? newValue : (additionalUpdates.is_enabled ?? (field.is_enabled !== false)),
                        is_required: toggleType === 'is_required' ? newValue : (additionalUpdates.is_required ?? field.is_required),
                        field_options: field.field_options || [],
                        section_key: field.section_key || field.section,
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
            console.error('Error saving field toggle:', error);
            toast({ variant: 'destructive', title: 'Error saving changes' });
            fetchSettings(); // Revert
        }
    };

    const handleFieldEdit = (field) => {
        setCurrentEditingField(field);
        const opts = field.field_options || [];
        const text = Array.isArray(opts) ? opts.map(o => {
            if (typeof o === 'string') return o;
            if (o.value && o.label && o.value !== o.label) return `${o.value}:${o.label}`;
            return o.value || o.label || '';
        }).join(', ') : '';
        setOptionText(text);
        setOptionEditModalOpen(true);
    };

    const saveOptions = async () => {
        if (!currentEditingField) return;
        
        const rawOptions = optionText.split(',');
        const optionsJson = rawOptions.map(opt => {
            const [val, lab] = opt.includes(':') ? opt.split(':') : [opt, opt];
            return { value: val.trim(), label: lab?.trim() || val.trim() };
        }).filter(o => o.value);
        
        try {
            if (currentEditingField.is_system) {
                setSystemFields(prev => prev.map(f => {
                    if (f.key === currentEditingField.key) {
                        return { ...f, field_options: optionsJson };
                    }
                    return f;
                }));
                
                await api.post('/form-settings/save', {
                    branch_id: school.id,
                    module: 'student_admission',
                    settings: [{
                        field_key: currentEditingField.key,
                        field_label: currentEditingField.field_label || currentEditingField.label,
                        is_enabled: currentEditingField.is_enabled !== false,
                        is_required: currentEditingField.is_required || false,
                        field_options: optionsJson,
                        section_key: currentEditingField.section_key || currentEditingField.section,
                        sort_order: currentEditingField.sort_order || currentEditingField.order || 0
                    }]
                });
            } else {
                await api.put(`/form-settings/custom-field/${currentEditingField.id}`, {
                    field_options: optionsJson
                });
                fetchSettings();
            }
            toast({ title: 'Options updated successfully' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error updating options' });
        }
        
        setOptionEditModalOpen(false);
        setCurrentEditingField(null);
    };

    // ==================== CUSTOM FIELD CRUD ====================
    const handleAddCustomField = async () => {
        if (!newField.field_label) {
            toast({ variant: 'destructive', title: 'Field label is required' });
            return;
        }
        if (!newField.section_key) {
            toast({ variant: 'destructive', title: 'Please select a section' });
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
                module: 'student_admission',
                field_label: newField.field_label,
                field_type: newField.field_type,
                is_required: newField.is_required,
                field_options: optionsJson,
                section_key: newField.section_key,
                sort_order: customFields.filter(f => f.section_key === newField.section_key).length
            });
            
            toast({ title: 'Custom field added successfully' });
            setNewField({ field_label: '', field_type: 'text', is_required: false, field_options: '', section_key: '' });
            setShowAddCustomField(false);
            fetchSettings();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error adding custom field' });
        }
    };

    const handleDeleteCustomField = async (id) => {
        if (!confirm('Delete this custom field? This action cannot be undone.')) return;
        try {
            await api.delete(`/form-settings/custom-field/${id}`);
            toast({ title: 'Field deleted successfully' });
            fetchSettings();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error deleting field' });
        }
    };

    // ==================== HELPER FUNCTIONS ====================
    const getSystemFieldsForSection = (sectionKey) => {
        return systemFields.filter(f => (f.section_key || f.section) === sectionKey);
    };
    
    const getCustomFieldsForSection = (sectionKey) => {
        return customFields.filter(f => f.section_key === sectionKey);
    };

    // ==================== RENDER ====================
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg">
                <div>
                    <h2 className="text-lg font-semibold">Form Fields Configuration</h2>
                    <p className="text-sm text-muted-foreground">
                        Configure visibility and requirements for each field in the admission form
                    </p>
                </div>
                <Button onClick={() => setShowAddCustomField(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Custom Field
                </Button>
            </div>

            {/* Stats */}
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

            {/* Sections */}
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
                </div>
            </ScrollArea>

            {/* Add Custom Field Dialog */}
            <Dialog open={showAddCustomField} onOpenChange={setShowAddCustomField}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-primary" />
                            Add Custom Field
                        </DialogTitle>
                        <DialogDescription>
                            Create a new custom field for the admission form
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Field Label *</Label>
                            <Input 
                                value={newField.field_label}
                                onChange={(e) => setNewField({...newField, field_label: e.target.value})}
                                placeholder="e.g., Emergency Contact Name"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Section *</Label>
                            <Select 
                                value={newField.section_key}
                                onValueChange={(val) => setNewField({...newField, section_key: val})}
                            >
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
                            <Select 
                                value={newField.field_type}
                                onValueChange={(val) => setNewField({...newField, field_type: val})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">Text Input</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="select">Dropdown</SelectItem>
                                    <SelectItem value="textarea">Text Area</SelectItem>
                                    <SelectItem value="checkbox">Checkbox</SelectItem>
                                    <SelectItem value="radio">Radio Group</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {['select', 'radio', 'checkbox'].includes(newField.field_type) && (
                            <div className="space-y-2">
                                <Label>Options (comma separated)</Label>
                                <Textarea 
                                    value={newField.field_options}
                                    onChange={(e) => setNewField({...newField, field_options: e.target.value})}
                                    placeholder="Option A, Option B, Option C"
                                    className="min-h-[80px]"
                                />
                                <p className="text-xs text-muted-foreground">Format: "value" or "value:label"</p>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                            <Switch 
                                checked={newField.is_required}
                                onCheckedChange={(c) => setNewField({...newField, is_required: c})}
                                id="req-new"
                                className="data-[state=checked]:bg-red-500"
                            />
                            <Label htmlFor="req-new" className="cursor-pointer text-sm">
                                Mark as Required Field
                            </Label>
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
                        <DialogDescription>
                            Edit options for "{currentEditingField?.field_label || currentEditingField?.label}"
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="mb-2 block">Options (comma separated)</Label>
                        <Textarea 
                            value={optionText}
                            onChange={(e) => setOptionText(e.target.value)}
                            rows={6}
                            placeholder="Option 1, Option 2, Option 3"
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Format: "value" or "value:label" (e.g., "M:Male, F:Female")
                        </p>
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
const AdmissionFormSettings = () => {
    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-6xl mx-auto p-6">
                <div className="flex items-center gap-4 pb-4 border-b">
                    <div className="p-3 rounded-xl bg-primary/10">
                        <Settings className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Admission Form Settings</h1>
                        <p className="text-muted-foreground">Configure form fields, student categories, and houses</p>
                    </div>
                </div>

                <Tabs defaultValue="form-fields" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="form-fields" className="gap-2">
                            <LayoutList className="h-4 w-4" />
                            Form Fields
                        </TabsTrigger>
                        <TabsTrigger value="categories" className="gap-2">
                            <Users className="h-4 w-4" />
                            Categories
                        </TabsTrigger>
                        <TabsTrigger value="houses" className="gap-2">
                            <Building className="h-4 w-4" />
                            Houses
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="form-fields" className="mt-6">
                        <AdmissionFormFieldsSettings />
                    </TabsContent>
                    
                    <TabsContent value="categories" className="mt-6">
                        <StudentCategories embedded={true} />
                    </TabsContent>
                    
                    <TabsContent value="houses" className="mt-6">
                        <StudentHouse embedded={true} />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default AdmissionFormSettings;
