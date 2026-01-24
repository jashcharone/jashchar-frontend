import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Plus, Trash2, Save, Loader2 } from 'lucide-react';

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ClassTimetable = () => {
    const { toast } = useToast();
    const { user, school } = useAuth();
    const { selectedBranch } = useBranch();
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [subjectGroups, setSubjectGroups] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    
    const [filters, setFilters] = useState({ class_id: '', section_id: '', subject_group_id: '' });
    const [timetable, setTimetable] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Prefer live school context, then user metadata, then profile
    const branchId = school?.id || user?.user_metadata?.branch_id || user?.profile?.branch_id;

    useEffect(() => {
        if (!branchId) return;
        const fetchPrereqs = async () => {
            try {
                const headers = { 'x-school-id': branchId };
                if (selectedBranch?.id) headers['x-branch-id'] = selectedBranch.id;

                // Always fetch classes (branch optional). Others only when branch is known.
                const classesPromise = api.get('/academics/classes', {
                    params: { branchId, branchId: selectedBranch?.id },
                    headers
                });

                const [classesRes, subjectGroupsRes, teachersRes] = await Promise.all([
                    classesPromise,
                    selectedBranch?.id
                        ? api.get('/academics/subject-groups', { params: { branchId, branchId: selectedBranch.id }, headers })
                        : Promise.resolve({ data: [] }),
                    selectedBranch?.id
                        ? api.get('/academics/teacher-timetable/teachers', { params: { branchId, branchId: selectedBranch.id }, headers })
                        : Promise.resolve({ data: [] })
                ]);

                setClasses(classesRes.data || []);
                setSubjectGroups(subjectGroupsRes.data || []);
                setTeachers(teachersRes.data || []);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Failed to load timetable data', description: error.response?.data?.message || error.message });
                setClasses([]);
                setSubjectGroups([]);
                setTeachers([]);
            }
        };
        fetchPrereqs();
    }, [branchId, selectedBranch?.id]);

    useEffect(() => {
        if (filters.class_id) {
            const fetchSections = async () => {
                try {
                    const headers = { 'x-school-id': branchId };
                    if (selectedBranch?.id) headers['x-branch-id'] = selectedBranch.id;

                    // First, try sections linked to the selected class
                    const primary = await api.get('/academics/sections', {
                        params: { classId: filters.class_id, branchId: selectedBranch?.id },
                        headers
                    });

                    let mapped = (primary.data || []).map((row) => row.sections || row).filter(Boolean);

                    // Fallback: if none linked, load all sections for the school (optionally filtered by branch)
                    if (mapped.length === 0 && branchId) {
                        const fallback = await api.get('/academics/sections', {
                            params: { branchId, branchId: selectedBranch?.id },
                            headers
                        });
                        mapped = (fallback.data || []).map((row) => row.sections || row).filter(Boolean);
                    }

                    setSections(mapped);
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Failed to load sections', description: error.response?.data?.message || error.message });
                    setSections([]);
                }
            };
            fetchSections();
        } else {
            setSections([]);
        }
    }, [filters.class_id, branchId, selectedBranch?.id]);

    useEffect(() => {
        if (filters.subject_group_id) {
            const fetchSubjects = async () => {
                try {
                    // Reuse already fetched subject groups
                    const selectedGroup = subjectGroups.find((sg) => sg.id === filters.subject_group_id);
                    const subjectIds = selectedGroup?.subject_ids || [];
                    if (subjectIds.length === 0) {
                        setSubjects([]);
                        return;
                    }

                    const { data } = await api.get('/academics/subjects', {
                        params: { branchId: branchId, branchId: selectedBranch?.id },
                        headers: { 'x-school-id': branchId, 'x-branch-id': selectedBranch?.id }
                    });
                    setSubjects((data || []).filter((s) => subjectIds.includes(s.id)));
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Failed to load subjects', description: error.response?.data?.message || error.message });
                    setSubjects([]);
                }
            };
            fetchSubjects();
        } else {
            setSubjects([]);
        }
    }, [filters.subject_group_id]);

    const handleSearch = async () => {
        if (!filters.class_id || !filters.section_id) {
            toast({ variant: 'destructive', title: 'Please select Class and Section.' });
            return;
        }
        setLoading(true);
        setIsEditing(true);
        try {
            const { data } = await api.get('/academics/class-timetable', {
                params: { classId: filters.class_id, sectionId: filters.section_id, branchId: selectedBranch?.id },
                headers: { 'x-school-id': branchId, 'x-branch-id': selectedBranch?.id }
            });

            const reverseDayMap = { "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 7 };
            const intToName = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' };

            if (data && data.length > 0) {
                const normalized = data.map((entry) => ({
                    ...entry,
                    day_of_week: intToName[entry.day_of_week] || entry.day_of_week
                }));

                const mappedData = [];
                daysOfWeek.forEach((dayName) => {
                    const dayInt = reverseDayMap[dayName];
                    const existing = normalized.filter((d) => d.day_of_week === dayName || d.day_of_week === dayInt);
                    if (existing.length > 0) {
                        mappedData.push(...existing.map((e) => ({ ...e, day_of_week: dayName })));
                    } else {
                        mappedData.push({ id: `new-${dayName}-${Math.random()}`, day_of_week: dayName, subject_id: '', teacher_id: '', start_time: '', end_time: '', room_no: '' });
                    }
                });
                setTimetable(mappedData);
            } else {
                const newTimetable = daysOfWeek.map(day => ({ id: `new-${day}-${Math.random()}`, day_of_week: day, subject_id: '', teacher_id: '', start_time: '', end_time: '', room_no: '' }));
                setTimetable(newTimetable);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching timetable', description: error.response?.data?.message || error.message });
            setTimetable([]);
        }

        setLoading(false);
    };

    const handleTimetableChange = (id, field, value) => {
        setTimetable(prev => prev.map(entry => entry.id === id ? { ...entry, [field]: value } : entry));
    };

    const addRow = (day) => {
        setTimetable(prev => [...prev, { id: `new-${day}-${Math.random()}`, day_of_week: day, subject_id: '', teacher_id: '', start_time: '', end_time: '', room_no: '' }]);
    };

    const removeRow = (id) => {
        setTimetable(prev => prev.filter(entry => entry.id !== id));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const payload = {
            class_id: filters.class_id,
            section_id: filters.section_id,
            branch_id: branchId,
            branch_id: selectedBranch?.id,
            entries: timetable
        };

        try {
            await api.post('/academics/class-timetable', payload, {
                params: { branchId: selectedBranch?.id },
                headers: { 'x-school-id': branchId, 'x-branch-id': selectedBranch?.id }
            });
            toast({ title: 'Timetable saved successfully!' });
            handleSearch();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving timetable', description: error.response?.data?.message || error.message });
        }
        setIsSaving(false);
    };

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-6">Class Timetable</h1>
            <div className="bg-card p-6 rounded-xl shadow-lg mb-6 border">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div><Label>Class *</Label><Select value={filters.class_id} onValueChange={v => setFilters(p => ({...p, class_id: v}))}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Section *</Label><Select value={filters.section_id} onValueChange={v => setFilters(p => ({...p, section_id: v}))} disabled={!filters.class_id}><SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger><SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Subject Group</Label><Select value={filters.subject_group_id} onValueChange={v => setFilters(p => ({...p, subject_group_id: v}))}><SelectTrigger><SelectValue placeholder="Select Group" /></SelectTrigger><SelectContent>{subjectGroups.map(sg => <SelectItem key={sg.id} value={sg.id}>{sg.name}</SelectItem>)}</SelectContent></Select></div>
                    <Button onClick={handleSearch} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Search />} Search</Button>
                </div>
            </div>

            {isEditing && (
                <div className="bg-card p-6 rounded-xl shadow-lg border">
                    {daysOfWeek.map(day => (
                        <div key={day} className="mb-8">
                            <div className="flex justify-between items-center mb-2 border-b pb-2">
                                <h3 className="text-lg font-semibold text-primary">{day}</h3>
                                <Button variant="outline" size="sm" onClick={() => addRow(day)}><Plus className="mr-2 h-4 w-4" /> Add Period</Button>
                            </div>
                            <div className="space-y-2">
                                {timetable.filter(entry => entry.day_of_week === day).map((entry, index) => (
                                    <div key={entry.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-muted/20 p-2 rounded-md">
                                        <div className="md:col-span-3">
                                            <Select value={entry.subject_id} onValueChange={v => handleTimetableChange(entry.id, 'subject_id', v)}>
                                                <SelectTrigger className="h-8"><SelectValue placeholder="Subject"/></SelectTrigger>
                                                <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="md:col-span-3">
                                            <Select value={entry.teacher_id} onValueChange={v => handleTimetableChange(entry.id, 'teacher_id', v)}>
                                                <SelectTrigger className="h-8"><SelectValue placeholder="Teacher"/></SelectTrigger>
                                                <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <Input type="time" className="h-8" value={entry.start_time} onChange={e => handleTimetableChange(entry.id, 'start_time', e.target.value)} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Input type="time" className="h-8" value={entry.end_time} onChange={e => handleTimetableChange(entry.id, 'end_time', e.target.value)} />
                                        </div>
                                        <div className="md:col-span-1">
                                            <Input placeholder="Room" className="h-8" value={entry.room_no} onChange={e => handleTimetableChange(entry.id, 'room_no', e.target.value)} />
                                        </div>
                                        <div className="md:col-span-1 text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeRow(entry.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </div>
                                    </div>
                                ))}
                                {timetable.filter(entry => entry.day_of_week === day).length === 0 && (
                                    <p className="text-sm text-muted-foreground italic">No classes scheduled for {day}</p>
                                )}
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-end mt-6 pt-4 border-t">
                        <Button onClick={handleSave} disabled={isSaving} size="lg">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                            Save Timetable
                        </Button>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default ClassTimetable;
