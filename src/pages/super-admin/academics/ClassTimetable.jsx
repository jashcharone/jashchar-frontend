import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Search, Plus, Trash2, Save, Loader2, Clock, Eye, Pencil } from 'lucide-react';

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };
const INT_TO_DAY = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' };

/* ── time helpers ── */
const addMinutes = (timeStr, mins) => {
    const [h, m] = timeStr.split(':').map(Number);
    const total = h * 60 + m + mins;
    const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
    const mm = String(total % 60).padStart(2, '0');
    return `${hh}:${mm}`;
};
const formatTime12 = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
};

const ClassTimetable = () => {
    const { toast } = useToast();
    const { user, school } = useAuth();
    const { selectedBranch } = useBranch();
    const branchId = selectedBranch?.id;

    /* ── master data ── */
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [subjectGroups, setSubjectGroups] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);

    /* ── filters ── */
    const [filters, setFilters] = useState({ class_id: '', section_id: '', subject_group_id: '' });

    /* ── timetable state (keyed by day) ── */
    const [timetable, setTimetable] = useState({}); // { Monday: [{...}], Tuesday: [{...}], ... }
    const [activeDay, setActiveDay] = useState('Monday');

    /* ── modes & loading ── */
    const [mode, setMode] = useState('idle');     // idle | edit | view
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    /* ── quick generate ── */
    const [quickGen, setQuickGen] = useState({ start_time: '08:00', duration: 45, interval: 10, room_no: '' });

    /* ── delete confirmation ── */
    const [deleteTarget, setDeleteTarget] = useState(null); // { day, id }

    /* ── lookup maps ── */
    const subjectMap = useMemo(() => Object.fromEntries(subjects.map(s => [s.id, s.name])), [subjects]);
    const teacherMap = useMemo(() => Object.fromEntries(teachers.map(t => [t.id, t.full_name])), [teachers]);

    /* ═══════ DATA FETCH ═══════ */
    useEffect(() => {
        if (!branchId) return;
        const headers = { 'x-school-id': branchId, 'x-branch-id': branchId };
        Promise.all([
            api.get('/academics/classes', { params: { branchId }, headers }),
            api.get('/academics/subject-groups', { params: { branchId }, headers }),
            api.get('/academics/teacher-timetable/teachers', { params: { branchId }, headers })
        ]).then(([cRes, sgRes, tRes]) => {
            setClasses(cRes.data || []);
            setSubjectGroups(sgRes.data || []);
            setTeachers(tRes.data || []);
        }).catch(err => {
            toast({ variant: 'destructive', title: 'Failed to load data', description: err.message });
        });
    }, [branchId]);

    /* ── fetch sections when class changes ── */
    useEffect(() => {
        if (!filters.class_id || !branchId) { setSections([]); return; }
        const headers = { 'x-school-id': branchId, 'x-branch-id': branchId };
        api.get('/academics/sections', { params: { classId: filters.class_id, branchId }, headers })
            .then(res => {
                let mapped = (res.data || []).map(r => r.sections || r).filter(Boolean);
                if (mapped.length === 0) {
                    return api.get('/academics/sections', { params: { branchId }, headers })
                        .then(fb => setSections((fb.data || []).map(r => r.sections || r).filter(Boolean)));
                }
                setSections(mapped);
            })
            .catch(() => setSections([]));
    }, [filters.class_id, branchId]);

    /* ── fetch subjects when subject group changes ── */
    useEffect(() => {
        if (!filters.subject_group_id || !branchId) { setSubjects([]); return; }
        const grp = subjectGroups.find(sg => sg.id === filters.subject_group_id);
        const ids = grp?.subject_ids || [];
        if (!ids.length) { setSubjects([]); return; }
        const headers = { 'x-school-id': branchId, 'x-branch-id': branchId };
        api.get('/academics/subjects', { params: { branchId }, headers })
            .then(res => setSubjects((res.data || []).filter(s => ids.includes(s.id))))
            .catch(() => setSubjects([]));
    }, [filters.subject_group_id, branchId, subjectGroups]);

    /* ═══════ HANDLERS ═══════ */
    const emptyRow = (day) => ({
        _id: `new-${Date.now()}-${Math.random()}`,
        day_of_week: day,
        subject_id: '', teacher_id: '', start_time: '', end_time: '', room_no: ''
    });

    const buildDayMap = (entries) => {
        const map = {};
        DAYS.forEach(d => { map[d] = []; });
        entries.forEach(e => {
            const dayName = INT_TO_DAY[e.day_of_week] || e.day_of_week;
            if (map[dayName]) map[dayName].push({ ...e, day_of_week: dayName, _id: e.id || `existing-${Math.random()}` });
        });
        // Ensure every day has at least one empty row in edit mode
        DAYS.forEach(d => { if (map[d].length === 0) map[d].push(emptyRow(d)); });
        return map;
    };

    /* ── Search (loads view mode) ── */
    const handleSearch = async () => {
        if (!filters.class_id || !filters.section_id) {
            toast({ variant: 'destructive', title: 'Please select Class and Section.' });
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.get('/academics/class-timetable', {
                params: { classId: filters.class_id, sectionId: filters.section_id, branchId },
                headers: { 'x-school-id': branchId, 'x-branch-id': branchId }
            });
            const map = buildDayMap(data || []);
            setTimetable(map);
            const hasData = (data || []).length > 0;
            setMode(hasData ? 'view' : 'edit');
            setActiveDay('Monday');
        } catch (err) {
            toast({ variant: 'destructive', title: 'Error fetching timetable', description: err.message });
        }
        setLoading(false);
    };

    /* ── Add button → opens edit mode with empty rows ── */
    const handleAdd = () => {
        if (!filters.class_id || !filters.section_id) {
            toast({ variant: 'destructive', title: 'Please select Class and Section first.' });
            return;
        }
        const map = {};
        DAYS.forEach(d => { map[d] = [emptyRow(d)]; });
        setTimetable(map);
        setMode('edit');
        setActiveDay('Monday');
    };

    /* ── Quick Generate: auto-fills time slots for current day ── */
    const handleQuickGenerate = () => {
        const { start_time, duration, interval, room_no } = quickGen;
        if (!start_time || !duration) {
            toast({ variant: 'destructive', title: 'Fill Period Start Time and Duration.' });
            return;
        }
        const dayEntries = timetable[activeDay] || [];
        // Count of existing real entries (with at least a time)
        const existingCount = dayEntries.filter(e => e.start_time).length;
        // Generate 8 periods by default if empty, else add to existing
        const count = existingCount > 0 ? 1 : 8;
        const newEntries = [];
        let currentStart = existingCount === 0 ? start_time : addMinutes(
            dayEntries[dayEntries.length - 1]?.end_time || start_time, parseInt(interval) || 0
        );

        for (let i = 0; i < count; i++) {
            const endTime = addMinutes(currentStart, parseInt(duration));
            newEntries.push({
                _id: `gen-${Date.now()}-${i}-${Math.random()}`,
                day_of_week: activeDay,
                subject_id: '', teacher_id: '',
                start_time: currentStart,
                end_time: endTime,
                room_no: room_no || ''
            });
            currentStart = addMinutes(endTime, parseInt(interval) || 0);
        }

        setTimetable(prev => ({
            ...prev,
            [activeDay]: existingCount === 0
                ? newEntries
                : [...prev[activeDay].filter(e => e.start_time), ...newEntries]
        }));
        toast({ title: `${newEntries.length} periods generated for ${activeDay}` });
    };

    /* ── Row manipulation ── */
    const addRowToDay = (day) => {
        setTimetable(prev => ({ ...prev, [day]: [...(prev[day] || []), emptyRow(day)] }));
    };

    const handleFieldChange = (day, _id, field, value) => {
        setTimetable(prev => ({
            ...prev,
            [day]: prev[day].map(e => e._id === _id ? { ...e, [field]: value } : e)
        }));
    };

    const confirmDelete = (day, _id) => {
        setDeleteTarget({ day, _id });
    };

    const executeDelete = () => {
        if (!deleteTarget) return;
        const { day, _id } = deleteTarget;
        setTimetable(prev => {
            const filtered = prev[day].filter(e => e._id !== _id);
            return { ...prev, [day]: filtered.length === 0 ? [emptyRow(day)] : filtered };
        });
        setDeleteTarget(null);
    };

    /* ── Save ── */
    const handleSave = async () => {
        setIsSaving(true);
        const allEntries = DAYS.flatMap(d => (timetable[d] || []).map(e => ({ ...e, day_of_week: d })));
        try {
            await api.post('/academics/class-timetable', {
                class_id: filters.class_id,
                section_id: filters.section_id,
                branch_id: branchId,
                entries: allEntries
            }, {
                params: { branchId },
                headers: { 'x-school-id': branchId, 'x-branch-id': branchId }
            });
            toast({ title: 'Timetable saved successfully!' });
            handleSearch(); // reload into view mode
        } catch (err) {
            toast({ variant: 'destructive', title: 'Error saving', description: err.message });
        }
        setIsSaving(false);
    };

    /* ── Switch to edit from view ── */
    const switchToEdit = () => setMode('edit');

    /* ═══════ Computed: get max periods across all days for view grid ═══════ */
    const maxPeriods = useMemo(() => {
        return Math.max(1, ...DAYS.map(d => (timetable[d] || []).filter(e => e.subject_id).length));
    }, [timetable]);

    /* ═══════ RENDER ═══════ */
    const selectedClassName = classes.find(c => c.id === filters.class_id)?.name || '';
    const selectedSectionName = sections.find(s => s.id === filters.section_id)?.name || '';

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Class Timetable</h1>
                {mode !== 'idle' && (
                    <div className="flex gap-2">
                        {mode === 'view' && (
                            <Button onClick={switchToEdit} variant="outline" size="sm">
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Button>
                        )}
                        {mode === 'edit' && (
                            <Button onClick={handleSearch} variant="outline" size="sm">
                                <Eye className="mr-2 h-4 w-4" /> View
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* ═══════ SELECT CRITERIA ═══════ */}
            <div className="bg-card p-5 rounded-xl shadow border mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <Label>Class <span className="text-red-500">*</span></Label>
                        <Select value={filters.class_id} onValueChange={v => setFilters(p => ({ ...p, class_id: v, section_id: '' }))}>
                            <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                            <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Section <span className="text-red-500">*</span></Label>
                        <Select value={filters.section_id} onValueChange={v => setFilters(p => ({ ...p, section_id: v }))} disabled={!filters.class_id}>
                            <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                            <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Subject Group</Label>
                        <Select value={filters.subject_group_id} onValueChange={v => setFilters(p => ({ ...p, subject_group_id: v }))}>
                            <SelectTrigger><SelectValue placeholder="Select Group" /></SelectTrigger>
                            <SelectContent>{subjectGroups.map(sg => <SelectItem key={sg.id} value={sg.id}>{sg.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleSearch} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Search
                    </Button>
                    <Button onClick={handleAdd} className="bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="mr-2 h-4 w-4" /> Add
                    </Button>
                </div>
            </div>

            {/* ═══════ EDIT MODE ═══════ */}
            {mode === 'edit' && (
                <>
                    {/* Quick Generate */}
                    <div className="bg-card p-5 rounded-xl shadow border mb-4">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            <Clock className="inline mr-2 h-4 w-4" />Quick Generate
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                            <div>
                                <Label>Period Start Time</Label>
                                <Input type="time" value={quickGen.start_time}
                                    onChange={e => setQuickGen(p => ({ ...p, start_time: e.target.value }))} />
                            </div>
                            <div>
                                <Label>Duration (Minutes)</Label>
                                <Input type="number" min="1" value={quickGen.duration}
                                    onChange={e => setQuickGen(p => ({ ...p, duration: e.target.value }))} />
                            </div>
                            <div>
                                <Label>Interval (Minutes)</Label>
                                <Input type="number" min="0" value={quickGen.interval}
                                    onChange={e => setQuickGen(p => ({ ...p, interval: e.target.value }))} />
                            </div>
                            <div>
                                <Label>Room No.</Label>
                                <Input placeholder="Room" value={quickGen.room_no}
                                    onChange={e => setQuickGen(p => ({ ...p, room_no: e.target.value }))} />
                            </div>
                            <Button onClick={handleQuickGenerate} className="bg-purple-600 hover:bg-purple-700 text-white">
                                Apply
                            </Button>
                        </div>
                    </div>

                    {/* Day Tabs */}
                    <div className="bg-card rounded-xl shadow border overflow-hidden">
                        <div className="flex border-b overflow-x-auto">
                            {DAYS.map(day => (
                                <button key={day}
                                    onClick={() => setActiveDay(day)}
                                    className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors
                                        ${activeDay === day
                                            ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                                            : 'text-muted-foreground hover:bg-muted/50'
                                        }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>

                        <div className="p-5">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">{activeDay}</h3>
                                <Button variant="outline" size="sm" onClick={() => addRowToDay(activeDay)}>
                                    <Plus className="mr-1 h-4 w-4" /> Add New
                                </Button>
                            </div>

                            {/* Table header */}
                            <div className="hidden md:grid md:grid-cols-12 gap-2 mb-2 text-xs font-semibold text-muted-foreground uppercase">
                                <div className="col-span-3">Subject</div>
                                <div className="col-span-2">Time From</div>
                                <div className="col-span-2">Time To</div>
                                <div className="col-span-3">Teacher</div>
                                <div className="col-span-1">Room No.</div>
                                <div className="col-span-1 text-center">Action</div>
                            </div>

                            {/* Rows */}
                            <div className="space-y-2">
                                {(timetable[activeDay] || []).map((entry) => (
                                    <div key={entry._id}
                                        className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-muted/30 p-2 rounded-md border">
                                        {/* Subject */}
                                        <div className="md:col-span-3">
                                            <Select value={entry.subject_id} onValueChange={v => handleFieldChange(activeDay, entry._id, 'subject_id', v)}>
                                                <SelectTrigger className="h-9"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                                                <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        {/* Time From */}
                                        <div className="md:col-span-2">
                                            <Input type="time" className="h-9" value={entry.start_time || ''}
                                                onChange={e => handleFieldChange(activeDay, entry._id, 'start_time', e.target.value)} />
                                        </div>
                                        {/* Time To */}
                                        <div className="md:col-span-2">
                                            <Input type="time" className="h-9" value={entry.end_time || ''}
                                                onChange={e => handleFieldChange(activeDay, entry._id, 'end_time', e.target.value)} />
                                        </div>
                                        {/* Teacher */}
                                        <div className="md:col-span-3">
                                            <Select value={entry.teacher_id} onValueChange={v => handleFieldChange(activeDay, entry._id, 'teacher_id', v)}>
                                                <SelectTrigger className="h-9"><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                                                <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        {/* Room */}
                                        <div className="md:col-span-1">
                                            <Input placeholder="Room" className="h-9" value={entry.room_no || ''}
                                                onChange={e => handleFieldChange(activeDay, entry._id, 'room_no', e.target.value)} />
                                        </div>
                                        {/* Delete */}
                                        <div className="md:col-span-1 flex justify-center">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => confirmDelete(activeDay, entry._id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end p-5 border-t">
                            <Button onClick={handleSave} disabled={isSaving}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* ═══════ VIEW MODE - Weekly Grid ═══════ */}
            {mode === 'view' && (
                <div className="bg-card rounded-xl shadow border overflow-hidden">
                    <div className="p-4 border-b bg-muted/30">
                        <h2 className="text-lg font-semibold">
                            {selectedClassName} - {selectedSectionName} Weekly Timetable
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-blue-600 text-white">
                                    <th className="px-3 py-3 text-left font-semibold border-r border-blue-500 w-16">#</th>
                                    {DAYS.map(d => (
                                        <th key={d} className="px-3 py-3 text-center font-semibold border-r border-blue-500 last:border-r-0">
                                            {d}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: maxPeriods }).map((_, pIdx) => (
                                    <tr key={pIdx} className={pIdx % 2 === 0 ? 'bg-white dark:bg-card' : 'bg-muted/20'}>
                                        <td className="px-3 py-3 font-semibold text-center border-r text-muted-foreground">
                                            {pIdx + 1}
                                        </td>
                                        {DAYS.map(day => {
                                            const entries = (timetable[day] || []).filter(e => e.subject_id);
                                            const entry = entries[pIdx];
                                            if (!entry) {
                                                return (
                                                    <td key={day} className="px-2 py-2 text-center border-r last:border-r-0">
                                                        <span className="text-xs text-muted-foreground italic">Not Scheduled</span>
                                                    </td>
                                                );
                                            }
                                            return (
                                                <td key={day} className="px-2 py-2 border-r last:border-r-0">
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 text-center">
                                                        <div className="font-semibold text-blue-700 dark:text-blue-300 text-sm">
                                                            {subjectMap[entry.subject_id] || 'Subject'}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {formatTime12(entry.start_time)} - {formatTime12(entry.end_time)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {teacherMap[entry.teacher_id] || ''}
                                                        </div>
                                                        {entry.room_no && (
                                                            <div className="text-xs text-muted-foreground">
                                                                Room: {entry.room_no}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                                {maxPeriods === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-center py-10 text-muted-foreground">
                                            No timetable data found. Click "Add" to create a new timetable.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ═══════ DELETE CONFIRMATION ═══════ */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are You Sure You Want To Delete?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This period will be removed. You can add it back later if needed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
};

export default ClassTimetable;
