import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Loader2, User, Printer, RotateCcw, ShieldX, ExternalLink, FileText, CheckCircle, Clock, 
    Phone, Mail, Calendar, CreditCard, Banknote, AlertTriangle, GraduationCap, Users,
    IndianRupee, Receipt, History, ArrowLeft, Building2, Bus, Undo2, QrCode, X, Smartphone,
    MapPin, Bed, Plus, Save
} from 'lucide-react';
import { format, parseISO, addMonths, startOfMonth, isBefore, isAfter, isSameMonth } from 'date-fns';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import DatePicker from '@/components/ui/DatePicker';
import { generateTransactionId } from '@/lib/transactionUtils';
import { Checkbox } from '@/components/ui/checkbox';

// Helper: Generate all months between two dates
const getSessionMonths = (startDate, endDate) => {
    const months = [];
    let current = startOfMonth(new Date(startDate));
    const end = startOfMonth(new Date(endDate));
    
    while (isBefore(current, end) || isSameMonth(current, end)) {
        months.push({
            key: format(current, 'yyyy-MM'),
            label: format(current, 'MMMM yyyy'),
            shortLabel: format(current, 'MMM yy'),
            date: new Date(current)
        });
        current = addMonths(current, 1);
    }
    return months;
};

// Helper: Extract paid months from payments
const getPaidMonths = (payments) => {
    const paid = new Set();
    (payments || []).forEach(p => {
        if (p.payment_month) {
            // Handle formats like "February 2026", "Feb 2026", "2026-02"
            const monthStr = p.payment_month.toLowerCase().trim();
            // Try to parse and normalize
            const months = ['january', 'february', 'march', 'april', 'may', 'june', 
                           'july', 'august', 'september', 'october', 'november', 'december'];
            const shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                                'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            
            for (let i = 0; i < months.length; i++) {
                if (monthStr.includes(months[i]) || monthStr.includes(shortMonths[i])) {
                    // Extract year
                    const yearMatch = monthStr.match(/\d{4}/);
                    if (yearMatch) {
                        const year = yearMatch[0];
                        const monthNum = String(i + 1).padStart(2, '0');
                        paid.add(`${year}-${monthNum}`);
                    }
                    break;
                }
            }
            // Also handle yyyy-MM format directly
            if (monthStr.match(/^\d{4}-\d{2}$/)) {
                paid.add(monthStr);
            }
        }
    });
    return paid;
};

// Helper: Calculate annual fee based on billing cycle
// billing_cycle determines how the fee amount is interpreted:
// - monthly: fee � sessionMonths (e.g., ?5000/month � 12 = ?60,000/year)
// - quarterly: fee � ceil(sessionMonths/3) (e.g., ?15000/quarter � 4 = ?60,000/year)
// - half_yearly: fee � ceil(sessionMonths/6) (e.g., ?30000/semester � 2 = ?60,000/year)
// - annual: fee � 1 (e.g., ?60,000/year)
// - one_time: fee � 1 (e.g., ?10,000 one-time)
const calculateFeeDetails = (fee, billingCycle = 'monthly', sessionMonths = 12) => {
    const periods = {
        monthly: sessionMonths,
        quarterly: Math.ceil(sessionMonths / 3),
        half_yearly: Math.ceil(sessionMonths / 6),
        annual: 1,
        one_time: 1
    };
    const periodsCount = periods[billingCycle] || sessionMonths; // Default to monthly if unknown
    const totalFee = fee * periodsCount;
    const perMonthEquivalent = totalFee / sessionMonths;
    
    return {
        periodFee: fee,          // Fee per billing period
        billingCycle,            // The billing cycle
        periodsCount,            // Number of periods in session
        totalFee,                // Total fee for full session
        perMonthEquivalent,      // Monthly equivalent for month-based collection
        isMonthlyChargeable: billingCycle === 'monthly' // Whether to show month selection UI
    };
};

// Helper: Get billing cycle label for display
const getBillingCycleLabel = (cycle) => {
    const labels = {
        monthly: 'Monthly',
        quarterly: 'Quarterly',
        half_yearly: 'Half-Yearly',
        annual: 'Annual',
        one_time: 'One-Time'
    };
    return labels[cycle] || cycle;
};

