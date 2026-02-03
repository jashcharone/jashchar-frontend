// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - COMPREHENSIVE ATTENDANCE REPORT
// Student & Staff Attendance Reports with Advanced Filters and Export
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, parseISO, differenceInDays, subDays, subMonths } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Calendar as CalendarIcon,
    Search,
    Download,
    RefreshCw,
    Filter,
    Users,
    GraduationCap,
    Briefcase,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    BarChart3,
    PieChart,
    Loader2,
    ChevronDown,
    Printer,
    FileSpreadsheet,
    ArrowUpRight,
    ArrowDownRight,
    Eye,
    UserCheck,
    UserX,
    CalendarDays,
    CalendarClock,
    Building2
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ATTENDANCE REPORT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const AttendanceReport = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    
    // State
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('student');
    const [reportType, setReportType] = useState('daily'); // daily, monthly, custom
    
    // Filters
    const [selectedClass, setSelectedClass] = useState('all');
    const [selectedSection, setSelectedSection] = useState('all');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Date filters
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dateRange, setDateRange] = useState({
        from: startOfMonth(new Date()),
        to: new Date()
    });
    
    // Data
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [summary, setSummary] = useState({
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        holiday: 0
    });
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // FETCH INITIAL DATA
    // ═══════════════════════════════════════════════════════════════════════════════
    
    useEffect(() => {
        if (branchId) {
            fetchClasses();
            fetchDepartments();
        }
    }, [branchId]);
    
    useEffect(() => {
        if (selectedClass && selectedClass !== 'all') {
            fetchSections(selectedClass);
        } else {
            setSections([]);
            setSelectedSection('all');
        }
    }, [selectedClass]);
    
    useEffect(() => {
        if (branchId) {
            fetchAttendanceReport();
        }
    }, [branchId, activeTab, reportType, selectedDate, dateRange, selectedClass, selectedSection, selectedDepartment]);
    
    const fetchClasses = async () => {
        const { data, error } = await supabase
            .from('classes')
            .select('id, name')
            .eq('branch_id', branchId)
            .order('name');
        
        if (!error) setClasses(data || []);
    };
    
    const fetchSections = async (classId) => {
        const { data, error } = await supabase
            .from('sections')
            .select('id, name')
            .eq('class_id', classId)
            .order('name');
        
        if (!error) setSections(data || []);
    };
    
    const fetchDepartments = async () => {
        const { data, error } = await supabase
            .from('departments')
            .select('id, name')
            .eq('branch_id', branchId)
            .order('name');
        
        if (!error) setDepartments(data || []);
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // FETCH ATTENDANCE REPORT
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const fetchAttendanceReport = async () => {
        setLoading(true);
        
        try {
            let startDate, endDate;
            
            if (reportType === 'daily') {
                startDate = format(selectedDate, 'yyyy-MM-dd');
                endDate = startDate;
            } else if (reportType === 'monthly') {
                startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
                endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
            } else {
                startDate = format(dateRange.from, 'yyyy-MM-dd');
                endDate = format(dateRange.to, 'yyyy-MM-dd');
            }
            
            if (activeTab === 'student') {
                await fetchStudentAttendance(startDate, endDate);
            } else {
                await fetchStaffAttendance(startDate, endDate);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
        
        setLoading(false);
    };
    
    const fetchStudentAttendance = async (startDate, endDate) => {
        // First get students
        let studentQuery = supabase
            .from('student_profiles')
            .select('id, full_name, admission_number, roll_number, class_id, section_id, photo_url')
            .eq('branch_id', branchId)
            .eq('session_id', currentSessionId);
        
        if (selectedClass !== 'all') {
            studentQuery = studentQuery.eq('class_id', selectedClass);
        }
        if (selectedSection !== 'all') {
            studentQuery = studentQuery.eq('section_id', selectedSection);
        }
        
        const { data: students, error: studentError } = await studentQuery.order('full_name');
        
        if (studentError) throw studentError;
        
        // Get attendance records
        let attendanceQuery = supabase
            .from('student_attendance')
            .select('*')
            .eq('branch_id', branchId)
            .gte('date', startDate)
            .lte('date', endDate);
        
        if (selectedClass !== 'all') {
            attendanceQuery = attendanceQuery.eq('class_id', selectedClass);
        }
        if (selectedSection !== 'all') {
            attendanceQuery = attendanceQuery.eq('section_id', selectedSection);
        }
        
        const { data: attendance, error: attendanceError } = await attendanceQuery;
        
        if (attendanceError) throw attendanceError;
        
        // Get class and section names
        const classIds = [...new Set(students?.map(s => s.class_id).filter(Boolean))];
        const sectionIds = [...new Set(students?.map(s => s.section_id).filter(Boolean))];
        
        const { data: classData } = await supabase
            .from('classes')
            .select('id, name')
            .in('id', classIds.length > 0 ? classIds : ['00000000-0000-0000-0000-000000000000']);
        
        const { data: sectionData } = await supabase
            .from('sections')
            .select('id, name')
            .in('id', sectionIds.length > 0 ? sectionIds : ['00000000-0000-0000-0000-000000000000']);
        
        const classMap = new Map((classData || []).map(c => [c.id, c.name]));
        const sectionMap = new Map((sectionData || []).map(s => [s.id, s.name]));
        
        // Calculate attendance per student
        const totalDays = differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
        
        const reportData = (students || []).map(student => {
            const studentAttendance = (attendance || []).filter(a => a.student_id === student.id);
            
            const present = studentAttendance.filter(a => a.status === 'present').length;
            const absent = studentAttendance.filter(a => a.status === 'absent').length;
            const late = studentAttendance.filter(a => a.status === 'late').length;
            const leave = studentAttendance.filter(a => a.status === 'leave').length;
            const holiday = studentAttendance.filter(a => a.status === 'holiday').length;
            const recorded = studentAttendance.length;
            
            const attendancePercentage = recorded > 0 ? ((present + late) / recorded) * 100 : 0;
            
            return {
                id: student.id,
                name: student.full_name,
                code: student.admission_number || student.roll_number || '-',
                class: classMap.get(student.class_id) || '-',
                section: sectionMap.get(student.section_id) || '-',
                photo_url: student.photo_url,
                totalDays: recorded,
                present,
                absent,
                late,
                leave,
                holiday,
                percentage: Math.round(attendancePercentage * 10) / 10,
                status: attendancePercentage >= 75 ? 'good' : attendancePercentage >= 50 ? 'average' : 'poor'
            };
        });
        
        setAttendanceData(reportData);
        
        // Calculate summary
        setSummary({
            total: reportData.length,
            present: reportData.reduce((sum, r) => sum + r.present, 0),
            absent: reportData.reduce((sum, r) => sum + r.absent, 0),
            late: reportData.reduce((sum, r) => sum + r.late, 0),
            leave: reportData.reduce((sum, r) => sum + r.leave, 0),
            holiday: reportData.reduce((sum, r) => sum + r.holiday, 0),
            avgPercentage: reportData.length > 0 
                ? Math.round(reportData.reduce((sum, r) => sum + r.percentage, 0) / reportData.length * 10) / 10 
                : 0
        });
    };
    
    const fetchStaffAttendance = async (startDate, endDate) => {
        // First get staff
        let staffQuery = supabase
            .from('employee_profiles')
            .select('id, full_name, employee_code, phone, department_id, designation_id, photo_url')
            .eq('branch_id', branchId);
        
        if (selectedDepartment !== 'all') {
            staffQuery = staffQuery.eq('department_id', selectedDepartment);
        }
        
        const { data: staff, error: staffError } = await staffQuery.order('full_name');
        
        if (staffError) throw staffError;
        
        // Get attendance records
        let attendanceQuery = supabase
            .from('staff_attendance')
            .select('*')
            .eq('branch_id', branchId)
            .gte('date', startDate)
            .lte('date', endDate);
        
        if (selectedDepartment !== 'all') {
            attendanceQuery = attendanceQuery.eq('department_id', selectedDepartment);
        }
        
        const { data: attendance, error: attendanceError } = await attendanceQuery;
        
        if (attendanceError) throw attendanceError;
        
        // Get department names
        const deptIds = [...new Set(staff?.map(s => s.department_id).filter(Boolean))];
        
        const { data: deptData } = await supabase
            .from('departments')
            .select('id, name')
            .in('id', deptIds.length > 0 ? deptIds : ['00000000-0000-0000-0000-000000000000']);
        
        const deptMap = new Map((deptData || []).map(d => [d.id, d.name]));
        
        // Calculate attendance per staff
        const reportData = (staff || []).map(employee => {
            const staffAttendance = (attendance || []).filter(a => a.staff_id === employee.id);
            
            const present = staffAttendance.filter(a => a.status === 'present').length;
            const absent = staffAttendance.filter(a => a.status === 'absent').length;
            const late = staffAttendance.filter(a => a.status === 'late').length;
            const leave = staffAttendance.filter(a => a.status === 'leave' || a.status === 'on_leave').length;
            const holiday = staffAttendance.filter(a => a.status === 'holiday').length;
            const recorded = staffAttendance.length;
            
            const attendancePercentage = recorded > 0 ? ((present + late) / recorded) * 100 : 0;
            
            return {
                id: employee.id,
                name: employee.full_name,
                code: employee.employee_code || employee.phone || '-',
                department: deptMap.get(employee.department_id) || '-',
                photo_url: employee.photo_url,
                totalDays: recorded,
                present,
                absent,
                late,
                leave,
                holiday,
                percentage: Math.round(attendancePercentage * 10) / 10,
                status: attendancePercentage >= 75 ? 'good' : attendancePercentage >= 50 ? 'average' : 'poor'
            };
        });
        
        setAttendanceData(reportData);
        
        // Calculate summary
        setSummary({
            total: reportData.length,
            present: reportData.reduce((sum, r) => sum + r.present, 0),
            absent: reportData.reduce((sum, r) => sum + r.absent, 0),
            late: reportData.reduce((sum, r) => sum + r.late, 0),
            leave: reportData.reduce((sum, r) => sum + r.leave, 0),
            holiday: reportData.reduce((sum, r) => sum + r.holiday, 0),
            avgPercentage: reportData.length > 0 
                ? Math.round(reportData.reduce((sum, r) => sum + r.percentage, 0) / reportData.length * 10) / 10 
                : 0
        });
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // FILTERED DATA
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const filteredData = useMemo(() => {
        return attendanceData.filter(item => {
            if (!searchTerm) return true;
            const search = searchTerm.toLowerCase();
            return (
                item.name?.toLowerCase().includes(search) ||
                item.code?.toLowerCase().includes(search)
            );
        });
    }, [attendanceData, searchTerm]);
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // EXPORT FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    const exportToCSV = () => {
        const headers = activeTab === 'student'
            ? ['Name', 'Admission No', 'Class', 'Section', 'Total Days', 'Present', 'Absent', 'Late', 'Leave', 'Attendance %']
            : ['Name', 'Employee Code', 'Department', 'Total Days', 'Present', 'Absent', 'Late', 'Leave', 'Attendance %'];
        
        const rows = filteredData.map(item => activeTab === 'student'
            ? [item.name, item.code, item.class, item.section, item.totalDays, item.present, item.absent, item.late, item.leave, `${item.percentage}%`]
            : [item.name, item.code, item.department, item.totalDays, item.present, item.absent, item.late, item.leave, `${item.percentage}%`]
        );
        
        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        
        toast({ title: '✅ Report exported successfully!' });
    };
    
    const printReport = () => {
        window.print();
    };
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════════
    
    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <FileText className="h-8 w-8 text-primary" />
                            Attendance Report
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Comprehensive attendance analysis and reports
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={fetchAttendanceReport}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        <Button variant="outline" onClick={exportToCSV}>
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                        <Button variant="outline" onClick={printReport}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </Button>
                    </div>
                </div>
                
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{summary.total}</p>
                                    <p className="text-xs text-muted-foreground">Total {activeTab === 'student' ? 'Students' : 'Staff'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10">
                                    <UserCheck className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-green-600">{summary.present}</p>
                                    <p className="text-xs text-muted-foreground">Present</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-500/10">
                                    <UserX className="h-5 w-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
                                    <p className="text-xs text-muted-foreground">Absent</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-500/10">
                                    <Clock className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-amber-600">{summary.late}</p>
                                    <p className="text-xs text-muted-foreground">Late</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <CalendarDays className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-600">{summary.leave}</p>
                                    <p className="text-xs text-muted-foreground">On Leave</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                    <TrendingUp className="h-5 w-5 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-purple-600">{summary.avgPercentage}%</p>
                                    <p className="text-xs text-muted-foreground">Avg Attendance</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                            {/* Report Type Tabs */}
                            <div className="lg:col-span-2">
                                <Label className="mb-2 block">Report For</Label>
                                <Tabs value={activeTab} onValueChange={setActiveTab}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="student" className="flex items-center gap-2">
                                            <GraduationCap className="w-4 h-4" />
                                            Students
                                        </TabsTrigger>
                                        <TabsTrigger value="staff" className="flex items-center gap-2">
                                            <Briefcase className="w-4 h-4" />
                                            Staff
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                            
                            {/* Report Period */}
                            <div>
                                <Label className="mb-2 block">Report Period</Label>
                                <Select value={reportType} onValueChange={setReportType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="custom">Custom Range</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {/* Date Picker */}
                            <div>
                                <Label className="mb-2 block">
                                    {reportType === 'daily' ? 'Select Date' : reportType === 'monthly' ? 'Select Month' : 'From Date'}
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {reportType === 'custom' 
                                                ? format(dateRange.from, 'dd MMM yyyy')
                                                : format(selectedDate, reportType === 'monthly' ? 'MMMM yyyy' : 'dd MMM yyyy')
                                            }
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={reportType === 'custom' ? dateRange.from : selectedDate}
                                            onSelect={(date) => {
                                                if (reportType === 'custom') {
                                                    setDateRange(prev => ({ ...prev, from: date }));
                                                } else {
                                                    setSelectedDate(date);
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            
                            {/* To Date (for custom range) */}
                            {reportType === 'custom' && (
                                <div>
                                    <Label className="mb-2 block">To Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {format(dateRange.to, 'dd MMM yyyy')}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={dateRange.to}
                                                onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}
                            
                            {/* Class/Department Filter */}
                            {activeTab === 'student' ? (
                                <div>
                                    <Label className="mb-2 block">Class</Label>
                                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Classes" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Classes</SelectItem>
                                            {classes.map(cls => (
                                                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div>
                                    <Label className="mb-2 block">Department</Label>
                                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Departments" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Departments</SelectItem>
                                            {departments.map(dept => (
                                                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            
                            {/* Section Filter (for students) */}
                            {activeTab === 'student' && (
                                <div>
                                    <Label className="mb-2 block">Section</Label>
                                    <Select 
                                        value={selectedSection} 
                                        onValueChange={setSelectedSection}
                                        disabled={selectedClass === 'all'}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Sections" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Sections</SelectItem>
                                            {sections.map(sec => (
                                                <SelectItem key={sec.id} value={sec.id}>{sec.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                        
                        {/* Search */}
                        <div className="mt-4 flex gap-4">
                            <div className="flex-1 relative">
                                <Input
                                    placeholder={`Search by name or ${activeTab === 'student' ? 'admission number' : 'employee code'}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                {/* Report Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Attendance Details
                            <Badge variant="secondary" className="ml-2">{filteredData.length} records</Badge>
                        </CardTitle>
                        <CardDescription>
                            {reportType === 'daily' 
                                ? `Report for ${format(selectedDate, 'dd MMMM yyyy')}`
                                : reportType === 'monthly'
                                    ? `Report for ${format(selectedDate, 'MMMM yyyy')}`
                                    : `Report from ${format(dateRange.from, 'dd MMM')} to ${format(dateRange.to, 'dd MMM yyyy')}`
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <span className="ml-2">Loading report...</span>
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="text-center py-20">
                                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No Data Found</h3>
                                <p className="text-muted-foreground">
                                    No attendance records found for the selected criteria.
                                </p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[500px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="sticky top-0 bg-background">#</TableHead>
                                            <TableHead className="sticky top-0 bg-background">Name</TableHead>
                                            <TableHead className="sticky top-0 bg-background">
                                                {activeTab === 'student' ? 'Adm No' : 'Emp Code'}
                                            </TableHead>
                                            <TableHead className="sticky top-0 bg-background">
                                                {activeTab === 'student' ? 'Class' : 'Department'}
                                            </TableHead>
                                            {activeTab === 'student' && (
                                                <TableHead className="sticky top-0 bg-background">Section</TableHead>
                                            )}
                                            <TableHead className="sticky top-0 bg-background text-center">Days</TableHead>
                                            <TableHead className="sticky top-0 bg-background text-center text-green-600">P</TableHead>
                                            <TableHead className="sticky top-0 bg-background text-center text-red-600">A</TableHead>
                                            <TableHead className="sticky top-0 bg-background text-center text-amber-600">L</TableHead>
                                            <TableHead className="sticky top-0 bg-background text-center text-blue-600">Lv</TableHead>
                                            <TableHead className="sticky top-0 bg-background text-center">%</TableHead>
                                            <TableHead className="sticky top-0 bg-background">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredData.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                                            {item.photo_url ? (
                                                                <img src={item.photo_url} className="w-full h-full object-cover" alt="" />
                                                            ) : activeTab === 'student' ? (
                                                                <GraduationCap className="w-4 h-4 text-primary" />
                                                            ) : (
                                                                <Briefcase className="w-4 h-4 text-primary" />
                                                            )}
                                                        </div>
                                                        <span className="font-medium">{item.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{item.code}</TableCell>
                                                <TableCell>{activeTab === 'student' ? item.class : item.department}</TableCell>
                                                {activeTab === 'student' && (
                                                    <TableCell>{item.section}</TableCell>
                                                )}
                                                <TableCell className="text-center">{item.totalDays}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        {item.present}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                        {item.absent}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                        {item.late}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        {item.leave}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center gap-2">
                                                        <Progress 
                                                            value={item.percentage} 
                                                            className="w-16 h-2"
                                                        />
                                                        <span className={`font-semibold ${
                                                            item.percentage >= 75 ? 'text-green-600' :
                                                            item.percentage >= 50 ? 'text-amber-600' : 'text-red-600'
                                                        }`}>
                                                            {item.percentage}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge 
                                                        variant={item.status === 'good' ? 'default' : item.status === 'average' ? 'secondary' : 'destructive'}
                                                        className="capitalize"
                                                    >
                                                        {item.status === 'good' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                                        {item.status === 'average' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                        {item.status === 'poor' && <XCircle className="w-3 h-3 mr-1" />}
                                                        {item.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
                
                {/* Quick Stats Cards */}
                {filteredData.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-green-200 bg-green-50/50">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Good Attendance (≥75%)</p>
                                        <p className="text-3xl font-bold text-green-600">
                                            {filteredData.filter(d => d.status === 'good').length}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-full bg-green-100">
                                        <TrendingUp className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                                <Progress 
                                    value={(filteredData.filter(d => d.status === 'good').length / filteredData.length) * 100} 
                                    className="mt-3 h-2"
                                />
                            </CardContent>
                        </Card>
                        
                        <Card className="border-amber-200 bg-amber-50/50">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Average Attendance (50-75%)</p>
                                        <p className="text-3xl font-bold text-amber-600">
                                            {filteredData.filter(d => d.status === 'average').length}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-full bg-amber-100">
                                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                                    </div>
                                </div>
                                <Progress 
                                    value={(filteredData.filter(d => d.status === 'average').length / filteredData.length) * 100} 
                                    className="mt-3 h-2"
                                />
                            </CardContent>
                        </Card>
                        
                        <Card className="border-red-200 bg-red-50/50">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Poor Attendance (&lt;50%)</p>
                                        <p className="text-3xl font-bold text-red-600">
                                            {filteredData.filter(d => d.status === 'poor').length}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-full bg-red-100">
                                        <TrendingDown className="w-6 h-6 text-red-600" />
                                    </div>
                                </div>
                                <Progress 
                                    value={(filteredData.filter(d => d.status === 'poor').length / filteredData.length) * 100} 
                                    className="mt-3 h-2"
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AttendanceReport;
