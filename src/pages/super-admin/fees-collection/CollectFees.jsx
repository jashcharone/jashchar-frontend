import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Search, Loader2, IndianRupee, Users, AlertCircle, CheckCircle2, Clock, Phone } from 'lucide-react';


const CollectFees = () => {
    const navigate = useNavigate();
    const { roleSlug } = useParams();
    const { user, currentSessionId } = useAuth();
    const { selectedBranch, loading: branchLoading } = useBranch();
    const { toast } = useToast();
    
    // Dynamic base path for navigation
    const basePath = roleSlug || 'super-admin';
    // ✅ FIX: Use selectedBranch.id OR fallback to user profile/metadata branch_id
    const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('all');
    const [keyword, setKeyword] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [feesData, setFeesData] = useState({}); // { studentId: { total, paid, balance, progress } }

    // DEBUG: Log branch resolution
    console.log('[CollectFees] branchId:', branchId, '| selectedBranch:', selectedBranch?.id, '| branchLoading:', branchLoading);

    // ✅ FIX: Fetch classes when branchId changes - wait for branch loading to complete
    useEffect(() => {
        const fetchClasses = async () => {
            console.log('[CollectFees] fetchClasses called, branchId:', branchId, 'branchLoading:', branchLoading);
            
            // Wait for BranchContext to finish loading
            if (branchLoading) {
                console.log('[CollectFees] Branch still loading, waiting...');
                return;
            }
            
            if (!branchId) {
                console.log('[CollectFees] branchId is empty, skipping fetch');
                setClasses([]);
                return;
            }
            const { data: classData, error: classError } = await supabase
                .from('classes')
                .select('*')
                .eq('branch_id', branchId)
                .order('name');
            console.log('[CollectFees] Classes fetched:', classData?.length, 'Error:', classError?.message);
            if (classError) {
                toast({ variant: 'destructive', title: 'Error fetching classes' });
            } else {
                setClasses(classData || []);
            }
        };
        
        fetchClasses();
    }, [branchId, branchLoading, toast]);

    // Fetch sections when selectedClass changes
    useEffect(() => {
        const fetchSections = async () => {
            if (!selectedClass) {
                setSections([]);
                setSelectedSection('all');
                return;
            }
            
            const { data, error } = await supabase
                .from('class_sections')
                .select('sections(id, name)')
                .eq('class_id', selectedClass)
                .order('sections(name)');

            if (error) {
                console.error('Error fetching sections:', error);
                toast({ variant: 'destructive', title: 'Error fetching sections' });
            } else {
                setSections(data.map(item => item.sections).filter(Boolean));
                setSelectedSection('all'); // Reset section selection
            }
        };

        fetchSections();
    }, [selectedClass, toast]);

    const handleSearch = async () => {
        if (!selectedClass) {
            toast({ variant: 'destructive', title: 'Class is required' });
            return;
        }
        if (!branchId) {
            toast({ variant: 'destructive', title: 'Branch not selected' });
            return;
        }
        setLoading(true);
        setSearched(true);
        
        try {
            // Use session from header dropdown (currentSessionId) — respects user's session selection
            const activeSessionId = currentSessionId;
            
            // Use student_profiles directly - it's faster and more reliable
            let query = supabase
                .from('student_profiles')
                .select('id, full_name, father_name, mother_name, phone, father_phone, mother_phone, guardian_phone, school_code, session_id, date_of_birth, gender, photo_url, admission_date, classes!student_profiles_class_id_fkey(name), sections!student_profiles_section_id_fkey(name)')
                .eq('branch_id', branchId)
                .eq('class_id', selectedClass);
            
            // Filter by branch's active session
            if (activeSessionId) {
                query = query.eq('session_id', activeSessionId);
            }

            if (selectedSection && selectedSection !== 'all') {
                query = query.eq('section_id', selectedSection);
            }

            if (keyword) {
                query = query.or(`full_name.ilike.%${keyword}%,school_code.ilike.%${keyword}%`);
            }

            const { data, error } = await query.order('full_name');

            if (error) throw error;
            setStudents(data || []);
            
            // Fetch fees progress for found students
            if (data && data.length > 0) {
                await fetchFeesProgress(data.map(s => s.id));
            } else {
                setFeesData({});
            }
        } catch (error) {
            console.error('Search error:', error);
            toast({ variant: 'destructive', title: 'Error searching students', description: error.message });
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch fee allocations and payments for fee progress display (including transport & hostel)
    const fetchFeesProgress = async (studentIds) => {
        try {
            const [allocRes, payRes, transportRes, transportPayRes, hostelRes, hostelPayRes] = await Promise.all([
                // Academic fee allocations
                supabase
                    .from('student_fee_allocations')
                    .select('student_id, fee_master:fee_masters(amount)')
                    .in('student_id', studentIds),
                // Academic fee payments
                supabase
                    .from('fee_payments')
                    .select('student_id, amount')
                    .in('student_id', studentIds)
                    .is('reverted_at', null),
                // Transport fee details
                supabase
                    .from('student_transport_details')
                    .select('student_id, transport_fee, billing_cycle')
                    .in('student_id', studentIds)
                    .eq('branch_id', branchId),
                // Transport fee payments
                supabase
                    .from('transport_fee_payments')
                    .select('student_id, amount')
                    .in('student_id', studentIds)
                    .eq('branch_id', branchId)
                    .is('reverted_at', null),
                // Hostel fee details
                supabase
                    .from('student_hostel_details')
                    .select('student_id, hostel_fee, billing_cycle')
                    .in('student_id', studentIds)
                    .eq('branch_id', branchId),
                // Hostel fee payments
                supabase
                    .from('hostel_fee_payments')
                    .select('student_id, amount')
                    .in('student_id', studentIds)
                    .eq('branch_id', branchId)
                    .is('reverted_at', null)
            ]);

            const progressMap = {};
            studentIds.forEach(id => {
                progressMap[id] = { total: 0, paid: 0, balance: 0, progress: 0 };
            });

            // Add academic fee allocations
            if (allocRes.data) {
                allocRes.data.forEach(alloc => {
                    const amount = parseFloat(alloc.fee_master?.amount || 0);
                    if (progressMap[alloc.student_id]) {
                        progressMap[alloc.student_id].total += amount;
                    }
                });
            }

            // Add academic fee payments
            if (payRes.data) {
                payRes.data.forEach(pay => {
                    if (progressMap[pay.student_id]) {
                        progressMap[pay.student_id].paid += parseFloat(pay.amount || 0);
                    }
                });
            }

            // Add transport fees (annual billing = transport_fee * 12 for monthly display, or direct for annual/one_time)
            if (transportRes.data) {
                transportRes.data.forEach(transport => {
                    const fee = parseFloat(transport.transport_fee || 0);
                    const billingCycle = transport.billing_cycle || 'monthly';
                    // Calculate total based on billing cycle
                    let totalTransportFee = fee;
                    if (billingCycle === 'monthly') {
                        totalTransportFee = fee * 12; // 12 months in session
                    } else if (billingCycle === 'quarterly') {
                        totalTransportFee = fee * 4; // 4 quarters in session
                    } else if (billingCycle === 'half_yearly') {
                        totalTransportFee = fee * 2; // 2 half-years in session
                    }
                    // annual/one_time - use fee as is
                    if (progressMap[transport.student_id]) {
                        progressMap[transport.student_id].total += totalTransportFee;
                    }
                });
            }

            // Add transport fee payments
            if (transportPayRes.data) {
                transportPayRes.data.forEach(pay => {
                    if (progressMap[pay.student_id]) {
                        progressMap[pay.student_id].paid += parseFloat(pay.amount || 0);
                    }
                });
            }

            // Add hostel fees (similar calculation as transport)
            if (hostelRes.data) {
                hostelRes.data.forEach(hostel => {
                    const fee = parseFloat(hostel.hostel_fee || 0);
                    const billingCycle = hostel.billing_cycle || 'monthly';
                    // Calculate total based on billing cycle
                    let totalHostelFee = fee;
                    if (billingCycle === 'monthly') {
                        totalHostelFee = fee * 12; // 12 months in session
                    } else if (billingCycle === 'quarterly') {
                        totalHostelFee = fee * 4; // 4 quarters in session
                    } else if (billingCycle === 'half_yearly') {
                        totalHostelFee = fee * 2; // 2 half-years in session
                    }
                    // annual/one_time - use fee as is
                    if (progressMap[hostel.student_id]) {
                        progressMap[hostel.student_id].total += totalHostelFee;
                    }
                });
            }

            // Add hostel fee payments
            if (hostelPayRes.data) {
                hostelPayRes.data.forEach(pay => {
                    if (progressMap[pay.student_id]) {
                        progressMap[pay.student_id].paid += parseFloat(pay.amount || 0);
                    }
                });
            }

            // Calculate balance and progress
            Object.keys(progressMap).forEach(id => {
                const { total, paid } = progressMap[id];
                progressMap[id].balance = Math.max(0, total - paid);
                progressMap[id].progress = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
            });

            setFeesData(progressMap);
        } catch (error) {
            console.error('Error fetching fees progress:', error);
        }
    };

    // Summary stats for the searched students
    const summaryStats = (() => {
        const studentIds = students.map(s => s.id);
        let totalStudents = students.length;
        let fullyPaid = 0;
        let partialPaid = 0;
        let unpaid = 0;
        let totalFees = 0;
        let totalCollected = 0;
        let totalBalance = 0;

        studentIds.forEach(id => {
            const f = feesData[id];
            if (f) {
                totalFees += f.total;
                totalCollected += f.paid;
                totalBalance += f.balance;
                if (f.progress >= 100) fullyPaid++;
                else if (f.progress > 0) partialPaid++;
                else unpaid++;
            } else {
                unpaid++;
            }
        });

        return { totalStudents, fullyPaid, partialPaid, unpaid, totalFees, totalCollected, totalBalance };
    })();

    const getGuardianPhone = (student) => {
        return student.father_phone || student.mother_phone || student.guardian_phone || student.phone || '-';
    };

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-6">Collect Fees</h1>
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Select Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center">Class <span className="text-red-500 ml-1">*</span></label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-medium">Section</label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sections</SelectItem>
                                    {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm font-medium">Search By Keyword</label>
                            <Input 
                                placeholder="Student Name, Admission No..."
                                value={keyword}
                                onChange={e => setKeyword(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {searched && (
                <>
                    {/* Summary Stats Cards */}
                    {students.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Students</p>
                                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{summaryStats.totalStudents}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-green-600 dark:text-green-400 font-medium">Fully Paid</p>
                                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{summaryStats.fullyPaid}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                                            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Partial</p>
                                            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{summaryStats.partialPaid}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-red-600 dark:text-red-400 font-medium">Unpaid</p>
                                            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{summaryStats.unpaid}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Fee Collection Summary Bar */}
                    {students.length > 0 && summaryStats.totalFees > 0 && (
                        <Card className="mb-6 border-indigo-200 dark:border-indigo-800">
                            <CardContent className="p-4">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Total Fees</p>
                                            <p className="text-lg font-bold flex items-center"><IndianRupee className="h-4 w-4" />{summaryStats.totalFees.toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="h-8 w-px bg-border"></div>
                                        <div>
                                            <p className="text-xs text-green-600 dark:text-green-400">Collected</p>
                                            <p className="text-lg font-bold text-green-600 dark:text-green-400 flex items-center"><IndianRupee className="h-4 w-4" />{summaryStats.totalCollected.toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="h-8 w-px bg-border"></div>
                                        <div>
                                            <p className="text-xs text-red-600 dark:text-red-400">Balance</p>
                                            <p className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center"><IndianRupee className="h-4 w-4" />{summaryStats.totalBalance.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 min-w-[200px]">
                                        <Progress value={summaryStats.totalFees > 0 ? Math.round((summaryStats.totalCollected / summaryStats.totalFees) * 100) : 0} className="h-3 flex-1" />
                                        <span className="text-sm font-bold">{summaryStats.totalFees > 0 ? Math.round((summaryStats.totalCollected / summaryStats.totalFees) * 100) : 0}%</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Student List Table */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Student List
                                {students.length > 0 && <span className="text-sm font-normal text-muted-foreground ml-2">({students.length} students)</span>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="p-3 font-semibold text-left w-10">#</th>
                                                <th className="p-3 font-semibold text-left">Student</th>
                                                <th className="p-3 font-semibold text-left">Class</th>
                                                <th className="p-3 font-semibold text-left">Guardian / Phone</th>
                                                <th className="p-3 font-semibold text-left min-w-[220px]">Fees Status</th>
                                                <th className="p-3 font-semibold text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.length > 0 ? students.map((student, index) => {
                                                const fee = feesData[student.id] || { total: 0, paid: 0, balance: 0, progress: 0 };
                                                const progressColor = fee.progress >= 100 ? 'text-green-600 dark:text-green-400' : fee.progress > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
                                                const progressBg = fee.progress >= 100 ? 'bg-green-50 dark:bg-green-950/30' : fee.progress > 0 ? 'bg-amber-50 dark:bg-amber-950/20' : '';
                                                const badgeColor = fee.progress >= 100 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : fee.progress > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
                                                const badgeText = fee.progress >= 100 ? 'Paid' : fee.progress > 0 ? 'Partial' : fee.total > 0 ? 'Unpaid' : 'No Fees';

                                                return (
                                                    <tr key={student.id} className={`border-b hover:bg-muted/50 transition-colors ${progressBg}`}>
                                                        <td className="p-3 text-muted-foreground">{index + 1}</td>
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-3">
                                                                {/* Avatar */}
                                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                                    {student.photo_url ? (
                                                                        <img src={student.photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                                                                    ) : (
                                                                        student.full_name?.charAt(0)?.toUpperCase() || '?'
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-foreground">{student.full_name}</p>
                                                                    <p className="text-xs text-muted-foreground">{student.school_code || 'No Admission No'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-3">
                                                            <div>
                                                                <p className="font-medium">{student.classes?.name || '-'}</p>
                                                                {student.sections?.name && <p className="text-xs text-muted-foreground">Section: {student.sections.name}</p>}
                                                            </div>
                                                        </td>
                                                        <td className="p-3">
                                                            <div>
                                                                <p className="font-medium text-sm">{student.father_name || student.mother_name || '-'}</p>
                                                                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                                                                    <Phone className="h-3 w-3" />
                                                                    {getGuardianPhone(student)}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{badgeText}</span>
                                                                    <span className={`text-xs font-bold ${progressColor}`}>{fee.progress}%</span>
                                                                </div>
                                                                <Progress value={fee.progress} className="h-2" />
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-green-600 dark:text-green-400 flex items-center"><IndianRupee className="h-3 w-3" />{fee.paid.toLocaleString('en-IN')}</span>
                                                                    <span className="text-muted-foreground">/</span>
                                                                    <span className="text-muted-foreground flex items-center"><IndianRupee className="h-3 w-3" />{fee.total.toLocaleString('en-IN')}</span>
                                                                </div>
                                                                {fee.balance > 0 && (
                                                                    <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-0.5">
                                                                        <AlertCircle className="h-3 w-3" />
                                                                        Due: <IndianRupee className="h-3 w-3" />{fee.balance.toLocaleString('en-IN')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <Button 
                                                                size="sm" 
                                                                className={fee.balance > 0 ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
                                                                onClick={() => navigate(`/${basePath}/fees-collection/student-fees/${student.id}`)}
                                                            >
                                                                <IndianRupee className="h-3.5 w-3.5 mr-1" />
                                                                {fee.balance > 0 ? 'Collect' : 'View'}
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            }) : (
                                                <tr>
                                                    <td colSpan="6" className="p-12 text-center">
                                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                            <Users className="h-10 w-10 opacity-30" />
                                                            <p className="text-lg font-medium">No students found</p>
                                                            <p className="text-sm">Try adjusting your search criteria</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </DashboardLayout>
    );
};

export default CollectFees;
