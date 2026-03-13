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
import { Printer, Loader2, ArrowLeft, Building2, Bus, CreditCard, RotateCcw, Receipt } from 'lucide-react';
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
  },
  combined: {
    title: 'FEE RECEIPT',
    table: 'combined',
    icon: Receipt,
    color: 'bg-indigo-600',
    idField: 'paymentId'
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

    // 2b. Always recompute from live data for accuracy.
    //     Snapshot is still saved on first print for archival.
    const anyPrintedAlready = paymentData.some(p => p.printed_at);
    setIsOriginal(!anyPrintedAlready);

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

      // Get student allocations for academic-level balance
      const allMasterIds = allClassMasters?.map(m => m.id) || [];
      if (allMasterIds.length > 0) {
        const { data: allAllocations } = await supabase
          .from('student_fee_allocations')
          .select('fee_master_id, balance')
          .eq('student_id', studentId)
          .eq('branch_id', branchId)
          .in('fee_master_id', allMasterIds);

        allAllocations?.forEach(a => {
          const ftId = masterToType[a.fee_master_id];
          if (ftId) {
            academicBalanceByType[ftId] = (academicBalanceByType[ftId] || 0) + Number(a.balance || 0);
          }
        });
        // Note: Discount is now taken directly from THIS transaction's fee_payments.discount_amount
        // Not from cumulative all-payments sum
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
          // Use THIS transaction's discount_amount, NOT cumulative
          academic_discount: Number(p.discount_amount || 0),
          balance: ld?.balance ?? (p.balance_after_payment ?? snap.calculated?.balance_after ?? 0),
        };
      }
      // Old system: use fee_masters lookup + academic totals
      const fm = feeMasters?.find(fm => fm.id === p.fee_master_id);
      const feeTypeId = fm?.fee_types?.id || fm?.fee_type_id;
      
      // FALLBACK: If fee_master lookup fails, use receipt_snapshot
      if (!fm && p.receipt_snapshot) {
        const snap = p.receipt_snapshot;
        return {
          ...p,
          fee_name: snap.fee?.name || 'Fee',
          fee_group_name: snap.fee?.group || '',
          total_fee_amount: Number(snap.fee?.total_amount || 0),
          academic_discount: Number(p.discount_amount || 0),
          balance: p.balance_after_payment ?? snap.calculated?.balance_after ?? 0
        };
      }
      
      return {
        ...p,
        fee_name: fm?.fee_types?.name || fm?.name || 'Fee',
        fee_group_name: fm?.fee_groups?.name || '',
        total_fee_amount: academicTotalByType[feeTypeId] || Number(fm?.amount || 0),
        // Use THIS transaction's discount_amount, NOT cumulative
        academic_discount: Number(p.discount_amount || 0),
        balance: academicBalanceByType[feeTypeId] ?? (p.balance_after_payment ?? 0)
      };
    });

    // 6. Check printed status
    const anyPrinted = paymentData.some(p => p.printed_at);
    setIsOriginal(!anyPrinted);

    // 7. FETCH ALL FEE LEDGER FOR FEE STATEMENT (student_fee_ledger has actual amounts)
    let feeStatement = [];
    if (studentId) {
      // Get from student_fee_ledger which has net_amount, balance, etc.
      const { data: ledgerEntries } = await supabase
        .from('student_fee_ledger')
        .select('id, fee_type_id, net_amount, discount_amount, balance, fee_types:fee_type_id(name)')
        .eq('student_id', studentId)
        .eq('branch_id', branchId);

      if (ledgerEntries?.length > 0) {
        feeStatement = ledgerEntries.map(entry => {
          const amount = Number(entry.net_amount || 0);
          const balance = Number(entry.balance || 0);
          const paid = Math.max(0, amount - balance);
          return {
            name: entry.fee_types?.name || 'Fee',
            amount,
            paid,
            balance,
            status: balance <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid')
          };
        }).filter(f => f.amount > 0);
      }
    }

    // 8. CHECK IF SNAPSHOT EXISTS WITH COMPLETE DATA - USE IT DIRECTLY
    const firstPayment = paymentData[0];
    if (firstPayment?.receipt_snapshot?.lineItems?.length > 0) {
      const snap = firstPayment.receipt_snapshot;
      return {
        student,
        payments: paymentData,
        lineItems: snap.lineItems,
        feeStatement: snap.feeStatement || feeStatement,
        totalPaid: snap.totalPaid || snap.grandTotal,
        totalDiscount: snap.totalDiscount || 0,
        totalFine: snap.totalFine || 0,
        grandTotal: snap.grandTotal,
        overallTotalAmount: snap.overallTotalAmount,
        overallBalance: snap.overallBalance,
        transactionId,
        receiptDate: snap.receiptDate || firstPayment.created_at || firstPayment.payment_date,
        paymentMode: snap.paymentMode || firstPayment.payment_mode || 'Cash',
        remarks: firstPayment.remarks
      };
    }

    // 8. FALLBACK: Calculate totals — group by fee_type to avoid duplicating academic totals
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
          discount: 0,  // Start at 0, accumulate from THIS transaction
          fine: 0
        };
      }
      lineItemMap[key].amount += Number(p.amount || 0);
      lineItemMap[key].discount += Number(p.academic_discount || 0);  // Sum THIS transaction's discounts
      lineItemMap[key].fine += Number(p.fine_paid || 0);
    });
    const lineItems = Object.values(lineItemMap);

    return {
      student,
      payments: paymentsWithMaster,
      lineItems,
      feeStatement,
      totalPaid,
      totalDiscount,
      totalFine,
      grandTotal: totalPaid,
      overallTotalAmount,
      overallBalance,
      transactionId,
      receiptDate: paymentsWithMaster[0]?.created_at || paymentsWithMaster[0]?.payment_date,
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
      receiptDate: payment.created_at || payment.payment_date,
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
      receiptDate: payment.created_at || payment.payment_date,
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
  // COMBINED RECEIPT (Academic + Transport + Hostel)
  // =====================================

  const fetchCombinedReceipt = useCallback(async () => {
    // Get IDs from query params: ?fees=id1&transport=id2&hostel=id3
    const feesId = searchParams.get('fees');
    const transportId = searchParams.get('transport');
    const hostelId = searchParams.get('hostel');

    let student = null;
    let allLineItems = [];
    let totalPaid = 0;
    let totalDiscount = 0;
    let totalFine = 0;
    let overallTotalAmount = 0;
    let overallBalance = 0;
    let transactionId = null;
    let receiptDate = null;
    let paymentMode = 'Cash';
    let allPayments = [];
    let extraInfo = { type: 'combined', sections: [] };
    let feeStatement = [];

    // 1. FETCH ACADEMIC FEE PAYMENT
    if (feesId) {
      const { data: feePayment, error: feeError } = await supabase
        .from('fee_payments')
        .select('*')
        .eq('id', feesId)
        .eq('branch_id', branchId)
        .single();

      if (!feeError && feePayment) {
        allPayments.push(feePayment);
        transactionId = feePayment.transaction_id;
        receiptDate = feePayment.created_at || feePayment.payment_date;
        paymentMode = feePayment.payment_mode || 'Cash';

        // Fetch student if not yet fetched
        if (!student) {
          const { data: studentData } = await supabase
            .from('student_profiles')
            .select('*, classes!student_profiles_class_id_fkey(name), sections!student_profiles_section_id_fkey(name)')
            .eq('id', feePayment.student_id)
            .eq('branch_id', branchId)
            .maybeSingle();
          student = studentData ? { ...studentData, class: studentData.classes, section: studentData.sections } : null;
        }

        // Use snapshot if available
        if (feePayment.receipt_snapshot?.lineItems) {
          const snap = feePayment.receipt_snapshot;
          snap.lineItems.forEach(item => {
            allLineItems.push({
              ...item,
              category: 'Academic Fee'
            });
          });
          totalPaid += snap.totalPaid || snap.grandTotal || 0;
          totalDiscount += snap.totalDiscount || 0;
          totalFine += snap.totalFine || 0;
          overallTotalAmount += snap.overallTotalAmount || 0;
          overallBalance += snap.overallBalance || 0;
          if (snap.feeStatement) feeStatement = snap.feeStatement;
        } else {
          // Fetch ledger for academic totals
          const { data: ledgerEntries } = await supabase
            .from('student_fee_ledger')
            .select('id, fee_type_id, net_amount, discount_amount, balance, fee_types:fee_type_id(name)')
            .eq('student_id', feePayment.student_id)
            .eq('branch_id', branchId);

          if (ledgerEntries?.length > 0) {
            // Build fee statement
            feeStatement = ledgerEntries.map(entry => {
              const amount = Number(entry.net_amount || 0);
              const balance = Number(entry.balance || 0);
              const paid = Math.max(0, amount - balance);
              return {
                name: entry.fee_types?.name || 'Fee',
                amount,
                paid,
                balance,
                status: balance <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid')
              };
            }).filter(f => f.amount > 0);

            // Find matching ledger entry for this payment
            const matchingLedger = ledgerEntries.find(l => l.id === feePayment.ledger_id);
            const feeName = matchingLedger?.fee_types?.name || 'Academic Fee';
            
            allLineItems.push({
              description: feeName,
              amount: Number(feePayment.amount || 0),
              totalAmount: Number(matchingLedger?.net_amount || feePayment.amount || 0),
              balance: Number(feePayment.balance_after_payment || matchingLedger?.balance || 0),
              discount: Number(feePayment.discount_amount || 0),
              fine: Number(feePayment.fine_paid || 0),
              category: 'Academic Fee'
            });

            totalPaid += Number(feePayment.amount || 0);
            totalDiscount += Number(feePayment.discount_amount || 0);
            totalFine += Number(feePayment.fine_paid || 0);
            overallTotalAmount += Number(matchingLedger?.net_amount || feePayment.amount || 0);
            overallBalance += Number(feePayment.balance_after_payment || matchingLedger?.balance || 0);
          }
        }
        extraInfo.sections.push('Academic');
      }
    }

    // 2. FETCH TRANSPORT FEE PAYMENT
    if (transportId) {
      const { data: transportPayment, error: transportError } = await supabase
        .from('transport_fee_payments')
        .select('*')
        .eq('id', transportId)
        .eq('branch_id', branchId)
        .single();

      if (!transportError && transportPayment) {
        allPayments.push(transportPayment);
        if (!transactionId) transactionId = transportPayment.transaction_id;
        if (!receiptDate) receiptDate = transportPayment.created_at || transportPayment.payment_date;
        if (paymentMode === 'Cash') paymentMode = transportPayment.payment_mode || 'Cash';

        // Fetch student if not yet fetched
        if (!student) {
          const { data: studentData } = await supabase
            .from('student_profiles')
            .select('*, classes!student_profiles_class_id_fkey(name), sections!student_profiles_section_id_fkey(name)')
            .eq('id', transportPayment.student_id)
            .eq('branch_id', branchId)
            .maybeSingle();
          student = studentData ? { ...studentData, class: studentData.classes, section: studentData.sections } : null;
        }

        // Fetch transport details
        const { data: transportDetails } = await supabase
          .from('student_transport_details')
          .select('*, route:transport_route_id(route_title, fare), pickup_point:transport_pickup_point_id(name)')
          .eq('student_id', transportPayment.student_id)
          .eq('branch_id', branchId)
          .maybeSingle();

        const routeName = transportDetails?.route?.route_title || 'Transport';
        const routeFare = Number(transportDetails?.route?.fare || transportPayment.total_amount || transportPayment.amount || 0);

        allLineItems.push({
          description: `Transport - ${routeName}${transportPayment.month ? ` (${transportPayment.month})` : ''}`,
          amount: Number(transportPayment.amount || 0),
          totalAmount: routeFare,
          balance: Number(transportPayment.balance_after_payment || 0),
          discount: 0,
          fine: Number(transportPayment.fine_paid || 0),
          category: 'Transport Fee'
        });

        totalPaid += Number(transportPayment.amount || 0);
        totalFine += Number(transportPayment.fine_paid || 0);
        overallTotalAmount += routeFare;
        overallBalance += Number(transportPayment.balance_after_payment || 0);

        extraInfo.route = routeName;
        extraInfo.pickupPoint = transportDetails?.pickup_point?.name || '-';
        extraInfo.sections.push('Transport');
      }
    }

    // 3. FETCH HOSTEL FEE PAYMENT
    if (hostelId) {
      const { data: hostelPayment, error: hostelError } = await supabase
        .from('hostel_fee_payments')
        .select('*')
        .eq('id', hostelId)
        .eq('branch_id', branchId)
        .single();

      if (!hostelError && hostelPayment) {
        allPayments.push(hostelPayment);
        if (!transactionId) transactionId = hostelPayment.transaction_id;
        if (!receiptDate) receiptDate = hostelPayment.created_at || hostelPayment.payment_date;
        if (paymentMode === 'Cash') paymentMode = hostelPayment.payment_mode || 'Cash';

        // Fetch student if not yet fetched
        if (!student) {
          const { data: studentData } = await supabase
            .from('student_profiles')
            .select('*, classes!student_profiles_class_id_fkey(name), sections!student_profiles_section_id_fkey(name)')
            .eq('id', hostelPayment.student_id)
            .eq('branch_id', branchId)
            .maybeSingle();
          student = studentData ? { ...studentData, class: studentData.classes, section: studentData.sections } : null;
        }

        // Fetch hostel details
        const { data: hostelDetails } = await supabase
          .from('student_hostel_details')
          .select('*, room:room_id(room_number_name)')
          .eq('student_id', hostelPayment.student_id)
          .eq('branch_id', branchId)
          .maybeSingle();

        allLineItems.push({
          description: `Hostel Fee${hostelPayment.month ? ` - ${hostelPayment.month}` : ''}`,
          amount: Number(hostelPayment.amount || 0),
          totalAmount: Number(hostelPayment.total_amount || hostelPayment.amount || 0),
          balance: Number(hostelPayment.balance_after_payment || 0),
          discount: 0,
          fine: Number(hostelPayment.fine_paid || 0),
          category: 'Hostel Fee'
        });

        totalPaid += Number(hostelPayment.amount || 0);
        totalFine += Number(hostelPayment.fine_paid || 0);
        overallTotalAmount += Number(hostelPayment.total_amount || hostelPayment.amount || 0);
        overallBalance += Number(hostelPayment.balance_after_payment || 0);

        extraInfo.roomNo = hostelDetails?.room?.room_number_name || hostelDetails?.room_number || '-';
        extraInfo.bedNo = hostelDetails?.bed_number || '-';
        extraInfo.sections.push('Hostel');
      }
    }

    if (!student) throw new Error('No valid payments found');

    // Check printed status
    const anyPrinted = allPayments.some(p => p.printed_at);
    setIsOriginal(!anyPrinted);

    return {
      student,
      payments: allPayments,
      lineItems: allLineItems,
      feeStatement,
      totalPaid,
      totalDiscount,
      totalFine,
      grandTotal: totalPaid,
      overallTotalAmount,
      overallBalance,
      transactionId,
      receiptDate,
      paymentMode,
      remarks: allPayments[0]?.remarks || '',
      extraInfo,
      isCombined: true
    };
  }, [branchId, searchParams]);

  // =====================================
  // MAIN FETCH
  // =====================================

  const fetchAllDetails = useCallback(async () => {
    if ((!paymentId && receiptType !== 'combined') || !branchId) {
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
        case 'combined':
          data = await fetchCombinedReceipt();
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
  }, [paymentId, branchId, receiptType, selectedBranch, fetchFeesReceipt, fetchHostelReceipt, fetchTransportReceipt, fetchRefundReceipt, fetchCombinedReceipt, toast]);

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
        feeStatement: receiptData.feeStatement,
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

  const { student, school, lineItems, feeStatement = [], totalPaid, totalDiscount, totalFine, grandTotal, overallTotalAmount = 0, overallBalance = 0, transactionId, receiptDate, paymentMode, remarks, extraInfo, isRefund } = receiptData;
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
  // Show "All previous paid amount" column only if any fee has previous payments
  const showPrevPaid = lineItems.some(item => {
    const totalPaidToDate = Number(item.totalAmount || 0) - Number(item.discount || 0) - Number(item.balance || 0);
    return Math.max(0, totalPaidToDate - Number(item.amount || 0)) > 0;
  });
  const Receipt = ({ copyType }) => (
    <div style={{ 
      width: '200mm', 
      height: '140mm',
      padding: '0',
      boxSizing: 'border-box',
      pageBreakInside: 'avoid',
      position: 'relative',
      backgroundColor: '#fff',
      color: '#000',
      fontFamily: 'Arial, Helvetica, sans-serif',
      border: '1px solid #333',
      borderRadius: '3px',
      overflow: 'hidden'
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
            {/* Address Info */}
            <div style={{ width: '140px', textAlign: 'right', flexShrink: 0, fontSize: '8px', color: '#333' }}>
            </div>
          </div>
        </div>
      )}

      {/* ===== FEE RECEIPT TITLE ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid #999', backgroundColor: '#1a237e', color: '#fff' }}>
        <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#fff', backgroundColor: '#4caf50', padding: '3px 10px', borderRadius: '3px' }}>Receipt No: {transactionId?.split('/').pop() || receiptNo}</span>
        <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase', color: '#fff' }}>{config.title}</span>
          {!isOriginal && <span style={{ fontSize: '9px', color: '#ffeb3b', fontWeight: 'bold', backgroundColor: '#c62828', padding: '3px 8px', borderRadius: '3px' }}>REPRINT</span>}
          {/* Copy Type Label */}
          <span style={{ 
            fontSize: '9px', 
            fontWeight: 'bold', 
            color: '#fff', 
            backgroundColor: copyType === 'OFFICE COPY' ? '#d32f2f' : copyType === 'STUDENT COPY' ? '#2196f3' : '#388e3c',
            padding: '3px 8px',
            borderRadius: '3px',
            textTransform: 'uppercase'
          }}>{copyType}</span>
        </div>
        <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#1a237e', backgroundColor: '#ffeb3b', padding: '3px 10px', borderRadius: '3px' }}>Transaction ID: {transactionId || '-'}</span>
      </div>

      {/* ===== STUDENT INFO - 2 COLUMNS ===== */}
      <div style={{ display: 'flex', padding: '5px 10px', borderBottom: '1px solid #ccc', fontSize: '9px', gap: '6px' }}>
        {/* Left Column */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', marginBottom: '2px', backgroundColor: '#fffde7', padding: '3px 4px', borderRadius: '3px', alignItems: 'center' }}>
            <span style={{ width: '85px', fontWeight: 'bold', color: '#444', fontSize: '12px' }}>Student Name</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>: <strong style={{ textTransform: 'uppercase', fontSize: '12px', color: '#1a237e', backgroundColor: '#e3f2fd', padding: '3px 10px', borderRadius: '3px' }}>{student?.full_name || '-'}</strong></span>
          </div>
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Father's Name</span>
            <span>: {student?.father_name || '-'}</span>
          </div>
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Admission No</span>
            <span>: {student?.school_code || student?.admission_no || '-'}</span>
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
            <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Date & Time</span>
            <span>: {receiptDate ? format(new Date(receiptDate), 'dd MMM yyyy hh:mm a') : '-'}</span>
          </div>
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Payment Mode</span>
            <span>: <strong>{paymentMode || 'Cash'}</strong></span>
          </div>
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Academic Year</span>
            <span>: {currentSessionName || '-'}</span>
          </div>
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ width: '85px', fontWeight: '600', color: '#444' }}>Class</span>
            <span>: {student?.class?.name || '-'}{student?.section?.name ? ` (${student.section.name})` : ''}</span>
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
              <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right', width: '72px' }}>Academic<br/>Total Amount</th>
              {showPrevPaid && <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right', width: '68px' }}>All Previous<br/>Paid Amount</th>}
              <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right', width: '62px' }}>Net Amount</th>
              {showConcession && <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right', width: '62px' }}>Concession</th>}
              <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right', width: '62px' }}>Paid Amount</th>
              <th style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right', width: '55px' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => {
              const concession = Number(item.discount || 0);
              const totalPaidToDate = Number(item.totalAmount || 0) - concession - Number(item.balance || 0);
              const previousPaid = Math.max(0, totalPaidToDate - Number(item.amount || 0));
              const netAmount = Number(item.totalAmount || 0) - previousPaid;
              return (
                <tr key={idx} style={{ backgroundColor: '#fef9e7' }}>
                  <td style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #888', padding: '3px 4px', fontWeight: '600', color: '#1565c0' }}>{item.description}</td>
                  <td style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right' }}>{Number(item.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  {showPrevPaid && <td style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right' }}>{previousPaid > 0 ? previousPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</td>}
                  <td style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right' }}>{netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  {showConcession && <td style={{ border: '1px solid #888', padding: '3px 4px', textAlign: 'right' }}>{concession > 0 ? concession.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</td>}
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
                {showPrevPaid && <td style={{ border: '1px solid #888', padding: '3px 4px' }}></td>}
                <td style={{ border: '1px solid #888', padding: '3px 4px' }}></td>
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
              {showPrevPaid && (() => {
                const totalPrevPaid = lineItems.reduce((sum, item) => {
                  const c = Number(item.discount || 0);
                  const paidToDate = Number(item.totalAmount || 0) - c - Number(item.balance || 0);
                  return sum + Math.max(0, paidToDate - Number(item.amount || 0));
                }, 0);
                return <td style={{ border: '1px solid #888', padding: '4px', textAlign: 'right' }}>{totalPrevPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>;
              })()}
              <td style={{ border: '1px solid #888', padding: '4px', textAlign: 'right' }}>{(() => {
                const totalPrevPaid = lineItems.reduce((sum, item) => {
                  const c = Number(item.discount || 0);
                  const paidToDate = Number(item.totalAmount || 0) - c - Number(item.balance || 0);
                  return sum + Math.max(0, paidToDate - Number(item.amount || 0));
                }, 0);
                return (overallTotalAmount - totalPrevPaid).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              })()}</td>
              {showConcession && <td style={{ border: '1px solid #888', padding: '4px', textAlign: 'right' }}>{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>}
              <td style={{ border: '1px solid #888', padding: '4px', textAlign: 'right' }}>{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td style={{ border: '1px solid #888', padding: '4px', textAlign: 'right' }}>{overallBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ===== FEE STATEMENT (ALL INSTALLMENTS SUMMARY) ===== */}
      {feeStatement.length > 0 && (
        <div style={{ padding: '4px 10px', borderTop: '1px solid #ccc' }}>
          <div style={{ fontSize: '8px', fontWeight: 'bold', marginBottom: '3px', color: '#333' }}>📋 FEE STATEMENT ({feeStatement.length} Installments)</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ border: '1px solid #aaa', padding: '2px 4px', textAlign: 'left' }}>Fee Name</th>
                <th style={{ border: '1px solid #aaa', padding: '2px 4px', textAlign: 'right', width: '70px' }}>Amount</th>
                <th style={{ border: '1px solid #aaa', padding: '2px 4px', textAlign: 'right', width: '70px' }}>Paid</th>
                <th style={{ border: '1px solid #aaa', padding: '2px 4px', textAlign: 'right', width: '70px' }}>Balance</th>
                <th style={{ border: '1px solid #aaa', padding: '2px 4px', textAlign: 'center', width: '55px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {feeStatement.map((fee, idx) => (
                <tr key={idx}>
                  <td style={{ border: '1px solid #aaa', padding: '2px 4px' }}>{fee.name}</td>
                  <td style={{ border: '1px solid #aaa', padding: '2px 4px', textAlign: 'right' }}>{fee.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ border: '1px solid #aaa', padding: '2px 4px', textAlign: 'right' }}>{fee.paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ border: '1px solid #aaa', padding: '2px 4px', textAlign: 'right' }}>{fee.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ border: '1px solid #aaa', padding: '2px 4px', textAlign: 'center', fontWeight: 'bold', fontSize: '7px', color: fee.status === 'PAID' ? '#080' : (fee.status === 'PARTIAL' ? '#c50' : '#c00') }}>{fee.status}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                <td style={{ border: '1px solid #aaa', padding: '2px 4px' }}>TOTAL:</td>
                <td style={{ border: '1px solid #aaa', padding: '2px 4px', textAlign: 'right' }}>{feeStatement.reduce((s, f) => s + f.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ border: '1px solid #aaa', padding: '2px 4px', textAlign: 'right' }}>{feeStatement.reduce((s, f) => s + f.paid, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ border: '1px solid #aaa', padding: '2px 4px', textAlign: 'right' }}>{feeStatement.reduce((s, f) => s + f.balance, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ border: '1px solid #aaa', padding: '2px 4px' }}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Custom footer content from print settings */}
      {printSettings?.footer_content && (
        <div 
          style={{ 
            padding: '8px 10px', 
            borderTop: '1px solid #ccc', 
            color: '#333',
            lineHeight: '1.4'
          }} 
          className="receipt-footer-content"
          dangerouslySetInnerHTML={{ __html: printSettings.footer_content }} 
        />
      )}
      <style>{`
        .receipt-footer-content h1 { font-size: 14px; margin: 0; }
        .receipt-footer-content h2 { font-size: 12px; margin: 0; }
        .receipt-footer-content h3 { font-size: 11px; margin: 0; }
        .receipt-footer-content p { font-size: 8px; margin: 2px 0; }
        .receipt-footer-content { font-size: 8px; }
        .receipt-footer-content * { box-sizing: border-box; }
        /* Quill alignment classes */
        .receipt-footer-content .ql-align-center { text-align: center; }
        .receipt-footer-content .ql-align-right { text-align: right; }
        .receipt-footer-content .ql-align-justify { text-align: justify; }
        .receipt-footer-content .ql-indent-1 { padding-left: 3em; }
        .receipt-footer-content .ql-indent-2 { padding-left: 6em; }
      `}</style>

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

  // Group copies into pairs for A4 pages (2 receipts per page)
  const receiptPages = [];
  for (let i = 0; i < copiesToPrint.length; i += 2) {
    receiptPages.push(copiesToPrint.slice(i, i + 2));
  }

  return (
    <div className='min-h-screen bg-gray-100'>
      {/* Print Button - Hidden when printing */}
      <div className='print:hidden p-4 bg-white shadow-md flex justify-between items-center sticky top-0 z-10'>
        <Button variant='outline' onClick={() => navigate(-1)}>
          <ArrowLeft className='mr-2 h-4 w-4' />Back
        </Button>
        <div className='flex items-center gap-2'>
          {/* Paper Info */}
          <span className='px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800'>
            A4 Portrait (2 Receipts)
          </span>
          <span className={`px-3 py-1 rounded text-sm font-medium ${isOriginal ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {isOriginal ? '🆕 Original Receipt' : '🔄 Reprint'}
          </span>
          <Button onClick={handlePrint}>
            <Printer className='mr-2 h-4 w-4' />Print Receipt
          </Button>
        </div>
      </div>

      {/* Receipt Preview - A4 Portrait with 2 A5 Landscape receipts */}
      <div className='p-4 print:p-0'>
        {receiptPages.map((pageCopies, pageIndex) => (
          <div 
            key={pageIndex}
            className='a4-page bg-white shadow-lg print:shadow-none'
            style={{ 
              width: '210mm', 
              height: '297mm', 
              margin: pageIndex === 0 ? '0 auto' : '20px auto 0',
              padding: '0',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              pageBreakAfter: pageIndex < receiptPages.length - 1 ? 'always' : 'auto'
            }}
          >
            {pageCopies.map((copyType, copyIndex) => (
              <div 
                key={copyType}
                className='receipt-half'
                style={{ 
                  width: '210mm', 
                  height: '145mm',
                  borderBottom: copyIndex === 0 && pageCopies.length > 1 ? '1px dashed #aaa' : 'none',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '2mm 4mm'
                }}
              >
                <Receipt copyType={copyType} />
              </div>
            ))}
            {/* Fill empty space if only 1 receipt on this page */}
            {pageCopies.length === 1 && (
              <div style={{ width: '210mm', height: '145mm', boxSizing: 'border-box' }}></div>
            )}
          </div>
        ))}
      </div>

      {/* Dynamic Print Styles - A4 Portrait with 2 A5 Landscape receipts */}
      <style>{`
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 3mm 5mm; 
          }
          html, body { 
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          .print\\:hidden { display: none !important; }
          .min-h-screen { min-height: unset !important; }
          .p-4 { padding: 0 !important; }
          .a4-page {
            width: 200mm !important;
            height: 291mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            page-break-after: always;
            page-break-inside: avoid !important;
          }
          .a4-page:last-child {
            page-break-after: auto;
          }
          .receipt-half {
            width: 200mm !important;
            height: 145mm !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintReceipt;
