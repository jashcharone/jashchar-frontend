import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useBranch } from '@/contexts/BranchContext';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const AddExamSubjectsModal = ({ isOpen, onClose, exam, branchId }) => {
    const { toast } = useToast();
    const { selectedBranch } = useBranch();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [schoolSubjects, setSchoolSubjects] = useState([]);
    const [rows, setRows] = useState([]);

    useEffect(() => {
        if (isOpen && exam && branchId) {
            fetchInitialData();
        }
    }, [isOpen, exam, branchId]);

    const fetchInitialData = async () => {
        if (!selectedBranch?.id) return;
        setLoading(true);
        try {
            const [subRes, examSubRes] = await Promise.all([
                supabase.from('subjects').select('id, name, code').eq('branch_id', branchId).eq('branch_id', selectedBranch.id),
                supabase.from('exam_subjects').select('*').eq('exam_id', exam.id)
            ]);

            if (subRes.error) throw subRes.error;
            if (examSubRes.error) throw examSubRes.error;

            setSchoolSubjects(subRes.data || []);
            
            if (examSubRes.data && examSubRes.data.length > 0) {
                setRows(examSubRes.data);
            } else {
                setRows([]); // Start empty or add one default row
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error loading data', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const addRow = () => {
        setRows([...rows, {
            id: `new-${Date.now()}`,
            subject_id: '',
            date: '',
            time: '',
            duration: '',
            credit_hours: '',
            room_no: '',
            max_marks: '100',
            min_marks: '33'
        }]);
    };

    const removeRow = async (index) => {
        const row = rows[index];
        if (row.id && !row.id.toString().startsWith('new-')) {
            // It's an existing record, confirm deletion logic if needed, or just delete on save?
            // Usually better to delete immediately from DB or mark for deletion.
            // For simplicity, we'll just remove from UI and handle diff on save or delete immediately.
            // Let's delete immediately for better UX consistency with "Remove" buttons usually.
            const { error } = await supabase.from('exam_subjects').delete().eq('id', row.id);
            if (error) {
                toast({ variant: 'destructive', title: 'Error removing subject', description: error.message });
                return;
            }
        }
        const newRows = [...rows];
        newRows.splice(index, 1);
        setRows(newRows);
    };

    const handleChange = (index, field, value) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Validate
            const validRows = rows.filter(r => r.subject_id && r.date && r.max_marks);
            if (validRows.length !== rows.length) {
                throw new Error("Please fill required fields (Subject, Date, Max Marks) for all rows.");
            }

            const upsertData = validRows.map(r => ({
                id: r.id.toString().startsWith('new-') ? undefined : r.id,
                exam_id: exam.id,
                subject_id: r.subject_id,
                date: r.date,
                time: r.time || null,
                duration: r.duration || null,
                credit_hours: r.credit_hours || null,
                room_no: r.room_no || null,
                max_marks: r.max_marks,
                min_marks: r.min_marks
            }));

            if (upsertData.length > 0) {
                const { error } = await supabase.from('exam_subjects').upsert(upsertData);
                if (error) throw error;
            }

            toast({ title: 'Exam subjects saved successfully' });
            onClose();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving subjects', description: error.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Add Exam Subjects: {exam?.name}</DialogTitle>
                </DialogHeader>
                
                <div className="flex justify-end mb-2">
                    <Button onClick={addRow} size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" /> Add Exam Subject
                    </Button>
                </div>

                <ScrollArea className="flex-1 border rounded-md p-2">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-12 gap-2 font-medium text-sm text-muted-foreground px-2">
                                <div className="col-span-2">Subject *</div>
                                <div className="col-span-2">Date *</div>
                                <div className="col-span-1">Time</div>
                                <div className="col-span-1">Duration (m)</div>
                                <div className="col-span-1">Credit Hrs</div>
                                <div className="col-span-1">Room No</div>
                                <div className="col-span-1">Max Marks *</div>
                                <div className="col-span-1">Min Marks</div>
                                <div className="col-span-1">Action</div>
                            </div>
                            
                            {rows.map((row, index) => (
                                <div key={row.id} className="grid grid-cols-12 gap-2 items-center px-2 py-1 bg-slate-50/50 rounded hover:bg-slate-50">
                                    <div className="col-span-2">
                                        <Select value={row.subject_id} onValueChange={(v) => handleChange(index, 'subject_id', v)}>
                                            <SelectTrigger className="h-8"><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>
                                                {schoolSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2">
                                        <Input type="date" className="h-8" value={row.date} onChange={(e) => handleChange(index, 'date', e.target.value)} />
                                    </div>
                                    <div className="col-span-1">
                                        <Input type="time" className="h-8" value={row.time} onChange={(e) => handleChange(index, 'time', e.target.value)} />
                                    </div>
                                    <div className="col-span-1">
                                        <Input type="number" className="h-8" value={row.duration} onChange={(e) => handleChange(index, 'duration', e.target.value)} />
                                    </div>
                                    <div className="col-span-1">
                                        <Input type="number" className="h-8" value={row.credit_hours} onChange={(e) => handleChange(index, 'credit_hours', e.target.value)} />
                                    </div>
                                    <div className="col-span-1">
                                        <Input className="h-8" value={row.room_no} onChange={(e) => handleChange(index, 'room_no', e.target.value)} />
                                    </div>
                                    <div className="col-span-1">
                                        <Input type="number" className="h-8" value={row.max_marks} onChange={(e) => handleChange(index, 'max_marks', e.target.value)} />
                                    </div>
                                    <div className="col-span-1">
                                        <Input type="number" className="h-8" value={row.min_marks} onChange={(e) => handleChange(index, 'min_marks', e.target.value)} />
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeRow(index)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {rows.length === 0 && <div className="text-center py-8 text-muted-foreground">No subjects added yet.</div>}
                        </div>
                    )}
                </ScrollArea>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AddExamSubjectsModal;
