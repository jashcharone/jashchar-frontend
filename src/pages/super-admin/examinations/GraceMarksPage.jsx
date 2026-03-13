/**
 * Grace Marks Page - Phase 5
 * Configure and apply grace marks for passing, compartment, improvement, sports, medical
 * @file jashchar-frontend/src/pages/super-admin/examinations/GraceMarksPage.jsx
 * @date 2026-03-13
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { 
    examGroupService, 
    graceMarksService 
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
    Gift,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    Settings,
    Users,
    FileCheck,
    Award,
    Heart,
    Trophy,
    Stethoscope,
    Loader2
} from 'lucide-react';

const GRACE_TYPES = [
    { value: 'passing', label: 'Passing Grace', icon: CheckCircle, color: 'bg-green-500' },
    { value: 'compartment', label: 'Compartment Grace', icon: AlertCircle, color: 'bg-yellow-500' },
    { value: 'improvement', label: 'Improvement', icon: Award, color: 'bg-blue-500' },
    { value: 'sports', label: 'Sports Quota', icon: Trophy, color: 'bg-purple-500' },
    { value: 'medical', label: 'Medical', icon: Stethoscope, color: 'bg-red-500' },
    { value: 'other', label: 'Other', icon: Gift, color: 'bg-gray-500' }
];

const GraceMarksPage = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // Data State
    const [examGroups, setExamGroups] = useState([]);
    const [graceConfigs, setGraceConfigs] = useState([]);
    const [appliedGraceMarks, setAppliedGraceMarks] = useState([]);
    const [subjects, setSubjects] = useState([]);

    // Filter State
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedGraceType, setSelectedGraceType] = useState('');

    // UI State
    const [loading, setLoading] = useState(false);
    const [showConfigDialog, setShowConfigDialog] = useState(false);
    const [showApplyDialog, setShowApplyDialog] = useState(false);
    const [editingConfig, setEditingConfig] = useState(null);
    const [deleteConfig, setDeleteConfig] = useState(null);
    const [activeTab, setActiveTab] = useState('configs');

    // Form State
    const [configForm, setConfigForm] = useState({
        grace_type: 'passing',
        name: '',
        description: '',
        max_marks: 5,
        min_marks_required: 30,
        apply_per_subject: true,
        subject_id: '',
        exam_group_id: '',
        is_active: true,
        auto_apply: false,
        conditions: {}
    });

    // Load initial data
    useEffect(() => {
        if (selectedBranch?.id) {
            loadExamGroups();
        }
    }, [selectedBranch?.id, currentSessionId]);

    useEffect(() => {
        if (selectedGroup) {
            loadGraceConfigs();
            loadAppliedGraceMarks();
            loadSubjects();
        }
    }, [selectedGroup, selectedGraceType]);

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

    const loadGraceConfigs = async () => {
        setLoading(true);
        try {
            const filters = { exam_group_id: selectedGroup };
            if (selectedGraceType) filters.grace_type = selectedGraceType;
            
            const response = await graceMarksService.getConfigs(filters);
            if (response.success) {
                setGraceConfigs(response.data || []);
            }
        } catch (error) {
            console.error('Error loading grace configs:', error);
            toast({ title: 'Error', description: 'Failed to load grace configurations', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const loadAppliedGraceMarks = async () => {
        try {
            const response = await graceMarksService.getApplied({ exam_group_id: selectedGroup });
            if (response.success) {
                setAppliedGraceMarks(response.data || []);
            }
        } catch (error) {
            console.error('Error loading applied grace marks:', error);
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

    const handleCreateConfig = () => {
        setEditingConfig(null);
        setConfigForm({
            grace_type: 'passing',
            name: '',
            description: '',
            max_marks: 5,
            min_marks_required: 30,
            apply_per_subject: true,
            subject_id: '',
            exam_group_id: selectedGroup,
            is_active: true,
            auto_apply: false,
            conditions: {}
        });
        setShowConfigDialog(true);
    };

    const handleEditConfig = (config) => {
        setEditingConfig(config);
        setConfigForm({
            grace_type: config.grace_type,
            name: config.name,
            description: config.description || '',
            max_marks: config.max_marks,
            min_marks_required: config.min_marks_required || 30,
            apply_per_subject: config.apply_per_subject ?? true,
            subject_id: config.subject_id || '',
            exam_group_id: config.exam_group_id,
            is_active: config.is_active,
            auto_apply: config.auto_apply || false,
            conditions: config.conditions || {}
        });
        setShowConfigDialog(true);
    };

    const handleSaveConfig = async () => {
        if (!configForm.name || !configForm.exam_group_id) {
            toast({ title: 'Validation Error', description: 'Name and Exam Group are required', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            let response;
            if (editingConfig) {
                response = await graceMarksService.updateConfig(editingConfig.id, configForm);
            } else {
                response = await graceMarksService.createConfig(configForm);
            }

            if (response.success) {
                toast({ 
                    title: 'Success', 
                    description: `Grace configuration ${editingConfig ? 'updated' : 'created'} successfully` 
                });
                setShowConfigDialog(false);
                loadGraceConfigs();
            }
        } catch (error) {
            console.error('Error saving config:', error);
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfig = async () => {
        if (!deleteConfig) return;
        
        setLoading(true);
        try {
            const response = await graceMarksService.deleteConfig(deleteConfig.id);
            if (response.success) {
                toast({ title: 'Success', description: 'Grace configuration deleted' });
                loadGraceConfigs();
            }
        } catch (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setDeleteConfig(null);
            setLoading(false);
        }
    };

    const getGraceTypeInfo = (type) => {
        return GRACE_TYPES.find(g => g.value === type) || GRACE_TYPES[5];
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Grace Marks Management</h1>
                        <p className="text-muted-foreground">Configure and apply grace marks rules</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={loadGraceConfigs} disabled={!selectedGroup}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        <Button onClick={handleCreateConfig} disabled={!selectedGroup}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Configuration
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
                                <Label>Grace Type</Label>
                                <Select 
                                    value={selectedGraceType || 'all'} 
                                    onValueChange={(v) => setSelectedGraceType(v === 'all' ? '' : v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {GRACE_TYPES.map(type => (
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
                            <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Please select an Exam Group to view grace configurations</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="configs">
                                <Settings className="w-4 h-4 mr-2" />
                                Configurations ({graceConfigs.length})
                            </TabsTrigger>
                            <TabsTrigger value="applied">
                                <FileCheck className="w-4 h-4 mr-2" />
                                Applied Grace Marks ({appliedGraceMarks.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="configs" className="mt-4">
                            <Card>
                                <CardContent className="p-0">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                            Loading...
                                        </div>
                                    ) : graceConfigs.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                            <p className="text-muted-foreground">No grace configurations found</p>
                                            <Button className="mt-4" onClick={handleCreateConfig}>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Create First Configuration
                                            </Button>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Max Marks</TableHead>
                                                    <TableHead>Min Required</TableHead>
                                                    <TableHead>Subject</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {graceConfigs.map(config => {
                                                    const typeInfo = getGraceTypeInfo(config.grace_type);
                                                    const TypeIcon = typeInfo.icon;
                                                    return (
                                                        <TableRow key={config.id}>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`p-1.5 rounded ${typeInfo.color}`}>
                                                                        <TypeIcon className="w-4 h-4 text-white" />
                                                                    </div>
                                                                    <span className="text-sm">{typeInfo.label}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="font-medium">{config.name}</TableCell>
                                                            <TableCell>{config.max_marks}</TableCell>
                                                            <TableCell>{config.min_marks_required || '-'}</TableCell>
                                                            <TableCell>
                                                                {config.apply_per_subject 
                                                                    ? (config.subjects?.name || 'All Subjects') 
                                                                    : 'Total'}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant={config.is_active ? 'default' : 'secondary'}>
                                                                    {config.is_active ? 'Active' : 'Inactive'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex gap-2">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="sm"
                                                                        onClick={() => handleEditConfig(config)}
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="sm"
                                                                        onClick={() => setDeleteConfig(config)}
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
                                    {appliedGraceMarks.length === 0 ? (
                                        <div className="text-center py-12">
                                            <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                            <p className="text-muted-foreground">No grace marks have been applied yet</p>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Student</TableHead>
                                                    <TableHead>Admission No</TableHead>
                                                    <TableHead>Subject</TableHead>
                                                    <TableHead>Original Marks</TableHead>
                                                    <TableHead>Grace Given</TableHead>
                                                    <TableHead>Final Marks</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Applied On</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {appliedGraceMarks.map(record => (
                                                    <TableRow key={record.id}>
                                                        <TableCell className="font-medium">
                                                            {record.students?.first_name} {record.students?.last_name}
                                                        </TableCell>
                                                        <TableCell>{record.students?.admission_no}</TableCell>
                                                        <TableCell>{record.subjects?.name}</TableCell>
                                                        <TableCell>{record.original_marks}</TableCell>
                                                        <TableCell className="text-green-600 font-medium">
                                                            +{record.grace_marks_given}
                                                        </TableCell>
                                                        <TableCell className="font-bold">{record.final_marks}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">
                                                                {record.exam_grace_marks?.grace_type || record.reason}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{formatDate(record.applied_at)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                )}

                {/* Config Dialog */}
                <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {editingConfig ? 'Edit Grace Configuration' : 'Create Grace Configuration'}
                            </DialogTitle>
                            <DialogDescription>
                                Configure grace marks rules for the selected exam group
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Grace Type</Label>
                                    <Select 
                                        value={configForm.grace_type} 
                                        onValueChange={(v) => setConfigForm({...configForm, grace_type: v})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {GRACE_TYPES.map(type => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Name</Label>
                                    <Input 
                                        value={configForm.name}
                                        onChange={(e) => setConfigForm({...configForm, name: e.target.value})}
                                        placeholder="e.g., Passing Grace 5 Marks"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea 
                                    value={configForm.description}
                                    onChange={(e) => setConfigForm({...configForm, description: e.target.value})}
                                    placeholder="Describe when this grace should be applied..."
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Maximum Grace Marks</Label>
                                    <Input 
                                        type="number"
                                        value={configForm.max_marks}
                                        onChange={(e) => setConfigForm({...configForm, max_marks: parseInt(e.target.value) || 0})}
                                        min={1}
                                        max={50}
                                    />
                                </div>
                                <div>
                                    <Label>Min Marks Required (to qualify)</Label>
                                    <Input 
                                        type="number"
                                        value={configForm.min_marks_required}
                                        onChange={(e) => setConfigForm({...configForm, min_marks_required: parseInt(e.target.value) || 0})}
                                        min={0}
                                        max={100}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Switch 
                                        checked={configForm.apply_per_subject}
                                        onCheckedChange={(v) => setConfigForm({...configForm, apply_per_subject: v})}
                                    />
                                    <Label>Apply per subject</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch 
                                        checked={configForm.is_active}
                                        onCheckedChange={(v) => setConfigForm({...configForm, is_active: v})}
                                    />
                                    <Label>Active</Label>
                                </div>
                            </div>
                            {configForm.apply_per_subject && (
                                <div>
                                    <Label>Specific Subject (leave empty for all)</Label>
                                    <Select 
                                        value={configForm.subject_id || 'all'} 
                                        onValueChange={(v) => setConfigForm({...configForm, subject_id: v === 'all' ? '' : v})}
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
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveConfig} disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <Save className="w-4 h-4 mr-2" />
                                {editingConfig ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation */}
                <AlertDialog open={!!deleteConfig} onOpenChange={() => setDeleteConfig(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Grace Configuration?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the grace configuration "{deleteConfig?.name}". 
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteConfig} className="bg-red-600 hover:bg-red-700">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
};

export default GraceMarksPage;