// Summary Card Component with variants
const SummaryCard = ({ title, amount, icon: Icon, variant = 'default', currencySymbol = '?' }) => {
    const variants = {
        default: 'bg-card border',
        success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
        warning: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
        danger: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
        primary: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    };
    const iconColors = {
        default: 'text-muted-foreground',
        success: 'text-green-600',
        warning: 'text-amber-600',
        danger: 'text-red-600',
        primary: 'text-blue-600',
    };
    return (
        <Card className={variants[variant]}>
            <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">{title}</p>
                        <p className="text-lg xl:text-xl font-bold mt-0.5 truncate">{currencySymbol}{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className={`p-2 rounded-full bg-background/50 flex-shrink-0 ${iconColors[variant]}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// Info Row Component for student details
const InfoRow = ({ icon: Icon, label, value, className = '' }) => (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-medium truncate">{value || '-'}</span>
    </div>
);

const StudentFees = () => {
    const { studentId, roleSlug } = useParams();
    const navigate = useNavigate();
    const basePath = roleSlug || 'super-admin';
    const { user, school, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const branchId = user?.profile?.branch_id;
    const currencySymbol = school?.currency_symbol || '?';

    const [student, setStudent] = useState(null);
    const [classTeacher, setClassTeacher] = useState(null);
    const [fees, setFees] = useState([]);
    const [transportDetails, setTransportDetails] = useState(null); // Transport fee details
    const [hostelDetails, setHostelDetails] = useState(null); // Hostel fee details
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [selectedFees, setSelectedFees] = useState([]);
    const collectFeesRef = useRef(null);
    const [feeAmounts, setFeeAmounts] = useState({}); // { feeId: amount } per-fee editable amounts
    const [activeTab, setActiveTab] = useState('fees');
    const [paymentDetails, setPaymentDetails] = useState({
        amount: '',
        discount: '0',
        fine: '0',
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        payment_mode: 'Cash',
        note: '',
        utr_number: ''
    });
    const [paymentToRevoke, setPaymentToRevoke] = useState(null);
    const [revokeType, setRevokeType] = useState('academic'); // 'academic', 'transport', 'hostel'
    
    // Transport/Hostel payment state
    const [transportPaymentDetails, setTransportPaymentDetails] = useState({
        amount: '', discount: '0', fine: '0', payment_date: format(new Date(), 'yyyy-MM-dd'), payment_mode: 'Cash', note: '', utr_number: ''
    });
    const [hostelPaymentDetails, setHostelPaymentDetails] = useState({
        amount: '', discount: '0', fine: '0', payment_date: format(new Date(), 'yyyy-MM-dd'), payment_mode: 'Cash', note: '', utr_number: ''
    });
    
    // Monthly fee tracking
    const [sessionMonths, setSessionMonths] = useState([]); // All months in session
    const [selectedTransportMonths, setSelectedTransportMonths] = useState([]); // Months selected for payment
    const [selectedHostelMonths, setSelectedHostelMonths] = useState([]); // Months selected for payment
    
    const [revokeReason, setRevokeReason] = useState('');
    
    // Refund state
    const [refundDialogOpen, setRefundDialogOpen] = useState(false);
    const [refundPayment, setRefundPayment] = useState(null); // Payment being refunded
    const [refundDetails, setRefundDetails] = useState({
        refund_amount: '',
        refund_reason: '',
        refund_mode: 'Cash',
        note: ''
    });
    const [refundType, setRefundType] = useState('academic'); // academic/transport/hostel
    const [studentRefunds, setStudentRefunds] = useState([]); // Existing refund records
    
    // Student assigned discounts
    const [studentDiscounts, setStudentDiscounts] = useState([]);
    
    // UPI QR Payment state
    const [upiSettings, setUpiSettings] = useState({ enabled: false, upi_id: '', merchant_name: '' });
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
    const [qrPaymentType, setQrPaymentType] = useState('academic'); // academic/transport/hostel

    // ── Transport/Hostel Assignment State ──
    const [transportAssignOpen, setTransportAssignOpen] = useState(false);
    const [hostelAssignOpen, setHostelAssignOpen] = useState(false);
    const [assignSaving, setAssignSaving] = useState(false);
    const [transportRoutes, setTransportRoutes] = useState([]);
    const [transportPickupPoints, setTransportPickupPoints] = useState([]);
    const [routePickupPoints, setRoutePickupPoints] = useState([]);
    const [routeVehicles, setRouteVehicles] = useState([]);
    const [hostelsList, setHostelsList] = useState([]);
    const [hostelRooms, setHostelRooms] = useState([]);
    const [hostelRoomTypes, setHostelRoomTypes] = useState([]);
    const [assignedBeds, setAssignedBeds] = useState([]);
    const [transportForm, setTransportForm] = useState({
        transport_route_id: '', transport_pickup_point_id: '', transport_fee: '',
        billing_cycle: 'monthly', pickup_time: '', drop_time: '',
        vehicle_number: '', driver_name: '', driver_contact: '', special_instructions: ''
    });
    const [hostelForm, setHostelForm] = useState({
        hostel_id: '', room_id: '', room_type_id: '', bed_number: '',
        hostel_fee: '', billing_cycle: 'monthly', check_in_date: '', hostel_guardian_contact: ''
    });

    const fetchStudentAndFees = useCallback(async () => {
        // Validate studentId is a proper UUID (not a route template like ':studentId')
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!studentId || !uuidRegex.test(studentId) || !selectedBranch?.id) return;
        setLoading(true);
        try {
            // Fetch student with class, section, and session details
            const studentRes = await supabase
                .from('student_profiles')
                .select(`
                    *, 
                    classes!student_profiles_class_id_fkey(id, name), 
                    sections!student_profiles_section_id_fkey(id, name),
                    sessions(name, start_date, end_date)
                `)
                .eq('id', studentId)
                .eq('branch_id', selectedBranch.id)
                .maybeSingle();

            if (studentRes.error) throw studentRes.error;
            if (!studentRes.data) {
                toast({ variant: 'destructive', title: 'Student not found', description: 'No student found with this ID in the selected branch.' });
                setLoading(false);
                return;
            }
            setStudent(studentRes.data);

            // ====================================================================
            // CHECK IF BRANCH USES NEW FEE ARCHITECTURE (fee_structures + fee_rules)
            // If YES → Skip OLD auto-allocation (fee_group_class_assignments is not used)
            // ====================================================================
            const { data: newArchCheck } = await supabase
                .from('fee_structures')
                .select('id')
                .eq('branch_id', selectedBranch.id)
                .eq('session_id', currentSessionId)
                .limit(1);
            
            const usesNewArchitecture = newArchCheck && newArchCheck.length > 0;
            
            // ====================================================================
            // AUTO-ALLOCATE FEES (OLD ARCHITECTURE ONLY):
            // Skip if branch uses NEW architecture (fee_structures)
            // ====================================================================
            if (studentRes.data.class_id && !usesNewArchitecture) {
                // Step 1: Get fee_group_class_assignments for this student's class
                const { data: classAssignments } = await supabase
                    .from('fee_group_class_assignments')
                    .select('fee_group_id')
                    .eq('class_id', studentRes.data.class_id)
                    .eq('branch_id', selectedBranch.id)
                    .eq('session_id', currentSessionId)
                    .eq('is_active', true)
                    .or(`section_id.is.null,section_id.eq.${studentRes.data.section_id || 'null'}`);
                
                if (classAssignments && classAssignments.length > 0) {
                    const feeGroupIds = [...new Set(classAssignments.map(a => a.fee_group_id))];
                    
                    // Step 2: Get all fee_masters for these fee groups
                    const { data: feeMasters } = await supabase
                        .from('fee_masters')
                        .select('id')
                        .in('fee_group_id', feeGroupIds)
                        .eq('branch_id', selectedBranch.id)
                        .eq('session_id', currentSessionId);
                    
                    if (feeMasters && feeMasters.length > 0) {
                        // Step 3: Get existing allocations for this student
                        const { data: existingAllocations } = await supabase
                            .from('student_fee_allocations')
                            .select('fee_master_id')
                            .eq('student_id', studentId)
                            .eq('branch_id', selectedBranch.id)
                            .eq('session_id', currentSessionId);
                        
                        const existingMasterIds = new Set((existingAllocations || []).map(a => a.fee_master_id));
                        
                        // Step 4: Create missing allocations
                        const missingAllocations = feeMasters
                            .filter(fm => !existingMasterIds.has(fm.id))
                            .map(fm => ({
                                student_id: studentId,
                                fee_master_id: fm.id,
                                branch_id: selectedBranch.id,
                                session_id: currentSessionId,
                                organization_id: organizationId,
                            }));
                        
                        if (missingAllocations.length > 0) {
                            const { error: allocError } = await supabase
                                .from('student_fee_allocations')
                                .upsert(missingAllocations, { 
                                    onConflict: 'student_id,fee_master_id',
                                    ignoreDuplicates: true 
                                });
                            
                            if (allocError) {
                                console.warn('Auto-allocation error (may be duplicates):', allocError);
                            } else {
                                console.log(`Auto-allocated ${missingAllocations.length} fees for student`);
                            }
                        }
                    }
                }
            }
            // ====================================================================

            // Fetch class teacher if class exists
            if (studentRes.data.class_id) {
                const { data: teacherData } = await supabase
                    .from('class_teachers')
                    .select('teacher:teacher_id(id, full_name, phone, email)')
                    .eq('class_id', studentRes.data.class_id)
                    .eq('section_id', studentRes.data.section_id)
                    .eq('branch_id', selectedBranch.id)
                    .maybeSingle();
                
                if (teacherData?.teacher) {
                    setClassTeacher(teacherData.teacher);
                }
            }

            const [allocationsRes, paymentsRes, ledgerRes] = await Promise.all([
                supabase
                    .from('student_fee_allocations')
                    .select(`
                        id,
                        fee_master:fee_masters (
                            *,
                            fee_group:fee_groups (name),
                            fee_type:fee_types (name, code)
                        )
                    `)
                    .eq('student_id', studentId)
                    .eq('branch_id', selectedBranch.id)
                    .eq('session_id', currentSessionId),
                supabase
                    .from('fee_payments')
                    .select(`*, fee_master:fee_masters(*, fee_group:fee_groups(name), fee_type:fee_types(name))`)
                    .eq('student_id', studentId)
                    .eq('branch_id', selectedBranch.id)
                    .eq('session_id', currentSessionId)
                    .order('payment_date', { ascending: false }),
                // Fee Engine 3.0: Fetch student_fee_ledger entries (exclude cancelled)
                supabase
                    .from('student_fee_ledger')
                    .select(`
                        *,
                        fee_type:fee_types(name, code),
                        fee_structure:fee_structures(name)
                    `)
                    .eq('student_id', studentId)
                    .eq('branch_id', selectedBranch.id)
                    .eq('session_id', currentSessionId)
                    .neq('status', 'cancelled')
            ]);

            if (allocationsRes.error) throw allocationsRes.error;
            if (paymentsRes.error) throw paymentsRes.error;
            
            setPayments(paymentsRes.data || []);

            // ── OLD SYSTEM: Process fee_allocations + fee_masters ──
            const processedOldFees = (allocationsRes.data || []).map(item => {
                const master = item.fee_master;
                if (!master) return null;

                const validPayments = (paymentsRes.data || []).filter(p => p.fee_master_id === master.id && !p.reverted_at);
                
                const totalPaid = validPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                const totalDiscount = validPayments.reduce((sum, p) => sum + (Number(p.discount_amount) || 0), 0);
                const totalFine = validPayments.reduce((sum, p) => sum + (Number(p.fine_paid) || 0), 0);
                const masterAmount = Number(master.amount) || 0;
                const balance = Math.max(0, masterAmount - totalPaid - totalDiscount);

                let fine = 0;
                let isOverdue = false;
                if (balance > 0 && master.due_date) {
                    const dueDate = parseISO(master.due_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (today > dueDate) {
                        isOverdue = true;
                        if (master.fine_type === 'Fixed') {
                            fine = Number(master.fine_value) || 0;
                        } else if (master.fine_type === 'Percentage') {
                            fine = (masterAmount * (Number(master.fine_value) || 0)) / 100;
                        }
                    }
                }

                return {
                    id: item.id,
                    masterId: master.id,
                    group: master.fee_group?.name || 'N/A',
                    type: master.fee_type?.code || 'N/A',
                    typeName: master.fee_type?.name || 'N/A',
                    dueDate: master.due_date,
                    amount: masterAmount,
                    status: balance <= 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid',
                    totalPaid,
                    totalDiscount,
                    totalFine,
                    balance,
                    fine,
                    isOverdue,
                    source: 'old', // Mark as old system
                };
            }).filter(Boolean);

            // ── NEW SYSTEM (Fee Engine 3.0): Process student_fee_ledger ──
            const ledgerEntries = (ledgerRes.data || []).map(entry => {
                const netAmount = Number(entry.net_amount) || 0;
                const paidAmount = Number(entry.paid_amount) || 0;
                const discountAmount = Number(entry.discount_amount) || 0;
                const fineAmount = Number(entry.fine_amount) || 0;
                const balance = Math.max(0, netAmount - paidAmount - discountAmount);

                let fine = 0;
                let isOverdue = false;
                if (balance > 0 && entry.due_date) {
                    const dueDate = parseISO(entry.due_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (today > dueDate) {
                        isOverdue = true;
                    }
                }

                // Determine group label — for hostel/transport show billing period
                const feeSource = entry.fee_source || 'academic';
                let groupLabel = entry.fee_structure?.name || 'Fee Engine 3.0';
                if (feeSource === 'hostel') groupLabel = `Hostel${entry.billing_period ? ' - ' + entry.billing_period : ''}`;
                if (feeSource === 'transport') groupLabel = `Transport${entry.billing_period ? ' - ' + entry.billing_period : ''}`;

                return {
                    id: entry.id,
                    ledgerId: entry.id,
                    masterId: null,
                    group: groupLabel,
                    type: entry.fee_type?.code || 'N/A',
                    typeName: entry.fee_type?.name || 'N/A',
                    dueDate: entry.due_date,
                    amount: netAmount,
                    status: entry.status === 'paid' ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid',
                    totalPaid: paidAmount,
                    totalDiscount: discountAmount,
                    totalFine: fineAmount,
                    balance,
                    fine,
                    isOverdue,
                    installment_number: entry.installment_number,
                    source: 'ledger', // Mark as new system
                    fee_source: feeSource,
                    billing_period: entry.billing_period,
                    fee_structure_id: entry.fee_structure_id,
                };
            });

            // Merge old + new fees, sort by due date
            const processedFees = [...processedOldFees, ...ledgerEntries]
              .sort((a, b) => {
                  if (!a.dueDate && !b.dueDate) return 0;
                  if (!a.dueDate) return 1;
                  if (!b.dueDate) return -1;
                  return new Date(a.dueDate) - new Date(b.dueDate);
              });

            setFees(processedFees);

            // Calculate session months from student's session data
            const sessionData = studentRes.data.sessions;
            let months = [];
            if (sessionData?.start_date && sessionData?.end_date) {
                months = getSessionMonths(sessionData.start_date, sessionData.end_date);
            }
            setSessionMonths(months);
            const totalSessionMonths = months.length || 12; // Default 12 if no session data

            // Fetch transport details for this student
            const { data: transportData } = await supabase
                .from('student_transport_details')
                .select(`
                    *,
                    route:transport_route_id(id, route_title),
                    pickup_point:transport_pickup_point_id(id, name)
                `)
                .eq('student_id', studentId)
                .eq('branch_id', selectedBranch.id)
                .maybeSingle();

            if (transportData) {
                // Check for transport payments
                const { data: transportPayments } = await supabase
                    .from('transport_fee_payments')
                    .select('*')
                    .eq('student_id', studentId)
                    .eq('branch_id', selectedBranch.id)
                    .is('reverted_at', null);

                // Get billing cycle from student_transport_details (saved during admission) or default to monthly
                const billingCycle = transportData.billing_cycle || 'monthly';
                const periodFee = Number(transportData.transport_fee) || 0;
                const isAnnualType = billingCycle === 'annual' || billingCycle === 'one_time';
                
                // Calculate fee details based on billing cycle
                const feeDetails = calculateFeeDetails(periodFee, billingCycle, totalSessionMonths);
                const { totalFee: totalTransportFee, perMonthEquivalent } = feeDetails;
                
                // For annual/one_time: use actual paid amounts (any amount allowed)
                // For monthly: use month-count based calculation
                const paidMonthsSet = getPaidMonths(transportPayments);
                const paidMonthsCount = paidMonthsSet.size;
                const transportDiscount = (transportPayments || []).reduce((sum, p) => sum + (Number(p.discount_amount) || 0), 0);
                
                let transportPaid, transportBalance, unpaidMonthsCount;
                if (isAnnualType) {
                    // Annual/One-time: balance = totalFee - actual amounts paid - discounts
                    transportPaid = (transportPayments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                    transportBalance = Math.max(0, totalTransportFee - transportPaid - transportDiscount);
                    unpaidMonthsCount = transportBalance > 0 ? 1 : 0;
                } else {
                    // Monthly: use month-based calculation
                    transportPaid = paidMonthsCount * perMonthEquivalent;
                    unpaidMonthsCount = totalSessionMonths - paidMonthsCount;
                    transportBalance = unpaidMonthsCount * perMonthEquivalent;
                }
                
                // Mark unpaid months
                const unpaidMonths = months.filter(m => !paidMonthsSet.has(m.key));

                setTransportDetails({
                    ...transportData,
                    billingCycle,
                    isAnnualType,
                    periodFee,                          // Fee per billing period
                    monthlyFee: perMonthEquivalent,     // Monthly equivalent for collection
                    totalMonths: totalSessionMonths,
                    totalFee: totalTransportFee,
                    paidMonths: Array.from(paidMonthsSet),
                    paidMonthsCount,
                    unpaidMonths,
                    unpaidMonthsCount,
                    totalPaid: transportPaid,
                    totalDiscount: transportDiscount,
                    balance: transportBalance,
                    status: transportBalance <= 0 ? 'Paid' : transportPaid > 0 ? 'Partial' : 'Unpaid',
                    payments: transportPayments || []
                });
                
                // Reset selected months
                setSelectedTransportMonths([]);
            } else {
                setTransportDetails(null);
            }

            // Fetch hostel details for this student
            const { data: hostelData } = await supabase
                .from('student_hostel_details')
                .select(`
                    *,
                    room:room_id(id, room_number_name, cost_per_bed),
                    room_type:hostel_room_type(id, name)
                `)
                .eq('student_id', studentId)
                .eq('branch_id', selectedBranch.id)
                .maybeSingle();

            if (hostelData) {
                // Check for hostel payments
                const { data: hostelPayments } = await supabase
                    .from('hostel_fee_payments')
                    .select('*')
                    .eq('student_id', studentId)
                    .eq('branch_id', selectedBranch.id)
                    .is('reverted_at', null);

                // Get billing cycle from student_hostel_details (saved during admission) or default to monthly
                const billingCycle = hostelData.billing_cycle || 'monthly';
                const periodFee = Number(hostelData.hostel_fee) || 0;
                const isAnnualType = billingCycle === 'annual' || billingCycle === 'one_time';
                
                // Calculate fee details based on billing cycle
                const feeDetails = calculateFeeDetails(periodFee, billingCycle, totalSessionMonths);
                const { totalFee: totalHostelFee, perMonthEquivalent } = feeDetails;
                
                // For annual/one_time: use actual paid amounts (any amount allowed)
                // For monthly: use month-count based calculation
                const paidMonthsSet = getPaidMonths(hostelPayments);
                const paidMonthsCount = paidMonthsSet.size;
                const hostelDiscount = (hostelPayments || []).reduce((sum, p) => sum + (Number(p.discount_amount) || 0), 0);
                
                let hostelPaid, hostelBalance, unpaidMonthsCount;
                if (isAnnualType) {
                    // Annual/One-time: balance = totalFee - actual amounts paid - discounts
                    hostelPaid = (hostelPayments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                    hostelBalance = Math.max(0, totalHostelFee - hostelPaid - hostelDiscount);
                    unpaidMonthsCount = hostelBalance > 0 ? 1 : 0;
                } else {
                    // Monthly: use month-based calculation
                    hostelPaid = paidMonthsCount * perMonthEquivalent;
                    unpaidMonthsCount = totalSessionMonths - paidMonthsCount;
                    hostelBalance = unpaidMonthsCount * perMonthEquivalent;
                }
                
                // Mark unpaid months
                const unpaidMonths = months.filter(m => !paidMonthsSet.has(m.key));

                setHostelDetails({
                    ...hostelData,
                    billingCycle,
                    isAnnualType,
                    periodFee,                          // Fee per billing period
                    monthlyFee: perMonthEquivalent,     // Monthly equivalent for collection
                    totalMonths: totalSessionMonths,
                    totalFee: totalHostelFee,
                    paidMonths: Array.from(paidMonthsSet),
                    paidMonthsCount,
                    unpaidMonths,
                    unpaidMonthsCount,
                    totalPaid: hostelPaid,
                    totalDiscount: hostelDiscount,
                    balance: hostelBalance,
                    status: hostelBalance <= 0 ? 'Paid' : hostelPaid > 0 ? 'Partial' : 'Unpaid',
                    payments: hostelPayments || []
                });
                
                // Reset selected months
                setSelectedHostelMonths([]);
            } else {
                setHostelDetails(null);
            }

            // Fetch assigned discounts for this student
            const { data: discountAssignments } = await supabase
                .from('student_fee_discounts')
                .select(`
                    id,
                    discount:discount_id(
                        id, name, discount_code, discount_type, amount, use_count, expire_date, description
                    )
                `)
                .eq('student_id', studentId)
                .eq('branch_id', selectedBranch.id);

            if (discountAssignments && discountAssignments.length > 0) {
                const validDiscounts = discountAssignments
                    .filter(d => d.discount)
                    .map(d => d.discount)
                    .filter(d => !d.expire_date || new Date(d.expire_date) >= new Date());
                setStudentDiscounts(validDiscounts);
            } else {
                setStudentDiscounts([]);
            }

            // Fetch refund records for this student
            const { data: refundData } = await supabase
                .from('fee_refunds')
                .select('*')
                .eq('student_id', studentId)
                .eq('branch_id', selectedBranch.id)
                .order('created_at', { ascending: false });
            
            setStudentRefunds(refundData || []);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching data', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [studentId, selectedBranch?.id, toast]);

    useEffect(() => {
        if (studentId && selectedBranch?.id) {
            fetchStudentAndFees();
        }
    }, [fetchStudentAndFees, studentId, selectedBranch?.id]);

    // ══════════════════════════════════════════════════════════════════
    // UNIFIED FEE LEDGER: Auto-write hostel/transport fees to student_fee_ledger
    // Per UNIFIED_FEE_LEDGER_MASTER_PLAN - "3 rivers, 1 ocean"
    // ══════════════════════════════════════════════════════════════════
    const writeFeesToLedger = useCallback(async ({ feeSource, feeTypeId, amount, billingCycle, sourceRefId }) => {
        if (!studentId || !selectedBranch?.id || !currentSessionId || !organizationId) return;
        if (!amount || amount <= 0) return; // No rows to write for zero-fee

        // Get session dates to calculate billing periods
        const { data: sessionData } = await supabase
            .from('sessions')
            .select('start_date, end_date')
            .eq('id', currentSessionId)
            .single();

        if (!sessionData?.start_date || !sessionData?.end_date) return;

        const rows = [];
        const startDate = new Date(sessionData.start_date);
        const endDate = new Date(sessionData.end_date);

        if (billingCycle === 'annual' || billingCycle === 'one_time') {
            // Single row for annual/one-time
            rows.push({
                student_id: studentId,
                fee_source: feeSource,
                fee_type_id: feeTypeId,
                fee_structure_id: null,
                original_amount: amount,
                net_amount: amount,
                paid_amount: 0,
                discount_amount: 0,
                concession_amount: 0,
                fine_amount: 0,
                installment_number: 1,
                due_date: format(startDate, 'yyyy-MM-dd'),
                billing_period: billingCycle === 'annual' ? 'Annual' : 'One-Time',
                status: 'pending',
                is_paid: false,
                assigned_by: 'system',
                source_reference_id: sourceRefId || null,
                branch_id: selectedBranch.id,
                session_id: currentSessionId,
                organization_id: organizationId,
            });
        } else {
            // Monthly / Quarterly / Half-yearly → generate rows per period
            let current = startOfMonth(startDate);
            const end = startOfMonth(endDate);
            let installment = 0;
            const monthInterval = billingCycle === 'quarterly' ? 3 : billingCycle === 'half_yearly' ? 6 : 1;

            while (isBefore(current, end) || isSameMonth(current, end)) {
                installment++;
                rows.push({
                    student_id: studentId,
                    fee_source: feeSource,
                    fee_type_id: feeTypeId,
                    fee_structure_id: null,
                    original_amount: amount,
                    net_amount: amount,
                    paid_amount: 0,
                    discount_amount: 0,
                    concession_amount: 0,
                    fine_amount: 0,
                    installment_number: installment,
                    due_date: format(current, 'yyyy-MM-dd'),
                    billing_period: format(current, 'MMMM yyyy'),
                    status: 'pending',
                    is_paid: false,
                    assigned_by: 'system',
                    source_reference_id: sourceRefId || null,
                    branch_id: selectedBranch.id,
                    session_id: currentSessionId,
                    organization_id: organizationId,
                });
                current = addMonths(current, monthInterval);
            }
        }

        if (rows.length > 0) {
            const { error } = await supabase
                .from('student_fee_ledger')
                .insert(rows);
            if (error) {
                console.error(`Failed to write ${feeSource} ledger rows:`, error);
            } else {
                console.log(`✅ Written ${rows.length} ${feeSource} ledger rows for student`);
            }
        }
    }, [studentId, selectedBranch?.id, currentSessionId, organizationId]);

    // Cancel future unpaid ledger rows when hostel/transport is removed
    const cancelLedgerRows = useCallback(async (feeSource, sourceRefId) => {
        if (!studentId || !selectedBranch?.id || !currentSessionId) return;

        const query = supabase
            .from('student_fee_ledger')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('student_id', studentId)
            .eq('branch_id', selectedBranch.id)
            .eq('session_id', currentSessionId)
            .eq('fee_source', feeSource)
            .in('status', ['pending']); // Only cancel unpaid rows

        if (sourceRefId) {
            query.eq('source_reference_id', sourceRefId);
        }

        const { error } = await query;
        if (error) {
            console.error(`Failed to cancel ${feeSource} ledger rows:`, error);
        } else {
            console.log(`✅ Cancelled unpaid ${feeSource} ledger rows`);
        }
    }, [studentId, selectedBranch?.id, currentSessionId]);

    // Update unpaid ledger rows when fee amount changes
    const updateLedgerFeeAmount = useCallback(async (feeSource, newAmount, sourceRefId) => {
        if (!studentId || !selectedBranch?.id || !currentSessionId) return;

        const query = supabase
            .from('student_fee_ledger')
            .update({
                original_amount: newAmount,
                net_amount: newAmount,
                updated_at: new Date().toISOString()
            })
            .eq('student_id', studentId)
            .eq('branch_id', selectedBranch.id)
            .eq('session_id', currentSessionId)
            .eq('fee_source', feeSource)
            .in('status', ['pending']); // Only update unpaid rows

        if (sourceRefId) {
            query.eq('source_reference_id', sourceRefId);
        }

        const { error } = await query;
        if (error) {
            console.error(`Failed to update ${feeSource} ledger amounts:`, error);
        }
    }, [studentId, selectedBranch?.id, currentSessionId]);

    // ── Transport Assignment Helpers ──
    const openTransportAssign = async () => {
        const bId = selectedBranch?.id;
        if (!bId) return;
        const [routesRes, ppRes] = await Promise.all([
            supabase.from('transport_routes').select('*').eq('branch_id', bId),
            supabase.from('transport_pickup_points').select('*').eq('branch_id', bId)
        ]);
        setTransportRoutes(routesRes.data || []);
        setTransportPickupPoints(ppRes.data || []);
        // Pre-fill if already assigned
        if (transportDetails) {
            setTransportForm({
                transport_route_id: transportDetails.transport_route_id || '',
                transport_pickup_point_id: transportDetails.transport_pickup_point_id || '',
                transport_fee: transportDetails.transport_fee || '',
                billing_cycle: transportDetails.billing_cycle || 'monthly',
                pickup_time: transportDetails.pickup_time || '',
                drop_time: transportDetails.drop_time || '',
                vehicle_number: transportDetails.vehicle_number || '',
                driver_name: transportDetails.driver_name || '',
                driver_contact: transportDetails.driver_contact || '',
                special_instructions: transportDetails.special_instructions || ''
            });
            // Load route-specific pickup points
            if (transportDetails.transport_route_id) {
                loadRoutePickupPoints(transportDetails.transport_route_id);
            }
        } else {
            setTransportForm({ transport_route_id: '', transport_pickup_point_id: '', transport_fee: '', billing_cycle: 'monthly', pickup_time: '', drop_time: '', vehicle_number: '', driver_name: '', driver_contact: '', special_instructions: '' });
            setRoutePickupPoints([]);
            setRouteVehicles([]);
        }
        setTransportAssignOpen(true);
    };

    const loadRoutePickupPoints = async (routeId) => {
        if (!routeId) { setRoutePickupPoints([]); setRouteVehicles([]); return; }
        const [mappingsRes, vehiclesRes] = await Promise.all([
            supabase.from('route_pickup_point_mappings').select('pickup_point_id, monthly_fees, pickup_time, stop_order, pickup_point:pickup_point_id(id, name)').eq('route_id', routeId).order('stop_order'),
            supabase.from('route_vehicle_assignments').select('vehicle_id, vehicle:vehicle_id(*)').eq('route_id', routeId)
        ]);
        setRoutePickupPoints((mappingsRes.data || []).filter(m => m.pickup_point).map(m => ({ ...m.pickup_point, monthly_fees: m.monthly_fees, pickup_time: m.pickup_time })));
        setRouteVehicles((vehiclesRes.data || []).filter(a => a.vehicle).map(a => a.vehicle));
    };

    const handleTransportRouteChange = async (routeId) => {
        setTransportForm(prev => ({ ...prev, transport_route_id: routeId, transport_pickup_point_id: '', vehicle_number: '', driver_name: '', driver_contact: '' }));
        await loadRoutePickupPoints(routeId);
    };

    const handleTransportPickupChange = async (ppId) => {
        if (transportForm.transport_route_id && ppId) {
            const { data } = await supabase.from('route_pickup_point_mappings').select('monthly_fees, pickup_time').eq('route_id', transportForm.transport_route_id).eq('pickup_point_id', ppId).single();
            setTransportForm(prev => ({ ...prev, transport_pickup_point_id: ppId, transport_fee: data?.monthly_fees || prev.transport_fee, pickup_time: data?.pickup_time || prev.pickup_time }));
        } else {
            setTransportForm(prev => ({ ...prev, transport_pickup_point_id: ppId }));
        }
    };

    const handleTransportVehicleSelect = (vehicleId) => {
        const v = routeVehicles.find(rv => rv.id === vehicleId);
        if (v) setTransportForm(prev => ({ ...prev, vehicle_number: v.vehicle_number, driver_name: v.driver_name, driver_contact: v.driver_contact }));
    };

    const saveTransportAssignment = async () => {
        if (!transportForm.transport_route_id) {
            toast({ variant: 'destructive', title: 'Route is required' }); return;
        }
        setAssignSaving(true);
        const payload = {
            student_id: studentId, branch_id: selectedBranch.id, session_id: currentSessionId,
            transport_route_id: transportForm.transport_route_id || null,
            transport_pickup_point_id: transportForm.transport_pickup_point_id || null,
            transport_fee: transportForm.transport_fee ? parseFloat(transportForm.transport_fee) : null,
            billing_cycle: transportForm.billing_cycle || 'monthly',
            pickup_time: transportForm.pickup_time || null,
            drop_time: transportForm.drop_time || null,
            vehicle_number: transportForm.vehicle_number || null,
            driver_name: transportForm.driver_name || null,
            driver_contact: transportForm.driver_contact || null,
            special_instructions: transportForm.special_instructions || null
        };
        let error, savedId;
        if (transportDetails?.id) {
            const { error: e } = await supabase.from('student_transport_details').update(payload).eq('id', transportDetails.id);
            error = e;
            savedId = transportDetails.id;
        } else {
            const { data: inserted, error: e } = await supabase.from('student_transport_details').insert(payload).select('id').single();
            error = e;
            savedId = inserted?.id;
        }
        if (error) {
            toast({ variant: 'destructive', title: 'Error saving transport', description: error.message });
        } else {
            const feeVal = parseFloat(transportForm.transport_fee) || 0;

            // ── UNIFIED LEDGER: Auto-write transport fees ──
            // Cancel any existing unpaid transport ledger rows first (handles updates)
            await cancelLedgerRows('transport', null);

            if (feeVal > 0) {
                // Lookup transport fee type ID dynamically (code: TRANSPORT)
                const { data: feeType } = await supabase
                    .from('fee_types')
                    .select('id')
                    .eq('branch_id', selectedBranch.id)
                    .eq('session_id', currentSessionId)
                    .eq('code', 'TRANSPORT')
                    .maybeSingle();

                await writeFeesToLedger({
                    feeSource: 'transport',
                    feeTypeId: feeType?.id || null,
                    amount: feeVal,
                    billingCycle: transportForm.billing_cycle || 'monthly',
                    sourceRefId: savedId
                });
                toast({ title: 'Transport assigned successfully!', description: `₹${feeVal} per ${transportForm.billing_cycle || 'month'} written to fee ledger.` });
            } else {
                toast({ variant: 'default', title: 'Transport assigned (Fee ₹0)', description: '⚠️ Transport fee is ₹0. Edit the assignment to set the correct fee amount.' });
            }

            setTransportAssignOpen(false);
            await fetchStudentAndFees();
        }
        setAssignSaving(false);
    };

    const removeTransportAssignment = async () => {
        if (!transportDetails?.id) return;
        setAssignSaving(true);

        // ── UNIFIED LEDGER: Cancel unpaid transport ledger rows first ──
        await cancelLedgerRows('transport', null);

        const { error } = await supabase.from('student_transport_details').delete().eq('id', transportDetails.id);
        if (error) {
            toast({ variant: 'destructive', title: 'Error removing transport', description: error.message });
        } else {
            toast({ title: 'Transport removed', description: 'Unpaid transport fee entries cancelled from ledger.' });
            setTransportAssignOpen(false);
            await fetchStudentAndFees();
        }
        setAssignSaving(false);
    };

    // ── Hostel Assignment Helpers ──
    const openHostelAssign = async () => {
        const bId = selectedBranch?.id;
        if (!bId) return;
        const [hostelsRes, roomsRes, rtRes] = await Promise.all([
            supabase.from('hostels').select('*').eq('branch_id', bId),
            supabase.from('hostel_rooms').select('*, hostels(name)').eq('branch_id', bId),
            supabase.from('hostel_room_types').select('*').eq('branch_id', bId)
        ]);
        setHostelsList(hostelsRes.data || []);
        setHostelRooms(roomsRes.data || []);
        setHostelRoomTypes(rtRes.data || []);
        if (hostelDetails) {
            setHostelForm({
                hostel_id: hostelDetails.hostel_id || '',
                room_id: hostelDetails.room_id || '',
                room_type_id: hostelDetails.room_type_id || '',
                bed_number: hostelDetails.bed_number || '',
                hostel_fee: hostelDetails.hostel_fee || '',
                billing_cycle: hostelDetails.billing_cycle || 'monthly',
                check_in_date: hostelDetails.check_in_date || '',
                hostel_guardian_contact: hostelDetails.hostel_guardian_contact || ''
            });
            if (hostelDetails.room_id) {
                await loadAssignedBeds(hostelDetails.room_id);
            }
        } else {
            setHostelForm({ hostel_id: '', room_id: '', room_type_id: '', bed_number: '', hostel_fee: '', billing_cycle: 'monthly', check_in_date: '', hostel_guardian_contact: '' });
            setAssignedBeds([]);
        }
        setHostelAssignOpen(true);
    };

    const loadAssignedBeds = async (roomId) => {
        if (!roomId) { setAssignedBeds([]); return; }
        const { data } = await supabase.from('student_hostel_details').select('bed_number').eq('room_id', roomId).eq('branch_id', selectedBranch.id).neq('student_id', studentId).not('bed_number', 'is', null);
        setAssignedBeds(data?.map(d => d.bed_number) || []);
    };

    const handleHostelRoomChange = async (roomId) => {
        const room = hostelRooms.find(r => r.id === roomId);
        setHostelForm(prev => ({
            ...prev,
            room_id: roomId,
            room_type_id: room?.room_type_id || '',
            bed_number: '',
            // Auto-populate hostel_fee from room's cost_per_bed if available and not already set
            hostel_fee: room?.cost_per_bed ? room.cost_per_bed : prev.hostel_fee
        }));
        await loadAssignedBeds(roomId);
    };

    const getAvailableBeds = () => {
        if (!hostelForm.room_id) return [];
        const room = hostelRooms.find(r => r.id === hostelForm.room_id);
        if (!room?.num_of_beds) return [];
        const allBeds = Array.from({ length: room.num_of_beds }, (_, i) => `B${i + 1}`);
        return allBeds.filter(b => !assignedBeds.includes(b));
    };

    const saveHostelAssignment = async () => {
        if (!hostelForm.hostel_id) {
            toast({ variant: 'destructive', title: 'Hostel is required' }); return;
        }
        if (hostelForm.room_id && !hostelForm.bed_number) {
            toast({ variant: 'destructive', title: 'Bed number is required' }); return;
        }
        setAssignSaving(true);
        const payload = {
            student_id: studentId, branch_id: selectedBranch.id, session_id: currentSessionId, organization_id: organizationId,
            hostel_id: hostelForm.hostel_id || null,
            room_id: hostelForm.room_id || null,
            room_type_id: hostelForm.room_type_id || null,
            bed_number: hostelForm.bed_number || null,
            hostel_fee: hostelForm.hostel_fee ? parseFloat(hostelForm.hostel_fee) : null,
            billing_cycle: hostelForm.billing_cycle || 'monthly',
            check_in_date: hostelForm.check_in_date || null,
            hostel_guardian_contact: hostelForm.hostel_guardian_contact || null
        };
        let error, savedId;
        if (hostelDetails?.id) {
            const { error: e } = await supabase.from('student_hostel_details').update(payload).eq('id', hostelDetails.id);
            error = e;
            savedId = hostelDetails.id;
        } else {
            const { data: inserted, error: e } = await supabase.from('student_hostel_details').insert(payload).select('id').single();
            error = e;
            savedId = inserted?.id;
        }
        if (error) {
            toast({ variant: 'destructive', title: 'Error saving hostel', description: error.message });
        } else {
            const feeVal = parseFloat(hostelForm.hostel_fee) || 0;

            // ── UNIFIED LEDGER: Auto-write hostel fees ──
            // Cancel any existing unpaid hostel ledger rows first (handles updates)
            await cancelLedgerRows('hostel', null);

            if (feeVal > 0) {
                // Lookup hostel fee type ID dynamically (code: HOSTEL)
                const { data: feeType } = await supabase
                    .from('fee_types')
                    .select('id')
                    .eq('branch_id', selectedBranch.id)
                    .eq('session_id', currentSessionId)
                    .eq('code', 'HOSTEL')
                    .maybeSingle();

                await writeFeesToLedger({
                    feeSource: 'hostel',
                    feeTypeId: feeType?.id || null,
                    amount: feeVal,
                    billingCycle: hostelForm.billing_cycle || 'monthly',
                    sourceRefId: savedId
                });
                toast({ title: 'Hostel assigned successfully!', description: `₹${feeVal} per ${hostelForm.billing_cycle || 'month'} written to fee ledger.` });
            } else {
                toast({ variant: 'default', title: 'Hostel assigned (Fee ₹0)', description: '⚠️ Hostel fee is ₹0. Edit the assignment to set the correct fee amount.' });
            }

            setHostelAssignOpen(false);
            await fetchStudentAndFees();
        }
        setAssignSaving(false);
    };

    const removeHostelAssignment = async () => {
        if (!hostelDetails?.id) return;
        setAssignSaving(true);

        // ── UNIFIED LEDGER: Cancel unpaid hostel ledger rows first ──
        await cancelLedgerRows('hostel', null);

        const { error } = await supabase.from('student_hostel_details').delete().eq('id', hostelDetails.id);
        if (error) {
            toast({ variant: 'destructive', title: 'Error removing hostel', description: error.message });
        } else {
            toast({ title: 'Hostel removed', description: 'Unpaid hostel fee entries cancelled from ledger.' });
            setHostelAssignOpen(false);
            await fetchStudentAndFees();
        }
        setAssignSaving(false);
    };

    // Fetch UPI settings from branch
    useEffect(() => {
        const fetchUpiSettings = async () => {
            if (!selectedBranch?.id) return;
            try {
                const { data, error } = await supabase
                    .from('branches')
                    .select('upi_enabled, upi_id, upi_merchant_name')
                    .eq('id', selectedBranch.id)
                    .single();
                
                if (!error && data) {
                    setUpiSettings({
                        enabled: data.upi_enabled || false,
                        upi_id: data.upi_id || '',
                        merchant_name: data.upi_merchant_name || ''
                    });
                }
            } catch (err) {
                console.error('Failed to fetch UPI settings:', err);
            }
        };
        fetchUpiSettings();
    }, [selectedBranch?.id]);
    
    const handleFeeSelection = (feeId) => {
        const newSelection = selectedFees.includes(feeId)
            ? selectedFees.filter(id => id !== feeId)
            : [...selectedFees, feeId];
        setSelectedFees(newSelection);
        // Initialize per-fee amount for newly selected fees
        setFeeAmounts(prev => {
            const next = { ...prev };
            if (!selectedFees.includes(feeId)) {
                const fee = fees.find(f => f.id === feeId);
                next[feeId] = fee?.balance > 0 ? fee.balance : 0;
                // Auto-scroll to Collect Fees card when fee is selected
                setTimeout(() => {
                    collectFeesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            } else {
                delete next[feeId];
            }
            return next;
        });
    };

    // Select all unpaid fees
    const selectAllUnpaid = () => {
        const unpaidFees = fees.filter(f => f.balance > 0);
        const unpaidIds = unpaidFees.map(f => f.id);
        setSelectedFees(unpaidIds);
        const amounts = {};
        unpaidFees.forEach(f => { amounts[f.id] = f.balance; });
        setFeeAmounts(amounts);
    };

    // Calculate total discount already used in previous payments
    const totalDiscountAlreadyUsed = useMemo(() => {
        return payments
            .filter(p => !p.reverted_at)
            .reduce((sum, p) => sum + (Number(p.discount_amount) || 0), 0);
    }, [payments]);

    // Calculate total assigned discount amount (one-time total)
    const totalAssignedDiscount = useMemo(() => {
        let total = 0;
        const academicTotal = fees.reduce((sum, f) => sum + f.amount, 0);
        
        studentDiscounts.forEach(discount => {
            if (discount.discount_type === 'percentage') {
                // For percentage, calculate based on total academic fees
                total += (academicTotal * (parseFloat(discount.amount) || 0)) / 100;
            } else if (discount.discount_type === 'fix_amount') {
                total += parseFloat(discount.amount) || 0;
            }
        });
        return total;
    }, [studentDiscounts, fees]);

    // Remaining discount = Assigned - Already Used
    const remainingDiscount = useMemo(() => {
        return Math.max(0, totalAssignedDiscount - totalDiscountAlreadyUsed);
    }, [totalAssignedDiscount, totalDiscountAlreadyUsed]);

    const feeSummary = useMemo(() => {
        // Check if ledger entries include transport/hostel fees (to avoid double-counting with old system)
        const hasLedgerTransport = fees.some(f => f.source === 'ledger' && f.group?.toLowerCase().includes('transport'));
        const hasLedgerHostel = fees.some(f => f.source === 'ledger' && f.group?.toLowerCase().includes('hostel'));
        
        // All fees from fee statement (old + ledger combined)
        const academicTotal = fees.reduce((sum, f) => sum + f.amount, 0);
        const academicPaid = fees.reduce((sum, f) => sum + (f.totalPaid || 0), 0);
        const academicDiscount = fees.reduce((sum, f) => sum + (f.totalDiscount || 0), 0);

        // Transport fees from OLD system (only if NOT already in ledger to avoid double-counting)
        const transportTotal = (!hasLedgerTransport && transportDetails) ? Number(transportDetails.totalFee || 0) : 0;
        const transportPaid = (!hasLedgerTransport && transportDetails) ? (transportDetails.totalPaid || 0) : 0;
        const transportDiscount = (!hasLedgerTransport && transportDetails) ? (transportDetails.totalDiscount || 0) : 0;

        // Hostel fees from OLD system (only if NOT already in ledger to avoid double-counting)
        const hostelTotal = (!hasLedgerHostel && hostelDetails) ? Number(hostelDetails.totalFee || 0) : 0;
        const hostelPaid = (!hasLedgerHostel && hostelDetails) ? (hostelDetails.totalPaid || 0) : 0;
        const hostelDiscount = (!hasLedgerHostel && hostelDetails) ? (hostelDetails.totalDiscount || 0) : 0;

        // Combined totals
        const totalFees = academicTotal + transportTotal + hostelTotal;
        const totalPaid = academicPaid + transportPaid + hostelPaid;
        const totalDiscount = academicDiscount + transportDiscount + hostelDiscount;
        
        // Refund totals (approved refunds only - these are the ones where money was returned)
        const totalRefunded = studentRefunds
            .filter(r => r.status === 'approved')
            .reduce((sum, r) => sum + Number(r.refund_amount || 0), 0);
        
        // Balance = Total Fees - Paid - Discount + Refunded
        // (Refund adds back to balance because money was returned to student)
        // ? FIXED: Balance cannot be negative (cap at 0)
        const balance = Math.max(0, totalFees - totalPaid - totalDiscount + totalRefunded);

        const overdueCount = fees.filter(f => f.isOverdue && f.balance > 0).length;
        const unpaidCount = fees.filter(f => f.balance > 0).length;

        return { totalFees, totalPaid, totalDiscount, totalRefunded, balance, overdueCount, unpaidCount };
    }, [fees, payments, transportDetails, hostelDetails, studentRefunds]);

    // Calculate Transport balance including transport-specific refunds
    const transportBalanceWithRefunds = useMemo(() => {
        if (!transportDetails) return 0;
        const transportRefunds = studentRefunds
            .filter(r => r.refund_type === 'transport' && r.status === 'approved')
            .reduce((sum, r) => sum + Number(r.refund_amount || 0), 0);
        // Balance = Original Balance + Refunds (refund adds back to what student owes)
        return Math.max(0, (transportDetails.balance || 0) + transportRefunds);
    }, [transportDetails, studentRefunds]);

    // Calculate Hostel balance including hostel-specific refunds
    const hostelBalanceWithRefunds = useMemo(() => {
        if (!hostelDetails) return 0;
        const hostelRefunds = studentRefunds
            .filter(r => r.refund_type === 'hostel' && r.status === 'approved')
            .reduce((sum, r) => sum + Number(r.refund_amount || 0), 0);
        // Balance = Original Balance + Refunds (refund adds back to what student owes)
        return Math.max(0, (hostelDetails.balance || 0) + hostelRefunds);
    }, [hostelDetails, studentRefunds]);

    // 🎯 Calculate MAXIMUM payable amount based on selected fees
    // User cannot pay MORE than this amount - includes Transport/Hostel fees
    const selectedFeesMaxBalance = useMemo(() => {
        let total = 0;
        selectedFees.forEach(id => {
            // Check regular fees first
            let fee = fees.find(f => f.id === id);
            // Check transport fee
            if (!fee && id.startsWith('transport-') && transportDetails) {
                fee = { balance: transportBalanceWithRefunds || 0 };
            }
            // Check hostel fee
            if (!fee && id.startsWith('hostel-') && hostelDetails) {
                fee = { balance: hostelBalanceWithRefunds || 0 };
            }
            if (fee && fee.balance > 0) {
                total += fee.balance;
            }
        });
        return total;
    }, [selectedFees, fees, transportDetails, hostelDetails, transportBalanceWithRefunds, hostelBalanceWithRefunds]);

    // Update payment details when selected fees change
    useEffect(() => {
        let totalBalance = 0;
        let totalFine = 0;

        selectedFees.forEach(id => {
            // Check regular fees first
            let fee = fees.find(f => f.id === id);
            // Check transport fee
            if (!fee && id.startsWith('transport-') && transportDetails) {
                fee = { balance: transportBalanceWithRefunds || 0, fine: 0 };
            }
            // Check hostel fee
            if (!fee && id.startsWith('hostel-') && hostelDetails) {
                fee = { balance: hostelBalanceWithRefunds || 0, fine: 0 };
            }
            if (fee) {
                totalBalance += feeAmounts[id] !== undefined ? Number(feeAmounts[id]) : (fee.balance > 0 ? fee.balance : 0);
                totalFine += fee.fine > 0 ? fee.fine : 0;
            }
        });
        
        // Apply only REMAINING discount (not full assigned discount)
        let applicableDiscount = Math.min(remainingDiscount, totalBalance);
        
        setPaymentDetails(prev => ({
            ...prev,
            amount: totalBalance.toFixed(2),
            fine: totalFine.toFixed(2),
            discount: applicableDiscount.toFixed(2)
        }));
    }, [selectedFees, fees, feeAmounts, remainingDiscount, transportDetails, hostelDetails, transportBalanceWithRefunds, hostelBalanceWithRefunds]);

    // Generate UPI QR Code
    const generateUpiQr = async (amount, type = 'academic') => {
        if (!upiSettings.enabled || !upiSettings.upi_id) {
            toast({
                variant: 'destructive',
                title: 'UPI Not Configured',
                description: 'Please configure UPI settings in School Settings → Fees tab first.'
            });
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (!parsedAmount || parsedAmount <= 0) {
            toast({
                variant: 'destructive',
                title: 'Invalid Amount',
                description: 'Please enter a valid amount first.'
            });
            return;
        }

        try {
            const studentName = student?.first_name || 'Student';
            const upiString = `upi://pay?pa=${encodeURIComponent(upiSettings.upi_id)}&pn=${encodeURIComponent(upiSettings.merchant_name || 'School Fees')}&am=${parsedAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Fee payment for ${studentName}`)}`;
            
            const qrDataUrl = await QRCode.toDataURL(upiString, {
                width: 280,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' }
            });
            
            setQrCodeDataUrl(qrDataUrl);
            setQrPaymentType(type);
            setShowQrModal(true);
        } catch (err) {
            console.error('QR generation failed:', err);
            toast({
                variant: 'destructive',
                title: 'QR Generation Failed',
                description: 'Could not generate QR code. Please try again.'
            });
        }
    };

    // Validate UTR number - check for duplicates across all payment tables
    const validateUtrNumber = async (utrNumber, excludeTable = null) => {
        if (!utrNumber || utrNumber.trim() === '') return { valid: true };
        
        const trimmedUtr = utrNumber.trim();
        
        // UTR format validation (typically 12-22 alphanumeric characters)
        if (trimmedUtr.length < 12 || trimmedUtr.length > 22) {
            return { valid: false, message: 'UTR number should be 12-22 characters long' };
        }
        
        // Check in fee_payments table
        if (excludeTable !== 'fee_payments') {
            const { data: feeCheck } = await supabase
                .from('fee_payments')
                .select('id')
                .eq('utr_number', trimmedUtr)
                .limit(1);
            if (feeCheck && feeCheck.length > 0) {
                return { valid: false, message: 'This UTR number already exists in Academic Fee payments' };
            }
        }
        
        // Check in transport_fee_payments table
        if (excludeTable !== 'transport_fee_payments') {
            const { data: transportCheck } = await supabase
                .from('transport_fee_payments')
                .select('id')
                .eq('utr_number', trimmedUtr)
                .limit(1);
            if (transportCheck && transportCheck.length > 0) {
                return { valid: false, message: 'This UTR number already exists in Transport Fee payments' };
            }
        }
        
        // Check in hostel_fee_payments table
        if (excludeTable !== 'hostel_fee_payments') {
            const { data: hostelCheck } = await supabase
                .from('hostel_fee_payments')
                .select('id')
                .eq('utr_number', trimmedUtr)
                .limit(1);
            if (hostelCheck && hostelCheck.length > 0) {
                return { valid: false, message: 'This UTR number already exists in Hostel Fee payments' };
            }
        }
        
        return { valid: true };
    };

    // Check if payment mode requires UTR
    const isUpiPayment = (mode) => ['Online', 'UPI'].includes(mode);

    const collectFees = async () => {
        if (!selectedFees.length) {
            toast({ variant: 'destructive', title: 'No fees selected', description: "Please select at least one fee item to collect." });
            return;
        }

        const enteredAmount = parseFloat(paymentDetails.amount) || 0;
        const enteredDiscount = parseFloat(paymentDetails.discount) || 0;
        const totalToCollect = enteredAmount + parseFloat(paymentDetails.fine) - enteredDiscount;
        
        if (totalToCollect <= 0) {
            toast({ variant: 'destructive', title: 'Invalid amount', description: 'Total payment must be greater than zero.' });
            return;
        }

        // Validate per-fee amounts don't exceed individual balances
        for (const feeId of selectedFees) {
            // Look in allFeesForDisplay (includes transport/hostel)
            const fee = allFeesForDisplay.find(f => f.id === feeId);
            if (!fee) continue;
            const amt = Number(feeAmounts[feeId] || 0);
            if (amt > fee.balance) {
                toast({ 
                    variant: 'destructive', 
                    title: 'Amount exceeds balance', 
                    description: `${fee.typeName || fee.type} amount (₹${amt.toLocaleString('en-IN')}) exceeds balance (₹${fee.balance.toLocaleString('en-IN')}).` 
                });
                return;
            }
        }

        // ? VALIDATION: Discount cannot exceed the amount being paid
        if (enteredDiscount > enteredAmount) {
            toast({ 
                variant: 'destructive', 
                title: 'Discount exceeds amount', 
                description: 'Discount cannot be more than the payment amount.' 
            });
            return;
        }

        // UTR validation for Online/UPI payments
        if (isUpiPayment(paymentDetails.payment_mode)) {
            if (!paymentDetails.utr_number || paymentDetails.utr_number.trim() === '') {
                toast({ variant: 'destructive', title: 'UTR Required', description: 'Please enter UTR number for UPI/Online payment.' });
                return;
            }
            const utrValidation = await validateUtrNumber(paymentDetails.utr_number);
            if (!utrValidation.valid) {
                toast({ variant: 'destructive', title: 'Invalid UTR', description: utrValidation.message });
                return;
            }
        }

        // For non-cash payments, note field can be used for reference/cheque number

        setPaymentLoading(true);

        try {
            let remainingDiscountToDistribute = parseFloat(paymentDetails.discount);
            let remainingFineToDistribute = parseFloat(paymentDetails.fine);

            const paymentsToInsert = [];
            const transportPaymentsToInsert = [];
            const hostelPaymentsToInsert = [];
            
            // Generate readable Transaction ID (e.g., JIS/2601/00001)
            const branchCode = selectedBranch?.branch_code || selectedBranch?.code || 'TXN';
            const newTransactionId = await generateTransactionId(supabase, selectedBranch.id, branchCode);
            const utrValue = isUpiPayment(paymentDetails.payment_mode) ? paymentDetails.utr_number?.trim() : null;

            for (const feeId of selectedFees) {
                // Look in allFeesForDisplay to find transport/hostel fees too
                const fee = allFeesForDisplay.find(f => f.id === feeId);
                if (!fee || fee.balance <= 0) continue;

                const amountForThisFee = Math.min(Number(feeAmounts[feeId] || 0), fee.balance);
                const discountForThisFee = Math.min(remainingDiscountToDistribute, fee.balance - amountForThisFee);
                const fineForThisFee = Math.min(remainingFineToDistribute, fee.fine || 0);
                
                // Calculate balance AFTER this payment
                const balanceAfterThisPayment = Math.max(0, fee.balance - amountForThisFee - discountForThisFee);
                
                if (amountForThisFee <= 0 && discountForThisFee <= 0 && fineForThisFee <= 0) continue;
                
                // 🚌 TRANSPORT FEE - Insert into transport_fee_payments
                if (fee.isTransport && transportDetails) {
                    const sessionName = student?.sessions?.name || 'Annual';
                    const receiptSnapshot = {
                        student: {
                            id: studentId,
                            name: student?.full_name || student?.name,
                            enrollment_id: student?.enrollment_id,
                            father_name: student?.father_name,
                            class: student?.classes?.name || student?.class?.name,
                            section: student?.sections?.name || student?.section?.name,
                            session: sessionName,
                        },
                        transport: {
                            route: transportDetails?.route?.route_title,
                            total_fee: transportDetails?.totalFee || 0,
                        },
                        payment: {
                            amount: amountForThisFee,
                            discount: discountForThisFee,
                            fine: fineForThisFee,
                            mode: paymentDetails.payment_mode,
                            date: paymentDetails.payment_date || format(new Date(), 'yyyy-MM-dd'),
                            utr: utrValue,
                        },
                        calculated: {
                            balance_before: fee.balance,
                            balance_after: balanceAfterThisPayment,
                        },
                        transaction_id: newTransactionId,
                        collected_by: user?.full_name || user?.email,
                        branch_name: selectedBranch?.name,
                        created_at: new Date().toISOString(),
                    };
                    
                    transportPaymentsToInsert.push({
                        branch_id: selectedBranch.id,
                        session_id: currentSessionId,
                        organization_id: organizationId,
                        student_id: studentId,
                        amount: amountForThisFee,
                        discount_amount: discountForThisFee,
                        fine_paid: fineForThisFee,
                        payment_date: paymentDetails.payment_date || format(new Date(), 'yyyy-MM-dd'),
                        payment_mode: paymentDetails.payment_mode,
                        payment_month: `Annual ${sessionName}`,
                        note: paymentDetails.note,
                        transaction_id: newTransactionId,
                        collected_by: user.id,
                        utr_number: utrValue,
                        balance_after_payment: balanceAfterThisPayment,
                        receipt_snapshot: receiptSnapshot,
                    });
                    remainingDiscountToDistribute -= discountForThisFee;
                    remainingFineToDistribute -= fineForThisFee;
                    continue;
                }
                
                // 🏠 HOSTEL FEE - Insert into hostel_fee_payments
                if (fee.isHostel && hostelDetails) {
                    const sessionName = student?.sessions?.name || 'Annual';
                    const receiptSnapshot = {
                        student: {
                            id: studentId,
                            name: student?.full_name || student?.name,
                            enrollment_id: student?.enrollment_id,
                            father_name: student?.father_name,
                            class: student?.classes?.name || student?.class?.name,
                            section: student?.sections?.name || student?.section?.name,
                            session: sessionName,
                        },
                        hostel: {
                            block: hostelDetails?.blockName,
                            room: hostelDetails?.room?.room_number_name,
                            total_fee: hostelDetails?.totalFee || 0,
                        },
                        payment: {
                            amount: amountForThisFee,
                            discount: discountForThisFee,
                            fine: fineForThisFee,
                            mode: paymentDetails.payment_mode,
                            date: paymentDetails.payment_date || format(new Date(), 'yyyy-MM-dd'),
                            utr: utrValue,
                        },
                        calculated: {
                            balance_before: fee.balance,
                            balance_after: balanceAfterThisPayment,
                        },
                        transaction_id: newTransactionId,
                        collected_by: user?.full_name || user?.email,
                        branch_name: selectedBranch?.name,
                        created_at: new Date().toISOString(),
                    };
                    
                    hostelPaymentsToInsert.push({
                        branch_id: selectedBranch.id,
                        session_id: currentSessionId,
                        organization_id: organizationId,
                        student_id: studentId,
                        amount: amountForThisFee,
                        discount_amount: discountForThisFee,
                        fine_paid: fineForThisFee,
                        payment_date: paymentDetails.payment_date || format(new Date(), 'yyyy-MM-dd'),
                        payment_mode: paymentDetails.payment_mode,
                        payment_month: `Annual ${sessionName}`,
                        note: paymentDetails.note,
                        transaction_id: newTransactionId,
                        collected_by: user.id,
                        utr_number: utrValue,
                        balance_after_payment: balanceAfterThisPayment,
                        receipt_snapshot: receiptSnapshot,
                    });
                    remainingDiscountToDistribute -= discountForThisFee;
                    remainingFineToDistribute -= fineForThisFee;
                    continue;
                }
                
                // 📚 ACADEMIC FEE - Regular fee processing (includes ledger hostel/transport)
                const receiptSnapshot = {
                    student: {
                        id: studentId,
                        name: student?.full_name || student?.name,
                        enrollment_id: student?.enrollment_id,
                        father_name: student?.father_name,
                        class: student?.classes?.name || student?.class?.name,
                        section: student?.sections?.name || student?.section?.name,
                        session: student?.sessions?.name,
                    },
                    fee: {
                        id: fee.source === 'ledger' ? fee.ledgerId : fee.masterId,
                        name: fee.typeName || fee.feeTypeName,
                        group: fee.group || fee.groupName || fee.feeGroupName,
                        total_amount: fee.totalFee || fee.amount,
                        due_date: fee.dueDate,
                        source: fee.source || 'old',
                        fee_source: fee.fee_source || null,
                        billing_period: fee.billing_period || null,
                    },
                    // Include hostel/transport context if applicable
                    ...(fee.fee_source === 'hostel' && hostelDetails ? {
                        hostel: {
                            block: hostelDetails?.blockName,
                            room: hostelDetails?.room?.room_number_name,
                            total_fee: hostelDetails?.totalFee || 0,
                        },
                    } : {}),
                    ...(fee.fee_source === 'transport' && transportDetails ? {
                        transport: {
                            route: transportDetails?.route?.route_title,
                            total_fee: transportDetails?.totalFee || 0,
                        },
                    } : {}),
                    payment: {
                        amount: amountForThisFee,
                        discount: discountForThisFee,
                        fine: fineForThisFee,
                        mode: paymentDetails.payment_mode,
                        date: paymentDetails.payment_date || format(new Date(), 'yyyy-MM-dd'),
                        utr: utrValue,
                        note: paymentDetails.note,
                    },
                    calculated: {
                        total_paid_for_fee: (fee.totalPaid || 0) + amountForThisFee + discountForThisFee,
                        balance_after: balanceAfterThisPayment,
                        fee_balance_before: fee.balance,
                    },
                    transaction_id: newTransactionId,
                    collected_by: user?.full_name || user?.email,
                    branch_name: selectedBranch?.name,
                    created_at: new Date().toISOString(),
                };
                
                // Fee Engine 3.0: If this fee is from student_fee_ledger, update ledger directly
                if (fee.source === 'ledger' && fee.ledgerId) {
                    const newPaidAmount = (fee.totalPaid || 0) + amountForThisFee;
                    const newDiscountAmount = (fee.totalDiscount || 0) + discountForThisFee;
                    const newFineAmount = (fee.totalFine || 0) + fineForThisFee;
                    const newStatus = (newPaidAmount + newDiscountAmount) >= fee.amount ? 'paid' : 'partial';
                    
                    const { error: ledgerErr } = await supabase
                        .from('student_fee_ledger')
                        .update({
                            paid_amount: newPaidAmount,
                            discount_amount: newDiscountAmount,
                            fine_amount: newFineAmount,
                            status: newStatus,
                            is_paid: newStatus === 'paid',
                            paid_date: newStatus === 'paid' ? format(new Date(), 'yyyy-MM-dd') : null,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', fee.ledgerId);
                    
                    if (ledgerErr) {
                        console.error('Ledger update error:', ledgerErr);
                    }
                    
                    paymentsToInsert.push({
                        branch_id: selectedBranch.id,
                        session_id: currentSessionId,
                        organization_id: organizationId,
                        student_id: studentId,
                        ledger_id: fee.ledgerId,
                        amount: amountForThisFee,
                        payment_date: paymentDetails.payment_date || format(new Date(), 'yyyy-MM-dd'),
                        payment_mode: paymentDetails.payment_mode,
                        fine_paid: fineForThisFee,
                        discount_amount: discountForThisFee,
                        note: paymentDetails.note,
                        transaction_id: newTransactionId,
                        created_by: user.id,
                        utr_number: utrValue,
                        balance_after_payment: balanceAfterThisPayment,
                        receipt_snapshot: receiptSnapshot,
                    });
                } else {
                    paymentsToInsert.push({
                        branch_id: selectedBranch.id,
                        session_id: currentSessionId,
                        organization_id: organizationId,
                        student_id: studentId,
                        fee_master_id: fee.masterId,
                        amount: amountForThisFee,
                        payment_date: paymentDetails.payment_date || format(new Date(), 'yyyy-MM-dd'),
                        payment_mode: paymentDetails.payment_mode,
                        fine_paid: fineForThisFee,
                        discount_amount: discountForThisFee,
                        note: paymentDetails.note,
                        transaction_id: newTransactionId,
                        created_by: user.id,
                        utr_number: utrValue,
                        balance_after_payment: balanceAfterThisPayment,
                        receipt_snapshot: receiptSnapshot,
                    });
                }
                remainingDiscountToDistribute -= discountForThisFee;
                remainingFineToDistribute -= fineForThisFee;
            }

            // Check if any payments to insert
            const totalPayments = paymentsToInsert.length + transportPaymentsToInsert.length + hostelPaymentsToInsert.length;
            if (totalPayments === 0) {
                toast({ title: 'No payment needed', description: 'Selected fees seem to be paid or amount is zero.' });
                setPaymentLoading(false);
                return;
            }

            // Insert academic fee payments
            let insertedPayments = [];
            if (paymentsToInsert.length > 0) {
                const { data, error } = await supabase.from('fee_payments').insert(paymentsToInsert).select('id');
                if (error) throw error;
                insertedPayments = data || [];
            }
            
            // Insert transport fee payments
            let insertedTransportPayments = [];
            if (transportPaymentsToInsert.length > 0) {
                const { data, error } = await supabase.from('transport_fee_payments').insert(transportPaymentsToInsert).select('id');
                if (error) throw error;
                insertedTransportPayments = data || [];
            }
            
            // Insert hostel fee payments
            let insertedHostelPayments = [];
            if (hostelPaymentsToInsert.length > 0) {
                const { data, error } = await supabase.from('hostel_fee_payments').insert(hostelPaymentsToInsert).select('id');
                if (error) throw error;
                insertedHostelPayments = data || [];
            }
            
            toast({ title: '✅ Payment collected successfully!', description: `Transaction ID: ${newTransactionId}` });
            await fetchStudentAndFees();
            setSelectedFees([]);
            setFeeAmounts({});
            setPaymentDetails(prev => ({ ...prev, note: '', utr_number: '' }));

            // Navigate to the receipt page based on what was paid
            if (insertedPayments?.[0]?.id) {
                navigate(`/${basePath}/fees-collection/print-receipt/fees/${insertedPayments[0].id}`);
            } else if (insertedTransportPayments?.[0]?.id) {
                navigate(`/${basePath}/fees-collection/print-receipt/transport/${insertedTransportPayments[0].id}`);
            } else if (insertedHostelPayments?.[0]?.id) {
                navigate(`/${basePath}/fees-collection/print-receipt/hostel/${insertedHostelPayments[0].id}`);
            }

        } catch (error) {
            console.error("Payment collection error:", error);
            toast({ variant: 'destructive', title: 'Payment failed', description: error.message });
        } finally {
            setPaymentLoading(false);
        }
    };
    
    const printReceipt = (payment) => {
        navigate(`/${basePath}/fees-collection/print-receipt/fees/${payment.id}`);
    }

    // Collect Transport Fee
    const collectTransportFee = async () => {
        const isAnnualType = transportDetails?.isAnnualType;
        
        if (!isAnnualType && (!transportDetails || selectedTransportMonths.length === 0)) {
            toast({ variant: 'destructive', title: 'Select months', description: 'Please select at least one month to pay.' });
            return;
        }
        
        const discount = parseFloat(transportPaymentDetails.discount) || 0;
        const fine = parseFloat(transportPaymentDetails.fine) || 0;
        
        let totalAmount;
        if (isAnnualType) {
            totalAmount = parseFloat(transportPaymentDetails.amount) || 0;
            if (totalAmount <= 0) {
                toast({ variant: 'destructive', title: 'Invalid amount', description: 'Please enter an amount to pay.' });
                return;
            }
            if (totalAmount > transportBalanceWithRefunds) {
                toast({ variant: 'destructive', title: 'Exceeds balance', description: `Amount cannot exceed balance of ${currencySymbol}${transportBalanceWithRefunds.toLocaleString('en-IN')}` });
                return;
            }
        } else {
            const monthlyFee = transportDetails.monthlyFee || 0;
            totalAmount = selectedTransportMonths.length * monthlyFee;
        }
        
        if (totalAmount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid amount', description: 'Amount must be greater than zero.' });
            return;
        }

        // UTR validation for Online/UPI payments
        if (isUpiPayment(transportPaymentDetails.payment_mode)) {
            if (!transportPaymentDetails.utr_number || transportPaymentDetails.utr_number.trim() === '') {
                toast({ variant: 'destructive', title: 'UTR Required', description: 'Please enter UTR number for UPI/Online payment.' });
                return;
            }
            const utrValidation = await validateUtrNumber(transportPaymentDetails.utr_number);
            if (!utrValidation.valid) {
                toast({ variant: 'destructive', title: 'Invalid UTR', description: utrValidation.message });
                return;
            }
        }

        setPaymentLoading(true);
        try {
            const branchCode = selectedBranch?.branch_code || selectedBranch?.code || 'TRN';
            const newTransactionId = await generateTransactionId(supabase, selectedBranch.id, branchCode, 'transport');
            
            const utrValue = isUpiPayment(transportPaymentDetails.payment_mode) ? transportPaymentDetails.utr_number.trim() : null;
            
            let paymentsToInsert;
            if (isAnnualType) {
                // Annual/One-time: Single payment record with custom amount
                const sessionName = student?.sessions?.name || 'Annual';
                // ? FIX: Calculate balance after this payment
                const balanceAfterPayment = Math.max(0, transportBalanceWithRefunds - totalAmount - discount);
                
                // ? BUILD COMPLETE RECEIPT SNAPSHOT for transport fee
                const receiptSnapshot = {
                    student: {
                        id: studentId,
                        name: student?.full_name || student?.name,
                        enrollment_id: student?.enrollment_id,
                        father_name: student?.father_name,
                        class: student?.classes?.name || student?.class?.name,
                        section: student?.sections?.name || student?.section?.name,
                        session: sessionName,
                    },
                    transport: {
                        route: transportDetails?.routeName,
                        stop: transportDetails?.stopName,
                        vehicle: transportDetails?.vehicleNumber,
                        billing_cycle: getBillingCycleLabel(transportDetails?.billingCycle),
                        total_fee: transportDetails?.totalFee || 0,
                    },
                    payment: {
                        amount: totalAmount,
                        discount: discount,
                        fine: fine,
                        mode: transportPaymentDetails.payment_mode,
                        date: transportPaymentDetails.payment_date || format(new Date(), 'yyyy-MM-dd'),
                        utr: utrValue,
                        note: transportPaymentDetails.note,
                        payment_month: `${getBillingCycleLabel(transportDetails.billingCycle)} ${sessionName}`,
                    },
                    calculated: {
                        balance_before: transportBalanceWithRefunds,
                        balance_after: balanceAfterPayment,
                    },
                    transaction_id: newTransactionId,
                    collected_by: user?.full_name || user?.email,
                    branch_name: selectedBranch?.name,
                    created_at: new Date().toISOString(),
                };
                
                paymentsToInsert = [{
                    branch_id: selectedBranch.id,
                    session_id: currentSessionId,
                    organization_id: organizationId,
                    student_id: studentId,
                    amount: totalAmount,
                    discount_amount: discount,
                    fine_paid: fine,
                    payment_date: transportPaymentDetails.payment_date || format(new Date(), 'yyyy-MM-dd'),
                    payment_mode: transportPaymentDetails.payment_mode,
                    payment_month: `${getBillingCycleLabel(transportDetails.billingCycle)} ${sessionName}`,
                    note: transportPaymentDetails.note || `${getBillingCycleLabel(transportDetails.billingCycle)} payment`,
                    transaction_id: newTransactionId,
                    collected_by: user.id,
                    utr_number: utrValue,
                    balance_after_payment: balanceAfterPayment, // ? Quick access
                    receipt_snapshot: receiptSnapshot, // ? FULL RECEIPT DATA
                }];
            } else {
                // Monthly: Create one payment record per selected month
                const monthlyFee = transportDetails.monthlyFee || 0;
                // ? FIX: Calculate running balance for each month payment
                let runningBalance = transportBalanceWithRefunds;
                paymentsToInsert = selectedTransportMonths.map((monthKey, index) => {
                    const monthLabel = sessionMonths.find(m => m.key === monthKey)?.label || monthKey;
                    const thisDiscount = index === 0 ? discount : 0;
                    const thisFine = index === 0 ? fine : 0;
                    // Calculate balance after this specific payment
                    runningBalance = Math.max(0, runningBalance - monthlyFee - thisDiscount);
                    
                    // ? BUILD RECEIPT SNAPSHOT for monthly payment
                    const receiptSnapshot = {
                        student: {
                            id: studentId,
                            name: student?.full_name || student?.name,
                            enrollment_id: student?.enrollment_id,
                            father_name: student?.father_name,
                            class: student?.classes?.name || student?.class?.name,
                            section: student?.sections?.name || student?.section?.name,
                            session: student?.sessions?.name,
                        },
                        transport: {
                            route: transportDetails?.routeName,
                            stop: transportDetails?.stopName,
                            vehicle: transportDetails?.vehicleNumber,
                            billing_cycle: 'Monthly',
                            monthly_fee: monthlyFee,
                            total_fee: transportDetails?.totalFee || 0,
                        },
                        payment: {
                            amount: monthlyFee,
                            discount: thisDiscount,
                            fine: thisFine,
                            mode: transportPaymentDetails.payment_mode,
                            date: transportPaymentDetails.payment_date || format(new Date(), 'yyyy-MM-dd'),
                            utr: index === 0 ? utrValue : null,
                            note: transportPaymentDetails.note,
                            payment_month: monthLabel,
                            months_paid: selectedTransportMonths.length,
                        },
                        calculated: {
                            balance_after: runningBalance,
                        },
                        transaction_id: newTransactionId,
                        collected_by: user?.full_name || user?.email,
                        branch_name: selectedBranch?.name,
                        created_at: new Date().toISOString(),
                    };
                    
                    return {
                        branch_id: selectedBranch.id,
                        session_id: currentSessionId,
                        organization_id: organizationId,
                        student_id: studentId,
                        amount: monthlyFee,
                        discount_amount: thisDiscount,
                        fine_paid: thisFine,
                        payment_date: transportPaymentDetails.payment_date || format(new Date(), 'yyyy-MM-dd'),
                        payment_mode: transportPaymentDetails.payment_mode,
                        payment_month: monthLabel,
                        note: transportPaymentDetails.note || `Payment for ${selectedTransportMonths.length} month(s)`,
                        transaction_id: newTransactionId,
                        collected_by: user.id,
                        utr_number: index === 0 ? utrValue : null, // Only first record gets the UTR
                        balance_after_payment: runningBalance, // ? Quick access
                        receipt_snapshot: receiptSnapshot, // ? FULL RECEIPT DATA
                    };
                });
            }

            const { data, error } = await supabase
                .from('transport_fee_payments')
                .insert(paymentsToInsert)
                .select();

            if (error) throw error;
            
            toast({ 
                title: '? Transport fee collected!', 
                description: isAnnualType 
                    ? `${currencySymbol}${totalAmount.toLocaleString('en-IN')} paid. Transaction ID: ${newTransactionId}`
                    : `${selectedTransportMonths.length} month(s) paid. Transaction ID: ${newTransactionId}` 
            });
            await fetchStudentAndFees();
            setTransportPaymentDetails({ amount: '', discount: '0', fine: '0', payment_date: format(new Date(), 'yyyy-MM-dd'), payment_mode: 'Cash', note: '', utr_number: '' });
            setSelectedTransportMonths([]);
            
            // Print receipt (use first payment's ID)
            if (data && data.length > 0) {
                navigate(`/${basePath}/fees-collection/print-receipt/transport/${data[0].id}`);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Payment failed', description: error.message });
        } finally {
            setPaymentLoading(false);
        }
    };

    // Collect Hostel Fee
    const collectHostelFee = async () => {
        const isAnnualType = hostelDetails?.isAnnualType;
        
        if (!isAnnualType && (!hostelDetails || selectedHostelMonths.length === 0)) {
            toast({ variant: 'destructive', title: 'Select months', description: 'Please select at least one month to pay.' });
            return;
        }
        
        const discount = parseFloat(hostelPaymentDetails.discount) || 0;
        const fine = parseFloat(hostelPaymentDetails.fine) || 0;
        
        let totalAmount;
        if (isAnnualType) {
            totalAmount = parseFloat(hostelPaymentDetails.amount) || 0;
            if (totalAmount <= 0) {
                toast({ variant: 'destructive', title: 'Invalid amount', description: 'Please enter an amount to pay.' });
                return;
            }
            if (totalAmount > hostelBalanceWithRefunds) {
                toast({ variant: 'destructive', title: 'Exceeds balance', description: `Amount cannot exceed balance of ${currencySymbol}${hostelBalanceWithRefunds.toLocaleString('en-IN')}` });
                return;
            }
        } else {
            const monthlyFee = hostelDetails.monthlyFee || 0;
            totalAmount = selectedHostelMonths.length * monthlyFee;
        }
        
        if (totalAmount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid amount', description: 'Amount must be greater than zero.' });
            return;
        }

        // UTR validation for Online/UPI payments
        if (isUpiPayment(hostelPaymentDetails.payment_mode)) {
            if (!hostelPaymentDetails.utr_number || hostelPaymentDetails.utr_number.trim() === '') {
                toast({ variant: 'destructive', title: 'UTR Required', description: 'Please enter UTR number for UPI/Online payment.' });
                return;
            }
            const utrValidation = await validateUtrNumber(hostelPaymentDetails.utr_number);
            if (!utrValidation.valid) {
                toast({ variant: 'destructive', title: 'Invalid UTR', description: utrValidation.message });
                return;
            }
        }

        setPaymentLoading(true);
        try {
            const branchCode = selectedBranch?.branch_code || selectedBranch?.code || 'HST';
            const newTransactionId = await generateTransactionId(supabase, selectedBranch.id, branchCode, 'hostel');
            
            const utrValue = isUpiPayment(hostelPaymentDetails.payment_mode) ? hostelPaymentDetails.utr_number.trim() : null;
            
            let paymentsToInsert;
            if (isAnnualType) {
                // Annual/One-time: Single payment record with custom amount
                const sessionName = student?.sessions?.name || 'Annual';
                // ? FIX: Calculate balance after this payment
                const balanceAfterPayment = Math.max(0, hostelBalanceWithRefunds - totalAmount - discount);
                
                // ? BUILD COMPLETE RECEIPT SNAPSHOT for hostel fee
                const receiptSnapshot = {
                    student: {
                        id: studentId,
                        name: student?.full_name || student?.name,
                        enrollment_id: student?.enrollment_id,
                        father_name: student?.father_name,
                        class: student?.classes?.name || student?.class?.name,
                        section: student?.sections?.name || student?.section?.name,
                        session: sessionName,
                    },
                    hostel: {
                        block: hostelDetails?.blockName,
                        room: hostelDetails?.roomNumber,
                        room_type: hostelDetails?.roomType,
                        billing_cycle: getBillingCycleLabel(hostelDetails?.billingCycle),
                        total_fee: hostelDetails?.totalFee || 0,
                    },
                    payment: {
                        amount: totalAmount,
                        discount: discount,
                        fine: fine,
                        mode: hostelPaymentDetails.payment_mode,
                        date: hostelPaymentDetails.payment_date || format(new Date(), 'yyyy-MM-dd'),
                        utr: utrValue,
                        note: hostelPaymentDetails.note,
                        payment_month: `${getBillingCycleLabel(hostelDetails.billingCycle)} ${sessionName}`,
                    },
                    calculated: {
                        balance_before: hostelBalanceWithRefunds,
                        balance_after: balanceAfterPayment,
                    },
                    transaction_id: newTransactionId,
                    collected_by: user?.full_name || user?.email,
                    branch_name: selectedBranch?.name,
                    created_at: new Date().toISOString(),
                };
                
                paymentsToInsert = [{
                    branch_id: selectedBranch.id,
                    session_id: currentSessionId,
                    organization_id: organizationId,
                    student_id: studentId,
                    amount: totalAmount,
                    discount_amount: discount,
                    fine_paid: fine,
                    payment_date: hostelPaymentDetails.payment_date || format(new Date(), 'yyyy-MM-dd'),
                    payment_mode: hostelPaymentDetails.payment_mode,
                    payment_month: `${getBillingCycleLabel(hostelDetails.billingCycle)} ${sessionName}`,
                    note: hostelPaymentDetails.note || `${getBillingCycleLabel(hostelDetails.billingCycle)} payment`,
                    transaction_id: newTransactionId,
                    collected_by: user.id,
                    utr_number: utrValue,
                    balance_after_payment: balanceAfterPayment, // ? Quick access
                    receipt_snapshot: receiptSnapshot, // ? FULL RECEIPT DATA
                }];
            } else {
                // Monthly: Create one payment record per selected month
                const monthlyFee = hostelDetails.monthlyFee || 0;
                // ? FIX: Calculate running balance for each month payment
                let runningBalance = hostelBalanceWithRefunds;
                paymentsToInsert = selectedHostelMonths.map((monthKey, index) => {
                    const monthLabel = sessionMonths.find(m => m.key === monthKey)?.label || monthKey;
                    const thisDiscount = index === 0 ? discount : 0;
                    const thisFine = index === 0 ? fine : 0;
                    // Calculate balance after this specific payment
                    runningBalance = Math.max(0, runningBalance - monthlyFee - thisDiscount);
                    
                    // ? BUILD RECEIPT SNAPSHOT for monthly hostel payment
                    const receiptSnapshot = {
                        student: {
                            id: studentId,
                            name: student?.full_name || student?.name,
                            enrollment_id: student?.enrollment_id,
                            father_name: student?.father_name,
                            class: student?.classes?.name || student?.class?.name,
                            section: student?.sections?.name || student?.section?.name,
                            session: student?.sessions?.name,
                        },
                        hostel: {
                            block: hostelDetails?.blockName,
                            room: hostelDetails?.roomNumber,
                            room_type: hostelDetails?.roomType,
                            billing_cycle: 'Monthly',
                            monthly_fee: monthlyFee,
                            total_fee: hostelDetails?.totalFee || 0,
                        },
                        payment: {
                            amount: monthlyFee,
                            discount: thisDiscount,
                            fine: thisFine,
                            mode: hostelPaymentDetails.payment_mode,
                            date: hostelPaymentDetails.payment_date || format(new Date(), 'yyyy-MM-dd'),
                            utr: index === 0 ? utrValue : null,
                            note: hostelPaymentDetails.note,
                            payment_month: monthLabel,
                            months_paid: selectedHostelMonths.length,
                        },
                        calculated: {
                            balance_after: runningBalance,
                        },
                        transaction_id: newTransactionId,
                        collected_by: user?.full_name || user?.email,
                        branch_name: selectedBranch?.name,
                        created_at: new Date().toISOString(),
                    };
                    
                    return {
                        branch_id: selectedBranch.id,
                        session_id: currentSessionId,
                        organization_id: organizationId,
                        student_id: studentId,
                        amount: monthlyFee,
                        discount_amount: thisDiscount,
                        fine_paid: thisFine,
                        payment_date: hostelPaymentDetails.payment_date || format(new Date(), 'yyyy-MM-dd'),
                        payment_mode: hostelPaymentDetails.payment_mode,
                        payment_month: monthLabel,
                        note: hostelPaymentDetails.note || `Payment for ${selectedHostelMonths.length} month(s)`,
                        transaction_id: newTransactionId,
                        collected_by: user.id,
                        utr_number: index === 0 ? utrValue : null, // Only first record gets the UTR
                        balance_after_payment: runningBalance, // ? Quick access
                        receipt_snapshot: receiptSnapshot, // ? FULL RECEIPT DATA
                    };
                });
            }

            const { data, error } = await supabase
                .from('hostel_fee_payments')
                .insert(paymentsToInsert)
                .select();

            if (error) throw error;
            
            toast({ 
                title: '? Hostel fee collected!', 
                description: isAnnualType
                    ? `${currencySymbol}${totalAmount.toLocaleString('en-IN')} paid. Transaction ID: ${newTransactionId}`
                    : `${selectedHostelMonths.length} month(s) paid. Transaction ID: ${newTransactionId}` 
            });
            await fetchStudentAndFees();
            setHostelPaymentDetails({ amount: '', discount: '0', fine: '0', payment_date: format(new Date(), 'yyyy-MM-dd'), payment_mode: 'Cash', note: '', utr_number: '' });
            setSelectedHostelMonths([]);
            
            // Print receipt (use first payment's ID)
            if (data && data.length > 0) {
                navigate(`/${basePath}/fees-collection/print-receipt/hostel/${data[0].id}`);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Payment failed', description: error.message });
        } finally {
            setPaymentLoading(false);
        }
    };

    // =====================================
    // COLLECT ALL (Academic + Transport) AND PRINT COMBINED RECEIPT
    // =====================================
    const collectAllFeesAndPrint = async () => {
        // Validate: At least academic fees should be selected, transport optional
        const hasAcademicFees = selectedFees.length > 0;
        const hasTransport = transportDetails && transportBalanceWithRefunds > 0;
        const transportAmountEntered = parseFloat(transportPaymentDetails.amount) || 0;

        if (!hasAcademicFees && !hasTransport) {
            toast({ variant: 'destructive', title: 'Nothing to collect', description: 'Please select academic fees or have transport balance.' });
            return;
        }

        // Validate academic fees amounts
        if (hasAcademicFees) {
            const enteredAmount = parseFloat(paymentDetails.amount) || 0;
            if (enteredAmount <= 0) {
                toast({ variant: 'destructive', title: 'Invalid amount', description: 'Please enter academic fee amount.' });
                return;
            }
        }

        // Validate transport amount
        if (hasTransport && transportAmountEntered <= 0) {
            toast({ variant: 'destructive', title: 'Invalid transport amount', description: 'Please enter transport fee amount.' });
            return;
        }

        setPaymentLoading(true);
        try {
            // Generate SHARED transaction ID for all payments
            const branchCode = selectedBranch?.branch_code || selectedBranch?.code || 'ALL';
            const sharedTransactionId = await generateTransactionId(supabase, selectedBranch.id, branchCode, 'combined');
            
            let academicPaymentId = null;
            let transportPaymentId = null;

            // =====================
            // 1. COLLECT ACADEMIC FEES
            // =====================
            if (hasAcademicFees) {
                const enteredAmount = parseFloat(paymentDetails.amount) || 0;
                const enteredDiscount = parseFloat(paymentDetails.discount) || 0;
                
                let remainingDiscountToDistribute = enteredDiscount;
                let remainingFineToDistribute = parseFloat(paymentDetails.fine) || 0;
                const paymentsToInsert = [];

                for (const feeId of selectedFees) {
                    const fee = fees.find(f => f.id === feeId);
                    if (!fee || fee.balance <= 0) continue;

                    const amountForThisFee = Math.min(Number(feeAmounts[feeId] || 0), fee.balance);
                    const discountForThisFee = Math.min(remainingDiscountToDistribute, fee.balance - amountForThisFee);
                    const fineForThisFee = Math.min(remainingFineToDistribute, fee.fine);
                    const balanceAfterThisPayment = Math.max(0, fee.balance - amountForThisFee - discountForThisFee);

                    const receiptSnapshot = {
                        student: {
                            id: studentId,
                            name: student?.full_name || student?.name,
                            enrollment_id: student?.enrollment_id,
                            father_name: student?.father_name,
                            class: student?.classes?.name || student?.class?.name,
                            section: student?.sections?.name || student?.section?.name,
                            session: student?.sessions?.name,
                        },
                        fee: {
                            id: fee.source === 'ledger' ? fee.ledgerId : fee.masterId,
                            name: fee.typeName || fee.feeTypeName,
                            group: fee.group || fee.groupName || fee.feeGroupName,
                            total_amount: fee.totalFee || fee.amount,
                            due_date: fee.dueDate,
                            source: fee.source || 'old',
                        },
                        payment: {
                            amount: amountForThisFee,
                            discount: discountForThisFee,
                            fine: fineForThisFee,
                            mode: paymentDetails.payment_mode,
                            date: paymentDetails.payment_date || format(new Date(), 'yyyy-MM-dd'),
                            utr: isUpiPayment(paymentDetails.payment_mode) ? paymentDetails.utr_number?.trim() : null,
                            note: paymentDetails.note,
                        },
                        calculated: {
                            total_paid_for_fee: (fee.totalPaid || 0) + amountForThisFee + discountForThisFee,
                            balance_after: balanceAfterThisPayment,
                            fee_balance_before: fee.balance,
                        },
                        transaction_id: sharedTransactionId,
                        collected_by: user?.full_name || user?.email,
                        branch_name: selectedBranch?.name,
                        created_at: new Date().toISOString(),
                    };

                    if (amountForThisFee > 0 || discountForThisFee > 0 || fineForThisFee > 0) {
                        paymentsToInsert.push({
                            branch_id: selectedBranch.id,
                            session_id: currentSessionId,
                            organization_id: organizationId,
                            student_id: studentId,
                            ...(fee.source === 'ledger' 
                                ? { ledger_id: fee.ledgerId }
                                : { fee_master_id: fee.masterId }),
                            amount: amountForThisFee,
                            discount_amount: discountForThisFee,
                            fine_paid: fineForThisFee,
                            payment_date: paymentDetails.payment_date || format(new Date(), 'yyyy-MM-dd'),
                            payment_mode: paymentDetails.payment_mode,
                            note: paymentDetails.note,
                            transaction_id: sharedTransactionId,
                            created_by: user.id,
                            utr_number: isUpiPayment(paymentDetails.payment_mode) ? paymentDetails.utr_number?.trim() : null,
                            balance_after_payment: balanceAfterThisPayment,
                            receipt_snapshot: receiptSnapshot
                        });
                    }
                    
                    remainingDiscountToDistribute -= discountForThisFee;
                    remainingFineToDistribute -= fineForThisFee;
                }

                if (paymentsToInsert.length > 0) {
                    const { data: feeData, error: feeError } = await supabase
                        .from('fee_payments')
                        .insert(paymentsToInsert)
                        .select();

                    if (feeError) throw feeError;
                    
                    academicPaymentId = feeData[0]?.id;

                    // Update ledger for ledger-based payments (update paid_amount, NOT balance)
                    for (const payment of paymentsToInsert) {
                        if (payment.ledger_id) {
                            const fee = fees.find(f => f.ledgerId === payment.ledger_id);
                            if (fee) {
                                const newPaidAmount = (fee.totalPaid || 0) + payment.amount;
                                const newDiscountAmount = (fee.totalDiscount || 0) + payment.discount_amount;
                                const newFineAmount = (fee.totalFine || 0) + payment.fine_paid;
                                const newStatus = (newPaidAmount + newDiscountAmount) >= fee.amount ? 'paid' : 'partial';
                                
                                await supabase
                                    .from('student_fee_ledger')
                                    .update({
                                        paid_amount: newPaidAmount,
                                        discount_amount: newDiscountAmount,
                                        fine_amount: newFineAmount,
                                        status: newStatus,
                                        is_paid: newStatus === 'paid',
                                        paid_date: newStatus === 'paid' ? format(new Date(), 'yyyy-MM-dd') : null,
                                        updated_at: new Date().toISOString(),
                                    })
                                    .eq('id', payment.ledger_id);
                            }
                        }
                    }
                }
            }

            // =====================
            // 2. COLLECT TRANSPORT FEE
            // =====================
            if (hasTransport && transportAmountEntered > 0) {
                const sessionName = student?.sessions?.name || 'Annual';
                const discount = parseFloat(transportPaymentDetails.discount) || 0;
                const fine = parseFloat(transportPaymentDetails.fine) || 0;
                const balanceAfterPayment = Math.max(0, transportBalanceWithRefunds - transportAmountEntered - discount);

                const transportReceiptSnapshot = {
                    student: {
                        id: studentId,
                        name: student?.full_name || student?.name,
                        enrollment_id: student?.enrollment_id,
                        father_name: student?.father_name,
                        class: student?.classes?.name || student?.class?.name,
                        section: student?.sections?.name || student?.section?.name,
                        session: sessionName,
                    },
                    transport: {
                        route: transportDetails?.routeName || transportDetails?.route?.route_title,
                        stop: transportDetails?.stopName || transportDetails?.pickup_point?.name,
                        vehicle: transportDetails?.vehicleNumber || transportDetails?.vehicle_number,
                        billing_cycle: getBillingCycleLabel(transportDetails?.billingCycle),
                        total_fee: transportDetails?.totalFee || 0,
                    },
                    payment: {
                        amount: transportAmountEntered,
                        discount: discount,
                        fine: fine,
                        mode: transportPaymentDetails.payment_mode,
                        date: transportPaymentDetails.payment_date || format(new Date(), 'yyyy-MM-dd'),
                        utr: isUpiPayment(transportPaymentDetails.payment_mode) ? transportPaymentDetails.utr_number?.trim() : null,
                        note: transportPaymentDetails.note,
                    },
                    calculated: {
                        balance_before: transportBalanceWithRefunds,
                        balance_after: balanceAfterPayment,
                    },
                    transaction_id: sharedTransactionId,
                    collected_by: user?.full_name || user?.email,
                    branch_name: selectedBranch?.name,
                    created_at: new Date().toISOString(),
                };

                const { data: transportData, error: transportError } = await supabase
                    .from('transport_fee_payments')
                    .insert([{
                        branch_id: selectedBranch.id,
                        session_id: currentSessionId,
                        organization_id: organizationId,
                        student_id: studentId,
                        amount: transportAmountEntered,
                        discount_amount: discount,
                        fine_paid: fine,
                        payment_date: transportPaymentDetails.payment_date || format(new Date(), 'yyyy-MM-dd'),
                        payment_mode: transportPaymentDetails.payment_mode,
                        payment_month: `${getBillingCycleLabel(transportDetails.billingCycle)} ${sessionName}`,
                        note: transportPaymentDetails.note || 'Combined payment',
                        transaction_id: sharedTransactionId,
                        collected_by: user.id,
                        utr_number: isUpiPayment(transportPaymentDetails.payment_mode) ? transportPaymentDetails.utr_number?.trim() : null,
                        balance_after_payment: balanceAfterPayment,
                        receipt_snapshot: transportReceiptSnapshot,
                    }])
                    .select();

                if (transportError) throw transportError;
                transportPaymentId = transportData[0]?.id;
            }

            // Success toast
            toast({
                title: '✅ Combined payment collected!',
                description: `Transaction ID: ${sharedTransactionId}`,
            });

            // Reset forms
            await fetchStudentAndFees();
            setSelectedFees([]);
            setFeeAmounts({});
            setPaymentDetails({ amount: '', discount: '0', fine: '0', payment_date: format(new Date(), 'yyyy-MM-dd'), payment_mode: 'Cash', note: '', utr_number: '' });
            setTransportPaymentDetails({ amount: '', discount: '0', fine: '0', payment_date: format(new Date(), 'yyyy-MM-dd'), payment_mode: 'Cash', note: '', utr_number: '' });

            // Navigate to combined receipt
            const queryParams = new URLSearchParams();
            if (academicPaymentId) queryParams.set('fees', academicPaymentId);
            if (transportPaymentId) queryParams.set('transport', transportPaymentId);
            
            navigate(`/${basePath}/fees-collection/print-receipt/combined?${queryParams.toString()}`);
            
        } catch (error) {
            toast({ variant: 'destructive', title: 'Payment failed', description: error.message });
        } finally {
            setPaymentLoading(false);
        }
    };

    const revokePayment = async () => {
        if (!paymentToRevoke || !revokeReason) {
            toast({ variant: 'destructive', title: 'Reason is required to revoke payment.' });
            return;
        }
        setPaymentLoading(true);
        try {
            // Determine which table to update based on revokeType
            const tableName = revokeType === 'transport' 
                ? 'transport_fee_payments' 
                : revokeType === 'hostel' 
                    ? 'hostel_fee_payments' 
                    : 'fee_payments';
            
            // Get all payment IDs to revoke (grouped by transaction_id)
            const paymentIds = paymentToRevoke.paymentIds || [paymentToRevoke.id];
            
            const { error } = await supabase
                .from(tableName)
                .update({
                    reverted_at: new Date().toISOString(),
                    revert_reason: revokeReason,
                })
                .in('id', paymentIds);

            if (error) throw error;

            toast({ title: 'Payment revoked successfully' });
            setPaymentToRevoke(null);
            setRevokeReason('');
            setRevokeType('academic');
            await fetchStudentAndFees();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to revoke payment', description: error.message });
        } finally {
            setPaymentLoading(false);
        }
    };

    // Check if a payment already has a refund request (pending/approved/completed)
    const hasExistingRefund = (paymentId, type) => {
        return studentRefunds.some(r => 
            r.refund_type === type && 
            r.status !== 'rejected' && 
            (r.original_payment_ids || []).includes(paymentId)
        );
    };

    // Open refund dialog for a payment
    const openRefundDialog = (payment, type = 'academic') => {
        setRefundPayment(payment);
        setRefundType(type);
        setRefundDetails({
            refund_amount: '',
            refund_reason: '',
            refund_mode: 'Cash',
            note: ''
        });
        setRefundDialogOpen(true);
    };

    // Submit refund request
    const submitRefundRequest = async () => {
        if (!refundPayment) return;
        
        const amount = parseFloat(refundDetails.refund_amount);
        if (!amount || amount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid amount', description: 'Please enter a valid refund amount.' });
            return;
        }
        
        // For grouped payments (transport/hostel), calculate total paid
        const originalPaid = refundType === 'academic' 
            ? Number(refundPayment.amount || 0)
            : Number(refundPayment.totalAmount || refundPayment.amount || 0);
        
        if (amount > originalPaid) {
            toast({ variant: 'destructive', title: 'Amount exceeds paid', description: `Refund cannot exceed ${currencySymbol}${originalPaid.toLocaleString('en-IN')}` });
            return;
        }
        
        if (!refundDetails.refund_reason) {
            toast({ variant: 'destructive', title: 'Reason required', description: 'Please select or enter a refund reason.' });
            return;
        }

        setPaymentLoading(true);
        try {
            // Generate refund transaction ID
            const branchCode = selectedBranch?.branch_code || selectedBranch?.code || 'REF';
            const now = new Date();
            const yearMonth = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
            
            // Count existing refunds for serial
            const { data: existingRefunds } = await supabase
                .from('fee_refunds')
                .select('id')
                .eq('branch_id', selectedBranch.id)
                .gte('created_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString());
            
            const serial = String((existingRefunds?.length || 0) + 1).padStart(5, '0');
            const refundTransactionId = `${branchCode}/${yearMonth}/R${serial}`;
            
            // Determine original payment IDs
            let originalPaymentIds = [];
            if (refundPayment.id) {
                originalPaymentIds = [refundPayment.id];
            }
            if (refundPayment.paymentIds) {
                originalPaymentIds = refundPayment.paymentIds;
            }
            
            const refundRecord = {
                organization_id: organizationId,
                branch_id: selectedBranch.id,
                session_id: currentSessionId,
                student_id: studentId,
                refund_type: refundType,
                refund_amount: amount,
                refund_date: format(new Date(), 'yyyy-MM-dd'),
                refund_mode: refundDetails.refund_mode,
                refund_reason: refundDetails.refund_reason,
                original_payment_ids: originalPaymentIds,
                original_total_paid: originalPaid,
                transaction_id: refundTransactionId,
                note: refundDetails.note,
                status: 'pending',
                requested_by: user.id,
                created_by: user.id
            };
            
            const { error } = await supabase
                .from('fee_refunds')
                .insert(refundRecord);
            
            if (error) throw error;
            
            toast({ 
                title: '? Refund request submitted!', 
                description: `${currencySymbol}${amount.toLocaleString('en-IN')} refund request sent for approval. Transaction: ${refundTransactionId}` 
            });
            
            setRefundDialogOpen(false);
            setRefundPayment(null);
            await fetchStudentAndFees();
        } catch (error) {
            console.error('Refund request error:', error);
            toast({ variant: 'destructive', title: 'Refund request failed', description: error.message });
        } finally {
            setPaymentLoading(false);
        }
    };

    const feesStatementTotals = useMemo(() => {
        return fees.reduce((acc, fee) => {
            acc.amount += fee.amount;
            acc.paid += fee.totalPaid;
            acc.discount += fee.totalDiscount;
            acc.fine += fee.totalFine;
            acc.balance += fee.balance;
            return acc;
        }, { amount: 0, paid: 0, discount: 0, fine: 0, balance: 0 });
    }, [fees]);

    // 🚌 COMBINED FEES FOR DISPLAY: fees + transport + hostel in ONE table
    const allFeesForDisplay = useMemo(() => {
        const combined = [...fees];
        
        // Add transport as a fee row if exists and not already in ledger
        const hasLedgerTransport = fees.some(f => f.source === 'ledger' && (f.fee_source === 'transport' || f.typeName?.toLowerCase().includes('transport') || f.group?.toLowerCase().includes('transport')));
        if (transportDetails && !hasLedgerTransport) {
            combined.push({
                id: `transport-${transportDetails.id || 'fee'}`,
                ledgerId: null,
                masterId: null,
                group: transportDetails.route?.route_title || 'Transport',
                type: 'TRANSPORT',
                typeName: 'Transport Fee',
                dueDate: null, // Transport usually doesn't have due date
                amount: transportDetails.totalFee || 0,
                status: transportDetails.status || 'Unpaid',
                totalPaid: transportDetails.totalPaid || 0,
                totalDiscount: transportDetails.totalDiscount || 0,
                totalFine: 0,
                balance: transportBalanceWithRefunds,
                fine: 0,
                isOverdue: false,
                source: 'transport', // Special marker
                isTransport: true,
            });
        }
        
        // Add hostel as a fee row if exists and not already in ledger
        const hasLedgerHostel = fees.some(f => f.source === 'ledger' && (f.fee_source === 'hostel' || f.typeName?.toLowerCase().includes('hostel') || f.group?.toLowerCase().includes('hostel')));
        if (hostelDetails && !hasLedgerHostel) {
            combined.push({
                id: `hostel-${hostelDetails.id || 'fee'}`,
                ledgerId: null,
                masterId: null,
                group: hostelDetails.blockName || 'Hostel',
                type: 'HOSTEL',
                typeName: 'Hostel Fee',
                dueDate: null,
                amount: hostelDetails.totalFee || 0,
                status: hostelDetails.status || 'Unpaid',
                totalPaid: hostelDetails.totalPaid || 0,
                totalDiscount: hostelDetails.totalDiscount || 0,
                totalFine: 0,
                balance: hostelBalanceWithRefunds,
                fine: 0,
                isOverdue: false,
                source: 'hostel', // Special marker
                isHostel: true,
            });
        }
        
        return combined;
    }, [fees, transportDetails, hostelDetails, transportBalanceWithRefunds, hostelBalanceWithRefunds]);

    // Updated totals to include transport/hostel
    const allFeesTotals = useMemo(() => {
        return allFeesForDisplay.reduce((acc, fee) => {
            acc.amount += fee.amount;
            acc.paid += fee.totalPaid;
            acc.discount += fee.totalDiscount;
            acc.fine += fee.totalFine;
            acc.balance += fee.balance;
            return acc;
        }, { amount: 0, paid: 0, discount: 0, fine: 0, balance: 0 });
    }, [allFeesForDisplay]);

    // Show Discount/Fine columns only when there are non-zero values
    const hasAnyDiscount = useMemo(() => allFeesForDisplay.some(f => f.totalDiscount > 0), [allFeesForDisplay]);
    const hasAnyFine = useMemo(() => allFeesForDisplay.some(f => f.totalFine > 0), [allFeesForDisplay]);

    // Get last payment info
    const lastPayment = payments.filter(p => !p.reverted_at)[0];

    // Get initials from name
    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST';
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                    <span className="ml-2">Loading student details...</span>
                </div>
            </DashboardLayout>
        );
    }

    // Wait for branch to be ready
    if (!selectedBranch?.id) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                    <span className="ml-2">Loading branch data...</span>
                </div>
            </DashboardLayout>
        );
    }

    if (!student) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <User className="h-16 w-16 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground">Student not found</p>
                    <Button onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" />Go Back</Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Student Fees Collection</h1>
                    <p className="text-sm text-muted-foreground">Manage fee payments for {student.full_name}</p>
                </div>
            </div>

            {/* Student Info Header - Horizontal Layout */}
            <Card className="mb-4">
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Student Photo & Basic Info */}
                        <div className="flex items-center gap-4 lg:min-w-[280px]">
                            <Avatar className="h-16 w-16 flex-shrink-0">
                                <AvatarImage src={student.photo_url} alt={student.full_name} />
                                <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                                    {getInitials(student.full_name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-lg font-bold">{student.full_name}</h2>
                                <Badge variant="secondary" className="mt-1">
                                    {student.classes?.name} ({student.sections?.name})
                                </Badge>
                                {student.sessions?.name && (
                                    <p className="text-xs text-muted-foreground mt-1">Session: {student.sessions.name}</p>
                                )}
                            </div>
                        </div>

                        {/* Student Details Grid */}
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm border-l pl-4">
                            <InfoRow icon={CreditCard} label="Enroll ID" value={student.enrollment_id} />
                            <InfoRow icon={User} label="Father" value={student.father_name} />
                            <InfoRow icon={Users} label="Mother" value={student.mother_name} />
                            <InfoRow icon={Calendar} label="DOB" value={student.date_of_birth ? format(parseISO(student.date_of_birth), 'dd MMM yyyy') : null} />
                            <InfoRow icon={Phone} label="Phone" value={student.phone || student.father_phone} />
                            <InfoRow icon={Mail} label="Email" value={student.email || student.father_email} />
                        </div>

                        {/* Quick Stats */}
                        <div className="flex items-center gap-4 lg:border-l lg:pl-4">
                            <div className="text-center px-3">
                                <p className="text-xs text-muted-foreground">Total Dues</p>
                                <p className="text-lg font-bold">{feeSummary.unpaidCount} <span className="text-xs font-normal">items</span></p>
                            </div>
                            <div className="text-center px-3">
                                <p className="text-xs text-muted-foreground">Overdue</p>
                                <p className={`text-lg font-bold ${feeSummary.overdueCount > 0 ? 'text-red-600' : ''}`}>{feeSummary.overdueCount} <span className="text-xs font-normal">items</span></p>
                            </div>
                            {lastPayment && (
                                <div className="text-center px-3">
                                    <p className="text-xs text-muted-foreground">Last Payment</p>
                                    <p className="text-sm font-medium">{format(parseISO(lastPayment.payment_date), 'dd MMM')}</p>
                                </div>
                            )}
                            <Link to={`/${basePath}/student-information/profile/${studentId}`} target="_blank">
                                <Button variant="outline" size="sm">
                                    <ExternalLink className="mr-1 h-3 w-3" />Profile
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <SummaryCard title="Total Fees" amount={feeSummary.totalFees} icon={FileText} variant="primary" currencySymbol={currencySymbol} />
                <SummaryCard title="Paid Amount" amount={feeSummary.totalPaid} icon={CheckCircle} variant="success" currencySymbol={currencySymbol} />
                <SummaryCard title="Discount Given" amount={feeSummary.totalDiscount} icon={Receipt} variant="default" currencySymbol={currencySymbol} />
                {feeSummary.totalRefunded > 0 && (
                    <SummaryCard title="Total Refunded" amount={feeSummary.totalRefunded} icon={Undo2} variant="warning" currencySymbol={currencySymbol} />
                )}
                <SummaryCard title="Balance Due" amount={feeSummary.balance} icon={feeSummary.balance > 0 ? AlertTriangle : Clock} variant={feeSummary.balance > 0 ? 'danger' : 'success'} currencySymbol={currencySymbol} />
            </div>

            {/* Transport & Hostel Assignment Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {/* Transport Card */}
                <Card className={`border ${transportDetails ? 'border-green-500/30 bg-green-50/50 dark:bg-green-950/20' : 'border-dashed border-muted-foreground/30'}`}>
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`p-2 rounded-lg ${transportDetails ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'}`}>
                                    <Bus className={`h-5 w-5 ${transportDetails ? 'text-green-600' : 'text-muted-foreground'}`} />
                                </div>
                                {transportDetails ? (
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate">Transport Assigned</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {transportDetails.route?.route_title || 'Route'}
                                            {transportDetails.pickup_point?.name ? ` • ${transportDetails.pickup_point.name}` : ''}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                {currencySymbol}{Number(transportDetails.transport_fee || 0).toLocaleString('en-IN')}/{transportDetails.billing_cycle || 'monthly'}
                                            </Badge>
                                            {Number(transportDetails.transport_fee || 0) === 0 ? (
                                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                                    ⚠️ Fee ₹0 - Edit to set fee
                                                </Badge>
                                            ) : (
                                                <Badge variant={transportDetails.status === 'Paid' ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0">
                                                    {transportDetails.status}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">No Transport Assigned</p>
                                        <p className="text-xs text-muted-foreground">Click to assign route & pickup point</p>
                                    </div>
                                )}
                            </div>
                            <Button variant={transportDetails ? 'outline' : 'default'} size="sm" onClick={openTransportAssign} className="gap-1.5 flex-shrink-0">
                                {transportDetails ? <><Bus className="h-3.5 w-3.5" />Edit</> : <><Plus className="h-3.5 w-3.5" />Assign</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Hostel Card */}
                <Card className={`border ${hostelDetails ? 'border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20' : 'border-dashed border-muted-foreground/30'}`}>
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`p-2 rounded-lg ${hostelDetails ? 'bg-blue-100 dark:bg-blue-900' : 'bg-muted'}`}>
                                    <Building2 className={`h-5 w-5 ${hostelDetails ? 'text-blue-600' : 'text-muted-foreground'}`} />
                                </div>
                                {hostelDetails ? (
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate">Hostel Assigned</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {hostelDetails.blockName || 'Hostel'}
                                            {hostelDetails.room?.room_number_name ? ` • Room ${hostelDetails.room.room_number_name}` : ''}
                                            {hostelDetails.bed_number ? ` • ${hostelDetails.bed_number}` : ''}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                {currencySymbol}{Number(hostelDetails.hostel_fee || 0).toLocaleString('en-IN')}/{hostelDetails.billing_cycle || 'monthly'}
                                            </Badge>
                                            {Number(hostelDetails.hostel_fee || 0) === 0 ? (
                                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                                    ⚠️ Fee ₹0 - Edit to set fee
                                                </Badge>
                                            ) : (
                                                <Badge variant={hostelDetails.status === 'Paid' ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0">
                                                    {hostelDetails.status}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">No Hostel Assigned</p>
                                        <p className="text-xs text-muted-foreground">Click to assign room & bed</p>
                                    </div>
                                )}
                            </div>
                            <Button variant={hostelDetails ? 'outline' : 'default'} size="sm" onClick={openHostelAssign} className="gap-1.5 flex-shrink-0">
                                {hostelDetails ? <><Building2 className="h-3.5 w-3.5" />Edit</> : <><Plus className="h-3.5 w-3.5" />Assign</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ═══ Transport Assignment Dialog ═══ */}
            <Dialog open={transportAssignOpen} onOpenChange={setTransportAssignOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bus className="h-5 w-5 text-green-600" />
                            {transportDetails ? 'Edit Transport Assignment' : 'Assign Transport'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        {/* Route */}
                        <div className="space-y-1.5">
                            <Label>Route <span className="text-red-500">*</span></Label>
                            <Select value={transportForm.transport_route_id || 'none'} onValueChange={(v) => handleTransportRouteChange(v === 'none' ? '' : v)}>
                                <SelectTrigger><SelectValue placeholder="Select Route" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- Select Route --</SelectItem>
                                    {transportRoutes.map(r => <SelectItem key={r.id} value={r.id}>{r.route_title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Pickup Point */}
                        {transportForm.transport_route_id && (
                            <div className="space-y-1.5">
                                <Label>Pickup Point</Label>
                                <Select value={transportForm.transport_pickup_point_id || 'none'} onValueChange={(v) => handleTransportPickupChange(v === 'none' ? '' : v)}>
                                    <SelectTrigger><SelectValue placeholder="Select Pickup Point" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Select Pickup Point --</SelectItem>
                                        {(routePickupPoints.length > 0 ? routePickupPoints : transportPickupPoints).map(pp => (
                                            <SelectItem key={pp.id} value={pp.id}>
                                                {pp.name}{pp.monthly_fees ? ` (${currencySymbol}${pp.monthly_fees})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {/* Vehicle */}
                        {routeVehicles.length > 0 && (
                            <div className="space-y-1.5">
                                <Label>Vehicle</Label>
                                <Select value="none" onValueChange={(v) => v !== 'none' && handleTransportVehicleSelect(v)}>
                                    <SelectTrigger><SelectValue placeholder={transportForm.vehicle_number ? `${transportForm.vehicle_number}` : 'Select Vehicle'} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Select Vehicle --</SelectItem>
                                        {routeVehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.vehicle_number} - {v.driver_name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {/* Fee & Billing */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Transport Fee ({currencySymbol})</Label>
                                <Input type="number" value={transportForm.transport_fee} onChange={(e) => setTransportForm(prev => ({ ...prev, transport_fee: e.target.value }))} placeholder="0" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Billing Cycle</Label>
                                <Select value={transportForm.billing_cycle} onValueChange={(v) => setTransportForm(prev => ({ ...prev, billing_cycle: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="quarterly">Quarterly</SelectItem>
                                        <SelectItem value="half_yearly">Half-Yearly</SelectItem>
                                        <SelectItem value="annual">Annual</SelectItem>
                                        <SelectItem value="one_time">One-Time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {/* Pickup & Drop Time */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Pickup Time</Label>
                                <Input type="time" value={transportForm.pickup_time} onChange={(e) => setTransportForm(prev => ({ ...prev, pickup_time: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Drop Time</Label>
                                <Input type="time" value={transportForm.drop_time} onChange={(e) => setTransportForm(prev => ({ ...prev, drop_time: e.target.value }))} />
                            </div>
                        </div>
                        {/* Special Instructions */}
                        <div className="space-y-1.5">
                            <Label>Special Instructions</Label>
                            <Textarea value={transportForm.special_instructions} onChange={(e) => setTransportForm(prev => ({ ...prev, special_instructions: e.target.value }))} placeholder="Any special notes..." rows={2} />
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        {transportDetails && (
                            <Button variant="destructive" size="sm" onClick={removeTransportAssignment} disabled={assignSaving}>
                                Remove Transport
                            </Button>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <Button variant="outline" onClick={() => setTransportAssignOpen(false)}>Cancel</Button>
                            <Button onClick={saveTransportAssignment} disabled={assignSaving} className="gap-1.5">
                                {assignSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                <Save className="h-4 w-4" />{transportDetails ? 'Update' : 'Assign'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ═══ Hostel Assignment Dialog ═══ */}
            <Dialog open={hostelAssignOpen} onOpenChange={setHostelAssignOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            {hostelDetails ? 'Edit Hostel Assignment' : 'Assign Hostel'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        {/* Hostel */}
                        <div className="space-y-1.5">
                            <Label>Hostel <span className="text-red-500">*</span></Label>
                            <Select value={hostelForm.hostel_id || 'none'} onValueChange={(v) => {
                                const val = v === 'none' ? '' : v;
                                setHostelForm(prev => ({ ...prev, hostel_id: val, room_id: '', room_type_id: '', bed_number: '' }));
                                setAssignedBeds([]);
                            }}>
                                <SelectTrigger><SelectValue placeholder="Select Hostel" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- Select Hostel --</SelectItem>
                                    {hostelsList.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Room */}
                        {hostelForm.hostel_id && (
                            <div className="space-y-1.5">
                                <Label>Room</Label>
                                <Select value={hostelForm.room_id || 'none'} onValueChange={(v) => handleHostelRoomChange(v === 'none' ? '' : v)}>
                                    <SelectTrigger><SelectValue placeholder="Select Room" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Select Room --</SelectItem>
                                        {hostelRooms.filter(r => r.hostel_id === hostelForm.hostel_id).map(r => (
                                            <SelectItem key={r.id} value={r.id}>{r.room_number_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {/* Bed Number */}
                        {hostelForm.room_id && (
                            <div className="space-y-1.5">
                                <Label>Bed Number <span className="text-red-500">*</span></Label>
                                <Select value={hostelForm.bed_number || 'none'} onValueChange={(v) => setHostelForm(prev => ({ ...prev, bed_number: v === 'none' ? '' : v }))}>
                                    <SelectTrigger><SelectValue placeholder="Select Bed" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Select Bed --</SelectItem>
                                        {(() => {
                                            const avail = getAvailableBeds();
                                            const beds = hostelForm.bed_number && !avail.includes(hostelForm.bed_number) ? [hostelForm.bed_number, ...avail] : avail;
                                            return beds.map(b => <SelectItem key={b} value={b}>{b}{b === hostelForm.bed_number && hostelDetails?.bed_number === b ? ' (Current)' : ''}</SelectItem>);
                                        })()}
                                    </SelectContent>
                                </Select>
                                {assignedBeds.length > 0 && (
                                    <p className="text-xs text-muted-foreground">Occupied: {assignedBeds.join(', ')}</p>
                                )}
                            </div>
                        )}
                        {/* Room Type */}
                        {hostelForm.room_id && hostelRoomTypes.length > 0 && (
                            <div className="space-y-1.5">
                                <Label>Room Type</Label>
                                <Select value={hostelForm.room_type_id || 'none'} onValueChange={(v) => setHostelForm(prev => ({ ...prev, room_type_id: v === 'none' ? '' : v }))}>
                                    <SelectTrigger><SelectValue placeholder="Room Type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Select --</SelectItem>
                                        {hostelRoomTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {/* Fee & Billing */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Hostel Fee ({currencySymbol})</Label>
                                <Input type="number" value={hostelForm.hostel_fee} onChange={(e) => setHostelForm(prev => ({ ...prev, hostel_fee: e.target.value }))} placeholder="0" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Billing Cycle</Label>
                                <Select value={hostelForm.billing_cycle} onValueChange={(v) => setHostelForm(prev => ({ ...prev, billing_cycle: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="quarterly">Quarterly</SelectItem>
                                        <SelectItem value="half_yearly">Half-Yearly</SelectItem>
                                        <SelectItem value="annual">Annual</SelectItem>
                                        <SelectItem value="one_time">One-Time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {/* Check-in & Guardian */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Check-in Date</Label>
                                <Input type="date" value={hostelForm.check_in_date} onChange={(e) => setHostelForm(prev => ({ ...prev, check_in_date: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Guardian Contact</Label>
                                <Input value={hostelForm.hostel_guardian_contact} onChange={(e) => setHostelForm(prev => ({ ...prev, hostel_guardian_contact: e.target.value }))} placeholder="Phone number" />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        {hostelDetails && (
                            <Button variant="destructive" size="sm" onClick={removeHostelAssignment} disabled={assignSaving}>
                                Remove Hostel
                            </Button>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <Button variant="outline" onClick={() => setHostelAssignOpen(false)}>Cancel</Button>
                            <Button onClick={saveHostelAssignment} disabled={assignSaving} className="gap-1.5">
                                {assignSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                <Save className="h-4 w-4" />{hostelDetails ? 'Update' : 'Assign'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Class Teacher & Discounts - Inline */}
            {(classTeacher || studentDiscounts.length > 0) && (
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    {classTeacher && (
                        <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Class Teacher:</span>
                            <span className="text-sm font-medium">{classTeacher.full_name}</span>
                            {classTeacher.phone && <span className="text-xs text-muted-foreground">({classTeacher.phone})</span>}
                        </div>
                    )}
                    {studentDiscounts.length > 0 && (
                        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-700 dark:text-blue-300">Discounts:</span>
                            {studentDiscounts.map(d => (
                                <Badge key={d.id} variant="secondary" className="bg-green-100 text-green-700">
                                    {d.name}: {d.discount_type === 'percentage' ? `${d.amount}%` : `${currencySymbol}${d.amount}`}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Fee Statement & Payment History - Full Width */}
            <Card>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <CardHeader className="pb-0">
                        <div className="flex items-center justify-between">
                            <TabsList>
                                <TabsTrigger value="fees" className="gap-2">
                                    <FileText className="h-4 w-4" />Fee Statement
                                </TabsTrigger>
                                <TabsTrigger value="history" className="gap-2">
                                    <History className="h-4 w-4" />Payment History
                                    <Badge variant="secondary" className="ml-1">{new Set([
                                        ...payments.map(p => p.transaction_id || `fee-${p.id}`),
                                        ...(transportDetails?.payments?.map(p => p.transaction_id || `transport-${p.id}`) || []),
                                        ...(hostelDetails?.payments?.map(p => p.transaction_id || `hostel-${p.id}`) || [])
                                    ]).size}</Badge>
                                </TabsTrigger>
                            </TabsList>
                            {activeTab === 'fees' && feeSummary.unpaidCount > 0 && (
                                        <Button variant="outline" size="sm" onClick={selectAllUnpaid}>
                                            Select All Unpaid
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <TabsContent value="fees" className="m-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted/50">
                                                    <th className="p-3 w-10"></th>
                                                    <th className="p-3 text-left font-medium">Fee Group</th>
                                                    <th className="p-3 text-left font-medium">Fee Type</th>
                                                    <th className="p-3 text-left font-medium">Due Date</th>
                                                    <th className="p-3 text-right font-medium">Amount</th>
                                                    {hasAnyDiscount && <th className="p-3 text-right font-medium">Discount</th>}
                                                    <th className="p-3 text-right font-medium text-emerald-600">Net Fee</th>
                                                    {hasAnyFine && <th className="p-3 text-right font-medium">Fine</th>}
                                                    <th className="p-3 text-right font-medium">Paid</th>
                                                    <th className="p-3 text-right font-medium">Balance</th>
                                                    <th className="p-3 text-center font-medium">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allFeesForDisplay.length > 0 ? allFeesForDisplay.map(fee => (
                                                    <tr 
                                                        key={fee.id} 
                                                        className={`border-b hover:bg-muted/30 transition-colors ${selectedFees.includes(fee.id) ? 'bg-primary/5' : ''} ${fee.isOverdue ? 'bg-red-50 dark:bg-red-950/20' : ''} ${fee.isTransport ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''} ${fee.isHostel ? 'bg-purple-50/50 dark:bg-purple-950/20' : ''}`}
                                                    >
                                                        <td className="p-3 text-center">
                                                            {fee.balance > 0 && (
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={selectedFees.includes(fee.id)} 
                                                                    onChange={() => handleFeeSelection(fee.id)} 
                                                                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                                                                />
                                                            )}
                                                        </td>
                                                        <td className="p-3 font-medium">
                                                            {fee.group}
                                                            {fee.isTransport && <span className="text-xs text-blue-600 block">🚌 Route</span>}
                                                            {fee.isHostel && <span className="text-xs text-purple-600 block">🏠 Block</span>}
                                                        </td>
                                                        <td className="p-3">
                                                            <div>
                                                                <span className="font-mono text-xs bg-muted px-1 rounded">{fee.type}</span>
                                                                <p className="text-xs text-muted-foreground">{fee.typeName}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-3">
                                                            {fee.dueDate ? (
                                                                <div className={fee.isOverdue ? 'text-red-600' : ''}>
                                                                    {format(parseISO(fee.dueDate), 'dd MMM yyyy')}
                                                                    {fee.isOverdue && <p className="text-xs">?? Overdue</p>}
                                                                </div>
                                                            ) : 'N/A'}
                                                        </td>
                                                        <td className="p-3 text-right font-mono">{currencySymbol}{fee.amount.toLocaleString('en-IN')}</td>
                                                        {hasAnyDiscount && <td className="p-3 text-right font-mono text-blue-600">{currencySymbol}{fee.totalDiscount.toLocaleString('en-IN')}</td>}
                                                        <td className="p-3 text-right font-mono font-semibold text-emerald-600">{currencySymbol}{(fee.amount - fee.totalDiscount).toLocaleString('en-IN')}</td>
                                                        {hasAnyFine && <td className="p-3 text-right font-mono text-amber-600">{currencySymbol}{fee.totalFine.toLocaleString('en-IN')}</td>}
                                                        <td className="p-3 text-right font-mono text-green-600">{currencySymbol}{fee.totalPaid.toLocaleString('en-IN')}</td>
                                                        <td className="p-3 text-right font-mono font-bold">{currencySymbol}{fee.balance.toLocaleString('en-IN')}</td>
                                                        <td className="p-3 text-center">
                                                            <Badge variant={fee.status === 'Paid' ? 'success' : fee.status === 'Partial' ? 'warning' : 'destructive'}>
                                                                {fee.status}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan="10" className="p-8 text-center text-muted-foreground">No fees allocated to this student.</td></tr>
                                                )}
                                            </tbody>
                                            {allFeesForDisplay.length > 0 && (
                                                <tfoot>
                                                    <tr className="bg-muted font-bold border-t-2 border-border">
                                                        <td colSpan="4" className="p-3 text-right font-semibold">Grand Total</td>
                                                        <td className="p-3 text-right"><span className="font-mono text-lg font-bold bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">{currencySymbol}{allFeesTotals.amount.toLocaleString('en-IN')}</span></td>
                                                        {hasAnyDiscount && <td className="p-3 text-right"><span className="font-mono text-lg font-bold text-blue-700 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400 px-2 py-1 rounded">{currencySymbol}{allFeesTotals.discount.toLocaleString('en-IN')}</span></td>}
                                                        <td className="p-3 text-right"><span className="font-mono text-lg font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400 px-2 py-1 rounded">{currencySymbol}{(allFeesTotals.amount - allFeesTotals.discount).toLocaleString('en-IN')}</span></td>
                                                        {hasAnyFine && <td className="p-3 text-right"><span className="font-mono text-lg font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-400 px-2 py-1 rounded">{currencySymbol}{allFeesTotals.fine.toLocaleString('en-IN')}</span></td>}
                                                        <td className="p-3 text-right"><span className="font-mono text-lg font-bold text-green-700 bg-green-100 dark:bg-green-900/50 dark:text-green-400 px-2 py-1 rounded">{currencySymbol}{allFeesTotals.paid.toLocaleString('en-IN')}</span></td>
                                                        <td className="p-3 text-right"><span className="font-mono text-lg font-bold text-red-700 bg-red-100 dark:bg-red-900/50 dark:text-red-400 px-2 py-1 rounded">{currencySymbol}{allFeesTotals.balance.toLocaleString('en-IN')}</span></td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>
                                </TabsContent>

                                <TabsContent value="history" className="m-0">
                                    {/* Payment Summary Cards */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 p-2 bg-muted/30 rounded-lg">
                                        <div className="text-center p-2 bg-background rounded border">
                                            <p className="text-[10px] text-muted-foreground uppercase">Total Paid</p>
                                            <p className="text-base font-bold text-green-600">{currencySymbol}{(
                                                payments.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.amount || 0), 0) +
                                                (transportDetails?.payments?.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0) +
                                                (hostelDetails?.payments?.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0)
                                            ).toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="text-center p-2 bg-background rounded border">
                                            <p className="text-[10px] text-muted-foreground uppercase">Total Discount</p>
                                            <p className="text-base font-bold text-blue-600">{currencySymbol}{(
                                                payments.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.discount_amount || 0), 0) +
                                                (transportDetails?.payments?.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.discount_amount || 0), 0) || 0) +
                                                (hostelDetails?.payments?.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.discount_amount || 0), 0) || 0)
                                            ).toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="text-center p-2 bg-background rounded border">
                                            <p className="text-[10px] text-muted-foreground uppercase">Fine Collected</p>
                                            <p className="text-base font-bold text-amber-600">{currencySymbol}{(
                                                payments.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.fine_paid || 0), 0) +
                                                (transportDetails?.payments?.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.fine_paid || 0), 0) || 0) +
                                                (hostelDetails?.payments?.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.fine_paid || 0), 0) || 0)
                                            ).toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="text-center p-2 bg-background rounded border">
                                            <p className="text-[10px] text-muted-foreground uppercase">Transactions</p>
                                            <p className="text-base font-bold text-purple-600">{
                                                new Set([
                                                    ...payments.filter(p => !p.reverted_at).map(p => p.transaction_id || `fee-${p.id}`),
                                                    ...(transportDetails?.payments?.filter(p => !p.reverted_at).map(p => p.transaction_id || `transport-${p.id}`) || []),
                                                    ...(hostelDetails?.payments?.filter(p => !p.reverted_at).map(p => p.transaction_id || `hostel-${p.id}`) || [])
                                                ]).size
                                            }</p>
                                        </div>
                                    </div>
                                    
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b bg-muted/50">
                                                    <th className="p-2 text-left font-medium whitespace-nowrap">Date / Time</th>
                                                    <th className="p-2 text-left font-medium">Fee Type</th>
                                                    <th className="p-2 text-left font-medium">Fee Details</th>
                                                    <th className="p-2 text-left font-medium">Transaction ID</th>
                                                    <th className="p-2 text-left font-medium">Mode</th>
                                                    <th className="p-2 text-right font-medium">Amount</th>
                                                    <th className="p-2 text-right font-medium">Discount</th>
                                                    <th className="p-2 text-right font-medium">Fine</th>
                                                    <th className="p-2 text-right font-medium whitespace-nowrap">Net Paid</th>
                                                    <th className="p-2 text-center font-medium">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* UNIFIED Payment History - All fee types merged by transaction_id */}
                                                {(() => {
                                                    // Build unified groups by transaction_id across all payment types
                                                    const groups = {};
                                                    
                                                    // Academic payments
                                                    payments.forEach(p => {
                                                        const txId = p.transaction_id || `fee-${p.id}`;
                                                        if (!groups[txId]) {
                                                            groups[txId] = { 
                                                                firstPayment: p, payments: [], 
                                                                totalAmount: 0, totalDiscount: 0, totalFine: 0, 
                                                                feeNames: [], types: [], allReverted: true,
                                                                createdAt: p.created_at, paymentDate: p.payment_date,
                                                                paymentMode: p.payment_mode, transactionId: p.transaction_id,
                                                                utrNumber: p.utr_number,
                                                                // For receipt navigation
                                                                hasFeePayment: false, hasTransportPayment: false, hasHostelPayment: false,
                                                                firstFeePaymentId: null, firstTransportPaymentId: null, firstHostelPaymentId: null,
                                                            };
                                                        }
                                                        groups[txId].payments.push({ ...p, _type: 'academic' });
                                                        groups[txId].totalAmount += Number(p.amount || 0);
                                                        groups[txId].totalDiscount += Number(p.discount_amount || 0);
                                                        groups[txId].totalFine += Number(p.fine_paid || 0);
                                                        groups[txId].hasFeePayment = true;
                                                        if (!groups[txId].firstFeePaymentId) groups[txId].firstFeePaymentId = p.id;
                                                        if (!groups[txId].utrNumber && p.utr_number) groups[txId].utrNumber = p.utr_number;
                                                        
                                                        const feeInfo = p.ledger_id
                                                            ? fees.find(f => f.ledgerId === p.ledger_id)
                                                            : fees.find(f => f.masterId === p.fee_master_id);
                                                        const name = feeInfo?.typeName || feeInfo?.feeTypeName || p.receipt_snapshot?.fee?.name || 'Fee';
                                                        if (!groups[txId].feeNames.includes(name)) groups[txId].feeNames.push(name);
                                                        if (!groups[txId].types.includes('Academic')) groups[txId].types.push('Academic');
                                                        if (!p.reverted_at) groups[txId].allReverted = false;
                                                    });
                                                    
                                                    // Transport payments
                                                    (transportDetails?.payments || []).forEach(p => {
                                                        const txId = p.transaction_id || `transport-${p.id}`;
                                                        if (!groups[txId]) {
                                                            groups[txId] = { 
                                                                firstPayment: p, payments: [], 
                                                                totalAmount: 0, totalDiscount: 0, totalFine: 0, 
                                                                feeNames: [], types: [], allReverted: true,
                                                                createdAt: p.created_at, paymentDate: p.payment_date,
                                                                paymentMode: p.payment_mode, transactionId: p.transaction_id,
                                                                utrNumber: p.utr_number,
                                                                hasFeePayment: false, hasTransportPayment: false, hasHostelPayment: false,
                                                                firstFeePaymentId: null, firstTransportPaymentId: null, firstHostelPaymentId: null,
                                                            };
                                                        }
                                                        groups[txId].payments.push({ ...p, _type: 'transport' });
                                                        groups[txId].totalAmount += Number(p.amount || 0);
                                                        groups[txId].totalDiscount += Number(p.discount_amount || 0);
                                                        groups[txId].totalFine += Number(p.fine_paid || 0);
                                                        groups[txId].hasTransportPayment = true;
                                                        if (!groups[txId].firstTransportPaymentId) groups[txId].firstTransportPaymentId = p.id;
                                                        if (!groups[txId].utrNumber && p.utr_number) groups[txId].utrNumber = p.utr_number;
                                                        
                                                        const tName = `Transport Fee`;
                                                        if (!groups[txId].feeNames.includes(tName)) groups[txId].feeNames.push(tName);
                                                        if (!groups[txId].types.includes('Transport')) groups[txId].types.push('Transport');
                                                        if (!p.reverted_at) groups[txId].allReverted = false;
                                                    });
                                                    
                                                    // Hostel payments
                                                    (hostelDetails?.payments || []).forEach(p => {
                                                        const txId = p.transaction_id || `hostel-${p.id}`;
                                                        if (!groups[txId]) {
                                                            groups[txId] = { 
                                                                firstPayment: p, payments: [], 
                                                                totalAmount: 0, totalDiscount: 0, totalFine: 0, 
                                                                feeNames: [], types: [], allReverted: true,
                                                                createdAt: p.created_at, paymentDate: p.payment_date,
                                                                paymentMode: p.payment_mode, transactionId: p.transaction_id,
                                                                utrNumber: p.utr_number,
                                                                hasFeePayment: false, hasTransportPayment: false, hasHostelPayment: false,
                                                                firstFeePaymentId: null, firstTransportPaymentId: null, firstHostelPaymentId: null,
                                                            };
                                                        }
                                                        groups[txId].payments.push({ ...p, _type: 'hostel' });
                                                        groups[txId].totalAmount += Number(p.amount || 0);
                                                        groups[txId].totalDiscount += Number(p.discount_amount || 0);
                                                        groups[txId].totalFine += Number(p.fine_paid || 0);
                                                        groups[txId].hasHostelPayment = true;
                                                        if (!groups[txId].firstHostelPaymentId) groups[txId].firstHostelPaymentId = p.id;
                                                        if (!groups[txId].utrNumber && p.utr_number) groups[txId].utrNumber = p.utr_number;
                                                        
                                                        const hName = `Hostel Fee`;
                                                        if (!groups[txId].feeNames.includes(hName)) groups[txId].feeNames.push(hName);
                                                        if (!groups[txId].types.includes('Hostel')) groups[txId].types.push('Hostel');
                                                        if (!p.reverted_at) groups[txId].allReverted = false;
                                                    });
                                                    
                                                    // Sort by created_at descending
                                                    const sortedGroups = Object.entries(groups).sort((a, b) => 
                                                        new Date(b[1].createdAt) - new Date(a[1].createdAt)
                                                    );
                                                    
                                                    return sortedGroups.map(([txId, group]) => {
                                                        const netPaid = group.totalAmount + group.totalFine - group.totalDiscount;
                                                        // Determine receipt navigation
                                                        const handlePrintReceipt = () => {
                                                            if (group.hasFeePayment) {
                                                                navigate(`/${basePath}/fees-collection/print-receipt/fees/${group.firstFeePaymentId}`);
                                                            } else if (group.hasTransportPayment) {
                                                                navigate(`/${basePath}/fees-collection/print-receipt/transport/${group.firstTransportPaymentId}`);
                                                            } else if (group.hasHostelPayment) {
                                                                navigate(`/${basePath}/fees-collection/print-receipt/hostel/${group.firstHostelPaymentId}`);
                                                            }
                                                        };
                                                        // For revoke - use academicpayment as primary
                                                        const revokePayment = group.hasFeePayment 
                                                            ? group.payments.find(p => p._type === 'academic')
                                                            : group.payments[0];
                                                        const revokeType = group.hasFeePayment ? 'academic' 
                                                            : group.hasTransportPayment ? 'transport' : 'hostel';
                                                        
                                                        return (
                                                    <tr key={txId} className={`border-b ${group.allReverted ? 'bg-red-50 dark:bg-red-950/20 opacity-60 line-through' : 'hover:bg-muted/30'}`}>
                                                        <td className="p-2">
                                                            <div className="font-medium text-xs">{format(parseISO(group.paymentDate || group.createdAt), 'dd MMM yyyy')}</div>
                                                            <div className="text-[10px] text-muted-foreground">{format(parseISO(group.createdAt), 'hh:mm a')}</div>
                                                        </td>
                                                        <td className="p-2">
                                                            <div className="flex flex-col gap-0.5">
                                                                {group.types.includes('Academic') && (
                                                                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-[10px] w-fit">
                                                                        <FileText className="h-3 w-3 mr-1" />Academic
                                                                    </Badge>
                                                                )}
                                                                {group.types.includes('Transport') && (
                                                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-[10px] w-fit">
                                                                        <Bus className="h-3 w-3 mr-1" />Transport
                                                                    </Badge>
                                                                )}
                                                                {group.types.includes('Hostel') && (
                                                                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-[10px] w-fit">
                                                                        <Building2 className="h-3 w-3 mr-1" />Hostel
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-2">
                                                            <div className="font-medium text-xs max-w-[140px] truncate">{group.feeNames.join(', ')}</div>
                                                            {group.utrNumber && (
                                                                <code className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded font-mono mt-0.5 inline-block">UTR: {group.utrNumber}</code>
                                                            )}
                                                        </td>
                                                        <td className="p-2">
                                                            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{group.transactionId || '-'}</code>
                                                        </td>
                                                        <td className="p-2">
                                                            <Badge variant="outline" className="text-[10px]">{group.paymentMode}</Badge>
                                                        </td>
                                                        <td className="p-2 text-right font-mono text-xs">{currencySymbol}{group.totalAmount.toLocaleString('en-IN')}</td>
                                                        <td className="p-2 text-right font-mono text-xs text-blue-600">{group.totalDiscount > 0 ? `-${currencySymbol}${group.totalDiscount.toLocaleString('en-IN')}` : '-'}</td>
                                                        <td className="p-2 text-right font-mono text-xs text-amber-600">{group.totalFine > 0 ? `+${currencySymbol}${group.totalFine.toLocaleString('en-IN')}` : '-'}</td>
                                                        <td className="p-2 text-right font-mono text-xs font-bold text-green-700">{currencySymbol}{netPaid.toLocaleString('en-IN')}</td>
                                                        <td className="p-2 text-center">
                                                            {!group.allReverted ? (
                                                                <div className="flex justify-center gap-1">
                                                                    <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={handlePrintReceipt} title="Print Receipt">
                                                                        <Printer className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button variant="destructive" size="sm" className="h-7 w-7 p-0" onClick={() => { setPaymentToRevoke({ ...revokePayment, totalAmount: group.totalAmount, paymentIds: group.payments.map(pay => pay.id) }); setRevokeType(revokeType); }} title="Revoke Payment">
                                                                        <RotateCcw className="h-3 w-3" />
                                                                    </Button>
                                                                    {!hasExistingRefund(revokePayment.id, revokeType) && (
                                                                        <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-orange-600 border-orange-300 hover:bg-orange-50" onClick={() => openRefundDialog({ ...revokePayment, totalAmount: group.totalAmount, paymentIds: group.payments.map(pay => pay.id) }, revokeType)} title="Request Refund">
                                                                            <Undo2 className="h-3 w-3" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="text-[10px] text-red-600">
                                                                    <div className="font-medium">REVERTED</div>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                        );
                                                    });
                                                })()}

                                                {/* Fee Refund Records */}
                                                {studentRefunds.length > 0 && studentRefunds.map(refund => (
                                                    <tr key={`refund-${refund.id}`} className="border-b bg-orange-50 dark:bg-orange-950/20">
                                                        <td className="p-3">
                                                            <div className="font-medium">{format(parseISO(refund.refund_date || refund.created_at), 'dd MMM yyyy')}</div>
                                                            <div className="text-xs text-muted-foreground">{format(parseISO(refund.created_at), 'hh:mm a')}</div>
                                                        </td>
                                                        <td className="p-3">
                                                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                                                                <Undo2 className="h-3 w-3 mr-1" />Refund
                                                            </Badge>
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="font-medium text-sm capitalize">{refund.refund_type || 'Fee'} Refund</div>
                                                            <div className="text-xs text-muted-foreground">{refund.refund_reason}</div>
                                                        </td>
                                                        <td className="p-3">
                                                            <code className="text-xs bg-muted px-2 py-0.5 rounded">{refund.transaction_id || '-'}</code>
                                                        </td>
                                                        <td className="p-3">
                                                            <Badge variant="outline">{refund.refund_mode}</Badge>
                                                        </td>
                                                        <td className="p-3 text-right font-mono font-semibold text-orange-600">-{currencySymbol}{Number(refund.refund_amount || 0).toLocaleString('en-IN')}</td>
                                                        <td className="p-3 text-right font-mono">-</td>
                                                        <td className="p-3 text-right font-mono">-</td>
                                                        <td className="p-3 text-right font-mono font-bold text-orange-700">-{currencySymbol}{Number(refund.refund_amount || 0).toLocaleString('en-IN')}</td>
                                                        <td className="p-3 text-center">
                                                            <Badge variant={
                                                                refund.status === 'completed' ? 'success' : 
                                                                refund.status === 'approved' ? 'default' : 
                                                                refund.status === 'rejected' ? 'destructive' : 'warning'
                                                            }>
                                                                {refund.status === 'pending' ? '? Pending' : 
                                                                 refund.status === 'approved' ? '? Approved' :
                                                                 refund.status === 'completed' ? '?? Completed' :
                                                                 '? Rejected'}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}

                                                {payments.length === 0 && !transportDetails?.payments?.length && !hostelDetails?.payments?.length && studentRefunds.length === 0 && (
                                                    <tr><td colSpan="10" className="p-8 text-center text-muted-foreground">No payment history found.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </TabsContent>
                            </CardContent>
                        </Tabs>
                    </Card>

                    {/* Collect Fees Card - Below Fee Statement */}
                    {selectedFees.length > 0 && (
                        <Card className="border-primary/50" ref={collectFeesRef}>
                            <CardHeader className="pb-3 bg-primary/5">
                                <CardTitle className="flex items-center gap-2">
                                    <Receipt className="h-5 w-5" />Collect Fees
                                </CardTitle>
                                <CardDescription>{selectedFees.length} fee(s) selected</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left - Fee breakdown */}
                                    <div className="space-y-3">
                                        <Label className="text-xs font-semibold">Enter Amount per Fee</Label>
                                        <div className="border rounded-lg overflow-hidden">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="bg-muted/50 border-b">
                                                        <th className="p-2 text-left">Fee Type</th>
                                                        <th className="p-2 text-right">Balance</th>
                                                        <th className="p-2 text-right">Enter Amount ({currencySymbol})</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedFees.map(feeId => {
                                                        // Look in allFeesForDisplay to include Transport/Hostel fees
                                                        const fee = allFeesForDisplay.find(f => f.id === feeId);
                                                        if (!fee) return null;
                                                        return (
                                                            <tr key={feeId} className={`border-b last:border-0 ${fee.isTransport ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''} ${fee.isHostel ? 'bg-purple-50/50 dark:bg-purple-950/20' : ''}`}>
                                                                <td className="p-2">
                                                                    <div className="font-medium flex items-center gap-1">
                                                                        {fee.isTransport && <span>🚌</span>}
                                                                        {fee.isHostel && <span>🏠</span>}
                                                                        {fee.typeName || fee.type}
                                                                    </div>
                                                                    <div className="text-[10px] text-muted-foreground">{fee.group}</div>
                                                                </td>
                                                                <td className="p-2 text-right font-mono text-muted-foreground">{currencySymbol}{fee.balance.toLocaleString('en-IN')}</td>
                                                                <td className="p-2 text-right">
                                                                    <Input
                                                                        type="number"
                                                                        value={feeAmounts[feeId] ?? ''}
                                                                        onChange={(e) => {
                                                                            const val = parseFloat(e.target.value) || 0;
                                                                            setFeeAmounts(prev => ({
                                                                                ...prev,
                                                                                [feeId]: val > fee.balance ? fee.balance : (e.target.value === '' ? '' : val)
                                                                            }));
                                                                        }}
                                                                        max={fee.balance}
                                                                        className="h-7 w-24 ml-auto text-right font-mono"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="bg-muted/30 font-semibold">
                                                        <td className="p-2">Total</td>
                                                        <td className="p-2 text-right font-mono">{currencySymbol}{selectedFeesMaxBalance.toLocaleString('en-IN')}</td>
                                                        <td className="p-2 text-right font-mono">{currencySymbol}{parseFloat(paymentDetails.amount || 0).toLocaleString('en-IN')}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        {/* Discount Info */}
                                        {totalAssignedDiscount > 0 && (
                                            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-xs space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Assigned Discount:</span>
                                                    <span className="font-medium">{currencySymbol}{totalAssignedDiscount.toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Already Used:</span>
                                                    <span className="font-medium text-green-600">-{currencySymbol}{totalDiscountAlreadyUsed.toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="flex justify-between border-t pt-1 mt-1">
                                                    <span className="font-semibold">Remaining:</span>
                                                    <span className={`font-bold ${remainingDiscount > 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                                                        {currencySymbol}{remainingDiscount.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right - Payment details */}
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">
                                                    Discount ({currencySymbol})
                                                    {remainingDiscount > 0 && <span className="text-green-600 ml-1">(Auto)</span>}
                                                </Label>
                                                <Input 
                                                    type="number" 
                                                    value={paymentDetails.discount} 
                                                    onChange={(e) => setPaymentDetails(p => ({ ...p, discount: e.target.value }))}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Fine ({currencySymbol})</Label>
                                                <Input 
                                                    type="number" 
                                                    value={paymentDetails.fine} 
                                                    onChange={(e) => setPaymentDetails(p => ({ ...p, fine: e.target.value }))}
                                                    className="h-9"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Date</Label>
                                                <DatePicker 
                                                    value={paymentDetails.payment_date} 
                                                    onChange={(date) => setPaymentDetails(p => ({...p, payment_date: date}))}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Payment Mode</Label>
                                                <Select value={paymentDetails.payment_mode} onValueChange={v => setPaymentDetails(p => ({ ...p, payment_mode: v }))}>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Cash"><div className="flex items-center gap-2"><Banknote className="h-4 w-4" />Cash</div></SelectItem>
                                                        <SelectItem value="Cheque"><div className="flex items-center gap-2"><FileText className="h-4 w-4" />Cheque</div></SelectItem>
                                                        <SelectItem value="Online"><div className="flex items-center gap-2"><CreditCard className="h-4 w-4" />Online/UPI</div></SelectItem>
                                                        <SelectItem value="Card"><div className="flex items-center gap-2"><CreditCard className="h-4 w-4" />Card</div></SelectItem>
                                                        <SelectItem value="Bank Transfer"><div className="flex items-center gap-2"><Building2 className="h-4 w-4" />Bank Transfer</div></SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* UPI QR Button */}
                                        {paymentDetails.payment_mode === 'Online' && upiSettings.enabled && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                                                onClick={() => {
                                                    const total = parseFloat(paymentDetails.amount || 0) - parseFloat(paymentDetails.discount || 0) + parseFloat(paymentDetails.fine || 0);
                                                    generateUpiQr(total, 'academic');
                                                }}
                                            >
                                                <QrCode className="h-4 w-4 mr-2" />
                                                Show UPI QR Code
                                            </Button>
                                        )}

                                        {/* UTR Number */}
                                        {isUpiPayment(paymentDetails.payment_mode) && (
                                            <div className="space-y-1">
                                                <Label className="text-xs">UPI UTR Number <span className="text-red-500">*</span></Label>
                                                <Input 
                                                    value={paymentDetails.utr_number} 
                                                    onChange={(e) => setPaymentDetails(p => ({...p, utr_number: e.target.value.toUpperCase() }))}
                                                    placeholder="Enter 12-22 digit UTR number"
                                                    className="h-9 font-mono"
                                                    maxLength={22}
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-1">
                                            <Label className="text-xs">Note (Optional)</Label>
                                            <Textarea 
                                                value={paymentDetails.note} 
                                                onChange={(e) => setPaymentDetails(p => ({...p, note: e.target.value }))}
                                                rows={2}
                                                placeholder={paymentDetails.payment_mode !== 'Cash' ? 'Enter reference/cheque number...' : 'Payment remarks...'}
                                            />
                                        </div>

                                        {/* Payment Summary */}
                                        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span>Amount</span>
                                                <span>{currencySymbol}{parseFloat(paymentDetails.amount || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-blue-600">
                                                <span>- Discount</span>
                                                <span>{currencySymbol}{parseFloat(paymentDetails.discount || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-amber-600">
                                                <span>+ Fine</span>
                                                <span>{currencySymbol}{parseFloat(paymentDetails.fine || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                                                <span>Total</span>
                                                <span className="text-green-600">
                                                    {currencySymbol}{(parseFloat(paymentDetails.amount || 0) - parseFloat(paymentDetails.discount || 0) + parseFloat(paymentDetails.fine || 0)).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        <Button 
                                            className="w-full" 
                                            onClick={collectFees} 
                                            disabled={paymentLoading || !selectedFees.length}
                                            size="lg"
                                        >
                                            {paymentLoading ? (
                                                <Loader2 className="animate-spin mr-2" />
                                            ) : (
                                                <Printer className="mr-2 h-4 w-4" />
                                            )}
                                            Collect & Print Receipt
                                        </Button>

                                        {/* 🌟 COMBINED COLLECTION BUTTON - Shows when both academic AND transport have balance */}
                                        {transportDetails && transportBalanceWithRefunds > 0 && selectedFees.length > 0 && parseFloat(transportPaymentDetails.amount || 0) > 0 && (
                                            <Button 
                                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" 
                                                onClick={collectAllFeesAndPrint} 
                                                disabled={paymentLoading}
                                                size="lg"
                                            >
                                                {paymentLoading ? (
                                                    <Loader2 className="animate-spin mr-2" />
                                                ) : (
                                                    <Receipt className="mr-2 h-4 w-4" />
                                                )}
                                                Collect All & Print Combined Receipt
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

            {/* Revoke Payment Dialog */}
            <AlertDialog open={!!paymentToRevoke} onOpenChange={() => { setPaymentToRevoke(null); setRevokeType('academic'); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <ShieldX className="h-5 w-5" />Revoke Payment
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to revoke this {revokeType} payment of <strong>{currencySymbol}{(paymentToRevoke?.totalAmount || paymentToRevoke?.amount || 0).toLocaleString('en-IN')}</strong>? 
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Label htmlFor="revoke-reason">Reason for Revocation <span className="text-red-500">*</span></Label>
                        <Input 
                            id="revoke-reason" 
                            value={revokeReason} 
                            onChange={e => setRevokeReason(e.target.value)} 
                            placeholder="e.g., Incorrect entry, Duplicate payment"
                            className="mt-2"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={revokePayment} 
                            disabled={paymentLoading || !revokeReason}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {paymentLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                            Revoke Payment
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Refund Request Dialog */}
            <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
                <AlertDialogContent className="max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
                            <Undo2 className="h-5 w-5" />Request Fee Refund
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Submit a refund request for approval. Super Admin will review and approve.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    {refundPayment && (
                        <div className="space-y-4 py-2">
                            {/* Original Payment Info */}
                            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Type</span>
                                    <Badge variant="outline" className="capitalize">{refundType} Fee</Badge>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Transaction ID</span>
                                    <code className="text-xs bg-muted px-2 py-0.5 rounded">{refundPayment.transaction_id || '-'}</code>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Original Amount Paid</span>
                                    <span className="font-bold">{currencySymbol}{Number(refundPayment.totalAmount || refundPayment.amount || 0).toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            {/* Refund Amount */}
                            <div className="space-y-1">
                                <Label className="text-sm font-medium">Refund Amount ({currencySymbol}) <span className="text-red-500">*</span></Label>
                                <Input
                                    type="number"
                                    value={refundDetails.refund_amount}
                                    onChange={e => setRefundDetails(p => ({ ...p, refund_amount: e.target.value }))}
                                    placeholder={`Max: ${Number(refundPayment.totalAmount || refundPayment.amount || 0).toLocaleString('en-IN')}`}
                                    max={Number(refundPayment.totalAmount || refundPayment.amount || 0)}
                                />
                                <p className="text-xs text-muted-foreground">Cannot exceed original paid amount</p>
                            </div>

                            {/* Refund Reason */}
                            <div className="space-y-1">
                                <Label className="text-sm font-medium">Reason <span className="text-red-500">*</span></Label>
                                <Select value={refundDetails.refund_reason} onValueChange={v => setRefundDetails(p => ({ ...p, refund_reason: v }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select reason..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="School Leaving">School Leaving / TC</SelectItem>
                                        <SelectItem value="Hostel Exit">Hostel Exit</SelectItem>
                                        <SelectItem value="Transport Discontinue">Transport Discontinue</SelectItem>
                                        <SelectItem value="Excess Payment">Excess Payment</SelectItem>
                                        <SelectItem value="Fee Adjustment">Fee Adjustment</SelectItem>
                                        <SelectItem value="Duplicate Payment">Duplicate Payment</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Refund Mode */}
                            <div className="space-y-1">
                                <Label className="text-sm font-medium">Refund Mode</Label>
                                <Select value={refundDetails.refund_mode} onValueChange={v => setRefundDetails(p => ({ ...p, refund_mode: v }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                        <SelectItem value="Cheque">Cheque</SelectItem>
                                        <SelectItem value="Online">Online / NEFT</SelectItem>
                                        <SelectItem value="UPI">UPI</SelectItem>
                                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Note */}
                            <div className="space-y-1">
                                <Label className="text-sm font-medium">Note (Optional)</Label>
                                <Textarea
                                    value={refundDetails.note}
                                    onChange={e => setRefundDetails(p => ({ ...p, note: e.target.value }))}
                                    rows={2}
                                    placeholder="Additional remarks..."
                                />
                            </div>

                            {/* Summary */}
                            {refundDetails.refund_amount && parseFloat(refundDetails.refund_amount) > 0 && (
                                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 rounded-lg p-3">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-orange-700">Refund Amount</span>
                                        <span className="text-xl font-bold text-orange-700">{currencySymbol}{parseFloat(refundDetails.refund_amount).toLocaleString('en-IN')}</span>
                                    </div>
                                    <p className="text-xs text-orange-600 mt-1">? This will be sent for Super Admin approval</p>
                                </div>
                            )}
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button
                            onClick={submitRefundRequest}
                            disabled={paymentLoading || !refundDetails.refund_amount || !refundDetails.refund_reason}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {paymentLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Undo2 className="mr-2 h-4 w-4" />}
                            Submit Refund Request
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* UPI QR Code Modal */}
            <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-purple-700">
                            <QrCode className="h-5 w-5" />
                            UPI Payment QR Code
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center space-y-4 py-4">
                        {qrCodeDataUrl && (
                            <div className="bg-white dark:bg-gray-100 p-4 rounded-xl shadow-lg border-2 border-purple-200">
                                <img src={qrCodeDataUrl} alt="UPI QR Code" className="w-64 h-64" />
                            </div>
                        )}
                        <div className="text-center space-y-2 w-full">
                            <p className="text-sm text-muted-foreground">Scan with any UPI app</p>
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                <Smartphone className="h-4 w-4" />
                                Google Pay � PhonePe � Paytm � BHIM
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3 mt-3">
                                <p className="text-xs text-purple-600 font-medium">UPI ID</p>
                                <p className="font-mono text-sm font-bold text-purple-800">{upiSettings.upi_id}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3">
                                <p className="text-xs text-green-600 font-medium">Amount to Pay</p>
                                <p className="text-2xl font-bold text-green-700">
                                    {currencySymbol}
                                    {qrPaymentType === 'academic' 
                                        ? (parseFloat(paymentDetails.amount || 0) - parseFloat(paymentDetails.discount || 0) + parseFloat(paymentDetails.fine || 0)).toFixed(2)
                                        : qrPaymentType === 'transport'
                                        ? (parseFloat(transportPaymentDetails.amount || 0) - parseFloat(transportPaymentDetails.discount || 0) + parseFloat(transportPaymentDetails.fine || 0)).toFixed(2)
                                        : (parseFloat(hostelPaymentDetails.amount || 0) - parseFloat(hostelPaymentDetails.discount || 0) + parseFloat(hostelPaymentDetails.fine || 0)).toFixed(2)
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="w-full pt-2 border-t">
                            <p className="text-xs text-amber-600 text-center">
                                ?? After payment, enter UTR/Transaction ID in the Note field and click Collect
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default StudentFees;
