import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { 
    Loader2, Search, CheckCircle2, XCircle, Clock, Eye, ExternalLink,
    IndianRupee, User, FileText, Calendar, CreditCard, Phone, Building2,
    ArrowLeft, RefreshCw, Filter, Download, AlertTriangle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { generateTransactionId } from '@/lib/transactionUtils';

/**
 * 🏦 OFFLINE BANK PAYMENTS
 * 
 * ಈ page ನಲ್ಲಿ Parents bank transfer ಮೂಲಕ pay ಮಾಡಿದ fees ನ
 * Admin review ಮತ್ತು approve/reject ಮಾಡಬಹುದು.
 * 
 * Flow:
 * 1. Parent pays via Bank Transfer (NEFT/IMPS/UPI)
 * 2. Parent uploads receipt in mobile app / parent portal
 * 3. Admin reviews submission here
 * 4. On Approve → fee_payment record created
 * 5. On Reject → reason given, parent notified
 */

const OfflineBankPayments = () => {
    const navigate = useNavigate();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    const currencySymbol = '₹';

    // State
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');
    const [searchKeyword, setSearchKeyword] = useState('');
    
    // View payment detail
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    
    // Approve/Reject dialogs
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    
    // Stats
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
        totalPending: 0
    });

    // Fetch payments
    const fetchPayments = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        
        try {
            const { data, error } = await supabase
                .from('offline_bank_payments')
                .select(`
                    *,
                    student:student_id(
                        id, full_name, school_code, phone, photo_url,
                        classes!student_profiles_class_id_fkey(name),
                        sections!student_profiles_section_id_fkey(name)
                    )
                `)
                .eq('branch_id', branchId)
                .eq('session_id', currentSessionId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            setPayments(data || []);
            
            // Calculate stats
            const pending = (data || []).filter(p => p.status === 'pending');
            const approved = (data || []).filter(p => p.status === 'approved');
            const rejected = (data || []).filter(p => p.status === 'rejected');
            
            setStats({
                pending: pending.length,
                approved: approved.length,
                rejected: rejected.length,
                totalPending: pending.reduce((sum, p) => sum + Number(p.amount || 0), 0)
            });
        } catch (error) {
            console.error('Error fetching payments:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load payments' });
        } finally {
            setLoading(false);
        }
    }, [branchId, toast]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    // Filter payments by tab and search
    const filteredPayments = payments.filter(p => {
        // Tab filter
        if (activeTab !== 'all' && p.status !== activeTab) return false;
        
        // Search filter
        if (searchKeyword) {
            const keyword = searchKeyword.toLowerCase();
            const studentName = p.student?.full_name?.toLowerCase() || '';
            const admNo = p.student?.school_code?.toLowerCase() || '';
            const refNo = p.reference_no?.toLowerCase() || '';
            
            if (!studentName.includes(keyword) && !admNo.includes(keyword) && !refNo.includes(keyword)) {
                return false;
            }
        }
        
        return true;
    });

    // View payment details
    const handleView = (payment) => {
        setSelectedPayment(payment);
        setViewDialogOpen(true);
    };

    // Approve payment
    const handleApprove = async () => {
        if (!selectedPayment) return;
        setActionLoading(true);
        
        try {
            // 1. Update offline_bank_payments status
            const { error: updateError } = await supabase
                .from('offline_bank_payments')
                .update({ 
                    status: 'approved',
                    approved_at: new Date().toISOString(),
                    approved_by: user?.id
                })
                .eq('id', selectedPayment.id);
            
            if (updateError) throw updateError;
            
            // 2. Create fee_payment record (for academic fee)
            const txnId = generateTransactionId('BNK');
            
            // First check if student has any pending fee allocations
            const { data: allocations } = await supabase
                .from('student_fee_allocations')
                .select('id, fee_master_id, fee_master:fee_masters(amount)')
                .eq('student_id', selectedPayment.student_id)
                .eq('branch_id', branchId)
                .eq('session_id', currentSessionId);
            
            // Get payments already made
            const { data: existingPayments } = await supabase
                .from('fee_payments')
                .select('fee_master_id, amount')
                .eq('student_id', selectedPayment.student_id)
                .eq('branch_id', branchId)
                .eq('session_id', currentSessionId)
                .is('reverted_at', null);
            
            // Find fee master with balance
            let targetFeeMasterId = null;
            if (allocations && allocations.length > 0) {
                const paidAmounts = {};
                (existingPayments || []).forEach(p => {
                    paidAmounts[p.fee_master_id] = (paidAmounts[p.fee_master_id] || 0) + Number(p.amount);
                });
                
                // Find first allocation with remaining balance
                for (const alloc of allocations) {
                    const masterAmount = Number(alloc.fee_master?.amount || 0);
                    const paidForThis = paidAmounts[alloc.fee_master_id] || 0;
                    if (masterAmount > paidForThis) {
                        targetFeeMasterId = alloc.fee_master_id;
                        break;
                    }
                }
            }
            
            // Create the fee payment record
            const paymentRecord = {
                student_id: selectedPayment.student_id,
                branch_id: branchId,
                session_id: currentSessionId,
                organization_id: organizationId,
                amount: Number(selectedPayment.amount),
                payment_mode: selectedPayment.payment_mode || 'Bank Transfer',
                payment_date: selectedPayment.payment_date || new Date().toISOString().split('T')[0],
                transaction_id: txnId,
                note: `Offline Bank Payment - Ref: ${selectedPayment.reference_no || 'N/A'}`,
                collected_by: user?.id
            };
            
            if (targetFeeMasterId) {
                paymentRecord.fee_master_id = targetFeeMasterId;
            }
            
            const { error: paymentError } = await supabase
                .from('fee_payments')
                .insert(paymentRecord);
            
            if (paymentError) {
                console.error('Payment insert error:', paymentError);
                // Don't throw - status already updated
            }
            
            toast({ 
                title: 'Payment Approved!', 
                description: `${currencySymbol}${selectedPayment.amount.toLocaleString('en-IN')} credited to student account` 
            });
            
            setApproveDialogOpen(false);
            setSelectedPayment(null);
            await fetchPayments();
            
        } catch (error) {
            console.error('Approve error:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setActionLoading(false);
        }
    };

    // Reject payment
    const handleReject = async () => {
        if (!selectedPayment || !rejectReason.trim()) {
            toast({ variant: 'destructive', title: 'Please provide rejection reason' });
            return;
        }
        setActionLoading(true);
        
        try {
            const { error } = await supabase
                .from('offline_bank_payments')
                .update({ 
                    status: 'rejected',
                    rejection_reason: rejectReason.trim(),
                    rejected_at: new Date().toISOString(),
                    rejected_by: user?.id
                })
                .eq('id', selectedPayment.id);
            
            if (error) throw error;
            
            toast({ 
                title: 'Payment Rejected', 
                description: 'Parent will be notified about the rejection' 
            });
            
            setRejectDialogOpen(false);
            setRejectReason('');
            setSelectedPayment(null);
            await fetchPayments();
            
        } catch (error) {
            console.error('Reject error:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setActionLoading(false);
        }
    };

    // Status badge
    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { label: 'Pending Review', variant: 'secondary', icon: Clock, color: 'text-yellow-600 dark:text-yellow-400' },
            approved: { label: 'Approved', variant: 'default', icon: CheckCircle2, color: 'text-green-600 dark:text-green-400' },
            rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle, color: 'text-red-600 dark:text-red-400' }
        };
        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;
        
        return (
            <Badge variant={config.variant} className="gap-1">
                <Icon className={`h-3 w-3 ${config.color}`} />
                {config.label}
            </Badge>
        );
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            return format(parseISO(dateStr), 'dd MMM yyyy');
        } catch {
            return dateStr;
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Offline Bank Payments</h1>
                            <p className="text-sm text-muted-foreground">
                                Review and approve bank transfer payments from parents
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={fetchPayments} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">PENDING</p>
                                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pending}</p>
                                </div>
                                <Clock className="h-8 w-8 text-yellow-500/50" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">APPROVED</p>
                                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.approved}</p>
                                </div>
                                <CheckCircle2 className="h-8 w-8 text-green-500/50" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">REJECTED</p>
                                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.rejected}</p>
                                </div>
                                <XCircle className="h-8 w-8 text-red-500/50" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">PENDING AMOUNT</p>
                                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                        {currencySymbol}{stats.totalPending.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <IndianRupee className="h-8 w-8 text-blue-500/50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs and Search */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                                <TabsList>
                                    <TabsTrigger value="pending" className="gap-2">
                                        <Clock className="h-4 w-4" />
                                        Pending ({stats.pending})
                                    </TabsTrigger>
                                    <TabsTrigger value="approved" className="gap-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Approved
                                    </TabsTrigger>
                                    <TabsTrigger value="rejected" className="gap-2">
                                        <XCircle className="h-4 w-4" />
                                        Rejected
                                    </TabsTrigger>
                                    <TabsTrigger value="all">All</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, admission no, ref..."
                                    value={searchKeyword}
                                    onChange={e => setSearchKeyword(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : filteredPayments.length === 0 ? (
                            <div className="text-center py-12">
                                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                <p className="text-muted-foreground">
                                    {activeTab === 'pending' 
                                        ? 'No pending payments to review' 
                                        : 'No payments found'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="p-3 text-left font-medium">Student</th>
                                            <th className="p-3 text-left font-medium">Amount</th>
                                            <th className="p-3 text-left font-medium">Payment Date</th>
                                            <th className="p-3 text-left font-medium">Reference No</th>
                                            <th className="p-3 text-left font-medium">Status</th>
                                            <th className="p-3 text-left font-medium">Submitted</th>
                                            <th className="p-3 text-center font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPayments.map((payment) => (
                                            <tr key={payment.id} className="border-b hover:bg-muted/30">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage src={payment.student?.photo_url} />
                                                            <AvatarFallback>
                                                                {payment.student?.full_name?.charAt(0) || '?'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">{payment.student?.full_name || 'Unknown'}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {payment.student?.school_code} • {payment.student?.classes?.name || ''} {payment.student?.sections?.name || ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <span className="font-bold text-green-600">
                                                        {currencySymbol}{Number(payment.amount || 0).toLocaleString('en-IN')}
                                                    </span>
                                                </td>
                                                <td className="p-3">{formatDate(payment.payment_date)}</td>
                                                <td className="p-3">
                                                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                                        {payment.reference_no || '-'}
                                                    </span>
                                                </td>
                                                <td className="p-3">{getStatusBadge(payment.status)}</td>
                                                <td className="p-3 text-muted-foreground">
                                                    {formatDate(payment.created_at)}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleView(payment)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        
                                                        {payment.status === 'pending' && (
                                                            <>
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                    onClick={() => {
                                                                        setSelectedPayment(payment);
                                                                        setApproveDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedPayment(payment);
                                                                        setRejectDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* View Payment Detail Dialog */}
                <AlertDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                    <AlertDialogContent className="max-w-lg">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Payment Details
                            </AlertDialogTitle>
                        </AlertDialogHeader>
                        
                        {selectedPayment && (
                            <div className="space-y-4">
                                {/* Student Info */}
                                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={selectedPayment.student?.photo_url} />
                                        <AvatarFallback>{selectedPayment.student?.full_name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{selectedPayment.student?.full_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedPayment.student?.school_code} • {selectedPayment.student?.classes?.name}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Payment Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Amount</Label>
                                        <p className="font-bold text-lg text-green-600">
                                            {currencySymbol}{Number(selectedPayment.amount || 0).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Payment Mode</Label>
                                        <p className="font-medium">{selectedPayment.payment_mode || 'Bank Transfer'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Payment Date</Label>
                                        <p className="font-medium">{formatDate(selectedPayment.payment_date)}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Reference No</Label>
                                        <p className="font-mono">{selectedPayment.reference_no || '-'}</p>
                                    </div>
                                </div>
                                
                                {/* Status */}
                                <div>
                                    <Label className="text-xs text-muted-foreground">Status</Label>
                                    <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                                </div>
                                
                                {/* Rejection Reason */}
                                {selectedPayment.status === 'rejected' && selectedPayment.rejection_reason && (
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                        <Label className="text-xs text-red-600">Rejection Reason</Label>
                                        <p className="text-sm text-red-700 dark:text-red-300">{selectedPayment.rejection_reason}</p>
                                    </div>
                                )}
                                
                                {/* Document Link */}
                                {selectedPayment.document_url && (
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Receipt/Document</Label>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-1"
                                            onClick={() => window.open(selectedPayment.document_url, '_blank')}
                                        >
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            View Document
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <AlertDialogFooter>
                            <AlertDialogCancel>Close</AlertDialogCancel>
                            {selectedPayment?.status === 'pending' && (
                                <>
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            setViewDialogOpen(false);
                                            setRejectDialogOpen(true);
                                        }}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject
                                    </Button>
                                    <Button
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => {
                                            setViewDialogOpen(false);
                                            setApproveDialogOpen(true);
                                        }}
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Approve
                                    </Button>
                                </>
                            )}
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Approve Confirmation Dialog */}
                <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="h-5 w-5" />
                                Approve Payment?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {selectedPayment && (
                                    <div className="space-y-2 mt-2">
                                        <p>You are about to approve this payment:</p>
                                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                            <p className="font-semibold">{selectedPayment.student?.full_name}</p>
                                            <p className="text-lg font-bold text-green-600">
                                                {currencySymbol}{Number(selectedPayment.amount || 0).toLocaleString('en-IN')}
                                            </p>
                                            <p className="text-sm text-muted-foreground">Ref: {selectedPayment.reference_no || '-'}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            This amount will be credited to the student's fee account.
                                        </p>
                                    </div>
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={handleApprove}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                )}
                                Confirm Approve
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Reject Dialog */}
                <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                <XCircle className="h-5 w-5" />
                                Reject Payment?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {selectedPayment && (
                                    <div className="space-y-4 mt-2">
                                        <div className="p-3 bg-muted rounded-lg">
                                            <p className="font-semibold">{selectedPayment.student?.full_name}</p>
                                            <p className="text-lg font-bold">
                                                {currencySymbol}{Number(selectedPayment.amount || 0).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        
                                        <div>
                                            <Label>Rejection Reason *</Label>
                                            <Textarea
                                                placeholder="Please provide reason for rejection..."
                                                value={rejectReason}
                                                onChange={e => setRejectReason(e.target.value)}
                                                className="mt-1"
                                                rows={3}
                                            />
                                        </div>
                                        
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                            Parent will be notified about the rejection.
                                        </p>
                                    </div>
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={actionLoading || !rejectReason.trim()}
                            >
                                {actionLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <XCircle className="mr-2 h-4 w-4" />
                                )}
                                Confirm Reject
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
};

export default OfflineBankPayments;
