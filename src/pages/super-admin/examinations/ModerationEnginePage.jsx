/**
 * Moderation Engine Page - Phase 5
 * Configure and apply marks moderation (scaling, curve adjustment, percentage increase)
 * @file jashchar-frontend/src/pages/super-admin/examinations/ModerationEnginePage.jsx
 * @date 2026-03-13
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { 
    examGroupService, 
    moderationService 
} from '@/services/examinationService';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/dateUtils';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Icons
import { 
    Plus,
    Edit,
    Trash2,
    Save,
    RefreshCw,
    Settings,
    Play,
    TrendingUp,
    Percent,
    LineChart,
    ArrowUpCircle,
    Loader2,
    AlertCircle,
    CheckCircle,
    FileCheck,
    Calculator
} from 'lucide-react';

const MODERATION_TYPES = [
    { 
        value: 'linear_scaling', 
        label: 'Linear Scaling', 
        icon: ArrowUpCircle, 
        color: 'bg-blue-500',
        description: 'Add fixed marks to all students'
    },
    { 
        value: 'percentage_increase', 
        label: 'Percentage Increase', 
        icon: Percent, 
        color: 'bg-green-500',
        description: 'Increase marks by percentage'
    },
    { 
        value: 'curve_adjustment', 
        label: 'Curve Adjustment', 
        icon: LineChart, 
        color: 'bg-purple-500',
        description: 'Bell curve normalization'
    },
    { 
        value: 'minimum_marks', 
        label: 'Minimum Marks', 
        icon: TrendingUp, 
        color: 'bg-orange-500',
        description: 'Set minimum threshold'
    }
];

const ModerationEnginePage = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // Data State
    const [examGroups, setExamGroups] = useState([]);
    const [moderationRules, setModerationRules] = useState([]);
    const [appliedModeration, setAppliedModeration] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);

    // Filter State
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedType, setSelectedType] = useState('');

    // UI State
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [showRuleDialog, setShowRuleDialog] = useState(false);
    const [showApplyDialog, setShowApplyDialog] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [deleteRule, setDeleteRule] = useState(null);
    const [selectedRuleForApply, setSelectedRuleForApply] = useState(null);
    const [activeTab, setActiveTab] = useState('rules');

    // Form State
    const [ruleForm, setRuleForm] = useState({
        name: '',
        description: '',
        moderation_type: 'linear_scaling',
        parameters: {
            add_marks: 5,
            percentage: 10,
            target_mean: 50,
            target_std_dev: 15,
            minimum: 33,
            max_marks: 100
        },
        apply_to_class: '',
        subject_id: '',
        exam_group_id: '',
        is_active: true,
        priority: 1
    });

    // Apply Form State
    const [applyForm, setApplyForm] = useState({
        class_id: '',
        subject_id: ''
    });

    // Load initial data
    useEffect(() => {
        if (selectedBranch?.id) {
            loadExamGroups();
            loadClasses();
            loadSubjects();
        }
    }, [selectedBranch?.id, currentSessionId]);

    useEffect(() => {
        if (selectedGroup) {
            loadModerationRules();
            loadAppliedModeration();
        }
    }, [selectedGroup, selectedType]);

    const loadExamGroups = async () => {
        try {
            const response = await examGroupService.getAll();
            if (response.success) {
                setExamGroups(response.data || []);
            }
        } catch (error) {
            console.error('Error loading exam groups:', error);
        }
    };

    const loadClasses = async () => {
        try {
            const { data } = await supabase
                .from('classes')
                .select('id, name')
                .eq('branch_id', selectedBranch.id)
                .order('name');
            setClasses(data || []);
        } catch (error) {
            console.error('Error loading classes:', error);
        }
    };

    const loadSubjects = async () => {
        try {
            const { data } = await supabase
                .from('subjects')
                .select('id, name')
                .eq('branch_id', selectedBranch.id)
                .order('name');
            setSubjects(data || []);
        } catch (error) {
            console.error('Error loading subjects:', error);
        }
    };

    const loadModerationRules = async () => {
        setLoading(true);
        try {
            const filters = { exam_group_id: selectedGroup };
            if (selectedType) filters.moderation_type = selectedType;
            
            const response = await moderationService.getRules(filters);
            if (response.success) {
                setModerationRules(response.data || []);
            }
        } catch (error) {
            console.error('Error loading moderation rules:', error);
            toast({ title: 'Error', description: 'Failed to load moderation rules', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const loadAppliedModeration = async () => {
        try {
            const response = await moderationService.getApplied({ exam_group_id: selectedGroup });
            if (response.success) {
                setAppliedModeration(response.data || []);
            }
        } catch (error) {
            console.error('Error loading applied moderation:', error);
        }
    };

    const handleCreateRule = () => {
        setEditingRule(null);
        setRuleForm({
            name: '',
            description: '',
            moderation_type: 'linear_scaling',
            parameters: {
                add_marks: 5,
                percentage: 10,
                target_mean: 50,
                target_std_dev: 15,
                minimum: 33,
                max_marks: 100
            },
            apply_to_class: '',
            subject_id: '',
            exam_group_id: selectedGroup,
            is_active: true,
            priority: moderationRules.length + 1
        });
        setShowRuleDialog(true);
    };

    const handleEditRule = (rule) => {
        setEditingRule(rule);
        setRuleForm({
            name: rule.name,
            description: rule.description || '',
            moderation_type: rule.moderation_type,
            parameters: rule.parameters || {},
            apply_to_class: rule.apply_to_class || '',
            subject_id: rule.subject_id || '',
            exam_group_id: rule.exam_group_id,
            is_active: rule.is_active,
            priority: rule.priority || 1
        });
        setShowRuleDialog(true);
    };

    const handleSaveRule = async () => {
        if (!ruleForm.name || !ruleForm.exam_group_id) {
            toast({ title: 'Validation Error', description: 'Name and Exam Group are required', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            let response;
            if (editingRule) {
                response = await moderationService.updateRule(editingRule.id, ruleForm);
            } else {
                response = await moderationService.createRule(ruleForm);
            }

            if (response.success) {
                toast({ 
                    title: 'Success', 
                    description: `Moderation rule ${editingRule ? 'updated' : 'created'} successfully` 
                });
                setShowRuleDialog(false);
                loadModerationRules();
            }
        } catch (error) {
            console.error('Error saving rule:', error);
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRule = async () => {
        if (!deleteRule) return;
        
        setLoading(true);
        try {
            const response = await moderationService.deleteRule(deleteRule.id);
            if (response.success) {
                toast({ title: 'Success', description: 'Moderation rule deleted' });
                loadModerationRules();
            }
        } catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setDeleteRule(null);
            setLoading(false);
        }
    };

    const handleApplyRule = (rule) => {
        setSelectedRuleForApply(rule);
        setApplyForm({ class_id: '', subject_id: rule.subject_id || '' });
        setShowApplyDialog(true);
    };

    const executeApplyModeration = async () => {
        if (!selectedRuleForApply) return;

        setApplying(true);
        try {
            const response = await moderationService.apply({
                rule_id: selectedRuleForApply.id,
                exam_group_id: selectedGroup,
                class_id: applyForm.class_id || undefined,
                subject_id: applyForm.subject_id || undefined
            });

            if (response.success) {
                toast({ 
                    title: 'Success', 
                    description: `Moderation applied to ${response.count || 0} records` 
                });
                setShowApplyDialog(false);
                loadAppliedModeration();
            }
        } catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setApplying(false);
        }
    };

    const getTypeInfo = (type) => {
        return MODERATION_TYPES.find(t => t.value === type) || MODERATION_TYPES[0];
    };

    const renderParameterInputs = () => {
        switch (ruleForm.moderation_type) {
            case 'linear_scaling':
                return (
                    <div>
                        <Label>Add Marks (Fixed)</Label>
                        <Input 
                            type="number"
                            value={ruleForm.parameters.add_marks || 0}
                            onChange={(e) => setRuleForm({
                                ...ruleForm,
                                parameters: { ...ruleForm.parameters, add_marks: parseFloat(e.target.value) || 0 }
                            })}
                            min={0}
                            max={50}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            All marks will be increased by this fixed amount
                        </p>
                    </div>
                );
            case 'percentage_increase':
                return (
                    <div>
                        <Label>Percentage Increase (%)</Label>
                        <Input 
                            type="number"
                            value={ruleForm.parameters.percentage || 0}
                            onChange={(e) => setRuleForm({
                                ...ruleForm,
                                parameters: { ...ruleForm.parameters, percentage: parseFloat(e.target.value) || 0 }
                            })}
                            min={0}
                            max={100}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Marks will be increased by this percentage
                        </p>
                    </div>
                );
            case 'curve_adjustment':
                return (
                    <div className="space-y-4">
                        <div>
                            <Label>Target Mean</Label>
                            <Input 
                                type="number"
                                value={ruleForm.parameters.target_mean || 50}
                                onChange={(e) => setRuleForm({
                                    ...ruleForm,
                                    parameters: { ...ruleForm.parameters, target_mean: parseFloat(e.target.value) || 50 }
                                })}
                                min={0}
                                max={100}
                            />
                        </div>
                        <div>
                            <Label>Target Standard Deviation</Label>
                            <Input 
                                type="number"
                                value={ruleForm.parameters.target_std_dev || 15}
                                onChange={(e) => setRuleForm({
                                    ...ruleForm,
                                    parameters: { ...ruleForm.parameters, target_std_dev: parseFloat(e.target.value) || 15 }
                                })}
                                min={1}
                                max={30}
                            />
                        </div>
                    </div>
                );
            case 'minimum_marks':
                return (
                    <div>
                        <Label>Minimum Marks Threshold</Label>
                        <Input 
                            type="number"
                            value={ruleForm.parameters.minimum || 33}
                            onChange={(e) => setRuleForm({
                                ...ruleForm,
                                parameters: { ...ruleForm.parameters, minimum: parseFloat(e.target.value) || 33 }
                            })}
                            min={0}
                            max={100}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            All marks below this will be raised to this threshold
                        </p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Moderation Engine</h1>
                        <p className="text-muted-foreground">Configure and apply marks moderation rules</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={loadModerationRules} disabled={!selectedGroup}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        <Button onClick={handleCreateRule} disabled={!selectedGroup}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Rule
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Exam Group</Label>
                                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Exam Group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {examGroups.map(group => (
                                            <SelectItem key={group.id} value={group.id}>
                                                {group.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Moderation Type</Label>
                                <Select 
                                    value={selectedType || 'all'} 
                                    onValueChange={(v) => setSelectedType(v === 'all' ? '' : v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {MODERATION_TYPES.map(type => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {!selectedGroup ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Calculator className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Please select an Exam Group to view moderation rules</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="rules">
                                <Settings className="w-4 h-4 mr-2" />
                                Rules ({moderationRules.length})
                            </TabsTrigger>
                            <TabsTrigger value="applied">
                                <FileCheck className="w-4 h-4 mr-2" />
                                Applied Moderation ({appliedModeration.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="rules" className="mt-4">
                            <Card>
                                <CardContent className="p-0">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                            Loading...
                                        </div>
                                    ) : moderationRules.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Calculator className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                            <p className="text-muted-foreground">No moderation rules found</p>
                                            <Button className="mt-4" onClick={handleCreateRule}>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Create First Rule
                                            </Button>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[50px]">Priority</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Parameters</TableHead>
                                                    <TableHead>Subject</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {moderationRules.map(rule => {
                                                    const typeInfo = getTypeInfo(rule.moderation_type);
                                                    const TypeIcon = typeInfo.icon;
                                                    return (
                                                        <TableRow key={rule.id}>
                                                            <TableCell className="font-bold">{rule.priority}</TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`p-1.5 rounded ${typeInfo.color}`}>
                                                                        <TypeIcon className="w-4 h-4 text-white" />
                                                                    </div>
                                                                    <span className="text-sm">{typeInfo.label}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="font-medium">{rule.name}</TableCell>
                                                            <TableCell>
                                                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                                                    {JSON.stringify(rule.parameters)}
                                                                </code>
                                                            </TableCell>
                                                            <TableCell>
                                                                {rule.subjects?.name || 'All'}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                                                                    {rule.is_active ? 'Active' : 'Inactive'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex gap-2">
                                                                    <Button 
                                                                        variant="outline" 
                                                                        size="sm"
                                                                        onClick={() => handleApplyRule(rule)}
                                                                        disabled={!rule.is_active}
                                                                    >
                                                                        <Play className="w-4 h-4 mr-1" />
                                                                        Apply
                                                                    </Button>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="sm"
                                                                        onClick={() => handleEditRule(rule)}
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="sm"
                                                                        onClick={() => setDeleteRule(rule)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="applied" className="mt-4">
                            <Card>
                                <CardContent className="p-0">
                                    {appliedModeration.length === 0 ? (
                                        <div className="text-center py-12">
                                            <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                            <p className="text-muted-foreground">No moderation has been applied yet</p>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Student</TableHead>
                                                    <TableHead>Admission No</TableHead>
                                                    <TableHead>Subject</TableHead>
                                                    <TableHead>Original</TableHead>
                                                    <TableHead>Moderated</TableHead>
                                                    <TableHead>Change</TableHead>
                                                    <TableHead>Rule</TableHead>
                                                    <TableHead>Applied On</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {appliedModeration.map(record => {
                                                    const change = record.moderated_marks - record.original_marks;
                                                    return (
                                                        <TableRow key={record.id}>
                                                            <TableCell className="font-medium">
                                                                {record.students?.first_name} {record.students?.last_name}
                                                            </TableCell>
                                                            <TableCell>{record.students?.admission_no}</TableCell>
                                                            <TableCell>{record.subjects?.name}</TableCell>
                                                            <TableCell>{record.original_marks}</TableCell>
                                                            <TableCell className="font-bold">{record.moderated_marks}</TableCell>
                                                            <TableCell className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                                {change >= 0 ? '+' : ''}{change.toFixed(2)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">
                                                                    {record.exam_moderation_rules?.name}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>{formatDate(record.applied_at)}</TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                )}

                {/* Rule Dialog */}
                <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {editingRule ? 'Edit Moderation Rule' : 'Create Moderation Rule'}
                            </DialogTitle>
                            <DialogDescription>
                                Configure moderation parameters for marks adjustment
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Moderation Type</Label>
                                    <Select 
                                        value={ruleForm.moderation_type} 
                                        onValueChange={(v) => setRuleForm({...ruleForm, moderation_type: v})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MODERATION_TYPES.map(type => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Priority</Label>
                                    <Input 
                                        type="number"
                                        value={ruleForm.priority}
                                        onChange={(e) => setRuleForm({...ruleForm, priority: parseInt(e.target.value) || 1})}
                                        min={1}
                                        max={100}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Name</Label>
                                <Input 
                                    value={ruleForm.name}
                                    onChange={(e) => setRuleForm({...ruleForm, name: e.target.value})}
                                    placeholder="e.g., Math Paper 1 Scaling"
                                />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea 
                                    value={ruleForm.description}
                                    onChange={(e) => setRuleForm({...ruleForm, description: e.target.value})}
                                    placeholder="Describe the purpose of this moderation..."
                                    rows={2}
                                />
                            </div>
                            
                            <Card className="bg-muted/50">
                                <CardContent className="pt-4">
                                    <div className="text-sm font-medium mb-3">Moderation Parameters</div>
                                    {renderParameterInputs()}
                                </CardContent>
                            </Card>

                            <div>
                                <Label>Max Marks (Cap)</Label>
                                <Input 
                                    type="number"
                                    value={ruleForm.parameters.max_marks || 100}
                                    onChange={(e) => setRuleForm({
                                        ...ruleForm,
                                        parameters: { ...ruleForm.parameters, max_marks: parseFloat(e.target.value) || 100 }
                                    })}
                                    min={0}
                                    max={200}
                                />
                            </div>

                            <div>
                                <Label>Apply to Subject (Optional)</Label>
                                <Select 
                                    value={ruleForm.subject_id || 'all'} 
                                    onValueChange={(v) => setRuleForm({...ruleForm, subject_id: v === 'all' ? '' : v})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Subjects" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Subjects</SelectItem>
                                        {subjects.map(subject => (
                                            <SelectItem key={subject.id} value={subject.id}>
                                                {subject.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Switch 
                                        checked={ruleForm.is_active}
                                        onCheckedChange={(v) => setRuleForm({...ruleForm, is_active: v})}
                                    />
                                    <Label>Active</Label>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveRule} disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <Save className="w-4 h-4 mr-2" />
                                {editingRule ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Apply Dialog */}
                <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Apply Moderation Rule</DialogTitle>
                            <DialogDescription>
                                Apply "{selectedRuleForApply?.name}" to student marks
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <div className="text-sm font-medium">Rule Details</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Type: {getTypeInfo(selectedRuleForApply?.moderation_type).label}
                                </div>
                                <code className="text-xs mt-2 block">
                                    {JSON.stringify(selectedRuleForApply?.parameters)}
                                </code>
                            </div>
                            <div>
                                <Label>Filter by Class (Optional)</Label>
                                <Select 
                                    value={applyForm.class_id || 'all'} 
                                    onValueChange={(v) => setApplyForm({...applyForm, class_id: v === 'all' ? '' : v})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Classes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Classes</SelectItem>
                                        {classes.map(cls => (
                                            <SelectItem key={cls.id} value={cls.id}>
                                                {cls.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Filter by Subject (Optional)</Label>
                                <Select 
                                    value={applyForm.subject_id || 'all'} 
                                    onValueChange={(v) => setApplyForm({...applyForm, subject_id: v === 'all' ? '' : v})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Subjects" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Subjects</SelectItem>
                                        {subjects.map(subject => (
                                            <SelectItem key={subject.id} value={subject.id}>
                                                {subject.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-yellow-800">Warning</p>
                                        <p className="text-xs text-yellow-700">
                                            This will create moderation records for all matching marks. 
                                            Review carefully before applying.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={executeApplyModeration} disabled={applying}>
                                {applying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <Play className="w-4 h-4 mr-2" />
                                Apply Moderation
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation */}
                <AlertDialog open={!!deleteRule} onOpenChange={() => setDeleteRule(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Moderation Rule?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the rule "{deleteRule?.name}". 
                                Previously applied moderation will not be affected.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteRule} className="bg-red-600 hover:bg-red-700">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
};

export default ModerationEnginePage;
