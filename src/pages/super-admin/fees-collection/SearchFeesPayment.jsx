import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2, Eye } from 'lucide-react';
import { format } from 'date-fns';

const SearchFeesPayment = () => {
    const { user, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const { roleSlug } = useParams();
    const basePath = roleSlug || 'super-admin';
    
    // Unified branchId with fallback for staff users
    const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

    const [transactionId, setTransactionId] = useState('');
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!transactionId || !branchId) {
            toast({ variant: 'destructive', title: 'Transaction ID is required' });
            return;
        }
        setLoading(true);
        setSearched(true);
        
        const { data, error } = await supabase
            .from('fee_payments')
            .select(`
                id, payment_date, amount, discount_amount, fine_paid, payment_mode, transaction_id,
                student:student_profiles(id, full_name, enrollment_id, class:classes!student_profiles_class_id_fkey(name), section:sections!student_profiles_section_id_fkey(name)),
                master:fee_masters(fee_group:fee_groups(name), fee_type:fee_types(name))
            `)
            .eq('branch_id', branchId)
            .eq('session_id', currentSessionId)
            .ilike('transaction_id', `${transactionId.trim()}%`);

        if (error) {
            toast({ variant: 'destructive', title: 'Error searching payments', description: error.message });
            setPayments([]);
        } else {
            setPayments(data);
        }
        setLoading(false);
    };

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-6">Search Fees Payment</h1>
            <Card className="mb-6">
                <CardHeader><CardTitle>Search By Transaction ID</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label htmlFor="transactionId" className="text-sm font-medium">Transaction ID *</label>
                            <Input 
                                id="transactionId"
                                placeholder="Enter Transaction ID"
                                value={transactionId}
                                onChange={e => setTransactionId(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Search</Button>
                    </div>
                </CardContent>
            </Card>

            {searched && (
                 <Card>
                    <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
                    <CardContent>
                        {loading ? <div className="text-center p-8"><Loader2 className="animate-spin mx-auto"/></div> : (
                             <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                        <tr className="text-left"><th className="p-2">Transaction ID</th><th className="p-2">Date</th><th className="p-2">Name</th><th className="p-2">Class</th><th className="p-2">Fees Group</th><th className="p-2">Fees Type</th><th className="p-2">Mode</th><th className="p-2 text-right">Amount (?)</th><th className="p-2 text-right">Discount (?)</th><th className="p-2 text-right">Fine (?)</th><th className="p-2 text-center">Action</th></tr>
                                    </thead>
                                    <tbody>
                                        {payments.length > 0 ? payments.map(p => (
                                            <tr key={p.id} className="border-b">
                                                <td className="p-2 font-mono">{p.transaction_id}</td>
                                                <td className="p-2">{format(new Date(p.payment_date), 'dd-MM-yyyy')}</td>
                                                <td className="p-2">
                                                    <Link to={`/${basePath}/student-information/profile/${p.student?.id}`} className="hover:underline">
                                                        {p.student?.full_name} ({p.student?.enrollment_id})
                                                    </Link>
                                                </td>
                                                <td className="p-2">{p.student?.class?.name} ({p.student?.section?.name})</td>
                                                <td className="p-2">{p.master?.fee_group?.name}</td>
                                                <td className="p-2">{p.master?.fee_type?.name}</td>
                                                <td className="p-2">{p.payment_mode}</td>
                                                <td className="p-2 text-right">{Number(p.amount).toFixed(2)}</td>
                                                <td className="p-2 text-right">{Number(p.discount_amount).toFixed(2)}</td>
                                                <td className="p-2 text-right">{Number(p.fine_paid).toFixed(2)}</td>
                                                <td className="p-2 text-center">
                                                    <Link to={`/${basePath}/fees-collection/receipt/${p.id}`}>
                                                        <Button size="sm" variant="outline"><Eye className="mr-2 h-4 w-4" />View</Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="11" className="p-4 text-center">No payment found with that transaction ID.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </DashboardLayout>
    );
};

export default SearchFeesPayment;
