import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Save } from 'lucide-react';
import DatePicker from '@/components/ui/DatePicker';
import { format } from 'date-fns';

const StudentAttendance = () => {
    const { user, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [filters, setFilters] = useState({
        class_id: '',
        section_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
    });

    const branchId = user?.profile?.branch_id;

    const fetchClasses = useCallback(async () => {
        if (!branchId || !selectedBranch) return;
        const { data, error } = await supabase.from('classes').select('id, name').eq('branch_id', branchId).eq('branch_id', selectedBranch.id);
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
        if (!filters.class_id || !filters.section_id || !filters.date) {
            toast({ variant: 'destructive', title: 'Please select class, section, and date.' });
            return;
        }
        setLoading(true);

        // Fetch students of the class and section - filter by session
        let studentQuery = supabase
            .from('student_profiles')
            .select('id, full_name, admission_no')
            .eq('branch_id', branchId)
            .eq('branch_id', selectedBranch.id)
            .eq('class_id', filters.class_id)
            .eq('section_id', filters.section_id)
            .order('admission_no');
        
        // Add session filter if available
        if (currentSessionId) {
            studentQuery = studentQuery.eq('session_id', currentSessionId);
        }
        
        const { data: studentData, error: studentError } = await studentQuery;

        if (studentError) {
            toast({ variant: 'destructive', title: 'Error fetching students', description: studentError.message });
            setLoading(false);
            return;
        }
        setStudents(studentData);

        // Fetch existing attendance for that date - filter by session
        let attendanceQuery = supabase
            .from('student_attendance')
            .select('student_id, status, remark')
            .eq('branch_id', branchId)
            .eq('branch_id', selectedBranch.id)
            .eq('class_id', filters.class_id)
            .eq('section_id', filters.section_id)
            .eq('date', filters.date);
        
        // Add session filter if available
        if (currentSessionId) {
            attendanceQuery = attendanceQuery.eq('session_id', currentSessionId);
        }
        
        const { data: attendanceData, error: attendanceError } = await attendanceQuery;
        
        if (attendanceError) {
             toast({ variant: 'destructive', title: 'Error fetching attendance', description: attendanceError.message });
        } else {
            const initialAttendance = {};
            studentData.forEach(student => {
                const record = attendanceData.find(att => att.student_id === student.id);
                initialAttendance[student.id] = {
                    status: record?.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'Present',
                    note: record?.note || ''
                };
            });
            setAttendance(initialAttendance);
        }

        setLoading(false);
    };

    const handleAttendanceChange = (studentId, key, value) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [key]: value,
            },
        }));
    };
    
    const handleSetAll = (status) => {
        const newAttendance = {};
        students.forEach(student => {
            newAttendance[student.id] = { ...attendance[student.id], status: status };
        });
        setAttendance(newAttendance);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const attendanceToSave = Object.entries(attendance).map(([studentId, details]) => ({
            branch_id: branchId,
            branch_id: selectedBranch.id,
            student_id: studentId,
            class_id: filters.class_id,
            section_id: filters.section_id,
            date: filters.date,
            status: details.status.toLowerCase().replace(' ', '_'), // e.g., 'Half Day' -> 'half_day'
            remark: details.note,
        }));
        
        const { error } = await supabase
            .from('student_attendance')
            .upsert(attendanceToSave, { onConflict: 'student_id,date' });

        if (error) {
            toast({ variant: 'destructive', title: 'Error saving attendance', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Attendance saved successfully.' });
        }
        setIsSaving(false);
    };

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-4">Student Attendance</h1>
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Select Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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
                        <DatePicker label="Date" value={filters.date} onChange={(d) => handleFilterChange('date', d)} />
                        <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin mr-2"/> : <Search className="mr-2 h-4 w-4" />} Search</Button>
                    </form>
                </CardContent>
            </Card>

            {students.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Mark Attendance</CardTitle>
                        <div className="flex space-x-2 mt-2">
                            <Label>Set All as:</Label>
                            <Button size="sm" variant="outline" onClick={() => handleSetAll('Present')}>Present</Button>
                            <Button size="sm" variant="outline" onClick={() => handleSetAll('Late')}>Late</Button>
                            <Button size="sm" variant="outline" onClick={() => handleSetAll('Absent')}>Absent</Button>
                            <Button size="sm" variant="outline" onClick={() => handleSetAll('Half Day')}>Half Day</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="p-2 text-left">#</th>
                                        <th className="p-2 text-left">Student Name</th>
                                        <th className="p-2 text-left">Admission No</th>
                                        <th className="p-2 text-left">Attendance</th>
                                        <th className="p-2 text-left">Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => (
                                        <tr key={student.id} className="border-b">
                                            <td className="p-2">{index + 1}</td>
                                            <td className="p-2">{student.full_name}</td>
                                            <td className="p-2">{student.admission_no}</td>
                                            <td className="p-2">
                                                <RadioGroup
                                                    value={attendance[student.id]?.status || 'Present'}
                                                    onValueChange={(v) => handleAttendanceChange(student.id, 'status', v)}
                                                    className="flex space-x-4"
                                                >
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Present" id={`p-${student.id}`} /><Label htmlFor={`p-${student.id}`}>Present</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Late" id={`l-${student.id}`} /><Label htmlFor={`l-${student.id}`}>Late</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Absent" id={`a-${student.id}`} /><Label htmlFor={`a-${student.id}`}>Absent</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Half Day" id={`h-${student.id}`} /><Label htmlFor={`h-${student.id}`}>Half Day</Label></div>
                                                </RadioGroup>
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    type="text"
                                                    value={attendance[student.id]?.note || ''}
                                                    onChange={(e) => handleAttendanceChange(student.id, 'note', e.target.value)}
                                                    className="h-8"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                         <div className="flex justify-end mt-6">
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />} Save Attendance
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </DashboardLayout>
    );
};

export default StudentAttendance;
