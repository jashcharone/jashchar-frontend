import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Loader2 } from 'lucide-react';

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const dayMap = { 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday", 7: "Sunday" };

const TeacherTimetable = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(false);

    const branchId = user?.profile?.branch_id;

    useEffect(() => {
        if (!branchId || !selectedBranch) return;
        const fetchTeachers = async () => {
            try {
                const { data } = await api.get('/academics/teacher-timetable/teachers', {
                    params: { branchId, branchId: selectedBranch.id }
                });
                setTeachers(data || []);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error fetching teachers', description: error.response?.data?.message || error.message });
            }
        };
        fetchTeachers();
    }, [branchId, selectedBranch, toast]);

    const handleSearch = async () => {
        if (!selectedTeacher || !selectedBranch?.id) {
            toast({ variant: 'destructive', title: 'Please select a teacher and branch.' });
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.get('/academics/teacher-timetable', {
                params: { teacherId: selectedTeacher, branchId: selectedBranch.id }
            });
            setTimetable(data || []);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching timetable', description: error.response?.data?.message || error.message });
            setTimetable([]);
        }
        setLoading(false);
    };

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-6">Teacher Timetable</h1>
            <div className="bg-card p-6 rounded-xl shadow-lg mb-6 border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <Label>Teacher *</Label>
                        <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                            <SelectTrigger><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                            <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleSearch} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Search />} Search</Button>
                </div>
            </div>

            {timetable.length > 0 ? (
                <div className="bg-card p-6 rounded-xl shadow-lg border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase bg-muted/50">
                                <tr>
                                    <th className="px-6 py-3 text-left">Day</th>
                                    <th className="px-6 py-3 text-left">Subject</th>
                                    <th className="px-6 py-3 text-left">Class (Section)</th>
                                    <th className="px-6 py-3 text-left">Time</th>
                                    <th className="px-6 py-3 text-left">Room No.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {daysOfWeek.map(dayName => {
                                    // Find entries for this day (handling integer day storage)
                                    const dayEntries = timetable.filter(entry => dayMap[entry.day_of_week] === dayName || entry.day_of_week === dayName);
                                    
                                    if (dayEntries.length === 0) return null;
                                    
                                    return dayEntries.map((entry, index) => (
                                        <tr key={entry.id} className="border-b hover:bg-muted/50">
                                            {index === 0 && (
                                                <td rowSpan={dayEntries.length} className="px-6 py-4 font-semibold align-top border-r bg-muted/10">
                                                    {dayName}
                                                </td>
                                            )}
                                            <td className="px-6 py-4">{entry.subject?.name || '-'}</td>
                                            <td className="px-6 py-4">{entry.class?.name} ({entry.section?.name})</td>
                                            <td className="px-6 py-4">{entry.start_time?.slice(0,5)} - {entry.end_time?.slice(0,5)}</td>
                                            <td className="px-6 py-4">{entry.room_no || '-'}</td>
                                        </tr>
                                    ));
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-card p-6 rounded-xl shadow-lg border text-center text-muted-foreground">
                    No timetable found for selected teacher.
                </div>
            )}
        </DashboardLayout>
    );
};

export default TeacherTimetable;
