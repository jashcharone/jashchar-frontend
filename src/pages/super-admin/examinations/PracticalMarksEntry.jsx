/**
 * Practical Marks Entry Page
 * For entering practical exam marks - experiment, record, viva, project
 * Phase 4 of Examination Module
 * @file jashchar-frontend/src/pages/super-admin/examinations/PracticalMarksEntry.jsx
 * @date 2026-03-13
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { 
    examGroupService, 
    examService, 
    practicalMarksService,
    examStudentService 
} from '@/services/examinationService';
import { useToast } from '@/hooks/use-toast';
import { formatDateForInput } from '@/utils/dateUtils';
import DatePicker from '@/components/ui/DatePicker';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Icons
import { 
    Save,
    RefreshCw,
    FlaskConical,
    User,
    Calendar
} from 'lucide-react';

const PracticalMarksEntry = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();

    // Selection State
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    // Data State
    const [examGroups, setExamGroups] = useState([]);
    const [exams, setExams] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);

    // Practical Data
    const [practicalData, setPracticalData] = useState([]);

    // Examiner Details
    const [examinerDetails, setExaminerDetails] = useState({
        practical_date: formatDateForInput(new Date()),
        internal_examiner_name: '',
        external_examiner_name: ''
    });

    // Max Marks Config
    const [maxMarks, setMaxMarks] = useState({
        experiment: 15,
        record: 5,
        viva: 5,
        project: 10,
        observation: 5,
        total: 30
    });

    // Loading States
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Stats
    const [stats, setStats] = useState({ total: 0, entered: 0, absent: 0, average: 0 });

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
            fetchStudentsWithPracticals();
        } else {
            setStudents([]);
            setPracticalData([]);
        }
    }, [selectedExam, selectedSubject]);

    // Calculate stats
    useEffect(() => {
        calculateStats();
    }, [practicalData]);

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
                // Filter only subjects with practical
                const practicalSubjects = exam.subjects.filter(s => s.has_practical);
                setSubjects(practicalSubjects);
            } else {
                const response = await examService.getById(examId);
                if (response.success && response.data?.subjects) {
                    const practicalSubjects = response.data.subjects.filter(s => s.has_practical);
                    setSubjects(practicalSubjects);
                }
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchStudentsWithPracticals = async () => {
        setLoading(true);
        try {
            // Get students
            const studentsRes = await examStudentService.getAll({ exam_id: selectedExam });
            
            // Get existing practical marks
            const practicalsRes = await practicalMarksService.getAll({
                exam_id: selectedExam,
                exam_subject_id: selectedSubject
            });

            if (studentsRes.success) {
                const studentsList = studentsRes.data || [];
                setStudents(studentsList);

                // Map existing practicals
                const practicalsMap = new Map(
                    (practicalsRes.data || []).map(p => [p.student_id, p])
                );

                // Initialize practical data
                const initialData = studentsList.map(s => {
                    const existing = practicalsMap.get(s.student_id);
                    return {
                        student_id: s.student_id,
                        roll_number: s.roll_number,
                        student_name: `${s.student?.first_name || ''} ${s.student?.last_name || ''}`,
                        admission_number: s.student?.admission_number,
                        batch_number: existing?.batch_number ?? '',
                        experiment_marks: existing?.experiment_marks ?? '',
                        record_marks: existing?.record_marks ?? '',
                        viva_marks: existing?.viva_marks ?? '',
                        project_marks: existing?.project_marks ?? '',
                        observation_marks: existing?.observation_marks ?? '',
                        total_practical: existing?.total_practical ?? 0,
                        is_absent: existing?.is_absent ?? false
                    };
                });

                setPracticalData(initialData);

                // Set examiner details if exists
                if (practicalsRes.data?.[0]) {
                    setExaminerDetails({
                        practical_date: practicalsRes.data[0].practical_date || formatDateForInput(new Date()),
                        internal_examiner_name: practicalsRes.data[0].internal_examiner_name || '',
                        external_examiner_name: practicalsRes.data[0].external_examiner_name || ''
                    });
                }
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
        const newData = [...practicalData];
        newData[index][field] = value;

        // Calculate total if marks changed
        if (['experiment_marks', 'record_marks', 'viva_marks', 'project_marks', 'observation_marks'].includes(field)) {
            const total = 
                (parseFloat(newData[index].experiment_marks) || 0) +
                (parseFloat(newData[index].record_marks) || 0) +
                (parseFloat(newData[index].viva_marks) || 0) +
                (parseFloat(newData[index].project_marks) || 0) +
                (parseFloat(newData[index].observation_marks) || 0);
            
            newData[index].total_practical = total;
        }

        // Handle absent toggle
        if (field === 'is_absent' && value) {
            newData[index].experiment_marks = '';
            newData[index].record_marks = '';
            newData[index].viva_marks = '';
            newData[index].project_marks = '';
            newData[index].observation_marks = '';
            newData[index].total_practical = 0;
        }

        setPracticalData(newData);
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
            const response = await practicalMarksService.save({
                exam_id: selectedExam,
                exam_subject_id: selectedSubject,
                practical_data: practicalData,
                examiner_details: examinerDetails
            });

            if (response.success) {
                toast({ title: 'Success', description: 'Practical marks saved' });
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

    const calculateStats = () => {
        if (practicalData.length === 0) {
            setStats({ total: 0, entered: 0, absent: 0, average: 0 });
            return;
        }

        const total = practicalData.length;
        const absent = practicalData.filter(p => p.is_absent).length;
        const entered = practicalData.filter(p => p.total_practical > 0 || p.is_absent).length;
        
        const totalMarks = practicalData.filter(p => !p.is_absent).reduce((sum, p) => sum + (p.total_practical || 0), 0);
        const presentCount = total - absent;
        const average = presentCount > 0 ? (totalMarks / presentCount).toFixed(2) : 0;

        setStats({ total, entered, absent, average });
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FlaskConical className="h-6 w-6" />
                            Practical Marks Entry
                        </h1>
                        <p className="text-muted-foreground">
                            Enter practical examination marks
                        </p>
                    </div>
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
                                <Label>Subject (Practical) *</Label>
                                <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedExam}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subjects.length === 0 ? (
                                            <SelectItem value="__none" disabled>No practical subjects</SelectItem>
                                        ) : (
                                            subjects.map(subject => (
                                                <SelectItem key={subject.id} value={subject.id}>
                                                    {subject.subject_name} ({subject.practical_marks || 30} marks)
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Examiner & Date Info */}
                {selectedSubject && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Examiner Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Practical Date
                                    </Label>
                                    <DatePicker
                                        value={examinerDetails.practical_date}
                                        onChange={(date) => setExaminerDetails({...examinerDetails, practical_date: date})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Internal Examiner
                                    </Label>
                                    <Input
                                        value={examinerDetails.internal_examiner_name}
                                        onChange={(e) => setExaminerDetails({...examinerDetails, internal_examiner_name: e.target.value})}
                                        placeholder="Enter internal examiner name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        External Examiner
                                    </Label>
                                    <Input
                                        value={examinerDetails.external_examiner_name}
                                        onChange={(e) => setExaminerDetails({...examinerDetails, external_examiner_name: e.target.value})}
                                        placeholder="Enter external examiner name"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Stats Cards */}
                {selectedSubject && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-4">
                                <div className="text-2xl font-bold">{stats.total}</div>
                                <div className="text-sm text-muted-foreground">Total Students</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.entered}</div>
                                <div className="text-sm text-muted-foreground">Entered</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4">
                                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.absent}</div>
                                <div className="text-sm text-muted-foreground">Absent</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4">
                                <div className="text-2xl font-bold">{stats.average}</div>
                                <div className="text-sm text-muted-foreground">Average</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Practical Marks Table */}
                {selectedSubject && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Practical Marks</CardTitle>
                                <CardDescription>
                                    {subjects.find(s => s.id === selectedSubject)?.subject_name} - 
                                    Max: {subjects.find(s => s.id === selectedSubject)?.practical_marks || 30}
                                </CardDescription>
                            </div>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                                <Save className="h-4 w-4 mr-2" />
                                Save
                            </Button>
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
                                                <TableHead className="min-w-[180px]">Student</TableHead>
                                                <TableHead className="w-[60px]">Batch</TableHead>
                                                <TableHead className="w-[80px]">Expt ({maxMarks.experiment})</TableHead>
                                                <TableHead className="w-[80px]">Record ({maxMarks.record})</TableHead>
                                                <TableHead className="w-[80px]">Viva ({maxMarks.viva})</TableHead>
                                                <TableHead className="w-[80px]">Project ({maxMarks.project})</TableHead>
                                                <TableHead className="w-[80px]">Obs ({maxMarks.observation})</TableHead>
                                                <TableHead className="w-[80px]">Total</TableHead>
                                                <TableHead className="w-[60px]">Absent</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {practicalData.map((student, idx) => (
                                                <TableRow key={student.student_id} className={student.is_absent ? 'bg-orange-50 dark:bg-orange-900/20' : ''}>
                                                    <TableCell className="font-medium">{student.roll_number}</TableCell>
                                                    <TableCell>
                                                        <div>{student.student_name}</div>
                                                        <div className="text-xs text-muted-foreground">{student.admission_number}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            value={student.batch_number}
                                                            onChange={(e) => handleInputChange(idx, 'batch_number', e.target.value)}
                                                            placeholder="A/B/C"
                                                            className="w-14"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={maxMarks.experiment}
                                                            value={student.experiment_marks}
                                                            onChange={(e) => handleInputChange(idx, 'experiment_marks', e.target.value)}
                                                            disabled={student.is_absent}
                                                            className="w-16"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={maxMarks.record}
                                                            value={student.record_marks}
                                                            onChange={(e) => handleInputChange(idx, 'record_marks', e.target.value)}
                                                            disabled={student.is_absent}
                                                            className="w-16"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={maxMarks.viva}
                                                            value={student.viva_marks}
                                                            onChange={(e) => handleInputChange(idx, 'viva_marks', e.target.value)}
                                                            disabled={student.is_absent}
                                                            className="w-16"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={maxMarks.project}
                                                            value={student.project_marks}
                                                            onChange={(e) => handleInputChange(idx, 'project_marks', e.target.value)}
                                                            disabled={student.is_absent}
                                                            className="w-16"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={maxMarks.observation}
                                                            value={student.observation_marks}
                                                            onChange={(e) => handleInputChange(idx, 'observation_marks', e.target.value)}
                                                            disabled={student.is_absent}
                                                            className="w-16"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-semibold">
                                                        <Badge variant={student.is_absent ? 'destructive' : 'outline'}>
                                                            {student.is_absent ? 'AB' : student.total_practical}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={student.is_absent}
                                                            onCheckedChange={(checked) => handleInputChange(idx, 'is_absent', checked)}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {!selectedSubject && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <FlaskConical className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">Select Exam & Subject</h3>
                            <p className="text-muted-foreground">
                                Choose exam group, exam, and a subject with practical component
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default PracticalMarksEntry;
