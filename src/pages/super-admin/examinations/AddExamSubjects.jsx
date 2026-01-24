import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { DialogFooter } from '@/components/ui/dialog';
import { v4 as uuidv4 } from 'uuid';
import DatePicker from '@/components/ui/DatePicker';

const AddExamSubjects = ({ exam, onClose }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [subjects, setSubjects] = useState([]);
    const [examSubjects, setExamSubjects] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchSchoolSubjects = useCallback(async () => {
        const { data, error } = await supabase.from('subjects').select('id, name').eq('branch_id', user.profile.branch_id);
        if (error) toast({ variant: 'destructive', title: 'Error fetching subjects', description: error.message });
        else setSubjects(data);
    }, [user, toast]);

    const fetchExamSubjects = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('cbse_exam_subjects').select('*, subjects(name)').eq('exam_id', exam.id);
        if (error) toast({ variant: 'destructive', title: 'Error fetching exam subjects', description: error.message });
        else setExamSubjects(data.map(s => ({ ...s, key: s.id })));
        setLoading(false);
    }, [exam, toast]);

    useEffect(() => {
        fetchSchoolSubjects();
        fetchExamSubjects();
    }, [fetchSchoolSubjects, fetchExamSubjects]);

    const handleAddSubject = () => {
        setExamSubjects(prev => [...prev, {
            key: uuidv4(),
            subject_id: '',
            exam_date: new Date(),
            start_time: '',
            duration_minutes: '',
            max_marks_theory: '',
            max_marks_practical: '',
            max_marks_assignment: '',
            room_number: ''
        }]);
    };

    const handleSubjectChange = (index, field, value) => {
        const newSubjects = [...examSubjects];
        newSubjects[index][field] = value;
        setExamSubjects(newSubjects);
    };

    const handleRemoveSubject = async (index, subjectId) => {
        if (subjectId && typeof subjectId !== 'string' && !subjectId.includes('-')) { // If it's a persisted subject
            const { error } = await supabase.from('cbse_exam_subjects').delete().eq('id', subjectId);
            if (error) {
                toast({ variant: 'destructive', title: 'Error deleting subject', description: error.message });
                return;
            }
        }
        setExamSubjects(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setLoading(true);

        for (const s of examSubjects) {
            if (!s.subject_id || !s.exam_date || !s.start_time || !s.duration_minutes) {
                toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill all required fields for each subject.' });
                setLoading(false);
                return;
            }
        }

        const subjectsToUpsert = examSubjects.map(s => {
            const { key, subjects, ...rest } = s; // remove frontend-only `key` and nested `subjects`
            return {
                ...rest,
                exam_id: exam.id,
                branch_id: user.profile.branch_id,
            };
        });

        const { error } = await supabase.from('cbse_exam_subjects').upsert(subjectsToUpsert, { onConflict: 'id' });

        if (error) {
            toast({ variant: 'destructive', title: 'Error saving subjects', description: error.message });
        } else {
            toast({ title: 'Exam subjects saved successfully!' });
            onClose();
        }
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {examSubjects.map((subject, index) => (
                    <div key={subject.key} className="p-4 border rounded-lg space-y-3 relative">
                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => handleRemoveSubject(index, subject.id)}><Trash2 className="h-4 w-4" /></Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <Label>Subject *</Label>
                                <Select value={subject.subject_id} onValueChange={val => handleSubjectChange(index, 'subject_id', val)}>
                                    <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                                    <SelectContent>
                                        {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DatePicker label="Exam Date *" date={subject.exam_date ? new Date(subject.exam_date) : null} setDate={date => handleSubjectChange(index, 'exam_date', date)} />
                            <div><Label>Start Time *</Label><Input type="time" value={subject.start_time} onChange={e => handleSubjectChange(index, 'start_time', e.target.value)} required/></div>
                            <div><Label>Duration (Mins) *</Label><Input type="number" value={subject.duration_minutes} onChange={e => handleSubjectChange(index, 'duration_minutes', e.target.value)} required/></div>
                            <div><Label>Max Theory Marks</Label><Input type="number" value={subject.max_marks_theory || ''} onChange={e => handleSubjectChange(index, 'max_marks_theory', e.target.value)} /></div>
                            <div><Label>Max Practical Marks</Label><Input type="number" value={subject.max_marks_practical || ''} onChange={e => handleSubjectChange(index, 'max_marks_practical', e.target.value)} /></div>
                            <div><Label>Max Assignment Marks</Label><Input type="number" value={subject.max_marks_assignment || ''} onChange={e => handleSubjectChange(index, 'max_marks_assignment', e.target.value)} /></div>
                            <div><Label>Room Number</Label><Input value={subject.room_number || ''} onChange={e => handleSubjectChange(index, 'room_number', e.target.value)} /></div>
                        </div>
                    </div>
                ))}
            </div>
            <Button variant="outline" onClick={handleAddSubject}><Plus className="mr-2 h-4 w-4" /> Add Subject</Button>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
            </DialogFooter>
        </div>
    );
};

export default AddExamSubjects;
