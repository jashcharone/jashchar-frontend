import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Loader2, Clock, MapPin, BookOpen, GraduationCap, XCircle } from 'lucide-react';

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const INT_TO_DAY = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' };

/* -- time helpers -- */
const formatTime12 = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
};

const TeacherTimetable = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const branchId = selectedBranch?.id;

    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [timetable, setTimetable] = useState([]); // raw entries from API
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    /* -- Fetch teachers list -- */
    useEffect(() => {
        if (!branchId) return;
        const headers = { 'x-school-id': branchId, 'x-branch-id': branchId };
        api.get('/academics/teacher-timetable/teachers', { params: { branchId }, headers })
            .then(res => setTeachers(res.data || []))
            .catch(err => {
                toast({ variant: 'destructive', title: 'Error fetching teachers', description: err.message });
                setTeachers([]);
            });
    }, [branchId]);

    /* -- Search -- */
    const handleSearch = async () => {
        if (!selectedTeacher || !branchId) {
            toast({ variant: 'destructive', title: 'Please select a teacher.' });
            return;
        }
        setLoading(true);
        setSearched(true);
        try {
            const { data } = await api.get('/academics/teacher-timetable', {
                params: { teacherId: selectedTeacher, branchId },
                headers: { 'x-school-id': branchId, 'x-branch-id': branchId }
            });
            setTimetable(data || []);
        } catch (err) {
            toast({ variant: 'destructive', title: 'Error fetching timetable', description: err.message });
            setTimetable([]);
        }
        setLoading(false);
    };

    /* -- Organize data into { Monday: [entries], Tuesday: [entries], ... } -- */
    const dayMap = useMemo(() => {
        const map = {};
        DAYS.forEach(d => { map[d] = []; });
        timetable.forEach(entry => {
            const dayName = INT_TO_DAY[entry.day_of_week] || entry.day_of_week;
            if (map[dayName]) {
                map[dayName].push({ ...entry, _dayName: dayName });
            }
        });
        // Sort each day by start_time
        DAYS.forEach(d => {
            map[d].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
        });
        return map;
    }, [timetable]);

    /* -- Max periods across all days -- */
    const maxPeriods = useMemo(() => {
        return Math.max(1, ...DAYS.map(d => dayMap[d].length));
    }, [dayMap]);

    /* -- Selected teacher name -- */
    const teacherName = teachers.find(t => t.id === selectedTeacher)?.full_name || '';

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-6">Teacher Time Table</h1>

            {/* ------- FILTER BAR ------- */}
            <div className="bg-card p-5 rounded-xl shadow border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2">
                        <Label>Teachers <span className="text-red-500">*</span></Label>
                        <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Teacher" />
                            </SelectTrigger>
                            <SelectContent>
                                {teachers.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleSearch} disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white h-10">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Search
                    </Button>
                </div>
            </div>

            {/* ------- WEEKLY GRID VIEW ------- */}
            {searched && (
                <div className="bg-card rounded-xl shadow border overflow-hidden">
                    {teacherName && (
                        <div className="p-4 border-b bg-muted/30">
                            <h2 className="text-lg font-semibold">{teacherName} — Weekly Schedule</h2>
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <div className="grid grid-cols-7 min-w-[900px]">
                            {/* -- Day Headers -- */}
                            {DAYS.map(day => (
                                <div key={day}
                                    className="px-3 py-3 text-center font-bold text-sm bg-white dark:bg-card border-b border-r last:border-r-0 text-gray-700 dark:text-gray-300">
                                    {day}
                                </div>
                            ))}

                            {/* -- Period Rows -- */}
                            {Array.from({ length: maxPeriods }).map((_, pIdx) => (
                                <React.Fragment key={pIdx}>
                                    {DAYS.map(day => {
                                        const entry = dayMap[day][pIdx];
                                        if (!entry) {
                                            return (
                                                <div key={`${day}-${pIdx}`}
                                                    className="px-2 py-2 border-b border-r last:border-r-0 flex items-center justify-center min-h-[120px]">
                                                    <div className="flex items-center gap-1 text-xs text-red-400">
                                                        <XCircle className="h-3.5 w-3.5" />
                                                        <span className="font-medium">Not Scheduled</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        const className = entry.class?.name || '';
                                        const sectionName = entry.section?.name || '';
                                        const subjectName = entry.subject?.name || '';
                                        const timeStr = `${formatTime12(entry.start_time)} - ${formatTime12(entry.end_time)}`;
                                        const roomNo = entry.room_no || '';

                                        return (
                                            <div key={`${day}-${pIdx}`}
                                                className="px-2 py-2 border-b border-r last:border-r-0 min-h-[120px]">
                                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-3 h-full">
                                                    {/* Class & Subject */}
                                                    <div className="flex items-start gap-1.5 mb-1.5">
                                                        <GraduationCap className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                                                        <span className="text-sm font-semibold text-green-700 dark:text-green-300 leading-tight">
                                                            Class: {className}{sectionName ? `(${sectionName})` : ''} Subject: {subjectName}
                                                        </span>
                                                    </div>
                                                    {/* Time */}
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <Clock className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                                                        <span className="text-xs text-gray-600 dark:text-gray-400">{timeStr}</span>
                                                    </div>
                                                    {/* Room */}
                                                    {roomNo && (
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                                                            <span className="text-xs text-gray-600 dark:text-gray-400">Room No.: {roomNo}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}

                            {/* Empty state */}
                            {timetable.length === 0 && (
                                <div className="col-span-7 text-center py-16 text-muted-foreground">
                                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-40" />
                                    <p className="text-lg">No timetable found for the selected teacher.</p>
                                    <p className="text-sm">Timetable entries will appear here once class timetables are created.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default TeacherTimetable;
