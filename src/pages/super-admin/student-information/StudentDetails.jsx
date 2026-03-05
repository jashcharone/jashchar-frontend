import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Search, Eye, Edit, Trash2, Users, Copy, FileDown, Printer, LayoutGrid, ChevronLeft, ChevronRight, UserX, Loader2, RefreshCcw, Bus, Home } from 'lucide-react';
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
    const [filters, setFilters] = useState({ class_id: 'all', section_id: '', keyword: '', status: 'active' });
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [feesData, setFeesData] = useState({}); // { studentId: { total, paid, progress } }
    const [initialLoadDone, setInitialLoadDone] = useState(false); // For auto-load on page open
    const [allStudents, setAllStudents] = useState([]); // Store all fetched students for client-side filtering
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

    // ✅ FIX: Use selectedBranch.id OR fallback to user profile/metadata branch_id
    const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

    const calculateAge = (dob) => {
        if (!dob) return '-';
        return differenceInYears(new Date(), new Date(dob));
    };

    // 🔍 Highlight search text in results
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

    // Client-side instant search filter
    const filteredStudents = useMemo(() => {
        if (!filters.keyword || !filters.keyword.trim()) {
            return allStudents;
        }
        const keyword = filters.keyword.toLowerCase().trim();
        return allStudents.filter(s => {
            const fullName = (s.full_name || `${s.first_name || ''} ${s.last_name || ''}`).toLowerCase();
            const schoolCode = (s.school_code || '').toLowerCase();
            const rollNumber = (s.roll_number || '').toLowerCase();
            const phone = (s.phone || '').toLowerCase();
            const fatherName = (s.father_name || '').toLowerCase();
            return fullName.includes(keyword) || 
                   schoolCode.includes(keyword) || 
                   rollNumber.includes(keyword) || 
                   phone.includes(keyword) ||
                   fatherName.includes(keyword);
        });
    }, [allStudents, filters.keyword]);

    // Update students display when filtered results change
    useEffect(() => {
        setStudents(filteredStudents);
    }, [filteredStudents]);

    const handleSearch = async () => {
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
        
        // Only add class filter if specific class selected (not 'all')
        if (filters.class_id && filters.class_id !== 'all') {
            studentQuery = studentQuery.eq('class_id', filters.class_id);
        }
        
        if (filters.section_id && filters.section_id !== 'all') {
            studentQuery = studentQuery.eq('section_id', filters.section_id);
        }

        // NOTE: Keyword search is done client-side for instant results
        // No server-side keyword filter needed

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
            await fetchHostelAssignments(studentIds);
            await fetchTransportAssignments(studentIds);
        } else {
            toast({ title: "No students found." });
        }
        
        // Store all students for client-side instant search
        setAllStudents(studentsData || []);
        setStudents(studentsData || []);
        setSelectedStudents([]);
        setLoading(false);
    };

    // Auto-search: Trigger search automatically on page load (with 'all' classes default)
    useEffect(() => {
        if (initialLoadDone && filters.class_id === 'all' && students.length === 0 && !loading) {
            handleSearch();
        }
    }, [initialLoadDone]);

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
            
            // Get payments for students including discount and fine
            const { data: payments } = await supabase
                .from('fee_payments')
                .select('student_id, amount, discount_amount, fine_paid')
                .in('student_id', studentIds)
                .is('reverted_at', null);
            
            // Get transport details for fee calculation
            const { data: transportDetails } = await supabase
                .from('student_transport_details')
                .select('student_id, monthly_fee')
                .in('student_id', studentIds);
            
            // Get transport payments
            const { data: transportPayments } = await supabase
                .from('transport_fee_payments')
                .select('student_id, amount, discount_amount, fine_paid')
                .in('student_id', studentIds)
                .is('reverted_at', null);
            
            // Get hostel details for fee calculation
            const { data: hostelDetails } = await supabase
                .from('student_hostel_details')
                .select('student_id, hostel_fee, billing_cycle')
                .in('student_id', studentIds);
            
            // Get hostel payments
            const { data: hostelPayments } = await supabase
                .from('hostel_fee_payments')
                .select('student_id, amount, discount_amount, fine_paid')
                .in('student_id', studentIds)
                .is('reverted_at', null);
            
            // Get approved refunds
            const { data: refunds } = await supabase
                .from('fee_refunds')
                .select('student_id, refund_amount')
                .in('student_id', studentIds)
                .eq('status', 'approved');
            
            // Calculate progress per student
            const progressMap = {};
            studentIds.forEach(id => {
                progressMap[id] = { total: 0, paid: 0, discount: 0, fine: 0, refunded: 0, balance: 0, progress: 0 };
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
            
            // Add transport fees to total (monthly * 12)
            if (transportDetails) {
                transportDetails.forEach(t => {
                    if (progressMap[t.student_id]) {
                        progressMap[t.student_id].total += parseFloat(t.monthly_fee || 0) * 12;
                    }
                });
            }
            
            // Add hostel fees to total based on billing cycle
            if (hostelDetails) {
                hostelDetails.forEach(h => {
                    const fee = parseFloat(h.hostel_fee || 0);
                    const billingCycle = h.billing_cycle || 'monthly';
                    let totalHostelFee = fee;
                    if (billingCycle === 'monthly') totalHostelFee = fee * 12;
                    else if (billingCycle === 'quarterly') totalHostelFee = fee * 4;
                    else if (billingCycle === 'half_yearly') totalHostelFee = fee * 2;
                    if (progressMap[h.student_id]) {
                        progressMap[h.student_id].total += totalHostelFee;
                    }
                });
            }
            
            // Sum up paid amount, discount and fine from academic payments
            if (payments) {
                payments.forEach(pay => {
                    if (progressMap[pay.student_id]) {
                        progressMap[pay.student_id].paid += parseFloat(pay.amount || 0);
                        progressMap[pay.student_id].discount += parseFloat(pay.discount_amount || 0);
                        progressMap[pay.student_id].fine += parseFloat(pay.fine_paid || 0);
                    }
                });
            }
            
            // Add transport payments
            if (transportPayments) {
                transportPayments.forEach(pay => {
                    if (progressMap[pay.student_id]) {
                        progressMap[pay.student_id].paid += parseFloat(pay.amount || 0);
                        progressMap[pay.student_id].discount += parseFloat(pay.discount_amount || 0);
                        progressMap[pay.student_id].fine += parseFloat(pay.fine_paid || 0);
                    }
                });
            }
            
            // Add hostel payments
            if (hostelPayments) {
                hostelPayments.forEach(pay => {
                    if (progressMap[pay.student_id]) {
                        progressMap[pay.student_id].paid += parseFloat(pay.amount || 0);
                        progressMap[pay.student_id].discount += parseFloat(pay.discount_amount || 0);
                        progressMap[pay.student_id].fine += parseFloat(pay.fine_paid || 0);
                    }
                });
            }
            
            // Add refunds
            if (refunds) {
                refunds.forEach(refund => {
                    if (progressMap[refund.student_id]) {
                        progressMap[refund.student_id].refunded += parseFloat(refund.refund_amount || 0);
                    }
                });
            }
            
            // Calculate balance and progress
            // Balance = Total + Fine - Paid - Discount + Refunded
            Object.keys(progressMap).forEach(id => {
                const { total, paid, discount, fine, refunded } = progressMap[id];
                progressMap[id].balance = Math.max(0, total + fine - paid - discount + refunded);
                progressMap[id].progress = (total + fine) > 0 ? Math.min(100, Math.round(((paid + discount) / (total + fine)) * 100)) : 0;
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
                .select('student_id, room_no, hostel:hostels(name)')
                .in('student_id', studentIds);
            
            const hostelMap = {};
            if (hostelData) {
                hostelData.forEach(h => {
                    hostelMap[h.student_id] = {
                        hostel_name: h.hostel?.name || 'Hostel',
                        room_no: h.room_no || '-'
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
        if(key === 'class_id') setFilters(prev => ({ ...prev, section_id: ''}));
        // Reset to page 1 when search keyword changes for instant search
        if(key === 'keyword') setCurrentPage(1);
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
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium mb-1 block">Instant Search</label>
                            <Input placeholder="Type any letter to search..." value={filters.keyword} onChange={e => handleFilterChange('keyword', e.target.value)} />
                        </div>
                        <Button onClick={handleSearch} disabled={loading} className="h-10">
                            <RefreshCcw className="mr-2 h-4 w-4" />{loading ? 'Loading...' : 'Refresh'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {allStudents.length > 0 && (
                <Card>
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2">
                            {/* TC-11 FIX: Added onClick handlers for export icons */}
                            <Button variant="outline" size="sm" title="Copy" onClick={handleCopyToClipboard}><Copy className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" title="Excel" onClick={handleExportExcel}><FileDown className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" title="Print" onClick={handlePrint}><Printer className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" title="Columns"><LayoutGrid className="h-4 w-4" /></Button>
                            <span className="text-sm text-muted-foreground ml-2">
                                {filters.keyword 
                                    ? `Showing ${students.length} of ${allStudents.length} students` 
                                    : `Total: ${allStudents.length} students`}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input 
                                placeholder="Type to search instantly..." 
                                className="w-64 h-8" 
                                value={filters.keyword} 
                                onChange={e => handleFilterChange('keyword', e.target.value)} 
                            />
                            {filters.keyword && (
                                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleFilterChange('keyword', '')}>
                                    ✕
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
                                    <th className="p-3 text-left font-medium">Admission No</th>
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
                                {paginatedStudents.map((s) => {
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
                                                    <span className="font-medium">{highlightText(s.school_code, filters.keyword)}</span>
                                                    <div className="text-xs text-muted-foreground">{s.admission_date ? format(new Date(s.admission_date), 'dd MMM yyyy') : ''}</div>
                                                </div>
                                            </td>
                                            <td className="p-3">{highlightText(s.roll_number, filters.keyword) || '-'}</td>
                                            <td className="p-3">{age}</td>
                                            <td className="p-3">
                                                <div>
                                                    <span>{highlightText(guardian.name, filters.keyword)}</span>
                                                    {guardian.phone && <div className="text-xs text-emerald-600">{highlightText(guardian.phone, filters.keyword)}</div>}
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
                                                <div className="space-y-1" title={`Total: ₹${studentFees.total.toLocaleString()} | Paid: ₹${studentFees.paid.toLocaleString()} | Balance: ₹${studentFees.balance.toLocaleString()}`}>
                                                    <div className="flex items-center gap-2">
                                                        <Progress 
                                                            value={feesProgress} 
                                                            className={`h-2 flex-1 ${feesProgress === 100 ? '[&>div]:bg-green-500' : feesProgress > 0 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-400'}`} 
                                                        />
                                                        <span className={`text-xs font-medium w-10 ${feesProgress === 100 ? 'text-green-600' : feesProgress > 0 ? 'text-amber-600' : 'text-red-500'}`}>{feesProgress}%</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-green-600">₹{studentFees.paid.toLocaleString('en-IN')}</span>
                                                        <span className="text-muted-foreground">/</span>
                                                        <span className="text-muted-foreground">₹{studentFees.total.toLocaleString('en-IN')}</span>
                                                    </div>
                                                    {/* Show discount, fine, and refund if present */}
                                                    <div className="flex flex-wrap gap-1 text-[10px]">
                                                        {studentFees.discount > 0 && (
                                                            <span className="text-amber-600" title="Discount">D:₹{studentFees.discount.toLocaleString('en-IN')}</span>
                                                        )}
                                                        {studentFees.fine > 0 && (
                                                            <span className="text-orange-600" title="Fine">F:₹{studentFees.fine.toLocaleString('en-IN')}</span>
                                                        )}
                                                        {studentFees.refunded > 0 && (
                                                            <span className="text-blue-600" title="Refund">R:₹{studentFees.refunded.toLocaleString('en-IN')}</span>
                                                        )}
                                                    </div>
                                                    {studentFees.balance > 0 && (
                                                        <div className="text-xs text-red-600 font-medium">Due: ₹{studentFees.balance.toLocaleString('en-IN')}</div>
                                                    )}
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

                    {students.length > 0 && (
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
                    )}
                </Card>
            )}

            {students.length === 0 && !loading && allStudents.length === 0 && (
                <Card className="p-10">
                    <div className="text-center text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>No students found. Click Refresh to load students.</p>
                    </div>
                </Card>
            )}

            {students.length === 0 && !loading && allStudents.length > 0 && filters.keyword && (
                <Card className="p-10">
                    <div className="text-center text-muted-foreground">
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>No students match "{filters.keyword}"</p>
                        <Button variant="link" className="mt-2" onClick={() => handleFilterChange('keyword', '')}>
                            Clear search
                        </Button>
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
