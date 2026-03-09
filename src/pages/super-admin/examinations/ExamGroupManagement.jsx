/**
 * Exam Group Management Page
 * Create and manage exam groups linking terms, exam types, classes, and subjects
 * @file jashchar-frontend/src/pages/super-admin/examinations/ExamGroupManagement.jsx
 * @date 2026-03-09
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { examGroupService, termService, examTypeService, gradeScaleService } from '@/services/examinationService';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/dateUtils';
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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

// Icons
import { 
    Layers, 
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
    FileSpreadsheet
} from 'lucide-react';

const ExamGroupManagement = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // State
    const [examGroups, setExamGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    // Reference data
    const [terms, setTerms] = useState([]);
    const [examTypes, setExamTypes] = useState([]);
    const [gradeScales, setGradeScales] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [sections, setSections] = useState([]);

    // Dialog states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);

    // Form
    const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm({
        defaultValues: {
            group_name: '',
            group_code: '',
            description: '',
            term_id: '',
            exam_type_id: '',
            grade_scale_id: '',
            class_id: '',
            section_ids: [],
            max_marks: 100,
            passing_marks: 33,
            weightage: 100,
            start_date: '',
            end_date: '',
            status: 'draft',
            is_active: true,
            subjects: []
        }
    });

    const { fields: subjectFields, append: appendSubject, remove: removeSubject, replace: replaceSubjects } = useFieldArray({
        control,
        name: 'subjects'
    });

    const watchClassId = watch('class_id');

    // Fetch exam groups - no dependencies that change often
    const fetchExamGroups = useCallback(async () => {
        setLoading(true);
        try {
            const response = await examGroupService.getAll();
            if (response.success) {
                setExamGroups(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching exam groups:', error);
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency - toast is stable from hook

    // Fetch reference data - runs once on mount
    const fetchReferenceData = useCallback(async () => {
        try {
            const [termsRes, typesRes, scalesRes] = await Promise.all([
                termService.getAll({ is_active: true }),
                examTypeService.getAll({ is_active: true }),
                gradeScaleService.getAll({ is_active: true })
            ]);

            if (termsRes.success) setTerms(termsRes.data || []);
            if (typesRes.success) setExamTypes(typesRes.data || []);
            if (scalesRes.success) setGradeScales(scalesRes.data || []);

            // Fetch classes - apiClient returns raw array
            const classesRes = await apiClient.get('/academics/classes');
            // Handle both array response and { success, data } wrapper
            const classesData = Array.isArray(classesRes) ? classesRes : (classesRes.data || []);
            setClasses(classesData);

        } catch (error) {
            console.error('Error fetching reference data:', error);
        }
    }, []); // Empty dependency - only runs once

    // Fetch subjects when class changes
    const fetchSubjects = useCallback(async (classId) => {
        if (!classId) {
            setSubjects([]);
            return;
        }
        try {
            const response = await apiClient.get(`/academics/subjects?class_id=${classId}`);
            // Handle both array response and { success, data } wrapper
            const subjectsData = Array.isArray(response) ? response : (response.data || []);
            setSubjects(subjectsData);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    }, []);

    // Fetch sections when class changes
    const fetchSections = useCallback(async (classId) => {
        if (!classId) {
            setSections([]);
            return;
        }
        try {
            const response = await apiClient.get(`/academics/sections?class_id=${classId}`);
            // Handle both array response and { success, data } wrapper
            const sectionsData = Array.isArray(response) ? response : (response.data || []);
            setSections(sectionsData);
        } catch (error) {
            console.error('Error fetching sections:', error);
        }
    }, []);

    // Initial data fetch - runs only once when branch and session are available
    useEffect(() => {
        if (selectedBranch?.id && currentSessionId) {
            fetchExamGroups();
            fetchReferenceData();
        }
    }, [selectedBranch?.id, currentSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch subjects and sections when class changes
    useEffect(() => {
        if (watchClassId) {
            fetchSubjects(watchClassId);
            fetchSections(watchClassId);
        }
    }, [watchClassId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Form submission
    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                section_ids: data.section_ids || [],
                subjects: data.subjects?.map((sub, index) => ({
                    ...sub,
                    sequence_order: index + 1
                }))
            };

            let response;
            if (editMode && editId) {
                response = await examGroupService.update(editId, payload);
            } else {
                response = await examGroupService.create(payload);
            }

            if (response.success) {
                toast({ title: 'Success', description: response.message || 'Exam group saved successfully' });
                resetForm();
                fetchExamGroups();
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    // Edit exam group
    const handleEdit = async (group) => {
        setEditMode(true);
        setEditId(group.id);

        // Fetch full details with subjects
        try {
            const response = await examGroupService.getById(group.id);
            if (response.success) {
                const data = response.data;
                setValue('group_name', data.group_name);
                setValue('group_code', data.group_code || '');
                setValue('description', data.description || '');
                setValue('term_id', data.term_id || '');
                setValue('exam_type_id', data.exam_type_id || '');
                setValue('grade_scale_id', data.grade_scale_id || '');
                setValue('class_id', data.class_id || '');
                setValue('section_ids', data.section_ids || []);
                setValue('max_marks', data.max_marks);
                setValue('passing_marks', data.passing_marks);
                setValue('weightage', data.weightage);
                setValue('start_date', data.start_date || '');
                setValue('end_date', data.end_date || '');
                setValue('status', data.status);
                setValue('is_active', data.is_active);

                // Set subjects
                if (data.subjects && data.subjects.length > 0) {
                    const mappedSubjects = data.subjects.map(sub => ({
                        subject_id: sub.subject_id,
                        max_marks: sub.max_marks,
                        passing_marks: sub.passing_marks,
                        exam_date: sub.exam_date || '',
                        start_time: sub.start_time || '',
                        end_time: sub.end_time || '',
                        room_no: sub.room_no || ''
                    }));
                    replaceSubjects(mappedSubjects);
                }
            }
        } catch (error) {
            console.error('Error loading exam group:', error);
        }
    };

    // Delete exam group
    const handleDelete = async () => {
        try {
            const response = await examGroupService.delete(deleteId);
            if (response.success) {
                toast({ title: 'Success', description: 'Exam group deleted successfully' });
                fetchExamGroups();
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    // Publish exam group
    const handlePublish = async (id) => {
        try {
            const response = await examGroupService.publish(id);
            if (response.success) {
                toast({ title: 'Success', description: 'Exam group published successfully' });
                fetchExamGroups();
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    // Reset form
    const resetForm = () => {
        reset();
        setEditMode(false);
        setEditId(null);
        replaceSubjects([]);
    };

    // Add subject to form
    const addSubjectRow = () => {
        appendSubject({
            subject_id: '',
            max_marks: 100,
            passing_marks: 33,
            exam_date: '',
            start_time: '',
            end_time: '',
            room_no: ''
        });
    };

    // Auto-add all subjects for class
    const addAllSubjects = () => {
        if (subjects.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Select a class first to load subjects' });
            return;
        }

        const newSubjects = subjects.map(sub => ({
            subject_id: sub.id,
            max_marks: 100,
            passing_marks: 33,
            exam_date: '',
            start_time: '',
            end_time: '',
            room_no: ''
        }));
        replaceSubjects(newSubjects);
        toast({ title: 'Subjects Added', description: `${subjects.length} subjects added to the exam group` });
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { variant: 'secondary', label: 'Draft' },
            published: { variant: 'default', label: 'Published' },
            ongoing: { variant: 'warning', label: 'Ongoing' },
            completed: { variant: 'success', label: 'Completed' },
            cancelled: { variant: 'destructive', label: 'Cancelled' }
        };
        const config = statusConfig[status] || statusConfig.draft;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <DashboardLayout>
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Layers className="w-6 h-6" />
                        Exam Group Management
                    </h1>
                    <p className="text-muted-foreground">
                        Create exam groups linking terms, exam types, classes and subjects
                    </p>
                </div>
                <Button onClick={fetchExamGroups} variant="outline" size="sm">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2">
                                <Layers className="w-5 h-5" />
                                {editMode ? 'Edit Exam Group' : 'Add Exam Group'}
                            </CardTitle>
                            <CardDescription>
                                Configure exam group settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                {/* Group Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="group_name">Group Name <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="group_name"
                                        {...register('group_name', { required: 'Group name is required' })}
                                        placeholder="e.g. FA-1 Class 10"
                                        className={errors.group_name ? 'border-destructive' : ''}
                                    />
                                </div>

                                {/* Group Code */}
                                <div className="space-y-2">
                                    <Label htmlFor="group_code">Group Code</Label>
                                    <Input
                                        id="group_code"
                                        {...register('group_code')}
                                        placeholder="e.g. FA1-CL10"
                                    />
                                </div>

                                {/* Term Selection */}
                                <div className="space-y-2">
                                    <Label>Term</Label>
                                    <Select
                                        value={watch('term_id')}
                                        onValueChange={(value) => setValue('term_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select term" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {terms.map((term) => (
                                                <SelectItem key={term.id} value={term.id}>
                                                    {term.term_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Exam Type Selection */}
                                <div className="space-y-2">
                                    <Label>Exam Type</Label>
                                    <Select
                                        value={watch('exam_type_id')}
                                        onValueChange={(value) => setValue('exam_type_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select exam type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {examTypes.map((type) => (
                                                <SelectItem key={type.id} value={type.id}>
                                                    {type.type_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Class Selection */}
                                <div className="space-y-2">
                                    <Label>Class <span className="text-destructive">*</span></Label>
                                    <Select
                                        value={watch('class_id')}
                                        onValueChange={(value) => setValue('class_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map((cls) => (
                                                <SelectItem key={cls.id} value={cls.id}>
                                                    {cls.name || cls.class_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Grade Scale Selection */}
                                <div className="space-y-2">
                                    <Label>Grade Scale</Label>
                                    <Select
                                        value={watch('grade_scale_id')}
                                        onValueChange={(value) => setValue('grade_scale_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select grade scale" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {gradeScales.map((scale) => (
                                                <SelectItem key={scale.id} value={scale.id}>
                                                    {scale.scale_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                {/* Marks Configuration */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Max Marks</Label>
                                        <Input
                                            type="number"
                                            {...register('max_marks')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Passing Marks</Label>
                                        <Input
                                            type="number"
                                            {...register('passing_marks')}
                                        />
                                    </div>
                                </div>

                                {/* Weightage */}
                                <div className="space-y-2">
                                    <Label>Weightage (%)</Label>
                                    <Input
                                        type="number"
                                        {...register('weightage')}
                                        placeholder="100"
                                    />
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Start Date</Label>
                                        <Input
                                            type="date"
                                            {...register('start_date')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Date</Label>
                                        <Input
                                            type="date"
                                            {...register('end_date')}
                                        />
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={watch('status')}
                                        onValueChange={(value) => setValue('status', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                            <SelectItem value="ongoing">Ongoing</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Active Toggle */}
                                <div className="flex items-center justify-between">
                                    <Label>Active</Label>
                                    <Switch
                                        checked={watch('is_active')}
                                        onCheckedChange={(checked) => setValue('is_active', checked)}
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        {...register('description')}
                                        placeholder="Optional description..."
                                        rows={2}
                                    />
                                </div>

                                {/* Form Actions */}
                                <div className="flex gap-2 pt-2">
                                    <Button type="submit" className="flex-1">
                                        <Save className="w-4 h-4 mr-2" />
                                        {editMode ? 'Update' : 'Save'}
                                    </Button>
                                    {editMode && (
                                        <Button type="button" variant="outline" onClick={resetForm}>
                                            <X className="w-4 h-4 mr-2" />
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Subjects Card */}
                    <Card>
                        <CardHeader className="border-b py-3">
                            <CardTitle className="text-sm flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" />
                                    Subjects ({subjectFields.length})
                                </span>
                                <div className="flex gap-1">
                                    <Button size="sm" variant="outline" onClick={addAllSubjects} disabled={!watchClassId}>
                                        Add All
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={addSubjectRow}>
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-3 max-h-[400px] overflow-y-auto">
                            {subjectFields.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No subjects added. Select a class and click "Add All" or add manually.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {subjectFields.map((field, index) => (
                                        <div key={field.id} className="border rounded-lg p-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium">Subject #{index + 1}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeSubject(index)}
                                                    className="h-6 w-6 p-0 text-destructive"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            <Select
                                                value={watch(`subjects.${index}.subject_id`)}
                                                onValueChange={(value) => setValue(`subjects.${index}.subject_id`, value)}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Select subject" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {subjects.map((sub) => (
                                                        <SelectItem key={sub.id} value={sub.id}>
                                                            {sub.name || sub.subject_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input
                                                    type="number"
                                                    placeholder="Max"
                                                    className="h-8 text-xs"
                                                    {...register(`subjects.${index}.max_marks`)}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Pass"
                                                    className="h-8 text-xs"
                                                    {...register(`subjects.${index}.passing_marks`)}
                                                />
                                            </div>
                                            <Input
                                                type="date"
                                                className="h-8 text-xs"
                                                {...register(`subjects.${index}.exam_date`)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2">
                                <FileSpreadsheet className="w-5 h-5" />
                                Exam Groups List
                            </CardTitle>
                            <CardDescription>
                                {examGroups.length} exam group(s) configured
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : examGroups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Layers className="w-12 h-12 mb-4" />
                                    <p>No exam groups configured yet</p>
                                    <p className="text-sm">Add an exam group to get started</p>
                                </div>
                            ) : (
                                <Accordion type="single" collapsible className="w-full">
                                    {examGroups.map((group) => (
                                        <AccordionItem key={group.id} value={group.id}>
                                            <AccordionTrigger className="hover:no-underline">
                                                <div className="flex items-center justify-between w-full pr-4">
                                                    <div className="flex items-center gap-3">
                                                        <div>
                                                            <div className="font-medium text-left">{group.group_name}</div>
                                                            <div className="text-xs text-muted-foreground text-left">
                                                                {group.term?.term_name} • {group.exam_type?.type_name} • {group.class?.name || group.class?.class_name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(group.status)}
                                                        {group.is_active ? (
                                                            <Badge variant="outline" className="bg-green-500/10 text-green-600">Active</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-red-500/10 text-red-600">Inactive</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="p-4 space-y-4 bg-muted/30 rounded-lg">
                                                    {/* Group Details */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-muted-foreground">Max Marks:</span>
                                                            <span className="ml-2 font-medium">{group.max_marks}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Passing:</span>
                                                            <span className="ml-2 font-medium">{group.passing_marks}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Weightage:</span>
                                                            <span className="ml-2 font-medium">{group.weightage}%</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Grade Scale:</span>
                                                            <span className="ml-2 font-medium">{group.grade_scale?.scale_name || 'N/A'}</span>
                                                        </div>
                                                    </div>

                                                    {group.start_date && (
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                                                <span>{formatDate(group.start_date)}</span>
                                                                {group.end_date && (
                                                                    <>
                                                                        <span className="text-muted-foreground">to</span>
                                                                        <span>{formatDate(group.end_date)}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Actions */}
                                                    <div className="flex gap-2 pt-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEdit(group)}
                                                        >
                                                            <Pencil className="w-3 h-3 mr-1" />
                                                            Edit
                                                        </Button>
                                                        {group.status === 'draft' && (
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                onClick={() => handlePublish(group.id)}
                                                            >
                                                                <Send className="w-3 h-3 mr-1" />
                                                                Publish
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => {
                                                                setDeleteId(group.id);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="w-3 h-3 mr-1" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Exam Group?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this exam group and all its subject configurations.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        </DashboardLayout>
    );
};

export default ExamGroupManagement;
