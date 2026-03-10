import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, Smartphone, QrCode, Send, CheckCircle2, XCircle,
  Loader2, Search, IndianRupee, Clock, Copy, ExternalLink,
  RefreshCw, AlertTriangle, Check, Building2, User, Receipt,
  Wallet, Banknote, ArrowRight, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/dateUtils';
import api from '@/lib/api';

// ═══════════════════════════════════════════════════════════════════════════════
// ONLINE PAYMENT - Razorpay/PhonePe/UPI Integration
// Day 23 Implementation - Phase 3 Payment & Collection Engine
// ═══════════════════════════════════════════════════════════════════════════════

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const PAYMENT_STATUS = {
  created: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  captured: { label: 'Success', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: XCircle },
  refunded: { label: 'Refunded', color: 'bg-purple-100 text-purple-800', icon: RefreshCw },
};

// ─────────────────────────────────────────────────────────────────────────────────
// RAZORPAY CHECKOUT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────────

const RazorpayCheckout = ({ 
  orderId, 
  amount, 
  checkoutConfig, 
  onSuccess, 
  onFailure,
  studentName 
}) => {
  const [loading, setLoading] = useState(false);

  const initializePayment = () => {
    setLoading(true);
    
    // Check if Razorpay script is loaded
    if (typeof window.Razorpay === 'undefined') {
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => openCheckout();
      script.onerror = () => {
        setLoading(false);
        onFailure({ error: 'Failed to load Razorpay SDK' });
      };
      document.body.appendChild(script);
    } else {
      openCheckout();
    }
  };

  const openCheckout = () => {
    const options = {
      ...checkoutConfig,
      order_id: orderId,
      handler: function (response) {
        setLoading(false);
        onSuccess({
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature
        });
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      setLoading(false);
      onFailure(response.error);
    });
    rzp.open();
  };

  return (
    <Button 
      onClick={initializePayment} 
      disabled={loading}
      className="w-full bg-blue-600 hover:bg-blue-700"
      size="lg"
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="h-5 w-5 mr-2" />
          Pay {formatCurrency(amount)} with Razorpay
        </>
      )}
    </Button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────────

