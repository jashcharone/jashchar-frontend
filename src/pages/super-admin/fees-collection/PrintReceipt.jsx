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
  
  const { user, organizationId, currentSessionName } = useAuth();
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
  const [paperSize, setPaperSize] = useState('A5'); // A5 or A4
  
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

    // 2b. Check for full receipt snapshot (saved on first print)
    const snapshotPayment = paymentData.find(p => p.receipt_snapshot?.lineItems);
    if (snapshotPayment) {
      const snap = snapshotPayment.receipt_snapshot;
      setIsOriginal(!paymentData.some(p => p.printed_at));
      return {
        student: snap.student ? {
          full_name: snap.student.full_name,
          father_name: snap.student.father_name,
          school_code: snap.student.school_code,
          admission_no: snap.student.admission_no,
          class: { name: snap.student.class_name },
          section: { name: snap.student.section_name }
        } : null,
        payments: paymentData,
        lineItems: snap.lineItems,
        totalPaid: snap.totalPaid,
        totalDiscount: snap.totalDiscount,
        totalFine: snap.totalFine,
        grandTotal: snap.grandTotal,
        overallTotalAmount: snap.overallTotalAmount,
        overallBalance: snap.overallBalance,
        transactionId: snap.transactionId,
        receiptDate: snap.receiptDate,
        paymentMode: snap.paymentMode,
        remarks: snap.remarks,
        extraInfo: snap.extraInfo,
        _snapshotSchool: snap.school,
        _snapshotPrintSettings: snap.printSettings,
      };
    }

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

    // 4b. Get ACADEMIC YEAR TOTALS per fee_type (sum ALL installments)
    const feeTypeIds = [...new Set(feeMasters?.map(fm => fm.fee_types?.id || fm.fee_type_id).filter(Boolean))];
    const sessionId = feeMasters?.[0]?.session_id;
    const classId = student?.class_id;

    let academicTotalByType = {};
    let academicDiscountByType = {};
    let academicBalanceByType = {};

    if (feeTypeIds.length > 0 && sessionId && classId) {
      // Get ALL fee_masters for this class/session (all installments)
      const { data: allClassMasters } = await supabase
        .from('fee_masters')
        .select('id, fee_type_id, amount')
        .eq('branch_id', branchId)
        .eq('session_id', sessionId)
        .eq('class_id', classId)
        .in('fee_type_id', feeTypeIds);

      const masterToType = {};
      allClassMasters?.forEach(m => {
        academicTotalByType[m.fee_type_id] = (academicTotalByType[m.fee_type_id] || 0) + Number(m.amount || 0);
        masterToType[m.id] = m.fee_type_id;
      });

      // Get student allocations for academic-level balance & discount
      const allMasterIds = allClassMasters?.map(m => m.id) || [];
      if (allMasterIds.length > 0) {
        const { data: allAllocations } = await supabase
          .from('student_fee_allocations')
          .select('fee_master_id, discount_amount, balance')
          .eq('student_id', studentId)
          .eq('branch_id', branchId)
          .in('fee_master_id', allMasterIds);

        allAllocations?.forEach(a => {
          const ftId = masterToType[a.fee_master_id];
          if (ftId) {
            academicDiscountByType[ftId] = (academicDiscountByType[ftId] || 0) + Number(a.discount_amount || 0);
            academicBalanceByType[ftId] = (academicBalanceByType[ftId] || 0) + Number(a.balance || 0);
          }
        });
      }
    }

    // 4c. For LEDGER payments: get academic totals per fee_name
    let ledgerAcademicData = {};
    const hasLedgerPayments = paymentData.some(p => p.ledger_id && !p.fee_master_id);
    if (hasLedgerPayments) {
      const { data: allLedger } = await supabase
        .from('student_fee_ledger')
        .select('fee_type_id, net_amount, discount_amount, balance, fee_types:fee_type_id(name)')
        .eq('student_id', studentId)
        .eq('branch_id', branchId);

      allLedger?.forEach(entry => {
        const name = entry.fee_types?.name || 'Fee';
        if (!ledgerAcademicData[name]) ledgerAcademicData[name] = { total: 0, discount: 0, balance: 0 };
        ledgerAcademicData[name].total += Number(entry.net_amount || 0);
        ledgerAcademicData[name].discount += Number(entry.discount_amount || 0);
        ledgerAcademicData[name].balance += Number(entry.balance || 0);
      });
    }

    // 5. Calculate payments with details (using academic totals)
    const paymentsWithMaster = paymentData.map(p => {
      // Fee Engine 3.0: Use receipt_snapshot for ledger-based payments
      if (p.ledger_id && !p.fee_master_id && p.receipt_snapshot) {
        const snap = p.receipt_snapshot;
        const feeName = snap.fee?.name || 'Fee';
        const ld = ledgerAcademicData[feeName];
        return {
          ...p,
          fee_name: feeName,
          fee_group_name: snap.fee?.group || '',
          total_fee_amount: ld?.total || Number(snap.fee?.total_amount || 0),
          academic_discount: ld?.discount || 0,
          balance: ld?.balance ?? (p.balance_after_payment ?? snap.calculated?.balance_after ?? 0),
        };
      }
      // Old system: use fee_masters lookup + academic totals
      const fm = feeMasters?.find(fm => fm.id === p.fee_master_id);
      const feeTypeId = fm?.fee_types?.id || fm?.fee_type_id;
      return {
        ...p,
        fee_name: fm?.fee_types?.name || fm?.name || 'Fee',
        fee_group_name: fm?.fee_groups?.name || '',
        total_fee_amount: academicTotalByType[feeTypeId] || Number(fm?.amount || 0),
        academic_discount: academicDiscountByType[feeTypeId] || 0,
        balance: academicBalanceByType[feeTypeId] ?? (p.balance_after_payment ?? 0)
      };
    });

    // 6. Check printed status
    const anyPrinted = paymentData.some(p => p.printed_at);
    setIsOriginal(!anyPrinted);

    // 7. Calculate totals — group by fee_type to avoid duplicating academic totals
    const totalPaid = paymentsWithMaster.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalFine = paymentsWithMaster.reduce((sum, p) => sum + Number(p.fine_paid || 0), 0);

    // Deduplicate academic totals per fee_type (multiple payments of same type in one transaction)
    const seenFeeTypes = new Set();
    let overallTotalAmount = 0;
    let overallBalance = 0;
    let totalDiscount = 0;
    paymentsWithMaster.forEach(p => {
      const key = p.fee_name;
      if (!seenFeeTypes.has(key)) {
        seenFeeTypes.add(key);
        overallTotalAmount += Number(p.total_fee_amount || 0);
        overallBalance += Number(p.balance || 0);
        totalDiscount += Number(p.academic_discount || 0);
      }
    });

    // Build lineItems — group by fee_name to show one row per fee type
    const lineItemMap = {};
    paymentsWithMaster.forEach(p => {
      const key = p.fee_name;
      if (!lineItemMap[key]) {
        lineItemMap[key] = {
          description: p.fee_name + (p.fee_group_name ? ` (${p.fee_group_name})` : ''),
          amount: 0,
          totalAmount: Number(p.total_fee_amount || 0),
          balance: Number(p.balance || 0),
          discount: Number(p.academic_discount || 0),
          fine: 0
        };
      }
      lineItemMap[key].amount += Number(p.amount || 0);
      lineItemMap[key].fine += Number(p.fine_paid || 0);
    });
    const lineItems = Object.values(lineItemMap);

    return {
      student,
      payments: paymentsWithMaster,
      lineItems,
      totalPaid,
      totalDiscount,
      totalFine,
      grandTotal: totalPaid,
      overallTotalAmount,
      overallBalance,
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
      totalAmount: Number(p.total_amount || p.amount || 0),
      balance: Number(p.balance_after_payment || 0),
      discount: 0,
      fine: Number(p.fine_paid || 0)
    }));

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalFine = payments.reduce((sum, p) => sum + Number(p.fine_paid || 0), 0);
    const overallTotalAmount = lineItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const overallBalance = lineItems.reduce((sum, item) => sum + item.balance, 0);

    return {
      student,
      payments,
      lineItems,
      totalPaid,
      totalDiscount: 0,
      totalFine,
      grandTotal: totalPaid,
      overallTotalAmount,
      overallBalance,
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
      totalAmount: Number(p.total_amount || p.amount || 0),
      balance: Number(p.balance_after_payment || 0),
      discount: 0,
      fine: Number(p.fine_paid || 0)
    }));

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalFine = payments.reduce((sum, p) => sum + Number(p.fine_paid || 0), 0);
    const overallTotalAmount = lineItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const overallBalance = lineItems.reduce((sum, item) => sum + item.balance, 0);

    return {
      student,
      payments,
      lineItems,
      totalPaid,
      totalDiscount: 0,
      totalFine,
      grandTotal: totalPaid,
      overallTotalAmount,
      overallBalance,
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
        totalAmount: Number(refund.amount || 0),
        balance: 0,
        discount: 0,
        fine: 0
      }],
      totalPaid: Number(refund.amount || 0),
      totalDiscount: 0,
      totalFine: 0,
      grandTotal: Number(refund.amount || 0),
      overallTotalAmount: Number(refund.amount || 0),
      overallBalance: 0,
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

      // Fetch school info (use snapshot if available)
      let schoolData = data._snapshotSchool || null;
      if (!schoolData) {
        const { data: freshSchool } = await supabase
          .from('schools')
          .select('*')
          .eq('id', branchId)
          .single();
        schoolData = freshSchool;
      }

      // Fetch print settings (use snapshot if available)
      let settingsData = data._snapshotPrintSettings || null;
      if (!settingsData) {
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
    // Mark as printed + save full receipt snapshot on first print
    if (isOriginal && receiptData?.payments?.length > 0 && receiptType !== 'refund') {
      const table = config.table;
      const paymentIds = receiptData.payments.map(p => p.id);

      // Build full receipt snapshot with ALL display information
      const fullSnapshot = {
        student: {
          full_name: receiptData.student?.full_name,
          father_name: receiptData.student?.father_name,
          school_code: receiptData.student?.school_code,
          admission_no: receiptData.student?.admission_no,
          class_name: receiptData.student?.class?.name,
          section_name: receiptData.student?.section?.name,
        },
        school: {
          name: receiptData.school?.name,
          address: receiptData.school?.address,
          contact_number: receiptData.school?.contact_number,
          contact_email: receiptData.school?.contact_email,
          logo_url: receiptData.school?.logo_url,
        },
        lineItems: receiptData.lineItems,
        totalPaid: receiptData.totalPaid,
        totalDiscount: receiptData.totalDiscount,
        totalFine: receiptData.totalFine,
        grandTotal: receiptData.grandTotal,
        overallTotalAmount: receiptData.overallTotalAmount,
        overallBalance: receiptData.overallBalance,
        transactionId: receiptData.transactionId,
        receiptDate: receiptData.receiptDate,
        paymentMode: receiptData.paymentMode,
        remarks: receiptData.remarks,
        extraInfo: receiptData.extraInfo,
        sessionName: currentSessionName,
        printedAt: new Date().toISOString(),
        printSettings: printSettings ? {
          header_image_url: printSettings.header_image_url,
          footer_content: printSettings.footer_content,
        } : null,
      };

      await supabase
        .from(table)
        .update({ 
          printed_at: new Date().toISOString(),
          receipt_snapshot: fullSnapshot
        })
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

  const { student, school, lineItems, totalPaid, totalDiscount, totalFine, grandTotal, overallTotalAmount = 0, overallBalance = 0, transactionId, receiptDate, paymentMode, remarks, extraInfo, isRefund } = receiptData;
  const Icon = config.icon;

  // Format receipt number
  const receiptNo = transactionId?.substring(0, 8).toUpperCase() || '-';

  // Number to words converter (Indian format)
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

  // ===== A5 PAPER RECEIPT COMPONENT =====
  const showConcession = totalDiscount > 0;
  const Receipt = ({ copyType }) => (
    <div style={{ 
      width: '100%', 
      padding: '0',
      boxSizing: 'border-box',
      pageBreakInside: 'avoid',
      position: 'relative',
      backgroundColor: '#fff',
      color: '#000',
      fontFamily: 'Arial, Helvetica, sans-serif'
    }}>

      {/* ===== HEADER ===== */}
      {printSettings?.header_image_url ? (
        <div style={{ width: '100%' }}>
          <img src={printSettings.header_image_url} alt='Header' style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
      ) : (
        <div style={{ borderBottom: '2px solid #000', padding: '8px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {/* Logo */}
            <div style={{ width: '60px', flexShrink: 0 }}>
              {school?.logo_url && <img src={school.logo_url} alt='Logo' style={{ height: '50px', width: 'auto' }} />}
            </div>
            {/* School Name + Address */}
            <div style={{ flex: 1, textAlign: 'center', padding: '0 8px' }}>
              <h1 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0', letterSpacing: '1px', lineHeight: '1.2' }}>
                {school?.name || selectedBranch?.branch_name || '-'}
              </h1>
              {school?.address && (
                <p style={{ fontSize: '9px', color: '#333', margin: '3px 0 0', lineHeight: '1.3' }}>{school.address}</p>
              )}
              {(school?.contact_number || school?.contact_email) && (
                <p style={{ fontSize: '8px', color: '#555', margin: '2px 0 0' }}>
                  {school?.contact_number && `Ph: ${school.contact_number}`}
                  {school?.contact_number && school?.contact_email && ' | '}
                  {school?.contact_email && `Email: ${school.contact_email}`}
                </p>
              )}
            </div>
            {/* Copy Type Label */}
            <div style={{ width: '80px', textAlign: 'right', flexShrink: 0 }}>
              <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#555', textTransform: 'lowercase', fontStyle: 'italic' }}>{copyType.toLowerCase()}</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== FEE RECEIPT TITLE ===== */}
      <div style={{ textAlign: 'center', padding: '5px 0', borderBottom: '1px solid #999' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>{config.title}</span>
        {!isOriginal && <span style={{ fontSize: '8px', color: '#c00', marginLeft: '8px', fontWeight: 'bold' }}>(REPRINT)</span>}
      </div>

      {/* ===== STUDENT INFO - 2 COLUMNS ===== */}
      <div style={{ display: 'flex', padding: '5px 10px', borderBottom: '1px solid #ccc', fontSize: '9px', gap: '6px' }}>
        {/* Left Column */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Transaction ID</span>
            <span>: <strong>{transactionId || '-'}</strong></span>
          </div>
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Name</span>
            <span>: <strong style={{ textTransform: 'uppercase' }}>{student?.full_name || '-'}</strong></span>
          </div>
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Father Name</span>
            <span>: {student?.father_name || '-'}</span>
          </div>
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Admission No</span>
            <span>: {student?.school_code || student?.admission_no || '-'}</span>
          </div>
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Academic Year</span>
            <span>: {currentSessionName || '-'}</span>
          </div>
          {extraInfo?.type === 'hostel' && (
            <div style={{ display: 'flex', marginBottom: '2px' }}>
              <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Room/Bed</span>
              <span>: {extraInfo.roomNo} / {extraInfo.bedNo}</span>
            </div>
          )}
          {extraInfo?.type === 'transport' && (
            <>
              <div style={{ display: 'flex', marginBottom: '2px' }}>
                <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Route</span>
                <span>: {extraInfo.route}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: '2px' }}>
                <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Pickup Point</span>
                <span>: {extraInfo.pickupPoint}</span>
              </div>
            </>
          )}
        </div>
        {/* Right Column */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ width: '95px', fontWeight: '600', color: '#444' }}>Transaction Date</span>
            <span>: {receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy') : '-'}</span>
          </div>
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ width: '95px', fontWeight: '600', color: '#444' }}>Receipt No</span>
            <span>: <strong>{receiptNo}</strong></span>
          </div>
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ width: '95px', fontWeight: '600', color: '#444' }}>Class</span>
            <span>: {student?.class?.name || '-'}{student?.section?.name ? ` >> ${student.section.name}` : ''}</span>
          </div>
        </div>
      </div>

      {/* ===== FEE TABLE ===== */}
      <div style={{ padding: '4px 10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'center', width: '28px' }}>S.no</th>
              <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'left' }}>Particulars</th>
              <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right', width: '72px' }}>Academic Total Fee</th>
              {showConcession && <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right', width: '62px' }}>Concession</th>}
              {showConcession && <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right', width: '62px' }}>Net Amount</th>}
              <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right', width: '62px' }}>Paid Amount</th>
              <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right', width: '55px' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => {
              const concession = Number(item.discount || 0);
              const netAmount = Number(item.totalAmount || 0) - concession;
              return (
                <tr key={idx}>
                  <td style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #888', padding: '3px 4px' }}>{item.description}</td>
                  <td style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right' }}>{Number(item.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  {showConcession && <td style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right' }}>{concession > 0 ? concession.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</td>}
                  {showConcession && <td style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right' }}>{netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>}
                  <td style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right' }}>{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right' }}>{Number(item.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              );
            })}
            {totalFine > 0 && (
              <tr>
                <td style={{ border: '1px solid #888', padding: '3px 4px' }}></td>
                <td style={{ border: '1px solid #888', padding: '3px 4px', color: '#cc0000' }}>Late Fine</td>
                <td style={{ border: '1px solid #888', padding: '3px 4px' }}></td>
                {showConcession && <td style={{ border: '1px solid #888', padding: '3px 4px' }}></td>}
                {showConcession && <td style={{ border: '1px solid #888', padding: '3px 4px' }}></td>}
                <td style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right', color: '#cc0000' }}>+{totalFine.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style={{ border: '1px solid #888', padding: '3px 4px' }}></td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
              <td style={{ border: '1px solid #888', padding: '4px' }}></td>
              <td style={{ border: '1px solid #888', padding: '4px', textAlign: 'right' }}>{isRefund ? 'Total Refund' : 'Total'}</td>
              <td style={{ border: '1px solid #888', padding: '4px', textAlign: 'right' }}>{overallTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              {showConcession && <td style={{ border: '1px solid #888', padding: '4px', textAlign: 'right' }}>{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>}
              {showConcession && <td style={{ border: '1px solid #888', padding: '4px', textAlign: 'right' }}>{(overallTotalAmount - totalDiscount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>}
              <td style={{ border: '1px solid #888', padding: '4px', textAlign: 'right' }}>{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td style={{ border: '1px solid #888', padding: '4px', textAlign: 'right' }}>{overallBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ===== AMOUNT IN WORDS ===== */}
      <div style={{ padding: '3px 10px', fontSize: '9px', borderTop: '1px solid #ccc' }}>
        <span style={{ fontWeight: '600', color: '#444' }}>Amount in Words: </span>
        <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>{amountInWords}</span>
      </div>

      {/* ===== PAYMENT MODE FOOTER ===== */}
      <div style={{ padding: '4px 10px', borderTop: '1px solid #ccc', fontSize: '9px' }}>
        {paymentMode?.toLowerCase() === 'cash' ? (
          <p style={{ fontWeight: 'bold', margin: '0' }}>Received by Cash</p>
        ) : (
          <div>
            <p style={{ fontWeight: 'bold', margin: '0' }}>Received by {paymentMode?.toUpperCase()} Payments</p>
            {remarks && <p style={{ fontSize: '8px', color: '#444', margin: '2px 0 0' }}>Remarks: {remarks}</p>}
          </div>
        )}
      </div>

      {/* ===== NOTE + SIGNATURE ===== */}
      <div style={{ padding: '6px 10px', borderTop: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ fontSize: '7px', color: '#666', maxWidth: '55%' }}>
          <p style={{ margin: '0' }}>Note: This is a computer generated receipt. Please preserve this receipt for future reference.</p>
          <p style={{ margin: '2px 0 0', color: '#888' }}>Printed: {format(currentDateTime, 'dd-MM-yyyy hh:mm a')}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #333', paddingTop: '3px', minWidth: '90px' }}>
            <span style={{ fontSize: '8px', color: '#444' }}>Cashier/Manager</span>
          </div>
        </div>
      </div>

      {/* Custom footer content from print settings */}
      {printSettings?.footer_content && (
        <div style={{ padding: '4px 10px', borderTop: '1px solid #ccc', fontSize: '8px', color: '#555' }} 
             dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} />
      )}

      {/* REFUND WATERMARK */}
      {isRefund && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.08, pointerEvents: 'none' }}>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'red' }}>REFUND</span>
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
          {/* Paper Size Toggle */}
          <div className='flex border rounded overflow-hidden'>
            <button 
              onClick={() => setPaperSize('A5')} 
              className={`px-3 py-1 text-sm font-medium transition-colors ${paperSize === 'A5' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >A5</button>
            <button 
              onClick={() => setPaperSize('A4')} 
              className={`px-3 py-1 text-sm font-medium transition-colors ${paperSize === 'A4' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >A4</button>
          </div>
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
        <div style={{ maxWidth: paperSize === 'A4' ? '210mm' : '148mm', margin: '0 auto' }} className='bg-white shadow-lg print:shadow-none'>
          {paperSize === 'A4' ? (
            // A4 Layout: 2 receipts per page
            (() => {
              const pages = [];
              for (let i = 0; i < copiesToPrint.length; i += 2) {
                const pair = copiesToPrint.slice(i, i + 2);
                pages.push(
                  <div key={i} style={{ pageBreakAfter: i + 2 < copiesToPrint.length ? 'always' : 'auto' }}>
                    {pair.map((copyType, pairIdx) => (
                      <div key={copyType} style={{ 
                        height: '50%', 
                        boxSizing: 'border-box',
                        borderBottom: pairIdx === 0 && pair.length > 1 ? '1px dashed #999' : 'none',
                        overflow: 'hidden'
                      }}>
                        <Receipt copyType={copyType} />
                      </div>
                    ))}
                  </div>
                );
              }
              return pages;
            })()
          ) : (
            // A5 Layout: 1 receipt per page
            copiesToPrint.map((copyType, idx) => (
              <div key={copyType} style={{ pageBreakAfter: idx < copiesToPrint.length - 1 ? 'always' : 'auto' }}>
                <Receipt copyType={copyType} />
                {idx < copiesToPrint.length - 1 && (
                  <div className='border-t-2 border-dashed border-gray-400 my-2 print:hidden' />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dynamic Print Styles */}
      <style>{`
        @media print {
          @page { size: ${paperSize}; margin: ${paperSize === 'A4' ? '3mm' : '5mm'}; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default PrintReceipt;
