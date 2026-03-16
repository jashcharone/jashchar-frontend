/**
 * Exam Management Page
 * Create and manage individual exams within exam groups
 * Phase 2 of Examination Module
 * @file jashchar-frontend/src/pages/super-admin/examinations/ExamManagement.jsx
 * @date 2026-03-13
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { examService, examGroupService, examTypeService } from '@/services/examinationService';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatDateForInput } from '@/utils/dateUtils';
import DatePicker from '@/components/ui/DatePicker';
import DashboardLayout from '@/components/DashboardLayout';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
    FileText, 
    Plus, 
    Pencil, 
    Trash2, 
    RefreshCw, 
    Send,
    Calendar,
    BookOpen,
    Clock,
    MapPin,
    Users,
    ChevronRight,
    Save,
    X,
    GraduationCap,
    CheckCircle2,
    XCircle,
    Eye,
    UserPlus,
    Hash
} from 'lucide-react';

const ExamManagement = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // State
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    // Reference data
    const [examGroups, setExamGroups] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);

    // Dialog states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [selectedExamGroup, setSelectedExamGroup] = useState(null);

    // Form
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            exam_group_id: '',
            subject_id: '',
            class_id: '',
            exam_name: '',
            exam_code: '',
            description: '',
            max_marks_total: 100,
            max_marks_theory: '',
            max_marks_practical: '',
            max_marks_internal: '',
            min_passing_marks: 33,
            exam_date: '',
            start_time: '',
            end_time: '',
            duration_minutes: 180,
            room_no: '',
            building: '',
            is_practical: false,
            is_optional: false,
            status: 'draft'
        }
    });

    const watchExamGroupId = watch('exam_group_id');
    const watchMaxMarks = watch('max_marks_total');

    // Fetch exams
    const fetchExams = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (activeTab !== 'all') {
                params.status = activeTab;
            }
            if (selectedExamGroup) {
                params.exam_group_id = selectedExamGroup;
            }
            const response = await examService.getAll(params);
            const examsData = response?.data || (Array.isArray(response) ? response : []);
            setExams(examsData);
        } catch (error) {
            console.error('Error fetching exams:', error);
            toast({
                title: 'Error',
                description: 'Failed to load exams',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    }, [activeTab, selectedExamGroup, toast]);

    // Fetch reference data
    const fetchReferenceData = useCallback(async () => {
        try {
            // Fetch exam groups
            const groupsRes = await examGroupService.getAll();
            const groupsData = groupsRes?.data || (Array.isArray(groupsRes) ? groupsRes : []);
            setExamGroups(groupsData);

            // Fetch classes (academics API returns plain array)
            const classesRes = await apiClient.get('/academics/classes');
            const classesData = classesRes?.data || (Array.isArray(classesRes) ? classesRes : []);
            setClasses(classesData);
        } catch (error) {
            console.error('Error fetching reference data:', error);
        }
    }, []);

    // Fetch subjects when exam group changes
    useEffect(() => {
        const fetchSubjects = async () => {
            if (watchExamGroupId) {
                try {
                    const group = examGroups.find(g => g.id === watchExamGroupId);
                    // Build query - filter by class_id if exam group has one, otherwise get all
                    const classFilter = group?.class_id ? `?class_id=${group.class_id}` : '';
                    const subjectsRes = await apiClient.get(`/academics/subjects${classFilter}`);
                    // Academics API returns plain array, handle both formats
                    const subjectsData = subjectsRes?.data || (Array.isArray(subjectsRes) ? subjectsRes : []);
                    setSubjects(subjectsData);
                } catch (error) {
                    console.error('Error fetching subjects:', error);
                }
            }
        };
        fetchSubjects();
    }, [watchExamGroupId, examGroups]);

    useEffect(() => {
        fetchExams();
    }, [fetchExams]);

    useEffect(() => {
        fetchReferenceData();
    }, [fetchReferenceData]);

    // Reset form
    const resetForm = () => {
        reset({
            exam_group_id: '',
            subject_id: '',
            class_id: '',
            exam_name: '',
            exam_code: '',
            description: '',
            max_marks_total: 100,
            max_marks_theory: '',
            max_marks_practical: '',
            max_marks_internal: '',
            min_passing_marks: 33,
            exam_date: '',
            start_time: '',
            end_time: '',
            duration_minutes: 180,
            room_no: '',
            building: '',
            is_practical: false,
            is_optional: false,
            status: 'draft'
        });
        setEditMode(false);
        setEditId(null);
    };

    // Open create dialog
    const handleCreate = () => {
        resetForm();
        setDialogOpen(true);
    };

    // Open edit dialog
    const handleEdit = (exam) => {
        setEditMode(true);
        setEditId(exam.id);
        setValue('exam_group_id', exam.exam_group_id || '');
        setValue('subject_id', exam.subject_id || '');
        setValue('class_id', exam.class_id || '');
        setValue('exam_name', exam.exam_name || '');
        setValue('exam_code', exam.exam_code || '');
        setValue('description', exam.description || '');
        setValue('max_marks_total', exam.max_marks_total || 100);
        setValue('max_marks_theory', exam.max_marks_theory || '');
        setValue('max_marks_practical', exam.max_marks_practical || '');
        setValue('max_marks_internal', exam.max_marks_internal || '');
        setValue('min_passing_marks', exam.min_passing_marks || 33);
        setValue('exam_date', exam.exam_date ? formatDateForInput(exam.exam_date) : '');
        setValue('start_time', exam.start_time || '');
        setValue('end_time', exam.end_time || '');
        setValue('duration_minutes', exam.duration_minutes || 180);
        setValue('room_no', exam.room_no || '');
        setValue('building', exam.building || '');
        setValue('is_practical', exam.is_practical || false);
        setValue('is_optional', exam.is_optional || false);
        setValue('status', exam.status || 'draft');
        setDialogOpen(true);
    };

    // Submit form
    const onSubmit = async (data) => {
        try {
            // Validate required Select fields
            if (!data.exam_group_id) {
                toast({
                    title: 'Validation Error',
                    description: 'Please select an Exam Group',
                    variant: 'destructive'
                });
                return;
            }
            if (!data.subject_id) {
                toast({
                    title: 'Validation Error',
                    description: 'Please select a Subject',
                    variant: 'destructive'
                });
                return;
            }

            setLoading(true);

            // Get class_id from exam group if not set
            const examGroup = examGroups.find(g => g.id === data.exam_group_id);
            const payload = {
                ...data,
                class_id: data.class_id || examGroup?.class_id,
                max_marks_total: parseFloat(data.max_marks_total) || 100,
                max_marks_theory: data.max_marks_theory ? parseFloat(data.max_marks_theory) : null,
                max_marks_practical: data.max_marks_practical ? parseFloat(data.max_marks_practical) : null,
                max_marks_internal: data.max_marks_internal ? parseFloat(data.max_marks_internal) : null,
                min_passing_marks: parseFloat(data.min_passing_marks) || 33,
                duration_minutes: parseInt(data.duration_minutes) || 180
            };

            let response;
            if (editMode && editId) {
                response = await examService.update(editId, payload);
            } else {
                response = await examService.create(payload);
            }

            if (response.success) {
                toast({
                    title: 'Success',
                    description: editMode ? 'Exam updated successfully' : 'Exam created successfully'
                });
                setDialogOpen(false);
                resetForm();
                fetchExams();
            } else {
                throw new Error(response.error || 'Operation failed');
            }
        } catch (error) {
            console.error('Error saving exam:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to save exam',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    // Delete exam
    const handleDelete = async () => {
        try {
            setLoading(true);
            const response = await examService.delete(deleteId);
            if (response.success) {
                toast({ title: 'Success', description: 'Exam deleted successfully' });
                fetchExams();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete exam',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
            setDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    // Publish exam
    const handlePublish = async (examId) => {
        try {
            setLoading(true);
            const response = await examService.publish(examId);
            if (response.success) {
                toast({ title: 'Success', description: 'Exam published successfully' });
                fetchExams();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to publish exam',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { variant: 'secondary', icon: FileText, label: 'Draft' },
            scheduled: { variant: 'default', icon: Calendar, label: 'Scheduled' },
            ongoing: { variant: 'warning', icon: Clock, label: 'Ongoing' },
            completed: { variant: 'success', icon: CheckCircle2, label: 'Completed' },
            cancelled: { variant: 'destructive', icon: XCircle, label: 'Cancelled' }
        };
        const config = statusConfig[status] || statusConfig.draft;
        const Icon = config.icon;
        return (
            <Badge variant={config.variant} className="gap-1">
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    // Get exam group name
    const getExamGroupName = (groupId) => {
        const group = examGroups.find(g => g.id === groupId);
        return group?.group_name || '-';
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6" />
                            Exam Management
                        </h1>
                        <p className="text-muted-foreground">
                            Create and manage individual exams within exam groups
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchExams} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button onClick={handleCreate}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Exam
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-4">
                            <div className="w-64">
                                <Label>Filter by Exam Group</Label>
                                <Select 
                                    value={selectedExamGroup || 'all'} 
                                    onValueChange={(v) => setSelectedExamGroup(v === 'all' ? null : v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Exam Groups" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Exam Groups</SelectItem>
                                        {examGroups.map(group => (
                                            <SelectItem key={group.id} value={group.id}>
                                                {group.group_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="draft">Draft</TabsTrigger>
                        <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                        <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
                        <TabsTrigger value="completed">Completed</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Exams Table */}
                <Card>
                    <CardContent className="pt-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Exam Name</TableHead>
                                    <TableHead>Exam Group</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Max Marks</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Students</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && exams.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8">
                                            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                                            Loading exams...
                                        </TableCell>
                                    </TableRow>
                                ) : exams.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                            No exams found. Create your first exam!
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    exams.map(exam => (
                                        <TableRow key={exam.id}>
                                            <TableCell className="font-medium">
                                                {exam.exam_name}
                                                {exam.exam_code && (
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        ({exam.exam_code})
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>{getExamGroupName(exam.exam_group_id)}</TableCell>
                                            <TableCell>{exam.subjects?.name || exam.subject_name || '-'}</TableCell>
                                            <TableCell>{exam.exam_date ? formatDate(exam.exam_date) : '-'}</TableCell>
                                            <TableCell>
                                                {exam.start_time && exam.end_time ? (
                                                    <span className="text-sm">
                                                        {exam.start_time} - {exam.end_time}
                                                    </span>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>{exam.max_marks_total}</TableCell>
                                            <TableCell>{getStatusBadge(exam.status)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {exam.total_students_assigned || 0}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(exam)}
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    {exam.status === 'draft' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handlePublish(exam.id)}
                                                            title="Publish"
                                                        >
                                                            <Send className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setDeleteId(exam.id);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Create/Edit Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editMode ? 'Edit Exam' : 'Create New Exam'}
                            </DialogTitle>
                            <DialogDescription>
                                {editMode ? 'Update exam details' : 'Create an individual exam within an exam group'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Basic Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Exam Group *</Label>
                                        <Select 
                                            value={watch('exam_group_id')} 
                                            onValueChange={(v) => setValue('exam_group_id', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select exam group" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {examGroups.map(group => (
                                                    <SelectItem key={group.id} value={group.id}>
                                                        {group.group_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Subject *</Label>
                                        <Select 
                                            value={watch('subject_id')} 
                                            onValueChange={(v) => setValue('subject_id', v)}
                                            disabled={!watchExamGroupId}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select subject" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {subjects.map(subject => (
                                                    <SelectItem key={subject.id} value={subject.id}>
                                                        {subject.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Exam Name *</Label>
                                        <Input
                                            {...register('exam_name', { required: 'Exam name is required' })}
                                            placeholder="e.g., Unit Test 1 - Mathematics"
                                        />
                                        {errors.exam_name && (
                                            <p className="text-xs text-destructive">{errors.exam_name.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Exam Code</Label>
                                        <Input
                                            {...register('exam_code')}
                                            placeholder="e.g., UT1-MATH"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        {...register('description')}
                                        placeholder="Exam description or instructions"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Marks Configuration */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Marks Configuration</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label>Total Marks *</Label>
                                        <Input
                                            type="number"
                                            {...register('max_marks_total', { required: true })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Theory Marks</Label>
                                        <Input
                                            type="number"
                                            {...register('max_marks_theory')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Practical Marks</Label>
                                        <Input
                                            type="number"
                                            {...register('max_marks_practical')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Internal Marks</Label>
                                        <Input
                                            type="number"
                                            {...register('max_marks_internal')}
                                        />
                                    </div>
                                </div>
                                <div className="w-1/4">
                                    <Label>Passing Marks *</Label>
                                    <Input
                                        type="number"
                                        {...register('min_passing_marks', { required: true })}
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Schedule */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Schedule</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <DatePicker
                                            label="Exam Date"
                                            value={watch('exam_date')}
                                            onChange={(date) => setValue('exam_date', date)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Start Time</Label>
                                        <Input
                                            type="time"
                                            {...register('start_time')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Time</Label>
                                        <Input
                                            type="time"
                                            {...register('end_time')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Duration (mins)</Label>
                                        <Input
                                            type="number"
                                            {...register('duration_minutes')}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Venue */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Venue</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Room Number</Label>
                                        <Input
                                            {...register('room_no')}
                                            placeholder="e.g., Room 101"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Building</Label>
                                        <Input
                                            {...register('building')}
                                            placeholder="e.g., Main Block"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Options */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Options</h3>
                                <div className="flex gap-8">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={watch('is_practical')}
                                            onCheckedChange={(v) => setValue('is_practical', v)}
                                        />
                                        <Label>Practical Exam</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={watch('is_optional')}
                                            onCheckedChange={(v) => setValue('is_optional', v)}
                                        />
                                        <Label>Optional Subject</Label>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? (
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    {editMode ? 'Update Exam' : 'Create Exam'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the exam
                                and all associated student assignments and marks.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
};

export default ExamManagement;
