import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import api from '@/lib/api';
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
import { Search, Eye, Edit, Trash2, Users, Copy, FileDown, Printer, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInYears } from 'date-fns';
import { ROUTES } from '@/registry/routeRegistry';

const StudentDetails = () => {
    const { user, currentSessionId } = useAuth();
    const { canEdit, canDelete } = usePermissions();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [filters, setFilters] = useState({ class_id: '', section_id: '', keyword: '' });
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [feesData, setFeesData] = useState({}); // { studentId: { total, paid, progress } }

    const branchId = user?.profile?.branch_id;

    const calculateAge = (dob) => {
        if (!dob) return '-';
        return differenceInYears(new Date(), new Date(dob));
    };

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
        if (!branchId || !selectedBranch?.id) return;
        const fetchPrereqs = async () => {
            const { data: classData } = await supabase
                .from('classes')
                .select('id, name')
                .eq('branch_id', selectedBranch.id)
                .order('name');
            setClasses(classData || []);
        };
        fetchPrereqs();
    }, [branchId, selectedBranch]);

    useEffect(() => {
        if (filters.class_id) {
            const fetchSections = async () => {
                const { data } = await supabase.from('class_sections').select('sections(id, name)').eq('class_id', filters.class_id);
                setSections(data ? data.map(item => item.sections).filter(Boolean) : []);
            };
            fetchSections();
        } else {
            setSections([]);
        }
    }, [filters.class_id]);

    const handleSearch = async () => {
        // Allow searching by admission number without class filter (quick search)
        const isQuickSearch = filters.keyword && filters.keyword.length >= 4 && !filters.class_id;
        
        if (!filters.class_id && !isQuickSearch) {
            toast({ variant: 'destructive', title: 'Please select a class or enter admission number (min 4 chars).' });
            return;
        }
        setLoading(true);
        
        // Get active session for the SELECTED branch (not user's branch)
        const { data: branchSession } = await supabase
            .from('sessions')
            .select('id')
            .eq('branch_id', selectedBranch.id)
            .eq('is_active', true)
            .maybeSingle();
        
        const activeSessionId = branchSession?.id;
        console.log('[StudentDetails] Selected branch:', selectedBranch.id, 'Active session:', activeSessionId);

        let studentQuery = supabase.from('student_profiles').select(`
            id, full_name, first_name, last_name, school_code, roll_number, gender, date_of_birth, phone, photo_url,
            father_name, father_phone, guardian_name, guardian_phone, admission_date, session_id,
            class:classes!student_profiles_class_id_fkey( name ),
            section:sections!student_profiles_section_id_fkey( name )
        `, { count: 'exact' })
        .eq('branch_id', selectedBranch.id)
        .or('is_disabled.is.null,is_disabled.eq.false')
        .order('roll_number', { ascending: true, nullsFirst: false });
        
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

    // Fetch fees progress for students
    const fetchFeesProgress = async (studentIds) => {
        try {
            // Get allocations for students
            const { data: allocations } = await supabase
                .from('fee_allocations')
                .select(`
                    id,
                    student_id,
                    fee_master:fee_masters(amount)
                `)
                .in('student_id', studentIds);
            
            // Get payments for students
            const { data: payments } = await supabase
                .from('fee_payments')
                .select('student_id, amount')
                .in('student_id', studentIds)
                .eq('status', 'paid');
            
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
            
            // Calculate percentage
            Object.keys(progressMap).forEach(id => {
                const { total, paid } = progressMap[id];
                progressMap[id].progress = total > 0 ? Math.round((paid / total) * 100) : 0;
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
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Class *</label>
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
                            <Button variant="outline" size="sm" title="Copy"><Copy className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" title="Excel"><FileDown className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" title="Print"><Printer className="h-4 w-4" /></Button>
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
                                    <th className="p-3 text-left font-medium">Register No</th>
                                    <th className="p-3 text-left font-medium">Roll</th>
                                    <th className="p-3 text-left font-medium">Age</th>
                                    <th className="p-3 text-left font-medium">Guardian Name</th>
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
                                                <span className="font-medium text-primary hover:underline cursor-pointer" onClick={() => navigate(ROUTES.SUPER_ADMIN.STUDENT_PROFILE.replace(':studentId', s.id))}>{s.full_name}</span>
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
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-blue-500/10 hover:bg-blue-500/20" onClick={() => navigate(ROUTES.SUPER_ADMIN.STUDENT_PROFILE.replace(':studentId', s.id))} title="View">
                                                        <Eye className="h-4 w-4 text-blue-600" />
                                                    </Button>
                                                    {canEdit('student_information.student_details') && (
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-orange-500/10 hover:bg-orange-500/20" onClick={() => navigate(ROUTES.SUPER_ADMIN.EDIT_STUDENT.replace(':id', s.id))} title="Edit">
                                                            <Edit className="h-4 w-4 text-orange-600" />
                                                        </Button>
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
        </DashboardLayout>
    );
};

export default StudentDetails;