const OnlinePaymentGateway = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('pay');
  
  // Search & Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentFees, setStudentFees] = useState([]);
  
  // Payment State
  const [selectedFees, setSelectedFees] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [gatewayConfig, setGatewayConfig] = useState(null);
  
  // Transactions
  const [transactions, setTransactions] = useState([]);
  
  // Payment Link Dialog
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [paymentLink, setPaymentLink] = useState(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // FETCH DATA
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchGatewayConfig = useCallback(async () => {
    try {
      const response = await api.get('/payment-gateway/config', {
        params: { branchId, organizationId }
      });
      if (response.data?.success) {
        setGatewayConfig(response.data.data);
      }
    } catch (error) {
      console.error('Fetch gateway config error:', error);
    }
  }, [branchId, organizationId]);

  const searchStudents = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setStudents([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('id, full_name, school_code, class:class_id(name), father_phone')
        .eq('branch_id', branchId)
        .or(`full_name.ilike.%${query}%,school_code.ilike.%${query}%`)
        .limit(10);

      if (!error) setStudents(data || []);
    } catch (error) {
      console.error('Search students error:', error);
    }
  }, [branchId]);

  const fetchStudentFees = useCallback(async (studentId) => {
    if (!studentId) return;

    setLoading(true);
    try {
      // Get pending fee allocations
      const { data, error } = await supabase
        .from('student_fee_allocations')
        .select(`
          id,
          amount,
          paid,
          fee_type:fee_type_id (id, name),
          fee_group:fee_group_id (id, name)
        `)
        .eq('student_id', studentId)
        .eq('session_id', currentSessionId);

      if (error) throw error;

      // Calculate pending for each fee
      const pendingFees = (data || [])
        .map(fee => ({
          ...fee,
          pending: (fee.amount || 0) - (fee.paid || 0)
        }))
        .filter(fee => fee.pending > 0);

      setStudentFees(pendingFees);
    } catch (error) {
      console.error('Fetch student fees error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch fee details' });
    }
    setLoading(false);
  }, [currentSessionId, toast]);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await api.get('/payment-gateway/transactions', {
        params: { branchId, limit: 50 }
      });
      if (response.data?.success) {
        setTransactions(response.data.data || []);
      }
    } catch (error) {
      console.error('Fetch transactions error:', error);
    }
  }, [branchId]);

  useEffect(() => {
    if (branchId) {
      fetchGatewayConfig();
      fetchTransactions();
    }
  }, [branchId, fetchGatewayConfig, fetchTransactions]);

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setStudents([]);
    setSearchQuery('');
    setSelectedFees([]);
    setPaymentAmount(0);
    setPaymentOrder(null);
    fetchStudentFees(student.id);
  };

  const handleFeeToggle = (feeId) => {
    setSelectedFees(prev => {
      const updated = prev.includes(feeId) 
        ? prev.filter(id => id !== feeId)
        : [...prev, feeId];
      
      // Calculate total
      const total = studentFees
        .filter(f => updated.includes(f.id))
        .reduce((sum, f) => sum + f.pending, 0);
      setPaymentAmount(total);
      
      return updated;
    });
  };

  const handleSelectAll = () => {
    if (selectedFees.length === studentFees.length) {
      setSelectedFees([]);
      setPaymentAmount(0);
    } else {
      const all = studentFees.map(f => f.id);
      setSelectedFees(all);
      setPaymentAmount(studentFees.reduce((sum, f) => sum + f.pending, 0));
    }
  };

  const handleInitiatePayment = async () => {
    if (!selectedStudent || !paymentAmount || paymentAmount <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select fees to pay' });
      return;
    }

    setProcessing(true);
    try {
      const feeDetails = studentFees
        .filter(f => selectedFees.includes(f.id))
        .map(f => ({
          allocationId: f.id,
          feeType: f.fee_type?.name,
          amount: f.pending
        }));

      const response = await api.post('/payment-gateway/create-order', {
        studentId: selectedStudent.id,
        branchId,
        sessionId: currentSessionId,
        organizationId,
        amount: paymentAmount,
        feeDetails,
        gateway: 'razorpay'
      });

      if (response.data?.success) {
        setPaymentOrder(response.data.data);
        toast({ title: 'Order Created', description: 'Click Pay Now to complete payment' });
      } else {
        throw new Error(response.data?.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Initiate payment error:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setProcessing(false);
  };

  const handlePaymentSuccess = async (paymentResponse) => {
    setProcessing(true);
    try {
      const response = await api.post('/payment-gateway/verify', {
        ...paymentResponse,
        gateway: 'razorpay'
      });

      if (response.data?.success) {
        toast({
          title: '✅ Payment Successful!',
          description: `Payment ID: ${paymentResponse.paymentId}`,
        });
        
        // Reset state
        setPaymentOrder(null);
        setSelectedFees([]);
        setPaymentAmount(0);
        fetchStudentFees(selectedStudent.id);
        fetchTransactions();
      } else {
        throw new Error(response.data?.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setProcessing(false);
  };

  const handlePaymentFailure = (error) => {
    console.error('Payment failed:', error);
    toast({
      variant: 'destructive',
      title: 'Payment Failed',
      description: error.description || 'Please try again'
    });
    setPaymentOrder(null);
  };

  const handleCreatePaymentLink = async () => {
    if (!selectedStudent || !paymentAmount) {
      toast({ variant: 'destructive', title: 'Error', description: 'Select student and fees first' });
      return;
    }

    setProcessing(true);
    try {
      const response = await api.post('/payment-gateway/payment-link', {
        studentId: selectedStudent.id,
        branchId,
        organizationId,
        amount: paymentAmount,
        description: `Fee payment for ${selectedStudent.full_name}`,
        expiryDays: 7,
        notifyParent: true
      });

      if (response.data?.success) {
        setPaymentLink(response.data.data);
        setShowLinkDialog(true);
        toast({ title: 'Payment Link Created', description: 'Share with parent' });
      }
    } catch (error) {
      console.error('Create payment link error:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setProcessing(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Link copied to clipboard' });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="h-7 w-7 text-primary" />
              Online Payment Gateway
            </h1>
            <p className="text-muted-foreground">Collect fees via Razorpay, UPI, Cards & Netbanking</p>
          </div>
          <div className="flex items-center gap-2">
            {gatewayConfig?.razorpay?.enabled ? (
              <Badge className="bg-green-100 text-green-800">
                <Check className="h-3 w-3 mr-1" /> Razorpay Active
              </Badge>
            ) : (
              <Badge variant="outline" className="text-yellow-600">
                <AlertTriangle className="h-3 w-3 mr-1" /> Configure Gateway
              </Badge>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="pay">
              <Wallet className="h-4 w-4 mr-2" />
              Collect Payment
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <Receipt className="h-4 w-4 mr-2" />
              Transactions
            </TabsTrigger>
          </TabsList>

          {/* Collect Payment Tab */}
          <TabsContent value="pay" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Student Search & Fee Selection */}
              <div className="space-y-4">
                {/* Student Search */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Find Student
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Input
                        placeholder="Search by name or admission number..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          searchStudents(e.target.value);
                        }}
                      />
                      {students.length > 0 && (
                        <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-auto">
                          {students.map(student => (
                            <div
                              key={student.id}
                              className="p-3 hover:bg-muted cursor-pointer border-b last:border-0"
                              onClick={() => handleStudentSelect(student)}
                            >
                              <p className="font-medium">{student.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {student.school_code} • {student.class?.name}
                              </p>
                            </div>
                          ))}
                        </Card>
                      )}
                    </div>

                    {selectedStudent && (
                      <Alert className="bg-blue-50 border-blue-200">
                        <User className="h-4 w-4" />
                        <AlertDescription>
                          <span className="font-medium">{selectedStudent.full_name}</span>
                          <br />
                          <span className="text-sm">{selectedStudent.school_code} • {selectedStudent.class?.name}</span>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Fee Selection */}
                {selectedStudent && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Select Fees to Pay</CardTitle>
                        <Button variant="outline" size="sm" onClick={handleSelectAll}>
                          {selectedFees.length === studentFees.length ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : studentFees.length === 0 ? (
                        <Alert>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription>No pending fees for this student</AlertDescription>
                        </Alert>
                      ) : (
                        <div className="space-y-2">
                          {studentFees.map(fee => (
                            <div
                              key={fee.id}
                              className={cn(
                                "p-3 rounded-lg border cursor-pointer transition-all",
                                selectedFees.includes(fee.id)
                                  ? "border-primary bg-primary/5"
                                  : "hover:border-muted-foreground/50"
                              )}
                              onClick={() => handleFeeToggle(fee.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{fee.fee_type?.name || 'Fee'}</p>
                                  <p className="text-sm text-muted-foreground">{fee.fee_group?.name}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg">{formatCurrency(fee.pending)}</p>
                                  {selectedFees.includes(fee.id) && (
                                    <CheckCircle2 className="h-5 w-5 text-primary inline" />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right: Payment Summary & Checkout */}
              <div className="space-y-4">
                <Card className="sticky top-4">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <IndianRupee className="h-6 w-6" />
                      Payment Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {selectedStudent ? (
                      <>
                        {/* Student Info */}
                        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{selectedStudent.full_name}</p>
                            <p className="text-sm text-muted-foreground">{selectedStudent.school_code}</p>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">Amount to Pay</p>
                          <p className="text-4xl font-bold text-primary">{formatCurrency(paymentAmount)}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedFees.length} fee{selectedFees.length !== 1 ? 's' : ''} selected
                          </p>
                        </div>

                        <Separator />

                        {/* Payment Buttons */}
                        <div className="space-y-3">
                          {!paymentOrder ? (
                            <>
                              <Button
                                className="w-full"
                                size="lg"
                                onClick={handleInitiatePayment}
                                disabled={!paymentAmount || processing}
                              >
                                {processing ? (
                                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                ) : (
                                  <ArrowRight className="h-5 w-5 mr-2" />
                                )}
                                Proceed to Pay
                              </Button>
                              
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleCreatePaymentLink}
                                disabled={!paymentAmount || processing}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Create Payment Link
                              </Button>
                            </>
                          ) : (
                            <div className="space-y-4">
                              <Alert className="bg-green-50 border-green-200">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription>
                                  Order created! Order ID: {paymentOrder.orderId}
                                </AlertDescription>
                              </Alert>

                              <RazorpayCheckout
                                orderId={paymentOrder.orderId}
                                amount={paymentOrder.amount}
                                checkoutConfig={paymentOrder.checkoutConfig}
                                studentName={selectedStudent.full_name}
                                onSuccess={handlePaymentSuccess}
                                onFailure={handlePaymentFailure}
                              />

                              <Button
                                variant="ghost"
                                className="w-full"
                                onClick={() => setPaymentOrder(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Payment Methods */}
                        <div className="pt-4 border-t">
                          <p className="text-xs text-muted-foreground text-center mb-3">Accepted Payment Methods</p>
                          <div className="flex justify-center gap-4">
                            <div className="text-center">
                              <CreditCard className="h-6 w-6 mx-auto text-muted-foreground" />
                              <p className="text-xs mt-1">Cards</p>
                            </div>
                            <div className="text-center">
                              <Smartphone className="h-6 w-6 mx-auto text-muted-foreground" />
                              <p className="text-xs mt-1">UPI</p>
                            </div>
                            <div className="text-center">
                              <Building2 className="h-6 w-6 mx-auto text-muted-foreground" />
                              <p className="text-xs mt-1">NetBanking</p>
                            </div>
                            <div className="text-center">
                              <Wallet className="h-6 w-6 mx-auto text-muted-foreground" />
                              <p className="text-xs mt-1">Wallets</p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Search and select a student to collect payment</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Online Transactions</CardTitle>
                <CardDescription>Payment gateway transaction history</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Gateway</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No transactions yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((tx) => {
                        const status = PAYMENT_STATUS[tx.status] || PAYMENT_STATUS.created;
                        const StatusIcon = status.icon;
                        return (
                          <TableRow key={tx.id}>
                            <TableCell>{formatDate(tx.created_at)}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{tx.student?.full_name}</p>
                                <p className="text-sm text-muted-foreground">{tx.student?.school_code}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{tx.gateway}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {tx.gateway_payment_id || tx.gateway_order_id}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(tx.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge className={status.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payment Link Dialog */}
        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Payment Link Created
              </DialogTitle>
              <DialogDescription>
                Share this link with the parent to receive payment
              </DialogDescription>
            </DialogHeader>
            
            {paymentLink && (
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <p className="font-medium">Amount: {formatCurrency(paymentLink.amount)}</p>
                    <p className="text-sm">Expires: {formatDate(paymentLink.expiresAt)}</p>
                  </AlertDescription>
                </Alert>

                <div className="flex items-center gap-2">
                  <Input
                    value={paymentLink.shortUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(paymentLink.shortUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(paymentLink.shortUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      const text = `Pay school fees online: ${paymentLink.shortUrl}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                  >
                    Share on WhatsApp
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLinkDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default OnlinePaymentGateway;
