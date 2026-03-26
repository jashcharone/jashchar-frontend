/**
 * Internal Assessment Entry Page
 * For entering class tests, homework, assignments, participation marks
 * Phase 4 of Examination Module
 * @file jashchar-frontend/src/pages/super-admin/examinations/InternalAssessmentEntry.jsx
 * @date 2026-03-13
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { 
    examGroupService, 
    examService, 
    internalAssessmentService,
    examStudentService 
} from '@/services/examinationService';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

// Icons
import { 
    Save,
    RefreshCw,
    ClipboardList,
    Calculator,
    FileText,
    BookOpen,
    CheckSquare
} from 'lucide-react';

const InternalAssessmentEntry = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // Selection State
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [bestOfCount, setBestOfCount] = useState(2);

    // Data State
    const [examGroups, setExamGroups] = useState([]);
    const [exams, setExams] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);

    // Assessment Data
    const [assessmentData, setAssessmentData] = useState([]);

    // Loading States
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Active Tab
    const [activeTab, setActiveTab] = useState('tests');

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

    // Fetch students when subject changes
    useEffect(() => {
        if (selectedExam && selectedSubject) {
            fetchStudentsWithAssessments();
        } else {
            setStudents([]);
            setAssessmentData([]);
        }
    }, [selectedExam, selectedSubject]);

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
                const response = await examService.getById(examId);
                if (response.success && response.data?.subjects) {
                    setSubjects(response.data.subjects);
                }
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchStudentsWithAssessments = async () => {
        setLoading(true);
        try {
            // Get students
            const studentsRes = await examStudentService.getAll({ exam_id: selectedExam });
            
            // Get existing assessments
            const assessmentsRes = await internalAssessmentService.getAll({
                exam_id: selectedExam,
                exam_subject_id: selectedSubject
            });

            if (studentsRes.success) {
                const studentsList = studentsRes.data || [];
                setStudents(studentsList);

                // Map existing assessments
                const assessmentsMap = new Map(
                    (assessmentsRes.data || []).map(a => [a.student_id, a])
                );

                // Initialize assessment data
                const initialData = studentsList.map(s => {
                    const existing = assessmentsMap.get(s.student_id);
                    return {
                        student_id: s.student_id,
                        roll_number: s.roll_number,
                        student_name: `${s.student?.first_name || ''} ${s.student?.last_name || ''}`,
                        enrollment_id: s.student?.enrollment_id,
                        // Class Tests
                        class_test_1: existing?.class_test_1 ?? '',
                        class_test_2: existing?.class_test_2 ?? '',
                        class_test_3: existing?.class_test_3 ?? '',
                        class_test_4: existing?.class_test_4 ?? '',
                        // Homework & Assignments
                        homework: existing?.homework ?? '',
                        assignment_1: existing?.assignment_1 ?? '',
                        assignment_2: existing?.assignment_2 ?? '',
                        assignment_3: existing?.assignment_3 ?? '',
                        // Project & Others
                        project: existing?.project ?? '',
                        participation: existing?.participation ?? '',
                        discipline: existing?.discipline ?? '',
                        attendance_bonus: existing?.attendance_bonus ?? '',
                        // Calculated
                        total_internal: existing?.total_internal ?? 0,
                        average_internal: existing?.average_internal ?? 0,
                        best_of: existing?.best_of ?? 0
                    };
                });

                setAssessmentData(initialData);
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

    const handleInputChange = (index, field, value) => {
        const newData = [...assessmentData];
        newData[index][field] = value;

        // Calculate best of N if it's a test field
        if (field.startsWith('class_test_')) {
            const tests = [
                parseFloat(newData[index].class_test_1) || 0,
                parseFloat(newData[index].class_test_2) || 0,
                parseFloat(newData[index].class_test_3) || 0,
                parseFloat(newData[index].class_test_4) || 0
            ].filter(t => t > 0).sort((a, b) => b - a);

            const bestTests = tests.slice(0, bestOfCount);
            newData[index].best_of = bestTests.length > 0 
                ? (bestTests.reduce((a, b) => a + b, 0) / bestTests.length).toFixed(2)
                : 0;
        }

        // Calculate total
        const total = 
            (parseFloat(newData[index].class_test_1) || 0) +
            (parseFloat(newData[index].class_test_2) || 0) +
            (parseFloat(newData[index].homework) || 0) +
            (parseFloat(newData[index].assignment_1) || 0) +
            (parseFloat(newData[index].project) || 0) +
            (parseFloat(newData[index].participation) || 0);

        newData[index].total_internal = total.toFixed(2);
        newData[index].average_internal = (total / 6).toFixed(2);

        setAssessmentData(newData);
    };

    const handleSave = async () => {
        if (!selectedExam || !selectedSubject) {
            toast({
                title: 'Select Required Fields',
                description: 'Please select exam and subject first',
                variant: 'destructive'
            });
            return;
        }

        setSaving(true);
        try {
            const response = await internalAssessmentService.save({
                exam_id: selectedExam,
                exam_subject_id: selectedSubject,
                assessments_data: assessmentData,
                best_of_count: bestOfCount
            });

            if (response.success) {
                toast({ title: 'Success', description: 'Internal assessments saved' });
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

    return (
        <DashboardLayout>
            <div className="container mx-auto py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <ClipboardList className="h-6 w-6" />
                            Internal Assessment Entry
                        </h1>
                        <p className="text-muted-foreground">
                            Enter class tests, homework, assignments, and participation marks
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                                {subject.subject_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Best of N Tests</Label>
                                <Select value={bestOfCount.toString()} onValueChange={(v) => setBestOfCount(parseInt(v))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Best of 1</SelectItem>
                                        <SelectItem value="2">Best of 2</SelectItem>
                                        <SelectItem value="3">Best of 3</SelectItem>
                                        <SelectItem value="4">All 4 Tests</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Assessment Entry Tabs */}
                {selectedSubject && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Internal Assessment</CardTitle>
                                <CardDescription>
                                    {subjects.find(s => s.id === selectedSubject)?.subject_name}
                                </CardDescription>
                            </div>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                                <Save className="h-4 w-4 mr-2" />
                                Save
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="tests">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Class Tests
                                    </TabsTrigger>
                                    <TabsTrigger value="homework">
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        Homework
                                    </TabsTrigger>
                                    <TabsTrigger value="others">
                                        <CheckSquare className="h-4 w-4 mr-2" />
                                        Others
                                    </TabsTrigger>
                                    <TabsTrigger value="summary">
                                        <Calculator className="h-4 w-4 mr-2" />
                                        Summary
                                    </TabsTrigger>
                                </TabsList>

                                {/* Class Tests Tab */}
                                <TabsContent value="tests">
                                    <div className="border rounded-lg overflow-x-auto mt-4">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[60px]">Roll</TableHead>
                                                    <TableHead className="min-w-[180px]">Student</TableHead>
                                                    <TableHead className="w-[80px]">CT-1 (20)</TableHead>
                                                    <TableHead className="w-[80px]">CT-2 (20)</TableHead>
                                                    <TableHead className="w-[80px]">CT-3 (20)</TableHead>
                                                    <TableHead className="w-[80px]">CT-4 (20)</TableHead>
                                                    <TableHead className="w-[80px]">Best of {bestOfCount}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {assessmentData.map((student, idx) => (
                                                    <TableRow key={student.student_id}>
                                                        <TableCell className="font-medium">{student.roll_number}</TableCell>
                                                        <TableCell>
                                                            <div>{student.student_name}</div>
                                                            <div className="text-xs text-muted-foreground">{student.enrollment_id}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="20"
                                                                value={student.class_test_1}
                                                                onChange={(e) => handleInputChange(idx, 'class_test_1', e.target.value)}
                                                                className="w-16"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="20"
                                                                value={student.class_test_2}
                                                                onChange={(e) => handleInputChange(idx, 'class_test_2', e.target.value)}
                                                                className="w-16"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="20"
                                                                value={student.class_test_3}
                                                                onChange={(e) => handleInputChange(idx, 'class_test_3', e.target.value)}
                                                                className="w-16"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="20"
                                                                value={student.class_test_4}
                                                                onChange={(e) => handleInputChange(idx, 'class_test_4', e.target.value)}
                                                                className="w-16"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="font-mono">
                                                                {student.best_of}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>

                                {/* Homework Tab */}
                                <TabsContent value="homework">
                                    <div className="border rounded-lg overflow-x-auto mt-4">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[60px]">Roll</TableHead>
                                                    <TableHead className="min-w-[180px]">Student</TableHead>
                                                    <TableHead className="w-[80px]">HW (10)</TableHead>
                                                    <TableHead className="w-[80px]">Assign-1 (10)</TableHead>
                                                    <TableHead className="w-[80px]">Assign-2 (10)</TableHead>
                                                    <TableHead className="w-[80px]">Assign-3 (10)</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {assessmentData.map((student, idx) => (
                                                    <TableRow key={student.student_id}>
                                                        <TableCell className="font-medium">{student.roll_number}</TableCell>
                                                        <TableCell>{student.student_name}</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="10"
                                                                value={student.homework}
                                                                onChange={(e) => handleInputChange(idx, 'homework', e.target.value)}
                                                                className="w-16"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="10"
                                                                value={student.assignment_1}
                                                                onChange={(e) => handleInputChange(idx, 'assignment_1', e.target.value)}
                                                                className="w-16"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="10"
                                                                value={student.assignment_2}
                                                                onChange={(e) => handleInputChange(idx, 'assignment_2', e.target.value)}
                                                                className="w-16"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="10"
                                                                value={student.assignment_3}
                                                                onChange={(e) => handleInputChange(idx, 'assignment_3', e.target.value)}
                                                                className="w-16"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>

                                {/* Others Tab */}
                                <TabsContent value="others">
                                    <div className="border rounded-lg overflow-x-auto mt-4">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[60px]">Roll</TableHead>
                                                    <TableHead className="min-w-[180px]">Student</TableHead>
                                                    <TableHead className="w-[80px]">Project (20)</TableHead>
                                                    <TableHead className="w-[80px]">Participation (10)</TableHead>
                                                    <TableHead className="w-[80px]">Discipline (10)</TableHead>
                                                    <TableHead className="w-[80px]">Attendance Bonus</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {assessmentData.map((student, idx) => (
                                                    <TableRow key={student.student_id}>
                                                        <TableCell className="font-medium">{student.roll_number}</TableCell>
                                                        <TableCell>{student.student_name}</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="20"
                                                                value={student.project}
                                                                onChange={(e) => handleInputChange(idx, 'project', e.target.value)}
                                                                className="w-16"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="10"
                                                                value={student.participation}
                                                                onChange={(e) => handleInputChange(idx, 'participation', e.target.value)}
                                                                className="w-16"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="10"
                                                                value={student.discipline}
                                                                onChange={(e) => handleInputChange(idx, 'discipline', e.target.value)}
                                                                className="w-16"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="5"
                                                                value={student.attendance_bonus}
                                                                onChange={(e) => handleInputChange(idx, 'attendance_bonus', e.target.value)}
                                                                className="w-16"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>

                                {/* Summary Tab */}
                                <TabsContent value="summary">
                                    <div className="border rounded-lg overflow-x-auto mt-4">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[60px]">Roll</TableHead>
                                                    <TableHead className="min-w-[180px]">Student</TableHead>
                                                    <TableHead>Best Test</TableHead>
                                                    <TableHead>Homework</TableHead>
                                                    <TableHead>Assignment</TableHead>
                                                    <TableHead>Project</TableHead>
                                                    <TableHead>Participation</TableHead>
                                                    <TableHead>Total</TableHead>
                                                    <TableHead>Average</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {assessmentData.map((student) => (
                                                    <TableRow key={student.student_id}>
                                                        <TableCell className="font-medium">{student.roll_number}</TableCell>
                                                        <TableCell>{student.student_name}</TableCell>
                                                        <TableCell>{student.best_of}</TableCell>
                                                        <TableCell>{student.homework || '-'}</TableCell>
                                                        <TableCell>{student.assignment_1 || '-'}</TableCell>
                                                        <TableCell>{student.project || '-'}</TableCell>
                                                        <TableCell>{student.participation || '-'}</TableCell>
                                                        <TableCell className="font-semibold">{student.total_internal}</TableCell>
                                                        <TableCell>
                                                            <Badge>{student.average_internal}</Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                )}

                {!selectedSubject && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">Select Exam & Subject</h3>
                            <p className="text-muted-foreground">
                                Choose exam group, exam, and subject to enter internal assessments
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default InternalAssessmentEntry;
