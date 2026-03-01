import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AssignStudents = ({ exam, onClose }) => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const fetchStudents = useCallback(async () => {
        if (!branchId || !exam) return;
        
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, roll_number, classes(name), sections(name)')
            .eq('branch_id', branchId)
            .eq('class_id', exam.class_id)
            .in('section_id', exam.section_ids);

        if (error) {
            toast({ variant: "destructive", title: "Error fetching students", description: error.message });
        } else {
            setStudents(data);
        }
    }, [branchId, exam, toast]);

    const fetchAssignedStudents = useCallback(async () => {
        if (!exam) return;
        const { data, error } = await supabase
            .from('cbse_exam_students')
            .select('student_id')
            .eq('exam_id', exam.id);

        if (error) {
            toast({ variant: "destructive", title: "Error fetching assigned students", description: error.message });
        } else {
            setSelectedStudents(new Set(data.map(s => s.student_id)));
        }
        setInitialLoading(false);
    }, [exam, toast]);

    useEffect(() => {
        setInitialLoading(true);
        Promise.all([fetchStudents(), fetchAssignedStudents()]);
    }, [fetchStudents, fetchAssignedStudents]);

    const handleSelectStudent = (studentId) => {
        setSelectedStudents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedStudents(new Set(students.map(s => s.id)));
        } else {
            setSelectedStudents(new Set());
        }
    };

    const handleSave = async () => {
        setLoading(true);
        
        const { error: deleteError } = await supabase
            .from('cbse_exam_students')
            .delete()
            .eq('exam_id', exam.id);

        if (deleteError) {
            toast({ variant: "destructive", title: "Error updating assignments", description: deleteError.message });
            setLoading(false);
            return;
        }

        const assignments = Array.from(selectedStudents).map(student_id => ({
            branch_id: branchId,
            exam_id: exam.id,
            student_id: student_id,
            session_id: currentSessionId,
            organization_id: organizationId
        }));

        if (assignments.length > 0) {
            const { error: insertError } = await supabase
                .from('cbse_exam_students')
                .insert(assignments);

            if (insertError) {
                toast({ variant: "destructive", title: "Error saving assignments", description: insertError.message });
            } else {
                toast({ title: "Student assignments saved successfully!" });
                onClose();
            }
        } else {
            toast({ title: "All students unassigned successfully." });
            onClose();
        }

        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Students for {exam.classes.name} (Sections: {exam.section_names.join(', ')})</CardTitle>
                </CardHeader>
                <CardContent>
                    {initialLoading ? (
                        <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="max-h-[50vh] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            onCheckedChange={handleSelectAll}
                                            checked={students.length > 0 && selectedStudents.size === students.length}
                                            aria-label="Select all students"
                                        />
                                    </TableHead>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Roll No.</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Section</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map(student => (
                                    <TableRow key={student.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedStudents.has(student.id)}
                                                onCheckedChange={() => handleSelectStudent(student.id)}
                                                aria-labelledby={`student-name-${student.id}`}
                                            />
                                        </TableCell>
                                        <TableCell id={`student-name-${student.id}`}>{student.full_name}</TableCell>
                                        <TableCell>{student.roll_number}</TableCell>
                                        <TableCell>{student.classes.name}</TableCell>
                                        <TableCell>{student.sections.name}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                </Button>
            </DialogFooter>
        </div>
    );
};

export default AssignStudents;
