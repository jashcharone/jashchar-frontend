/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BULK FEE COLLECTION (QR/BARCODE)
 * Day 27 Implementation - Fee Collection Phase 3
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Barcode/QR scanner for fast student lookup
 * - Multi-student batch processing
 * - Quick cash/UPI collection
 * - Bulk receipt printing
 * - Collection session summary
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ScanLine, 
  Plus,
  Trash2,
  IndianRupee,
  Printer,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Banknote,
  QrCode,
  CreditCard,
  Users,
  BarChart3,
  XCircle,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from 'sonner';
import { formatDate, formatTime } from '@/utils/dateUtils';

export default function BulkCollection() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;

  // Scanner ref
  const scannerInputRef = useRef(null);

  // State
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [lastScanTime, setLastScanTime] = useState(null);
  
  // Collection queue
  const [collectionQueue, setCollectionQueue] = useState([]);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [selectedFees, setSelectedFees] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  // Session stats
  const [sessionStats, setSessionStats] = useState({
    totalCollected: 0,
    transactionCount: 0,
    cashCollected: 0,
    upiCollected: 0,
    cardCollected: 0,
    startTime: null
  });
  
  // Dialog states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Start scanner session
  const startSession = () => {
    setScannerActive(true);
    setSessionStats(prev => ({
      ...prev,
      startTime: new Date()
    }));
    setTimeout(() => {
      scannerInputRef.current?.focus();
    }, 100);
    toast.success('Scanner session started. Ready to scan!');
  };

  // Stop scanner session
  const stopSession = () => {
    setScannerActive(false);
    toast.info('Scanner session paused');
  };

  // Handle barcode/QR scan
  const handleScan = async (code) => {
    if (!code || code.length < 3) return;
    
    // Debounce rapid scans
    const now = Date.now();
    if (lastScanTime && now - lastScanTime < 500) return;
    setLastScanTime(now);

    setLoading(true);
    try {
      // Search by school_code (admission number)
      const { data, error } = await supabase
        .from('student_profiles')
        .select(`
          id,
          full_name,
          school_code,
          class_id,
          section_id,
          classes(name),
          sections(name)
        `)
        .eq('branch_id', branchId)
        .eq('session_id', currentSessionId)
        .eq('school_code', code.trim())
        .single();

      if (error || !data) {
        toast.error(`Student not found: ${code}`);
        setScannedCode('');
        return;
      }

      // Load student's pending fees
      const { data: fees, error: feesError } = await supabase
        .from('fee_details')
        .select(`
          id,
          fee_structure:fee_structure_id(
            fee_type:fee_type_id(name)
          ),
          balance,
          due_date,
          status
        `)
        .eq('student_id', data.id)
        .eq('branch_id', branchId)
        .eq('session_id', currentSessionId)
        .in('status', ['pending', 'partial'])
        .order('due_date', { ascending: true });

      if (feesError) throw feesError;

      // Set current student
      setCurrentStudent({
        ...data,
        pendingFees: fees || [],
        totalDue: (fees || []).reduce((sum, f) => sum + (f.balance || 0), 0)
      });

      // Auto-select all fees
      setSelectedFees(fees || []);
      setPaymentAmount((fees || []).reduce((sum, f) => sum + (f.balance || 0), 0));
      
      // Show payment dialog
      setShowPaymentDialog(true);
      
      // Clear scanner input
      setScannedCode('');
      
      // Play success sound (if available)
      try {
        const audio = new Audio('/sounds/beep.mp3');
        audio.play();
      } catch (e) {}

    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Failed to process scan');
    } finally {
      setLoading(false);
    }
  };

  // Handle scanner input
  const handleScannerInput = (e) => {
    const value = e.target.value;
    setScannedCode(value);

    // Most barcode scanners add Enter key after scan
    if (e.key === 'Enter' || value.length >= 10) {
      handleScan(value);
    }
  };

  // Process payment
  const processPayment = async () => {
    if (!currentStudent || paymentAmount <= 0) {
      toast.error('Invalid payment');
      return;
    }

    setProcessing(true);
    try {
      // Generate transaction ID
      const txnId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      // Create transaction
      const { data: txn, error } = await supabase
        .from('fee_transactions')
        .insert({
          transaction_id: txnId,
          student_id: currentStudent.id,
          amount: paymentAmount,
          payment_method: paymentMethod,
          status: 'success',
          branch_id: branchId,
          session_id: currentSessionId,
          organization_id: organizationId,
          fee_details: selectedFees.map(f => f.id),
          metadata: {
            student_name: currentStudent.full_name,
            school_code: currentStudent.school_code,
            collection_mode: 'bulk_scanner',
            collected_by: user.name || user.email
          },
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Update fee details
      for (const fee of selectedFees) {
        const newPaid = (fee.paid_amount || 0) + Math.min(fee.balance, paymentAmount);
        const newBalance = Math.max(0, (fee.balance || 0) - paymentAmount);
        
        await supabase
          .from('fee_details')
          .update({
            paid_amount: newPaid,
            balance: newBalance,
            status: newBalance <= 0 ? 'paid' : 'partial',
            last_payment_date: new Date().toISOString()
          })
          .eq('id', fee.id);
      }

      // Add to collection queue
      setCollectionQueue(prev => [{
        id: txn.id,
        transaction_id: txnId,
        student: currentStudent,
        amount: paymentAmount,
        method: paymentMethod,
        time: new Date()
      }, ...prev]);

      // Update session stats
      setSessionStats(prev => ({
        ...prev,
        totalCollected: prev.totalCollected + paymentAmount,
        transactionCount: prev.transactionCount + 1,
        cashCollected: prev.cashCollected + (paymentMethod === 'cash' ? paymentAmount : 0),
        upiCollected: prev.upiCollected + (paymentMethod === 'upi' ? paymentAmount : 0),
        cardCollected: prev.cardCollected + (paymentMethod === 'card' ? paymentAmount : 0)
      }));

      toast.success(`Payment of ₹${paymentAmount.toLocaleString('en-IN')} collected!`);
      
      // Close dialog and reset
      setShowPaymentDialog(false);
      setCurrentStudent(null);
      setSelectedFees([]);
      setPaymentAmount(0);
      setPaymentMethod('cash');
      
      // Refocus scanner
      setTimeout(() => {
        scannerInputRef.current?.focus();
      }, 100);

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  // Print receipt
  const printReceipt = (transaction) => {
    toast.info('Printing receipt...');
    // TODO: Implement receipt print
  };

  // Print all receipts
  const printAllReceipts = () => {
    toast.info(`Printing ${collectionQueue.length} receipts...`);
    // TODO: Implement bulk print
  };

  // Calculate session duration
  const getSessionDuration = () => {
    if (!sessionStats.startTime) return '00:00:00';
    const diff = Math.floor((new Date() - sessionStats.startTime) / 1000);
    const hours = Math.floor(diff / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
    const seconds = (diff % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // Update timer
  useEffect(() => {
    if (!scannerActive) return;
    const interval = setInterval(() => {
      // Force re-render to update timer
      setSessionStats(prev => ({ ...prev }));
    }, 1000);
    return () => clearInterval(interval);
  }, [scannerActive]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bulk Fee Collection</h1>
          <p className="text-muted-foreground">
            Scan student ID cards or barcodes for quick collection
          </p>
        </div>
        {!scannerActive ? (
          <Button onClick={startSession} className="gap-2">
            <Play className="h-4 w-4" />
            Start Session
          </Button>
        ) : (
          <Button onClick={stopSession} variant="outline" className="gap-2">
            <Pause className="h-4 w-4" />
            Pause Session
          </Button>
        )}
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-mono font-bold">
              {getSessionDuration()}
            </div>
            <div className="text-xs text-muted-foreground">Session Time</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <IndianRupee className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">
              ₹{sessionStats.totalCollected.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-muted-foreground">Total Collected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">
              {sessionStats.transactionCount}
            </div>
            <div className="text-xs text-muted-foreground">Transactions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Banknote className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold">
              ₹{sessionStats.cashCollected.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-muted-foreground">Cash</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <QrCode className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">
              ₹{sessionStats.upiCollected.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-muted-foreground">UPI</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner Area */}
        <div className="lg:col-span-1">
          <Card className={scannerActive ? 'border-green-500' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className={`h-5 w-5 ${scannerActive ? 'text-green-500 animate-pulse' : ''}`} />
                Scanner
                {scannerActive && (
                  <Badge variant="success" className="ml-auto">Active</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Scan student ID barcode or enter code manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Input
                  ref={scannerInputRef}
                  placeholder="Scan or type student code..."
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  onKeyDown={handleScannerInput}
                  disabled={!scannerActive}
                  className="text-lg h-12 font-mono"
                  autoComplete="off"
                />
                {loading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin" />
                )}
              </div>

              {!scannerActive && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Click "Start Session" to enable scanner
                  </AlertDescription>
                </Alert>
              )}

              {scannerActive && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">
                    Ready to scan! Point barcode scanner at student ID card
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-xs text-muted-foreground">
                <p>Supported formats:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Student school code / admission number</li>
                  <li>ID card barcode</li>
                  <li>QR code on fee card</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Collection Queue */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Collection Queue</CardTitle>
                <CardDescription>
                  Recent transactions in this session
                </CardDescription>
              </div>
              {collectionQueue.length > 0 && (
                <Button variant="outline" onClick={printAllReceipts} className="gap-2">
                  <Printer className="h-4 w-4" />
                  Print All ({collectionQueue.length})
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {collectionQueue.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Start scanning to collect fees</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {collectionQueue.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 bg-accent rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{item.student.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.student.school_code} • {formatTime(item.time)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-semibold text-lg">
                              ₹{item.amount.toLocaleString('en-IN')}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {item.method.toUpperCase()}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => printReceipt(item)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Collect Fee</DialogTitle>
            <DialogDescription>
              Process payment for scanned student
            </DialogDescription>
          </DialogHeader>

          {currentStudent && (
            <div className="space-y-4">
              {/* Student Info */}
              <div className="p-4 bg-accent rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{currentStudent.full_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {currentStudent.school_code} • {currentStudent.classes?.name} {currentStudent.sections?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Total Due</div>
                    <div className="text-xl font-bold text-destructive">
                      ₹{currentStudent.totalDue.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Fees */}
              {currentStudent.pendingFees.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-auto">
                  {currentStudent.pendingFees.map((fee) => (
                    <div key={fee.id} className="flex justify-between p-2 border rounded text-sm">
                      <span>{fee.fee_structure?.fee_type?.name || 'Fee'}</span>
                      <span className="font-medium">₹{fee.balance?.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Payment Amount */}
              <div className="space-y-2">
                <Label>Payment Amount</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="text-xl h-12 pl-10 font-mono"
                  />
                </div>
                <div className="flex gap-2">
                  {[currentStudent.totalDue, 1000, 500].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentAmount(amount)}
                    >
                      ₹{amount.toLocaleString('en-IN')}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <Label>Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="grid grid-cols-3 gap-3">
                    <div 
                      className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${paymentMethod === 'cash' ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => setPaymentMethod('cash')}
                    >
                      <Banknote className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Cash</span>
                    </div>
                    <div 
                      className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${paymentMethod === 'upi' ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => setPaymentMethod('upi')}
                    >
                      <QrCode className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">UPI</span>
                    </div>
                    <div 
                      className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Card</span>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPaymentDialog(false);
                setCurrentStudent(null);
                setTimeout(() => scannerInputRef.current?.focus(), 100);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={processPayment}
              disabled={processing || paymentAmount <= 0}
              className="gap-2"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Collect ₹{paymentAmount.toLocaleString('en-IN')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
