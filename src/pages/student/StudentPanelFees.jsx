import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

const StudentPanelFees = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [student, setStudent] = useState(null);
    const [feeMasters, setFeeMasters] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    const studentId = user?.id;

    useEffect(() => {
        const fetchData = async () => {
            if (!studentId || !user?.profile?.branch_id) return;

            setLoading(true);

            const [studentRes, allocationsRes, paymentsRes] = await Promise.all([
                supabase.from('student_profiles').select('*, photo_url, full_name, school_code, father_name, phone, roll_number, class:class_id(name), section:section_id(name)').eq('id', studentId).single(),
                supabase.from('student_fee_allocations').select('fee_master_id').eq('student_id', studentId),
                supabase.from('fee_payments').select('*').eq('student_id', studentId).order('payment_date', { ascending: false }),
            ]);

            if (studentRes.error) {
                toast({ variant: 'destructive', title: 'Error fetching student data' });
                setLoading(false);
                return;
            }
            setStudent(studentRes.data);

            if (allocationsRes.data) {
                const masterIds = allocationsRes.data.map(a => a.fee_master_id);
                if (masterIds.length > 0) {
                    const { data: mastersData, error: mastersError } = await supabase.from('fee_masters').select('*, fee_group:fee_group_id(name), fee_type:fee_type_id(name, code)').in('id', masterIds).order('due_date');
                    if (mastersError) toast({ variant: 'destructive', title: 'Error fetching fee details' });
                    setFeeMasters(mastersData || []);
                } else {
                    setFeeMasters([]);
                }
            }
            if (paymentsRes.error) toast({ variant: 'destructive', title: 'Error fetching payments' });
            setPayments(paymentsRes.data || []);
            setLoading(false);
        };

        fetchData();
    }, [studentId, user, toast]);

    const feeData = useMemo(() => {
        return feeMasters.map(master => {
            const masterPayments = payments.filter(p => p.fee_master_id === master.id && !p.reverted_at);
            const totalPaid = masterPayments.reduce((sum, p) => sum + Number(p.amount), 0);
            const totalDiscount = masterPayments.reduce((sum, p) => sum + Number(p.discount_amount), 0);
            const balance = Number(master.amount) - totalPaid - totalDiscount;

            let status = 'Unpaid';
            let statusClass = 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            if (balance <= 0) {
                status = 'Paid';
                statusClass = 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            } else if (totalPaid > 0 || totalDiscount > 0) {
                status = 'Partial';
                statusClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            }

            const relatedPayments = payments
                .filter(p => p.fee_master_id === master.id && !p.reverted_at)
                .map(p => ({
                    id: p.id,
                    mode: p.payment_mode,
                    date: p.payment_date,
                    amount: p.amount,
                    discount: p.discount_amount,
                    fine: p.fine_paid
                }));

            return {
                ...master,
                totalPaid,
                totalDiscount,
                balance,
                status,
                statusClass,
                relatedPayments
            };
        });
    }, [feeMasters, payments]);
    
    const grandTotal = useMemo(() => {
        return feeData.reduce((acc, fee) => {
            acc.amount += Number(fee.amount);
            acc.paid += Number(fee.totalPaid);
            acc.discount += Number(fee.totalDiscount);
            acc.balance += Number(fee.balance);
            return acc;
        }, { amount: 0, paid: 0, discount: 0, balance: 0, fine: 0 });
    }, [feeData]);


    const handlePayClick = (master) => {
        toast({
            title: "ðŸš§ Online Payment Not Yet Implemented",
            description: "Please contact the school office to complete your payment.",
        });
    };

    if (loading) {
        return <DashboardLayout><div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-8 w-8" /></div></DashboardLayout>;
    }

    if (!student) {
        return <DashboardLayout><div className="text-center text-red-500">Could not load student information.</div></DashboardLayout>;
    }

    return (
        <DashboardLayout>
             <div className="bg-card p-4 sm:p-6 rounded-lg shadow-sm mb-6">
                 <div className="flex items-start gap-4 sm:gap-6">
                    <img src={student.photo_url || `https://api.dicebear.com/6.x/initials/svg?seed=${student.full_name}`} alt="Student" className="w-16 h-16 sm:w-24 sm:h-24 rounded-full border-4 border-primary/20 shadow-md" />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 sm:gap-x-8 gap-y-2 text-sm flex-1">
                        <div><strong>Name:</strong> {student.full_name}</div>
                        <div><strong>Class:</strong> {student.class?.name} ({student.section?.name})</div>
                        <div><strong>Father Name:</strong> {student.father_name}</div>
                        <div><strong>Admission No:</strong> {student.school_code}</div>
                        <div><strong>Mobile Number:</strong> {student.phone || 'N/A'}</div>
                        <div><strong>Roll Number:</strong> {student.roll_number || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div className="bg-card p-4 sm:p-6 rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted hidden md:table-header-group">
                             <tr className="text-left">
                                <th className="p-3">Fees Group</th>
                                <th className="p-3">Fees Code</th>
                                <th className="p-3">Due Date</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Amount (₹)</th>
                                <th className="p-3">Payment ID</th>
                                <th className="p-3">Mode</th>
                                <th className="p-3">Date</th>
                                <th className="p-3 text-right">Paid (₹)</th>
                                <th className="p-3 text-right">Balance (₹)</th>
                                <th className="p-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feeData.map((master, index) => (
                                <React.Fragment key={master.id}>
                                    <tr className="border-b md:border-none flex flex-col md:table-row py-2 md:py-0">
                                        <td className="p-3 md:border-b" data-label="Fees Group">{master.fee_group.name}</td>
                                        <td className="p-3 md:border-b" data-label="Fees Code">{master.fee_type.code}</td>
                                        <td className="p-3 md:border-b" data-label="Due Date">{format(new Date(master.due_date), 'dd-MM-yyyy')}</td>
                                        <td className="p-3 md:border-b" data-label="Status"><span className={`px-2 py-1 text-xs font-medium rounded-full ${master.statusClass}`}>{master.status}</span></td>
                                        <td className="p-3 md:border-b text-right" data-label="Amount">₹{Number(master.amount).toFixed(2)}</td>
                                        
                                        {master.relatedPayments.length === 0 ? (
                                             <td colSpan="4" className="p-3 md:border-b text-center text-muted-foreground">No payment yet</td>
                                        ): (
                                            <>
                                            <td className="p-3 md:border-b" data-label="Payment ID">{master.relatedPayments[0].id.substring(0,8)}...</td>
                                            <td className="p-3 md:border-b" data-label="Mode">{master.relatedPayments[0].mode}</td>
                                            <td className="p-3 md:border-b" data-label="Date">{format(new Date(master.relatedPayments[0].date), 'dd-MM-yyyy')}</td>
                                            <td className="p-3 md:border-b text-right" data-label="Paid">₹{Number(master.relatedPayments[0].amount).toFixed(2)}</td>
                                            </>
                                        )}
                                        <td className="p-3 md:border-b text-right font-bold" data-label="Balance">₹{master.balance.toFixed(2)}</td>
                                        <td className="p-3 md:border-b text-center" data-label="Action">
                                            {master.balance > 0 ? (
                                                <Button size="sm" onClick={() => handlePayClick(master)} className="bg-green-600 hover:bg-green-700">Pay</Button>
                                            ) : (
                                                <span className="text-green-600 font-semibold">Paid</span>
                                            )}
                                        </td>
                                    </tr>
                                    {master.relatedPayments.slice(1).map(p => (
                                        <tr key={p.id} className="text-muted-foreground bg-slate-50 dark:bg-gray-800/50 flex flex-col md:table-row py-2 md:py-0">
                                            <td colSpan="5" className="p-3 md:border-b text-right">▲</td>
                                            <td className="p-3 md:border-b" data-label="Payment ID">{p.id.substring(0,8)}...</td>
                                            <td className="p-3 md:border-b" data-label="Mode">{p.mode}</td>
                                            <td className="p-3 md:border-b" data-label="Date">{format(new Date(p.date), 'dd-MM-yyyy')}</td>
                                            <td className="p-3 md:border-b text-right" data-label="Paid">₹{Number(p.amount).toFixed(2)}</td>
                                            <td colSpan="2" className="p-3 md:border-b"></td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                        <tfoot className="font-bold bg-muted hidden md:table-footer-group">
                            <tr>
                                <td colSpan="4" className="p-3 text-right">Grand Total</td>
                                <td className="p-3 text-right">₹{grandTotal.amount.toFixed(2)}</td>
                                <td colSpan="3"></td>
                                <td className="p-3 text-right">₹{grandTotal.paid.toFixed(2)}</td>
                                <td className="p-3 text-right">₹{grandTotal.balance.toFixed(2)}</td>
                                <td className="p-3"></td>
                            </tr>
                        </tfoot>
                    </table>
                     <div className="md:hidden mt-4 p-4 bg-muted rounded-lg font-bold space-y-2">
                        <div className="flex justify-between"><span>Grand Total:</span><span>₹{grandTotal.amount.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Total Paid:</span><span>₹{grandTotal.paid.toFixed(2)}</span></div>
                        <div className="flex justify-between text-red-600"><span>Total Balance:</span><span>₹{grandTotal.balance.toFixed(2)}</span></div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                @media (max-width: 767px) {
                    td[data-label]::before {
                        content: attr(data-label);
                        font-weight: bold;
                        width: 120px;
                        display: inline-block;
                    }
                    td {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 8px 12px !important;
                        border-bottom: 1px solid hsl(var(--border));
                    }
                    tr.md\\:border-none {
                        border: 1px solid hsl(var(--border));
                        border-radius: 8px;
                        margin-bottom: 1rem;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        display: block;
                    }
                    tr.md\\:border-none:last-child {
                        margin-bottom: 0;
                    }
                }
            `}</style>
        </DashboardLayout>
    );
};

export default StudentPanelFees;
