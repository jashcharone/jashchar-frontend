/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PARENT PAYMENT PORTAL
 * Day 26 Implementation - Fee Collection Phase 3
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Parent login to view pending fees
 * - Multiple child support
 * - Online payment via Razorpay/UPI
 * - Payment history & receipts
 * - Fee breakdown view
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  GraduationCap, 
  IndianRupee,
  CreditCard,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Download,
  Receipt,
  Loader2,
  FileText,
  ArrowRight,
  User,
  School,
  QrCode
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDate, formatDateTime } from '@/utils/dateUtils';

export default function ParentPaymentPortal() {
  const { user, organizationId } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [pendingFees, setPendingFees] = useState([]);
  const [selectedFees, setSelectedFees] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [totalDue, setTotalDue] = useState(0);
  const [selectedAmount, setSelectedAmount] = useState(0);
  
  // Payment state
  const [processing, setProcessing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  // Load parent's children
  useEffect(() => {
    loadChildren();
  }, [user]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      
      // Get parent's linked students
      const { data, error } = await supabase
        .from('parent_student_links')
        .select(`
          id,
          relationship,
          student:student_id(
            id,
            full_name,
            school_code,
            class_id,
            section_id,
            branch_id,
            session_id,
            classes(name),
            sections(name),
            branches(branch_name)
          )
        `)
        .eq('parent_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      const studentList = (data || [])
        .filter(link => link.student)
        .map(link => ({
          ...link.student,
          relationship: link.relationship
        }));

      setChildren(studentList);
      
      // Auto-select first child
      if (studentList.length > 0) {
        selectChild(studentList[0]);
      }
    } catch (error) {
      console.error('Error loading children:', error);
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const selectChild = async (child) => {
    setSelectedChild(child);
    setSelectedFees([]);
    setSelectedAmount(0);
    
    await Promise.all([
      loadPendingFees(child),
      loadPaymentHistory(child)
    ]);
  };

  const loadPendingFees = async (child) => {
    try {
      const { data, error } = await supabase
        .from('fee_details')
        .select(`
          id,
          fee_structure:fee_structure_id(
            id,
            fee_type:fee_type_id(name, description),
            amount,
            due_date
          ),
          amount,
          discount_amount,
          final_amount,
          paid_amount,
          balance,
          due_date,
          status,
          late_fee
        `)
        .eq('student_id', child.id)
        .eq('branch_id', child.branch_id)
        .eq('session_id', child.session_id)
        .in('status', ['pending', 'partial'])
        .order('due_date', { ascending: true });

      if (error) throw error;

      setPendingFees(data || []);
      
      // Calculate total due
      const total = (data || []).reduce((sum, fee) => sum + (fee.balance || 0), 0);
      setTotalDue(total);
    } catch (error) {
      console.error('Error loading fees:', error);
      toast.error('Failed to load fee details');
    }
  };

  const loadPaymentHistory = async (child) => {
    try {
      const { data, error } = await supabase
        .from('fee_transactions')
        .select(`
          id,
          transaction_id,
          amount,
          payment_method,
          status,
          receipt_number,
          created_at,
          gateway_transaction_id
        `)
        .eq('student_id', child.id)
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPaymentHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  // Toggle fee selection
  const toggleFeeSelection = (fee) => {
    const isSelected = selectedFees.some(f => f.id === fee.id);
    let newSelection;
    
    if (isSelected) {
      newSelection = selectedFees.filter(f => f.id !== fee.id);
    } else {
      newSelection = [...selectedFees, fee];
    }
    
    setSelectedFees(newSelection);
    const amount = newSelection.reduce((sum, f) => sum + (f.balance || 0), 0);
    setSelectedAmount(amount);
  };

  // Select all fees
  const selectAllFees = () => {
    if (selectedFees.length === pendingFees.length) {
      setSelectedFees([]);
      setSelectedAmount(0);
    } else {
      setSelectedFees([...pendingFees]);
      setSelectedAmount(totalDue);
    }
  };

  // Initiate payment
  const initiatePayment = async () => {
    if (selectedFees.length === 0) {
      toast.error('Please select at least one fee to pay');
      return;
    }

    if (paymentMethod === 'razorpay') {
      await initiateRazorpayPayment();
    } else {
      toast.info('UPI payment - please use QR code at school counter');
    }
  };

  // Razorpay payment
  const initiateRazorpayPayment = async () => {
    try {
      setProcessing(true);

      // Create order via backend
      const response = await fetch('/api/v1/payment-gateway/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          student_id: selectedChild.id,
          amount: selectedAmount,
          fee_details: selectedFees.map(f => f.id),
          branch_id: selectedChild.branch_id,
          session_id: selectedChild.session_id
        })
      });

      const orderData = await response.json();
      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Open Razorpay checkout
      const options = {
        key: orderData.data.razorpay_key,
        amount: orderData.data.amount * 100,
        currency: 'INR',
        name: selectedChild.branches?.branch_name || 'School Fees',
        description: `Fee payment for ${selectedChild.full_name}`,
        order_id: orderData.data.order_id,
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        notes: {
          student_id: selectedChild.id,
          student_name: selectedChild.full_name,
          school_code: selectedChild.school_code,
          fee_details: selectedFees.map(f => f.id).join(',')
        },
        theme: {
          color: '#7C3AED'
        },
        handler: async function (response) {
          await handlePaymentSuccess(response, orderData.data.order_id);
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
            toast.info('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment');
      setProcessing(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (response, orderId) => {
    try {
      // Verify payment
      const verifyResponse = await fetch('/api/v1/payment-gateway/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        })
      });

      const result = await verifyResponse.json();
      
      if (result.success) {
        toast.success('Payment successful! Receipt will be sent to your email.');
        setShowPaymentDialog(false);
        
        // Reload data
        await selectChild(selectedChild);
      } else {
        throw new Error(result.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Payment verification failed. Please contact school if amount was deducted.');
    } finally {
      setProcessing(false);
    }
  };

  // Download receipt
  const downloadReceipt = async (transaction) => {
    toast.info('Downloading receipt...');
    // TODO: Implement receipt download
  };

  // Get overdue status
  const getOverdueStatus = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: 'overdue', label: `${Math.abs(diffDays)} days overdue`, variant: 'destructive' };
    } else if (diffDays <= 7) {
      return { status: 'due-soon', label: `Due in ${diffDays} days`, variant: 'warning' };
    } else {
      return { status: 'upcoming', label: `Due in ${diffDays} days`, variant: 'secondary' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Students Found</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Your account is not linked to any students. Please contact the school 
              administration to link your ward to your account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Fee Payment Portal</h1>
        <p className="text-muted-foreground">
          View and pay your ward's school fees online
        </p>
      </div>

      {/* Child Selection */}
      {children.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Select Student</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {children.map((child) => (
                <Button
                  key={child.id}
                  variant={selectedChild?.id === child.id ? 'default' : 'outline'}
                  className="gap-2"
                  onClick={() => selectChild(child)}
                >
                  <GraduationCap className="h-4 w-4" />
                  {child.full_name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedChild && (
        <>
          {/* Student Info Card */}
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{selectedChild.full_name}</h2>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      <span>{selectedChild.school_code}</span>
                      <span>•</span>
                      <span>{selectedChild.classes?.name} {selectedChild.sections?.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedChild.branches?.branch_name}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total Pending</div>
                  <div className="text-2xl font-bold text-destructive flex items-center justify-end gap-1">
                    <IndianRupee className="h-5 w-5" />
                    {totalDue.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Pending Fees ({pendingFees.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <Receipt className="h-4 w-4" />
                Payment History
              </TabsTrigger>
            </TabsList>

            {/* Pending Fees Tab */}
            <TabsContent value="pending" className="mt-4 space-y-4">
              {pendingFees.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                    <h3 className="text-xl font-semibold text-green-600">All Fees Paid!</h3>
                    <p className="text-muted-foreground">
                      No pending fees for this academic session
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Fee List */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Select Fees to Pay</CardTitle>
                        <Button variant="link" size="sm" onClick={selectAllFees}>
                          {selectedFees.length === pendingFees.length ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {pendingFees.map((fee) => {
                        const overdueInfo = getOverdueStatus(fee.due_date);
                        const isSelected = selectedFees.some(f => f.id === fee.id);
                        
                        return (
                          <div
                            key={fee.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              isSelected ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                            }`}
                            onClick={() => toggleFeeSelection(fee)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <Checkbox checked={isSelected} className="mt-1" />
                                <div>
                                  <div className="font-medium">
                                    {fee.fee_structure?.fee_type?.name || 'Fee'}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Due: {formatDate(fee.due_date)}
                                  </div>
                                  {fee.fee_structure?.fee_type?.description && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {fee.fee_structure.fee_type.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant={overdueInfo.variant} className="mb-1">
                                  {overdueInfo.label}
                                </Badge>
                                <div className="font-semibold text-lg">
                                  ₹{fee.balance?.toLocaleString('en-IN')}
                                </div>
                                {fee.paid_amount > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    Paid: ₹{fee.paid_amount?.toLocaleString('en-IN')}
                                  </div>
                                )}
                                {fee.late_fee > 0 && (
                                  <div className="text-xs text-destructive">
                                    + ₹{fee.late_fee} late fee
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Payment Summary */}
                  {selectedFees.length > 0 && (
                    <Card className="border-primary">
                      <CardContent className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">
                              {selectedFees.length} fee(s) selected
                            </div>
                            <div className="text-2xl font-bold flex items-center gap-1">
                              <IndianRupee className="h-5 w-5" />
                              {selectedAmount.toLocaleString('en-IN')}
                            </div>
                          </div>
                          <Button
                            size="lg"
                            className="gap-2"
                            onClick={() => setShowPaymentDialog(true)}
                          >
                            <CreditCard className="h-5 w-5" />
                            Pay Now
                            <ArrowRight className="h-5 w-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* Payment History Tab */}
            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No payment history found
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paymentHistory.map((txn) => (
                        <div
                          key={txn.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium">
                                ₹{txn.amount?.toLocaleString('en-IN')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatDateTime(txn.created_at)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Receipt: {txn.receipt_number || txn.transaction_id}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {txn.payment_method?.toUpperCase()}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => downloadReceipt(txn)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Payment Method Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Payment Method</DialogTitle>
            <DialogDescription>
              Choose how you want to pay ₹{selectedAmount.toLocaleString('en-IN')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {/* Razorpay */}
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                paymentMethod === 'razorpay' ? 'border-primary bg-primary/5' : 'hover:bg-accent'
              }`}
              onClick={() => setPaymentMethod('razorpay')}
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Cards / Net Banking / UPI</div>
                  <div className="text-sm text-muted-foreground">
                    Pay via Razorpay secure checkout
                  </div>
                </div>
              </div>
            </div>

            {/* UPI QR */}
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'hover:bg-accent'
              }`}
              onClick={() => setPaymentMethod('upi')}
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <QrCode className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">UPI QR Code</div>
                  <div className="text-sm text-muted-foreground">
                    Scan QR with any UPI app (No fees)
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your payment is secured via 256-bit SSL encryption
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={initiatePayment}
              disabled={processing}
              className="gap-2"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Continue to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
