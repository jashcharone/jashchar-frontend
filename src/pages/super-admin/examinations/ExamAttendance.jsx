import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ExamAttendance = ({ exam, onClose }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const fetchStudentsAndAttendance = useCallback(async () => {
        if (!exam?.id) return; // Added null check to prevent crash
        
        setInitialLoading(true);
        const [studentsRes, attendanceRes] = await Promise.all([
            supabase.from('cbse_exam_students').select('profiles(*)').eq('exam_id', exam.id),
            supabase.from('cbse_exam_attendance').select('*').eq('exam_id', exam.id)
        ]);

        if (studentsRes.error) toast({ variant: 'destructive', title: 'Error', description: studentsRes.error.message });
        else setStudents(studentsRes.data.map(s => s.profiles));

        if (attendanceRes.error) toast({ variant: 'destructive', title: 'Error', description: attendanceRes.error.message });
        else {
            const attendanceData = attendanceRes.data.reduce((acc, item) => {
                acc[item.student_id] = { 
                    id: item.id, 
                    present_days: item.present_days,
                    total_attendance_days: item.total_attendance_days
                };
                return acc;
            }, {});
            setAttendance(attendanceData);
        }
        setInitialLoading(false);
    }, [exam, toast]); // Added exam to dependency array

    useEffect(() => { 
        if(exam?.id) fetchStudentsAndAttendance(); 
    }, [fetchStudentsAndAttendance, exam]);

    const handleAttendanceChange = (studentId, field, value) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [field]: value }
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        
        try {
            const attendanceToUpsert = students.map(student => {
                const studentId = student.id;
                const data = attendance[studentId] || {};
                const total = parseInt(data.total_attendance_days);
                const present = parseInt(data.present_days);

                if (data.total_attendance_days && (isNaN(total) || total < 0)) {
                    throw new Error(`Invalid total days for ${student.full_name}.`);
                }
                if (data.present_days && (isNaN(present) || present < 0)) {
                    throw new Error(`Invalid present days for ${student.full_name}.`);
                }
                if (!isNaN(total) && !isNaN(present) && present > total) {
                    throw new Error(`Present days cannot exceed total days for ${student.full_name}.`);
                }

                return {
                    id: data.id,
                    branch_id: user.profile.branch_id,
                    exam_id: exam.id,
                    student_id: studentId,
                    total_attendance_days: data.total_attendance_days || null,
                    present_days: data.present_days || null
                };
            });

            const { error } = await supabase.from('cbse_exam_attendance').upsert(attendanceToUpsert, { onConflict: 'id' });
            if (error) throw error;

            toast({ title: 'Attendance saved successfully!' });
            onClose();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving attendance', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    if (!exam) return null; // Early return if no exam data

    return (
        <div className="space-y-4">
            <div className="max-h-[50vh] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Roll No.</TableHead>
                            <TableHead>Total Attendance Days</TableHead>
                            <TableHead>Present Days</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialLoading ? (
                           <tr><td colSpan={4} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></td></tr>
                        ) : students.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No students assigned to this exam.</td></tr>
                        ) : students.map(student => (
                            <TableRow key={student.id}>
                                <TableCell>{student.full_name}</TableCell>
                                <TableCell>{student.roll_number}</TableCell>
                                <TableCell>
                                    <Input 
                                        type="number" 
                                        value={attendance[student.id]?.total_attendance_days || ''} 
                                        onChange={e => handleAttendanceChange(student.id, 'total_attendance_days', e.target.value)} 
                                        className="w-32" 
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        type="number" 
                                        value={attendance[student.id]?.present_days || ''} 
                                        onChange={e => handleAttendanceChange(student.id, 'present_days', e.target.value)} 
                                        className="w-24" 
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
            </DialogFooter>
        </div>
    );
};

export default ExamAttendance;
