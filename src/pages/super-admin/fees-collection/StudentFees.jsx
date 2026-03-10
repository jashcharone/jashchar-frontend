import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    IndianRupee, Receipt, History, ArrowLeft, Building2, Bus, Undo2, QrCode, X, Smartphone
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
// - monthly: fee × sessionMonths (e.g., ₹5000/month × 12 = ₹60,000/year)
// - quarterly: fee × ceil(sessionMonths/3) (e.g., ₹15000/quarter × 4 = ₹60,000/year)
// - half_yearly: fee × ceil(sessionMonths/6) (e.g., ₹30000/semester × 2 = ₹60,000/year)
// - annual: fee × 1 (e.g., ₹60,000/year)
// - one_time: fee × 1 (e.g., ₹10,000 one-time)
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
const SummaryCard = ({ title, amount, icon: Icon, variant = 'default', currencySymbol = '₹' }) => {
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
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
                        <p className="text-2xl font-bold mt-1">{currencySymbol}{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className={`p-3 rounded-full bg-background/50 ${iconColors[variant]}`}>
                        <Icon className="h-5 w-5" />
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
    const currencySymbol = school?.currency_symbol || '₹';

    const [student, setStudent] = useState(null);
    const [classTeacher, setClassTeacher] = useState(null);
    const [fees, setFees] = useState([]);
    const [transportDetails, setTransportDetails] = useState(null); // Transport fee details
    const [hostelDetails, setHostelDetails] = useState(null); // Hostel fee details
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [selectedFees, setSelectedFees] = useState([]);
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

    const fetchStudentAndFees = useCallback(async () => {
        if (!studentId || !selectedBranch?.id) return;
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
            // AUTO-ALLOCATE FEES: If fee group is assigned to student's class,
            // automatically create student_fee_allocations for this student
            // ====================================================================
            if (studentRes.data.class_id) {
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
                            .eq('branch_id', selectedBranch.id);
                        
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

            const [allocationsRes, paymentsRes] = await Promise.all([
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
                    .eq('branch_id', selectedBranch.id),
                supabase
                    .from('fee_payments')
                    .select(`*, fee_master:fee_masters(*, fee_group:fee_groups(name), fee_type:fee_types(name))`)
                    .eq('student_id', studentId)
                    .eq('branch_id', selectedBranch.id)
                    .order('payment_date', { ascending: false })
            ]);

            if (allocationsRes.error) throw allocationsRes.error;
            if (paymentsRes.error) throw paymentsRes.error;
            
            setPayments(paymentsRes.data || []);

            const processedFees = (allocationsRes.data || []).map(item => {
                const master = item.fee_master;
                if (!master) return null;

                const validPayments = (paymentsRes.data || []).filter(p => p.fee_master_id === master.id && !p.reverted_at);
                
                const totalPaid = validPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                const totalDiscount = validPayments.reduce((sum, p) => sum + (Number(p.discount_amount) || 0), 0);
                const totalFine = validPayments.reduce((sum, p) => sum + (Number(p.fine_paid) || 0), 0);
                const masterAmount = Number(master.amount) || 0;
                // ✅ FIXED: Balance cannot be negative (cap at 0)
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
                };
            }).filter(Boolean)
              .sort((a, b) => {
                  // Sort by dueDate ascending (earliest due date first)
                  if (!a.dueDate && !b.dueDate) return 0;
                  if (!a.dueDate) return 1; // Items without dueDate go last
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
                    route:transport_route_id(id, route_title, billing_cycle),
                    pickup_point:transport_pickup_point_id(id, name)
                `)
                .eq('student_id', studentId)
                .eq('branch_id', selectedBranch.id)
                .maybeSingle();

            if (transportData && transportData.transport_fee > 0) {
                // Check for transport payments
                const { data: transportPayments } = await supabase
                    .from('transport_fee_payments')
                    .select('*')
                    .eq('student_id', studentId)
                    .eq('branch_id', selectedBranch.id)
                    .is('reverted_at', null);

                // Get billing cycle from route (set in Routes page) or fallback to student_transport_details or default to monthly
                const billingCycle = transportData.route?.billing_cycle || transportData.billing_cycle || 'monthly';
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
                    room_type:hostel_room_type(id, name, cost, billing_cycle)
                `)
                .eq('student_id', studentId)
                .eq('branch_id', selectedBranch.id)
                .maybeSingle();

            if (hostelData && hostelData.hostel_fee > 0) {
                // Check for hostel payments
                const { data: hostelPayments } = await supabase
                    .from('hostel_fee_payments')
                    .select('*')
                    .eq('student_id', studentId)
                    .eq('branch_id', selectedBranch.id)
                    .is('reverted_at', null);

                // Get billing cycle from room_type (set in Room Types page) or fallback to student_hostel_details or default to monthly
                const billingCycle = hostelData.room_type?.billing_cycle || hostelData.billing_cycle || 'monthly';
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
    };

    // Select all unpaid fees
    const selectAllUnpaid = () => {
        const unpaidIds = fees.filter(f => f.balance > 0).map(f => f.id);
        setSelectedFees(unpaidIds);
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

    // ✅ Calculate MAXIMUM payable amount based on selected fees
    // User cannot pay MORE than this amount
    const selectedFeesMaxBalance = useMemo(() => {
        let total = 0;
        selectedFees.forEach(id => {
            const fee = fees.find(f => f.id === id);
            if (fee && fee.balance > 0) {
                total += fee.balance;
            }
        });
        return total;
    }, [selectedFees, fees]);

    useEffect(() => {
        let totalBalance = 0;
        let totalFine = 0;

        selectedFees.forEach(id => {
            const fee = fees.find(f => f.id === id);
            if (fee) {
                totalBalance += fee.balance > 0 ? fee.balance : 0;
                totalFine += fee.fine > 0 ? fee.fine : 0;
            }
        });
        
        // Apply only REMAINING discount (not full assigned discount)
        // Once discount is fully used in previous payments, it won't apply again
        let applicableDiscount = Math.min(remainingDiscount, totalBalance);
        
        setPaymentDetails(prev => ({
            ...prev,
            amount: totalBalance.toFixed(2),
            fine: totalFine.toFixed(2),
            discount: applicableDiscount.toFixed(2)
        }));
    }, [selectedFees, fees, remainingDiscount]);

    const feeSummary = useMemo(() => {
        // Academic fees
        const academicTotal = fees.reduce((sum, f) => sum + f.amount, 0);
        const academicPaid = payments.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.amount), 0);
        const academicDiscount = payments.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.discount_amount), 0);

        // Transport fees (only if assigned) - Use totalFee (annual) not transport_fee (monthly)
        const transportTotal = transportDetails ? Number(transportDetails.totalFee || 0) : 0;
        const transportPaid = transportDetails ? (transportDetails.totalPaid || 0) : 0;
        const transportDiscount = transportDetails ? (transportDetails.totalDiscount || 0) : 0;

        // Hostel fees (only if assigned) - Use totalFee (annual) not hostel_fee (monthly)
        const hostelTotal = hostelDetails ? Number(hostelDetails.totalFee || 0) : 0;
        const hostelPaid = hostelDetails ? (hostelDetails.totalPaid || 0) : 0;
        const hostelDiscount = hostelDetails ? (hostelDetails.totalDiscount || 0) : 0;

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
        // ✅ FIXED: Balance cannot be negative (cap at 0)
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

        // ✅ VALIDATION: Amount cannot exceed selected fees balance
        if (enteredAmount > selectedFeesMaxBalance) {
            toast({ 
                variant: 'destructive', 
                title: 'Amount exceeds balance', 
                description: `ನೀವು enter ಮಾಡಿದ Amount (₹${enteredAmount.toLocaleString('en-IN')}) selected fees ನ balance (₹${selectedFeesMaxBalance.toLocaleString('en-IN')}) ಗಿಂತ ಹೆಚ್ಚು. ದಯವಿಟ್ಟು ಸರಿಯಾದ amount enter ಮಾಡಿ.` 
            });
            return;
        }

        // ✅ VALIDATION: Discount cannot exceed the amount being paid
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
            let remainingAmountToDistribute = parseFloat(paymentDetails.amount);
            let remainingDiscountToDistribute = parseFloat(paymentDetails.discount);
            let remainingFineToDistribute = parseFloat(paymentDetails.fine);

            const paymentsToInsert = [];
            
            // Generate readable Transaction ID (e.g., JIS/2601/00001)
            const branchCode = selectedBranch?.branch_code || selectedBranch?.code || 'TXN';
            const newTransactionId = await generateTransactionId(supabase, selectedBranch.id, branchCode);

            for (const feeId of selectedFees) {
                const fee = fees.find(f => f.id === feeId);
                if (!fee || fee.balance <= 0) continue;

                const amountForThisFee = Math.min(remainingAmountToDistribute, fee.balance);
                const discountForThisFee = Math.min(remainingDiscountToDistribute, fee.balance - amountForThisFee);
                const fineForThisFee = Math.min(remainingFineToDistribute, fee.fine);
                
                // ✅ FIX: Calculate balance AFTER this payment (for historical receipt display)
                const balanceAfterThisPayment = Math.max(0, fee.balance - amountForThisFee - discountForThisFee);
                
                // ✅ BUILD COMPLETE RECEIPT SNAPSHOT - Saved at payment time for historical accuracy
                const receiptSnapshot = {
                    student: {
                        id: studentId,
                        name: student?.full_name || student?.name,
                        admission_no: student?.admission_no,
                        father_name: student?.father_name,
                        class: student?.classes?.name || student?.class?.name,
                        section: student?.sections?.name || student?.section?.name,
                        session: student?.sessions?.name,
                    },
                    fee: {
                        id: fee.masterId,
                        name: fee.typeName || fee.feeTypeName,
                        group: fee.groupName || fee.feeGroupName,
                        total_amount: fee.totalFee || fee.amount,
                        due_date: fee.dueDate,
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
                    transaction_id: newTransactionId,
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
                        fee_master_id: fee.masterId,
                        amount: amountForThisFee,
                        payment_date: paymentDetails.payment_date || format(new Date(), 'yyyy-MM-dd'),
                        payment_mode: paymentDetails.payment_mode,
                        fine_paid: fineForThisFee,
                        discount_amount: discountForThisFee,
                        note: paymentDetails.note,
                        transaction_id: newTransactionId,
                        created_by: user.id,
                        utr_number: isUpiPayment(paymentDetails.payment_mode) ? paymentDetails.utr_number.trim() : null,
                        balance_after_payment: balanceAfterThisPayment, // ✅ Quick access field
                        receipt_snapshot: receiptSnapshot, // ✅ FULL RECEIPT DATA for reprint accuracy
                    });
                    remainingAmountToDistribute -= amountForThisFee;
                    remainingDiscountToDistribute -= discountForThisFee;
                    remainingFineToDistribute -= fineForThisFee;
                }
            }

            if (paymentsToInsert.length === 0) {
                toast({ title: 'No payment needed', description: 'Selected fees seem to be paid or amount is zero.' });
                setPaymentLoading(false);
                return;
            }

            const { data: insertedPayments, error } = await supabase
                .from('fee_payments')
                .insert(paymentsToInsert)
                .select('id');

            if (error) throw error;
            
            toast({ title: '✅ Payment collected successfully!', description: `Transaction ID: ${newTransactionId}` });
            await fetchStudentAndFees();
            setSelectedFees([]);
            setPaymentDetails(prev => ({ ...prev, note: '', utr_number: '' }));

            // Navigate to the new receipt page (use first payment's ID)
            const firstPaymentId = insertedPayments?.[0]?.id;
            if (firstPaymentId) {
                navigate(`/${basePath}/fees-collection/print-fees-receipt/${firstPaymentId}`);
            }

        } catch (error) {
            console.error("Payment collection error:", error);
            toast({ variant: 'destructive', title: 'Payment failed', description: error.message });
        } finally {
            setPaymentLoading(false);
        }
    };
    
    const printReceipt = (payment) => {
        navigate(`/${basePath}/fees-collection/print-fees-receipt/${payment.id}`);
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
                // ✅ FIX: Calculate balance after this payment
                const balanceAfterPayment = Math.max(0, transportBalanceWithRefunds - totalAmount - discount);
                
                // ✅ BUILD COMPLETE RECEIPT SNAPSHOT for transport fee
                const receiptSnapshot = {
                    student: {
                        id: studentId,
                        name: student?.full_name || student?.name,
                        admission_no: student?.admission_no,
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
                    balance_after_payment: balanceAfterPayment, // ✅ Quick access
                    receipt_snapshot: receiptSnapshot, // ✅ FULL RECEIPT DATA
                }];
            } else {
                // Monthly: Create one payment record per selected month
                const monthlyFee = transportDetails.monthlyFee || 0;
                // ✅ FIX: Calculate running balance for each month payment
                let runningBalance = transportBalanceWithRefunds;
                paymentsToInsert = selectedTransportMonths.map((monthKey, index) => {
                    const monthLabel = sessionMonths.find(m => m.key === monthKey)?.label || monthKey;
                    const thisDiscount = index === 0 ? discount : 0;
                    const thisFine = index === 0 ? fine : 0;
                    // Calculate balance after this specific payment
                    runningBalance = Math.max(0, runningBalance - monthlyFee - thisDiscount);
                    
                    // ✅ BUILD RECEIPT SNAPSHOT for monthly payment
                    const receiptSnapshot = {
                        student: {
                            id: studentId,
                            name: student?.full_name || student?.name,
                            admission_no: student?.admission_no,
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
                        balance_after_payment: runningBalance, // ✅ Quick access
                        receipt_snapshot: receiptSnapshot, // ✅ FULL RECEIPT DATA
                    };
                });
            }

            const { data, error } = await supabase
                .from('transport_fee_payments')
                .insert(paymentsToInsert)
                .select();

            if (error) throw error;
            
            toast({ 
                title: '✅ Transport fee collected!', 
                description: isAnnualType 
                    ? `${currencySymbol}${totalAmount.toLocaleString('en-IN')} paid. Transaction ID: ${newTransactionId}`
                    : `${selectedTransportMonths.length} month(s) paid. Transaction ID: ${newTransactionId}` 
            });
            await fetchStudentAndFees();
            setTransportPaymentDetails({ amount: '', discount: '0', fine: '0', payment_date: format(new Date(), 'yyyy-MM-dd'), payment_mode: 'Cash', note: '', utr_number: '' });
            setSelectedTransportMonths([]);
            
            // Print receipt (use first payment's ID)
            if (data && data.length > 0) {
                navigate(`/${basePath}/fees-collection/print-transport-receipt/${data[0].id}`);
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
                // ✅ FIX: Calculate balance after this payment
                const balanceAfterPayment = Math.max(0, hostelBalanceWithRefunds - totalAmount - discount);
                
                // ✅ BUILD COMPLETE RECEIPT SNAPSHOT for hostel fee
                const receiptSnapshot = {
                    student: {
                        id: studentId,
                        name: student?.full_name || student?.name,
                        admission_no: student?.admission_no,
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
                    balance_after_payment: balanceAfterPayment, // ✅ Quick access
                    receipt_snapshot: receiptSnapshot, // ✅ FULL RECEIPT DATA
                }];
            } else {
                // Monthly: Create one payment record per selected month
                const monthlyFee = hostelDetails.monthlyFee || 0;
                // ✅ FIX: Calculate running balance for each month payment
                let runningBalance = hostelBalanceWithRefunds;
                paymentsToInsert = selectedHostelMonths.map((monthKey, index) => {
                    const monthLabel = sessionMonths.find(m => m.key === monthKey)?.label || monthKey;
                    const thisDiscount = index === 0 ? discount : 0;
                    const thisFine = index === 0 ? fine : 0;
                    // Calculate balance after this specific payment
                    runningBalance = Math.max(0, runningBalance - monthlyFee - thisDiscount);
                    
                    // ✅ BUILD RECEIPT SNAPSHOT for monthly hostel payment
                    const receiptSnapshot = {
                        student: {
                            id: studentId,
                            name: student?.full_name || student?.name,
                            admission_no: student?.admission_no,
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
                        balance_after_payment: runningBalance, // ✅ Quick access
                        receipt_snapshot: receiptSnapshot, // ✅ FULL RECEIPT DATA
                    };
                });
            }

            const { data, error } = await supabase
                .from('hostel_fee_payments')
                .insert(paymentsToInsert)
                .select();

            if (error) throw error;
            
            toast({ 
                title: '✅ Hostel fee collected!', 
                description: isAnnualType
                    ? `${currencySymbol}${totalAmount.toLocaleString('en-IN')} paid. Transaction ID: ${newTransactionId}`
                    : `${selectedHostelMonths.length} month(s) paid. Transaction ID: ${newTransactionId}` 
            });
            await fetchStudentAndFees();
            setHostelPaymentDetails({ amount: '', discount: '0', fine: '0', payment_date: format(new Date(), 'yyyy-MM-dd'), payment_mode: 'Cash', note: '', utr_number: '' });
            setSelectedHostelMonths([]);
            
            // Print receipt (use first payment's ID)
            if (data && data.length > 0) {
                navigate(`/${basePath}/fees-collection/print-hostel-receipt/${data[0].id}`);
            }
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
            const { error } = await supabase
                .from('fee_payments')
                .update({
                    reverted_at: new Date().toISOString(),
                    revert_reason: revokeReason,
                })
                .eq('id', paymentToRevoke.id);

            if (error) throw error;

            toast({ title: 'Payment revoked successfully' });
            setPaymentToRevoke(null);
            setRevokeReason('');
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
                title: '✅ Refund request submitted!', 
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

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Left Column - Student Info & Payment Form */}
                <div className="xl:col-span-1 space-y-4">
                    {/* Student Profile Card */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col items-center text-center mb-4">
                                <Avatar className="h-20 w-20 mb-3">
                                    <AvatarImage src={student.photo_url} alt={student.full_name} />
                                    <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                                        {getInitials(student.full_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <h2 className="text-lg font-bold">{student.full_name}</h2>
                                <Badge variant="secondary" className="mt-1">
                                    {student.classes?.name} ({student.sections?.name})
                                </Badge>
                                {student.sessions?.name && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Session: {student.sessions.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2 text-sm border-t pt-3">
                                <InfoRow icon={CreditCard} label="Admission No" value={student.school_code} />
                                <InfoRow icon={User} label="Father" value={student.father_name} />
                                <InfoRow icon={Users} label="Mother" value={student.mother_name} />
                                <InfoRow icon={Calendar} label="DOB" value={student.date_of_birth ? format(parseISO(student.date_of_birth), 'dd MMM yyyy') : null} />
                                <InfoRow icon={Phone} label="Phone" value={student.phone || student.father_phone} />
                                <InfoRow icon={Mail} label="Email" value={student.email || student.father_email} />
                            </div>

                            <Link to={`/${basePath}/student-information/profile/${studentId}`} target="_blank">
                                <Button variant="outline" className="w-full mt-3" size="sm">
                                    <ExternalLink className="mr-2 h-4 w-4" />View Full Profile
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Class Teacher Card */}
                    {classTeacher && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4" />Class Teacher
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>{getInitials(classTeacher.full_name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="text-sm">
                                        <p className="font-medium">{classTeacher.full_name}</p>
                                        {classTeacher.phone && <p className="text-xs text-muted-foreground">{classTeacher.phone}</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick Stats */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Total Dues</span>
                                <Badge variant="outline">{feeSummary.unpaidCount} items</Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Overdue Fees</span>
                                <Badge variant={feeSummary.overdueCount > 0 ? "destructive" : "outline"}>
                                    {feeSummary.overdueCount} items
                                </Badge>
                            </div>
                            {lastPayment && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Last Payment</span>
                                    <span className="font-medium">{format(parseISO(lastPayment.payment_date), 'dd MMM')}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Assigned Discounts */}
                    {studentDiscounts.length > 0 && (
                        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2 text-blue-700 dark:text-blue-300">
                                    <CheckCircle className="h-4 w-4" />Assigned Discounts
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-2">
                                {studentDiscounts.map(d => (
                                    <div key={d.id} className="flex justify-between items-center text-sm p-2 bg-white dark:bg-gray-800 rounded border">
                                        <div>
                                            <p className="font-medium">{d.name}</p>
                                            <p className="text-xs text-muted-foreground">{d.discount_code}</p>
                                        </div>
                                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                                            {d.discount_type === 'percentage' ? `${d.amount}%` : `${currencySymbol}${d.amount}`}
                                        </Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Payment Form */}
                    <Card className="border-primary/50">
                        <CardHeader className="pb-3 bg-primary/5">
                            <CardTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5" />Collect Fees
                            </CardTitle>
                            {selectedFees.length > 0 && (
                                <CardDescription>{selectedFees.length} fee(s) selected</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-3 pt-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Amount ({currencySymbol})</Label>
                                    <Input 
                                        type="number" 
                                        value={paymentDetails.amount} 
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            // ✅ Prevent entering more than selected balance
                                            if (val > selectedFeesMaxBalance) {
                                                setPaymentDetails(p => ({ ...p, amount: selectedFeesMaxBalance.toFixed(2) }));
                                            } else {
                                                setPaymentDetails(p => ({ ...p, amount: e.target.value }));
                                            }
                                        }}
                                        max={selectedFeesMaxBalance}
                                        className="h-9"
                                    />
                                    {selectedFeesMaxBalance > 0 && (
                                        <p className="text-[10px] text-muted-foreground">Max: {currencySymbol}{selectedFeesMaxBalance.toLocaleString('en-IN')}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">
                                        Discount ({currencySymbol})
                                        {remainingDiscount > 0 && (
                                            <span className="text-green-600 ml-1">(Auto-applied)</span>
                                        )}
                                    </Label>
                                    <Input 
                                        type="number" 
                                        value={paymentDetails.discount} 
                                        onChange={(e) => setPaymentDetails(p => ({ ...p, discount: e.target.value }))}
                                        className="h-9"
                                    />
                                </div>
                            </div>

                            {/* Discount Info - Show only if discount assigned */}
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
                                    {remainingDiscount === 0 && totalDiscountAlreadyUsed > 0 && (
                                        <p className="text-amber-600 text-[10px] mt-1">✓ Discount fully utilized in previous payments</p>
                                    )}
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Fine ({currencySymbol})</Label>
                                    <Input 
                                        type="number" 
                                        value={paymentDetails.fine} 
                                        onChange={(e) => setPaymentDetails(p => ({ ...p, fine: e.target.value }))}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Date</Label>
                                    <DatePicker 
                                        value={paymentDetails.payment_date} 
                                        onChange={(date) => setPaymentDetails(p => ({...p, payment_date: date}))}
                                    />
                                </div>
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

                            {/* UPI QR Button - Show when Online/UPI selected and UPI is enabled */}
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

                            {/* UTR Number - Mandatory for Online/UPI payments */}
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
                                    <p className="text-[10px] text-muted-foreground">UTR from bank statement (used for reconciliation)</p>
                                </div>
                            )}

                            <div className="space-y-1">
                                <Label className="text-xs">Note (Optional)</Label>
                                <Textarea 
                                    value={paymentDetails.note} 
                                    onChange={(e) => setPaymentDetails(p => ({...p, note: e.target.value }))}
                                    rows={2}
                                    placeholder={paymentDetails.payment_mode !== 'Cash' ? 'Enter reference/cheque number and remarks...' : 'Payment remarks...'}
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
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Fees & Payment History */}
                <div className="xl:col-span-3 space-y-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
                        <SummaryCard title="Total Fees" amount={feeSummary.totalFees} icon={FileText} variant="primary" currencySymbol={currencySymbol} />
                        <SummaryCard title="Paid Amount" amount={feeSummary.totalPaid} icon={CheckCircle} variant="success" currencySymbol={currencySymbol} />
                        <SummaryCard title="Discount Given" amount={feeSummary.totalDiscount} icon={Receipt} variant="default" currencySymbol={currencySymbol} />
                        {feeSummary.totalRefunded > 0 && (
                            <SummaryCard title="Total Refunded" amount={feeSummary.totalRefunded} icon={Undo2} variant="warning" currencySymbol={currencySymbol} />
                        )}
                        <SummaryCard title="Balance Due" amount={feeSummary.balance} icon={feeSummary.balance > 0 ? AlertTriangle : Clock} variant={feeSummary.balance > 0 ? 'danger' : 'success'} currencySymbol={currencySymbol} />
                    </div>

                    {/* Tabs for Fees & History */}
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
                                            <Badge variant="secondary" className="ml-1">{payments.length + (transportDetails?.payments?.length || 0) + (hostelDetails?.payments?.length || 0)}</Badge>
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
                                                    <th className="p-3 text-right font-medium">Discount</th>
                                                    <th className="p-3 text-right font-medium text-emerald-600">Net Fee</th>
                                                    <th className="p-3 text-right font-medium">Fine</th>
                                                    <th className="p-3 text-right font-medium">Paid</th>
                                                    <th className="p-3 text-right font-medium">Balance</th>
                                                    <th className="p-3 text-center font-medium">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {fees.length > 0 ? fees.map(fee => (
                                                    <tr 
                                                        key={fee.id} 
                                                        className={`border-b hover:bg-muted/30 transition-colors ${selectedFees.includes(fee.id) ? 'bg-primary/5' : ''} ${fee.isOverdue ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                                                    >
                                                        <td className="p-3 text-center">
                                                            {fee.balance > 0 && (
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={selectedFees.includes(fee.id)} 
                                                                    onChange={() => handleFeeSelection(fee.id)} 
                                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                                />
                                                            )}
                                                        </td>
                                                        <td className="p-3 font-medium">{fee.group}</td>
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
                                                                    {fee.isOverdue && <p className="text-xs">⚠️ Overdue</p>}
                                                                </div>
                                                            ) : 'N/A'}
                                                        </td>
                                                        <td className="p-3 text-right font-mono">{currencySymbol}{fee.amount.toLocaleString('en-IN')}</td>
                                                        <td className="p-3 text-right font-mono text-blue-600">{currencySymbol}{fee.totalDiscount.toLocaleString('en-IN')}</td>
                                                        <td className="p-3 text-right font-mono font-semibold text-emerald-600">{currencySymbol}{(fee.amount - fee.totalDiscount).toLocaleString('en-IN')}</td>
                                                        <td className="p-3 text-right font-mono text-amber-600">{currencySymbol}{fee.totalFine.toLocaleString('en-IN')}</td>
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
                                            {fees.length > 0 && (
                                                <tfoot>
                                                    <tr className="bg-muted font-bold border-t-2 border-border">
                                                        <td colSpan="4" className="p-3 text-right font-semibold">Grand Total</td>
                                                        <td className="p-3 text-right"><span className="font-mono text-lg font-bold bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">{currencySymbol}{feesStatementTotals.amount.toLocaleString('en-IN')}</span></td>
                                                        <td className="p-3 text-right"><span className="font-mono text-lg font-bold text-blue-700 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400 px-2 py-1 rounded">{currencySymbol}{feesStatementTotals.discount.toLocaleString('en-IN')}</span></td>
                                                        <td className="p-3 text-right"><span className="font-mono text-lg font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400 px-2 py-1 rounded">{currencySymbol}{(feesStatementTotals.amount - feesStatementTotals.discount).toLocaleString('en-IN')}</span></td>
                                                        <td className="p-3 text-right"><span className="font-mono text-lg font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-400 px-2 py-1 rounded">{currencySymbol}{feesStatementTotals.fine.toLocaleString('en-IN')}</span></td>
                                                        <td className="p-3 text-right"><span className="font-mono text-lg font-bold text-green-700 bg-green-100 dark:bg-green-900/50 dark:text-green-400 px-2 py-1 rounded">{currencySymbol}{feesStatementTotals.paid.toLocaleString('en-IN')}</span></td>
                                                        <td className="p-3 text-right"><span className="font-mono text-lg font-bold text-red-700 bg-red-100 dark:bg-red-900/50 dark:text-red-400 px-2 py-1 rounded">{currencySymbol}{feesStatementTotals.balance.toLocaleString('en-IN')}</span></td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>

                                    {/* Transport Fee Section */}
                                    {transportDetails && (
                                        <div className="mt-6 border-t pt-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Bus className="h-5 w-5 text-blue-600" />
                                                <h3 className="font-semibold">Transport Fee</h3>
                                            </div>
                                            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Route</p>
                                                        <p className="font-medium">{transportDetails.route?.route_title || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Pickup Point</p>
                                                        <p className="font-medium">{transportDetails.pickup_point?.name || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Vehicle</p>
                                                        <p className="font-medium">{transportDetails.vehicle_number || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Driver</p>
                                                        <p className="font-medium">{transportDetails.driver_name || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                
                                                {/* Fee Summary */}
                                                <div className="flex items-center justify-between p-3 bg-background rounded-md mb-4">
                                                    <div className="flex flex-wrap gap-4 lg:gap-6">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Fee ({getBillingCycleLabel(transportDetails.billingCycle)})</p>
                                                            <p className="font-bold text-lg">{currencySymbol}{(transportDetails.periodFee || 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                        {!transportDetails.isAnnualType && (
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Monthly Equivalent</p>
                                                            <p className="font-bold text-lg">{currencySymbol}{(transportDetails.monthlyFee || 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                        )}
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Total Fee {!transportDetails.isAnnualType ? `(${transportDetails.totalMonths || 12} months)` : `(${getBillingCycleLabel(transportDetails.billingCycle)})`}</p>
                                                            <p className="font-bold text-lg">{currencySymbol}{(transportDetails.totalFee || 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Paid {!transportDetails.isAnnualType ? `(${transportDetails.paidMonthsCount || 0} months)` : ''}</p>
                                                            <p className="font-bold text-lg text-green-600">{currencySymbol}{(transportDetails.totalPaid || 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Balance {!transportDetails.isAnnualType ? `(${transportDetails.unpaidMonthsCount || 0} months)` : 'Due'}</p>
                                                            <p className={`font-bold text-lg ${transportBalanceWithRefunds > 0 ? 'text-red-600' : 'text-green-600'}`}>{currencySymbol}{transportBalanceWithRefunds.toLocaleString('en-IN')}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant={transportDetails.status === 'Paid' ? 'success' : transportDetails.status === 'Partial' ? 'warning' : 'destructive'}>
                                                        {transportDetails.status}
                                                    </Badge>
                                                </div>
                                                
                                                {/* Transport Fee Collection Form */}
                                                {transportBalanceWithRefunds > 0 && (
                                                    <div className="border-t pt-4 mt-4">
                                                        
                                                        {/* ANNUAL/ONE-TIME: Simple amount input (any amount up to balance) */}
                                                        {transportDetails.isAnnualType ? (
                                                            <>
                                                                <p className="text-sm font-medium mb-3">
                                                                    Enter Amount to Pay 
                                                                    <span className="text-xs text-muted-foreground ml-2">
                                                                        (Balance: {currencySymbol}{transportBalanceWithRefunds.toLocaleString('en-IN')} — pay any amount)
                                                                    </span>
                                                                </p>
                                                                <div className="grid sm:grid-cols-3 gap-3">
                                                                    <div>
                                                                        <Label className="text-xs">Amount ({currencySymbol})</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={transportPaymentDetails.amount}
                                                                            onChange={e => setTransportPaymentDetails(p => ({...p, amount: e.target.value}))}
                                                                            placeholder={`Max ${transportBalanceWithRefunds.toLocaleString('en-IN')}`}
                                                                            max={transportBalanceWithRefunds}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-xs">Discount ({currencySymbol})</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={transportPaymentDetails.discount}
                                                                            onChange={e => setTransportPaymentDetails(p => ({...p, discount: e.target.value}))}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-xs">Payment Mode</Label>
                                                                        <Select value={transportPaymentDetails.payment_mode} onValueChange={v => setTransportPaymentDetails(p => ({...p, payment_mode: v}))}>
                                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="Cash">Cash</SelectItem>
                                                                                <SelectItem value="Cheque">Cheque</SelectItem>
                                                                                <SelectItem value="Online">Online</SelectItem>
                                                                                <SelectItem value="UPI">UPI</SelectItem>
                                                                                <SelectItem value="Card">Card</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </div>
                                                                {/* UPI QR Button for Transport */}
                                                                {(transportPaymentDetails.payment_mode === 'Online' || transportPaymentDetails.payment_mode === 'UPI') && upiSettings.enabled && (
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        className="w-full mt-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                                                                        onClick={() => {
                                                                            const total = parseFloat(transportPaymentDetails.amount || 0) - parseFloat(transportPaymentDetails.discount || 0) + parseFloat(transportPaymentDetails.fine || 0);
                                                                            generateUpiQr(total, 'transport');
                                                                        }}
                                                                    >
                                                                        <QrCode className="h-4 w-4 mr-2" />
                                                                        Show UPI QR Code
                                                                    </Button>
                                                                )}
                                                                {/* UTR Number for Transport */}
                                                                {isUpiPayment(transportPaymentDetails.payment_mode) && (
                                                                    <div className="mt-2">
                                                                        <Label className="text-xs">UPI UTR Number <span className="text-red-500">*</span></Label>
                                                                        <Input 
                                                                            value={transportPaymentDetails.utr_number} 
                                                                            onChange={(e) => setTransportPaymentDetails(p => ({...p, utr_number: e.target.value.toUpperCase() }))}
                                                                            placeholder="Enter UTR number"
                                                                            className="h-9 font-mono mt-1"
                                                                            maxLength={22}
                                                                        />
                                                                    </div>
                                                                )}
                                                                <div className="mt-3">
                                                                    <Button 
                                                                        onClick={collectTransportFee} 
                                                                        disabled={paymentLoading || !(parseFloat(transportPaymentDetails.amount) > 0)}
                                                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                                                    >
                                                                        {paymentLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Receipt className="mr-2 h-4 w-4" />}
                                                                        Collect & Print Receipt
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            /* MONTHLY: Month selection grid */
                                                            <>
                                                        <p className="text-sm font-medium mb-3">Select Months to Pay</p>
                                                        
                                                        {/* Month Selection Grid */}
                                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-4">
                                                            {sessionMonths.map(month => {
                                                                const isPaid = transportDetails.paidMonths?.includes(month.key);
                                                                const isSelected = selectedTransportMonths.includes(month.key);
                                                                return (
                                                                    <div 
                                                                        key={month.key}
                                                                        onClick={() => {
                                                                            if (isPaid) return;
                                                                            setSelectedTransportMonths(prev => 
                                                                                prev.includes(month.key) 
                                                                                    ? prev.filter(k => k !== month.key)
                                                                                    : [...prev, month.key]
                                                                            );
                                                                        }}
                                                                        className={`p-2 text-center rounded-md border cursor-pointer text-sm transition-all ${
                                                                            isPaid 
                                                                                ? 'bg-green-100 dark:bg-green-900/30 border-green-300 text-green-700 dark:text-green-400 cursor-not-allowed' 
                                                                                : isSelected 
                                                                                    ? 'bg-blue-500 text-white border-blue-600' 
                                                                                    : 'bg-background hover:bg-muted border-input'
                                                                        }`}
                                                                    >
                                                                        <span className="font-medium">{month.shortLabel}</span>
                                                                        {isPaid && <CheckCircle className="h-3 w-3 mx-auto mt-1" />}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        
                                                        {/* Quick Select Buttons */}
                                                        <div className="flex flex-wrap gap-2 mb-4">
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => setSelectedTransportMonths(transportDetails.unpaidMonths?.map(m => m.key) || [])}
                                                            >
                                                                Select All Unpaid
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => {
                                                                    const unpaid = transportDetails.unpaidMonths?.slice(0, 6).map(m => m.key) || [];
                                                                    setSelectedTransportMonths(unpaid);
                                                                }}
                                                            >
                                                                Select 6 Months
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => {
                                                                    const firstUnpaid = transportDetails.unpaidMonths?.[0]?.key;
                                                                    setSelectedTransportMonths(firstUnpaid ? [firstUnpaid] : []);
                                                                }}
                                                            >
                                                                Select 1 Month
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                onClick={() => setSelectedTransportMonths([])}
                                                            >
                                                                Clear
                                                            </Button>
                                                        </div>
                                                        
                                                        {/* Payment Summary */}
                                                        {selectedTransportMonths.length > 0 && (
                                                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-md mb-4">
                                                                <p className="text-sm">
                                                                    <span className="font-medium">{selectedTransportMonths.length} month(s) selected</span>
                                                                    <span className="mx-2">•</span>
                                                                    Amount: <span className="font-bold">{currencySymbol}{(selectedTransportMonths.length * transportDetails.monthlyFee).toLocaleString('en-IN')}</span>
                                                                </p>
                                                            </div>
                                                        )}
                                                        
                                                        <div className="grid sm:grid-cols-3 gap-3">
                                                            <div>
                                                                <Label className="text-xs">Amount ({currencySymbol})</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={selectedTransportMonths.length > 0 ? selectedTransportMonths.length * transportDetails.monthlyFee : transportPaymentDetails.amount}
                                                                    onChange={e => setTransportPaymentDetails(p => ({...p, amount: e.target.value}))}
                                                                    placeholder={transportDetails.monthlyFee}
                                                                    readOnly={selectedTransportMonths.length > 0}
                                                                    className={selectedTransportMonths.length > 0 ? 'bg-muted' : ''}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs">Discount ({currencySymbol})</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={transportPaymentDetails.discount}
                                                                    onChange={e => setTransportPaymentDetails(p => ({...p, discount: e.target.value}))}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs">Payment Mode</Label>
                                                                <Select value={transportPaymentDetails.payment_mode} onValueChange={v => setTransportPaymentDetails(p => ({...p, payment_mode: v}))}>
                                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Cash">Cash</SelectItem>
                                                                        <SelectItem value="Cheque">Cheque</SelectItem>
                                                                        <SelectItem value="Online">Online</SelectItem>
                                                                        <SelectItem value="UPI">UPI</SelectItem>
                                                                        <SelectItem value="Card">Card</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        {/* UPI QR Button for Monthly Transport */}
                                                        {(transportPaymentDetails.payment_mode === 'Online' || transportPaymentDetails.payment_mode === 'UPI') && upiSettings.enabled && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="w-full mt-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                                                                onClick={() => {
                                                                    const total = parseFloat(transportPaymentDetails.amount || 0) - parseFloat(transportPaymentDetails.discount || 0) + parseFloat(transportPaymentDetails.fine || 0);
                                                                    generateUpiQr(total, 'transport');
                                                                }}
                                                            >
                                                                <QrCode className="h-4 w-4 mr-2" />
                                                                Show UPI QR Code
                                                            </Button>
                                                        )}
                                                        {/* UTR Number for Monthly Transport */}
                                                        {isUpiPayment(transportPaymentDetails.payment_mode) && (
                                                            <div className="mt-2">
                                                                <Label className="text-xs">UPI UTR Number <span className="text-red-500">*</span></Label>
                                                                <Input 
                                                                    value={transportPaymentDetails.utr_number} 
                                                                    onChange={(e) => setTransportPaymentDetails(p => ({...p, utr_number: e.target.value.toUpperCase() }))}
                                                                    placeholder="Enter UTR number"
                                                                    className="h-9 font-mono mt-1"
                                                                    maxLength={22}
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="mt-3">
                                                            <Button 
                                                                onClick={collectTransportFee} 
                                                                disabled={paymentLoading || selectedTransportMonths.length === 0}
                                                                className="w-full bg-blue-600 hover:bg-blue-700"
                                                            >
                                                                {paymentLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Receipt className="mr-2 h-4 w-4" />}
                                                                Collect {selectedTransportMonths.length} Month(s) & Print Receipt
                                                            </Button>
                                                        </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Hostel Fee Section */}
                                    {hostelDetails && (
                                        <div className="mt-6 border-t pt-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Building2 className="h-5 w-5 text-purple-600" />
                                                <h3 className="font-semibold">Hostel Fee</h3>
                                            </div>
                                            <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4">
                                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Room</p>
                                                        <p className="font-medium">{hostelDetails.room?.room_number_name || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Room Type</p>
                                                        <p className="font-medium">{hostelDetails.room_type?.name || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Bed Number</p>
                                                        <p className="font-medium">{hostelDetails.bed_number || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Check-in Date</p>
                                                        <p className="font-medium">{hostelDetails.check_in_date ? format(parseISO(hostelDetails.check_in_date), 'dd MMM yyyy') : 'N/A'}</p>
                                                    </div>
                                                </div>
                                                
                                                {/* Fee Summary */}
                                                <div className="flex items-center justify-between p-3 bg-background rounded-md mb-4">
                                                    <div className="flex flex-wrap gap-4 lg:gap-6">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Fee ({getBillingCycleLabel(hostelDetails.billingCycle)})</p>
                                                            <p className="font-bold text-lg">{currencySymbol}{(hostelDetails.periodFee || 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                        {!hostelDetails.isAnnualType && (
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Monthly Equivalent</p>
                                                            <p className="font-bold text-lg">{currencySymbol}{(hostelDetails.monthlyFee || 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                        )}
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Total Fee {!hostelDetails.isAnnualType ? `(${hostelDetails.totalMonths || 12} months)` : `(${getBillingCycleLabel(hostelDetails.billingCycle)})`}</p>
                                                            <p className="font-bold text-lg">{currencySymbol}{(hostelDetails.totalFee || 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Paid {!hostelDetails.isAnnualType ? `(${hostelDetails.paidMonthsCount || 0} months)` : ''}</p>
                                                            <p className="font-bold text-lg text-green-600">{currencySymbol}{(hostelDetails.totalPaid || 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Balance {!hostelDetails.isAnnualType ? `(${hostelDetails.unpaidMonthsCount || 0} months)` : 'Due'}</p>
                                                            <p className={`font-bold text-lg ${hostelBalanceWithRefunds > 0 ? 'text-red-600' : 'text-green-600'}`}>{currencySymbol}{hostelBalanceWithRefunds.toLocaleString('en-IN')}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant={hostelDetails.status === 'Paid' ? 'success' : hostelDetails.status === 'Partial' ? 'warning' : 'destructive'}>
                                                        {hostelDetails.status}
                                                    </Badge>
                                                </div>
                                                
                                                {/* Hostel Fee Collection Form */}
                                                {hostelBalanceWithRefunds > 0 && (
                                                    <div className="border-t pt-4 mt-4">
                                                        
                                                        {/* ANNUAL/ONE-TIME: Simple amount input */}
                                                        {hostelDetails.isAnnualType ? (
                                                            <>
                                                                <p className="text-sm font-medium mb-3">
                                                                    Enter Amount to Pay 
                                                                    <span className="text-xs text-muted-foreground ml-2">
                                                                        (Balance: {currencySymbol}{hostelBalanceWithRefunds.toLocaleString('en-IN')} — pay any amount)
                                                                    </span>
                                                                </p>
                                                                <div className="grid sm:grid-cols-3 gap-3">
                                                                    <div>
                                                                        <Label className="text-xs">Amount ({currencySymbol})</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={hostelPaymentDetails.amount}
                                                                            onChange={e => setHostelPaymentDetails(p => ({...p, amount: e.target.value}))}
                                                                            placeholder={`Max ${hostelBalanceWithRefunds.toLocaleString('en-IN')}`}
                                                                            max={hostelBalanceWithRefunds}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-xs">Discount ({currencySymbol})</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={hostelPaymentDetails.discount}
                                                                            onChange={e => setHostelPaymentDetails(p => ({...p, discount: e.target.value}))}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-xs">Payment Mode</Label>
                                                                        <Select value={hostelPaymentDetails.payment_mode} onValueChange={v => setHostelPaymentDetails(p => ({...p, payment_mode: v}))}>
                                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="Cash">Cash</SelectItem>
                                                                                <SelectItem value="Cheque">Cheque</SelectItem>
                                                                                <SelectItem value="Online">Online</SelectItem>
                                                                                <SelectItem value="UPI">UPI</SelectItem>
                                                                                <SelectItem value="Card">Card</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </div>
                                                                {/* UPI QR Button for Hostel */}
                                                                {(hostelPaymentDetails.payment_mode === 'Online' || hostelPaymentDetails.payment_mode === 'UPI') && upiSettings.enabled && (
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        className="w-full mt-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                                                                        onClick={() => {
                                                                            const total = parseFloat(hostelPaymentDetails.amount || 0) - parseFloat(hostelPaymentDetails.discount || 0) + parseFloat(hostelPaymentDetails.fine || 0);
                                                                            generateUpiQr(total, 'hostel');
                                                                        }}
                                                                    >
                                                                        <QrCode className="h-4 w-4 mr-2" />
                                                                        Show UPI QR Code
                                                                    </Button>
                                                                )}
                                                                {/* UTR Number for Hostel */}
                                                                {isUpiPayment(hostelPaymentDetails.payment_mode) && (
                                                                    <div className="mt-2">
                                                                        <Label className="text-xs">UPI UTR Number <span className="text-red-500">*</span></Label>
                                                                        <Input 
                                                                            value={hostelPaymentDetails.utr_number} 
                                                                            onChange={(e) => setHostelPaymentDetails(p => ({...p, utr_number: e.target.value.toUpperCase() }))}
                                                                            placeholder="Enter UTR number"
                                                                            className="h-9 font-mono mt-1"
                                                                            maxLength={22}
                                                                        />
                                                                    </div>
                                                                )}
                                                                <div className="mt-3">
                                                                    <Button 
                                                                        onClick={collectHostelFee} 
                                                                        disabled={paymentLoading || !(parseFloat(hostelPaymentDetails.amount) > 0)}
                                                                        className="w-full bg-purple-600 hover:bg-purple-700"
                                                                    >
                                                                        {paymentLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Receipt className="mr-2 h-4 w-4" />}
                                                                        Collect & Print Receipt
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            /* MONTHLY: Month selection grid */
                                                            <>
                                                        <p className="text-sm font-medium mb-3">Select Months to Pay</p>
                                                        
                                                        {/* Month Selection Grid */}
                                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-4">
                                                            {sessionMonths.map(month => {
                                                                const isPaid = hostelDetails.paidMonths?.includes(month.key);
                                                                const isSelected = selectedHostelMonths.includes(month.key);
                                                                return (
                                                                    <div 
                                                                        key={month.key}
                                                                        onClick={() => {
                                                                            if (isPaid) return;
                                                                            setSelectedHostelMonths(prev => 
                                                                                prev.includes(month.key) 
                                                                                    ? prev.filter(k => k !== month.key)
                                                                                    : [...prev, month.key]
                                                                            );
                                                                        }}
                                                                        className={`p-2 text-center rounded-md border cursor-pointer text-sm transition-all ${
                                                                            isPaid 
                                                                                ? 'bg-green-100 dark:bg-green-900/30 border-green-300 text-green-700 dark:text-green-400 cursor-not-allowed' 
                                                                                : isSelected 
                                                                                    ? 'bg-purple-500 text-white border-purple-600' 
                                                                                    : 'bg-background hover:bg-muted border-input'
                                                                        }`}
                                                                    >
                                                                        <span className="font-medium">{month.shortLabel}</span>
                                                                        {isPaid && <CheckCircle className="h-3 w-3 mx-auto mt-1" />}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        
                                                        {/* Quick Select Buttons */}
                                                        <div className="flex flex-wrap gap-2 mb-4">
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => setSelectedHostelMonths(hostelDetails.unpaidMonths?.map(m => m.key) || [])}
                                                            >
                                                                Select All Unpaid
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => {
                                                                    const unpaid = hostelDetails.unpaidMonths?.slice(0, 6).map(m => m.key) || [];
                                                                    setSelectedHostelMonths(unpaid);
                                                                }}
                                                            >
                                                                Select 6 Months
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => {
                                                                    const firstUnpaid = hostelDetails.unpaidMonths?.[0]?.key;
                                                                    setSelectedHostelMonths(firstUnpaid ? [firstUnpaid] : []);
                                                                }}
                                                            >
                                                                Select 1 Month
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                onClick={() => setSelectedHostelMonths([])}
                                                            >
                                                                Clear
                                                            </Button>
                                                        </div>
                                                        
                                                        {/* Payment Summary */}
                                                        {selectedHostelMonths.length > 0 && (
                                                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-md mb-4">
                                                                <p className="text-sm">
                                                                    <span className="font-medium">{selectedHostelMonths.length} month(s) selected</span>
                                                                    <span className="mx-2">•</span>
                                                                    Amount: <span className="font-bold">{currencySymbol}{(selectedHostelMonths.length * hostelDetails.monthlyFee).toLocaleString('en-IN')}</span>
                                                                </p>
                                                            </div>
                                                        )}
                                                        
                                                        <div className="grid sm:grid-cols-3 gap-3">
                                                            <div>
                                                                <Label className="text-xs">Amount ({currencySymbol})</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={selectedHostelMonths.length > 0 ? selectedHostelMonths.length * hostelDetails.monthlyFee : hostelPaymentDetails.amount}
                                                                    onChange={e => setHostelPaymentDetails(p => ({...p, amount: e.target.value}))}
                                                                    placeholder={hostelDetails.monthlyFee}
                                                                    readOnly={selectedHostelMonths.length > 0}
                                                                    className={selectedHostelMonths.length > 0 ? 'bg-muted' : ''}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs">Discount ({currencySymbol})</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={hostelPaymentDetails.discount}
                                                                    onChange={e => setHostelPaymentDetails(p => ({...p, discount: e.target.value}))}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs">Payment Mode</Label>
                                                                <Select value={hostelPaymentDetails.payment_mode} onValueChange={v => setHostelPaymentDetails(p => ({...p, payment_mode: v}))}>
                                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Cash">Cash</SelectItem>
                                                                        <SelectItem value="Cheque">Cheque</SelectItem>
                                                                        <SelectItem value="Online">Online</SelectItem>
                                                                        <SelectItem value="UPI">UPI</SelectItem>
                                                                        <SelectItem value="Card">Card</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        {/* UPI QR Button for Monthly Hostel */}
                                                        {(hostelPaymentDetails.payment_mode === 'Online' || hostelPaymentDetails.payment_mode === 'UPI') && upiSettings.enabled && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="w-full mt-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                                                                onClick={() => {
                                                                    const total = parseFloat(hostelPaymentDetails.amount || 0) - parseFloat(hostelPaymentDetails.discount || 0) + parseFloat(hostelPaymentDetails.fine || 0);
                                                                    generateUpiQr(total, 'hostel');
                                                                }}
                                                            >
                                                                <QrCode className="h-4 w-4 mr-2" />
                                                                Show UPI QR Code
                                                            </Button>
                                                        )}
                                                        {/* UTR Number for Monthly Hostel */}
                                                        {isUpiPayment(hostelPaymentDetails.payment_mode) && (
                                                            <div className="mt-2">
                                                                <Label className="text-xs">UPI UTR Number <span className="text-red-500">*</span></Label>
                                                                <Input 
                                                                    value={hostelPaymentDetails.utr_number} 
                                                                    onChange={(e) => setHostelPaymentDetails(p => ({...p, utr_number: e.target.value.toUpperCase() }))}
                                                                    placeholder="Enter UTR number"
                                                                    className="h-9 font-mono mt-1"
                                                                    maxLength={22}
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="mt-3">
                                                            <Button 
                                                                onClick={collectHostelFee} 
                                                                disabled={paymentLoading || selectedHostelMonths.length === 0}
                                                                className="w-full bg-purple-600 hover:bg-purple-700"
                                                            >
                                                                {paymentLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Receipt className="mr-2 h-4 w-4" />}
                                                                Collect {selectedHostelMonths.length} Month(s) & Print Receipt
                                                            </Button>
                                                        </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="history" className="m-0">
                                    {/* Payment Summary Cards */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-muted/30 rounded-lg">
                                        <div className="text-center p-2 bg-background rounded border">
                                            <p className="text-xs text-muted-foreground uppercase">Total Paid</p>
                                            <p className="text-lg font-bold text-green-600">{currencySymbol}{(
                                                payments.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.amount || 0), 0) +
                                                (transportDetails?.payments?.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0) +
                                                (hostelDetails?.payments?.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0)
                                            ).toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="text-center p-2 bg-background rounded border">
                                            <p className="text-xs text-muted-foreground uppercase">Total Discount</p>
                                            <p className="text-lg font-bold text-blue-600">{currencySymbol}{(
                                                payments.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.discount_amount || 0), 0) +
                                                (transportDetails?.payments?.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.discount_amount || 0), 0) || 0) +
                                                (hostelDetails?.payments?.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.discount_amount || 0), 0) || 0)
                                            ).toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="text-center p-2 bg-background rounded border">
                                            <p className="text-xs text-muted-foreground uppercase">Fine Collected</p>
                                            <p className="text-lg font-bold text-amber-600">{currencySymbol}{(
                                                payments.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.fine_paid || 0), 0) +
                                                (transportDetails?.payments?.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.fine_paid || 0), 0) || 0) +
                                                (hostelDetails?.payments?.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.fine_paid || 0), 0) || 0)
                                            ).toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="text-center p-2 bg-background rounded border">
                                            <p className="text-xs text-muted-foreground uppercase">Transactions</p>
                                            <p className="text-lg font-bold text-purple-600">{
                                                payments.filter(p => !p.reverted_at).length +
                                                (transportDetails?.payments?.filter(p => !p.reverted_at).length || 0) +
                                                (hostelDetails?.payments?.filter(p => !p.reverted_at).length || 0)
                                            }</p>
                                        </div>
                                    </div>
                                    
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted/50">
                                                    <th className="p-3 text-left font-medium">Date / Time</th>
                                                    <th className="p-3 text-left font-medium">Fee Type</th>
                                                    <th className="p-3 text-left font-medium">Fee Details</th>
                                                    <th className="p-3 text-left font-medium">Transaction ID</th>
                                                    <th className="p-3 text-left font-medium">Mode</th>
                                                    <th className="p-3 text-right font-medium">Amount</th>
                                                    <th className="p-3 text-right font-medium">Discount</th>
                                                    <th className="p-3 text-right font-medium">Fine</th>
                                                    <th className="p-3 text-right font-medium">Net Paid</th>
                                                    <th className="p-3 text-center font-medium">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* Academic Fee Payments - Show Fee Name */}
                                                {payments.map(p => {
                                                    const feeInfo = fees.find(f => f.masterId === p.fee_master_id);
                                                    const netPaid = Number(p.amount || 0) + Number(p.fine_paid || 0) - Number(p.discount_amount || 0);
                                                    return (
                                                    <tr key={`fee-${p.id}`} className={`border-b ${p.reverted_at ? 'bg-red-50 dark:bg-red-950/20 opacity-60 line-through' : 'hover:bg-muted/30'}`}>
                                                        <td className="p-3">
                                                            <div className="font-medium">{format(parseISO(p.payment_date), 'dd MMM yyyy')}</div>
                                                            <div className="text-xs text-muted-foreground">{format(parseISO(p.created_at), 'hh:mm a')}</div>
                                                        </td>
                                                        <td className="p-3">
                                                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                                                <FileText className="h-3 w-3 mr-1" />Academic
                                                            </Badge>
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="font-medium text-sm">{feeInfo?.typeName || feeInfo?.feeTypeName || 'Fee'}</div>
                                                            <div className="text-xs text-muted-foreground">{feeInfo?.groupName || feeInfo?.feeGroupName || ''}</div>
                                                            {p.utr_number && (
                                                                <code className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-mono mt-1 inline-block">UTR: {p.utr_number}</code>
                                                            )}
                                                        </td>
                                                        <td className="p-3">
                                                            <code className="text-xs bg-muted px-2 py-0.5 rounded">{p.transaction_id || '-'}</code>
                                                        </td>
                                                        <td className="p-3">
                                                            <Badge variant="outline">{p.payment_mode}</Badge>
                                                        </td>
                                                        <td className="p-3 text-right font-mono font-semibold">{currencySymbol}{Number(p.amount || 0).toLocaleString('en-IN')}</td>
                                                        <td className="p-3 text-right font-mono text-blue-600">{Number(p.discount_amount) > 0 ? `-${currencySymbol}${Number(p.discount_amount).toLocaleString('en-IN')}` : '-'}</td>
                                                        <td className="p-3 text-right font-mono text-amber-600">{Number(p.fine_paid) > 0 ? `+${currencySymbol}${Number(p.fine_paid).toLocaleString('en-IN')}` : '-'}</td>
                                                        <td className="p-3 text-right font-mono font-bold text-green-700">{currencySymbol}{netPaid.toLocaleString('en-IN')}</td>
                                                        <td className="p-3 text-center">
                                                            {!p.reverted_at ? (
                                                                <div className="flex justify-center gap-1">
                                                                    <Button variant="outline" size="sm" onClick={() => printReceipt(p)} title="Print Receipt">
                                                                        <Printer className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button variant="destructive" size="sm" onClick={() => setPaymentToRevoke(p)} title="Revoke Payment">
                                                                        <RotateCcw className="h-3 w-3" />
                                                                    </Button>
                                                                    {!hasExistingRefund(p.id, 'academic') && (
                                                                        <Button variant="outline" size="sm" className="text-orange-600 border-orange-300 hover:bg-orange-50" onClick={() => openRefundDialog(p, 'academic')} title="Request Refund">
                                                                            <Undo2 className="h-3 w-3" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs text-red-600">
                                                                    <div className="font-medium">REVERTED</div>
                                                                    <div>{format(parseISO(p.reverted_at), 'dd/MM/yy')}</div>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    );
                                                })}

                                                {/* Transport Fee Payments - Grouped by transaction_id */}
                                                {(() => {
                                                    const groups = {};
                                                    (transportDetails?.payments || []).forEach(p => {
                                                        const txId = p.transaction_id || p.id;
                                                        if (!groups[txId]) {
                                                            groups[txId] = { firstPayment: p, totalAmount: 0, totalDiscount: 0, totalFine: 0, months: [], allReverted: true };
                                                        }
                                                        groups[txId].totalAmount += Number(p.amount || 0);
                                                        groups[txId].totalDiscount += Number(p.discount_amount || 0);
                                                        groups[txId].totalFine += Number(p.fine_paid || 0);
                                                        if (p.payment_month) groups[txId].months.push(p.payment_month);
                                                        if (!p.reverted_at) groups[txId].allReverted = false;
                                                    });
                                                    return Object.entries(groups).map(([txId, group]) => {
                                                        const p = group.firstPayment;
                                                        const monthsText = group.months.length > 0 ? group.months.join(', ') : (p.note || '-');
                                                        const netPaid = group.totalAmount + group.totalFine - group.totalDiscount;
                                                        return (
                                                            <tr key={`transport-${txId}`} className={`border-b ${group.allReverted ? 'bg-red-50 dark:bg-red-950/20 opacity-60 line-through' : 'hover:bg-blue-50/30 dark:hover:bg-blue-950/20'}`}>
                                                                <td className="p-3">
                                                                    <div className="font-medium">{format(parseISO(p.payment_date), 'dd MMM yyyy')}</div>
                                                                    <div className="text-xs text-muted-foreground">{format(parseISO(p.created_at), 'hh:mm a')}</div>
                                                                </td>
                                                                <td className="p-3">
                                                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                                                        <Bus className="h-3 w-3 mr-1" />Transport
                                                                    </Badge>
                                                                </td>
                                                                <td className="p-3">
                                                                    <div className="font-medium text-sm">{transportDetails?.routeName || 'Transport Fee'}</div>
                                                                    <div className="text-xs text-muted-foreground">{monthsText}</div>
                                                                    {p.utr_number && (
                                                                        <code className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-mono mt-1 inline-block">UTR: {p.utr_number}</code>
                                                                    )}
                                                                </td>
                                                                <td className="p-3">
                                                                    <code className="text-xs bg-muted px-2 py-0.5 rounded">{p.transaction_id || '-'}</code>
                                                                </td>
                                                                <td className="p-3">
                                                                    <Badge variant="outline">{p.payment_mode}</Badge>
                                                                </td>
                                                                <td className="p-3 text-right font-mono font-semibold">{currencySymbol}{group.totalAmount.toLocaleString('en-IN')}</td>
                                                                <td className="p-3 text-right font-mono text-blue-600">{group.totalDiscount > 0 ? `-${currencySymbol}${group.totalDiscount.toLocaleString('en-IN')}` : '-'}</td>
                                                                <td className="p-3 text-right font-mono text-amber-600">{group.totalFine > 0 ? `+${currencySymbol}${group.totalFine.toLocaleString('en-IN')}` : '-'}</td>
                                                                <td className="p-3 text-right font-mono font-bold text-green-700">{currencySymbol}{netPaid.toLocaleString('en-IN')}</td>
                                                                <td className="p-3 text-center">
                                                                    {!group.allReverted ? (
                                                                        <div className="flex justify-center gap-1">
                                                                            <Button variant="outline" size="sm" onClick={() => navigate(`/${basePath}/fees-collection/print-transport-receipt/${p.id}`)} title="Print Receipt">
                                                                                <Printer className="h-3 w-3" />
                                                                            </Button>
                                                                            {!hasExistingRefund(p.id, 'transport') && (
                                                                                <Button variant="outline" size="sm" className="text-orange-600 border-orange-300 hover:bg-orange-50" onClick={() => openRefundDialog({ ...p, totalAmount: group.totalAmount, paymentIds: Object.values(groups).flatMap(g => [g.firstPayment.id]) }, 'transport')} title="Request Refund">
                                                                                    <Undo2 className="h-3 w-3" />
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-xs text-red-600">
                                                                            <div className="font-medium">REVERTED</div>
                                                                            <div>{format(parseISO(p.reverted_at), 'dd/MM/yy')}</div>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    });
                                                })()}

                                                {/* Hostel Fee Payments - Grouped by transaction_id */}
                                                {(() => {
                                                    const groups = {};
                                                    (hostelDetails?.payments || []).forEach(p => {
                                                        const txId = p.transaction_id || p.id;
                                                        if (!groups[txId]) {
                                                            groups[txId] = { firstPayment: p, totalAmount: 0, totalDiscount: 0, totalFine: 0, months: [], allReverted: true };
                                                        }
                                                        groups[txId].totalAmount += Number(p.amount || 0);
                                                        groups[txId].totalDiscount += Number(p.discount_amount || 0);
                                                        groups[txId].totalFine += Number(p.fine_paid || 0);
                                                        if (p.payment_month) groups[txId].months.push(p.payment_month);
                                                        if (!p.reverted_at) groups[txId].allReverted = false;
                                                    });
                                                    return Object.entries(groups).map(([txId, group]) => {
                                                        const p = group.firstPayment;
                                                        const monthsText = group.months.length > 0 ? group.months.join(', ') : (p.note || '-');
                                                        const netPaid = group.totalAmount + group.totalFine - group.totalDiscount;
                                                        return (
                                                            <tr key={`hostel-${txId}`} className={`border-b ${group.allReverted ? 'bg-red-50 dark:bg-red-950/20 opacity-60 line-through' : 'hover:bg-purple-50/30 dark:hover:bg-purple-950/20'}`}>
                                                                <td className="p-3">
                                                                    <div className="font-medium">{format(parseISO(p.payment_date), 'dd MMM yyyy')}</div>
                                                                    <div className="text-xs text-muted-foreground">{format(parseISO(p.created_at), 'hh:mm a')}</div>
                                                                </td>
                                                                <td className="p-3">
                                                                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                                                        <Building2 className="h-3 w-3 mr-1" />Hostel
                                                                    </Badge>
                                                                </td>
                                                                <td className="p-3">
                                                                    <div className="font-medium text-sm">{hostelDetails?.blockName || 'Hostel Fee'}</div>
                                                                    <div className="text-xs text-muted-foreground">{monthsText}</div>
                                                                    {p.utr_number && (
                                                                        <code className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-mono mt-1 inline-block">UTR: {p.utr_number}</code>
                                                                    )}
                                                                </td>
                                                                <td className="p-3">
                                                                    <code className="text-xs bg-muted px-2 py-0.5 rounded">{p.transaction_id || '-'}</code>
                                                                </td>
                                                                <td className="p-3">
                                                                    <Badge variant="outline">{p.payment_mode}</Badge>
                                                                </td>
                                                                <td className="p-3 text-right font-mono font-semibold">{currencySymbol}{group.totalAmount.toLocaleString('en-IN')}</td>
                                                                <td className="p-3 text-right font-mono text-blue-600">{group.totalDiscount > 0 ? `-${currencySymbol}${group.totalDiscount.toLocaleString('en-IN')}` : '-'}</td>
                                                                <td className="p-3 text-right font-mono text-amber-600">{group.totalFine > 0 ? `+${currencySymbol}${group.totalFine.toLocaleString('en-IN')}` : '-'}</td>
                                                                <td className="p-3 text-right font-mono font-bold text-green-700">{currencySymbol}{netPaid.toLocaleString('en-IN')}</td>
                                                                <td className="p-3 text-center">
                                                                    {!group.allReverted ? (
                                                                        <div className="flex justify-center gap-1">
                                                                            <Button variant="outline" size="sm" onClick={() => navigate(`/${basePath}/fees-collection/print-hostel-receipt/${p.id}`)} title="Print Receipt">
                                                                                <Printer className="h-3 w-3" />
                                                                            </Button>
                                                                            {!hasExistingRefund(p.id, 'hostel') && (
                                                                                <Button variant="outline" size="sm" className="text-orange-600 border-orange-300 hover:bg-orange-50" onClick={() => openRefundDialog({ ...p, totalAmount: group.totalAmount, paymentIds: Object.values(groups).flatMap(g => [g.firstPayment.id]) }, 'hostel')} title="Request Refund">
                                                                                    <Undo2 className="h-3 w-3" />
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-xs text-red-600">
                                                                            <div className="font-medium">REVERTED</div>
                                                                            <div>{format(parseISO(p.reverted_at), 'dd/MM/yy')}</div>
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
                                                                {refund.status === 'pending' ? '⏳ Pending' : 
                                                                 refund.status === 'approved' ? '✅ Approved' :
                                                                 refund.status === 'completed' ? '💰 Completed' :
                                                                 '❌ Rejected'}
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
                </div>
            </div>

            {/* Revoke Payment Dialog */}
            <AlertDialog open={!!paymentToRevoke} onOpenChange={() => setPaymentToRevoke(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <ShieldX className="h-5 w-5" />Revoke Payment
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to revoke this payment of <strong>{currencySymbol}{paymentToRevoke?.amount}</strong>? 
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
                                    <p className="text-xs text-orange-600 mt-1">⏳ This will be sent for Super Admin approval</p>
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
                            <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-purple-200">
                                <img src={qrCodeDataUrl} alt="UPI QR Code" className="w-64 h-64" />
                            </div>
                        )}
                        <div className="text-center space-y-2 w-full">
                            <p className="text-sm text-muted-foreground">Scan with any UPI app</p>
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                <Smartphone className="h-4 w-4" />
                                Google Pay • PhonePe • Paytm • BHIM
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
                                ⚠️ After payment, enter UTR/Transaction ID in the Note field and click Collect
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default StudentFees;
