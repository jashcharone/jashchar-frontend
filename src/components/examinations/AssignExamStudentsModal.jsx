import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBranch } from '@/contexts/BranchContext';
import { Loader2, Search, Save } from "lucide-react";
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const AssignExamStudentsModal = ({ isOpen, onClose, exam, branchId }) => {
    const { toast } = useToast();
    const { selectedBranch } = useBranch();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    
    const [filters, setFilters] = useState({
        class_id: '',
        section_id: ''
    });

    useEffect(() => {
        if (isOpen && branchId) {
            fetchClasses();
            // Reset state
            setStudents([]);
            setSelectedStudents(new Set());
            setFilters({ class_id: '', section_id: '' });
            if (exam) {
                fetchAlreadyAssignedStudents();
            }
        }
    }, [isOpen, branchId, exam]);

    const fetchClasses = async () => {
        if (!selectedBranch?.id) return;
        const { data } = await supabase
            .from('classes')
            .select('id, name')
            .eq('branch_id', branchId)
            .eq('branch_id', selectedBranch.id);
        setClasses(data || []);
    };

    const fetchSections = async (classId) => {
        const { data } = await supabase.from('class_sections').select('sections(id, name)').eq('class_id', classId);
        setSections(data ? data.map(d => d.sections).filter(Boolean) : []);
    };

    const fetchAlreadyAssignedStudents = async () => {
        const { data, error } = await supabase
            .from('exam_students')
            .select('student_id')
            .eq('exam_id', exam.id);
        
        if (!error && data) {
            const assignedIds = new Set(data.map(d => d.student_id));
            setSelectedStudents(assignedIds);
        }
    };

    const handleClassChange = (val) => {
        setFilters(prev => ({ ...prev, class_id: val, section_id: '' }));
        fetchSections(val);
    };

    const handleSearch = async () => {
        if (!filters.class_id || !filters.section_id) {
            toast({ variant: 'destructive', title: 'Please select Class and Section' });
            return;
        }
        if (!selectedBranch?.id) return;
        setLoading(true);
        
        // Fetch 'student' role ID first
        const { data: roleData } = await supabase.from('roles').select('id').eq('name', 'student').eq('branch_id', branchId).single();
        const studentRoleId = roleData?.id;

        const { data, error } = await supabase
            .from('profiles_legacy')
            .select('id, full_name, school_code, father_name, gender, categories:student_categories(name)')
            .eq('branch_id', branchId)
            .eq('branch_id', selectedBranch.id)
            .eq('class_id', filters.class_id)
            .eq('section_id', filters.section_id)
            .eq('role_id', studentRoleId)
            .order('full_name');

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching students', description: error.message });
        } else {
            setStudents(data || []);
        }
        setLoading(false);
    };

    const toggleStudent = (studentId) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    const toggleAll = () => {
        const allIds = students.map(s => s.id);
        const allSelected = allIds.every(id => selectedStudents.has(id));
        
        const newSelected = new Set(selectedStudents);
        if (allSelected) {
            allIds.forEach(id => newSelected.delete(id));
        } else {
            allIds.forEach(id => newSelected.add(id));
        }
        setSelectedStudents(newSelected);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // We need to handle additions and removals for THIS exam
            // Simplest strategy: 
            // 1. Get all current assignments for this exam
            // 2. Determine what to add and what to remove
            // OR (Simpler for UI): Just upsert selected and delete unselected? No, that might wipe data if user doesn't load all students.
            // The modal currently only searches one class at a time. 
            // Users might want to add students from Class 1A, save, then add from Class 1B.
            // So "Save" should only affect the students currently visible in the search result? 
            // Or should it act as a global assignment manager?
            // Typically in these systems, you search and "Assign".
            
            // Let's implement "Sync visible students":
            // If a student is in the `students` list (search result):
            //    - If checked: Ensure record exists in `exam_students`
            //    - If unchecked: Ensure record does NOT exist in `exam_students`
            
            if (students.length === 0) {
                toast({ title: "No students to save" });
                setSaving(false);
                return;
            }

            const studentsToAdd = [];
            const studentsToRemove = [];

            students.forEach(student => {
                if (selectedStudents.has(student.id)) {
                    studentsToAdd.push({
                        branch_id: branchId,
                        exam_id: exam.id,
                        student_id: student.id
                    });
                } else {
                    studentsToRemove.push(student.id);
                }
            });

            // Perform mutations
            if (studentsToAdd.length > 0) {
                const { error: addError } = await supabase.from('exam_students').upsert(studentsToAdd, { onConflict: 'exam_id, student_id' });
                if (addError) throw addError;
            }

            if (studentsToRemove.length > 0) {
                const { error: removeError } = await supabase
                    .from('exam_students')
                    .delete()
                    .eq('exam_id', exam.id)
                    .in('student_id', studentsToRemove);
                if (removeError) throw removeError;
            }

            toast({ title: 'Students assigned/unassigned successfully' });
            onClose();

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving students', description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const isAllSelected = students.length > 0 && students.every(s => selectedStudents.has(s.id));

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Assign Students to Exam: {exam?.name}</DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-b">
                    <div>
                        <Label>Class <span className="text-red-500">*</span></Label>
                        <Select value={filters.class_id} onValueChange={handleClassChange}>
                            <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                            <SelectContent>
                                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Section <span className="text-red-500">*</span></Label>
                        <Select value={filters.section_id} onValueChange={(v) => setFilters(prev => ({ ...prev, section_id: v }))} disabled={!filters.class_id}>
                            <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                            <SelectContent>
                                {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button onClick={handleSearch} disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />} Search
                        </Button>
                    </div>
                </div>

                <ScrollArea className="flex-1 h-[400px] mt-2">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} />
                                </TableHead>
                                <TableHead>Admission No</TableHead>
                                <TableHead>Student Name</TableHead>
                                <TableHead>Father Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Gender</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        {loading ? 'Loading...' : 'No students found or search not initiated'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                students.map(student => (
                                    <TableRow key={student.id}>
                                        <TableCell>
                                            <Checkbox 
                                                checked={selectedStudents.has(student.id)} 
                                                onCheckedChange={() => toggleStudent(student.id)} 
                                            />
                                        </TableCell>
                                        <TableCell>{student.school_code}</TableCell>
                                        <TableCell className="font-medium">{student.full_name}</TableCell>
                                        <TableCell>{student.father_name}</TableCell>
                                        <TableCell>{student.categories?.name || '-'}</TableCell>
                                        <TableCell>{student.gender}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>

                <DialogFooter className="border-t pt-4">
                    <div className="flex justify-between w-full items-center">
                        <span className="text-sm text-muted-foreground">
                            {selectedStudents.size} students selected
                        </span>
                        <Button onClick={handleSave} disabled={saving || students.length === 0}>
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Assignment
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AssignExamStudentsModal;
