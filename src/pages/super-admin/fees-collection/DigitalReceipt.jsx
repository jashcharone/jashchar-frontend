/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DIGITAL RECEIPT WITH QR VERIFICATION
 * Day 29 Implementation - Fee Collection Phase 3
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Generate digital receipts with QR codes
 * - QR verification system (scan to verify authenticity)
 * - Email/WhatsApp share options
 * - Receipt search & history
 * - Duplicate receipt generation
 */

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  QrCode, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  Printer,
  Download,
  Mail,
  Share2,
  Search,
  Shield,
  Clock,
  IndianRupee,
  Loader2,
  FileText,
  Copy,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from 'sonner';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import QRCode from 'qrcode';

// Helper function to convert number to words
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
  return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
};

// Receipt Verification Component (Public facing)
export function ReceiptVerification() {
  const [searchParams] = useSearchParams();
  const receiptId = searchParams.get('id') || searchParams.get('receipt');
  
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null); // success, error, not-found

  useEffect(() => {
    if (receiptId) {
      verifyReceipt(receiptId);
    } else {
      setLoading(false);
    }
  }, [receiptId]);

  const verifyReceipt = async (id) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fee_transactions')
        .select(`
          *,
          student:student_id(
            full_name,
            school_code,
            classes(name),
            sections(name),
            branches(name)
          )
        `)
        .or(`transaction_id.eq.${id},receipt_number.eq.${id}`)
        .single();

      if (error || !data) {
        setVerificationStatus('not-found');
        return;
      }

      if (data.status === 'success') {
        setVerificationStatus('success');
        setReceipt(data);
      } else {
        setVerificationStatus('error');
        setReceipt(data);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const [manualSearch, setManualSearch] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Verifying receipt...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold">Receipt Verification</h1>
          <p className="text-muted-foreground">Verify the authenticity of fee receipts</p>
        </div>

        {/* Search */}
        {!receiptId && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter receipt number or transaction ID..."
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={() => verifyReceipt(manualSearch)} disabled={!manualSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Verify
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Result */}
        {verificationStatus === 'success' && receipt && (
          <Card className="border-green-500 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-green-600">VERIFIED RECEIPT</h2>
                <p className="text-muted-foreground">This receipt is authentic and valid</p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Receipt Number</p>
                    <p className="font-semibold">{receipt.receipt_number || receipt.transaction_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-semibold">{formatDateTime(receipt.created_at)}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-muted-foreground text-sm">Student Name</p>
                  <p className="font-semibold text-lg">{receipt.student?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {receipt.student?.school_code} • {receipt.student?.classes?.name} {receipt.student?.sections?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">{receipt.student?.branches?.name}</p>
                </div>

                <Separator />

                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-muted-foreground text-sm">Amount Paid</p>
                  <p className="text-3xl font-bold text-green-600 flex items-center justify-center gap-1">
                    <IndianRupee className="h-6 w-6" />
                    {receipt.amount?.toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {numberToWords(Math.floor(receipt.amount || 0))} Rupees Only
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Payment Method</p>
                    <p className="font-medium">{receipt.payment_method?.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Transaction ID</p>
                    <p className="font-mono text-xs">{receipt.transaction_id}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {verificationStatus === 'not-found' && (
          <Card className="border-yellow-500">
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-10 w-10 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-yellow-600">Receipt Not Found</h2>
              <p className="text-muted-foreground mt-2">
                No receipt found with this ID. Please check the number and try again.
              </p>
            </CardContent>
          </Card>
        )}

        {verificationStatus === 'error' && (
          <Card className="border-red-500">
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-red-600">Verification Failed</h2>
              <p className="text-muted-foreground mt-2">
                This receipt could not be verified. It may be invalid or tampered.
              </p>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          Powered by Jashchar ERP • Secure Receipt Verification System
        </p>
      </div>
    </div>
  );
}

// Digital Receipt Generator Component
export default function DigitalReceipt() {
  const { transactionId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentReceipts, setRecentReceipts] = useState([]);

  useEffect(() => {
    if (transactionId) {
      loadReceipt(transactionId);
    } else {
      loadRecentReceipts();
    }
  }, [transactionId]);

  const loadReceipt = async (id) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fee_transactions')
        .select(`
          *,
          student:student_id(
            full_name,
            school_code,
            class_id,
            section_id,
            classes(name),
            sections(name),
            branches(name, address, phone)
          ),
          creator:created_by(name, email)
        `)
        .or(`transaction_id.eq.${id},id.eq.${id},receipt_number.eq.${id}`)
        .single();

      if (error) throw error;

      setReceipt(data);
      
      // Generate QR code with verification URL
      const verificationUrl = `${window.location.origin}/verify-receipt?id=${data.transaction_id}`;
      const qr = await QRCode.toDataURL(verificationUrl, {
        width: 150,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });
      setQrCodeUrl(qr);

    } catch (error) {
      console.error('Error loading receipt:', error);
      toast.error('Receipt not found');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentReceipts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fee_transactions')
        .select(`
          id,
          transaction_id,
          receipt_number,
          amount,
          payment_method,
          status,
          created_at,
          student:student_id(full_name, school_code)
        `)
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRecentReceipts(data || []);
    } catch (error) {
      console.error('Error loading receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchReceipts = async () => {
    if (!searchQuery.trim()) {
      loadRecentReceipts();
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fee_transactions')
        .select(`
          id,
          transaction_id,
          receipt_number,
          amount,
          payment_method,
          status,
          created_at,
          student:student_id(full_name, school_code)
        `)
        .or(`transaction_id.ilike.%${searchQuery}%,receipt_number.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRecentReceipts(data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const downloadPDF = () => {
    toast.info('Generating PDF...');
    // TODO: Implement PDF generation
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Fee Receipt - ${receipt?.receipt_number || receipt?.transaction_id}`);
    const body = encodeURIComponent(`
Dear Parent,

Please find your fee receipt details below:

Receipt Number: ${receipt?.receipt_number || receipt?.transaction_id}
Student Name: ${receipt?.student?.full_name}
Amount: ₹${receipt?.amount?.toLocaleString('en-IN')}
Date: ${formatDate(receipt?.created_at)}

Verify receipt at: ${window.location.origin}/verify-receipt?id=${receipt?.transaction_id}

Thank you,
${receipt?.student?.branches?.name}
    `);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`
*Fee Receipt*

Receipt: ${receipt?.receipt_number || receipt?.transaction_id}
Student: ${receipt?.student?.full_name}
Amount: ₹${receipt?.amount?.toLocaleString('en-IN')}
Date: ${formatDate(receipt?.created_at)}

Verify: ${window.location.origin}/verify-receipt?id=${receipt?.transaction_id}
    `);
    window.open(`https://wa.me/?text=${text}`);
  };

  const copyReceiptLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/verify-receipt?id=${receipt?.transaction_id}`);
    toast.success('Receipt link copied!');
  };

  // Receipt Search View
  if (!transactionId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Digital Receipts</h1>
          <p className="text-muted-foreground">Search and view fee receipts</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Search by receipt number or transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchReceipts()}
                className="flex-1"
              />
              <Button onClick={searchReceipts}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              </div>
            ) : recentReceipts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No receipts found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReceipts.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="font-mono text-sm">
                        {txn.receipt_number || txn.transaction_id?.slice(0, 12)}
                      </TableCell>
                      <TableCell>
                        <div>{txn.student?.full_name}</div>
                        <div className="text-xs text-muted-foreground">{txn.student?.school_code}</div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₹{txn.amount?.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDateTime(txn.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.location.href = `/fees/receipt/${txn.transaction_id}`}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Receipt Detail View
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Receipt Not Found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Actions */}
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button onClick={printReceipt} className="gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button variant="outline" onClick={downloadPDF} className="gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
        <Button variant="outline" onClick={shareViaEmail} className="gap-2">
          <Mail className="h-4 w-4" />
          Email
        </Button>
        <Button variant="outline" onClick={shareViaWhatsApp} className="gap-2">
          <MessageSquare className="h-4 w-4" />
          WhatsApp
        </Button>
        <Button variant="outline" onClick={copyReceiptLink} className="gap-2">
          <Copy className="h-4 w-4" />
          Copy Link
        </Button>
      </div>

      {/* Receipt */}
      <Card className="print:shadow-none print:border-2">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">{receipt.student?.branches?.name}</h1>
            <p className="text-muted-foreground">{receipt.student?.branches?.address}</p>
            <p className="text-sm text-muted-foreground">Phone: {receipt.student?.branches?.phone || 'N/A'}</p>
          </div>

          <div className="text-center bg-accent p-3 rounded-lg mb-6">
            <h2 className="text-xl font-bold">FEE RECEIPT</h2>
          </div>

          {/* Receipt Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Receipt Number</p>
              <p className="font-semibold">{receipt.receipt_number || receipt.transaction_id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-semibold">{formatDateTime(receipt.created_at)}</p>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Student Name</p>
              <p className="font-semibold text-lg">{receipt.student?.full_name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Class & Section</p>
              <p className="font-semibold">
                {receipt.student?.classes?.name} {receipt.student?.sections?.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Admission Number</p>
              <p className="font-semibold">{receipt.student?.school_code}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-semibold">{receipt.payment_method?.toUpperCase()}</p>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Amount */}
          <div className="bg-accent p-6 rounded-lg text-center mb-6">
            <p className="text-muted-foreground mb-2">Amount Paid</p>
            <p className="text-4xl font-bold text-primary flex items-center justify-center gap-2">
              <IndianRupee className="h-8 w-8" />
              {receipt.amount?.toLocaleString('en-IN')}
            </p>
            <p className="text-muted-foreground mt-2">
              ({numberToWords(Math.floor(receipt.amount || 0))} Rupees Only)
            </p>
          </div>

          {/* QR Code & Signature */}
          <div className="flex justify-between items-end mt-8">
            <div className="text-center">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="Verification QR" className="mx-auto" />
              )}
              <p className="text-xs text-muted-foreground mt-2">Scan to verify</p>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 w-40 mt-8 pt-2">
                <p className="text-sm">Authorized Signature</p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <p className="text-center text-xs text-muted-foreground">
            This is a computer generated receipt. Transaction ID: {receipt.transaction_id}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
