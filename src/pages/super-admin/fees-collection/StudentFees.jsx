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
    IndianRupee, Receipt, History, ArrowLeft, Building2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import DatePicker from '@/components/ui/DatePicker';
import { generateTransactionId } from '@/lib/transactionUtils';

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
    const [revokeReason, setRevokeReason] = useState('');

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
        
        setPaymentDetails(prev => ({
            ...prev,
            amount: totalBalance.toFixed(2),
            fine: totalFine.toFixed(2),
            discount: '0.00'
        }));
    }, [selectedFees, fees]);

    const feeSummary = useMemo(() => {
        const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
        const totalPaid = payments.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.amount), 0);
        const totalDiscount = payments.filter(p => !p.reverted_at).reduce((sum, p) => sum + Number(p.discount_amount), 0);
        const balance = totalFees - totalPaid - totalDiscount;
        const overdueCount = fees.filter(f => f.isOverdue && f.balance > 0).length;
        const unpaidCount = fees.filter(f => f.balance > 0).length;

        return { totalFees, totalPaid, totalDiscount, balance, overdueCount, unpaidCount };
    }, [fees, payments]);

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
                .select('id')
                .limit(1)
                .single();

            if (error) throw error;
            
            toast({ title: '✅ Payment collected successfully!', description: `Transaction ID: ${newTransactionId}` });
            await fetchStudentAndFees();
            setSelectedFees([]);
            setPaymentDetails(prev => ({ ...prev, note: '' }));

            // Navigate to the new receipt page
            navigate(`/super-admin/fees-collection/print-fees-receipt/${insertedPayments.id}`);

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
                                <InfoRow icon={Calendar} label="DOB" value={student.dob ? format(parseISO(student.dob), 'dd MMM yyyy') : null} />
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
                                    <Label className="text-xs">Discount ({currencySymbol})</Label>
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
                                            <Badge variant="secondary" className="ml-1">{payments.length}</Badge>
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
                                </TabsContent>

                                <TabsContent value="history" className="m-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted/50">
                                                    <th className="p-3 text-left font-medium">Date</th>
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
                                                {payments.map(p => (
                                                    <tr key={p.id} className={`border-b ${p.reverted_at ? 'bg-red-50 dark:bg-red-950/20 opacity-60' : 'hover:bg-muted/30'}`}>
                                                        <td className="p-3">{format(parseISO(p.payment_date), 'dd MMM yyyy')}</td>
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
                                                {payments.length === 0 && (
                                                    <tr><td colSpan="8" className="p-8 text-center text-muted-foreground">No payment history found.</td></tr>
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
