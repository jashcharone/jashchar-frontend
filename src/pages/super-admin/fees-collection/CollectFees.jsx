import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Search, Loader2, IndianRupee, Users, AlertCircle, CheckCircle2, Clock, Phone, RefreshCcw, Bus, Home, CalendarDays } from 'lucide-react';
import { sortClasses, sortSections } from '@/utils/classOrderUtils';


// Helper: chunk an array into smaller batches to avoid URL length limits
const BATCH_SIZE = 50; // 50 UUIDs per batch (~1800 chars, well within Supabase URL limits)
const chunkArray = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
};

const CollectFees = () => {
    const navigate = useNavigate();
    const { roleSlug } = useParams();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch, loading: branchLoading } = useBranch();
    const { toast } = useToast();
    
    // Dynamic base path for navigation
    const basePath = roleSlug || 'super-admin';
    // ? FIX: Use selectedBranch.id OR fallback to user profile/metadata branch_id
    const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedClass, setSelectedClass] = useState('all');
    const [selectedSection, setSelectedSection] = useState('all');
    const [keyword, setKeyword] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [students, setStudents] = useState([]);
    const [allStudents, setAllStudents] = useState([]); // Store all fetched students for client-side filtering
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [initialLoadDone, setInitialLoadDone] = useState(false); // For auto-load on page open
    const [feesData, setFeesData] = useState({}); // { studentId: { total, paid, balance, progress } }
    const [hostelAssignments, setHostelAssignments] = useState({}); // { studentId: { hostel_name, room_no } }
    const [transportAssignments, setTransportAssignments] = useState({}); // { studentId: { route, pickup_point } }

    // DEBUG: Log branch resolution
    console.log('[CollectFees] branchId:', branchId, '| selectedBranch:', selectedBranch?.id, '| branchLoading:', branchLoading);

    // ? FIX: Fetch classes when branchId changes - wait for branch loading to complete
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
                setClasses(sortClasses(classData || []));
            }
        };
        
        fetchClasses();
    }, [branchId, branchLoading, toast]);

    // Auto-load: Set initial load done when classes are loaded
    useEffect(() => {
        if (classes.length > 0 && !initialLoadDone) {
            setInitialLoadDone(true);
        }
    }, [classes, initialLoadDone]);

    // Fetch sections when selectedClass changes
    useEffect(() => {
        const fetchSections = async () => {
            if (!selectedClass || selectedClass === 'all') {
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
                const sectionsList = data.map(item => item.sections).filter(Boolean);
                setSections(sortSections(sectionsList));
                setSelectedSection('all'); // Reset section selection
            }
        };

        fetchSections();
    }, [selectedClass, toast]);

    // Client-side instant search filter
    const filteredStudents = useMemo(() => {
        if (!keyword || !keyword.trim()) {
            return allStudents;
        }
        const searchTerm = keyword.toLowerCase().trim();
        return allStudents.filter(s => {
            const fullName = (s.full_name || '').toLowerCase();
            const schoolCode = (s.enrollment_id || '').toLowerCase();
            const fatherName = (s.father_name || '').toLowerCase();
            const phone = (s.father_phone || s.mother_phone || s.guardian_phone || s.phone || '').toLowerCase();
            return fullName.includes(searchTerm) || 
                   schoolCode.includes(searchTerm) || 
                   fatherName.includes(searchTerm) ||
                   phone.includes(searchTerm);
        });
    }, [allStudents, keyword]);

    // Update students display when filtered results change
    useEffect(() => {
        setStudents(filteredStudents);
    }, [filteredStudents]);

    // Admission Period date range helper
    const getDateRange = (filter, from, to) => {
        const now = new Date();
        const toISO = (d) => d.toISOString().split('T')[0];
        switch (filter) {
            case 'today': return { from: toISO(now), to: toISO(now) };
            case 'last7days': { const d = new Date(now); d.setDate(d.getDate() - 7); return { from: toISO(d), to: toISO(now) }; }
            case 'last30days': { const d = new Date(now); d.setDate(d.getDate() - 30); return { from: toISO(d), to: toISO(now) }; }
            case 'thisMonth': return { from: toISO(new Date(now.getFullYear(), now.getMonth(), 1)), to: toISO(now) };
            case 'custom': return { from: from || null, to: to || null };
            default: return { from: null, to: null };
        }
    };

    const handleSearch = async () => {
        if (!branchId) {
            toast({ variant: 'destructive', title: 'Branch not selected' });
            return;
        }
        setLoading(true);
        setSearched(true);
        
        try {
            // Use session from header dropdown (currentSessionId) � respects user's session selection
            const activeSessionId = currentSessionId;
            
            // Use student_profiles directly - it's faster and more reliable
            let query = supabase
                .from('student_profiles')
                .select('id, full_name, father_name, mother_name, phone, father_phone, mother_phone, guardian_phone, enrollment_id, session_id, date_of_birth, gender, photo_url, admission_date, classes!student_profiles_class_id_fkey(name), sections!student_profiles_section_id_fkey(name)')
                .eq('branch_id', branchId);
            
            // Filter by branch's active session
            if (activeSessionId) {
                query = query.eq('session_id', activeSessionId);
            }

            // Only add class filter if specific class selected (not 'all')
            if (selectedClass && selectedClass !== 'all') {
                query = query.eq('class_id', selectedClass);
            }

            if (selectedSection && selectedSection !== 'all') {
                query = query.eq('section_id', selectedSection);
            }

            // NOTE: Keyword search is done client-side for instant results
            // No server-side keyword filter needed

            // Admission Period filter
            const dateRange = getDateRange(dateFilter, dateFrom, dateTo);
            if (dateRange.from) query = query.gte('admission_date', dateRange.from);
            if (dateRange.to) query = query.lte('admission_date', dateRange.to);

            const { data, error } = await query.order('full_name');

            if (error) throw error;
            
            // Store all students for client-side instant search
            setAllStudents(data || []);
            setStudents(data || []);
            
            if (data && data.length > 0) {
                toast({ title: `${data.length} students found.`});
            } else {
                toast({ title: "No students found." });
            }
            
            // ====================================================================
            // AUTO-ALLOCATE FEES: Based on fee_group_class_assignments for this class
            // This ensures ALL students in the class get their fees allocated
            // Only run when a specific class is selected (not 'all')
            // ====================================================================
            if (data && data.length > 0 && selectedClass && selectedClass !== 'all') {
                try {
                    // Step 1: Get fee_group_class_assignments for this class
                    let assignmentsQuery = supabase
                        .from('fee_group_class_assignments')
                        .select('fee_group_id')
                        .eq('class_id', selectedClass)
                        .eq('branch_id', branchId)
                        .eq('session_id', currentSessionId)
                        .eq('is_active', true);
                    
                    // If specific section selected, filter by section or null (all sections)
                    if (selectedSection && selectedSection !== 'all') {
                        assignmentsQuery = assignmentsQuery.or(`section_id.is.null,section_id.eq.${selectedSection}`);
                    }
                    
                    const { data: classAssignments } = await assignmentsQuery;
                    
                    if (classAssignments && classAssignments.length > 0) {
                        const feeGroupIds = [...new Set(classAssignments.map(a => a.fee_group_id))];
                        
                        // Step 2: Get all fee_masters for these fee groups
                        const { data: feeMasters } = await supabase
                            .from('fee_masters')
                            .select('id')
                            .in('fee_group_id', feeGroupIds)
                            .eq('branch_id', branchId)
                            .eq('session_id', currentSessionId);
                        
                        if (feeMasters && feeMasters.length > 0) {
                            const studentIds = data.map(s => s.id);
                            
                            // Step 3: Get existing allocations for these students
                            const { data: existingAllocations } = await supabase
                                .from('student_fee_allocations')
                                .select('student_id, fee_master_id')
                                .in('student_id', studentIds)
                                .eq('branch_id', branchId)
                                .eq('session_id', currentSessionId);
                            
                            // Create a set of existing student+fee combinations
                            const existingSet = new Set(
                                (existingAllocations || []).map(a => `${a.student_id}_${a.fee_master_id}`)
                            );
                            
                            // Step 4: Create missing allocations
                            const missingAllocations = [];
                            for (const student of data) {
                                for (const feeMaster of feeMasters) {
                                    const key = `${student.id}_${feeMaster.id}`;
                                    if (!existingSet.has(key)) {
                                        missingAllocations.push({
                                            student_id: student.id,
                                            fee_master_id: feeMaster.id,
                                            branch_id: branchId,
                                            session_id: currentSessionId,
                                            organization_id: organizationId,
                                        });
                                    }
                                }
                            }
                            
                            // Step 5: Batch insert missing allocations
                            if (missingAllocations.length > 0) {
                                const batchSize = 100;
                                for (let i = 0; i < missingAllocations.length; i += batchSize) {
                                    const batch = missingAllocations.slice(i, i + batchSize);
                                    await supabase
                                        .from('student_fee_allocations')
                                        .upsert(batch, { 
                                            onConflict: 'student_id,fee_master_id',
                                            ignoreDuplicates: true 
                                        });
                                }
                                console.log(`Auto-allocated ${missingAllocations.length} fees for ${data.length} students`);
                            }
                        }
                    }
                } catch (allocErr) {
                    console.warn('Auto-allocation error (non-critical):', allocErr);
                }
            }
            // ====================================================================
            
            // Fetch fees progress for found students
            if (data && data.length > 0) {
                const studentIds = data.map(s => s.id);
                await fetchFeesProgress(studentIds);
                await fetchHostelAssignments(studentIds);
                await fetchTransportAssignments(studentIds);
            } else {
                setFeesData({});
            }
        } catch (error) {
            console.error('Search error:', error);
            toast({ variant: 'destructive', title: 'Error searching students', description: error.message });
            setStudents([]);
            setAllStudents([]);
        } finally {
            setLoading(false);
        }
    };

    // Auto-search: Trigger search automatically on page load (with 'all' classes default)
    useEffect(() => {
        if (initialLoadDone && selectedClass === 'all' && students.length === 0 && !loading) {
            handleSearch();
        }
    }, [initialLoadDone]);

    // Re-fetch when session changes from header dropdown
    useEffect(() => {
        if (currentSessionId && initialLoadDone && selectedClass) {
            handleSearch();
        }
    }, [currentSessionId]);

    // Fetch fee allocations and payments for fee progress display (including transport & hostel & ledger)
    const fetchFeesProgress = async (studentIds) => {
        try {
            // Batch student IDs into chunks to avoid URL length limits (600 UUIDs = ~22KB URL → 500 error)
            const chunks = chunkArray(studentIds, BATCH_SIZE);
            
            // Run all chunks in parallel, each chunk runs 8 queries in parallel
            const chunkResults = await Promise.all(chunks.map(async (chunk) => {
                const [allocRes, payRes, transportRes, transportPayRes, hostelRes, hostelPayRes, refundsRes, ledgerRes] = await Promise.all([
                    supabase
                        .from('student_fee_allocations')
                        .select('student_id, fee_master:fee_masters(amount)')
                        .in('student_id', chunk)
                        .eq('branch_id', branchId)
                        .eq('session_id', currentSessionId),
                    supabase
                        .from('fee_payments')
                        .select('student_id, amount, discount_amount, fine_paid')
                        .in('student_id', chunk)
                        .eq('branch_id', branchId)
                        .eq('session_id', currentSessionId)
                        .is('reverted_at', null)
                        .is('ledger_id', null),
                    supabase
                        .from('student_transport_details')
                        .select('student_id, transport_fee, billing_cycle')
                        .in('student_id', chunk)
                        .eq('branch_id', branchId),
                    supabase
                        .from('transport_fee_payments')
                        .select('student_id, amount, discount_amount, fine_paid')
                        .in('student_id', chunk)
                        .eq('branch_id', branchId)
                        .is('reverted_at', null),
                    supabase
                        .from('student_hostel_details')
                        .select('student_id, hostel_fee, billing_cycle')
                        .in('student_id', chunk)
                        .eq('branch_id', branchId),
                    supabase
                        .from('hostel_fee_payments')
                        .select('student_id, amount, discount_amount, fine_paid')
                        .in('student_id', chunk)
                        .eq('branch_id', branchId)
                        .is('reverted_at', null),
                    supabase
                        .from('fee_refunds')
                        .select('student_id, refund_amount')
                        .in('student_id', chunk)
                        .eq('branch_id', branchId)
                        .eq('status', 'approved'),
                    supabase
                        .from('student_fee_ledger')
                        .select('student_id, net_amount, paid_amount, discount_amount, fine_amount, fee_source')
                        .in('student_id', chunk)
                        .eq('branch_id', branchId)
                        .eq('session_id', currentSessionId)
                        .neq('status', 'cancelled')
                ]);
                return { allocRes, payRes, transportRes, transportPayRes, hostelRes, hostelPayRes, refundsRes, ledgerRes };
            }));

            // Merge all chunk results into single arrays
            const mergeData = (key) => chunkResults.flatMap(r => r[key]?.data || []);
            const allocData = mergeData('allocRes');
            const payData = mergeData('payRes');
            const transportData = mergeData('transportRes');
            const transportPayData = mergeData('transportPayRes');
            const hostelData = mergeData('hostelRes');
            const hostelPayData = mergeData('hostelPayRes');
            const refundsData = mergeData('refundsRes');
            const ledgerData = mergeData('ledgerRes');

            const progressMap = {};
            studentIds.forEach(id => {
                progressMap[id] = { total: 0, paid: 0, discount: 0, fine: 0, refunded: 0, balance: 0, progress: 0 };
            });

            // Build sets of students who have hostel/transport in the unified ledger
            // to avoid double counting with old tables
            const studentsWithLedgerTransport = new Set();
            const studentsWithLedgerHostel = new Set();
            if (ledgerData.length > 0) {
                ledgerData.forEach(entry => {
                    if (entry.fee_source === 'transport') studentsWithLedgerTransport.add(entry.student_id);
                    if (entry.fee_source === 'hostel') studentsWithLedgerHostel.add(entry.student_id);
                });
            }

            // Add academic fee allocations
            if (allocData.length > 0) {
                allocData.forEach(alloc => {
                    const amount = parseFloat(alloc.fee_master?.amount || 0);
                    if (progressMap[alloc.student_id]) {
                        progressMap[alloc.student_id].total += amount;
                    }
                });
            }

            // Add academic fee payments (with discount and fine)
            if (payData.length > 0) {
                payData.forEach(pay => {
                    if (progressMap[pay.student_id]) {
                        progressMap[pay.student_id].paid += parseFloat(pay.amount || 0);
                        progressMap[pay.student_id].discount += parseFloat(pay.discount_amount || 0);
                        progressMap[pay.student_id].fine += parseFloat(pay.fine_paid || 0);
                    }
                });
            }

            // Add transport fees ONLY for students NOT in unified ledger (avoid double counting)
            if (transportData.length > 0) {
                transportData.forEach(transport => {
                    if (studentsWithLedgerTransport.has(transport.student_id)) return; // Skip - ledger handles this
                    const fee = parseFloat(transport.transport_fee || 0);
                    const billingCycle = transport.billing_cycle || 'monthly';
                    let totalTransportFee = fee;
                    if (billingCycle === 'monthly') {
                        totalTransportFee = fee * 12;
                    } else if (billingCycle === 'quarterly') {
                        totalTransportFee = fee * 4;
                    } else if (billingCycle === 'half_yearly') {
                        totalTransportFee = fee * 2;
                    }
                    if (progressMap[transport.student_id]) {
                        progressMap[transport.student_id].total += totalTransportFee;
                    }
                });
            }

            // Add transport fee payments ONLY for students NOT in unified ledger
            if (transportPayData.length > 0) {
                transportPayData.forEach(pay => {
                    if (studentsWithLedgerTransport.has(pay.student_id)) return;
                    if (progressMap[pay.student_id]) {
                        progressMap[pay.student_id].paid += parseFloat(pay.amount || 0);
                        progressMap[pay.student_id].discount += parseFloat(pay.discount_amount || 0);
                        progressMap[pay.student_id].fine += parseFloat(pay.fine_paid || 0);
                    }
                });
            }

            // Add hostel fees ONLY for students NOT in unified ledger (avoid double counting)
            if (hostelData.length > 0) {
                hostelData.forEach(hostel => {
                    if (studentsWithLedgerHostel.has(hostel.student_id)) return; // Skip - ledger handles this
                    const fee = parseFloat(hostel.hostel_fee || 0);
                    const billingCycle = hostel.billing_cycle || 'monthly';
                    let totalHostelFee = fee;
                    if (billingCycle === 'monthly') {
                        totalHostelFee = fee * 12;
                    } else if (billingCycle === 'quarterly') {
                        totalHostelFee = fee * 4;
                    } else if (billingCycle === 'half_yearly') {
                        totalHostelFee = fee * 2;
                    }
                    if (progressMap[hostel.student_id]) {
                        progressMap[hostel.student_id].total += totalHostelFee;
                    }
                });
            }

            // Add hostel fee payments ONLY for students NOT in unified ledger
            if (hostelPayData.length > 0) {
                hostelPayData.forEach(pay => {
                    if (studentsWithLedgerHostel.has(pay.student_id)) return;
                    if (progressMap[pay.student_id]) {
                        progressMap[pay.student_id].paid += parseFloat(pay.amount || 0);
                        progressMap[pay.student_id].discount += parseFloat(pay.discount_amount || 0);
                        progressMap[pay.student_id].fine += parseFloat(pay.fine_paid || 0);
                    }
                });
            }

            // Add approved refunds (money returned to student, increases their balance)
            if (refundsData.length > 0) {
                refundsData.forEach(refund => {
                    if (progressMap[refund.student_id]) {
                        progressMap[refund.student_id].refunded += parseFloat(refund.refund_amount || 0);
                    }
                });
            }

            // Fee Engine 3.0: Add student_fee_ledger entries (includes academic + hostel + transport)
            if (ledgerData.length > 0) {
                ledgerData.forEach(entry => {
                    if (progressMap[entry.student_id]) {
                        progressMap[entry.student_id].total += parseFloat(entry.net_amount || 0);
                        progressMap[entry.student_id].paid += parseFloat(entry.paid_amount || 0);
                        progressMap[entry.student_id].discount += parseFloat(entry.discount_amount || 0);
                        progressMap[entry.student_id].fine += parseFloat(entry.fine_amount || 0);
                    }
                });
            }

            // Calculate balance and progress
            // Balance = Total + Fine - Paid - Discount + Refunded (refund adds back to balance, fine adds to total due)
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
            const chunks = chunkArray(studentIds, BATCH_SIZE);
            const allHostelData = (await Promise.all(chunks.map(async (chunk) => {
                const { data } = await supabase
                    .from('student_hostel_details')
                    .select('student_id, hostel:hostels(name), room:room_id(room_number_name)')
                    .in('student_id', chunk);
                return data || [];
            }))).flat();
            
            const hostelMap = {};
            if (allHostelData.length > 0) {
                allHostelData.forEach(h => {
                    hostelMap[h.student_id] = {
                        hostel_name: h.hostel?.name || 'Hostel',
                        room_no: h.room?.room_number_name || '-'
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
            const chunks = chunkArray(studentIds, BATCH_SIZE);
            const allTransportData = (await Promise.all(chunks.map(async (chunk) => {
                const { data } = await supabase
                    .from('student_transport_details')
                    .select('student_id, route:transport_routes(route_title), pickup:transport_pickup_points(name)')
                    .in('student_id', chunk);
                return data || [];
            }))).flat();
            
            const transportMap = {};
            if (allTransportData.length > 0) {
                allTransportData.forEach(t => {
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
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Collect Fees</h1>
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Select Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Class</label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-medium">Section</label>
                            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass || selectedClass === 'all'}>
                                <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sections</SelectItem>
                                    {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Admission Period</label>
                            <Select value={dateFilter} onValueChange={setDateFilter}>
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
                         <div className="space-y-2 md:col-span-2 lg:col-span-2">
                            <label className="text-sm font-medium">Instant Search</label>
                            <Input 
                                placeholder="Type any letter to search..."
                                value={keyword}
                                onChange={e => setKeyword(e.target.value)}
                            />
                        </div>
                    </div>
                    {dateFilter === 'custom' && (
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">From Date</label>
                                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">To Date</label>
                                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end mt-3">
                        <Button onClick={handleSearch} disabled={loading} className="h-10">
                            <RefreshCcw className="mr-2 h-4 w-4" />{loading ? 'Loading...' : 'Refresh'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {allStudents.length > 0 && (
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
                                    <div className="flex items-center gap-3 sm:gap-6">
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
                                    <div className="flex items-center gap-3 min-w-0 sm:min-w-[200px]">
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
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Student List
                                    <span className="text-sm font-normal text-muted-foreground ml-2">
                                        {keyword 
                                            ? `Showing ${students.length} of ${allStudents.length} students` 
                                            : `Total: ${allStudents.length} students`}
                                    </span>
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Input 
                                        placeholder="Type to search instantly..." 
                                        className="w-full sm:w-64 h-8" 
                                        value={keyword} 
                                        onChange={e => setKeyword(e.target.value)} 
                                    />
                                    {keyword && (
                                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setKeyword('')}>
                                            ?
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="p-2 sm:p-3 font-semibold text-left w-10">#</th>
                                                <th className="p-2 sm:p-3 font-semibold text-left">Student</th>
                                                <th className="p-2 sm:p-3 font-semibold text-left hidden sm:table-cell">Class</th>
                                                <th className="p-2 sm:p-3 font-semibold text-left hidden md:table-cell">Guardian / Phone</th>
                                                <th className="p-2 sm:p-3 font-semibold text-center hidden lg:table-cell">Hostel</th>
                                                <th className="p-2 sm:p-3 font-semibold text-center hidden lg:table-cell">Transport</th>
                                                <th className="p-2 sm:p-3 font-semibold text-left min-w-[180px] sm:min-w-[220px]">Fees Status</th>
                                                <th className="p-2 sm:p-3 font-semibold text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.length > 0 ? students.map((student, index) => {
                                                const fee = feesData[student.id] || { total: 0, paid: 0, discount: 0, refunded: 0, balance: 0, progress: 0 };
                                                const progressColor = fee.progress >= 100 ? 'text-green-600 dark:text-green-400' : fee.progress > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
                                                const progressBg = fee.progress >= 100 ? 'bg-green-50 dark:bg-green-950/30' : fee.progress > 0 ? 'bg-amber-50 dark:bg-amber-950/20' : '';
                                                const badgeColor = fee.progress >= 100 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : fee.progress > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
                                                const badgeText = fee.progress >= 100 ? 'Paid' : fee.progress > 0 ? 'Partial' : fee.total > 0 ? 'Unpaid' : 'No Fees';

                                                return (
                                                    <tr key={student.id} className={`border-b hover:bg-muted/50 transition-colors ${progressBg}`}>
                                                        <td className="p-2 sm:p-3 text-muted-foreground">{index + 1}</td>
                                                        <td className="p-2 sm:p-3">
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
                                                                    <p className="font-semibold text-foreground">{highlightText(student.full_name, keyword)}</p>
                                                                    <p className="text-xs text-muted-foreground">{highlightText(student.enrollment_id, keyword) || 'No Enroll ID'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-2 sm:p-3 hidden sm:table-cell">
                                                            <div>
                                                                <p className="font-medium">{student.classes?.name || '-'}</p>
                                                                {student.sections?.name && <p className="text-xs text-muted-foreground">Section: {student.sections.name}</p>}
                                                            </div>
                                                        </td>
                                                        <td className="p-2 sm:p-3 hidden md:table-cell">
                                                            <div>
                                                                <p className="font-medium text-sm">{highlightText(student.father_name || student.mother_name, keyword) || '-'}</p>
                                                                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                                                                    <Phone className="h-3 w-3" />
                                                                    {highlightText(getGuardianPhone(student), keyword)}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="p-2 sm:p-3 text-center hidden lg:table-cell">
                                                            {hostelAssignments[student.id] ? (
                                                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full dark:bg-purple-900 dark:text-purple-300" title={`${hostelAssignments[student.id].hostel_name} - Room ${hostelAssignments[student.id].room_no}`}>
                                                                    <Home className="h-3.5 w-3.5" />
                                                                    <span className="text-xs font-medium">Yes</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">-</span>
                                                            )}
                                                        </td>
                                                        <td className="p-2 sm:p-3 text-center hidden lg:table-cell">
                                                            {transportAssignments[student.id] ? (
                                                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900 dark:text-blue-300" title={`${transportAssignments[student.id].route} - ${transportAssignments[student.id].pickup_point}`}>
                                                                    <Bus className="h-3.5 w-3.5" />
                                                                    <span className="text-xs font-medium">Yes</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">-</span>
                                                            )}
                                                        </td>
                                                        <td className="p-2 sm:p-3">
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
                                                                {/* Show discount, fine, and refund if present */}
                                                                <div className="flex flex-wrap gap-1.5 text-xs">
                                                                    {fee.discount > 0 && (
                                                                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5" title="Discount Given">
                                                                            Disc: <IndianRupee className="h-2.5 w-2.5" />{fee.discount.toLocaleString('en-IN')}
                                                                        </span>
                                                                    )}
                                                                    {fee.fine > 0 && (
                                                                        <span className="text-orange-600 dark:text-orange-400 flex items-center gap-0.5" title="Fine Charged">
                                                                            Fine: <IndianRupee className="h-2.5 w-2.5" />{fee.fine.toLocaleString('en-IN')}
                                                                        </span>
                                                                    )}
                                                                    {fee.refunded > 0 && (
                                                                        <span className="text-blue-600 dark:text-blue-400 flex items-center gap-0.5" title="Refund Given">
                                                                            Refund: <IndianRupee className="h-2.5 w-2.5" />{fee.refunded.toLocaleString('en-IN')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {fee.balance > 0 && (
                                                                    <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-0.5">
                                                                        <AlertCircle className="h-3 w-3" />
                                                                        Due: <IndianRupee className="h-3 w-3" />{fee.balance.toLocaleString('en-IN')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-2 sm:p-3 text-center">
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
                                                    <td colSpan="8" className="p-12 text-center">
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

            {students.length === 0 && !loading && allStudents.length === 0 && (
                <Card className="p-10">
                    <div className="text-center text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>No students found. Click Refresh to load students.</p>
                    </div>
                </Card>
            )}

            {students.length === 0 && !loading && allStudents.length > 0 && keyword && (
                <Card className="p-10">
                    <div className="text-center text-muted-foreground">
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>No students match "{keyword}"</p>
                        <Button variant="link" className="mt-2" onClick={() => setKeyword('')}>
                            Clear search
                        </Button>
                    </div>
                </Card>
            )}
        </DashboardLayout>
    );
};

export default CollectFees;
