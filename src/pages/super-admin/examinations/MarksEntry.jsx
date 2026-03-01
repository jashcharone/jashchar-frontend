import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, Save, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MarksEntry = () => {
    const { branchId, currentSessionId, organizationId } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Selection States
    const [examGroups, setExamGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [exams, setExams] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState('');

    // Data States
    const [students, setStudents] = useState([]);
    const [marksData, setMarksData] = useState({}); // { student_id: { get_marks, note, is_absent } }

    useEffect(() => {
        if (branchId) {
            fetchExamGroups();
        }
    }, [branchId]);

    useEffect(() => {
        if (selectedGroupId) {
            fetchExams(selectedGroupId);
        } else {
            setExams([]);
            setSelectedExamId('');
        }
    }, [selectedGroupId]);

    useEffect(() => {
        if (selectedExamId) {
            fetchSubjects(selectedExamId);
        } else {
            setSubjects([]);
            setSelectedSubjectId('');
        }
    }, [selectedExamId]);

    const fetchExamGroups = async () => {
        const { data, error } = await supabase
            .from('exam_groups')
            .select('*')
            .eq('branch_id', branchId);
        if (data) setExamGroups(data);
    };

    const fetchExams = async (groupId) => {
        const { data, error } = await supabase
            .from('exams')
            .select('*')
            .eq('exam_group_id', groupId);
        if (data) setExams(data);
    };

    const fetchSubjects = async (examId) => {
        // Fetch subjects linked to this exam
        // We need to join with subjects table to get names if possible, 
        // but for now assuming exam_subjects has what we need or we join manually
        // Actually exam_subjects has subject_id. We need to fetch subject name.
        // Assuming 'subjects' table exists.
        const { data, error } = await supabase
            .from('exam_subjects')
            .select(`
                *,
                subject:subjects(name, code)
            `)
            .eq('exam_id', examId);
        
        if (data) setSubjects(data);
    };

    const handleSearch = async () => {
        if (!selectedExamId || !selectedSubjectId) {
            toast({ variant: 'destructive', title: 'Please select Exam and Subject' });
            return;
        }

        setLoading(true);
        try {
            // 1. Fetch Students assigned to this exam
            const { data: studentData, error: studentError } = await supabase
                .from('exam_students')
                .select(`
                    student_id,
                    roll_no,
                    student:students(id, first_name, last_name, admission_no)
                `)
                .eq('exam_id', selectedExamId);

            if (studentError) throw studentError;

            // 2. Fetch existing results for this exam to populate marks
            // We store results in 'exam_results' table which is per student per exam.
            // It contains a JSONB 'subjects' array.
            const { data: resultData, error: resultError } = await supabase
                .from('exam_results')
                .select('student_id, subjects')
                .eq('exam_id', selectedExamId);

            if (resultError) throw resultError;

            // Map existing marks
            const currentSubject = subjects.find(s => s.id === selectedSubjectId);
            const initialMarks = {};

            studentData.forEach(item => {
                const studentResult = resultData?.find(r => r.student_id === item.student_id);
                if (studentResult && studentResult.subjects) {
                    // Find the specific subject in the JSON array
                    // We match by subject_id or code/name. 
                    // Since exam_results.subjects is JSON, let's assume we store subject_id in it too.
                    const subjectMark = studentResult.subjects.find(s => s.subject_id === selectedSubjectId);
                    if (subjectMark) {
                        initialMarks[item.student_id] = {
                            get_marks: subjectMark.get_marks,
                            note: subjectMark.note,
                            is_absent: subjectMark.is_absent || false
                        };
                    }
                }
            });

            setStudents(studentData || []);
            setMarksData(initialMarks);

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error fetching students' });
        } finally {
            setLoading(false);
        }
    };

    const handleMarkChange = (studentId, field, value) => {
        setMarksData(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const currentSubject = subjects.find(s => s.id === selectedSubjectId);
            
            // We need to update 'exam_results' for each student.
            // Since it's a JSONB array, we need to:
            // 1. Fetch current result (we already have it partially, but better to fetch fresh or use upsert logic carefully)
            // Actually, iterating and upserting is safest.

            const updates = students.map(async (student) => {
                const marks = marksData[student.student_id] || {};
                
                // Fetch existing record first to preserve other subjects
                const { data: existing } = await supabase
                    .from('exam_results')
                    .select('*')
                    .eq('exam_id', selectedExamId)
                    .eq('student_id', student.student_id)
                    .maybeSingle();

                let subjectList = existing?.subjects || [];
                
                // Remove old entry for this subject
                subjectList = subjectList.filter(s => s.subject_id !== selectedSubjectId);

                // Add new entry
                subjectList.push({
                    subject_id: selectedSubjectId,
                    name: currentSubject.subject?.name,
                    code: currentSubject.subject?.code,
                    max_marks: currentSubject.max_marks,
                    min_marks: currentSubject.min_marks,
                    get_marks: marks.get_marks || 0,
                    note: marks.note || '',
                    is_absent: marks.is_absent || false
                });

                // Calculate Totals
                const totalMax = subjectList.reduce((acc, curr) => acc + (Number(curr.max_marks) || 0), 0);
                const totalGet = subjectList.reduce((acc, curr) => acc + (Number(curr.get_marks) || 0), 0);
                const percentage = totalMax > 0 ? ((totalGet / totalMax) * 100).toFixed(2) : 0;
                
                // Determine Pass/Fail (Simple logic for now)
                const isFail = subjectList.some(s => Number(s.get_marks) < Number(s.min_marks));
                const resultStatus = isFail ? 'Fail' : 'Pass';

                const payload = {
                    exam_id: selectedExamId,
                    student_id: student.student_id,
                    admission_no: student.student.admission_no,
                    student_name: `${student.student.first_name} ${student.student.last_name}`,
                    roll_number: student.roll_no,
                    subjects: subjectList,
                    total_max_marks: totalMax,
                    total_get_marks: totalGet,
                    percentage: percentage,
                    result_status: resultStatus,
                    branch_id: branchId,
                    session_id: currentSessionId,
                    organization_id: organizationId
                };

                if (existing) {
                    return supabase.from('exam_results').update(payload).eq('id', existing.id);
                } else {
                    return supabase.from('exam_results').insert(payload);
                }
            });

            await Promise.all(updates);
            toast({ title: 'Marks saved successfully' });

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error saving marks' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 p-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Marks Entry</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Select Criteria</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Exam Group</Label>
                                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {examGroups.map(g => (
                                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Exam</Label>
                                <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Exam" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {exams.map(e => (
                                            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Subject</Label>
                                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subjects.map(s => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.subject?.name} ({s.max_marks})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button onClick={handleSearch} disabled={loading} className="w-full md:w-auto">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                            Search
                        </Button>
                    </CardContent>
                </Card>

                {students.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Enter Marks</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Admission No</TableHead>
                                            <TableHead>Student Name</TableHead>
                                            <TableHead>Marks (Max: {subjects.find(s => s.id === selectedSubjectId)?.max_marks})</TableHead>
                                            <TableHead>Note</TableHead>
                                            <TableHead>Absent</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.map((item) => (
                                            <TableRow key={item.student_id}>
                                                <TableCell>{item.student?.admission_no}</TableCell>
                                                <TableCell>{item.student?.first_name} {item.student?.last_name}</TableCell>
                                                <TableCell>
                                                    <Input 
                                                        type="number" 
                                                        className="w-24"
                                                        value={marksData[item.student_id]?.get_marks || ''}
                                                        onChange={(e) => handleMarkChange(item.student_id, 'get_marks', e.target.value)}
                                                        disabled={marksData[item.student_id]?.is_absent}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input 
                                                        className="w-40"
                                                        value={marksData[item.student_id]?.note || ''}
                                                        onChange={(e) => handleMarkChange(item.student_id, 'note', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <input 
                                                        type="checkbox"
                                                        checked={marksData[item.student_id]?.is_absent || false}
                                                        onChange={(e) => handleMarkChange(item.student_id, 'is_absent', e.target.checked)}
                                                        className="h-4 w-4"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    Save Marks
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MarksEntry;
