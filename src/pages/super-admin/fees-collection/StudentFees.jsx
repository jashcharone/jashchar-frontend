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
    IndianRupee, Receipt, History, ArrowLeft, Building2, Bus
} from 'lucide-react';
import { format, parseISO, addMonths, startOfMonth, isBefore, isAfter, isSameMonth } from 'date-fns';
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
    const { studentId } = useParams();
    const navigate = useNavigate();
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
        payment_date: new Date(),
        payment_mode: 'Cash',
        note: ''
    });
    const [paymentToRevoke, setPaymentToRevoke] = useState(null);
    
    // Transport/Hostel payment state
    const [transportPaymentDetails, setTransportPaymentDetails] = useState({
        amount: '', discount: '0', fine: '0', payment_date: new Date(), payment_mode: 'Cash', note: ''
    });
    const [hostelPaymentDetails, setHostelPaymentDetails] = useState({
        amount: '', discount: '0', fine: '0', payment_date: new Date(), payment_mode: 'Cash', note: ''
    });
    
    // Monthly fee tracking
    const [sessionMonths, setSessionMonths] = useState([]); // All months in session
    const [selectedTransportMonths, setSelectedTransportMonths] = useState([]); // Months selected for payment
    const [selectedHostelMonths, setSelectedHostelMonths] = useState([]); // Months selected for payment
    
    const [revokeReason, setRevokeReason] = useState('');
    
    // Student assigned discounts
    const [studentDiscounts, setStudentDiscounts] = useState([]);

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
                const balance = masterAmount - totalPaid - totalDiscount;

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
            }).filter(Boolean);

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

            if (transportData && transportData.transport_fee > 0) {
                // Check for transport payments
                const { data: transportPayments } = await supabase
                    .from('transport_fee_payments')
                    .select('*')
                    .eq('student_id', studentId)
                    .eq('branch_id', selectedBranch.id)
                    .is('reverted_at', null);

                // Get billing cycle from student_transport_details or default to monthly
                const billingCycle = transportData.billing_cycle || 'monthly';
                const periodFee = Number(transportData.transport_fee) || 0;
                
                // Calculate fee details based on billing cycle
                const feeDetails = calculateFeeDetails(periodFee, billingCycle, totalSessionMonths);
                const { totalFee: totalTransportFee, perMonthEquivalent } = feeDetails;
                
                // For collection, we use monthly equivalent for month-based tracking
                const paidMonthsSet = getPaidMonths(transportPayments);
                const paidMonthsCount = paidMonthsSet.size;
                
                // Calculate paid and balance based on monthly equivalent
                const transportPaid = paidMonthsCount * perMonthEquivalent;
                const transportDiscount = (transportPayments || []).reduce((sum, p) => sum + (Number(p.discount_amount) || 0), 0);
                const unpaidMonthsCount = totalSessionMonths - paidMonthsCount;
                const transportBalance = unpaidMonthsCount * perMonthEquivalent;
                
                // Mark unpaid months
                const unpaidMonths = months.filter(m => !paidMonthsSet.has(m.key));

                setTransportDetails({
                    ...transportData,
                    billingCycle,
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
                    room_type:hostel_room_type(id, name, cost)
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

                // Get billing cycle from student_hostel_details or default to monthly
                const billingCycle = hostelData.billing_cycle || 'monthly';
                const periodFee = Number(hostelData.hostel_fee) || 0;
                
                // Calculate fee details based on billing cycle
                const feeDetails = calculateFeeDetails(periodFee, billingCycle, totalSessionMonths);
                const { totalFee: totalHostelFee, perMonthEquivalent } = feeDetails;
                
                // For collection, we use monthly equivalent for month-based tracking
                const paidMonthsSet = getPaidMonths(hostelPayments);
                const paidMonthsCount = paidMonthsSet.size;
                
                // Calculate paid and balance based on monthly equivalent
                const hostelPaid = paidMonthsCount * perMonthEquivalent;
                const hostelDiscount = (hostelPayments || []).reduce((sum, p) => sum + (Number(p.discount_amount) || 0), 0);
                const unpaidMonthsCount = totalSessionMonths - paidMonthsCount;
                const hostelBalance = unpaidMonthsCount * perMonthEquivalent;
                
                // Mark unpaid months
                const unpaidMonths = months.filter(m => !paidMonthsSet.has(m.key));

                setHostelDetails({
                    ...hostelData,
                    billingCycle,
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
        
        // Calculate discount from assigned student discounts
        let calculatedDiscount = 0;
        if (studentDiscounts.length > 0 && totalBalance > 0) {
            studentDiscounts.forEach(discount => {
                if (discount.discount_type === 'percentage') {
                    calculatedDiscount += (totalBalance * (parseFloat(discount.amount) || 0)) / 100;
                } else if (discount.discount_type === 'fix_amount') {
                    calculatedDiscount += parseFloat(discount.amount) || 0;
                }
            });
            // Ensure discount doesn't exceed balance
            calculatedDiscount = Math.min(calculatedDiscount, totalBalance);
        }
        
        setPaymentDetails(prev => ({
            ...prev,
            amount: totalBalance.toFixed(2),
            fine: totalFine.toFixed(2),
            discount: calculatedDiscount.toFixed(2)
        }));
    }, [selectedFees, fees, studentDiscounts]);

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
        const balance = totalFees - totalPaid - totalDiscount;

        const overdueCount = fees.filter(f => f.isOverdue && f.balance > 0).length;
        const unpaidCount = fees.filter(f => f.balance > 0).length;

        return { totalFees, totalPaid, totalDiscount, balance, overdueCount, unpaidCount };
    }, [fees, payments, transportDetails, hostelDetails]);

    const collectFees = async () => {
        if (!selectedFees.length) {
            toast({ variant: 'destructive', title: 'No fees selected', description: "Please select at least one fee item to collect." });
            return;
        }

        const totalToCollect = parseFloat(paymentDetails.amount) + parseFloat(paymentDetails.fine) - parseFloat(paymentDetails.discount);
        if (totalToCollect <= 0) {
            toast({ variant: 'destructive', title: 'Invalid amount', description: 'Total payment must be greater than zero.' });
            return;
        }

        // For non-cash payments, note field can be used for reference/cheque number
        // (reference_number column doesn't exist in fee_payments table)

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
                
                if (amountForThisFee > 0 || discountForThisFee > 0 || fineForThisFee > 0) {
                    paymentsToInsert.push({
                        branch_id: selectedBranch.id,
                        session_id: currentSessionId,
                        organization_id: organizationId,
                        student_id: studentId,
                        fee_master_id: fee.masterId,
                        amount: amountForThisFee,
                        payment_date: format(paymentDetails.payment_date, 'yyyy-MM-dd'),
                        payment_mode: paymentDetails.payment_mode,
                        fine_paid: fineForThisFee,
                        discount_amount: discountForThisFee,
                        note: paymentDetails.note,
                        transaction_id: newTransactionId,
                        created_by: user.id,
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
            setPaymentDetails(prev => ({ ...prev, note: '' }));

            // Navigate to the new receipt page (use first payment's ID)
            const firstPaymentId = insertedPayments?.[0]?.id;
            if (firstPaymentId) {
                navigate(`/super-admin/fees-collection/print-fees-receipt/${firstPaymentId}`);
            }

        } catch (error) {
            console.error("Payment collection error:", error);
            toast({ variant: 'destructive', title: 'Payment failed', description: error.message });
        } finally {
            setPaymentLoading(false);
        }
    };
    
    const printReceipt = (payment) => {
        navigate(`/super-admin/fees-collection/print-fees-receipt/${payment.id}`);
    }

    // Collect Transport Fee
    const collectTransportFee = async () => {
        if (!transportDetails || selectedTransportMonths.length === 0) {
            toast({ variant: 'destructive', title: 'Select months', description: 'Please select at least one month to pay.' });
            return;
        }
        
        const monthlyFee = transportDetails.monthlyFee || 0;
        const totalAmount = selectedTransportMonths.length * monthlyFee;
        const discount = parseFloat(transportPaymentDetails.discount) || 0;
        const fine = parseFloat(transportPaymentDetails.fine) || 0;
        
        if (totalAmount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid amount', description: 'Amount must be greater than zero.' });
            return;
        }

        setPaymentLoading(true);
        try {
            const branchCode = selectedBranch?.branch_code || selectedBranch?.code || 'TRN';
            const newTransactionId = await generateTransactionId(supabase, selectedBranch.id, branchCode, 'transport');
            
            // Create one payment record per selected month
            const paymentsToInsert = selectedTransportMonths.map((monthKey, index) => {
                const monthLabel = sessionMonths.find(m => m.key === monthKey)?.label || monthKey;
                return {
                    branch_id: selectedBranch.id,
                    session_id: currentSessionId,
                    organization_id: organizationId,
                    student_id: studentId,
                    amount: monthlyFee,
                    discount_amount: index === 0 ? discount : 0, // Apply discount to first payment only
                    fine_paid: index === 0 ? fine : 0,
                    payment_date: format(transportPaymentDetails.payment_date || new Date(), 'yyyy-MM-dd'),
                    payment_mode: transportPaymentDetails.payment_mode,
                    payment_month: monthLabel,
                    note: transportPaymentDetails.note || `Payment for ${selectedTransportMonths.length} month(s)`,
                    transaction_id: newTransactionId,
                    collected_by: user.id,
                };
            });

            const { data, error } = await supabase
                .from('transport_fee_payments')
                .insert(paymentsToInsert)
                .select();

            if (error) throw error;
            
            toast({ 
                title: '✅ Transport fee collected!', 
                description: `${selectedTransportMonths.length} month(s) paid. Transaction ID: ${newTransactionId}` 
            });
            await fetchStudentAndFees();
            setTransportPaymentDetails({ amount: '', discount: '0', fine: '0', payment_date: new Date(), payment_mode: 'Cash', note: '' });
            setSelectedTransportMonths([]);
            
            // Print receipt (use first payment's ID)
            if (data && data.length > 0) {
                navigate(`/super-admin/fees-collection/print-transport-receipt/${data[0].id}`);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Payment failed', description: error.message });
        } finally {
            setPaymentLoading(false);
        }
    };

    // Collect Hostel Fee
    const collectHostelFee = async () => {
        if (!hostelDetails || selectedHostelMonths.length === 0) {
            toast({ variant: 'destructive', title: 'Select months', description: 'Please select at least one month to pay.' });
            return;
        }
        
        const monthlyFee = hostelDetails.monthlyFee || 0;
        const totalAmount = selectedHostelMonths.length * monthlyFee;
        const discount = parseFloat(hostelPaymentDetails.discount) || 0;
        const fine = parseFloat(hostelPaymentDetails.fine) || 0;
        
        if (totalAmount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid amount', description: 'Amount must be greater than zero.' });
            return;
        }

        setPaymentLoading(true);
        try {
            const branchCode = selectedBranch?.branch_code || selectedBranch?.code || 'HST';
            const newTransactionId = await generateTransactionId(supabase, selectedBranch.id, branchCode, 'hostel');
            
            // Create one payment record per selected month
            const paymentsToInsert = selectedHostelMonths.map((monthKey, index) => {
                const monthLabel = sessionMonths.find(m => m.key === monthKey)?.label || monthKey;
                return {
                    branch_id: selectedBranch.id,
                    session_id: currentSessionId,
                    organization_id: organizationId,
                    student_id: studentId,
                    amount: monthlyFee,
                    discount_amount: index === 0 ? discount : 0, // Apply discount to first payment only
                    fine_paid: index === 0 ? fine : 0,
                    payment_date: format(hostelPaymentDetails.payment_date || new Date(), 'yyyy-MM-dd'),
                    payment_mode: hostelPaymentDetails.payment_mode,
                    payment_month: monthLabel,
                    note: hostelPaymentDetails.note || `Payment for ${selectedHostelMonths.length} month(s)`,
                    transaction_id: newTransactionId,
                    collected_by: user.id,
                };
            });

            const { data, error } = await supabase
                .from('hostel_fee_payments')
                .insert(paymentsToInsert)
                .select();

            if (error) throw error;
            
            toast({ 
                title: '✅ Hostel fee collected!', 
                description: `${selectedHostelMonths.length} month(s) paid. Transaction ID: ${newTransactionId}` 
            });
            await fetchStudentAndFees();
            setHostelPaymentDetails({ amount: '', discount: '0', fine: '0', payment_date: new Date(), payment_mode: 'Cash', note: '' });
            setSelectedHostelMonths([]);
            
            // Print receipt (use first payment's ID)
            if (data && data.length > 0) {
                navigate(`/super-admin/fees-collection/print-hostel-receipt/${data[0].id}`);
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

                            <Link to={`/super-admin/student-information/profile/${studentId}`} target="_blank">
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
                                        onChange={(e) => setPaymentDetails(p => ({ ...p, amount: e.target.value }))}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">
                                        Discount ({currencySymbol})
                                        {studentDiscounts.length > 0 && (
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
                                        date={paymentDetails.payment_date} 
                                        setDate={(date) => setPaymentDetails(p => ({...p, payment_date: date}))}
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <SummaryCard title="Total Fees" amount={feeSummary.totalFees} icon={FileText} variant="primary" currencySymbol={currencySymbol} />
                        <SummaryCard title="Paid Amount" amount={feeSummary.totalPaid} icon={CheckCircle} variant="success" currencySymbol={currencySymbol} />
                        <SummaryCard title="Discount Given" amount={feeSummary.totalDiscount} icon={Receipt} variant="default" currencySymbol={currencySymbol} />
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
                                                    <th className="p-3 text-right font-medium">Paid</th>
                                                    <th className="p-3 text-right font-medium">Discount</th>
                                                    <th className="p-3 text-right font-medium">Fine</th>
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
                                                        <td className="p-3 text-right font-mono text-green-600">{currencySymbol}{fee.totalPaid.toLocaleString('en-IN')}</td>
                                                        <td className="p-3 text-right font-mono text-blue-600">{currencySymbol}{fee.totalDiscount.toLocaleString('en-IN')}</td>
                                                        <td className="p-3 text-right font-mono text-amber-600">{currencySymbol}{fee.totalFine.toLocaleString('en-IN')}</td>
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
                                                    <tr className="bg-muted font-bold">
                                                        <td colSpan="4" className="p-3 text-right">Grand Total</td>
                                                        <td className="p-3 text-right font-mono">{currencySymbol}{feesStatementTotals.amount.toLocaleString('en-IN')}</td>
                                                        <td className="p-3 text-right font-mono text-green-600">{currencySymbol}{feesStatementTotals.paid.toLocaleString('en-IN')}</td>
                                                        <td className="p-3 text-right font-mono text-blue-600">{currencySymbol}{feesStatementTotals.discount.toLocaleString('en-IN')}</td>
                                                        <td className="p-3 text-right font-mono text-amber-600">{currencySymbol}{feesStatementTotals.fine.toLocaleString('en-IN')}</td>
                                                        <td className="p-3 text-right font-mono">{currencySymbol}{feesStatementTotals.balance.toLocaleString('en-IN')}</td>
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
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Monthly Equivalent</p>
                                                            <p className="font-bold text-lg">{currencySymbol}{(transportDetails.monthlyFee || 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Total Fee ({transportDetails.totalMonths || 12} months)</p>
                                                            <p className="font-bold text-lg">{currencySymbol}{(transportDetails.totalFee || 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Paid ({transportDetails.paidMonthsCount || 0} months)</p>
                                                            <p className="font-bold text-lg text-green-600">{currencySymbol}{(transportDetails.totalPaid || 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Balance ({transportDetails.unpaidMonthsCount || 0} months)</p>
                                                            <p className={`font-bold text-lg ${transportDetails.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{currencySymbol}{(transportDetails.balance || 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant={transportDetails.status === 'Paid' ? 'success' : transportDetails.status === 'Partial' ? 'warning' : 'destructive'}>
                                                        {transportDetails.status}
                                                    </Badge>
                                                </div>
                                                
                                                {/* Transport Fee Collection Form */}
                                                {transportDetails.balance > 0 && (
                                                    <div className="border-t pt-4 mt-4">
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
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Monthly Equivalent</p>
                                                            <p className="font-bold text-lg">{currencySymbol}{(hostelDetails.monthlyFee || 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Total Fee ({hostelDetails.totalMonths || 12} months)</p>
                                                            <p className="font-bold text-lg">{currencySymbol}{(hostelDetails.totalFee || 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Paid ({hostelDetails.paidMonthsCount || 0} months)</p>
                                                            <p className="font-bold text-lg text-green-600">{currencySymbol}{(hostelDetails.totalPaid || 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Balance ({hostelDetails.unpaidMonthsCount || 0} months)</p>
                                                            <p className={`font-bold text-lg ${hostelDetails.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{currencySymbol}{(hostelDetails.balance || 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant={hostelDetails.status === 'Paid' ? 'success' : hostelDetails.status === 'Partial' ? 'warning' : 'destructive'}>
                                                        {hostelDetails.status}
                                                    </Badge>
                                                </div>
                                                
                                                {/* Hostel Fee Collection Form */}
                                                {hostelDetails.balance > 0 && (
                                                    <div className="border-t pt-4 mt-4">
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
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="history" className="m-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted/50">
                                                    <th className="p-3 text-left font-medium">Date</th>
                                                    <th className="p-3 text-left font-medium">Type</th>
                                                    <th className="p-3 text-left font-medium">Transaction ID</th>
                                                    <th className="p-3 text-left font-medium">Mode</th>
                                                    <th className="p-3 text-left font-medium">Reference</th>
                                                    <th className="p-3 text-right font-medium">Amount</th>
                                                    <th className="p-3 text-right font-medium">Discount</th>
                                                    <th className="p-3 text-right font-medium">Fine</th>
                                                    <th className="p-3 text-center font-medium">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* Academic Fee Payments */}
                                                {payments.map(p => (
                                                    <tr key={`fee-${p.id}`} className={`border-b ${p.reverted_at ? 'bg-red-50 dark:bg-red-950/20 opacity-60' : 'hover:bg-muted/30'}`}>
                                                        <td className="p-3">{format(parseISO(p.payment_date), 'dd MMM yyyy')}</td>
                                                        <td className="p-3">
                                                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                                                <FileText className="h-3 w-3 mr-1" />Fees
                                                            </Badge>
                                                        </td>
                                                        <td className="p-3">
                                                            <code className="text-xs bg-muted px-2 py-0.5 rounded">{p.transaction_id || '-'}</code>
                                                        </td>
                                                        <td className="p-3">
                                                            <Badge variant="outline">{p.payment_mode}</Badge>
                                                        </td>
                                                        <td className="p-3 text-muted-foreground">{p.note || '-'}</td>
                                                        <td className="p-3 text-right font-mono">{currencySymbol}{Number(p.amount || 0).toLocaleString('en-IN')}</td>
                                                        <td className="p-3 text-right font-mono text-blue-600">{currencySymbol}{Number(p.discount_amount || 0).toLocaleString('en-IN')}</td>
                                                        <td className="p-3 text-right font-mono text-amber-600">{currencySymbol}{Number(p.fine_paid || 0).toLocaleString('en-IN')}</td>
                                                        <td className="p-3 text-center">
                                                            {!p.reverted_at ? (
                                                                <div className="flex justify-center gap-1">
                                                                    <Button variant="outline" size="sm" onClick={() => printReceipt(p)}>
                                                                        <Printer className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button variant="destructive" size="sm" onClick={() => setPaymentToRevoke(p)}>
                                                                        <RotateCcw className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-red-600">
                                                                    Reverted {format(parseISO(p.reverted_at), 'dd/MM/yy')}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}

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
                                                        return (
                                                            <tr key={`transport-${txId}`} className={`border-b ${group.allReverted ? 'bg-red-50 dark:bg-red-950/20 opacity-60' : 'hover:bg-blue-50/30 dark:hover:bg-blue-950/20'}`}>
                                                                <td className="p-3">{format(parseISO(p.payment_date), 'dd MMM yyyy')}</td>
                                                                <td className="p-3">
                                                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                                                        <Bus className="h-3 w-3 mr-1" />Transport
                                                                    </Badge>
                                                                </td>
                                                                <td className="p-3">
                                                                    <code className="text-xs bg-muted px-2 py-0.5 rounded">{p.transaction_id || '-'}</code>
                                                                </td>
                                                                <td className="p-3">
                                                                    <Badge variant="outline">{p.payment_mode}</Badge>
                                                                </td>
                                                                <td className="p-3 text-muted-foreground text-xs">{monthsText}</td>
                                                                <td className="p-3 text-right font-mono">{currencySymbol}{group.totalAmount.toLocaleString('en-IN')}</td>
                                                                <td className="p-3 text-right font-mono text-blue-600">{currencySymbol}{group.totalDiscount.toLocaleString('en-IN')}</td>
                                                                <td className="p-3 text-right font-mono text-amber-600">{currencySymbol}{group.totalFine.toLocaleString('en-IN')}</td>
                                                                <td className="p-3 text-center">
                                                                    {!group.allReverted ? (
                                                                        <Button variant="outline" size="sm" onClick={() => navigate(`/super-admin/fees-collection/print-transport-receipt/${p.id}`)}>
                                                                            <Printer className="h-3 w-3" />
                                                                        </Button>
                                                                    ) : (
                                                                        <span className="text-xs text-red-600">
                                                                            Reverted {format(parseISO(p.reverted_at), 'dd/MM/yy')}
                                                                        </span>
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
                                                        return (
                                                            <tr key={`hostel-${txId}`} className={`border-b ${group.allReverted ? 'bg-red-50 dark:bg-red-950/20 opacity-60' : 'hover:bg-purple-50/30 dark:hover:bg-purple-950/20'}`}>
                                                                <td className="p-3">{format(parseISO(p.payment_date), 'dd MMM yyyy')}</td>
                                                                <td className="p-3">
                                                                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                                                        <Building2 className="h-3 w-3 mr-1" />Hostel
                                                                    </Badge>
                                                                </td>
                                                                <td className="p-3">
                                                                    <code className="text-xs bg-muted px-2 py-0.5 rounded">{p.transaction_id || '-'}</code>
                                                                </td>
                                                                <td className="p-3">
                                                                    <Badge variant="outline">{p.payment_mode}</Badge>
                                                                </td>
                                                                <td className="p-3 text-muted-foreground text-xs">{monthsText}</td>
                                                                <td className="p-3 text-right font-mono">{currencySymbol}{group.totalAmount.toLocaleString('en-IN')}</td>
                                                                <td className="p-3 text-right font-mono text-blue-600">{currencySymbol}{group.totalDiscount.toLocaleString('en-IN')}</td>
                                                                <td className="p-3 text-right font-mono text-amber-600">{currencySymbol}{group.totalFine.toLocaleString('en-IN')}</td>
                                                                <td className="p-3 text-center">
                                                                    {!group.allReverted ? (
                                                                        <Button variant="outline" size="sm" onClick={() => navigate(`/super-admin/fees-collection/print-hostel-receipt/${p.id}`)}>
                                                                            <Printer className="h-3 w-3" />
                                                                        </Button>
                                                                    ) : (
                                                                        <span className="text-xs text-red-600">
                                                                            Reverted {format(parseISO(p.reverted_at), 'dd/MM/yy')}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    });
                                                })()}

                                                {payments.length === 0 && !transportDetails?.payments?.length && !hostelDetails?.payments?.length && (
                                                    <tr><td colSpan="9" className="p-8 text-center text-muted-foreground">No payment history found.</td></tr>
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
        </DashboardLayout>
    );
};

export default StudentFees;
