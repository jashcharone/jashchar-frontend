import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';

const StudentAttendanceView = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, half_day: 0, leave: 0 });

    const studentId = user?.profile?.student_id; // Assuming student_id is in user profile

    const fetchAttendance = useCallback(async () => {
        if (!studentId) {
            setLoading(false);
            return;
        };

        setLoading(true);
        try {
            const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
            const today = format(new Date(), 'yyyy-MM-dd');

            // This direct Supabase call should be replaced by a call to our backend API
            // for consistency, but we'll use this for now to get the UI working.
            const { data, error } = await supabase
                .from('student_attendance')
                .select('date, status, remark')
                .eq('student_id', studentId)
                .gte('date', thirtyDaysAgo)
                .lte('date', today)
                .order('date', { ascending: false });

            if (error) throw error;
            
            setAttendance(data);

            // Calculate summary
            const summaryData = data.reduce((acc, record) => {
                acc[record.status] = (acc[record.status] || 0) + 1;
                return acc;
            }, { present: 0, absent: 0, late: 0, half_day: 0, leave: 0 });
            setSummary(summaryData);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching attendance', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [studentId, toast]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);
    
    const getStatusPill = (status) => {
        const baseClasses = 'px-3 py-1 text-xs font-medium rounded-full';
        switch (status) {
            case 'present': return `${baseClasses} bg-green-100 text-green-800`;
            case 'absent': return `${baseClasses} bg-red-100 text-red-800`;
            case 'late': return `${baseClasses} bg-yellow-100 text-yellow-800`;
            case 'half_day': return `${baseClasses} bg-blue-100 text-blue-800`;
            case 'leave': return `${baseClasses} bg-gray-100 text-gray-800`;
            default: return `${baseClasses} bg-gray-50 text-gray-500`;
        }
    }

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-6">My Attendance</h1>

            <Card className="mb-6">
                <CardHeader><CardTitle>Last 30 Days Summary</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div className="p-4 bg-green-50 rounded-lg"><p className="text-2xl font-bold">{summary.present}</p><p className="text-sm text-green-700">Present</p></div>
                    <div className="p-4 bg-red-50 rounded-lg"><p className="text-2xl font-bold">{summary.absent}</p><p className="text-sm text-red-700">Absent</p></div>
                    <div className="p-4 bg-yellow-50 rounded-lg"><p className="text-2xl font-bold">{summary.late}</p><p className="text-sm text-yellow-700">Late</p></div>
                    <div className="p-4 bg-blue-50 rounded-lg"><p className="text-2xl font-bold">{summary.half_day}</p><p className="text-sm text-blue-700">Half Day</p></div>
                    <div className="p-4 bg-gray-50 rounded-lg"><p className="text-2xl font-bold">{summary.leave}</p><p className="text-sm text-gray-700">On Leave</p></div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader><CardTitle>Detailed View</CardTitle></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : attendance.length > 0 ? (
                        <ul className="space-y-3">
                            {attendance.map(record => (
                                <li key={record.date} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                    <div>
                                        <p className="font-bold">{format(new Date(record.date), 'EEEE, MMMM d, yyyy')}</p>
                                        {record.remark && <p className="text-xs text-gray-500 mt-1">Note: {record.remark}</p>}
                                    </div>
                                    <span className={getStatusPill(record.status)}>
                                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center p-8 text-gray-500">No attendance records found for the last 30 days.</div>
                    )}
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default StudentAttendanceView;
