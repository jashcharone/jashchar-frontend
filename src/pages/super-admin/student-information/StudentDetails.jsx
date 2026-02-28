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
import { Search, Eye, Edit, Trash2, Users, Copy, FileDown, Printer, LayoutGrid, ChevronLeft, ChevronRight, UserX, Loader2, RefreshCcw } from 'lucide-react';
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
    const [filters, setFilters] = useState({ class_id: '', section_id: '', keyword: '', status: 'active' });
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [feesData, setFeesData] = useState({}); // { studentId: { total, paid, progress } }
    const [initialLoadDone, setInitialLoadDone] = useState(false); // For auto-load on page open
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

    // ✅ FIX: Use selectedBranch.id OR fallback to user profile/metadata branch_id
    const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

    const calculateAge = (dob) => {
        if (!dob) return '-';
        return differenceInYears(new Date(), new Date(dob));
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
            s.school_code || '',
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
            s.school_code || '',
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
                    <td>${s.school_code || ''}</td>
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

    // Auto-load: Select first class and trigger search when classes are loaded
    useEffect(() => {
        if (classes.length > 0 && !initialLoadDone && !filters.class_id) {
            const firstClassId = classes[0].id;
            setFilters(prev => ({ ...prev, class_id: firstClassId }));
            setInitialLoadDone(true);
        }
    }, [classes, initialLoadDone, filters.class_id]);

    useEffect(() => {
        if (filters.class_id) {
            const fetchSections = async () => {
                const { data } = await supabase.from('class_sections').select('sections(id, name)').eq('class_id', filters.class_id);
                const sectionsList = data ? data.map(item => item.sections).filter(Boolean) : [];
                setSections(sortSections(sectionsList));
            };
            fetchSections();
        } else {
            setSections([]);
        }
    }, [filters.class_id]);

    const handleSearch = async () => {
        // TC-10 FIX: Allow searching by keyword (min 2 chars) without class filter OR just class selection
        const isQuickSearch = filters.keyword && filters.keyword.length >= 2;
        
        if (!filters.class_id && !isQuickSearch) {
            toast({ variant: 'destructive', title: 'Please select a class or enter a search term (min 2 chars).' });
            return;
        }
        setLoading(true);
        
        // Use session from header dropdown (currentSessionId) — this respects user's session selection
        const activeSessionId = currentSessionId;

        let studentQuery = supabase.from('student_profiles').select(`
            id, full_name, first_name, last_name, school_code, roll_number, gender, date_of_birth, phone, photo_url,
            father_name, father_phone, guardian_name, guardian_phone, admission_date, session_id, is_disabled,
            class:classes!student_profiles_class_id_fkey( name ),
            section:sections!student_profiles_section_id_fkey( name )
        `, { count: 'exact' })
        .eq('branch_id', branchId)
        .order('roll_number', { ascending: true, nullsFirst: false });
        
        // Apply status filter (Active/Inactive/All)
        if (filters.status === 'active') {
            studentQuery = studentQuery.or('is_disabled.is.null,is_disabled.eq.false');
        } else if (filters.status === 'inactive') {
            studentQuery = studentQuery.eq('is_disabled', true);
        }
        // If status is 'all', no filter applied
        
        // Filter by branch's active session (not user's session)
        if (activeSessionId) {
            studentQuery = studentQuery.eq('session_id', activeSessionId);
        }
        
        // Only add class filter if selected
        if (filters.class_id) {
            studentQuery = studentQuery.eq('class_id', filters.class_id);
        }
        
        if (filters.section_id && filters.section_id !== 'all') {
            studentQuery = studentQuery.eq('section_id', filters.section_id);
        }

        if (filters.keyword) {
            studentQuery = studentQuery.or(`full_name.ilike.%${filters.keyword}%,school_code.ilike.%${filters.keyword}%,roll_number.ilike.%${filters.keyword}%,phone.ilike.%${filters.keyword}%`);
        }

        const { data: studentsData, error: studentsError, count } = await studentQuery;

        if (studentsError) {
            toast({ variant: 'destructive', title: 'Error fetching students', description: studentsError.message });
            setLoading(false);
            setStudents([]);
            return;
        }
        
        if (studentsData && studentsData.length > 0) {
            toast({ title: `${count || 0} students found.`});
            
            // TC-32 FIX: Derive first_name and last_name from full_name if not present
            // This handles cases where older student records may not have these fields populated separately
            studentsData.forEach(s => {
                if (!s.first_name && s.full_name) {
                    const nameParts = s.full_name.trim().split(/\s+/);
                    s.first_name = nameParts[0] || '';
                    s.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
                }
            });
            
            // Fetch fees progress for all students
            const studentIds = studentsData.map(s => s.id);
            await fetchFeesProgress(studentIds);
        } else {
            toast({ title: "No students found." });
        }
        
        setStudents(studentsData || []);
        setSelectedStudents([]);
        setLoading(false);
    };

    // Auto-search: Trigger search automatically when first class is auto-selected on page load
    useEffect(() => {
        if (initialLoadDone && filters.class_id && students.length === 0 && !loading) {
            handleSearch();
        }
    }, [initialLoadDone, filters.class_id]);

    // Re-fetch when session changes from header dropdown
    useEffect(() => {
        if (currentSessionId && initialLoadDone && filters.class_id) {
            handleSearch();
        }
    }, [currentSessionId]);

    // Fetch fees progress for students
    const fetchFeesProgress = async (studentIds) => {
        try {
            // Get allocations for students (correct table name: student_fee_allocations)
            const { data: allocations } = await supabase
                .from('student_fee_allocations')
                .select(`
                    id,
                    student_id,
                    fee_master:fee_masters(amount)
                `)
                .in('student_id', studentIds);
            
            // Get payments for students (fee_payments has no status column, filter by reverted_at being null)
            const { data: payments } = await supabase
                .from('fee_payments')
                .select('student_id, amount')
                .in('student_id', studentIds)
                .is('reverted_at', null);
            
            // Calculate progress per student
            const progressMap = {};
            studentIds.forEach(id => {
                progressMap[id] = { total: 0, paid: 0, progress: 0 };
            });
            
            // Sum up total fees from allocations
            if (allocations) {
                allocations.forEach(alloc => {
                    const amount = alloc.fee_master?.amount || 0;
                    if (progressMap[alloc.student_id]) {
                        progressMap[alloc.student_id].total += parseFloat(amount);
                    }
                });
            }
            
            // Sum up paid amount from payments
            if (payments) {
                payments.forEach(pay => {
                    if (progressMap[pay.student_id]) {
                        progressMap[pay.student_id].paid += parseFloat(pay.amount || 0);
                    }
                });
            }
            
            // Calculate percentage (cap at 100% to prevent overflow from migration data)
            Object.keys(progressMap).forEach(id => {
                const { total, paid } = progressMap[id];
                progressMap[id].progress = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
            });
            
            setFeesData(progressMap);
        } catch (error) {
            console.error('Error fetching fees progress:', error);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        if(key === 'class_id') setFilters(prev => ({ ...prev, section_id: ''}));
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

    const paginatedStudents = students.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const totalPages = Math.ceil(students.length / pageSize);

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
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Class</label>
                            <Select value={filters.class_id} onValueChange={v => handleFilterChange('class_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Section</label>
                            <Select value={filters.section_id} onValueChange={v => handleFilterChange('section_id', v)} disabled={!filters.class_id}>
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
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium mb-1 block">Search</label>
                            <Input placeholder="Search by name, admission no, phone..." value={filters.keyword} onChange={e => handleFilterChange('keyword', e.target.value)} />
                        </div>
                        <Button onClick={handleSearch} disabled={loading} className="h-10">
                            <Search className="mr-2 h-4 w-4" />{loading ? 'Searching...' : 'Search'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {students.length > 0 && (
                <Card>
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2">
                            {/* TC-11 FIX: Added onClick handlers for export icons */}
                            <Button variant="outline" size="sm" title="Copy" onClick={handleCopyToClipboard}><Copy className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" title="Excel" onClick={handleExportExcel}><FileDown className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" title="Print" onClick={handlePrint}><Printer className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" title="Columns"><LayoutGrid className="h-4 w-4" /></Button>
                        </div>
                        <Input placeholder="Search..." className="w-48 h-8" value={filters.keyword} onChange={e => handleFilterChange('keyword', e.target.value)} />
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
                                    <th className="p-3 text-left font-medium">Admission No</th>
                                    <th className="p-3 text-left font-medium">Roll</th>
                                    <th className="p-3 text-left font-medium">Age</th>
                                    <th className="p-3 text-left font-medium">Father/Guardian</th>
                                    <th className="p-3 text-left font-medium">Fees Progress</th>
                                    <th className="p-3 text-center font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedStudents.map((s) => {
                                    const guardian = getGuardianInfo(s);
                                    const age = calculateAge(s.date_of_birth);
                                    const studentFees = feesData[s.id] || { total: 0, paid: 0, progress: 0 };
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
                                                    <span className="font-medium text-primary hover:underline cursor-pointer" onClick={() => navigate(`/${basePath}/student-information/profile/${s.id}`)}>{s.full_name}</span>
                                                    {s.is_disabled && (
                                                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-700 rounded dark:bg-red-900 dark:text-red-300">
                                                            DISABLED
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3">{s.class?.name}</td>
                                            <td className="p-3">{s.section?.name}</td>
                                            <td className="p-3">{s.gender}</td>
                                            <td className="p-3">{s.phone || '-'}</td>
                                            <td className="p-3">
                                                <div>
                                                    <span className="font-medium">{s.school_code}</span>
                                                    <div className="text-xs text-muted-foreground">{s.admission_date ? format(new Date(s.admission_date), 'dd MMM yyyy') : ''}</div>
                                                </div>
                                            </td>
                                            <td className="p-3">{s.roll_number || '-'}</td>
                                            <td className="p-3">{age}</td>
                                            <td className="p-3">
                                                <div>
                                                    <span>{guardian.name}</span>
                                                    {guardian.phone && <div className="text-xs text-emerald-600">{guardian.phone}</div>}
                                                </div>
                                            </td>
                                            <td className="p-3 min-w-[140px]">
                                                <div className="flex items-center gap-2" title={`Paid: ₹${studentFees.paid.toLocaleString()} / Total: ₹${studentFees.total.toLocaleString()}`}>
                                                    <Progress 
                                                        value={feesProgress} 
                                                        className={`h-2 flex-1 ${feesProgress === 100 ? '[&>div]:bg-green-500' : feesProgress > 0 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-400'}`} 
                                                    />
                                                    <span className={`text-xs font-medium w-10 ${feesProgress === 100 ? 'text-green-600' : feesProgress > 0 ? 'text-amber-600' : 'text-red-500'}`}>{feesProgress}%</span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-blue-500/10 hover:bg-blue-500/20" onClick={() => navigate(`/${basePath}/student-information/profile/${s.id}`)} title="View">
                                                        <Eye className="h-4 w-4 text-blue-600" />
                                                    </Button>
                                                    {canEdit('student_information.student_details') && (
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-orange-500/10 hover:bg-orange-500/20" onClick={() => navigate(`/${basePath}/student-information/edit/${s.id}`)} title="Edit">
                                                            <Edit className="h-4 w-4 text-orange-600" />
                                                        </Button>
                                                    )}
                                                    {canEdit('student_information.student_details') && (
                                                        s.is_disabled ? (
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-green-500/10 hover:bg-green-500/20" onClick={() => handleEnableStudent(s)} title="Re-Enable">
                                                                <RefreshCcw className="h-4 w-4 text-green-600" />
                                                            </Button>
                                                        ) : (
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-red-500/10 hover:bg-red-500/20" onClick={() => { setStudentToDisable(s); setIsDisableDialogOpen(true); }} title="Disable">
                                                                <UserX className="h-4 w-4 text-red-600" />
                                                            </Button>
                                                        )
                                                    )}
                                                    {canDelete('student_information.student_details') && (
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-red-500/10 hover:bg-red-500/20" onClick={() => handleDelete(s.id)} title="Delete">
                                                            <Trash2 className="h-4 w-4 text-red-600" />
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

                    <div className="flex items-center justify-between p-4 border-t">
                        <span className="text-sm text-muted-foreground">Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, students.length)} of {students.length} entries</span>
                        <div className="flex items-center gap-2">
                            <Select value={pageSize.toString()} onValueChange={v => { setPageSize(Number(v)); setCurrentPage(1); }}>
                                <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                                <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm font-medium">{currentPage}</span>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {students.length === 0 && !loading && (
                <Card className="p-10">
                    <div className="text-center text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>No students found. Please select a class and click Search.</p>
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
                                {studentToDisable?.class?.name}-{studentToDisable?.section?.name} | {studentToDisable?.school_code}
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
                        <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200">
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
