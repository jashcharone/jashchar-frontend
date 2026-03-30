import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import api from '@/lib/api';
import { sortClasses, sortSections } from '@/utils/classOrderUtils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Search, Eye, Edit, Trash2, Users, Copy, FileDown, Printer, LayoutGrid, ChevronLeft, ChevronRight, UserX, Loader2, RefreshCcw, Bus, Home, CalendarDays } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate, useParams } from 'react-router-dom';
import { format, differenceInYears } from 'date-fns';
import { formatDate } from '@/utils/dateUtils';
import { ROUTES } from '@/registry/routeRegistry';

const StudentDetails = () => {
    const { user, currentSessionId } = useAuth();
    const { canEdit, canDelete } = usePermissions();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const navigate = useNavigate();
    const { roleSlug } = useParams();
    
    // Dynamic base path for navigation (uses roleSlug from URL or defaults to super-admin)
    const basePath = roleSlug || 'super-admin';
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [filters, setFilters] = useState({ class_id: 'all', section_id: '', keyword: '', status: 'active', dateFilter: 'all', dateFrom: '', dateTo: '' });
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [feesData, setFeesData] = useState({}); // { studentId: { total, paid, progress } }
    const [initialLoadDone, setInitialLoadDone] = useState(false); // For auto-load on page open
    const [totalCount, setTotalCount] = useState(0); // Total students count from server
    const [hostelAssignments, setHostelAssignments] = useState({}); // { studentId: { hostel_name, room_no } }
    const [transportAssignments, setTransportAssignments] = useState({}); // { studentId: { route, pickup_point } }
    const [visibleColumns, setVisibleColumns] = useState({
        photo: true, name: true, class: true, section: true, gender: true, 
        mobile: true, register: true, roll: true, age: true, guardian: true, fees: true
    });
    
    // Disable functionality states
    const [disableReasons, setDisableReasons] = useState([]);
    const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
    const [studentToDisable, setStudentToDisable] = useState(null);
    const [disableFormData, setDisableFormData] = useState({ reason_id: '', note: '' });
    const [disableLoading, setDisableLoading] = useState(false);

    // ? FIX: Use selectedBranch.id OR fallback to user profile/metadata branch_id
    const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

    const calculateAge = (dob) => {
        if (!dob) return '-';
        return differenceInYears(new Date(), new Date(dob));
    };

    // ?? Highlight search text in results
    const highlightText = (text, searchTerm) => {
        if (!searchTerm || !text) return text;
        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = String(text).split(regex);
        return parts.map((part, i) => 
            regex.test(part) 
                ? <mark key={i} className="bg-yellow-300 dark:bg-yellow-600 px-0.5 rounded">{part}</mark>
                : part
        );
    };

    // TC-11 FIX: Copy to clipboard functionality
    const handleCopyToClipboard = useCallback(() => {
        if (students.length === 0) {
            toast({ variant: 'destructive', title: 'No data to copy' });
            return;
        }
        const headers = ['Name', 'Class', 'Section', 'Register No', 'Roll', 'Phone', 'Father Name'];
        const rows = students.map(s => [
            s.full_name || `${s.first_name} ${s.last_name}`,
            s.class?.name || '',
            s.section?.name || '',
            s.enrollment_id || '',
            s.roll_number || '',
            s.phone || '',
            s.father_name || ''
        ].join('\t'));
        const text = [headers.join('\t'), ...rows].join('\n');
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied!', description: `${students.length} students copied to clipboard` });
    }, [students, toast]);

    // TC-11 FIX: Export to Excel functionality
    const handleExportExcel = useCallback(() => {
        if (students.length === 0) {
            toast({ variant: 'destructive', title: 'No data to export' });
            return;
        }
        const headers = ['Name', 'Class', 'Section', 'Register No', 'Roll No', 'Phone', 'Father Name', 'Gender', 'DOB'];
        const rows = students.map(s => [
            s.full_name || `${s.first_name} ${s.last_name}`,
            s.class?.name || '',
            s.section?.name || '',
            s.enrollment_id || '',
            s.roll_number || '',
            s.phone || '',
            s.father_name || '',
            s.gender || '',
            s.date_of_birth ? format(new Date(s.date_of_birth), 'dd/MM/yyyy') : ''
        ].join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast({ title: 'Downloaded!', description: `${students.length} students exported` });
    }, [students, toast]);

    // TC-11 FIX: Print functionality
    const handlePrint = useCallback(() => {
        if (students.length === 0) {
            toast({ variant: 'destructive', title: 'No data to print' });
            return;
        }
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head><title>Student List</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                th { background-color: #4F46E5; color: white; }
                tr:nth-child(even) { background-color: #f2f2f2; }
                h1 { color: #4F46E5; }
            </style>
            </head>
            <body>
            <h1>Student List</h1>
            <p>Total Students: ${students.length} | Printed: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
            <table>
                <thead><tr><th>S.No</th><th>Name</th><th>Class</th><th>Section</th><th>Register No</th><th>Roll</th><th>Phone</th><th>Father</th></tr></thead>
                <tbody>
                ${students.map((s, i) => `<tr>
                    <td>${i + 1}</td>
                    <td>${s.full_name || `${s.first_name} ${s.last_name}`}</td>
                    <td>${s.class?.name || ''}</td>
                    <td>${s.section?.name || ''}</td>
                    <td>${s.enrollment_id || ''}</td>
                    <td>${s.roll_number || ''}</td>
                    <td>${s.phone || ''}</td>
                    <td>${s.father_name || ''}</td>
                </tr>`).join('')}
                </tbody>
            </table>
            </body></html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
    }, [students]);

    // TC-11 FIX: Toggle column visibility
    const toggleColumn = (col) => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));

    const handleDelete = async (studentId) => {
        if (!window.confirm("Are you sure you want to delete this student? This action cannot be undone.")) return;
        
        try {
            await api.delete(`/students/${studentId}`);
            setStudents(prev => prev.filter(s => s.id !== studentId));
            toast({ title: "Student deleted successfully" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error deleting student", description: error.response?.data?.error || error.message });
        }
    };

    const handleBulkDelete = async () => {
        if (selectedStudents.length === 0) {
            toast({ variant: 'destructive', title: 'Please select students to delete' });
            return;
        }
        if (!window.confirm(`Are you sure you want to delete ${selectedStudents.length} students?`)) return;
        
        try {
            for (const id of selectedStudents) {
                await api.delete(`/students/${id}`);
            }
            setStudents(prev => prev.filter(s => !selectedStudents.includes(s.id)));
            setSelectedStudents([]);
            toast({ title: `${selectedStudents.length} students deleted successfully` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error deleting students" });
        }
    };

    useEffect(() => {
        if (!branchId) return;
        const fetchPrereqs = async () => {
            const { data: classData } = await supabase
                .from('classes')
                .select('id, name')
                .eq('branch_id', branchId);
            setClasses(sortClasses(classData || []));
            
            // Fetch disable reasons for branch
            const { data: reasonsData } = await supabase
                .from('disable_reasons')
                .select('id, reason')
                .eq('branch_id', branchId)
                .order('reason');
            setDisableReasons(reasonsData || []);
        };
        fetchPrereqs();
    }, [branchId]);

    // Auto-load: Set initial load done when classes are loaded (no auto-select, default is 'all')
    useEffect(() => {
        if (classes.length > 0 && !initialLoadDone) {
            setInitialLoadDone(true);
        }
    }, [classes, initialLoadDone]);

    useEffect(() => {
        if (filters.class_id && filters.class_id !== 'all') {
            const fetchSections = async () => {
                const { data } = await supabase.from('class_sections').select('sections(id, name)').eq('class_id', filters.class_id);
                const sectionsList = data ? data.map(item => item.sections).filter(Boolean) : [];
                setSections(sortSections(sectionsList));
            };
            fetchSections();
        } else {
            setSections([]);
            setFilters(prev => ({ ...prev, section_id: '' }));
        }
    }, [filters.class_id]);

    // Date range helper for admission date filter
    const getDateRange = (dateFilter, dateFrom, dateTo) => {
        const now = new Date();
        const toISO = (d) => d.toISOString().split('T')[0];
        switch(dateFilter) {
            case 'today': return { from: toISO(now), to: toISO(now) };
            case 'last7days': { const d = new Date(now); d.setDate(d.getDate() - 7); return { from: toISO(d), to: toISO(now) }; }
            case 'last30days': { const d = new Date(now); d.setDate(d.getDate() - 30); return { from: toISO(d), to: toISO(now) }; }
            case 'thisMonth': return { from: toISO(new Date(now.getFullYear(), now.getMonth(), 1)), to: toISO(now) };
            case 'custom': return { from: dateFrom || null, to: dateTo || null };
            default: return { from: null, to: null };
        }
    };

    // Server-side paginated search
    const handleSearch = async (page = 1) => {
        if (!branchId) return;
        setLoading(true);
        
        const activeSessionId = currentSessionId;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let studentQuery = supabase.from('student_profiles').select(`
            id, full_name, first_name, last_name, enrollment_id, roll_number, gender, date_of_birth, phone, photo_url,
            father_name, father_phone, guardian_name, guardian_phone, admission_date, session_id, is_disabled,
            class:classes!student_profiles_class_id_fkey( name ),
            section:sections!student_profiles_section_id_fkey( name )
        `, { count: 'exact' })
        .eq('branch_id', branchId)
        .order('roll_number', { ascending: true, nullsFirst: false })
        .range(from, to);
        
        // Apply status filter
        if (filters.status === 'active') {
            studentQuery = studentQuery.or('is_disabled.is.null,is_disabled.eq.false');
        } else if (filters.status === 'inactive') {
            studentQuery = studentQuery.eq('is_disabled', true);
        }
        
        if (activeSessionId) {
            studentQuery = studentQuery.eq('session_id', activeSessionId);
        }
        
        if (filters.class_id && filters.class_id !== 'all') {
            studentQuery = studentQuery.eq('class_id', filters.class_id);
        }
        
        if (filters.section_id && filters.section_id !== 'all') {
            studentQuery = studentQuery.eq('section_id', filters.section_id);
        }

        // Server-side keyword search
        if (filters.keyword && filters.keyword.trim()) {
            const kw = filters.keyword.trim();
            studentQuery = studentQuery.or(`full_name.ilike.%${kw}%,enrollment_id.ilike.%${kw}%,roll_number.ilike.%${kw}%,phone.ilike.%${kw}%,father_name.ilike.%${kw}%`);
        }
        
        // Admission date filter
        const dateRange = getDateRange(filters.dateFilter, filters.dateFrom, filters.dateTo);
        if (dateRange.from) {
            studentQuery = studentQuery.gte('admission_date', dateRange.from);
        }
        if (dateRange.to) {
            studentQuery = studentQuery.lte('admission_date', dateRange.to);
        }

        const { data: studentsData, error: studentsError, count } = await studentQuery;

        if (studentsError) {
            toast({ variant: 'destructive', title: 'Error fetching students', description: studentsError.message });
            setLoading(false);
            setStudents([]);
            setTotalCount(0);
            return;
        }
        
        setTotalCount(count || 0);
        setCurrentPage(page);
        
        if (studentsData && studentsData.length > 0) {
            // TC-32 FIX: Derive first_name and last_name from full_name if not present
            studentsData.forEach(s => {
                if (!s.first_name && s.full_name) {
                    const nameParts = s.full_name.trim().split(/\s+/);
                    s.first_name = nameParts[0] || '';
                    s.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
                }
            });
            
            // Fetch enrichment data only for current page (parallel)
            const studentIds = studentsData.map(s => s.id);
            await Promise.all([
                fetchFeesProgress(studentIds),
                fetchHostelAssignments(studentIds),
                fetchTransportAssignments(studentIds)
            ]);
        }
        
        setStudents(studentsData || []);
        setSelectedStudents([]);
        setLoading(false);
    };

    // Auto-search when filters change (class/section/status/date/pageSize/session)
    useEffect(() => {
        if (initialLoadDone && branchId && currentSessionId) {
            handleSearch(1);
        }
    }, [initialLoadDone, filters.class_id, filters.section_id, filters.status, filters.dateFilter, filters.dateFrom, filters.dateTo, pageSize, currentSessionId]);

    // Debounced server-side keyword search (500ms)
    useEffect(() => {
        if (!initialLoadDone || !branchId || !currentSessionId) return;
        const timer = setTimeout(() => handleSearch(1), 500);
        return () => clearTimeout(timer);
    }, [filters.keyword]);

    // Fetch fees progress for students from unified fee ledger
    const fetchFeesProgress = async (studentIds) => {
        try {
            // Get all fee ledger entries for students (includes academic, transport, hostel fees)
            const { data: ledgerEntries } = await supabase
                .from('student_fee_ledger')
                .select('student_id, net_amount, paid_amount, discount_amount, fine_amount, balance')
                .in('student_id', studentIds)
                .eq('session_id', currentSessionId);
            
            // Calculate progress per student
            const progressMap = {};
            studentIds.forEach(id => {
                progressMap[id] = { total: 0, paid: 0, discount: 0, fine: 0, balance: 0, progress: 0 };
            });
            
            // Sum up fees from ledger entries
            if (ledgerEntries) {
                ledgerEntries.forEach(entry => {
                    if (progressMap[entry.student_id]) {
                        progressMap[entry.student_id].total += parseFloat(entry.net_amount || 0);
                        progressMap[entry.student_id].paid += parseFloat(entry.paid_amount || 0);
                        progressMap[entry.student_id].discount += parseFloat(entry.discount_amount || 0);
                        progressMap[entry.student_id].fine += parseFloat(entry.fine_amount || 0);
                        progressMap[entry.student_id].balance += parseFloat(entry.balance || 0);
                    }
                });
            }
            
            // Calculate progress percentage
            Object.keys(progressMap).forEach(id => {
                const { total, paid, discount, fine } = progressMap[id];
                const totalDue = total + fine;
                progressMap[id].progress = totalDue > 0 ? Math.min(100, Math.round(((paid + discount) / totalDue) * 100)) : 0;
            });
            
            setFeesData(progressMap);
        } catch (error) {
            console.error('Error fetching fees progress:', error);
        }
    };

    // Fetch hostel assignments for students
    const fetchHostelAssignments = async (studentIds) => {
        try {
            const { data: hostelData } = await supabase
                .from('student_hostel_details')
                .select('student_id, room_id, room_number, hostel:hostels(name)')
                .in('student_id', studentIds);
            
            const hostelMap = {};
            if (hostelData) {
                hostelData.forEach(h => {
                    hostelMap[h.student_id] = {
                        hostel_name: h.hostel?.name || 'Hostel',
                        room_no: h.room_number || '-'
                    };
                });
            }
            setHostelAssignments(hostelMap);
        } catch (error) {
            console.error('Error fetching hostel assignments:', error);
        }
    };

    // Fetch transport assignments for students
    const fetchTransportAssignments = async (studentIds) => {
        try {
            const { data: transportData } = await supabase
                .from('student_transport_details')
                .select('student_id, route:transport_routes(route_title), pickup:transport_pickup_points(name)')
                .in('student_id', studentIds);
            
            const transportMap = {};
            if (transportData) {
                transportData.forEach(t => {
                    transportMap[t.student_id] = {
                        route: t.route?.route_title || 'Transport',
                        pickup_point: t.pickup?.name || '-'
                    };
                });
            }
            setTransportAssignments(transportMap);
        } catch (error) {
            console.error('Error fetching transport assignments:', error);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        if(key === 'class_id') setFilters(prev => ({ ...prev, section_id: '' }));
    };

    const toggleSelectAll = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(s => s.id));
        }
    };

    const toggleSelectStudent = (id) => {
        setSelectedStudents(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
    };

    // Handle Disable Student
    const handleDisableStudent = async () => {
        if (!studentToDisable || !disableFormData.reason_id) {
            toast({ variant: 'destructive', title: 'Please select a disable reason' });
            return;
        }
        setDisableLoading(true);
        
        const { error } = await supabase
            .from('student_profiles')
            .update({
                is_disabled: true,
                disabled_at: new Date().toISOString(),
                disable_reason_id: disableFormData.reason_id,
                disable_note: disableFormData.note || null,
                status: 'Inactive'
            })
            .eq('id', studentToDisable.id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error disabling student', description: error.message });
        } else {
            toast({ title: 'Success', description: `${studentToDisable.full_name} has been disabled` });
            // If status filter is 'active', remove from list
            if (filters.status === 'active') {
                setStudents(prev => prev.filter(s => s.id !== studentToDisable.id));
            } else {
                // Update the student in the list
                setStudents(prev => prev.map(s => 
                    s.id === studentToDisable.id ? { ...s, is_disabled: true } : s
                ));
            }
        }
        
        setDisableLoading(false);
        setIsDisableDialogOpen(false);
        setStudentToDisable(null);
        setDisableFormData({ reason_id: '', note: '' });
    };

    // Handle Re-Enable Student
    const handleEnableStudent = async (student) => {
        if (!window.confirm(`Are you sure you want to re-enable ${student.full_name}?`)) return;
        
        const { error } = await supabase
            .from('student_profiles')
            .update({
                is_disabled: false,
                disabled_at: null,
                disable_reason_id: null,
                disable_note: null,
                status: 'Active'
            })
            .eq('id', student.id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error enabling student', description: error.message });
        } else {
            toast({ title: 'Success', description: `${student.full_name} has been re-enabled` });
            // If status filter is 'inactive', remove from list
            if (filters.status === 'inactive') {
                setStudents(prev => prev.filter(s => s.id !== student.id));
            } else {
                // Update the student in the list
                setStudents(prev => prev.map(s => 
                    s.id === student.id ? { ...s, is_disabled: false } : s
                ));
            }
        }
    };

    const getGuardianInfo = (student) => {
        const name = student.father_name || student.guardian_name || '-';
        const phone = student.father_phone || student.guardian_phone || '';
        return { name, phone };
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    Student List
                </h1>
                {selectedStudents.length > 0 && (
                    <Button variant="destructive" onClick={handleBulkDelete}>
                        <Trash2 className="mr-2 h-4 w-4" /> Bulk Delete ({selectedStudents.length})
                    </Button>
                )}
            </div>

            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Class</label>
                            <Select value={filters.class_id} onValueChange={v => handleFilterChange('class_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Section</label>
                            <Select value={filters.section_id} onValueChange={v => handleFilterChange('section_id', v)} disabled={!filters.class_id || filters.class_id === 'all'}>
                                <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sections</SelectItem>
                                    {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Status</label>
                            <Select value={filters.status} onValueChange={v => handleFilterChange('status', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            Active
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                            Disabled
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="all">All Students</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5" /> Admission Period
                            </label>
                            <Select value={filters.dateFilter} onValueChange={v => handleFilterChange('dateFilter', v)}>
                                <SelectTrigger><SelectValue placeholder="Select Period" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="last7days">Last 7 Days</SelectItem>
                                    <SelectItem value="last30days">Last 30 Days</SelectItem>
                                    <SelectItem value="thisMonth">This Month</SelectItem>
                                    <SelectItem value="custom">Custom Range</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {filters.dateFilter === 'custom' && (
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                                <label className="text-sm font-medium mb-1 block">From Date</label>
                                <Input type="date" value={filters.dateFrom} onChange={e => handleFilterChange('dateFrom', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">To Date</label>
                                <Input type="date" value={filters.dateTo} onChange={e => handleFilterChange('dateTo', e.target.value)} />
                            </div>
                        </div>
                    )}
                    <div className="flex gap-4 mt-3 items-end">
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-1 block">Search</label>
                            <Input placeholder="Search by name, admission no, phone, father name..." value={filters.keyword} onChange={e => handleFilterChange('keyword', e.target.value)} />
                        </div>
                        <Button onClick={() => handleSearch(currentPage)} disabled={loading} className="h-10">
                            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />{loading ? 'Loading...' : 'Refresh'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {(totalCount > 0 || students.length > 0) && (
                <Card>
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" title="Copy" onClick={handleCopyToClipboard}><Copy className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" title="Excel" onClick={handleExportExcel}><FileDown className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" title="Print" onClick={handlePrint}><Printer className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" title="Columns"><LayoutGrid className="h-4 w-4" /></Button>
                            <span className="text-sm text-muted-foreground ml-2">
                                Total: {totalCount} students | Page {currentPage} of {totalPages || 1}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input 
                                placeholder="Quick search..." 
                                className="w-64 h-8" 
                                value={filters.keyword} 
                                onChange={e => handleFilterChange('keyword', e.target.value)} 
                            />
                            {filters.keyword && (
                                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleFilterChange('keyword', '')}>
                                    ?
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr className="border-b">
                                    <th className="p-3 w-10"><Checkbox checked={selectedStudents.length === students.length && students.length > 0} onCheckedChange={toggleSelectAll} /></th>
                                    <th className="p-3 text-left font-medium">Photo</th>
                                    <th className="p-3 text-left font-medium">Name</th>
                                    <th className="p-3 text-left font-medium">Class</th>
                                    <th className="p-3 text-left font-medium">Section</th>
                                    <th className="p-3 text-left font-medium">Gender</th>
                                    <th className="p-3 text-left font-medium">Mobile No</th>
                                    <th className="p-3 text-left font-medium">Enroll ID</th>
                                    <th className="p-3 text-left font-medium">Roll</th>
                                    <th className="p-3 text-left font-medium">Age</th>
                                    <th className="p-3 text-left font-medium">Father/Guardian</th>
                                    <th className="p-3 text-center font-medium">Hostel</th>
                                    <th className="p-3 text-center font-medium">Transport</th>
                                    <th className="p-3 text-left font-medium">Fees Progress</th>
                                    <th className="p-3 text-center font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s) => {
                                    const guardian = getGuardianInfo(s);
                                    const age = calculateAge(s.date_of_birth);
                                    const studentFees = feesData[s.id] || { total: 0, paid: 0, discount: 0, fine: 0, refunded: 0, balance: 0, progress: 0 };
                                    const feesProgress = studentFees.progress;
                                    
                                    return (
                                        <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="p-3"><Checkbox checked={selectedStudents.includes(s.id)} onCheckedChange={() => toggleSelectStudent(s.id)} /></td>
                                            <td className="p-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={s.photo_url} alt={s.full_name} className="object-cover" />
                                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">{s.first_name?.charAt(0)}{s.last_name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-primary hover:underline cursor-pointer" onClick={() => navigate(`/${basePath}/student-information/profile/${s.id}`)}>{highlightText(s.full_name, filters.keyword)}</span>
                                                    {s.is_disabled && (
                                                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-700 rounded dark:bg-red-900 dark:text-red-300">
                                                            DISABLED
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3">{highlightText(s.class?.name, filters.keyword)}</td>
                                            <td className="p-3">{highlightText(s.section?.name, filters.keyword)}</td>
                                            <td className="p-3">{highlightText(s.gender, filters.keyword)}</td>
                                            <td className="p-3">{highlightText(s.phone, filters.keyword) || '-'}</td>
                                            <td className="p-3">
                                                <div>
                                                    <span className="font-medium">{highlightText(s.enrollment_id, filters.keyword)}</span>
                                                    <div className="text-xs text-muted-foreground">{s.admission_date ? formatDate(s.admission_date) : ''}</div>
                                                </div>
                                            </td>
                                            <td className="p-3">{highlightText(s.roll_number, filters.keyword) || '-'}</td>
                                            <td className="p-3">{age}</td>
                                            <td className="p-3">
                                                <div>
                                                    <span>{highlightText(guardian.name, filters.keyword)}</span>
                                                    {guardian.phone && <div className="text-xs text-emerald-600 dark:text-emerald-400">{highlightText(guardian.phone, filters.keyword)}</div>}
                                                </div>
                                            </td>
                                            <td className="p-3 text-center">
                                                {hostelAssignments[s.id] ? (
                                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full dark:bg-purple-900 dark:text-purple-300" title={`${hostelAssignments[s.id].hostel_name} - Room ${hostelAssignments[s.id].room_no}`}>
                                                        <Home className="h-3.5 w-3.5" />
                                                        <span className="text-xs font-medium">Yes</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                {transportAssignments[s.id] ? (
                                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900 dark:text-blue-300" title={`${transportAssignments[s.id].route} - ${transportAssignments[s.id].pickup_point}`}>
                                                        <Bus className="h-3.5 w-3.5" />
                                                        <span className="text-xs font-medium">Yes</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="p-3 min-w-[180px]">
                                                <div className="space-y-1" title={`Total: ?${studentFees.total.toLocaleString()} | Paid: ?${studentFees.paid.toLocaleString()} | Balance: ?${studentFees.balance.toLocaleString()}`}>
                                                    <div className="flex items-center gap-2">
                                                        <Progress 
                                                            value={feesProgress} 
                                                            className={`h-2 flex-1 ${feesProgress === 100 ? '[&>div]:bg-green-500' : feesProgress > 0 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-400'}`} 
                                                        />
                                                        <span className={`text-xs font-medium w-10 ${feesProgress === 100 ? 'text-green-600 dark:text-green-400' : feesProgress > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>{feesProgress}%</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-green-600 dark:text-green-400">?{studentFees.paid.toLocaleString('en-IN')}</span>
                                                        <span className="text-muted-foreground">/</span>
                                                        <span className="text-muted-foreground">?{studentFees.total.toLocaleString('en-IN')}</span>
                                                    </div>
                                                    {/* Show discount, fine, and refund if present */}
                                                    <div className="flex flex-wrap gap-1 text-[10px]">
                                                        {studentFees.discount > 0 && (
                                                            <span className="text-amber-600 dark:text-amber-400" title="Discount">D:?{studentFees.discount.toLocaleString('en-IN')}</span>
                                                        )}
                                                        {studentFees.fine > 0 && (
                                                            <span className="text-orange-600 dark:text-orange-400" title="Fine">F:?{studentFees.fine.toLocaleString('en-IN')}</span>
                                                        )}
                                                        {studentFees.refunded > 0 && (
                                                            <span className="text-blue-600 dark:text-blue-400" title="Refund">R:?{studentFees.refunded.toLocaleString('en-IN')}</span>
                                                        )}
                                                    </div>
                                                    {studentFees.balance > 0 && (
                                                        <div className="text-xs text-red-600 dark:text-red-400 font-medium">Due: ?{studentFees.balance.toLocaleString('en-IN')}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-500/20 dark:hover:bg-blue-500/30" onClick={() => navigate(`/${basePath}/student-information/profile/${s.id}`)} title="View">
                                                        <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    </Button>
                                                    {canEdit('student_information.student_details') && (
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-orange-500/10 hover:bg-orange-500/20 dark:bg-orange-500/20 dark:hover:bg-orange-500/30" onClick={() => navigate(`/${basePath}/student-information/edit/${s.id}`)} title="Edit">
                                                            <Edit className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                                        </Button>
                                                    )}
                                                    {canEdit('student_information.student_details') && (
                                                        s.is_disabled ? (
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-green-500/10 hover:bg-green-500/20 dark:bg-green-500/20 dark:hover:bg-green-500/30" onClick={() => handleEnableStudent(s)} title="Re-Enable">
                                                                <RefreshCcw className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                            </Button>
                                                        ) : (
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-red-500/10 hover:bg-red-500/20 dark:bg-red-500/20 dark:hover:bg-red-500/30" onClick={() => { setStudentToDisable(s); setIsDisableDialogOpen(true); }} title="Disable">
                                                                <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                            </Button>
                                                        )
                                                    )}
                                                    {canDelete('student_information.student_details') && (
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-red-500/10 hover:bg-red-500/20 dark:bg-red-500/20 dark:hover:bg-red-500/30" onClick={() => handleDelete(s.id)} title="Delete">
                                                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {totalCount > 0 && (
                        <div className="flex items-center justify-between p-4 border-t">
                            <span className="text-sm text-muted-foreground">Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries</span>
                            <div className="flex items-center gap-2">
                                <Select value={pageSize.toString()} onValueChange={v => { setPageSize(Number(v)); }}>
                                    <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleSearch(Math.max(1, currentPage - 1))} disabled={currentPage === 1 || loading}><ChevronLeft className="h-4 w-4" /></Button>
                                <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm font-medium">{currentPage}/{totalPages || 1}</span>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleSearch(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages || loading}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        </div>
                    )}
                </Card>
            )}

            {loading && students.length === 0 && (
                <Card className="p-10">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Loader2 className="h-10 w-10 animate-spin mb-4" />
                        <p className="text-sm">Loading students...</p>
                    </div>
                </Card>
            )}

            {students.length === 0 && !loading && (
                <Card className="p-10">
                    <div className="text-center text-muted-foreground">
                        {filters.keyword ? (
                            <>
                                <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p>No students match "{filters.keyword}"</p>
                                <Button variant="link" className="mt-2" onClick={() => handleFilterChange('keyword', '')}>
                                    Clear search
                                </Button>
                            </>
                        ) : filters.dateFilter !== 'all' ? (
                            <>
                                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p>No students found for the selected date range.</p>
                                <Button variant="link" className="mt-2" onClick={() => handleFilterChange('dateFilter', 'all')}>
                                    Show all dates
                                </Button>
                            </>
                        ) : (
                            <>
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p>No students found for the selected filters.</p>
                            </>
                        )}
                    </div>
                </Card>
            )}

            {/* Disable Student Dialog */}
            <Dialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserX className="h-5 w-5 text-red-500" />
                            Disable Student
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="font-medium">{studentToDisable?.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                                {studentToDisable?.class?.name}-{studentToDisable?.section?.name} | {studentToDisable?.enrollment_id}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="disable-reason">Reason *</Label>
                            <Select 
                                value={disableFormData.reason_id} 
                                onValueChange={v => setDisableFormData(prev => ({ ...prev, reason_id: v }))}
                            >
                                <SelectTrigger id="disable-reason">
                                    <SelectValue placeholder="Select a reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    {disableReasons.map(r => (
                                        <SelectItem key={r.id} value={r.id}>{r.reason}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {disableReasons.length === 0 && (
                                <p className="text-xs text-amber-600">No reasons configured. Please add reasons in Disable Reason page first.</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="disable-note">Additional Note (Optional)</Label>
                            <Textarea 
                                id="disable-note"
                                value={disableFormData.note}
                                onChange={e => setDisableFormData(prev => ({ ...prev, note: e.target.value }))}
                                placeholder="Any additional information..."
                                rows={3}
                            />
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                <strong>Warning:</strong> Disabled students will not appear in attendance, fees, or other modules.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDisableDialogOpen(false)} disabled={disableLoading}>
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDisableStudent} 
                            disabled={disableLoading || !disableFormData.reason_id}
                        >
                            {disableLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserX className="mr-2 h-4 w-4" />}
                            Disable Student
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default StudentDetails;
