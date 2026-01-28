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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, User, Printer, RotateCcw, ShieldX, ExternalLink, FileText, CheckCircle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import DatePicker from '@/components/ui/DatePicker';
import { v4 as uuidv4 } from 'uuid';

const SummaryCard = ({ title, amount, icon, currencySymbol = '₹' }) => {
    const Icon = icon;
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{currencySymbol}{amount.toFixed(2)}</div>
            </CardContent>
        </Card>
    );
};

const StudentFees = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const { user, school } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const branchId = user?.profile?.branch_id;
    const currencySymbol = school?.currency_symbol || '₹';

    const [student, setStudent] = useState(null);
    const [fees, setFees] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [selectedFees, setSelectedFees] = useState([]);
    const [paymentDetails, setPaymentDetails] = useState({
        amount: '',
        discount: '0',
        fine: '0',
        payment_date: new Date(),
        payment_mode: 'Cash',
        note: '',
        reference_number: ''
    });
    const [paymentToRevoke, setPaymentToRevoke] = useState(null);
    const [revokeReason, setRevokeReason] = useState('');

    const fetchStudentAndFees = useCallback(async () => {
        if (!studentId || !selectedBranch?.id) return;
        setLoading(true);
        try {
            const studentRes = await supabase
                .from('profiles')
                .select('*, classes(name), sections(name)')
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
                if (balance > 0 && master.due_date) {
                    const dueDate = parseISO(master.due_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (today > dueDate) {
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
                    dueDate: master.due_date,
                    amount: masterAmount,
                    status: balance <= 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid',
                    totalPaid,
                    totalDiscount,
                    totalFine,
                    balance,
                    fine,
                };
            }).filter(Boolean);

            setFees(processedFees);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching data', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [studentId, branchId, toast]);

    useEffect(() => {
        fetchStudentAndFees();
    }, [fetchStudentAndFees]);
    
    const handleFeeSelection = (feeId) => {
        const newSelection = selectedFees.includes(feeId)
            ? selectedFees.filter(id => id !== feeId)
            : [...selectedFees, feeId];
        setSelectedFees(newSelection);
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

        return { totalFees, totalPaid, balance };
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

        setPaymentLoading(true);

        try {
            let remainingAmountToDistribute = parseFloat(paymentDetails.amount);
            let remainingDiscountToDistribute = parseFloat(paymentDetails.discount);
            let remainingFineToDistribute = parseFloat(paymentDetails.fine);

            const paymentsToInsert = [];
            const newTransactionId = uuidv4();

            for (const feeId of selectedFees) {
                const fee = fees.find(f => f.id === feeId);
                if (!fee || fee.balance <= 0) continue;

                const amountForThisFee = Math.min(remainingAmountToDistribute, fee.balance);
                const discountForThisFee = Math.min(remainingDiscountToDistribute, fee.balance - amountForThisFee);
                const fineForThisFee = Math.min(remainingFineToDistribute, fee.fine);
                
                if (amountForThisFee > 0 || discountForThisFee > 0 || fineForThisFee > 0) {
                    paymentsToInsert.push({
                        branch_id: branchId,
                        branch_id: selectedBranch.id,
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
            
            toast({ title: 'Payment collected successfully!' });
            await fetchStudentAndFees();
            setSelectedFees([]);

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

    if (loading) {
        return <DashboardLayout><div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8" /></div></DashboardLayout>;
    }

    if (!student) {
        return <DashboardLayout><div className="text-center p-8">Student not found.</div></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card className="sticky top-4">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{student.full_name}</CardTitle>
                                    <p className="text-sm text-muted-foreground">Admission No: {student.school_code}</p>
                                    <p className="text-sm text-muted-foreground">Class: {student.classes?.name} ({student.sections?.name})</p>
                                    <p className="text-sm text-muted-foreground">Father: {student.father_name}</p>
                                </div>
                                <Link to={`/super-admin/student-information/profile/${studentId}`} target="_blank">
                                    <Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <hr/>
                            <h3 className="font-semibold text-lg mt-4">Collect Fees</h3>
                            
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount ({currencySymbol})</Label>
                                <Input id="amount" type="number" value={paymentDetails.amount} onChange={(e) => setPaymentDetails(p => ({ ...p, amount: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="discount">Discount ({currencySymbol})</Label>
                                <Input id="discount" type="number" value={paymentDetails.discount} onChange={(e) => setPaymentDetails(p => ({ ...p, discount: e.target.value }))} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="fine">Fine ({currencySymbol})</Label>
                                <Input id="fine" type="number" value={paymentDetails.fine} onChange={(e) => setPaymentDetails(p => ({ ...p, fine: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <DatePicker date={paymentDetails.payment_date} setDate={(date) => setPaymentDetails(p => ({...p, payment_date: date}))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Mode</Label>
                                <Select value={paymentDetails.payment_mode} onValueChange={v => setPaymentDetails(p => ({ ...p, payment_mode: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Cheque">Cheque</SelectItem><SelectItem value="Online">Online</SelectItem></SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="note">Note</Label>
                                <Textarea id="note" value={paymentDetails.note} onChange={(e) => setPaymentDetails(p => ({...p, note: e.target.value }))} />
                            </div>
                            <Button className="w-full" onClick={collectFees} disabled={paymentLoading}>
                                {paymentLoading ? <Loader2 className="animate-spin" /> : <><Printer className="mr-2 h-4 w-4" /> Collect & Print</>}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SummaryCard title="Total Fees" amount={feeSummary.totalFees} icon={FileText} currencySymbol={currencySymbol} />
                        <SummaryCard title="Already Paid" amount={feeSummary.totalPaid} icon={CheckCircle} currencySymbol={currencySymbol} />
                        <SummaryCard title="Balance Amount" amount={feeSummary.balance} icon={Clock} currencySymbol={currencySymbol} />
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Fees Statement</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="p-2 w-10"></th>
                                            <th className="p-2">Fee Group</th>
                                            <th className="p-2">Fee Code</th>
                                            <th className="p-2">Due Date</th>
                                            <th className="p-2 text-right">Amount ({currencySymbol})</th>
                                            <th className="p-2 text-right">Paid ({currencySymbol})</th>
                                            <th className="p-2 text-right">Discount ({currencySymbol})</th>
                                            <th className="p-2 text-right">Fine ({currencySymbol})</th>
                                            <th className="p-2 text-right">Balance ({currencySymbol})</th>
                                            <th className="p-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fees.length > 0 ? fees.map(fee => (
                                            <tr key={fee.id} className="border-b hover:bg-muted/50">
                                                <td className="p-2 text-center">
                                                    {fee.balance > 0 && <input type="checkbox" checked={selectedFees.includes(fee.id)} onChange={() => handleFeeSelection(fee.id)} className="form-checkbox h-4 w-4" />}
                                                </td>
                                                <td className="p-2">{fee.group}</td>
                                                <td className="p-2">{fee.type}</td>
                                                <td className="p-2">{fee.dueDate ? format(parseISO(fee.dueDate), 'dd-MM-yyyy') : 'N/A'}</td>
                                                <td className="p-2 text-right">{fee.amount.toFixed(2)}</td>
                                                <td className="p-2 text-right">{fee.totalPaid.toFixed(2)}</td>
                                                <td className="p-2 text-right">{fee.totalDiscount.toFixed(2)}</td>
                                                <td className="p-2 text-right">{fee.totalFine.toFixed(2)}</td>
                                                <td className="p-2 text-right font-semibold">{fee.balance.toFixed(2)}</td>
                                                <td className="p-2">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${fee.status === 'Paid' ? 'bg-green-100 text-green-800' : fee.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                        {fee.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="10" className="p-4 text-center text-muted-foreground">No fees allocated to this student.</td></tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t font-bold bg-muted/50">
                                            <td colSpan="4" className="p-2 text-right">Grand Total</td>
                                            <td className="p-2 text-right">{feesStatementTotals.amount.toFixed(2)}</td>
                                            <td className="p-2 text-right">{feesStatementTotals.paid.toFixed(2)}</td>
                                            <td className="p-2 text-right">{feesStatementTotals.discount.toFixed(2)}</td>
                                            <td className="p-2 text-right">{feesStatementTotals.fine.toFixed(2)}</td>
                                            <td className="p-2 text-right">{feesStatementTotals.balance.toFixed(2)}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
                        <CardContent>
                             <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="p-2">Date</th>
                                            <th className="p-2">Transaction ID</th>
                                            <th className="p-2">Mode</th>
                                            <th className="p-2">Note</th>
                                            <th className="p-2 text-right">Amount ({currencySymbol})</th>
                                            <th className="p-2 text-right">Discount ({currencySymbol})</th>
                                            <th className="p-2 text-right">Fine ({currencySymbol})</th>
                                            <th className="p-2 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map(p => (
                                            <tr key={p.id} className={`border-b ${p.reverted_at ? 'bg-red-50 text-muted-foreground' : ''}`}>
                                                <td className="p-2">{format(parseISO(p.payment_date), 'dd-MM-yyyy')}</td>
                                                <td className="p-2">{p.transaction_id || '-'}</td>
                                                <td className="p-2">{p.payment_mode}</td>
                                                <td className="p-2">{p.note || '-'}</td>
                                                <td className="p-2 text-right">{(Number(p.amount) || 0).toFixed(2)}</td>
                                                <td className="p-2 text-right">{(Number(p.discount_amount) || 0).toFixed(2)}</td>
                                                <td className="p-2 text-right">{(Number(p.fine_paid) || 0).toFixed(2)}</td>
                                                <td className="p-2 text-center">
                                                    {!p.reverted_at ? (
                                                        <div className="flex justify-center gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => printReceipt(p)}>Print</Button>
                                                            <Button variant="destructive" size="sm" onClick={() => setPaymentToRevoke(p)}>Revert</Button>
                                                        </div>
                                                    ) : <span className="text-xs italic">Reverted on {format(parseISO(p.reverted_at), 'dd-MM-yy')}</span>}
                                                </td>
                                            </tr>
                                        ))}
                                        {payments.length === 0 && <tr><td colSpan="8" className="p-4 text-center">No payment history.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AlertDialog open={!!paymentToRevoke} onOpenChange={() => setPaymentToRevoke(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2"><ShieldX />Confirm Payment Revocation</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to revoke this payment? This action cannot be undone. Please provide a reason.
                            <div className="mt-4">
                                <Label htmlFor="revoke-reason">Reason for Revocation</Label>
                                <Input id="revoke-reason" value={revokeReason} onChange={e => setRevokeReason(e.target.value)} placeholder="e.g., Incorrect entry" />
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={revokePayment} disabled={paymentLoading || !revokeReason} className="bg-destructive hover:bg-destructive/80">
                            {paymentLoading ? <Loader2 className="animate-spin" /> : 'Revoke'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
};

export default StudentFees;
