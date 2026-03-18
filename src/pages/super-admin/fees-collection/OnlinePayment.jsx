import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, CreditCard, CheckCircle, XCircle, Clock, RefreshCw, Eye } from 'lucide-react';
import { format } from 'date-fns';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const OnlinePayment = () => {
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        success: 0,
        pending: 0,
        failed: 0,
        totalAmount: 0
    });

    useEffect(() => {
        if (branchId) {
            fetchOnlinePayments();
        }
    }, [branchId]);

    const fetchOnlinePayments = async () => {
        setLoading(true);
        try {
            // Fetch online payments from fees_collection where payment_mode is online/upi/card etc.
            const { data, error } = await supabase
                .from('fees_collection')
                .select(`
                    *,
                    student:student_id(id, first_name, last_name, school_code),
                    fee_master:fee_master_id(id, name, amount)
                `)
                .eq('branch_id', branchId)
                .in('payment_mode', ['online', 'upi', 'card', 'netbanking', 'wallet'])
                .order('created_at', { ascending: false });

            if (error) throw error;

            setPayments(data || []);

            // Calculate stats
            const success = data?.filter(p => p.status === 'paid' || p.status === 'success').length || 0;
            const pending = data?.filter(p => p.status === 'pending').length || 0;
            const failed = data?.filter(p => p.status === 'failed').length || 0;
            const totalAmount = data?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;

            setStats({
                total: data?.length || 0,
                success,
                pending,
                failed,
                totalAmount
            });
        } catch (error) {
            console.error('Error fetching online payments:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch online payments'
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid':
            case 'success':
                return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Success</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
            case 'failed':
                return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const filteredPayments = payments.filter(p => {
        const matchesSearch = !searchTerm || 
            p.student?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.student?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.student?.school_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || 
            p.status?.toLowerCase() === statusFilter.toLowerCase() ||
            (statusFilter === 'success' && p.status === 'paid');

        return matchesSearch && matchesStatus;
    });

    const viewDetails = (payment) => {
        setSelectedPayment(payment);
        setShowDetails(true);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Online Fee Payments</h1>
                        <p className="text-muted-foreground">Track and manage online fee transactions</p>
                    </div>
                    <Button onClick={fetchOnlinePayments} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                </div>
                                <CreditCard className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Successful</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.success}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Pending</p>
                                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
                                </div>
                                <Clock className="w-8 h-8 text-yellow-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Failed</p>
                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</p>
                                </div>
                                <XCircle className="w-8 h-8 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Amount</p>
                                    <p className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString('en-IN')}</p>
                                </div>
                                <CreditCard className="w-8 h-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[200px]">
                                <label className="text-sm font-medium mb-1 block">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, admission no, or transaction ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="w-[180px]">
                                <label className="text-sm font-medium mb-1 block">Status</label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="success">Success</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payments Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Online Payment Transactions</CardTitle>
                        <CardDescription>
                            Showing {filteredPayments.length} of {payments.length} transactions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : filteredPayments.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No online payments found</p>
                                {payments.length === 0 && (
                                    <p className="text-sm mt-2">Online payment records will appear here once transactions are made</p>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="p-3 text-left">Transaction ID</th>
                                            <th className="p-3 text-left">Date</th>
                                            <th className="p-3 text-left">Student</th>
                                            <th className="p-3 text-left">Fee Type</th>
                                            <th className="p-3 text-left">Mode</th>
                                            <th className="p-3 text-right">Amount</th>
                                            <th className="p-3 text-center">Status</th>
                                            <th className="p-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPayments.map((payment) => (
                                            <tr key={payment.id} className="border-b hover:bg-muted/50">
                                                <td className="p-3 font-mono text-xs">
                                                    {payment.transaction_id || '-'}
                                                </td>
                                                <td className="p-3">
                                                    {payment.payment_date ? format(new Date(payment.payment_date), 'dd MMM yyyy') : '-'}
                                                </td>
                                                <td className="p-3">
                                                    <div>
                                                        <p className="font-medium">
                                                            {payment.student?.first_name} {payment.student?.last_name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {payment.student?.school_code}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    {payment.fee_master?.name || '-'}
                                                </td>
                                                <td className="p-3">
                                                    <Badge variant="outline" className="uppercase text-xs">
                                                        {payment.payment_mode}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-right font-medium">
                                                    ₹{(payment.amount_paid || 0).toLocaleString('en-IN')}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {getStatusBadge(payment.status)}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => viewDetails(payment)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payment Details Dialog */}
                <Dialog open={showDetails} onOpenChange={setShowDetails}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Payment Details</DialogTitle>
                            <DialogDescription>
                                Transaction information
                            </DialogDescription>
                        </DialogHeader>
                        {selectedPayment && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Transaction ID</p>
                                        <p className="font-mono text-sm">{selectedPayment.transaction_id || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Status</p>
                                        <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Student</p>
                                        <p className="font-medium">
                                            {selectedPayment.student?.first_name} {selectedPayment.student?.last_name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Admission No</p>
                                        <p>{selectedPayment.student?.school_code || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Fee Type</p>
                                        <p>{selectedPayment.fee_master?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Payment Mode</p>
                                        <Badge variant="outline" className="uppercase">
                                            {selectedPayment.payment_mode}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Amount Paid</p>
                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                            ₹{(selectedPayment.amount_paid || 0).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Payment Date</p>
                                        <p>
                                            {selectedPayment.payment_date 
                                                ? format(new Date(selectedPayment.payment_date), 'dd MMM yyyy, hh:mm a')
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                {selectedPayment.remarks && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Remarks</p>
                                        <p className="text-sm bg-muted p-2 rounded">{selectedPayment.remarks}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default OnlinePayment;
