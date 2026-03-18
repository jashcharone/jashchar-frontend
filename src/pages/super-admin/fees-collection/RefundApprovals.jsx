import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
    Loader2, Undo2, CheckCircle, XCircle, Clock, Eye, Printer,
    User, IndianRupee, FileText, Bus, Building2, AlertTriangle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const RefundApprovals = () => {
    const navigate = useNavigate();
    const { roleSlug } = useParams();
    const basePath = roleSlug || 'super-admin';
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const currencySymbol = '₹';

    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');
    
    // Approval/Rejection dialog
    const [selectedRefund, setSelectedRefund] = useState(null);
    const [actionType, setActionType] = useState(''); // 'approve', 'reject', 'complete'
    const [rejectionReason, setRejectionReason] = useState('');
    const [refundReferenceNumber, setRefundReferenceNumber] = useState('');

    const fetchRefunds = useCallback(async () => {
        if (!selectedBranch?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('fee_refunds')
                .select('*')
                .eq('branch_id', selectedBranch.id)
                .eq('session_id', currentSessionId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // Fetch student names for each refund
            const studentIds = [...new Set((data || []).map(r => r.student_id))];
            let studentMap = {};
            if (studentIds.length > 0) {
                const { data: students } = await supabase
                    .from('student_profiles')
                    .select('id, full_name, school_code, class_id, classes!student_profiles_class_id_fkey(name), sections!student_profiles_section_id_fkey(name)')
                    .in('id', studentIds)
                    .eq('branch_id', selectedBranch.id);
                
                (students || []).forEach(s => {
                    studentMap[s.id] = s;
                });
            }

            // Enrich refunds with student data
            const enriched = (data || []).map(r => ({
                ...r,
                student: studentMap[r.student_id] || null
            }));
            
            setRefunds(enriched);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [selectedBranch?.id, toast]);

    useEffect(() => {
        fetchRefunds();
    }, [fetchRefunds]);

    const handleAction = async () => {
        if (!selectedRefund) return;
        setActionLoading(true);
        
        try {
            let updateData = {};
            
            if (actionType === 'approve') {
                updateData = {
                    status: 'approved',
                    approved_by: user.id,
                    approved_at: new Date().toISOString()
                };
            } else if (actionType === 'reject') {
                if (!rejectionReason) {
                    toast({ variant: 'destructive', title: 'Reason required', description: 'Please enter a rejection reason.' });
                    setActionLoading(false);
                    return;
                }
                updateData = {
                    status: 'rejected',
                    rejected_at: new Date().toISOString(),
                    rejection_reason: rejectionReason
                };
            } else if (actionType === 'complete') {
                updateData = {
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    reference_number: refundReferenceNumber || null
                };
            }

            const { error } = await supabase
                .from('fee_refunds')
                .update(updateData)
                .eq('id', selectedRefund.id);

            if (error) throw error;

            const actionLabel = actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'completed';
            toast({ title: `Refund ${actionLabel} successfully!` });
            
            setSelectedRefund(null);
            setActionType('');
            setRejectionReason('');
            setRefundReferenceNumber('');
            await fetchRefunds();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Action failed', description: error.message });
        } finally {
            setActionLoading(false);
        }
    };

    const getRefundTypeIcon = (type) => {
        switch (type) {
            case 'transport': return <Bus className="h-4 w-4 text-blue-600" />;
            case 'hostel': return <Building2 className="h-4 w-4 text-purple-600" />;
            default: return <FileText className="h-4 w-4 text-green-600" />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <Badge variant="warning" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
            case 'approved': return <Badge variant="default" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
            case 'completed': return <Badge variant="success" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
            case 'rejected': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredRefunds = refunds.filter(r => {
        if (activeTab === 'all') return true;
        return r.status === activeTab;
    });

    const counts = {
        pending: refunds.filter(r => r.status === 'pending').length,
        approved: refunds.filter(r => r.status === 'approved').length,
        completed: refunds.filter(r => r.status === 'completed').length,
        rejected: refunds.filter(r => r.status === 'rejected').length,
        all: refunds.length
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                    <span className="ml-2">Loading refund requests...</span>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Undo2 className="h-6 w-6 text-orange-600" />
                        Fee Refund Approvals
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Review and approve/reject fee refund requests
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{counts.pending}</p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400">Pending</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{counts.approved}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">Approved</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{counts.completed}</p>
                            <p className="text-xs text-green-600 dark:text-green-400">Completed</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-red-700 dark:text-red-400">{counts.rejected}</p>
                            <p className="text-xs text-red-600 dark:text-red-400">Rejected</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold">{counts.all}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs & Table */}
                <Card>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <CardHeader className="pb-0">
                            <TabsList>
                                <TabsTrigger value="pending" className="gap-1">
                                    <Clock className="h-4 w-4" />Pending
                                    {counts.pending > 0 && <Badge variant="destructive" className="ml-1 h-5 px-1.5">{counts.pending}</Badge>}
                                </TabsTrigger>
                                <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
                                <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
                                <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
                                <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
                            </TabsList>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="p-3 text-left font-medium">Date</th>
                                            <th className="p-3 text-left font-medium">Student</th>
                                            <th className="p-3 text-left font-medium">Type</th>
                                            <th className="p-3 text-left font-medium">Transaction</th>
                                            <th className="p-3 text-left font-medium">Reason</th>
                                            <th className="p-3 text-right font-medium">Original Paid</th>
                                            <th className="p-3 text-right font-medium">Refund Amount</th>
                                            <th className="p-3 text-center font-medium">Mode</th>
                                            <th className="p-3 text-center font-medium">Status</th>
                                            <th className="p-3 text-center font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRefunds.length > 0 ? filteredRefunds.map(refund => (
                                            <tr key={refund.id} className="border-b hover:bg-muted/30">
                                                <td className="p-3">{format(parseISO(refund.created_at), 'dd MMM yyyy')}</td>
                                                <td className="p-3">
                                                    <div>
                                                        <p className="font-medium">{refund.student?.full_name || 'Unknown'}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {refund.student?.school_code} • {refund.student?.classes?.name || ''}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-1">
                                                        {getRefundTypeIcon(refund.refund_type)}
                                                        <span className="capitalize">{refund.refund_type}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <code className="text-xs bg-muted px-2 py-0.5 rounded">{refund.transaction_id || '-'}</code>
                                                </td>
                                                <td className="p-3 text-muted-foreground text-xs max-w-[150px] truncate">{refund.refund_reason}</td>
                                                <td className="p-3 text-right font-mono">{currencySymbol}{Number(refund.original_total_paid || 0).toLocaleString('en-IN')}</td>
                                                <td className="p-3 text-right font-mono font-bold text-orange-600">{currencySymbol}{Number(refund.refund_amount || 0).toLocaleString('en-IN')}</td>
                                                <td className="p-3 text-center">
                                                    <Badge variant="outline">{refund.refund_mode}</Badge>
                                                </td>
                                                <td className="p-3 text-center">
                                                    {getStatusBadge(refund.status)}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex justify-center gap-1">
                                                        {refund.status === 'pending' && (
                                                            <>
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm" 
                                                                    className="text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                                                                    onClick={() => { setSelectedRefund(refund); setActionType('approve'); }}
                                                                >
                                                                    <CheckCircle className="h-3 w-3" />
                                                                </Button>
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm" 
                                                                    className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                                    onClick={() => { setSelectedRefund(refund); setActionType('reject'); }}
                                                                >
                                                                    <XCircle className="h-3 w-3" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        {refund.status === 'approved' && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                                                onClick={() => { setSelectedRefund(refund); setActionType('complete'); }}
                                                            >
                                                                <IndianRupee className="h-3 w-3 mr-1" />Complete
                                                            </Button>
                                                        )}
                                                        {refund.status === 'completed' && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => navigate(`/${basePath}/fees-collection/print-receipt/refund/${refund.id}`)}
                                                            >
                                                                <Printer className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                        {refund.status === 'rejected' && refund.rejection_reason && (
                                                            <span className="text-xs text-red-500 italic max-w-[100px] truncate" title={refund.rejection_reason}>
                                                                {refund.rejection_reason}
                                                            </span>
                                                        )}
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            onClick={() => navigate(`/${basePath}/fees-collection/student-fees/${refund.student_id}`)}
                                                        >
                                                            <Eye className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="10" className="p-8 text-center text-muted-foreground">
                                                    No {activeTab !== 'all' ? activeTab : ''} refund requests found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Tabs>
                </Card>
            </div>

            {/* Action Dialog */}
            <AlertDialog open={!!selectedRefund && !!actionType} onOpenChange={() => { setSelectedRefund(null); setActionType(''); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className={`flex items-center gap-2 ${
                            actionType === 'approve' ? 'text-green-600' : 
                            actionType === 'reject' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                            {actionType === 'approve' && <><CheckCircle className="h-5 w-5" />Approve Refund</>}
                            {actionType === 'reject' && <><XCircle className="h-5 w-5" />Reject Refund</>}
                            {actionType === 'complete' && <><IndianRupee className="h-5 w-5" />Complete Refund</>}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionType === 'approve' && `Approve refund of ${currencySymbol}${Number(selectedRefund?.refund_amount || 0).toLocaleString('en-IN')} for ${selectedRefund?.student?.full_name || 'student'}?`}
                            {actionType === 'reject' && `Reject this refund request? Please provide a reason.`}
                            {actionType === 'complete' && `Mark refund as completed (money has been given to parent/student).`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {selectedRefund && (
                        <div className="py-2 space-y-3">
                            <div className="bg-muted/50 rounded p-3 space-y-1 text-sm">
                                <div className="flex justify-between"><span>Student</span><span className="font-medium">{selectedRefund.student?.full_name}</span></div>
                                <div className="flex justify-between"><span>Type</span><span className="capitalize font-medium">{selectedRefund.refund_type} Fee</span></div>
                                <div className="flex justify-between"><span>Amount</span><span className="font-bold text-orange-600">{currencySymbol}{Number(selectedRefund.refund_amount).toLocaleString('en-IN')}</span></div>
                                <div className="flex justify-between"><span>Reason</span><span>{selectedRefund.refund_reason}</span></div>
                            </div>

                            {actionType === 'reject' && (
                                <div className="space-y-1">
                                    <Label>Rejection Reason <span className="text-red-500">*</span></Label>
                                    <Textarea
                                        value={rejectionReason}
                                        onChange={e => setRejectionReason(e.target.value)}
                                        placeholder="Enter reason for rejecting this refund..."
                                        rows={2}
                                    />
                                </div>
                            )}

                            {actionType === 'complete' && (
                                <div className="space-y-1">
                                    <Label>Reference Number (Optional)</Label>
                                    <Input
                                        value={refundReferenceNumber}
                                        onChange={e => setRefundReferenceNumber(e.target.value)}
                                        placeholder="Cheque no. / UTR / Receipt no."
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button
                            onClick={handleAction}
                            disabled={actionLoading || (actionType === 'reject' && !rejectionReason)}
                            className={
                                actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                                actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                                'bg-blue-600 hover:bg-blue-700'
                            }
                        >
                            {actionLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                            {actionType === 'approve' && 'Approve Refund'}
                            {actionType === 'reject' && 'Reject Refund'}
                            {actionType === 'complete' && 'Mark as Completed'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
};

export default RefundApprovals;
