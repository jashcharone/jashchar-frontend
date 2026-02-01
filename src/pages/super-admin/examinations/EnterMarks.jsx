import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from '@/components/ui/label';

const EnterMarks = ({ exam, onClose }) => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { toast } = useToast();
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [marks, setMarks] = useState({});
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const fetchStudentsAndSubjects = useCallback(async () => {
        setInitialLoading(true);
        const [studentsRes, subjectsRes] = await Promise.all([
            supabase.from('cbse_exam_students').select('profiles(*, classes(name), sections(name))').eq('exam_id', exam.id),
            supabase.from('cbse_exam_subjects').select('id, subjects(name), max_marks_theory, max_marks_practical, max_marks_assignment').eq('exam_id', exam.id)
        ]);
        
        if (studentsRes.error) toast({ variant: 'destructive', title: 'Error', description: studentsRes.error.message });
        else setStudents(studentsRes.data.map(s => s.profiles));

        if (subjectsRes.error) toast({ variant: 'destructive', title: 'Error', description: subjectsRes.error.message });
        else {
            setSubjects(subjectsRes.data);
            if (subjectsRes.data.length > 0) setSelectedSubjectId(subjectsRes.data[0].id);
        }
        setInitialLoading(false);
    }, [exam.id, toast]);

    const fetchMarks = useCallback(async () => {
        if (!selectedSubjectId) return;
        setLoading(true);
        const { data, error } = await supabase.from('cbse_exam_marks').select('*').eq('exam_subject_id', selectedSubjectId);
        if (error) toast({ variant: 'destructive', title: 'Error fetching marks', description: error.message });
        else {
            const marksData = data.reduce((acc, mark) => {
                acc[mark.student_id] = mark;
                return acc;
            }, {});
            setMarks(marksData);
        }
        setLoading(false);
    }, [selectedSubjectId, toast]);

    useEffect(() => { fetchStudentsAndSubjects(); }, [fetchStudentsAndSubjects]);
    useEffect(() => { if(selectedSubjectId) fetchMarks(); }, [selectedSubjectId, fetchMarks]);

    const handleMarkChange = (studentId, field, value) => {
        setMarks(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [field]: value }
        }));
    };

    const handleAbsentChange = (studentId, isAbsent) => {
        setMarks(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                is_absent: isAbsent,
                marks_theory: isAbsent ? 0 : prev[studentId]?.marks_theory,
                marks_practical: isAbsent ? 0 : prev[studentId]?.marks_practical,
                marks_assignment: isAbsent ? 0 : prev[studentId]?.marks_assignment,
            }
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        const currentSubject = subjects.find(s => s.id === selectedSubjectId);
        
        try {
            const marksToUpsert = students.map(student => {
                const studentId = student.id;
                const markData = marks[studentId] || {};
                
                const theory = parseFloat(markData.marks_theory);
                const practical = parseFloat(markData.marks_practical);
                const assignment = parseFloat(markData.marks_assignment);

                if (currentSubject.max_marks_theory && !isNaN(theory) && theory > currentSubject.max_marks_theory) {
                    throw new Error(`Theory marks for ${student.full_name} exceed the maximum of ${currentSubject.max_marks_theory}.`);
                }
                if (currentSubject.max_marks_practical && !isNaN(practical) && practical > currentSubject.max_marks_practical) {
                    throw new Error(`Practical marks for ${student.full_name} exceed the maximum of ${currentSubject.max_marks_practical}.`);
                }
                if (currentSubject.max_marks_assignment && !isNaN(assignment) && assignment > currentSubject.max_marks_assignment) {
                    throw new Error(`Assignment marks for ${student.full_name} exceed the maximum of ${currentSubject.max_marks_assignment}.`);
                }
                
                return {
                    id: markData.id,
                    branch_id: user.profile.branch_id,
                    session_id: currentSessionId,
                    organization_id: organizationId,
                    exam_id: exam.id,
                    exam_subject_id: selectedSubjectId,
                    student_id: studentId,
                    marks_theory: markData.marks_theory || null,
                    marks_practical: markData.marks_practical || null,
                    marks_assignment: markData.marks_assignment || null,
                    is_absent: markData.is_absent || false,
                };
            });

            const { error } = await supabase.from('cbse_exam_marks').upsert(marksToUpsert, { onConflict: 'id' });
            if (error) throw error;
            toast({ title: 'Marks saved successfully!' });
            onClose();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving marks', description: error.message });
        } finally {
            setLoading(false);
        }
    };
    
    const currentSubjectDetails = subjects.find(s => s.id === selectedSubjectId);

    return (
        <div className="space-y-4">
            <div className="flex gap-4 items-center">
                <div className="w-1/3">
                    <Label>Subject</Label>
                    <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                        <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                        <SelectContent>
                            {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.subjects.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                {currentSubjectDetails && <div className="text-sm text-muted-foreground mt-6">
                    Max Marks: 
                    {currentSubjectDetails.max_marks_theory != null && ` Th: ${currentSubjectDetails.max_marks_theory}`}
                    {currentSubjectDetails.max_marks_practical != null && ` | Pr: ${currentSubjectDetails.max_marks_practical}`}
                    {currentSubjectDetails.max_marks_assignment != null && ` | As: ${currentSubjectDetails.max_marks_assignment}`}
                </div>}
            </div>

            <div className="max-h-[50vh] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Roll No.</TableHead>
                            {currentSubjectDetails?.max_marks_theory != null && <TableHead>Theory</TableHead>}
                            {currentSubjectDetails?.max_marks_practical != null && <TableHead>Practical</TableHead>}
                            {currentSubjectDetails?.max_marks_assignment != null && <TableHead>Assignment</TableHead>}
                            <TableHead>Absent</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialLoading || loading ? (
                           <tr><td colSpan={6} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></td></tr>
                        ) : students.map(student => {
                            const studentMarks = marks[student.id] || {};
                            const isAbsent = studentMarks.is_absent || false;
                            return (
                                <TableRow key={student.id}>
                                    <TableCell>{student.full_name}</TableCell>
                                    <TableCell>{student.roll_number}</TableCell>
                                    {currentSubjectDetails?.max_marks_theory != null && <TableCell>
                                        <Input type="number" disabled={isAbsent} value={studentMarks.marks_theory || ''} onChange={e => handleMarkChange(student.id, 'marks_theory', e.target.value)} className="w-20" />
                                    </TableCell>}
                                    {currentSubjectDetails?.max_marks_practical != null && <TableCell>
                                        <Input type="number" disabled={isAbsent} value={studentMarks.marks_practical || ''} onChange={e => handleMarkChange(student.id, 'marks_practical', e.target.value)} className="w-20" />
                                    </TableCell>}
                                    {currentSubjectDetails?.max_marks_assignment != null && <TableCell>
                                        <Input type="number" disabled={isAbsent} value={studentMarks.marks_assignment || ''} onChange={e => handleMarkChange(student.id, 'marks_assignment', e.target.value)} className="w-20" />
                                    </TableCell>}
                                    <TableCell>
                                        <Checkbox checked={isAbsent} onCheckedChange={checked => handleAbsentChange(student.id, checked)} />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
            
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} disabled={loading || !selectedSubjectId}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
            </DialogFooter>
        </div>
    );
};

export default EnterMarks;
