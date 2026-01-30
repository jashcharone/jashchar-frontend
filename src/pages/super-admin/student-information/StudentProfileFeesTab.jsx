import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'; // Added DialogTrigger
import { Loader2, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const StudentProfileFeesTab = ({ studentId }) => {
    const { user, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const branchId = user?.profile?.branch_id;

    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchStudentFees = useCallback(async () => {
        if (!studentId || !branchId || !selectedBranch) return;
        setLoading(true);
        try {
            // Build queries with optional session filtering
            let allocationsQuery = supabase
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
                .eq('branch_id', selectedBranch.id);
            
            let paymentsQuery = supabase
                .from('fee_payments')
                .select(`*`)
                .eq('student_id', studentId)
                .eq('branch_id', selectedBranch.id);
            
            // Note: session_id filter removed - allocations may not have session_id set
            // If needed, filter by session at fee_master level instead
            
            const [allocationsRes, paymentsRes] = await Promise.all([
                allocationsQuery,
                paymentsQuery
            ]);

            if (allocationsRes.error) throw allocationsRes.error;
            if (paymentsRes.error) throw paymentsRes.error;

            const allPayments = paymentsRes.data || [];
            
            const processedFees = (allocationsRes.data || []).map(item => {
                const master = item.fee_master;
                if (!master) return null;

                const relevantPayments = allPayments.filter(p => p.fee_master_id === master.id);
                const validPayments = relevantPayments.filter(p => !p.reverted_at);
                
                const totalPaid = validPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                const totalDiscount = validPayments.reduce((sum, p) => sum + (Number(p.discount_amount) || 0), 0);
                const masterAmount = Number(master.amount) || 0;
                const balance = masterAmount - totalPaid - totalDiscount;

                return {
                    id: item.id,
                    masterId: master.id,
                    group: master.fee_group?.name || 'N/A',
                    type: master.fee_type?.name || 'N/A',
                    dueDate: master.due_date,
                    amount: masterAmount,
                    status: balance <= 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid',
                    totalPaid,
                    totalDiscount,
                    balance,
                    payments: relevantPayments,
                };
            }).filter(Boolean);

            setFees(processedFees);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching fee data', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [studentId, branchId, selectedBranch, toast]);

    useEffect(() => {
        fetchStudentFees();
    }, [fetchStudentFees]);

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Fees Status</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-muted-foreground">
                                <th className="p-2">Fees Group</th>
                                <th className="p-2">Fees Type</th>
                                <th className="p-2">Due Date</th>
                                <th className="p-2 text-right">Amount</th>
                                <th className="p-2 text-right">Paid</th>
                                <th className="p-2 text-right">Discount</th>
                                <th className="p-2 text-right">Balance</th>
                                <th className="p-2">Status</th>
                                <th className="p-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fees.length > 0 ? fees.map(fee => (
                                <tr key={fee.id} className="border-b hover:bg-muted/50">
                                    <td className="p-2">{fee.group}</td>
                                    <td className="p-2">{fee.type}</td>
                                    <td className="p-2">{fee.dueDate ? format(parseISO(fee.dueDate), 'dd-MM-yyyy') : 'N/A'}</td>
                                    <td className="p-2 text-right">{fee.amount.toFixed(2)}</td>
                                    <td className="p-2 text-right">{fee.totalPaid.toFixed(2)}</td>
                                    <td className="p-2 text-right">{fee.totalDiscount.toFixed(2)}</td>
                                    <td className="p-2 text-right font-semibold">{fee.balance.toFixed(2)}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${fee.status === 'Paid' ? 'bg-green-100 text-green-800' : fee.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                            {fee.status}
                                        </span>
                                    </td>
                                    <td className="p-2 text-center">
                                        {fee.payments.length > 0 && (
                                            <Dialog>
                                                <DialogTrigger asChild><Button variant="ghost" size="sm"><Info className="h-4 w-4" /></Button></DialogTrigger>
                                                <DialogContent className="max-w-3xl">
                                                    <DialogHeader><DialogTitle>Payment History for {fee.type}</DialogTitle></DialogHeader>
                                                    <table className="w-full text-sm mt-4">
                                                        <thead><tr className="border-b text-left text-muted-foreground"><th className="p-2">Date</th><th className="p-2">Mode</th><th className="p-2 text-right">Amount</th><th className="p-2 text-right">Discount</th><th className="p-2 text-right">Fine</th><th className="p-2">Note</th></tr></thead>
                                                        <tbody>
                                                            {fee.payments.map(p => (
                                                                <tr key={p.id} className={`border-b ${p.reverted_at ? 'bg-red-50 text-muted-foreground line-through' : ''}`}>
                                                                    <td className="p-2">{format(parseISO(p.payment_date), 'dd-MM-yyyy')}</td>
                                                                    <td className="p-2">{p.payment_mode}</td>
                                                                    <td className="p-2 text-right">{(Number(p.amount) || 0).toFixed(2)}</td>
                                                                    <td className="p-2 text-right">{(Number(p.discount_amount) || 0).toFixed(2)}</td>
                                                                    <td className="p-2 text-right">{(Number(p.fine_paid) || 0).toFixed(2)}</td>
                                                                    <td className="p-2">{p.note}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="9" className="p-4 text-center text-muted-foreground">No fees allocated to this student.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

export default StudentProfileFeesTab;
