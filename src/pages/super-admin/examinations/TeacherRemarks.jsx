import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const TeacherRemarks = ({ exam, onClose }) => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    const [students, setStudents] = useState([]);
    const [remarks, setRemarks] = useState({});
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const fetchStudentsAndRemarks = useCallback(async () => {
        setInitialLoading(true);
        const [studentsRes, remarksRes] = await Promise.all([
            supabase.from('cbse_exam_students').select('profiles(*, classes(name), sections(name))').eq('exam_id', exam.id),
            supabase.from('cbse_exam_remarks').select('*').eq('exam_id', exam.id)
        ]);

        if (studentsRes.error) toast({ variant: 'destructive', title: 'Error', description: studentsRes.error.message });
        else setStudents(studentsRes.data.map(s => s.profiles));
        
        if (remarksRes.error) toast({ variant: 'destructive', title: 'Error', description: remarksRes.error.message });
        else {
            const remarksData = remarksRes.data.reduce((acc, item) => {
                acc[item.student_id] = { id: item.id, remark: item.remark };
                return acc;
            }, {});
            setRemarks(remarksData);
        }
        setInitialLoading(false);
    }, [exam.id, toast]);

    useEffect(() => { fetchStudentsAndRemarks(); }, [fetchStudentsAndRemarks]);

    const handleRemarkChange = (studentId, value) => {
        setRemarks(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], remark: value }
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        const remarksToUpsert = Object.entries(remarks)
            .filter(([_, data]) => data.remark) // Only save if there's a remark
            .map(([student_id, data]) => ({
                id: data.id,
                branch_id: branchId,
                exam_id: exam.id,
                student_id,
                remark: data.remark,
                session_id: currentSessionId,
                organization_id: organizationId
        }));

        if (remarksToUpsert.length > 0) {
            const { error } = await supabase.from('cbse_exam_remarks').upsert(remarksToUpsert, { onConflict: 'id' });
            if (error) {
                toast({ variant: 'destructive', title: 'Error saving remarks', description: error.message });
            } else {
                toast({ title: 'Remarks saved successfully!' });
                onClose();
            }
        } else {
            toast({ title: 'No remarks to save.' });
            onClose();
        }
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <div className="max-h-[50vh] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Section</TableHead>
                            <TableHead>Remark</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialLoading ? (
                           <tr><td colSpan={4} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></td></tr>
                        ) : students.map(student => (
                            <TableRow key={student.id}>
                                <TableCell>{student.full_name}</TableCell>
                                <TableCell>{student.classes.name}</TableCell>
                                <TableCell>{student.sections.name}</TableCell>
                                <TableCell>
                                    <Input 
                                        value={remarks[student.id]?.remark || ''} 
                                        onChange={e => handleRemarkChange(student.id, e.target.value)} 
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

export default TeacherRemarks;
