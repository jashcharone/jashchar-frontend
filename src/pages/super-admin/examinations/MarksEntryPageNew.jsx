/**
 * Marks Entry Page - NEW ENGINE
 * Super Marks Entry UI with auto-save, draft, submit
 * Phase 4 of Examination Module
 * @file jashchar-frontend/src/pages/super-admin/examinations/MarksEntryPageNew.jsx
 * @date 2026-03-13
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { 
    examGroupService, 
    examService, 
    marksEntryService,
    gradeScaleService 
} from '@/services/examinationService';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/dateUtils';
import DashboardLayout from '@/components/DashboardLayout';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
    Save,
    Send,
    Lock,
    Unlock,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    FileText,
    Users,
    Calculator,
    Clock,
    Download,
    Upload
} from 'lucide-react';

const MarksEntryPageNew = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const autoSaveRef = useRef(null);

    // Selection State
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    // Data State
    const [examGroups, setExamGroups] = useState([]);
    const [exams, setExams] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [gradeScale, setGradeScale] = useState(null);

    // Marks State
    const [marksData, setMarksData] = useState([]);
    const [isDirty, setIsDirty] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [marksStatus, setMarksStatus] = useState('draft'); // draft, submitted, locked

    // Loading States
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Dialog States
    const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
    const [lockDialogOpen, setLockDialogOpen] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        entered: 0,
        absent: 0,
        pass: 0,
        fail: 0,
        average: 0
    });

    // Fetch exam groups on mount
    useEffect(() => {
        fetchExamGroups();
    }, []);

    // Fetch exams when group changes
    useEffect(() => {
        if (selectedGroup) {
            fetchExams(selectedGroup);
        } else {
            setExams([]);
            setSelectedExam('');
        }
    }, [selectedGroup]);

    // Fetch subjects when exam changes
    useEffect(() => {
        if (selectedExam) {
            fetchSubjects(selectedExam);
        } else {
            setSubjects([]);
            setSelectedSubject('');
        }
    }, [selectedExam]);

    // Fetch students and marks when subject changes
    useEffect(() => {
        if (selectedExam && selectedSubject) {
            fetchStudentsWithMarks();
        } else {
            setStudents([]);
            setMarksData([]);
        }
    }, [selectedExam, selectedSubject]);

    // Auto-save setup
    useEffect(() => {
        if (isDirty && marksData.length > 0 && marksStatus !== 'locked') {
            autoSaveRef.current = setInterval(() => {
                handleAutoSave();
            }, 30000); // Auto-save every 30 seconds
        }

        return () => {
            if (autoSaveRef.current) {
                clearInterval(autoSaveRef.current);
            }
        };
    }, [isDirty, marksData, marksStatus]);

    // Calculate stats when marks change
    useEffect(() => {
        calculateStats();
    }, [marksData]);

    const fetchExamGroups = async () => {
        try {
            const response = await examGroupService.getAll({ status: 'published' });
            if (response.success) {
                setExamGroups(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching exam groups:', error);
        }
    };

    const fetchExams = async (groupId) => {
        try {
            const response = await examService.getAll({ exam_group_id: groupId });
            if (response.success) {
                setExams(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching exams:', error);
        }
    };

    const fetchSubjects = async (examId) => {
        try {
            const exam = exams.find(e => e.id === examId);
            if (exam?.subjects) {
                setSubjects(exam.subjects);
            } else {
                // Fetch from API
                const response = await examService.getById(examId);
                if (response.success && response.data?.subjects) {
                    setSubjects(response.data.subjects);
                }
            }

            // Fetch grade scale if available
            if (exam?.grade_scale_id) {
                const gradeRes = await gradeScaleService.getById(exam.grade_scale_id);
                if (gradeRes.success) {
                    setGradeScale(gradeRes.data);
                }
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchStudentsWithMarks = async () => {
        setLoading(true);
        try {
            const response = await marksEntryService.getStudentsWithMarks(selectedExam, selectedSubject);
            if (response.success) {
                const studentsData = response.data || [];
                setStudents(studentsData);

                // Initialize marks data
                const initialMarks = studentsData.map(s => ({
                    student_id: s.student_id,
                    exam_student_id: s.id,
                    roll_number: s.roll_number,
                    student_name: `${s.student?.first_name || ''} ${s.student?.last_name || ''}`,
                    enrollment_id: s.student?.enrollment_id,
                    marks_theory: s.marks?.marks_theory ?? '',
                    marks_practical: s.marks?.marks_practical ?? '',
                    marks_internal: s.marks?.marks_internal ?? '',
                    total_marks: s.marks?.total_marks ?? 0,
                    percentage: s.marks?.percentage ?? 0,
                    grade: s.marks?.grade ?? '',
                    is_absent: s.marks?.is_absent ?? false,
                    is_exempted: s.marks?.is_exempted ?? false,
                    teacher_remark: s.marks?.teacher_remark ?? ''
                }));

                setMarksData(initialMarks);
                setMarksStatus(studentsData[0]?.marks?.status || 'draft');

                // Check for draft
                checkForDraft();
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch students',
                variant: 'destructive'
            });
        }
        setLoading(false);
    };

    const checkForDraft = async () => {
        try {
            const response = await marksEntryService.getDraft(selectedExam, selectedSubject);
            if (response.success && response.data?.marks_data) {
                // Show option to restore draft
                toast({
                    title: 'Draft Found',
                    description: `Auto-saved draft found from ${formatDate(response.data.last_saved_at)}`,
                    action: (
                        <Button size="sm" onClick={() => restoreDraft(response.data.marks_data)}>
                            Restore
                        </Button>
                    )
                });
            }
        } catch (error) {
            // No draft found, ignore
        }
    };

    const restoreDraft = (draftData) => {
        setMarksData(draftData);
        toast({ title: 'Draft Restored', description: 'Previous draft has been restored' });
    };

    const handleMarksChange = (index, field, value) => {
        if (marksStatus === 'locked') {
            toast({ title: 'Locked', description: 'Marks are locked and cannot be edited', variant: 'destructive' });
            return;
        }

        const newMarksData = [...marksData];
        newMarksData[index][field] = value;

        // Calculate total if marks changed
        if (['marks_theory', 'marks_practical', 'marks_internal'].includes(field)) {
            const theory = parseFloat(newMarksData[index].marks_theory) || 0;
            const practical = parseFloat(newMarksData[index].marks_practical) || 0;
            const internal = parseFloat(newMarksData[index].marks_internal) || 0;
            
            newMarksData[index].total_marks = theory + practical + internal;
            
            // Calculate percentage
            const subject = subjects.find(s => s.id === selectedSubject);
            const maxMarks = subject?.max_marks || 100;
            newMarksData[index].percentage = ((newMarksData[index].total_marks / maxMarks) * 100).toFixed(2);

            // Assign grade if grade scale available
            if (gradeScale?.grades) {
                const grade = gradeScale.grades.find(g => 
                    newMarksData[index].percentage >= g.min_percentage && 
                    newMarksData[index].percentage <= g.max_percentage
                );
                newMarksData[index].grade = grade?.grade_name || '';
            }
        }

        // Handle absent toggle
        if (field === 'is_absent' && value) {
            newMarksData[index].marks_theory = '';
            newMarksData[index].marks_practical = '';
            newMarksData[index].marks_internal = '';
            newMarksData[index].total_marks = 0;
            newMarksData[index].percentage = 0;
            newMarksData[index].grade = 'AB';
        }

        setMarksData(newMarksData);
        setIsDirty(true);
    };

    const handleAutoSave = async () => {
        if (!isDirty || marksData.length === 0) return;

        try {
            await marksEntryService.saveDraft({
                exam_id: selectedExam,
                exam_subject_id: selectedSubject,
                marks_data: marksData
            });
            setLastSaved(new Date());
            setIsDirty(false);
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    };

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            const response = await marksEntryService.save({
                exam_id: selectedExam,
                exam_subject_id: selectedSubject,
                marks_data: marksData,
                is_submit: false
            });

            if (response.success) {
                setIsDirty(false);
                setLastSaved(new Date());
                toast({ title: 'Success', description: 'Marks saved as draft' });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to save',
                variant: 'destructive'
            });
        }
        setSaving(false);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const response = await marksEntryService.save({
                exam_id: selectedExam,
                exam_subject_id: selectedSubject,
                marks_data: marksData,
                is_submit: true
            });

            if (response.success) {
                setMarksStatus('submitted');
                setIsDirty(false);
                setSubmitDialogOpen(false);
                toast({ title: 'Success', description: 'Marks submitted successfully' });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to submit',
                variant: 'destructive'
            });
        }
        setSubmitting(false);
    };

    const handleLock = async () => {
        setSubmitting(true);
        try {
            const response = await marksEntryService.lock({
                exam_id: selectedExam,
                exam_subject_id: selectedSubject
            });

            if (response.success) {
                setMarksStatus('locked');
                setLockDialogOpen(false);
                toast({ title: 'Success', description: 'Marks locked permanently' });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to lock',
                variant: 'destructive'
            });
        }
        setSubmitting(false);
    };

    const handleUnlock = async () => {
        try {
            const response = await marksEntryService.unlock({
                exam_id: selectedExam,
                exam_subject_id: selectedSubject
            });

            if (response.success) {
                setMarksStatus('submitted');
                toast({ title: 'Success', description: 'Marks unlocked' });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to unlock',
                variant: 'destructive'
            });
        }
    };

    const calculateStats = () => {
        if (marksData.length === 0) {
            setStats({ total: 0, entered: 0, absent: 0, pass: 0, fail: 0, average: 0 });
            return;
        }

        const subject = subjects.find(s => s.id === selectedSubject);
        const passMarks = subject?.pass_marks || 35;

        const total = marksData.length;
        const absent = marksData.filter(m => m.is_absent).length;
        const entered = marksData.filter(m => m.total_marks > 0 || m.is_absent).length;
        const pass = marksData.filter(m => !m.is_absent && m.total_marks >= passMarks).length;
        const fail = marksData.filter(m => !m.is_absent && m.total_marks > 0 && m.total_marks < passMarks).length;
        
        const totalMarks = marksData.filter(m => !m.is_absent).reduce((sum, m) => sum + (m.total_marks || 0), 0);
        const presentCount = total - absent;
        const average = presentCount > 0 ? (totalMarks / presentCount).toFixed(2) : 0;

        setStats({ total, entered, absent, pass, fail, average });
    };

    const getStatusBadge = () => {
        switch (marksStatus) {
            case 'submitted':
                return <Badge variant="success" className="ml-2"><CheckCircle className="h-3 w-3 mr-1" /> Submitted</Badge>;
            case 'locked':
                return <Badge variant="destructive" className="ml-2"><Lock className="h-3 w-3 mr-1" /> Locked</Badge>;
            default:
                return <Badge variant="secondary" className="ml-2"><FileText className="h-3 w-3 mr-1" /> Draft</Badge>;
        }
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                            <Calculator className="h-6 w-6" />
                            Marks Entry
                            {selectedSubject && getStatusBadge()}
                        </h1>
                        <p className="text-muted-foreground">
                            Enter and manage examination marks
                        </p>
                    </div>
                    {lastSaved && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Last saved: {formatDate(lastSaved)} {lastSaved.toLocaleTimeString()}
                        </div>
                    )}
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Exam Group *</Label>
                                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Exam Group" />
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
                                <Label>Exam *</Label>
                                <Select value={selectedExam} onValueChange={setSelectedExam} disabled={!selectedGroup}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Exam" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {exams.map(exam => (
                                            <SelectItem key={exam.id} value={exam.id}>
                                                {exam.exam_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Subject *</Label>
                                <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedExam}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subjects.map(subject => (
                                            <SelectItem key={subject.id} value={subject.id}>
                                                {subject.subject_name} ({subject.max_marks} marks)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                {selectedSubject && (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
                        <Card>
                            <CardContent className="pt-3 sm:pt-4">
                                <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">Total Students</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-3 sm:pt-4">
                                <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.entered}</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">Entered</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-3 sm:pt-4">
                                <div className="text-lg sm:text-2xl font-bold text-orange-600">{stats.absent}</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">Absent</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-3 sm:pt-4">
                                <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.pass}</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">Pass</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-3 sm:pt-4">
                                <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.fail}</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">Fail</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-3 sm:pt-4">
                                <div className="text-lg sm:text-2xl font-bold">{stats.average}</div>
                                <div className="text-xs sm:text-sm text-muted-foreground">Average</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Marks Entry Table */}
                {selectedSubject && (
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div>
                                <CardTitle>Enter Marks</CardTitle>
                                <CardDescription>
                                    {subjects.find(s => s.id === selectedSubject)?.subject_name} - 
                                    Max: {subjects.find(s => s.id === selectedSubject)?.max_marks || 100}
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                {marksStatus === 'locked' ? (
                                    <Button variant="outline" onClick={handleUnlock}>
                                        <Unlock className="h-4 w-4 mr-2" />
                                        Unlock
                                    </Button>
                                ) : (
                                    <>
                                        <Button variant="outline" onClick={handleSaveDraft} disabled={saving || marksStatus === 'locked'}>
                                            {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Draft
                                        </Button>
                                        <Button onClick={() => setSubmitDialogOpen(true)} disabled={marksStatus === 'locked'}>
                                            <Send className="h-4 w-4 mr-2" />
                                            Submit
                                        </Button>
                                        {marksStatus === 'submitted' && (
                                            <Button variant="destructive" onClick={() => setLockDialogOpen(true)}>
                                                <Lock className="h-4 w-4 mr-2" />
                                                Lock
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="border rounded-lg overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[60px]">Roll</TableHead>
                                                <TableHead className="min-w-[120px] sm:min-w-[180px]">Student</TableHead>
                                                <TableHead className="w-[80px] sm:w-[100px]">Theory</TableHead>
                                                <TableHead className="w-[80px] sm:w-[100px] hidden sm:table-cell">Practical</TableHead>
                                                <TableHead className="w-[80px] sm:w-[100px] hidden md:table-cell">Internal</TableHead>
                                                <TableHead className="w-[80px]">Total</TableHead>
                                                <TableHead className="w-[60px] hidden sm:table-cell">%</TableHead>
                                                <TableHead className="w-[60px] hidden sm:table-cell">Grade</TableHead>
                                                <TableHead className="w-[60px]">Absent</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {marksData.map((student, idx) => (
                                                <TableRow key={student.student_id} className={student.is_absent ? 'bg-orange-50 dark:bg-orange-900/20' : ''}>
                                                    <TableCell className="font-medium">{student.roll_number}</TableCell>
                                                    <TableCell>
                                                        <div>{student.student_name}</div>
                                                        <div className="text-xs text-muted-foreground">{student.enrollment_id}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={subjects.find(s => s.id === selectedSubject)?.max_marks || 100}
                                                            value={student.marks_theory}
                                                            onChange={(e) => handleMarksChange(idx, 'marks_theory', e.target.value)}
                                                            disabled={student.is_absent || marksStatus === 'locked'}
                                                            className="w-16 sm:w-20"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={student.marks_practical}
                                                            onChange={(e) => handleMarksChange(idx, 'marks_practical', e.target.value)}
                                                            disabled={student.is_absent || marksStatus === 'locked'}
                                                            className="w-16 sm:w-20"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={student.marks_internal}
                                                            onChange={(e) => handleMarksChange(idx, 'marks_internal', e.target.value)}
                                                            disabled={student.is_absent || marksStatus === 'locked'}
                                                            className="w-16 sm:w-20"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-semibold">
                                                        {student.total_marks || 0}
                                                    </TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                        {student.percentage}%
                                                    </TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                        <Badge variant={student.is_absent ? 'destructive' : 'outline'}>
                                                            {student.grade || '-'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={student.is_absent}
                                                            onCheckedChange={(checked) => handleMarksChange(idx, 'is_absent', checked)}
                                                            disabled={marksStatus === 'locked'}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {isDirty && (
                                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                                    <AlertCircle className="h-4 w-4" />
                                    Unsaved changes. Click "Save Draft" to save.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Submit Confirmation Dialog */}
                <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Submit Marks?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to submit these marks? You can still edit them after submission until they are locked.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
                                {submitting && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                                Submit
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Lock Confirmation Dialog */}
                <AlertDialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Lock Marks?</AlertDialogTitle>
                            <AlertDialogDescription>
                                <span className="text-red-600 font-semibold">Warning:</span> Locking marks is permanent. Once locked, only admin can unlock them. Make sure all marks are correctly entered.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLock} disabled={submitting} className="bg-red-600">
                                {submitting && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                                Lock Permanently
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
};

export default MarksEntryPageNew;
