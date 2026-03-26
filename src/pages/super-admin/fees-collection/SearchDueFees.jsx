import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2, Phone, MessageCircle, IndianRupee, Users, AlertCircle, TrendingUp, Bus, Home, BookOpen, ChevronDown, ChevronUp, Gift, Clock, Send, CheckSquare, Square } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const SearchDueFees = () => {
    const { user, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const navigate = useNavigate();
    const { roleSlug } = useParams();
    const basePath = roleSlug || 'super-admin';
    
    const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    
    const [selectedClass, setSelectedClass] = useState('all');
    const [selectedSection, setSelectedSection] = useState('all');
    const [includeTransport, setIncludeTransport] = useState(true);
    const [includeHostel, setIncludeHostel] = useState(true);
    
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [sendingBulk, setSendingBulk] = useState(false);

    // Summary stats
    const [summary, setSummary] = useState({ 
        totalStudents: 0, 
        regularDue: 0, 
        transportDue: 0, 
        hostelDue: 0,
        totalDue: 0,
        totalPaid: 0,
        totalDiscount: 0,
        totalFine: 0
    });

    const fetchPrerequisites = useCallback(async () => {
        if (!branchId) return;
        const [classesRes, sectionsRes] = await Promise.all([
            supabase.from('classes').select('id, name').eq('branch_id', branchId).order('name'),
            supabase.from('sections').select('id, name').eq('branch_id', branchId),
        ]);
        setClasses(classesRes.data || []);
        setSections(sectionsRes.data || []);
    }, [branchId]);

    useEffect(() => {
        fetchPrerequisites();
    }, [fetchPrerequisites]);

    const handleSearch = async () => {
        setLoading(true);
        setSearched(true);

        try {
            // 1. Fetch all students in selected class/section
            let studentsQuery = supabase
                .from('student_profiles')
                .select('id, full_name, enrollment_id, photo_url, father_name, father_phone, mother_phone, guardian_phone, class_id, section_id, classes!student_profiles_class_id_fkey(name), sections!student_profiles_section_id_fkey(name)')
                .eq('branch_id', branchId)
                .eq('status', 'active');
            
            if (selectedClass !== 'all') {
                studentsQuery = studentsQuery.eq('class_id', selectedClass);
            }
            if (selectedSection !== 'all') {
                studentsQuery = studentsQuery.eq('section_id', selectedSection);
            }

            const { data: studentsData, error: studentsError } = await studentsQuery;
            if (studentsError) throw studentsError;

            if (!studentsData || studentsData.length === 0) {
                setStudents([]);
                setSummary({ totalStudents: 0, regularDue: 0, transportDue: 0, hostelDue: 0, totalDue: 0, totalPaid: 0, totalDiscount: 0, totalFine: 0 });
                setLoading(false);
                return;
            }

            const studentIds = studentsData.map(s => s.id);

            // 2. Class and section names are now fetched with student data

            // 3. HYBRID: Check for NEW architecture first (student_fee_ledger)
            //    Now includes fee_source for unified hostel/transport tracking
            const { data: ledgerData } = await supabase
                .from('student_fee_ledger')
                .select('student_id, net_amount, paid_amount, discount_amount, fine_amount, fee_source, status')
                .in('student_id', studentIds)
                .eq('branch_id', branchId)
                .eq('session_id', currentSessionId)
                .neq('status', 'cancelled');
            
            const usesNewArchitecture = ledgerData && ledgerData.length > 0;

            // OLD Architecture: Fetch student_fee_allocations + fee_masters
            let feeAllocations = [];
            if (!usesNewArchitecture) {
                const { data } = await supabase
                    .from('student_fee_allocations')
                    .select('student_id, fee_master_id, fee_masters(amount, fee_group_id)')
                    .in('student_id', studentIds)
                    .eq('branch_id', branchId)
                    .eq('session_id', currentSessionId);
                feeAllocations = data || [];
            }

            // 4. Fetch Regular Fee Payments (Current Session Only) - Used by both architectures
            const { data: feePayments } = await supabase
                .from('fee_payments')
                .select('student_id, amount, discount_amount, fine_paid')
                .in('student_id', studentIds)
                .eq('branch_id', branchId)
                .eq('session_id', currentSessionId)
                .is('reverted_at', null);

            // 5. Fetch Transport Details (Current Session Only)
            const { data: transportDetails } = await supabase
                .from('student_transport_details')
                .select('student_id, transport_fee')
                .in('student_id', studentIds)
                .eq('branch_id', branchId)
                .eq('session_id', currentSessionId);

            // 6. Fetch Transport Payments (Current Session Only)
            const { data: transportPayments } = await supabase
                .from('transport_fee_payments')
                .select('student_id, amount, discount_amount, fine_paid')
                .in('student_id', studentIds)
                .eq('branch_id', branchId)
                .eq('session_id', currentSessionId)
                .is('reverted_at', null);

            // 7. Fetch Hostel Details (Current Session Only)
            const { data: hostelDetails } = await supabase
                .from('student_hostel_details')
                .select('student_id, hostel_fee, hostel_room_type')
                .in('student_id', studentIds)
                .eq('branch_id', branchId)
                .eq('session_id', currentSessionId);

            // 8. Fetch Hostel Payments (Current Session Only)
            const { data: hostelPayments } = await supabase
                .from('hostel_fee_payments')
                .select('student_id, amount, discount_amount, fine_paid')
                .in('student_id', studentIds)
                .eq('branch_id', branchId)
                .eq('session_id', currentSessionId)
                .is('reverted_at', null);

            // 9. Calculate fees for each student (HYBRID: NEW or OLD architecture)
            const enrichedStudents = studentsData.map(student => {
                // Regular Fees - HYBRID
                let regularTotal = 0;
                let regularPaid = 0;
                let regularDiscount = 0;
                let regularFine = 0;
                
                if (usesNewArchitecture) {
                    // NEW ARCHITECTURE: Use student_fee_ledger, filter by fee_source='academic' (or null for old entries)
                    const studentLedger = ledgerData?.filter(l => l.student_id === student.id && (!l.fee_source || l.fee_source === 'academic')) || [];
                    regularTotal = studentLedger.reduce((sum, l) => sum + Number(l.net_amount || 0), 0);
                    regularPaid = studentLedger.reduce((sum, l) => sum + Number(l.paid_amount || 0), 0);
                    regularDiscount = studentLedger.reduce((sum, l) => sum + Number(l.discount_amount || 0), 0);
                    regularFine = studentLedger.reduce((sum, l) => sum + Number(l.fine_amount || 0), 0);
                } else {
                    // OLD ARCHITECTURE: Use student_fee_allocations + fee_payments
                    const studentAllocations = feeAllocations?.filter(a => a.student_id === student.id) || [];
                    regularTotal = studentAllocations.reduce((sum, a) => sum + Number(a.fee_masters?.amount || 0), 0);
                    
                    const studentFeePayments = feePayments?.filter(p => p.student_id === student.id) || [];
                    regularPaid = studentFeePayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
                    regularDiscount = studentFeePayments.reduce((sum, p) => sum + Number(p.discount_amount || 0), 0);
                    regularFine = studentFeePayments.reduce((sum, p) => sum + Number(p.fine_paid || 0), 0);
                }
                const regularDue = Math.max(0, regularTotal - regularPaid - regularDiscount + regularFine);

                // Transport Fees - UNIFIED: Check ledger first, then fallback to old tables
                const studentTransportLedger = ledgerData?.filter(l => l.student_id === student.id && l.fee_source === 'transport') || [];
                const hasTransportInLedger = studentTransportLedger.length > 0;

                let transportTotal, transportPaid, transportDiscount, transportFine;
                if (hasTransportInLedger) {
                    // NEW: from unified ledger
                    transportTotal = studentTransportLedger.reduce((sum, l) => sum + Number(l.net_amount || 0), 0);
                    transportPaid = studentTransportLedger.reduce((sum, l) => sum + Number(l.paid_amount || 0), 0);
                    transportDiscount = studentTransportLedger.reduce((sum, l) => sum + Number(l.discount_amount || 0), 0);
                    transportFine = studentTransportLedger.reduce((sum, l) => sum + Number(l.fine_amount || 0), 0);
                } else {
                    // FALLBACK: old separate tables
                    const studentTransport = transportDetails?.find(t => t.student_id === student.id);
                    transportTotal = studentTransport ? Number(studentTransport.transport_fee || 0) : 0;
                    
                    const studentTransportPayments = transportPayments?.filter(p => p.student_id === student.id) || [];
                    transportPaid = studentTransportPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
                    transportDiscount = studentTransportPayments.reduce((sum, p) => sum + Number(p.discount_amount || 0), 0);
                    transportFine = studentTransportPayments.reduce((sum, p) => sum + Number(p.fine_paid || 0), 0);
                }
                const transportDue = Math.max(0, transportTotal - transportPaid - transportDiscount + transportFine);

                // Hostel Fees - UNIFIED: Check ledger first, then fallback to old tables
                const studentHostelLedger = ledgerData?.filter(l => l.student_id === student.id && l.fee_source === 'hostel') || [];
                const hasHostelInLedger = studentHostelLedger.length > 0;

                let hostelTotal, hostelPaid, hostelDiscount, hostelFine;
                if (hasHostelInLedger) {
                    // NEW: from unified ledger
                    hostelTotal = studentHostelLedger.reduce((sum, l) => sum + Number(l.net_amount || 0), 0);
                    hostelPaid = studentHostelLedger.reduce((sum, l) => sum + Number(l.paid_amount || 0), 0);
                    hostelDiscount = studentHostelLedger.reduce((sum, l) => sum + Number(l.discount_amount || 0), 0);
                    hostelFine = studentHostelLedger.reduce((sum, l) => sum + Number(l.fine_amount || 0), 0);
                } else {
                    // FALLBACK: old separate tables
                    const studentHostel = hostelDetails?.find(h => h.student_id === student.id);
                    hostelTotal = studentHostel ? Number(studentHostel.hostel_fee || 0) : 0;
                    
                    const studentHostelPayments = hostelPayments?.filter(p => p.student_id === student.id) || [];
                    hostelPaid = studentHostelPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
                    hostelDiscount = studentHostelPayments.reduce((sum, p) => sum + Number(p.discount_amount || 0), 0);
                    hostelFine = studentHostelPayments.reduce((sum, p) => sum + Number(p.fine_paid || 0), 0);
                }
                const hostelDue = Math.max(0, hostelTotal - hostelPaid - hostelDiscount + hostelFine);

                // Combined
                const totalAmount = regularTotal + (includeTransport ? transportTotal : 0) + (includeHostel ? hostelTotal : 0);
                const totalPaid = regularPaid + (includeTransport ? transportPaid : 0) + (includeHostel ? hostelPaid : 0);
                const totalDiscount = regularDiscount + (includeTransport ? transportDiscount : 0) + (includeHostel ? hostelDiscount : 0);
                const totalFine = regularFine + (includeTransport ? transportFine : 0) + (includeHostel ? hostelFine : 0);
                const totalDue = regularDue + (includeTransport ? transportDue : 0) + (includeHostel ? hostelDue : 0);

                return {
                    ...student,
                    class_name: student.classes?.name || '',
                    section_name: student.sections?.name || '',
                    phone: student.father_phone || student.mother_phone || student.guardian_phone,
                    parent_name: student.father_name || 'Parent',
                    // Regular
                    regular_total: regularTotal,
                    regular_paid: regularPaid,
                    regular_discount: regularDiscount,
                    regular_fine: regularFine,
                    regular_due: regularDue,
                    // Transport
                    has_transport: hasTransportInLedger || !!transportDetails?.find(t => t.student_id === student.id),
                    transport_total: transportTotal,
                    transport_paid: transportPaid,
                    transport_discount: transportDiscount,
                    transport_fine: transportFine,
                    transport_due: transportDue,
                    // Hostel
                    has_hostel: hasHostelInLedger || !!hostelDetails?.find(h => h.student_id === student.id),
                    hostel_total: hostelTotal,
                    hostel_paid: hostelPaid,
                    hostel_discount: hostelDiscount,
                    hostel_fine: hostelFine,
                    hostel_due: hostelDue,
                    // Combined
                    total_amount: totalAmount,
                    total_paid: totalPaid,
                    total_discount: totalDiscount,
                    total_fine: totalFine,
                    total_due: totalDue
                };
            });

            // Filter to show only students with dues
            const studentsWithDues = enrichedStudents.filter(s => s.total_due > 0);

            // Sort by total due (highest first)
            studentsWithDues.sort((a, b) => b.total_due - a.total_due);

            setStudents(studentsWithDues);

            // Calculate summary
            const summaryData = studentsWithDues.reduce((acc, s) => ({
                totalStudents: acc.totalStudents + 1,
                regularDue: acc.regularDue + s.regular_due,
                transportDue: acc.transportDue + (includeTransport ? s.transport_due : 0),
                hostelDue: acc.hostelDue + (includeHostel ? s.hostel_due : 0),
                totalDue: acc.totalDue + s.total_due,
                totalPaid: acc.totalPaid + s.total_paid,
                totalDiscount: acc.totalDiscount + s.total_discount,
                totalFine: acc.totalFine + s.total_fine
            }), { totalStudents: 0, regularDue: 0, transportDue: 0, hostelDue: 0, totalDue: 0, totalPaid: 0, totalDiscount: 0, totalFine: 0 });

            setSummary(summaryData);

        } catch (error) {
            console.error('Search error:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            setStudents([]);
        }
        
        setLoading(false);
    };

    const toggleExpand = (studentId) => {
        setExpandedRows(prev => ({ ...prev, [studentId]: !prev[studentId] }));
    };

    // Selection handlers
    const toggleSelectStudent = (studentId) => {
        setSelectedStudents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    const selectAllStudents = () => {
        const studentsWithPhone = students.filter(s => s.phone);
        setSelectedStudents(new Set(studentsWithPhone.map(s => s.id)));
    };

    const deselectAllStudents = () => {
        setSelectedStudents(new Set());
    };

    const getWhatsAppMessage = (student) => {
        const schoolName = selectedBranch?.name || 'School';
        const studentName = student.full_name;
        const className = student.class_name;
        const sectionName = student.section_name ? ` - ${student.section_name}` : '';
        
        let feeDetailsEng = '';
        let feeDetailsKan = '';
        if (student.regular_due > 0) {
            feeDetailsEng += `� Regular Fees: ?${student.regular_due.toLocaleString('en-IN')}\n`;
            feeDetailsKan += `� ?????: ?${student.regular_due.toLocaleString('en-IN')}\n`;
        }
        if (includeTransport && student.transport_due > 0) {
            feeDetailsEng += `� Transport: ?${student.transport_due.toLocaleString('en-IN')}\n`;
            feeDetailsKan += `� ????: ?${student.transport_due.toLocaleString('en-IN')}\n`;
        }
        if (includeHostel && student.hostel_due > 0) {
            feeDetailsEng += `� Hostel: ?${student.hostel_due.toLocaleString('en-IN')}\n`;
            feeDetailsKan += `� ????????: ?${student.hostel_due.toLocaleString('en-IN')}\n`;
        }
        const totalDue = student.total_due.toLocaleString('en-IN');
        
        return `? *FEE REMINDER*\n????????????????????\n\n? *${schoolName}*\n\n? Student: *${studentName}*\n? Class: *${className}${sectionName}*\n\n? *Fee Details:*\n${feeDetailsEng}\n? *Total Due: ?${totalDue}*\n\nPlease pay the fees at your earliest convenience.\n\nThank you.\n\n--------------------\n\n? *???????*\n????????????????????\n\n? *${schoolName}*\n\n? ??????????: *${studentName}*\n? ?????: *${className}${sectionName}*\n\n? *????:*\n${feeDetailsKan}\n? *????: ?${totalDue}*\n\n???????????????.\n\n??????????.`;
    };

    // Bulk WhatsApp send - opens one by one with delay
    const sendBulkWhatsApp = async () => {
        const selectedList = students.filter(s => selectedStudents.has(s.id) && s.phone);
        if (selectedList.length === 0) {
            toast({ variant: 'destructive', title: 'No Selection', description: 'Please select students with phone numbers' });
            return;
        }
        
        setSendingBulk(true);
        let sent = 0;
        
        for (const student of selectedList) {
            const msg = getWhatsAppMessage(student);
            const phone = student.phone.replace(/\D/g, '');
            window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, '_blank');
            sent++;
            
            // Show progress
            toast({ title: `Sending ${sent}/${selectedList.length}`, description: student.full_name });
            
            // Wait 2 seconds between each to avoid popup blocker
            if (sent < selectedList.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        setSendingBulk(false);
        toast({ title: 'Done!', description: `WhatsApp opened for ${sent} students` });
        setSelectedStudents(new Set());
    };

    const handleCollectFees = (studentId) => {
        navigate(`/${basePath}/fees-collection/student-fees/${studentId}`);
    };

    const handleCall = (phone) => {
        if (phone) {
            window.open(`tel:${phone}`, '_self');
        } else {
            toast({ variant: 'destructive', title: 'No Phone', description: 'Phone number not available' });
        }
    };

    const getPaymentProgress = (paid, total) => {
        if (!total || total === 0) return 0;
        return Math.min(100, Math.round((paid / total) * 100));
    };

    const getStatusBadge = (due, total) => {
        if (total === 0) return <Badge variant="secondary">No Fees</Badge>;
        const paidPercent = getPaymentProgress(total - due, total);
        if (paidPercent === 0) return <Badge variant="destructive">Unpaid</Badge>;
        if (paidPercent < 50) return <Badge className="bg-orange-500">Partial</Badge>;
        if (paidPercent < 100) return <Badge className="bg-yellow-500 text-black">Almost</Badge>;
        return <Badge className="bg-green-500">Paid</Badge>;
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST';
    };

    const formatCurrency = (amount) => {
        return `?${Number(amount || 0).toLocaleString('en-IN')}`;
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <AlertCircle className="h-6 w-6 text-red-500" />
                        Search Due Fees
                    </h1>
                </div>

                {/* Search Criteria */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Select Criteria</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Class</label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Classes</SelectItem>
                                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Section</label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger><SelectValue placeholder="All Sections" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sections</SelectItem>
                                        {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <Checkbox id="transport" checked={includeTransport} onCheckedChange={setIncludeTransport} />
                                    <label htmlFor="transport" className="text-sm flex items-center gap-1">
                                        <Bus className="h-4 w-4" /> Transport
                                    </label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox id="hostel" checked={includeHostel} onCheckedChange={setIncludeHostel} />
                                    <label htmlFor="hostel" className="text-sm flex items-center gap-1">
                                        <Home className="h-4 w-4" /> Hostel
                                    </label>
                                </div>
                            </div>
                            <Button onClick={handleSearch} disabled={loading} className="h-10 col-span-1 md:col-span-2">
                                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />}
                                Search Due Fees
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                {searched && students.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Total Due</p>
                                        <p className="text-xl font-bold text-red-500">{formatCurrency(summary.totalDue)}</p>
                                    </div>
                                    <AlertCircle className="h-8 w-8 text-red-500/50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1"><BookOpen className="h-3 w-3" /> Regular</p>
                                        <p className="text-xl font-bold text-blue-500">{formatCurrency(summary.regularDue)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        {includeTransport && (
                            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Bus className="h-3 w-3" /> Transport</p>
                                            <p className="text-xl font-bold text-purple-500">{formatCurrency(summary.transportDue)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {includeHostel && (
                            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Home className="h-3 w-3" /> Hostel</p>
                                            <p className="text-xl font-bold text-orange-500">{formatCurrency(summary.hostelDue)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Students</p>
                                        <p className="text-xl font-bold text-cyan-500">{summary.totalStudents}</p>
                                    </div>
                                    <Users className="h-8 w-8 text-cyan-500/50" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Student List */}
                {searched && (
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Students with Due Fees
                                    {students.length > 0 && <span className="text-sm font-normal text-muted-foreground">({students.length})</span>}
                                </CardTitle>
                                
                                {students.length > 0 && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {/* Select All / Deselect All */}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={selectedStudents.size === students.filter(s => s.phone).length ? deselectAllStudents : selectAllStudents}
                                            className="h-8"
                                        >
                                            {selectedStudents.size === students.filter(s => s.phone).length ? (
                                                <><Square className="h-4 w-4 mr-1" /> Deselect All</>
                                            ) : (
                                                <><CheckSquare className="h-4 w-4 mr-1" /> Select All</>
                                            )}
                                        </Button>
                                        
                                        {/* Bulk WhatsApp Send */}
                                        <Button
                                            size="sm"
                                            onClick={sendBulkWhatsApp}
                                            disabled={selectedStudents.size === 0 || sendingBulk}
                                            className="h-8 bg-green-600 hover:bg-green-700"
                                        >
                                            {sendingBulk ? (
                                                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Sending...</>
                                            ) : (
                                                <><Send className="h-4 w-4 mr-1" /> Send WhatsApp ({selectedStudents.size})</>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center p-8">
                                    <Loader2 className="animate-spin mx-auto h-8 w-8" />
                                </div>
                            ) : students.length > 0 ? (
                                <div className="space-y-2">
                                    {students.map((student, index) => {
                                        const progress = getPaymentProgress(student.total_paid, student.total_amount);
                                        const isExpanded = expandedRows[student.id];
                                        
                                        return (
                                            <Collapsible key={student.id} open={isExpanded} onOpenChange={() => toggleExpand(student.id)}>
                                                <div className={`border rounded-lg overflow-hidden ${selectedStudents.has(student.id) ? 'border-green-500 bg-green-500/5' : ''}`}>
                                                    {/* Main Row */}
                                                    <div className="grid grid-cols-12 gap-2 md:gap-4 items-center p-3 bg-card hover:bg-muted/30 transition-colors">
                                                        {/* Checkbox */}
                                                        <div className="col-span-1 flex items-center justify-center">
                                                            {student.phone ? (
                                                                <Checkbox
                                                                    checked={selectedStudents.has(student.id)}
                                                                    onCheckedChange={() => toggleSelectStudent(student.id)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="h-5 w-5"
                                                                />
                                                            ) : (
                                                                <span className="text-muted-foreground text-xs">{index + 1}</span>
                                                            )}
                                                        </div>

                                                        {/* Student Info */}
                                                        <div className="col-span-4 md:col-span-3 flex items-center gap-2">
                                                            <Avatar className="h-10 w-10 border-2 border-primary/20">
                                                                <AvatarImage src={student.photo_url} alt={student.full_name} />
                                                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                                                    {getInitials(student.full_name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-sm truncate">{student.full_name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {student.enrollment_id || ''}
                                                                    {student.enrollment_id && student.phone ? ' • ' : ''}
                                                                    {student.phone && <span className="text-green-500">{student.phone}</span>}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Class - Hidden on mobile */}
                                                        <div className="hidden md:block col-span-2">
                                                            <p className="text-sm">{student.class_name}</p>
                                                            <p className="text-xs text-muted-foreground">{student.section_name || ''}</p>
                                                        </div>

                                                        {/* Quick Fee Summary */}
                                                        <div className="col-span-4 md:col-span-3">
                                                            <div className="flex flex-wrap gap-1 text-xs">
                                                                {student.regular_due > 0 && (
                                                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                                                                        <BookOpen className="h-3 w-3 mr-1" />{formatCurrency(student.regular_due)}
                                                                    </Badge>
                                                                )}
                                                                {includeTransport && student.transport_due > 0 && (
                                                                    <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">
                                                                        <Bus className="h-3 w-3 mr-1" />{formatCurrency(student.transport_due)}
                                                                    </Badge>
                                                                )}
                                                                {includeHostel && student.hostel_due > 0 && (
                                                                    <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
                                                                        <Home className="h-3 w-3 mr-1" />{formatCurrency(student.hostel_due)}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm font-bold text-red-500 mt-1">
                                                                Due: {formatCurrency(student.total_due)}
                                                            </p>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="col-span-3 flex items-center justify-end gap-1">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-blue-500"
                                                                onClick={(e) => { e.stopPropagation(); handleCall(student.phone); }}
                                                                title="Call"
                                                            >
                                                                <Phone className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-green-500"
                                                                onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    if (!student.phone) {
                                                                        toast({ variant: 'destructive', title: 'No Phone', description: 'Phone number not available' });
                                                                        return;
                                                                    }
                                                                    const msg = getWhatsAppMessage(student);
                                                                    window.open(`https://wa.me/91${student.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                                                }}
                                                                title="WhatsApp"
                                                            >
                                                                <MessageCircle className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="bg-orange-500 hover:bg-orange-600 text-white h-8"
                                                                onClick={(e) => { e.stopPropagation(); handleCollectFees(student.id); }}
                                                            >
                                                                <IndianRupee className="h-3 w-3 mr-1" />
                                                                Collect
                                                            </Button>
                                                            <CollapsibleTrigger asChild>
                                                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                                </Button>
                                                            </CollapsibleTrigger>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Details */}
                                                    <CollapsibleContent>
                                                        <div className="p-4 bg-muted/20 border-t">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                {/* Regular Fees */}
                                                                <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <BookOpen className="h-4 w-4 text-blue-500" />
                                                                        <span className="font-medium text-sm">Regular Fees</span>
                                                                    </div>
                                                                    <div className="space-y-1 text-xs">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Total:</span>
                                                                            <span>{formatCurrency(student.regular_total)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-green-500">
                                                                            <span>Paid:</span>
                                                                            <span>{formatCurrency(student.regular_paid)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-purple-500">
                                                                            <span><Gift className="h-3 w-3 inline mr-1" />Discount:</span>
                                                                            <span>{formatCurrency(student.regular_discount)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-orange-500">
                                                                            <span><Clock className="h-3 w-3 inline mr-1" />Fine:</span>
                                                                            <span>{formatCurrency(student.regular_fine)}</span>
                                                                        </div>
                                                                        <hr className="my-1 border-blue-500/20" />
                                                                        <div className="flex justify-between font-bold text-red-500">
                                                                            <span>Due:</span>
                                                                            <span>{formatCurrency(student.regular_due)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Transport Fees */}
                                                                {includeTransport && (
                                                                    <div className={`p-3 rounded-lg border ${student.has_transport ? 'bg-purple-500/5 border-purple-500/20' : 'bg-muted/30 border-muted'}`}>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Bus className="h-4 w-4 text-purple-500" />
                                                                            <span className="font-medium text-sm">Transport Fees</span>
                                                                            {!student.has_transport && <Badge variant="secondary" className="text-xs">Not Enrolled</Badge>}
                                                                        </div>
                                                                        {student.has_transport ? (
                                                                            <div className="space-y-1 text-xs">
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-muted-foreground">Total:</span>
                                                                                    <span>{formatCurrency(student.transport_total)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between text-green-500">
                                                                                    <span>Paid:</span>
                                                                                    <span>{formatCurrency(student.transport_paid)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between text-purple-500">
                                                                                    <span><Gift className="h-3 w-3 inline mr-1" />Discount:</span>
                                                                                    <span>{formatCurrency(student.transport_discount)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between text-orange-500">
                                                                                    <span><Clock className="h-3 w-3 inline mr-1" />Fine:</span>
                                                                                    <span>{formatCurrency(student.transport_fine)}</span>
                                                                                </div>
                                                                                <hr className="my-1 border-purple-500/20" />
                                                                                <div className="flex justify-between font-bold text-red-500">
                                                                                    <span>Due:</span>
                                                                                    <span>{formatCurrency(student.transport_due)}</span>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-xs text-muted-foreground">Student not enrolled in transport</p>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Hostel Fees */}
                                                                {includeHostel && (
                                                                    <div className={`p-3 rounded-lg border ${student.has_hostel ? 'bg-orange-500/5 border-orange-500/20' : 'bg-muted/30 border-muted'}`}>
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Home className="h-4 w-4 text-orange-500" />
                                                                            <span className="font-medium text-sm">Hostel Fees</span>
                                                                            {!student.has_hostel && <Badge variant="secondary" className="text-xs">Not Enrolled</Badge>}
                                                                        </div>
                                                                        {student.has_hostel ? (
                                                                            <div className="space-y-1 text-xs">
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-muted-foreground">Total:</span>
                                                                                    <span>{formatCurrency(student.hostel_total)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between text-green-500">
                                                                                    <span>Paid:</span>
                                                                                    <span>{formatCurrency(student.hostel_paid)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between text-purple-500">
                                                                                    <span><Gift className="h-3 w-3 inline mr-1" />Discount:</span>
                                                                                    <span>{formatCurrency(student.hostel_discount)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between text-orange-500">
                                                                                    <span><Clock className="h-3 w-3 inline mr-1" />Fine:</span>
                                                                                    <span>{formatCurrency(student.hostel_fine)}</span>
                                                                                </div>
                                                                                <hr className="my-1 border-orange-500/20" />
                                                                                <div className="flex justify-between font-bold text-red-500">
                                                                                    <span>Due:</span>
                                                                                    <span>{formatCurrency(student.hostel_due)}</span>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-xs text-muted-foreground">Student not enrolled in hostel</p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Phone Info */}
                                                            <div className="mt-3 pt-3 border-t flex items-center justify-between">
                                                                <div className="text-xs text-muted-foreground">
                                                                    <Phone className="h-3 w-3 inline mr-1" />
                                                                    {student.phone || 'No phone number'}
                                                                </div>
                                                                <div className="text-sm">
                                                                    <span className="text-muted-foreground">Grand Total Due: </span>
                                                                    <span className="font-bold text-red-500 text-lg">{formatCurrency(student.total_due)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CollapsibleContent>
                                                </div>
                                            </Collapsible>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                                    <p className="text-muted-foreground">No students with due fees found.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default SearchDueFees;
