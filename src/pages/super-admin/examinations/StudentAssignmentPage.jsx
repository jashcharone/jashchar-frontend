/**
 * Student Assignment Page
 * Assign students to exams and manage roll numbers
 * Phase 2 of Examination Module
 * @file jashchar-frontend/src/pages/super-admin/examinations/StudentAssignmentPage.jsx
 * @date 2026-03-13
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { examService, examStudentService, examGroupService } from '@/services/examinationService';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/dateUtils';
import DashboardLayout from '@/components/DashboardLayout';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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

// Icons
import { 
    Users, 
    Plus, 
    Trash2, 
    RefreshCw, 
    UserPlus,
    Hash,
    CheckCircle2,
    XCircle,
    Download,
    Upload,
    Search,
    Filter,
    ListChecks,
    ScanLine
} from 'lucide-react';

const StudentAssignmentPage = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // State
    const [selectedExamGroup, setSelectedExamGroup] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [examStudents, setExamStudents] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [rollNumberDialogOpen, setRollNumberDialogOpen] = useState(false);
    
    // Reference data
    const [examGroups, setExamGroups] = useState([]);
    const [exams, setExams] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);

    // Selection state for bulk operations
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    // Roll number config
    const [rollNumberConfig, setRollNumberConfig] = useState({
        pattern: 'numeric', // numeric, alphanumeric, custom
        prefix: '',
        suffix: '',
        start_number: 1,
        padding: 3
    });

    // Filters for available students
    const [filterClass, setFilterClass] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Helper: extract array from API response (handles both raw arrays and {success, data} wrapper)
    const extractArray = (res) => {
        if (Array.isArray(res)) return res;
        if (res?.success && Array.isArray(res.data)) return res.data;
        if (res?.data && Array.isArray(res.data)) return res.data;
        return [];
    };

    // Fetch reference data
    const fetchReferenceData = useCallback(async () => {
        try {
            // Fetch exam groups
            const groupsRes = await examGroupService.getAll();
            setExamGroups(extractArray(groupsRes));

            // Fetch classes
            const classesRes = await apiClient.get('/academics/classes');
            setClasses(extractArray(classesRes));
        } catch (error) {
            console.error('Error fetching reference data:', error);
        }
    }, []);

    // Fetch exams when exam group changes
    useEffect(() => {
        const fetchExams = async () => {
            if (selectedExamGroup) {
                try {
                    const examsRes = await examService.getAll({ exam_group_id: selectedExamGroup });
                    if (examsRes.success) {
                        setExams(examsRes.data || []);
                    }
                } catch (error) {
                    console.error('Error fetching exams:', error);
                }
            } else {
                setExams([]);
            }
        };
        fetchExams();
    }, [selectedExamGroup]);

    // Fetch assigned students when exam changes
    useEffect(() => {
        const fetchExamStudents = async () => {
            if (selectedExam) {
                setLoading(true);
                try {
                    const response = await examStudentService.getByExam(selectedExam);
                    if (response.success) {
                        setExamStudents(response.data || []);
                    }
                } catch (error) {
                    console.error('Error fetching exam students:', error);
                }
                setLoading(false);
            } else {
                setExamStudents([]);
            }
        };
        fetchExamStudents();
    }, [selectedExam]);

    // Fetch sections when filter class changes
    useEffect(() => {
        const fetchSections = async () => {
            if (filterClass) {
                try {
                    const sectionsRes = await apiClient.get(`/academics/sections?class_id=${filterClass}`);
                    setSections(extractArray(sectionsRes));
                } catch (error) {
                    console.error('Error fetching sections:', error);
                }
            } else {
                setSections([]);
            }
        };
        fetchSections();
    }, [filterClass]);

    // Fetch available students for assignment
    const fetchAvailableStudents = async () => {
        if (!filterClass) {
            toast({
                title: 'Select Class',
                description: 'Please select a class to view students',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);
        try {
            let url = `/students?class_id=${filterClass}`;
            if (filterSection) {
                url += `&section_id=${filterSection}`;
            }
            
            const response = await apiClient.get(url);
            const studentsData = extractArray(response);
            // Filter out already assigned students
            const assignedIds = examStudents.map(es => es.student_id);
            const available = studentsData.filter(s => !assignedIds.includes(s.id));
            setAvailableStudents(available);
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

    useEffect(() => {
        fetchReferenceData();
    }, [fetchReferenceData]);

    // Re-fetch classes when assign dialog opens (in case initial fetch failed)
    useEffect(() => {
        if (assignDialogOpen && classes.length === 0) {
            fetchReferenceData();
        }
    }, [assignDialogOpen]);

    // Handle select all checkbox
    const handleSelectAll = (checked) => {
        setSelectAll(checked);
        if (checked) {
            setSelectedStudentIds(availableStudents.map(s => s.id));
        } else {
            setSelectedStudentIds([]);
        }
    };

    // Handle individual student selection
    const handleStudentSelect = (studentId, checked) => {
        if (checked) {
            setSelectedStudentIds([...selectedStudentIds, studentId]);
        } else {
            setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
        }
    };

    // Assign selected students to exam
    const handleAssignStudents = async () => {
        if (!selectedExam) {
            toast({
                title: 'Select Exam',
                description: 'Please select an exam first',
                variant: 'destructive'
            });
            return;
        }

        if (selectedStudentIds.length === 0) {
            toast({
                title: 'Select Students',
                description: 'Please select at least one student to assign',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await examStudentService.assign({
                exam_id: selectedExam,
                student_ids: selectedStudentIds
            });

            if (response.success) {
                toast({
                    title: 'Success',
                    description: `${selectedStudentIds.length} students assigned successfully`
                });
                // Refresh exam students
                const updatedRes = await examStudentService.getByExam(selectedExam);
                if (updatedRes.success) {
                    setExamStudents(updatedRes.data || []);
                }
                // Clear selections
                setSelectedStudentIds([]);
                setSelectAll(false);
                setAssignDialogOpen(false);
                // Remove assigned from available list
                setAvailableStudents(availableStudents.filter(s => !selectedStudentIds.includes(s.id)));
            }
        } catch (error) {
            console.error('Error assigning students:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to assign students',
                variant: 'destructive'
            });
        }
        setLoading(false);
    };

    // Bulk assign by class/section
    const handleBulkAssign = async () => {
        if (!selectedExam || !filterClass) {
            toast({
                title: 'Select Required Fields',
                description: 'Please select an exam and class',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await examStudentService.bulkAssign({
                exam_id: selectedExam,
                class_id: filterClass,
                section_ids: filterSection ? [filterSection] : []
            });

            if (response.success) {
                toast({
                    title: 'Success',
                    description: `Students assigned successfully`
                });
                // Refresh exam students
                const updatedRes = await examStudentService.getByExam(selectedExam);
                if (updatedRes.success) {
                    setExamStudents(updatedRes.data || []);
                }
                setAssignDialogOpen(false);
            }
        } catch (error) {
            console.error('Error bulk assigning:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to assign students',
                variant: 'destructive'
            });
        }
        setLoading(false);
    };

    // Remove student from exam
    const handleRemoveStudent = async (examStudentId) => {
        setLoading(true);
        try {
            const response = await examStudentService.remove(examStudentId);
            if (response.success) {
                toast({ title: 'Success', description: 'Student removed from exam' });
                setExamStudents(examStudents.filter(es => es.id !== examStudentId));
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to remove student',
                variant: 'destructive'
            });
        }
        setLoading(false);
    };

    // Generate roll numbers
    const handleGenerateRollNumbers = async () => {
        if (!selectedExam) {
            toast({
                title: 'Select Exam',
                description: 'Please select an exam first',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await examStudentService.generateRollNumbers(selectedExam, rollNumberConfig);
            if (response.success) {
                toast({
                    title: 'Success',
                    description: 'Roll numbers generated successfully'
                });
                // Refresh exam students
                const updatedRes = await examStudentService.getByExam(selectedExam);
                if (updatedRes.success) {
                    setExamStudents(updatedRes.data || []);
                }
                setRollNumberDialogOpen(false);
            }
        } catch (error) {
            console.error('Error generating roll numbers:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to generate roll numbers',
                variant: 'destructive'
            });
        }
        setLoading(false);
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const config = {
            active: { variant: 'default', label: 'Active' },
            detained: { variant: 'destructive', label: 'Detained' },
            promoted: { variant: 'success', label: 'Promoted' },
            withdrawn: { variant: 'secondary', label: 'Withdrawn' }
        };
        const c = config[status] || config.active;
        return <Badge variant={c.variant}>{c.label}</Badge>;
    };

    // Get eligibility badge
    const getEligibilityBadge = (status) => {
        const config = {
            eligible: { variant: 'success', icon: CheckCircle2, label: 'Eligible' },
            not_eligible: { variant: 'destructive', icon: XCircle, label: 'Not Eligible' },
            pending: { variant: 'secondary', icon: null, label: 'Pending' }
        };
        const c = config[status] || config.pending;
        const Icon = c.icon;
        return (
            <Badge variant={c.variant} className="gap-1">
                {Icon && <Icon className="h-3 w-3" />}
                {c.label}
            </Badge>
        );
    };

    // Selected exam details
    const selectedExamDetails = exams.find(e => e.id === selectedExam);

    return (
        <DashboardLayout>
            <div className="container mx-auto py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="h-6 w-6" />
                            Student Assignment
                        </h1>
                        <p className="text-muted-foreground">
                            Assign students to exams and manage roll numbers
                        </p>
                    </div>
                </div>

                {/* Exam Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Select Exam</CardTitle>
                        <CardDescription>Choose an exam to manage student assignments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Exam Group</Label>
                                <Select value={selectedExamGroup} onValueChange={setSelectedExamGroup}>
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
                                <Label>Exam</Label>
                                <Select 
                                    value={selectedExam} 
                                    onValueChange={setSelectedExam}
                                    disabled={!selectedExamGroup}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select exam" />
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
                            <div className="flex items-end gap-2">
                                <Button 
                                    onClick={() => setAssignDialogOpen(true)}
                                    disabled={!selectedExam}
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Assign Students
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={() => setRollNumberDialogOpen(true)}
                                    disabled={!selectedExam || examStudents.length === 0}
                                >
                                    <Hash className="h-4 w-4 mr-2" />
                                    Generate Roll Numbers
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Exam Info Card */}
                {selectedExamDetails && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg">{selectedExamDetails.exam_name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedExamDetails.exam_date ? formatDate(selectedExamDetails.exam_date) : 'Date not set'} | 
                                        Max Marks: {selectedExamDetails.max_marks_total}
                                    </p>
                                </div>
                                <div className="flex gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold">{examStudents.length}</p>
                                        <p className="text-xs text-muted-foreground">Students Assigned</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {examStudents.filter(s => s.roll_number).length}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Roll Numbers Generated</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Assigned Students Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Assigned Students</CardTitle>
                        <CardDescription>
                            {examStudents.length} students assigned to this exam
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Roll No</TableHead>
                                    <TableHead>Enroll ID</TableHead>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Section</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Eligibility</TableHead>
                                    <TableHead>Attendance %</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && examStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8">
                                            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                                            Loading students...
                                        </TableCell>
                                    </TableRow>
                                ) : !selectedExam ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                            Select an exam to view assigned students
                                        </TableCell>
                                    </TableRow>
                                ) : examStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                            No students assigned to this exam yet
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    examStudents.map(es => (
                                        <TableRow key={es.id}>
                                            <TableCell>
                                                {es.roll_number || (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{es.student?.enrollment_id || es.enrollment_id || '-'}</TableCell>
                                            <TableCell className="font-medium">
                                                {es.student?.full_name || es.student_name || '-'}
                                            </TableCell>
                                            <TableCell>{es.student?.class_name || es.class_name || '-'}</TableCell>
                                            <TableCell>{es.student?.section_name || es.section_name || '-'}</TableCell>
                                            <TableCell>{getStatusBadge(es.status)}</TableCell>
                                            <TableCell>{getEligibilityBadge(es.eligibility_status)}</TableCell>
                                            <TableCell>
                                                {es.attendance_percentage ? `${es.attendance_percentage}%` : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveStudent(es.id)}
                                                    title="Remove from exam"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Assign Students Dialog */}
                <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Assign Students to Exam</DialogTitle>
                            <DialogDescription>
                                Select students to assign to the selected exam
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {/* Filters */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Class *</Label>
                                    <Select value={filterClass} onValueChange={setFilterClass}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(cls => (
                                                <SelectItem key={cls.id} value={cls.id}>
                                                    {cls.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Section</Label>
                                    <Select 
                                        value={filterSection || 'all'} 
                                        onValueChange={(v) => setFilterSection(v === 'all' ? '' : v)}
                                        disabled={!filterClass}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All sections" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Sections</SelectItem>
                                            {sections.map(sec => (
                                                <SelectItem key={sec.id} value={sec.id}>
                                                    {sec.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Search</Label>
                                    <Input
                                        placeholder="Search by name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-end gap-2">
                                    <Button onClick={fetchAvailableStudents} disabled={!filterClass}>
                                        <Search className="h-4 w-4 mr-2" />
                                        Load Students
                                    </Button>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={handleBulkAssign}
                                    disabled={!filterClass}
                                >
                                    <ListChecks className="h-4 w-4 mr-2" />
                                    Assign All from {filterSection ? 'Section' : 'Class'}
                                </Button>
                            </div>

                            <Separator />

                            {/* Student Selection Table */}
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={selectAll && availableStudents.length > 0}
                                                    onCheckedChange={handleSelectAll}
                                                    disabled={availableStudents.length === 0}
                                                />
                                            </TableHead>
                                            <TableHead>Enroll ID</TableHead>
                                            <TableHead>Student Name</TableHead>
                                            <TableHead>Class</TableHead>
                                            <TableHead>Section</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {availableStudents.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    Select class and click "Load Students" to view available students
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            availableStudents
                                                .filter(s => 
                                                    !searchQuery || 
                                                    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    s.enrollment_id?.toLowerCase().includes(searchQuery.toLowerCase())
                                                )
                                                .map(student => (
                                                    <TableRow key={student.id}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedStudentIds.includes(student.id)}
                                                                onCheckedChange={(checked) => handleStudentSelect(student.id, checked)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>{student.enrollment_id}</TableCell>
                                                        <TableCell className="font-medium">{student.full_name}</TableCell>
                                                        <TableCell>{student.class_name}</TableCell>
                                                        <TableCell>{student.section_name}</TableCell>
                                                    </TableRow>
                                                ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {selectedStudentIds.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                    {selectedStudentIds.length} students selected
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleAssignStudents} 
                                disabled={selectedStudentIds.length === 0 || loading}
                            >
                                {loading ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <UserPlus className="h-4 w-4 mr-2" />
                                )}
                                Assign {selectedStudentIds.length} Students
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Roll Number Generation Dialog */}
                <Dialog open={rollNumberDialogOpen} onOpenChange={setRollNumberDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Generate Roll Numbers</DialogTitle>
                            <DialogDescription>
                                Configure roll number generation for {examStudents.length} students
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Pattern</Label>
                                <Select 
                                    value={rollNumberConfig.pattern} 
                                    onValueChange={(v) => setRollNumberConfig({...rollNumberConfig, pattern: v})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="numeric">Numeric (001, 002, 003...)</SelectItem>
                                        <SelectItem value="alphanumeric">Alphanumeric (A001, A002...)</SelectItem>
                                        <SelectItem value="admission">Use Enrollment ID</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {rollNumberConfig.pattern !== 'admission' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Prefix</Label>
                                            <Input
                                                value={rollNumberConfig.prefix}
                                                onChange={(e) => setRollNumberConfig({...rollNumberConfig, prefix: e.target.value})}
                                                placeholder="e.g., EX"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Suffix</Label>
                                            <Input
                                                value={rollNumberConfig.suffix}
                                                onChange={(e) => setRollNumberConfig({...rollNumberConfig, suffix: e.target.value})}
                                                placeholder="e.g., -2026"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Start Number</Label>
                                            <Input
                                                type="number"
                                                value={rollNumberConfig.start_number}
                                                onChange={(e) => setRollNumberConfig({...rollNumberConfig, start_number: parseInt(e.target.value) || 1})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Padding (digits)</Label>
                                            <Input
                                                type="number"
                                                value={rollNumberConfig.padding}
                                                onChange={(e) => setRollNumberConfig({...rollNumberConfig, padding: parseInt(e.target.value) || 3})}
                                                min={1}
                                                max={6}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Preview */}
                            <div className="p-4 bg-muted rounded-md">
                                <Label className="text-xs">Preview</Label>
                                <p className="font-mono text-lg">
                                    {rollNumberConfig.pattern === 'admission' 
                                        ? 'Using admission numbers'
                                        : `${rollNumberConfig.prefix}${String(rollNumberConfig.start_number).padStart(rollNumberConfig.padding, '0')}${rollNumberConfig.suffix}`
                                    }
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRollNumberDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleGenerateRollNumbers} disabled={loading}>
                                {loading ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Hash className="h-4 w-4 mr-2" />
                                )}
                                Generate Roll Numbers
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default StudentAssignmentPage;
