import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import DatePicker from '@/components/ui/DatePicker'; // Assuming a single date picker for now
import { addDays, eachDayOfInterval, format, parseISO } from 'date-fns';

const AttendanceByDate = () => {
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [students, setStudents] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [dateInterval, setDateInterval] = useState([]);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({
        class_id: '',
        section_id: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd'),
    });

    const branchId = user?.profile?.branch_id;

    const fetchClasses = useCallback(async () => {
        if (!branchId) return;
        let query = supabase.from('classes').select('id, name').eq('branch_id', branchId);
        if (selectedBranch) {
            query = query.eq('branch_id', selectedBranch.id);
        }
        const { data, error } = await query;
        if (error) toast({ variant: 'destructive', title: 'Error fetching classes' });
        else setClasses(data);
    }, [branchId, selectedBranch, toast]);

    const fetchSections = useCallback(async (classId) => {
        if (!classId) return;
        const { data, error } = await supabase.from('class_sections').select('sections(id, name)').eq('class_id', classId);
        if (error) toast({ variant: 'destructive', title: 'Error fetching sections' });
        else setSections(data.map(item => item.sections).filter(Boolean));
    }, [toast]);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    useEffect(() => {
        if (filters.class_id) {
            fetchSections(filters.class_id);
        } else {
            setSections([]);
        }
        setFilters(f => ({ ...f, section_id: '' }));
    }, [filters.class_id, fetchSections]);

    const handleFilterChange = (key, value) => {
        setFilters(f => ({ ...f, [key]: value }));
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!filters.class_id || !filters.section_id || !filters.start_date || !filters.end_date) {
            toast({ variant: 'destructive', title: 'All filter fields are required.' });
            return;
        }
        setLoading(true);

        try {
            // 1. Fetch students
            let studentQuery = supabase
                .from('student_profiles')
                .select('id, full_name, admission_no')
                .eq('branch_id', branchId)
                .eq('class_id', filters.class_id)
                .eq('section_id', filters.section_id)
                .order('admission_no');

            if (selectedBranch) {
                studentQuery = studentQuery.eq('branch_id', selectedBranch.id);
            }

            const { data: studentData, error: studentError } = await studentQuery;

            if (studentError) throw studentError;
            setStudents(studentData);

            // 2. Fetch attendance data for the date range
            let attendanceQuery = supabase
                .from('student_attendance')
                .select('student_id, date, status')
                .eq('branch_id', branchId)
                .eq('class_id', filters.class_id)
                .eq('section_id', filters.section_id)
                .gte('date', filters.start_date)
                .lte('date', filters.end_date);

            if (selectedBranch) {
                attendanceQuery = attendanceQuery.eq('branch_id', selectedBranch.id);
            }

            const { data: attendanceData, error: attendanceError } = await attendanceQuery;

            if (attendanceError) throw attendanceError;
            
            // 3. Process data
            const interval = eachDayOfInterval({ start: parseISO(filters.start_date), end: parseISO(filters.end_date) });
            setDateInterval(interval);

            const processedData = studentData.map(student => {
                const studentAttendance = {};
                interval.forEach(date => {
                    const dateString = format(date, 'yyyy-MM-dd');
                    const record = attendanceData.find(att => att.student_id === student.id && att.date === dateString);
                    studentAttendance[dateString] = record ? record.status.charAt(0).toUpperCase() : '-'; // P, A, L, H, -
                });
                return {
                    ...student,
                    attendance: studentAttendance,
                };
            });
            setReportData(processedData);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching report data', description: error.message });
            setStudents([]);
            setReportData([]);
            setDateInterval([]);
        } finally {
            setLoading(false);
        }
    };
    
    const getStatusColor = (status) => {
        switch (status) {
            case 'P': return 'text-green-600';
            case 'A': return 'text-red-600';
            case 'L': return 'text-yellow-600';
            case 'H': return 'text-blue-600';
            default: return 'text-gray-500';
        }
    }

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-4">Attendance Report</h1>
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Select Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div>
                            <Label htmlFor="class_id">Class</Label>
                            <Select value={filters.class_id} onValueChange={(v) => handleFilterChange('class_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="section_id">Section</Label>
                            <Select value={filters.section_id} onValueChange={(v) => handleFilterChange('section_id', v)} disabled={!filters.class_id}>
                                <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                                <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <DatePicker label="Start Date" value={filters.start_date} onChange={(d) => handleFilterChange('start_date', d)} />
                        <DatePicker label="End Date" value={filters.end_date} onChange={(d) => handleFilterChange('end_date', d)} />
                        <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin mr-2"/> : <Search className="mr-2 h-4 w-4" />} Search</Button>
                    </form>
                </CardContent>
            </Card>

            {reportData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Report Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="p-2 text-left sticky left-0 bg-muted">Student</th>
                                        {dateInterval.map(date => (
                                            <th key={date.toString()} className="p-2 text-center">{format(date, 'dd')}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((student) => (
                                        <tr key={student.id} className="border-b">
                                            <td className="p-2 sticky left-0 bg-background whitespace-nowrap">{student.full_name}</td>
                                            {dateInterval.map(date => (
                                                <td key={date.toString()} className={`p-2 text-center font-bold ${getStatusColor(student.attendance[format(date, 'yyyy-MM-dd')])}`}>
                                                    {student.attendance[format(date, 'yyyy-MM-dd')]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </DashboardLayout>
    );
};

export default AttendanceByDate;
