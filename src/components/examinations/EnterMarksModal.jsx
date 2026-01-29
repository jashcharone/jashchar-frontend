import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowLeft, Save, Download, Upload } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const EnterMarksModal = ({ isOpen, onClose, exam, branchId }) => {
    const { toast } = useToast();
    const [view, setView] = useState('subjects'); // 'subjects' or 'students'
    const [loading, setLoading] = useState(false);
    const [examSubjects, setExamSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && exam) {
            setView('subjects');
            fetchExamSubjects();
        }
    }, [isOpen, exam]);

    const fetchExamSubjects = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('exam_subjects')
            .select(`
                *,
                subject:subjects(name, code)
            `)
            .eq('exam_id', exam.id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            setExamSubjects(data || []);
        }
        setLoading(false);
    };

    const handleEnterMarksClick = async (subject) => {
        setSelectedSubject(subject);
        setView('students');
        await fetchStudentsAndMarks(subject.id);
    };

    const fetchStudentsAndMarks = async (subjectId) => {
        setLoading(true);
        try {
            // Fetch students assigned to this exam - use student_profiles
            const { data: assignedStudents, error: studentError } = await supabase
                .from('exam_students')
                .select(`
                    student:student_profiles(id, full_name, roll_number, school_code, father_name)
                `)
                .eq('exam_id', exam.id);

            if (studentError) throw studentError;

            const studentList = assignedStudents.map(s => s.student);
            setStudents(studentList);

            // Fetch existing marks
            const { data: existingMarks, error: marksError } = await supabase
                .from('exam_marks')
                .select('*')
                .eq('exam_subject_id', subjectId);

            if (marksError) throw marksError;

            const marksMap = {};
            existingMarks.forEach(m => {
                marksMap[m.student_id] = m;
            });
            setMarks(marksMap);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleMarkChange = (studentId, field, value) => {
        setMarks(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [field]: value }
        }));
    };

    const handleSaveMarks = async () => {
        setSaving(true);
        try {
            const marksToUpsert = students.map(student => {
                const studentMarks = marks[student.id] || {};
                return {
                    id: studentMarks.id, // Undefined if new
                    exam_subject_id: selectedSubject.id,
                    student_id: student.id,
                    marks: studentMarks.marks || 0,
                    is_absent: studentMarks.is_absent || false,
                    note: studentMarks.note
                };
            });

            const { error } = await supabase.from('exam_marks').upsert(marksToUpsert, { onConflict: 'exam_subject_id, student_id' });
            if (error) throw error;

            toast({ title: 'Marks saved successfully' });
            // Refresh marks
            await fetchStudentsAndMarks(selectedSubject.id);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving marks', description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const generateCSV = () => {
        if (!selectedSubject || students.length === 0) return;
        
        const headers = ['Student ID', 'Admission No', 'Roll No', 'Name', 'Father Name', 'Marks', 'Absent (1=Yes, 0=No)', 'Note'];
        const csvContent = [
            headers.join(','),
            ...students.map(s => {
                const m = marks[s.id] || {};
                return [
                    s.id,
                    s.school_code || '',
                    s.roll_number || '',
                    `"${s.full_name}"`,
                    `"${s.father_name || ''}"`,
                    m.marks || '',
                    m.is_absent ? 1 : 0,
                    `"${m.note || ''}"`
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Marks_${selectedSubject.subject.name}_${exam.name}.csv`;
        link.click();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Enter Marks: {exam?.name}</DialogTitle>
                </DialogHeader>

                {view === 'subjects' ? (
                    <div className="flex-1 p-2">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Room No</TableHead>
                                    <TableHead>Marks (Max/Min)</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-4"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                                ) : examSubjects.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No subjects found. Add subjects first.</TableCell></TableRow>
                                ) : (
                                    examSubjects.map(sub => (
                                        <TableRow key={sub.id}>
                                            <TableCell className="font-medium">{sub.subject?.name} ({sub.subject?.code})</TableCell>
                                            <TableCell>{sub.date}</TableCell>
                                            <TableCell>{sub.time}</TableCell>
                                            <TableCell>{sub.room_no}</TableCell>
                                            <TableCell>{sub.max_marks} / {sub.min_marks}</TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" onClick={() => handleEnterMarksClick(sub)}>Enter Marks</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-4 bg-muted/30 p-2 rounded">
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => setView('subjects')}>
                                    <ArrowLeft className="w-4 h-4" />
                                </Button>
                                <div>
                                    <h3 className="font-semibold">{selectedSubject?.subject?.name}</h3>
                                    <p className="text-xs text-muted-foreground">Max Marks: {selectedSubject?.max_marks}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={generateCSV}>
                                    <Download className="w-4 h-4 mr-2" /> Download Import File
                                </Button>
                                {/* Placeholder for upload */}
                                <Button variant="outline" size="sm" disabled>
                                    <Upload className="w-4 h-4 mr-2" /> Import CSV
                                </Button>
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Admission No</TableHead>
                                        <TableHead>Roll No</TableHead>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead>Father Name</TableHead>
                                        <TableHead>Attendance</TableHead>
                                        <TableHead>Marks</TableHead>
                                        <TableHead>Note</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map(student => {
                                        const m = marks[student.id] || {};
                                        return (
                                            <TableRow key={student.id}>
                                                <TableCell>{student.school_code}</TableCell>
                                                <TableCell>{student.roll_number}</TableCell>
                                                <TableCell className="font-medium">{student.full_name}</TableCell>
                                                <TableCell>{student.father_name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox 
                                                            checked={m.is_absent} 
                                                            onCheckedChange={(c) => handleMarkChange(student.id, 'is_absent', c)} 
                                                        />
                                                        <span className="text-sm">Absent</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Input 
                                                        type="number" 
                                                        className="w-24" 
                                                        disabled={m.is_absent}
                                                        value={m.marks || ''} 
                                                        onChange={(e) => handleMarkChange(student.id, 'marks', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input 
                                                        className="w-full" 
                                                        value={m.note || ''} 
                                                        onChange={(e) => handleMarkChange(student.id, 'note', e.target.value)}
                                                        placeholder="Note"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>

                        <div className="flex justify-end pt-4 border-t">
                            <Button onClick={handleSaveMarks} disabled={saving}>
                                {saving ? <Loader2 className="animate-spin mr-2 w-4 h-4"/> : <Save className="mr-2 w-4 h-4"/>} Submit Marks
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default EnterMarksModal;
