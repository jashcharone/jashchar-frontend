/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UPI QR PAYMENT COMPONENT
 * Day 24 Implementation - Fee Collection Phase 3
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - UPI QR Code generation for fee collection
 * - Multiple UPI app support
 * - Copy UPI ID functionality
 * - Payment status polling
 * - Mobile deep links
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  QrCode, 
  Copy, 
  Check, 
  Smartphone, 
  RefreshCw, 
  Clock, 
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Share2,
  Wallet
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { formatDate } from '@/utils/dateUtils';

// UPI Apps configuration
const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', package: 'com.google.android.apps.nbu.paisa.user', color: '#4285F4' },
  { id: 'phonepe', name: 'PhonePe', package: 'com.phonepe.app', color: '#5F259F' },
  { id: 'paytm', name: 'Paytm', package: 'net.one97.paytm', color: '#00BAF2' },
  { id: 'bhim', name: 'BHIM', package: 'in.org.npci.upiapp', color: '#00875A' },
  { id: 'amazonpay', name: 'Amazon Pay', package: 'in.amazon.mShop.android.shopping', color: '#FF9900' },
  { id: 'cred', name: 'CRED', package: 'com.dreamplug.androidapp', color: '#1B1B1B' }
];

export default function UPIPayment() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;

  // State
  const [loading, setLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pendingFees, setPendingFees] = useState([]);
  const [selectedFees, setSelectedFees] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // UPI State
  const [upiConfig, setUpiConfig] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [upiString, setUpiString] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, success, failed
  const [polling, setPolling] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Dialog state
  const [showQrDialog, setShowQrDialog] = useState(false);

  // Load UPI configuration
  useEffect(() => {
    loadUPIConfig();
  }, [branchId, organizationId]);

  const loadUPIConfig = async () => {
    try {
      // Try to get org-level config first, then branch-level
      const { data, error } = await supabase
        .from('fee_payment_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (data) {
        setUpiConfig({
          upiId: data.upi_id || 'school@paytm',
          payeeName: data.upi_payee_name || selectedBranch?.name || 'School Fees',
          merchantCode: data.merchant_category_code || '8220'
        });
      } else {
        // Default config
        setUpiConfig({
          upiId: 'school@paytm',
          payeeName: selectedBranch?.name || 'School Fees',
          merchantCode: '8220'
        });
      }
    } catch (error) {
      console.error('Error loading UPI config:', error);
      // Use default
      setUpiConfig({
        upiId: 'school@paytm',
        payeeName: selectedBranch?.name || 'School Fees',
        merchantCode: '8220'
      });
    }
  };

  // Search students
  const searchStudents = useCallback(async () => {
    if (!studentSearch || studentSearch.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select(`
          id,
          full_name,
          school_code,
          class_id,
          section_id,
          classes!inner(name),
          sections(name)
        `)
        .eq('branch_id', branchId)
        .eq('session_id', currentSessionId)
        .or(`full_name.ilike.%${studentSearch}%,school_code.ilike.%${studentSearch}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching students:', error);
      toast.error('Failed to search students');
    } finally {
      setLoading(false);
    }
  }, [studentSearch, branchId, currentSessionId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch, searchStudents]);

  // Select student and load pending fees
  const selectStudent = async (student) => {
    setSelectedStudent(student);
    setStudentSearch('');
    setSearchResults([]);
    setSelectedFees([]);
    setTotalAmount(0);

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fee_details')
        .select(`
          id,
          fee_structure:fee_structure_id(
            id,
            fee_type:fee_type_id(name),
            amount,
            due_date
          ),
          amount,
          discount_amount,
          final_amount,
          paid_amount,
          balance,
          due_date,
          status
        `)
        .eq('student_id', student.id)
        .eq('branch_id', branchId)
        .eq('session_id', currentSessionId)
        .in('status', ['pending', 'partial']);

      if (error) throw error;
      setPendingFees(data || []);
    } catch (error) {
      console.error('Error loading fees:', error);
      toast.error('Failed to load pending fees');
    } finally {
      setLoading(false);
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
    const total = newSelection.reduce((sum, f) => sum + (f.balance || 0), 0);
    setTotalAmount(total);
  };

  // Generate UPI QR Code
  const generateQRCode = async () => {
    if (!selectedStudent || totalAmount <= 0) {
      toast.error('Please select a student and fees');
      return;
    }

    try {
      setLoading(true);
      
      // Generate unique transaction ID
      const txnId = `FEE${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      setTransactionId(txnId);
      
      // Generate UPI string
      const transactionNote = `Fee for ${selectedStudent.full_name} - ${selectedStudent.school_code}`;
      const upiParams = new URLSearchParams({
        pa: upiConfig.upiId,
        pn: upiConfig.payeeName,
        am: totalAmount.toFixed(2),
        cu: 'INR',
        tn: transactionNote,
        tr: txnId,
        mc: upiConfig.merchantCode
      });
      
      const upiStr = `upi://pay?${upiParams.toString()}`;
      setUpiString(upiStr);
      
      // Generate QR code image
      const qrUrl = await QRCode.toDataURL(upiStr, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      
      setQrCodeUrl(qrUrl);
      setPaymentStatus('pending');
      setShowQrDialog(true);
      
      // Create pending transaction record
      await createPendingTransaction(txnId);
      
    } catch (error) {
      console.error('Error generating QR:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  // Create pending transaction
  const createPendingTransaction = async (txnId) => {
    try {
      const { error } = await supabase
        .from('fee_transactions')
        .insert({
          transaction_id: txnId,
          student_id: selectedStudent.id,
          amount: totalAmount,
          payment_method: 'upi',
          payment_gateway: 'upi_qr',
          status: 'pending',
          branch_id: branchId,
          session_id: currentSessionId,
          organization_id: organizationId,
          fee_details: selectedFees.map(f => f.id),
          metadata: {
            upi_id: upiConfig.upiId,
            student_name: selectedStudent.full_name,
            school_code: selectedStudent.school_code,
            generated_at: new Date().toISOString()
          },
          created_by: user.id
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  // Poll for payment status
  const startPolling = () => {
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('fee_transactions')
          .select('status')
          .eq('transaction_id', transactionId)
          .single();

        if (data?.status === 'success') {
          setPaymentStatus('success');
          setPolling(false);
          clearInterval(interval);
          toast.success('Payment received successfully!');
          
          // Reload pending fees
          selectStudent(selectedStudent);
        } else if (data?.status === 'failed') {
          setPaymentStatus('failed');
          setPolling(false);
          clearInterval(interval);
          toast.error('Payment failed');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(interval);
      setPolling(false);
    }, 600000);
  };

  // Copy UPI ID
  const copyUpiId = () => {
    navigator.clipboard.writeText(upiConfig?.upiId || '');
    setCopied(true);
    toast.success('UPI ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Open UPI app
  const openUPIApp = (app) => {
    // For mobile, use intent URL
    window.location.href = upiString;
  };

  // Manual verification
  const verifyManually = async (utrNumber) => {
    try {
      setLoading(true);
      
      // Update transaction with UTR
      const { error } = await supabase
        .from('fee_transactions')
        .update({
          status: 'success',
          gateway_transaction_id: utrNumber,
          metadata: {
            upi_id: upiConfig.upiId,
            student_name: selectedStudent.full_name,
            school_code: selectedStudent.school_code,
            utr_number: utrNumber,
            verified_manually: true,
            verified_at: new Date().toISOString()
          }
        })
        .eq('transaction_id', transactionId);

      if (error) throw error;

      setPaymentStatus('success');
      toast.success('Payment verified successfully!');
      selectStudent(selectedStudent);
      
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">UPI Payment Collection</h1>
          <p className="text-muted-foreground">
            Generate UPI QR codes for instant fee collection
          </p>
        </div>
      </div>

      {/* UPI Config Display */}
      {upiConfig && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Receiving Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">UPI ID</p>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-mono">{upiConfig.upiId}</code>
                  <Button variant="ghost" size="icon" onClick={copyUpiId}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Payee Name</p>
                <p className="text-lg font-medium">{upiConfig.payeeName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Student</CardTitle>
            <CardDescription>Search by name or admission number</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Type student name or school code..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                  {searchResults.map((student) => (
                    <div
                      key={student.id}
                      className="p-3 hover:bg-accent cursor-pointer border-b last:border-0"
                      onClick={() => selectStudent(student)}
                    >
                      <div className="font-medium">{student.full_name}</div>
                      <div className="text-sm text-muted-foreground flex gap-2">
                        <span>{student.school_code}</span>
                        <span>•</span>
                        <span>{student.classes?.name} {student.sections?.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Student */}
            {selectedStudent && (
              <div className="p-4 bg-accent rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedStudent.full_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedStudent.school_code} • {selectedStudent.classes?.name} {selectedStudent.sections?.name}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
                    Change
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Fees</CardTitle>
            <CardDescription>
              {selectedFees.length} fee(s) selected • Total: ₹{totalAmount.toLocaleString('en-IN')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedStudent ? (
              <div className="text-center py-8 text-muted-foreground">
                Select a student to view pending fees
              </div>
            ) : loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : pendingFees.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p className="text-green-600 font-medium">All fees are paid!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-auto">
                {pendingFees.map((fee) => (
                  <div
                    key={fee.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedFees.some(f => f.id === fee.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => toggleFeeSelection(fee)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">
                          {fee.fee_structure?.fee_type?.name || 'Fee'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Due: {formatDate(fee.due_date)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">
                          ₹{fee.balance?.toLocaleString('en-IN')}
                        </div>
                        <Badge variant={fee.status === 'partial' ? 'warning' : 'secondary'}>
                          {fee.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedFees.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-medium">Total Amount</span>
                  <span className="text-2xl font-bold text-primary">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <Button 
                  className="w-full gap-2" 
                  size="lg"
                  onClick={generateQRCode}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <QrCode className="h-5 w-5" />
                  )}
                  Generate UPI QR Code
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Scan to Pay
            </DialogTitle>
            <DialogDescription>
              {selectedStudent?.full_name} • ₹{totalAmount.toLocaleString('en-IN')}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="qr" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr">QR Code</TabsTrigger>
              <TabsTrigger value="apps">UPI Apps</TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="mt-4">
              <div className="text-center space-y-4">
                {/* QR Code */}
                {qrCodeUrl && (
                  <div className="inline-block p-4 bg-white rounded-lg shadow-md">
                    <img src={qrCodeUrl} alt="UPI QR Code" className="mx-auto" />
                  </div>
                )}

                {/* Amount */}
                <div className="bg-accent p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Amount to Pay</p>
                  <p className="text-3xl font-bold flex items-center justify-center gap-1">
                    <IndianRupee className="h-6 w-6" />
                    {totalAmount.toLocaleString('en-IN')}
                  </p>
                </div>

                {/* Transaction ID */}
                <div className="text-sm text-muted-foreground">
                  Transaction ID: <code className="font-mono">{transactionId}</code>
                </div>

                {/* Status */}
                {paymentStatus === 'pending' && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Waiting for payment...</AlertTitle>
                    <AlertDescription>
                      Ask the parent to scan this QR code with any UPI app
                    </AlertDescription>
                  </Alert>
                )}

                {paymentStatus === 'success' && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-600">Payment Successful!</AlertTitle>
                    <AlertDescription className="text-green-600">
                      Receipt will be generated automatically
                    </AlertDescription>
                  </Alert>
                )}

                {paymentStatus === 'failed' && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Payment Failed</AlertTitle>
                    <AlertDescription>
                      Please try again or use a different payment method
                    </AlertDescription>
                  </Alert>
                )}

                {/* Actions */}
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={startPolling}
                    disabled={polling}
                    className="gap-2"
                  >
                    {polling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {polling ? 'Checking...' : 'Check Status'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = qrCodeUrl;
                      a.download = `upi_qr_${transactionId}.png`;
                      a.click();
                    }}
                    className="gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Download QR
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="apps" className="mt-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Open payment in UPI app (mobile only)
                </p>
                
                <div className="grid grid-cols-3 gap-3">
                  {UPI_APPS.map((app) => (
                    <Button
                      key={app.id}
                      variant="outline"
                      className="h-auto py-4 flex flex-col gap-2"
                      onClick={() => openUPIApp(app)}
                    >
                      <span 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: app.color }}
                      >
                        {app.name[0]}
                      </span>
                      <span className="text-xs">{app.name}</span>
                    </Button>
                  ))}
                </div>

                <Separator />

                {/* Manual Verification */}
                <div className="space-y-3">
                  <Label>Manual Verification (Enter UTR Number)</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter UTR/Reference number"
                      id="utr-input"
                    />
                    <Button 
                      onClick={() => {
                        const utr = document.getElementById('utr-input').value;
                        if (utr) verifyManually(utr);
                        else toast.error('Please enter UTR number');
                      }}
                    >
                      Verify
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use this if payment was made but not automatically detected
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
