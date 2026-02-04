import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabaseClient';
import { sortClasses, sortSections } from '@/utils/classOrderUtils';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/contexts/PermissionContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Save, AlertCircle } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import DatePicker from '@/components/ui/DatePicker';
import { format } from 'date-fns';

const StudentAttendance = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const { canView, canAdd, canEdit } = usePermissions();
    
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

    // ✅ JASHCHAR ERP - Use selectedBranch.id as primary, fallback to user profile
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    // ✅ Permission check
    const hasViewPermission = canView('attendance') || canView('attendance.student_attendance');
    const hasAddPermission = canAdd('attendance') || canAdd('attendance.student_attendance');
    const hasEditPermission = canEdit('attendance') || canEdit('attendance.student_attendance');

    const fetchClasses = useCallback(async () => {
        if (!branchId) return;
        const { data, error } = await supabase
            .from('classes')
            .select('id, name')
            .eq('branch_id', branchId);
        if (error) toast({ variant: 'destructive', title: 'Error fetching classes', description: error.message });
        else setClasses(sortClasses(data || []));
    }, [branchId, toast]);

    const fetchSections = useCallback(async (classId) => {
        if (!classId) return;
        const { data, error } = await supabase
            .from('class_sections')
            .select('sections(id, name)')
            .eq('class_id', classId);
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching sections', description: error.message });
        } else {
            const sectionsList = (data || []).map(item => item.sections).filter(Boolean);
            setSections(sortSections(sectionsList));
        }
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
        if (!branchId) {
            toast({ variant: 'destructive', title: 'Branch not selected. Please select a branch.' });
            return;
        }
        
        setLoading(true);
        setStudents([]);
        setAttendance({});

        try {
            // ✅ JASHCHAR ERP - Fetch students with correct columns (school_code or roll_number, not admission_no)
            let studentQuery = supabase
                .from('student_profiles')
                .select('id, full_name, school_code, roll_number')
                .eq('branch_id', branchId)
                .eq('class_id', filters.class_id)
                .eq('section_id', filters.section_id)
                .or('status.eq.active,status.is.null')
                .order('roll_number', { ascending: true, nullsFirst: false });
            
            // ✅ Add session filter if available
            if (currentSessionId) {
                studentQuery = studentQuery.eq('session_id', currentSessionId);
            }
            
            const { data: studentData, error: studentError } = await studentQuery;

            if (studentError) {
                console.error('Error fetching students:', studentError);
                toast({ variant: 'destructive', title: 'Error fetching students', description: studentError.message });
                setLoading(false);
                return;
            }
            
            if (!studentData || studentData.length === 0) {
                toast({ title: 'No Students Found', description: 'No students found for the selected criteria.' });
                setLoading(false);
                return;
            }
            
            setStudents(studentData);

            // ✅ Fetch existing attendance for that date
            let attendanceQuery = supabase
                .from('student_attendance')
                .select('student_id, status, remark')
                .eq('branch_id', branchId)
                .eq('class_id', filters.class_id)
                .eq('section_id', filters.section_id)
                .eq('date', filters.date);
            
            // Add session filter if available
            if (currentSessionId) {
                attendanceQuery = attendanceQuery.eq('session_id', currentSessionId);
            }
            
            const { data: attendanceData, error: attendanceError } = await attendanceQuery;
            
            if (attendanceError) {
                console.error('Error fetching attendance:', attendanceError);
                toast({ variant: 'destructive', title: 'Error fetching attendance', description: attendanceError.message });
            }
            
            // Initialize attendance state
            const initialAttendance = {};
            studentData.forEach(student => {
                const record = attendanceData?.find(att => att.student_id === student.id);
                initialAttendance[student.id] = {
                    status: record?.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('_', ' ') : 'Present',
                    note: record?.remark || ''
                };
            });
            setAttendance(initialAttendance);
            
        } catch (err) {
            console.error('Search error:', err);
            toast({ variant: 'destructive', title: 'Error', description: err.message });
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
        // ✅ JASHCHAR ERP - Permission check
        if (!hasAddPermission && !hasEditPermission) {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to save attendance.' });
            return;
        }
        
        if (!branchId || !organizationId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Branch or Organization not available.' });
            return;
        }

        if (students.length === 0) {
            toast({ variant: 'destructive', title: 'No students to save attendance for.' });
            return;
        }
        
        setIsSaving(true);
        
        try {
            // ✅ JASHCHAR ERP - Include all required fields: organization_id, branch_id, session_id
            const attendanceToSave = Object.entries(attendance).map(([studentId, details]) => ({
                organization_id: organizationId,
                branch_id: branchId,
                session_id: currentSessionId,
                student_id: studentId,
                class_id: filters.class_id,
                section_id: filters.section_id,
                date: filters.date,
                status: details.status.toLowerCase().replace(/\s+/g, '_'), // e.g., 'Half Day' -> 'half_day'
                remark: details.note || null,
                marked_by: user?.id || null,
            }));
            
            const { error } = await supabase
                .from('student_attendance')
                .upsert(attendanceToSave, { onConflict: 'student_id,date,branch_id' });

            if (error) {
                console.error('Save attendance error:', error);
                toast({ variant: 'destructive', title: 'Error saving attendance', description: error.message });
            } else {
                toast({ title: 'Success', description: `Attendance saved for ${students.length} students.` });
            }
        } catch (err) {
            console.error('Save error:', err);
            toast({ variant: 'destructive', title: 'Error', description: err.message });
        }
        
        setIsSaving(false);
    };

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-4">Student Attendance</h1>
            
            {/* ✅ Permission Warning */}
            {!hasViewPermission && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <span className="ml-2">You don't have permission to view student attendance.</span>
                </Alert>
            )}
            
            {/* ✅ Branch Warning */}
            {!branchId && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <span className="ml-2">Please select a branch to continue.</span>
                </Alert>
            )}
            
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
                        <Button type="submit" disabled={loading || !hasViewPermission || !branchId}>
                            {loading ? <Loader2 className="animate-spin mr-2"/> : <Search className="mr-2 h-4 w-4" />} Search
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {students.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Mark Attendance ({students.length} Students)</CardTitle>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <Label className="flex items-center">Set All as:</Label>
                            <Button size="sm" variant="outline" onClick={() => handleSetAll('Present')} disabled={!hasAddPermission && !hasEditPermission}>Present</Button>
                            <Button size="sm" variant="outline" onClick={() => handleSetAll('Late')} disabled={!hasAddPermission && !hasEditPermission}>Late</Button>
                            <Button size="sm" variant="outline" onClick={() => handleSetAll('Absent')} disabled={!hasAddPermission && !hasEditPermission}>Absent</Button>
                            <Button size="sm" variant="outline" onClick={() => handleSetAll('Half Day')} disabled={!hasAddPermission && !hasEditPermission}>Half Day</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="p-2 text-left">#</th>
                                        <th className="p-2 text-left">Student Name</th>
                                        <th className="p-2 text-left">Roll No / Code</th>
                                        <th className="p-2 text-left">Attendance</th>
                                        <th className="p-2 text-left">Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => (
                                        <tr key={student.id} className="border-b hover:bg-muted/50">
                                            <td className="p-2">{index + 1}</td>
                                            <td className="p-2 font-medium">{student.full_name}</td>
                                            <td className="p-2 text-muted-foreground">{student.roll_number || student.school_code || '-'}</td>
                                            <td className="p-2">
                                                <RadioGroup
                                                    value={attendance[student.id]?.status || 'Present'}
                                                    onValueChange={(v) => handleAttendanceChange(student.id, 'status', v)}
                                                    className="flex flex-wrap gap-4"
                                                    disabled={!hasAddPermission && !hasEditPermission}
                                                >
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Present" id={`p-${student.id}`} /><Label htmlFor={`p-${student.id}`} className="text-green-600">Present</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Late" id={`l-${student.id}`} /><Label htmlFor={`l-${student.id}`} className="text-yellow-600">Late</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Absent" id={`a-${student.id}`} /><Label htmlFor={`a-${student.id}`} className="text-red-600">Absent</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Half Day" id={`h-${student.id}`} /><Label htmlFor={`h-${student.id}`} className="text-orange-600">Half Day</Label></div>
                                                </RadioGroup>
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    type="text"
                                                    value={attendance[student.id]?.note || ''}
                                                    onChange={(e) => handleAttendanceChange(student.id, 'note', e.target.value)}
                                                    className="h-8"
                                                    placeholder="Optional note..."
                                                    disabled={!hasAddPermission && !hasEditPermission}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end mt-6">
                            <Button 
                                onClick={handleSave} 
                                disabled={isSaving || (!hasAddPermission && !hasEditPermission)}
                                className="min-w-[180px]"
                            >
                                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />} Save Attendance
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
            
            {/* No students message */}
            {!loading && students.length === 0 && filters.class_id && filters.section_id && filters.date && (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        <p>No students found. Please search with different criteria.</p>
                    </CardContent>
                </Card>
            )}
        </DashboardLayout>
    );
};

export default StudentAttendance;
