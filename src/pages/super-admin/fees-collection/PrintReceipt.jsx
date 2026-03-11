/**
 * 🧾 UNIFIED PRINT RECEIPT - All-in-One
 * =====================================
 * Single component to print all types of fee receipts:
 * - fees (Tuition/Academic)
 * - hostel (Hostel Fee)
 * - transport (Transport Fee)
 * - refund (Refund Receipt)
 * 
 * Route: /super-admin/fees-collection/print-receipt/:type/:paymentId
 * OR with query param: /print-receipt/:paymentId?type=fees
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, ArrowLeft, Building2, Bus, CreditCard, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

// Receipt type configurations
const RECEIPT_CONFIG = {
  fees: {
    title: 'FEE RECEIPT',
    table: 'fee_payments',
    icon: CreditCard,
    color: 'bg-blue-600',
    idField: 'paymentId'
  },
  hostel: {
    title: 'HOSTEL FEE RECEIPT',
    table: 'hostel_fee_payments',
    icon: Building2,
    color: 'bg-purple-600',
    idField: 'paymentId'
  },
  transport: {
    title: 'TRANSPORT FEE RECEIPT',
    table: 'transport_fee_payments',
    icon: Bus,
    color: 'bg-green-600',
    idField: 'paymentId'
  },
  refund: {
    title: 'REFUND RECEIPT',
    table: 'fee_refunds',
    icon: RotateCcw,
    color: 'bg-orange-600',
    idField: 'refundId'
  }
};

const PrintReceipt = () => {
  // Get type from route params or query string
  const { type: routeType, paymentId: routePaymentId, refundId: routeRefundId } = useParams();
  const [searchParams] = useSearchParams();
  const queryType = searchParams.get('type');
  
  // Determine receipt type (priority: route > query > default to fees)
  const receiptType = routeType || queryType || 'fees';
  const config = RECEIPT_CONFIG[receiptType] || RECEIPT_CONFIG.fees;
  
  // Payment/Refund ID
  const paymentId = routePaymentId || routeRefundId || searchParams.get('id');
  
  const { user, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [receiptData, setReceiptData] = useState(null);
  const [printSettings, setPrintSettings] = useState(null);
  const [receiptCopySettings, setReceiptCopySettings] = useState({
    office_copy: true,
    student_copy: true,
    bank_copy: false
  });
  const [loading, setLoading] = useState(true);
  const [currentDateTime] = useState(new Date());
  const [isOriginal, setIsOriginal] = useState(true);
  
  const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;
  const userOrgId = organizationId || user?.profile?.organization_id;

  // =====================================
  // FETCH FUNCTIONS FOR EACH TYPE
  // =====================================

  const fetchFeesReceipt = useCallback(async () => {
    const paymentIds = paymentId.split(',');

    // 1. Fetch Payment Info
    const { data: initialData, error: initialError } = await supabase
      .from('fee_payments')
      .select('transaction_id, student_id')
      .in('id', paymentIds)
      .eq('branch_id', branchId)
      .limit(1)
      .single();

    if (initialError) throw initialError;
    if (!initialData) throw new Error('Payment not found');

    const { transaction_id: transactionId, student_id: studentId } = initialData;

    // 2. Fetch All Payments with same transaction
    let paymentQuery = supabase.from('fee_payments').select('*').eq('branch_id', branchId);
    if (transactionId) {
      paymentQuery = paymentQuery.eq('transaction_id', transactionId);
    } else {
      paymentQuery = paymentQuery.in('id', paymentIds);
    }
    const { data: paymentData, error: paymentError } = await paymentQuery;
    if (paymentError) throw paymentError;

    // 3. Fetch Student
    const { data: studentData } = await supabase
      .from('student_profiles')
      .select('*, classes!student_profiles_class_id_fkey(name), sections!student_profiles_section_id_fkey(name)')
      .eq('id', studentId)
      .eq('branch_id', branchId)
      .maybeSingle();

    const student = studentData ? { 
      ...studentData, 
      class: studentData.classes, 
      section: studentData.sections 
    } : null;

    if (!student) throw new Error('Student not found');

    // 4. Fetch Fee Masters with Fee Types
    const feeMasterIds = [...new Set(paymentData.map(p => p.fee_master_id).filter(Boolean))];
    const { data: feeMasters } = await supabase
      .from('fee_masters')
      .select('*, fee_types(id, name, code), fee_groups(id, name)')
      .in('id', feeMasterIds);

    // 5. Calculate payments with details
    const paymentsWithMaster = paymentData.map(p => {
      // Fee Engine 3.0: Use receipt_snapshot for ledger-based payments
      if (p.ledger_id && !p.fee_master_id && p.receipt_snapshot) {
        const snap = p.receipt_snapshot;
        return {
          ...p,
          fee_name: snap.fee?.name || 'Fee',
          fee_group_name: snap.fee?.group || '',
          total_fee_amount: Number(snap.fee?.total_amount || 0),
          balance: p.balance_after_payment ?? snap.calculated?.balance_after ?? 0,
        };
      }
      // Old system: use fee_masters lookup
      const fm = feeMasters?.find(fm => fm.id === p.fee_master_id);
      return {
        ...p,
        fee_name: fm?.fee_types?.name || fm?.name || 'Fee',
        fee_group_name: fm?.fee_groups?.name || '',
        total_fee_amount: Number(fm?.amount || 0),
        balance: p.balance_after_payment ?? 0
      };
    });

    // 6. Check printed status
    const anyPrinted = paymentData.some(p => p.printed_at);
    setIsOriginal(!anyPrinted);

    // 7. Calculate totals
    const totalPaid = paymentsWithMaster.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalDiscount = paymentsWithMaster.reduce((sum, p) => sum + Number(p.discount_amount || 0), 0);
    const totalFine = paymentsWithMaster.reduce((sum, p) => sum + Number(p.fine_paid || 0), 0);

    return {
      student,
      payments: paymentsWithMaster,
      lineItems: paymentsWithMaster.map(p => ({
        description: p.fee_name + (p.fee_group_name ? ` (${p.fee_group_name})` : ''),
        amount: Number(p.amount || 0),
        discount: Number(p.discount_amount || 0),
        fine: Number(p.fine_paid || 0)
      })),
      totalPaid,
      totalDiscount,
      totalFine,
      grandTotal: totalPaid,
      transactionId,
      receiptDate: paymentsWithMaster[0]?.payment_date || paymentsWithMaster[0]?.created_at,
      paymentMode: paymentsWithMaster[0]?.payment_mode || 'Cash',
      remarks: paymentsWithMaster[0]?.remarks
    };
  }, [paymentId, branchId]);

  const fetchHostelReceipt = useCallback(async () => {
    // Fetch payment
    const { data: payment, error } = await supabase
      .from('hostel_fee_payments')
      .select('*')
      .eq('id', paymentId)
      .eq('branch_id', branchId)
      .single();

    if (error) throw error;
    if (!payment) throw new Error('Payment not found');

    // Fetch all payments with same transaction
    const { data: transactionPayments } = await supabase
      .from('hostel_fee_payments')
      .select('*')
      .eq('transaction_id', payment.transaction_id)
      .eq('branch_id', branchId)
      .order('created_at', { ascending: true });

    const payments = transactionPayments?.length > 0 ? transactionPayments : [payment];

    // Use snapshot or fetch fresh
    const snapshot = payment.receipt_snapshot;
    let student, hostelDetails;

    if (snapshot?.student) {
      student = snapshot.student;
      hostelDetails = snapshot.hostel_details || {};
    } else {
      const { data: studentData } = await supabase
        .from('student_profiles')
        .select('*, classes!student_profiles_class_id_fkey(name), sections!student_profiles_section_id_fkey(name)')
        .eq('id', payment.student_id)
        .single();
      student = studentData ? { ...studentData, class: studentData.classes, section: studentData.sections } : null;

      const { data: hostelData } = await supabase
        .from('student_hostel_details')
        .select('*, room:room_id(room_number_name)')
        .eq('student_id', payment.student_id)
        .eq('branch_id', branchId)
        .maybeSingle();
      hostelDetails = hostelData || {};
    }

    if (!student) throw new Error('Student not found');

    // Check printed status
    setIsOriginal(!payment.printed_at);

    // Build line items from months paid
    const lineItems = payments.map(p => ({
      description: `Hostel Fee - ${p.month || 'Monthly'}`,
      amount: Number(p.amount || 0),
      discount: 0,
      fine: Number(p.fine_paid || 0)
    }));

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalFine = payments.reduce((sum, p) => sum + Number(p.fine_paid || 0), 0);

    return {
      student,
      payments,
      lineItems,
      totalPaid,
      totalDiscount: 0,
      totalFine,
      grandTotal: totalPaid,
      transactionId: payment.transaction_id,
      receiptDate: payment.payment_date || payment.created_at,
      paymentMode: payment.payment_mode || 'Cash',
      remarks: payment.remarks,
      extraInfo: {
        type: 'hostel',
        roomNo: hostelDetails?.room?.room_number_name || hostelDetails?.room_number || '-',
        bedNo: hostelDetails?.bed_number || '-'
      }
    };
  }, [paymentId, branchId]);

  const fetchTransportReceipt = useCallback(async () => {
    // Fetch payment
    const { data: payment, error } = await supabase
      .from('transport_fee_payments')
      .select('*')
      .eq('id', paymentId)
      .eq('branch_id', branchId)
      .single();

    if (error) throw error;
    if (!payment) throw new Error('Payment not found');

    // Fetch all payments with same transaction
    const { data: transactionPayments } = await supabase
      .from('transport_fee_payments')
      .select('*')
      .eq('transaction_id', payment.transaction_id)
      .eq('branch_id', branchId)
      .order('created_at', { ascending: true });

    const payments = transactionPayments?.length > 0 ? transactionPayments : [payment];

    // Use snapshot or fetch fresh
    const snapshot = payment.receipt_snapshot;
    let student, transportDetails;

    if (snapshot?.student) {
      student = snapshot.student;
      transportDetails = snapshot.transport_details || {};
    } else {
      const { data: studentData } = await supabase
        .from('student_profiles')
        .select('*, classes!student_profiles_class_id_fkey(name), sections!student_profiles_section_id_fkey(name)')
        .eq('id', payment.student_id)
        .single();
      student = studentData ? { ...studentData, class: studentData.classes, section: studentData.sections } : null;

      const { data: transportData } = await supabase
        .from('student_transport_details')
        .select('*, route:transport_route_id(route_title), pickup_point:transport_pickup_point_id(name)')
        .eq('student_id', payment.student_id)
        .eq('branch_id', branchId)
        .maybeSingle();
      transportDetails = transportData || {};
    }

    if (!student) throw new Error('Student not found');

    // Check printed status
    setIsOriginal(!payment.printed_at);

    // Build line items from months paid
    const lineItems = payments.map(p => ({
      description: `Transport Fee - ${p.month || 'Monthly'}`,
      amount: Number(p.amount || 0),
      discount: 0,
      fine: Number(p.fine_paid || 0)
    }));

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalFine = payments.reduce((sum, p) => sum + Number(p.fine_paid || 0), 0);

    return {
      student,
      payments,
      lineItems,
      totalPaid,
      totalDiscount: 0,
      totalFine,
      grandTotal: totalPaid,
      transactionId: payment.transaction_id,
      receiptDate: payment.payment_date || payment.created_at,
      paymentMode: payment.payment_mode || 'Cash',
      remarks: payment.remarks,
      extraInfo: {
        type: 'transport',
        route: transportDetails?.route?.route_title || '-',
        pickupPoint: transportDetails?.pickup_point?.name || '-'
      }
    };
  }, [paymentId, branchId]);

  const fetchRefundReceipt = useCallback(async () => {
    const { data: refund, error } = await supabase
      .from('fee_refunds')
      .select('*')
      .eq('id', paymentId)
      .eq('branch_id', branchId)
      .single();

    if (error) throw error;
    if (!refund) throw new Error('Refund not found');

    const { data: studentData } = await supabase
      .from('student_profiles')
      .select('*, classes!student_profiles_class_id_fkey(name), sections!student_profiles_section_id_fkey(name)')
      .eq('id', refund.student_id)
      .eq('branch_id', branchId)
      .maybeSingle();

    const student = studentData ? { ...studentData, class: studentData.classes, section: studentData.sections } : null;
    if (!student) throw new Error('Student not found');

    return {
      student,
      payments: [refund],
      lineItems: [{
        description: `Refund: ${refund.reason || 'Fee Refund'}`,
        amount: Number(refund.amount || 0),
        discount: 0,
        fine: 0
      }],
      totalPaid: Number(refund.amount || 0),
      totalDiscount: 0,
      totalFine: 0,
      grandTotal: Number(refund.amount || 0),
      transactionId: refund.id?.substring(0, 8),
      receiptDate: refund.processed_at || refund.created_at,
      paymentMode: refund.refund_mode || 'Cash',
      remarks: refund.remarks,
      isRefund: true
    };
  }, [paymentId, branchId]);

  // =====================================
  // MAIN FETCH
  // =====================================

  const fetchAllDetails = useCallback(async () => {
    if (!paymentId || !branchId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Fetch type-specific data
      let data;
      switch (receiptType) {
        case 'hostel':
          data = await fetchHostelReceipt();
          break;
        case 'transport':
          data = await fetchTransportReceipt();
          break;
        case 'refund':
          data = await fetchRefundReceipt();
          break;
        case 'fees':
        default:
          data = await fetchFeesReceipt();
          break;
      }

      // Fetch school info
      const { data: schoolData } = await supabase
        .from('schools')
        .select('*')
        .eq('id', branchId)
        .single();

      // Fetch print settings
      let settingsData = null;
      const { data: branchSettings } = await supabase
        .from('print_settings')
        .select('*')
        .eq('branch_id', branchId)
        .eq('type', 'fees_receipt')
        .maybeSingle();

      if (branchSettings?.header_image_url) {
        settingsData = branchSettings;
      } else {
        const { data: orgSettings } = await supabase
          .from('print_settings')
          .select('*')
          .is('branch_id', null)
          .eq('type', 'fees_receipt')
          .maybeSingle();
        settingsData = orgSettings;
      }

      // Fetch receipt copy settings
      const { data: branchData } = await supabase
        .from('branches')
        .select('print_receipt_office_copy, print_receipt_student_copy, print_receipt_bank_copy')
        .eq('id', branchId)
        .maybeSingle();

      if (branchData) {
        setReceiptCopySettings({
          office_copy: branchData.print_receipt_office_copy !== false,
          student_copy: branchData.print_receipt_student_copy !== false,
          bank_copy: branchData.print_receipt_bank_copy === true
        });
      }

      setReceiptData({
        ...data,
        school: schoolData,
        branch: selectedBranch
      });
      setPrintSettings(settingsData);

    } catch (error) {
      console.error('Error:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [paymentId, branchId, receiptType, selectedBranch, fetchFeesReceipt, fetchHostelReceipt, fetchTransportReceipt, fetchRefundReceipt, toast]);

  useEffect(() => {
    if (selectedBranch) fetchAllDetails();
  }, [fetchAllDetails, selectedBranch]);

  // =====================================
  // PRINT HANDLER
  // =====================================

  const handlePrint = async () => {
    // Mark as printed
    if (isOriginal && receiptData?.payments?.length > 0 && receiptType !== 'refund') {
      const table = config.table;
      const paymentIds = receiptData.payments.map(p => p.id);
      
      await supabase
        .from(table)
        .update({ printed_at: new Date().toISOString() })
        .in('id', paymentIds)
        .is('printed_at', null);
      
      setIsOriginal(false);
    }
    window.print();
  };

  // =====================================
  // LOADING & ERROR STATES
  // =====================================

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen bg-white'>
        <Loader2 className='animate-spin h-8 w-8 text-blue-600' />
        <span className='ml-2 text-gray-700'>Loading receipt...</span>
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className='flex flex-col justify-center items-center h-screen bg-white'>
        <p className='text-red-500 mb-4'>Could not load receipt details.</p>
        <Button onClick={() => navigate(-1)}><ArrowLeft className='mr-2 h-4 w-4' />Go Back</Button>
      </div>
    );
  }

  // =====================================
  // RENDER RECEIPT
  // =====================================

  const { student, school, lineItems, totalPaid, totalDiscount, totalFine, grandTotal, transactionId, receiptDate, paymentMode, remarks, extraInfo, isRefund } = receiptData;
  const Icon = config.icon;

  // Format receipt number
  const receiptNo = transactionId?.substring(0, 8).toUpperCase() || '-';

  // Number to words converter
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    if (num < 0) return 'Minus ' + numberToWords(-num);
    
    let words = '';
    
    if (Math.floor(num / 10000000) > 0) {
      words += numberToWords(Math.floor(num / 10000000)) + ' Crore ';
      num %= 10000000;
    }
    if (Math.floor(num / 100000) > 0) {
      words += numberToWords(Math.floor(num / 100000)) + ' Lakh ';
      num %= 100000;
    }
    if (Math.floor(num / 1000) > 0) {
      words += numberToWords(Math.floor(num / 1000)) + ' Thousand ';
      num %= 1000;
    }
    if (Math.floor(num / 100) > 0) {
      words += numberToWords(Math.floor(num / 100)) + ' Hundred ';
      num %= 100;
    }
    if (num > 0) {
      if (num < 20) words += ones[num];
      else words += tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    }
    
    return words.trim();
  };

  const amountInWords = numberToWords(Math.floor(grandTotal)) + ' Rupees Only';

  // Single Receipt Component
  const Receipt = ({ copyType }) => (
    <div className='receipt-box bg-white text-black border border-gray-400' style={{ 
      width: '100%', 
      minHeight: '47vh',
      padding: '0',
      boxSizing: 'border-box',
      pageBreakInside: 'avoid'
    }}>
      {/* Header */}
      {printSettings?.header_image_url ? (
        <div className='w-full'>
          <img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
      ) : (
        <div className='flex justify-between items-start p-3 border-b-2 border-gray-800 bg-gray-50'>
          <div className='flex items-center gap-3'>
            {school?.logo_url && <img src={school.logo_url} alt='Logo' className='h-12' />}
            <div>
              <h1 className='text-lg font-bold uppercase text-gray-900'>{school?.name || selectedBranch?.branch_name || '-'}</h1>
              {school?.address && <p className='text-xs text-gray-600'>{school.address}</p>}
            </div>
          </div>
          <div className='text-right text-[9px] text-gray-600'>
            {school?.contact_number && <p>Phone: {school.contact_number}</p>}
            {school?.contact_email && <p>Email: {school.contact_email}</p>}
          </div>
        </div>
      )}

      {/* Title Bar */}
      <div className={`${config.color} text-white py-1.5 px-3 flex justify-between items-center`}>
        <span className='text-[10px] font-bold uppercase tracking-wide opacity-90'>{copyType}</span>
        <div className='flex items-center gap-2'>
          <Icon className='h-4 w-4' />
          <span className='text-sm font-bold tracking-wide'>{config.title}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isOriginal ? 'bg-green-500' : 'bg-yellow-500'}`}>
          {isOriginal ? 'ORIGINAL' : 'REPRINT'}
        </span>
      </div>

      {/* Receipt Info + Student Info */}
      <div className='grid grid-cols-2 gap-2 p-2 text-[10px] border-b border-gray-300'>
        {/* Left - Receipt Info */}
        <div className='space-y-0.5'>
          <div className='flex'><span className='w-24 font-semibold text-gray-600'>Receipt No:</span><span className='font-bold'>{receiptNo}</span></div>
          <div className='flex'><span className='w-24 font-semibold text-gray-600'>Date:</span><span>{receiptDate ? format(new Date(receiptDate), 'dd-MM-yyyy') : '-'}</span></div>
          <div className='flex'><span className='w-24 font-semibold text-gray-600'>Payment Mode:</span><span className='uppercase'>{paymentMode}</span></div>
          {extraInfo?.type === 'hostel' && (
            <div className='flex'><span className='w-24 font-semibold text-gray-600'>Room/Bed:</span><span>{extraInfo.roomNo} / {extraInfo.bedNo}</span></div>
          )}
          {extraInfo?.type === 'transport' && (
            <>
              <div className='flex'><span className='w-24 font-semibold text-gray-600'>Route:</span><span>{extraInfo.route}</span></div>
              <div className='flex'><span className='w-24 font-semibold text-gray-600'>Pickup Point:</span><span>{extraInfo.pickupPoint}</span></div>
            </>
          )}
        </div>
        {/* Right - Student Info */}
        <div className='space-y-0.5'>
          <div className='flex'><span className='w-24 font-semibold text-gray-600'>Admission No:</span><span className='font-bold'>{student?.school_code || student?.admission_no || '-'}</span></div>
          <div className='flex'><span className='w-24 font-semibold text-gray-600'>Student Name:</span><span className='font-bold uppercase'>{student?.full_name || '-'}</span></div>
          <div className='flex'><span className='w-24 font-semibold text-gray-600'>Class/Section:</span><span>{student?.class?.name || '-'} / {student?.section?.name || '-'}</span></div>
          <div className='flex'><span className='w-24 font-semibold text-gray-600'>Father's Name:</span><span>{student?.father_name || '-'}</span></div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className='px-2 py-1'>
        <table className='w-full text-[10px] border-collapse'>
          <thead>
            <tr className='bg-gray-100'>
              <th className='border border-gray-300 p-1 text-left'>Sl</th>
              <th className='border border-gray-300 p-1 text-left'>Particulars</th>
              <th className='border border-gray-300 p-1 text-right w-20'>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx}>
                <td className='border border-gray-300 p-1'>{idx + 1}</td>
                <td className='border border-gray-300 p-1'>{item.description}</td>
                <td className='border border-gray-300 p-1 text-right font-medium'>{Number(item.amount).toLocaleString('en-IN')}</td>
              </tr>
            ))}
            {totalDiscount > 0 && (
              <tr className='bg-green-50'>
                <td className='border border-gray-300 p-1'></td>
                <td className='border border-gray-300 p-1 text-green-700'>Discount Applied</td>
                <td className='border border-gray-300 p-1 text-right text-green-700'>-{totalDiscount.toLocaleString('en-IN')}</td>
              </tr>
            )}
            {totalFine > 0 && (
              <tr className='bg-red-50'>
                <td className='border border-gray-300 p-1'></td>
                <td className='border border-gray-300 p-1 text-red-700'>Late Fine</td>
                <td className='border border-gray-300 p-1 text-right text-red-700'>+{totalFine.toLocaleString('en-IN')}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className='bg-gray-800 text-white font-bold'>
              <td colSpan={2} className='border border-gray-300 p-1.5 text-right'>
                {isRefund ? 'TOTAL REFUND:' : 'TOTAL PAID:'}
              </td>
              <td className='border border-gray-300 p-1.5 text-right text-sm'>₹{grandTotal.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Amount in Words */}
      <div className='px-2 py-1 text-[10px] border-b border-gray-300'>
        <span className='font-semibold text-gray-600'>Amount in Words: </span>
        <span className='font-bold italic'>{amountInWords}</span>
      </div>

      {/* Footer */}
      <div className='flex justify-between items-end px-3 py-2'>
        <div className='text-[8px] text-gray-500'>
          <p>Printed: {format(currentDateTime, 'dd-MM-yyyy hh:mm a')}</p>
          {remarks && <p className='text-gray-600'>Remarks: {remarks}</p>}
        </div>
        <div className='text-center'>
          <div className='border-t border-gray-400 pt-1 px-4'>
            <span className='text-[9px] text-gray-600'>Authorized Signatory</span>
          </div>
        </div>
      </div>

      {/* Watermark for Refund */}
      {isRefund && (
        <div className='absolute inset-0 flex items-center justify-center pointer-events-none opacity-10'>
          <span className='text-6xl font-bold text-red-500 rotate-[-30deg]'>REFUND</span>
        </div>
      )}
    </div>
  );

  // Determine which copies to print
  const copiesToPrint = [];
  if (receiptCopySettings.office_copy) copiesToPrint.push('OFFICE COPY');
  if (receiptCopySettings.student_copy) copiesToPrint.push('STUDENT COPY');
  if (receiptCopySettings.bank_copy) copiesToPrint.push('BANK COPY');
  if (copiesToPrint.length === 0) copiesToPrint.push('RECEIPT');

  return (
    <div className='min-h-screen bg-gray-100'>
      {/* Print Button - Hidden when printing */}
      <div className='print:hidden p-4 bg-white shadow-md flex justify-between items-center sticky top-0 z-10'>
        <Button variant='outline' onClick={() => navigate(-1)}>
          <ArrowLeft className='mr-2 h-4 w-4' />Back
        </Button>
        <div className='flex items-center gap-2'>
          <span className={`px-3 py-1 rounded text-sm font-medium ${isOriginal ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {isOriginal ? '🆕 Original Receipt' : '🔄 Reprint'}
          </span>
          <Button onClick={handlePrint}>
            <Printer className='mr-2 h-4 w-4' />Print Receipt
          </Button>
        </div>
      </div>

      {/* Receipt Preview */}
      <div className='p-4 print:p-0'>
        <div className='max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none'>
          {copiesToPrint.map((copyType, idx) => (
            <React.Fragment key={copyType}>
              <Receipt copyType={copyType} />
              {idx < copiesToPrint.length - 1 && (
                <div className='border-t-2 border-dashed border-gray-400 my-1 print:my-0' />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 5mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default PrintReceipt;
