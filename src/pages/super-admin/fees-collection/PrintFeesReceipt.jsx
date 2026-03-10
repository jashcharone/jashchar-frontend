import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

const PrintFeesReceipt = () => {
  const { paymentId } = useParams();
  const { user, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [printSettings, setPrintSettings] = useState(null);
  const [receiptCopySettings, setReceiptCopySettings] = useState({
    office_copy: true,
    student_copy: true,
    bank_copy: false
  });
  const [loading, setLoading] = useState(true);
  const [currentDateTime] = useState(new Date());
  const [isOriginal, setIsOriginal] = useState(true);
  
  // Unified branchId with fallback for staff users
  const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;
  const userOrgId = organizationId || user?.profile?.organization_id;

  const fetchAllDetails = useCallback(async () => {
    if (!paymentId || !branchId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
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

      // 2. Fetch All Payments
      let paymentQuery = supabase.from('fee_payments').select('*').eq('branch_id', branchId);
      if (transactionId) {
        paymentQuery = paymentQuery.eq('transaction_id', transactionId);
      } else {
        paymentQuery = paymentQuery.in('id', paymentIds);
      }
      const { data: paymentData, error: paymentError } = await paymentQuery;
      if (paymentError) throw paymentError;

      // 3. Fetch Student - Use student_profiles table directly
      let student = null;
      const { data: studentProfileData } = await supabase
        .from('student_profiles')
        .select('*, classes!student_profiles_class_id_fkey(name), sections!student_profiles_section_id_fkey(name)')
        .eq('id', studentId)
        .eq('branch_id', branchId)
        .maybeSingle();
      
      if (studentProfileData) {
        student = { ...studentProfileData, class: studentProfileData.classes, section: studentProfileData.sections };
      } else {
        // Fallback to profiles table for legacy data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*, classes(name), sections(name)')
          .eq('id', studentId)
          .eq('branch_id', branchId)
          .maybeSingle();
        if (studentProfileData) {
          student = { ...studentProfileData, class: studentProfileData.classes, section: studentProfileData.sections };
        }
      }
      if (!student) throw new Error('Student not found');

      // 4. Fetch Fee Masters with Fee Types
      const feeMasterIds = [...new Set(paymentData.map(p => p.fee_master_id).filter(Boolean))];
      const { data: feeMasters } = await supabase
        .from('fee_masters')
        .select('*, fee_types(id, name, code), fee_groups(id, name)')
        .in('id', feeMasterIds);

      // 5. Fetch ALL payments for these fee masters to calculate balance (include discount_amount!)
      // NOTE: This is used only as FALLBACK for old payments that don't have balance_after_payment
      const { data: allPaymentsForMasters } = await supabase
        .from('fee_payments')
        .select('fee_master_id, amount, discount_amount, student_id')
        .in('fee_master_id', feeMasterIds)
        .eq('student_id', studentId)
        .is('reverted_at', null);

      // Calculate total paid AND total discount per fee_master (for fallback/fee statement)
      const paidPerMaster = {};
      const discountPerMaster = {};
      allPaymentsForMasters?.forEach(p => {
        if (!paidPerMaster[p.fee_master_id]) paidPerMaster[p.fee_master_id] = 0;
        if (!discountPerMaster[p.fee_master_id]) discountPerMaster[p.fee_master_id] = 0;
        paidPerMaster[p.fee_master_id] += Number(p.amount || 0);
        discountPerMaster[p.fee_master_id] += Number(p.discount_amount || 0);
      });

      const paymentsWithMaster = paymentData.map(p => {
        const fm = feeMasters?.find(fm => fm.id === p.fee_master_id);
        const feeTypeName = fm?.fee_types?.name || fm?.name || 'Fee';
        const feeGroupName = fm?.fee_groups?.name || '';
        const totalFeeAmount = Number(fm?.amount || 0);
        
        // ✅ FIX: Use SAVED balance_after_payment if available (historical receipt)
        // Fall back to dynamic calculation only for OLD payments that don't have it saved
        let balance;
        if (p.balance_after_payment !== null && p.balance_after_payment !== undefined) {
          // Use saved historical balance (correct for old receipts!)
          balance = Number(p.balance_after_payment);
        } else {
          // Fallback: Calculate dynamically (only for old payments without saved balance)
          const totalPaidForThisFee = paidPerMaster[p.fee_master_id] || 0;
          const totalDiscountForThisFee = discountPerMaster[p.fee_master_id] || 0;
          balance = Math.max(0, totalFeeAmount - totalPaidForThisFee - totalDiscountForThisFee);
        }
        
        return {
          ...p,
          fee_master: fm || { name: 'Fee', amount: 0 },
          fee_name: feeTypeName,
          fee_group_name: feeGroupName,
          total_fee_amount: totalFeeAmount,
          total_paid_for_fee: paidPerMaster[p.fee_master_id] || 0,
          total_discount_for_fee: discountPerMaster[p.fee_master_id] || 0,
          balance: balance,
          due_date: fm?.due_date
        };
      });

      // 6. Fetch ALL fee allocations for complete installment summary
      const { data: allAllocations } = await supabase
        .from('student_fee_allocations')
        .select(`
          id,
          fee_master:fee_masters (
            id, amount, due_date,
            fee_group:fee_groups (name),
            fee_type:fee_types (name, code)
          )
        `)
        .eq('student_id', studentId)
        .eq('branch_id', branchId);

      // Fetch ALL payments for this student to calculate complete status
      const { data: allStudentPayments } = await supabase
        .from('fee_payments')
        .select('fee_master_id, amount, discount_amount')
        .eq('student_id', studentId)
        .eq('branch_id', branchId)
        .is('reverted_at', null);

      // Calculate complete fee statement summary
      const feeStatement = (allAllocations || []).map(item => {
        const master = item.fee_master;
        if (!master) return null;

        const validPayments = (allStudentPayments || []).filter(p => p.fee_master_id === master.id);
        const totalPaid = validPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const totalDiscount = validPayments.reduce((sum, p) => sum + (Number(p.discount_amount) || 0), 0);
        const masterAmount = Number(master.amount) || 0;
        const balance = masterAmount - totalPaid - totalDiscount;

        return {
          id: item.id,
          masterId: master.id,
          group: master.fee_group?.name || 'N/A',
          type: master.fee_type?.code || 'N/A',
          typeName: master.fee_type?.name || 'N/A',
          dueDate: master.due_date,
          amount: masterAmount,
          status: balance <= 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid',
          totalPaid,
          totalDiscount,
          balance: Math.max(0, balance)
        };
      }).filter(Boolean);

      // Calculate overall summary
      const feeStatementTotals = {
        totalFees: feeStatement.reduce((sum, f) => sum + f.amount, 0),
        totalPaid: feeStatement.reduce((sum, f) => sum + f.totalPaid, 0),
        totalDiscount: feeStatement.reduce((sum, f) => sum + f.totalDiscount, 0),
        totalBalance: feeStatement.reduce((sum, f) => sum + f.balance, 0),
        paidCount: feeStatement.filter(f => f.status === 'Paid').length,
        partialCount: feeStatement.filter(f => f.status === 'Partial').length,
        unpaidCount: feeStatement.filter(f => f.status === 'Unpaid').length,
        totalCount: feeStatement.length
      };

      // 5. Fetch Print Settings
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
        let orgQuery = supabase
          .from('print_settings')
          .select('*')
          .is('branch_id', null)
          .eq('type', 'fees_receipt');
        if (userOrgId) orgQuery = orgQuery.eq('organization_id', userOrgId);
        const { data: orgSettings } = await orgQuery.maybeSingle();
        settingsData = orgSettings;
      }

      // 6. Fetch School/Branch Info + Receipt Copy Settings
      const { data: schoolData } = await supabase
        .from('schools')
        .select('*')
        .eq('id', branchId)
        .single();

      // Fetch branch settings for receipt copy options
      const { data: branchData } = await supabase
        .from('branches')
        .select('print_receipt_office_copy, print_receipt_student_copy, print_receipt_bank_copy')
        .eq('id', branchId)
        .maybeSingle();

      // Set receipt copy settings (default to office + student if not configured)
      if (branchData) {
        setReceiptCopySettings({
          office_copy: branchData.print_receipt_office_copy !== false,
          student_copy: branchData.print_receipt_student_copy !== false,
          bank_copy: branchData.print_receipt_bank_copy === true
        });
      }

      // 7. Calculate totals
      const totalPaid = paymentsWithMaster.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const totalDiscount = paymentsWithMaster.reduce((sum, p) => sum + Number(p.discount_amount || 0), 0);
      const totalFine = paymentsWithMaster.reduce((sum, p) => sum + Number(p.fine_paid || 0), 0);

      // Format Transaction ID - if it's UUID, show shortened version
      let displayTransactionId = transactionId || paymentIds[0]?.substring(0, 8);
      if (displayTransactionId && displayTransactionId.length === 36 && displayTransactionId.includes('-')) {
        // It's a UUID - format it nicely
        const branchCode = selectedBranch?.branch_code || schoolData?.branch_code || 'TXN';
        const prefix = branchCode.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const paymentDate = paymentsWithMaster[0]?.payment_date || paymentsWithMaster[0]?.created_at;
        const dateObj = paymentDate ? new Date(paymentDate) : new Date();
        const yearMonth = `${String(dateObj.getFullYear()).slice(-2)}${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        const shortId = displayTransactionId.substring(0, 8).toUpperCase();
        displayTransactionId = `${prefix}/${yearMonth}/${shortId}`;
      }

      // Check if this receipt has been printed before (Original vs Reprint)
      const anyPrinted = paymentData.some(p => p.printed_at);
      setIsOriginal(!anyPrinted);

      // Receipt generated date = first payment's created_at (original creation time)
      const receiptCreatedAt = paymentsWithMaster[0]?.created_at || paymentsWithMaster[0]?.payment_date || new Date().toISOString();

      setPaymentDetails({
        student,
        school: schoolData,
        branch: selectedBranch,
        payments: paymentsWithMaster,
        totalPaid,
        totalDiscount,
        totalFine,
        transactionId: displayTransactionId,
        feeStatement,
        feeStatementTotals,
        receiptCreatedAt,
      });
      setPrintSettings(settingsData);
    } catch (error) {
      console.error('Error:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [paymentId, branchId, selectedBranch, userOrgId, toast]);

  useEffect(() => {
    if (selectedBranch) fetchAllDetails();
  }, [fetchAllDetails, selectedBranch]);

  const handlePrint = async () => {
    // Mark as printed in DB (first print = original, subsequent = reprint)
    if (isOriginal && paymentDetails?.payments?.length > 0) {
      const paymentIds = paymentDetails.payments.map(p => p.id);
      const { data: updateResult, error: updateError } = await supabase
        .from('fee_payments')
        .update({ printed_at: new Date().toISOString() })
        .in('id', paymentIds)
        .is('printed_at', null)
        .select('id, printed_at');
      
      if (!updateError && updateResult?.length > 0) {
        setIsOriginal(false); // After first print, it becomes reprint
      }
    }
    window.print();
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen bg-white'>
        <Loader2 className='animate-spin h-8 w-8 text-blue-600' />
        <span className='ml-2 text-gray-700'>Loading receipt...</span>
      </div>
    );
  }

  if (!paymentDetails) {
    return (
      <div className='flex flex-col justify-center items-center h-screen bg-white'>
        <p className='text-red-500 mb-4'>Could not load receipt details.</p>
        <Button onClick={() => navigate(-1)}><ArrowLeft className='mr-2 h-4 w-4' />Go Back</Button>
      </div>
    );
  }

  const { student, school, branch, payments, totalPaid, totalDiscount, totalFine, transactionId, feeStatement, feeStatementTotals, receiptCreatedAt } = paymentDetails;
  const receiptDate = receiptCreatedAt ? new Date(receiptCreatedAt) : currentDateTime;

  // Receipt No = short serial (e.g., F00001), Transaction ID = full reference in Payment History
  const receiptNo = (() => {
      const parts = (transactionId || '').split('/');
      return parts.length === 3 ? parts[2] : transactionId || '-';
  })();

  // Only count page-1 copies (office + student). Bank copy goes on page 2.
  const firstPageCopies = [receiptCopySettings.office_copy, receiptCopySettings.student_copy].filter(Boolean).length || 1;

  // Calculate receipt height based on page-1 copies
  const getReceiptHeight = () => {
    if (firstPageCopies <= 1) return '95vh';
    return '47vh'; // 2 copies on page 1
  };

  // Single Receipt Component - dynamic size based on copies
  const Receipt = ({ copyType, isPageOne = false }) => (
    <div className={`receipt-box bg-white text-black border border-gray-400 ${isPageOne ? 'page1-receipt' : ''}`} style={{ 
      width: '100%', 
      minHeight: isPageOne ? 'auto' : getReceiptHeight(),
      padding: '0',
      boxSizing: 'border-box',
      pageBreakInside: isPageOne ? 'auto' : 'avoid'
    }}>
      {/* Header - Full Width with proper image fitting */}
      {printSettings?.header_image_url ? (
        <div className='w-full'>
          <img
            src={printSettings.header_image_url}
            alt='Header'
            style={{ 
              width: '100%',
              height: 'auto',
              display: 'block'
            }}
          />
        </div>
      ) : (
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 sm:p-3 border-b-2 border-gray-800 bg-gray-50 gap-2'>
          <div className='flex items-center gap-2 sm:gap-3'>
            {school?.logo_url && <img src={school.logo_url} alt='Logo' className='h-10 sm:h-12' />}
            <div>
              <h1 className='text-sm sm:text-lg font-bold uppercase text-gray-900 leading-tight'>{school?.name || branch?.branch_name || '-'}</h1>
              {school?.address && <p className='text-[8px] sm:text-xs text-gray-600'>{school.address}</p>}
            </div>
          </div>
          <div className='text-left sm:text-right text-[8px] sm:text-[9px] text-gray-600'>
            {(school?.pincode || school?.city) && <p>{[school?.city, school?.state, school?.pincode].filter(Boolean).join(', ')}</p>}
            {school?.contact_number && <p>Phone: {school.contact_number}</p>}
            {school?.contact_email && <p>Email: {school.contact_email}</p>}
          </div>
        </div>
      )}

      {/* Title Bar - includes Copy Type, Original/Reprint, & Receipt No */}
      <div className='bg-gray-900 text-white py-1 px-2 sm:px-3 flex flex-wrap sm:flex-nowrap justify-between items-center gap-1'>
        <span className='text-[10px] font-bold uppercase tracking-wide opacity-90'>{copyType}</span>
        <div className='text-center'>
          <span className='text-sm font-semibold tracking-wide'>FEES RECEIPT</span>
          <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded ${isOriginal ? 'bg-green-500/30 text-green-200' : 'bg-yellow-500/30 text-yellow-200'}`}>
            {isOriginal ? 'ORIGINAL' : 'REPRINT COPY'}
          </span>
        </div>
        <span className='text-[10px]'>
          Receipt No: <span className='font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded'>{receiptNo}</span>
        </span>
      </div>

      {/* Content */}
      <div className='p-3'>
        {/* Student & Transaction Info - Compact, stacks on mobile */}
        <div className='flex flex-col sm:flex-row justify-between gap-1 sm:gap-4 mb-2 text-[11px]' style={{ lineHeight: '1.4' }}>
          <div className='flex-1'>
            <table className='w-full' style={{ borderSpacing: 0 }}>
              <tbody>
                <tr>
                  <td className='font-semibold text-gray-700 w-28' style={{ padding: '1px 0' }}>Student Name</td>
                  <td style={{ padding: '1px 0' }}>: <span className='font-bold text-gray-900 text-[12px]'>{student.full_name}</span></td>
                </tr>
                <tr>
                  <td className='font-semibold text-gray-700' style={{ padding: '1px 0' }}>Admission No</td>
                  <td style={{ padding: '1px 0' }}>: <span className='font-mono font-bold text-gray-900 bg-gray-100 px-1 rounded'>{student.school_code || student.admission_no || '-'}</span></td>
                </tr>
                <tr>
                  <td className='font-semibold text-gray-700' style={{ padding: '1px 0' }}>Father's Name</td>
                  <td style={{ padding: '1px 0' }}>: {student.father_name || '-'}</td>
                </tr>
                <tr>
                  <td className='font-semibold text-gray-700' style={{ padding: '1px 0' }}>Class</td>
                  <td style={{ padding: '1px 0' }}>: {student.classes?.name || student.class?.name || '-'} ({student.sections?.name || student.section?.name || '-'})</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className='flex-1'>
            <table className='w-full' style={{ borderSpacing: 0 }}>
              <tbody>
                <tr>
                  <td className='font-semibold text-gray-700 w-28' style={{ padding: '1px 0' }}>Date</td>
                  <td style={{ padding: '1px 0' }}>: <span className='font-medium'>{format(receiptDate, 'dd-MM-yyyy')}</span></td>
                </tr>
                <tr>
                  <td className='font-semibold text-gray-700' style={{ padding: '1px 0' }}>Time</td>
                  <td style={{ padding: '1px 0' }}>: <span className='font-medium'>{format(receiptDate, 'hh:mm a')}</span></td>
                </tr>
                <tr>
                  <td className='font-semibold text-gray-700' style={{ padding: '1px 0' }}>Payment Mode</td>
                  <td style={{ padding: '1px 0' }}>: <span className='uppercase font-medium'>{payments[0]?.payment_mode || 'Cash'}</span></td>
                </tr>
                {['Online', 'UPI'].includes(payments[0]?.payment_mode) && payments[0]?.utr_number && (
                <tr>
                  <td className='font-semibold text-gray-700' style={{ padding: '1px 0' }}>UTR Number</td>
                  <td style={{ padding: '1px 0' }}>: <span className='font-mono font-bold text-purple-700 bg-purple-50 px-1 rounded'>{payments[0]?.utr_number}</span></td>
                </tr>
                )}
                <tr>
                  <td className='font-semibold text-gray-700' style={{ padding: '1px 0' }}>Branch</td>
                  <td style={{ padding: '1px 0' }}>: {school?.name || branch?.branch_name || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Fee Table - Discount/Fine columns shown only when applicable */}
        <div className='overflow-x-auto -mx-1 sm:mx-0'>
        <table className='w-full text-[10px] border-collapse border border-gray-400 mb-2' style={{ minWidth: '360px' }}>
          <thead>
            <tr className='bg-gray-800 text-white'>
              <th className='border border-gray-400 p-1.5 text-left w-6'>S.No</th>
              <th className='border border-gray-400 p-1.5 text-left'>Fee Particulars</th>
              <th className='border border-gray-400 p-1.5 text-right w-16' style={{ whiteSpace: 'nowrap' }}>Total Fee&nbsp;(₹)</th>
              <th className='border border-gray-400 p-1.5 text-right w-14' style={{ whiteSpace: 'nowrap' }}>Discount&nbsp;(₹)</th>
              <th className='border border-gray-400 p-1.5 text-right w-14' style={{ whiteSpace: 'nowrap', backgroundColor: '#065f46' }}>Net Fee&nbsp;(₹)</th>
              {totalFine > 0 && <th className='border border-gray-400 p-1.5 text-right w-14' style={{ whiteSpace: 'nowrap' }}>Fine&nbsp;(₹)</th>}
              <th className='border border-gray-400 p-1.5 text-right w-14' style={{ whiteSpace: 'nowrap' }}>Paid&nbsp;(₹)</th>
              <th className='border border-gray-400 p-1.5 text-right w-16' style={{ whiteSpace: 'nowrap' }}>Balance&nbsp;(₹)</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p, idx) => (
              <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className='border border-gray-300 p-1.5 text-center'>{idx + 1}</td>
                <td className='border border-gray-300 p-1.5 font-medium' style={{ whiteSpace: 'nowrap' }}>
                  {p.fee_name || 'Fee'}{p.fee_group_name ? <span className='text-[8px] text-gray-500 ml-1'>({p.fee_group_name})</span> : ''}
                </td>
                <td className='border border-gray-300 p-1.5 text-right font-mono'>{Number(p.total_fee_amount || p.fee_master?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className='border border-gray-300 p-1.5 text-right font-mono'>{Number(p.discount_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className='border border-gray-300 p-1.5 text-right font-mono font-semibold text-green-700'>{Number((p.total_fee_amount || p.fee_master?.amount || 0) - (p.discount_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                {totalFine > 0 && <td className='border border-gray-300 p-1.5 text-right font-mono'>{Number(p.fine_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>}
                <td className='border border-gray-300 p-1.5 text-right font-mono font-semibold'>{Number(p.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className='border border-gray-300 p-1.5 text-right font-mono font-semibold text-red-600'>{Number(p.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className='bg-gray-100 font-bold'>
              <td colSpan='2' className='border border-gray-400 p-1.5 text-right'>TOTAL:</td>
              <td className='border border-gray-400 p-1.5 text-right font-mono'>{payments.reduce((sum, p) => sum + Number(p.total_fee_amount || p.fee_master?.amount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className='border border-gray-400 p-1.5 text-right font-mono text-blue-700'>{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className='border border-gray-400 p-1.5 text-right font-mono font-bold text-green-700'>{(payments.reduce((sum, p) => sum + Number(p.total_fee_amount || p.fee_master?.amount || 0), 0) - totalDiscount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              {totalFine > 0 && <td className='border border-gray-400 p-1.5 text-right font-mono'>{totalFine.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>}
              <td className='border border-gray-400 p-1.5 text-right font-mono text-green-700'>{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className='border border-gray-400 p-1.5 text-right font-mono text-red-700'>{payments.reduce((sum, p) => sum + Number(p.balance || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>
        </div>

        {/* Payment Summary Box - Compact */}
        <div className='flex justify-between gap-2 mb-1'>
          <div className='flex-1 bg-green-50 border border-green-300 rounded px-2 py-1 text-center'>
            <div className='text-[7px] text-green-600 uppercase font-semibold'>Amount Paid</div>
            <div className='text-[11px] font-bold text-green-800'>₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className='flex-1 bg-blue-50 border border-blue-300 rounded px-2 py-1 text-center'>
            <div className='text-[7px] text-blue-600 uppercase font-semibold'>Discount</div>
            <div className='text-[11px] font-bold text-blue-800'>₹{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          {payments.reduce((sum, p) => sum + Number(p.balance || 0), 0) > 0 && (
            <div className='flex-1 bg-red-50 border border-red-300 rounded px-2 py-1 text-center'>
              <div className='text-[7px] text-red-600 uppercase font-semibold'>Balance Due</div>
              <div className='text-[11px] font-bold text-red-800'>₹{payments.reduce((sum, p) => sum + Number(p.balance || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
          )}
        </div>

        {/* Fee Statement Summary - Separate bordered box with table */}
        {feeStatementTotals && feeStatement && feeStatement.length > 0 && (
          <div className='mt-1 border border-gray-400 rounded'>
            {/* Header */}
            <div className='bg-gray-100 border-b border-gray-400 px-2 py-0.5 flex justify-between items-center'>
              <span className='text-[8px] font-semibold text-gray-700'>📋 FEE STATEMENT ({feeStatementTotals.totalCount} Installments)</span>
              <span className='text-[7px]'>
                <span className='text-green-600'>✓{feeStatementTotals.paidCount}</span>
                {feeStatementTotals.partialCount > 0 && <span className='text-yellow-600 ml-1'>◐{feeStatementTotals.partialCount}</span>}
                {feeStatementTotals.unpaidCount > 0 && <span className='text-red-600 ml-1'>○{feeStatementTotals.unpaidCount}</span>}
              </span>
            </div>
            {/* Table */}
            <div className='overflow-x-auto'>
            <table className='w-full text-[7px] border-collapse' style={{ minWidth: '320px' }}>
              <thead>
                <tr className='bg-gray-50'>
                  <th className='text-left px-2 py-0.5 font-semibold text-gray-600 border-b border-gray-300'>Fee Name</th>
                  <th className='text-right px-2 py-0.5 font-semibold text-gray-600 border-b border-gray-300 w-14'>Amount</th>
                  <th className='text-right px-2 py-0.5 font-semibold text-gray-600 border-b border-gray-300 w-10'>Discount</th>
                  <th className='text-right px-2 py-0.5 font-semibold text-emerald-700 border-b border-gray-300 w-14'>Net Fee</th>
                  <th className='text-right px-2 py-0.5 font-semibold text-gray-600 border-b border-gray-300 w-14'>Paid</th>
                  <th className='text-right px-2 py-0.5 font-semibold text-gray-600 border-b border-gray-300 w-14'>Balance</th>
                  <th className='text-right px-2 py-0.5 font-semibold text-gray-600 border-b border-gray-300 w-10'>Status</th>
                </tr>
              </thead>
              <tbody>
                {feeStatement.map((fee, idx) => (
                  <tr key={fee.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className='px-2 border-b border-gray-200 font-medium text-gray-700 truncate' style={{ lineHeight: '1.6' }}>{fee.typeName} <span className='text-gray-400'>({fee.group})</span></td>
                    <td className='px-2 border-b border-gray-200 font-mono text-right' style={{ lineHeight: '1.6' }}>₹{fee.amount.toLocaleString('en-IN')}</td>
                    <td className='px-2 border-b border-gray-200 font-mono text-right text-blue-600' style={{ lineHeight: '1.6' }}>₹{(fee.totalDiscount || 0).toLocaleString('en-IN')}</td>
                    <td className='px-2 border-b border-gray-200 font-mono text-right font-semibold text-emerald-600' style={{ lineHeight: '1.6' }}>₹{(fee.amount - (fee.totalDiscount || 0)).toLocaleString('en-IN')}</td>
                    <td className='px-2 border-b border-gray-200 font-mono text-right text-green-600' style={{ lineHeight: '1.6' }}>₹{fee.totalPaid.toLocaleString('en-IN')}</td>
                    <td className='px-2 border-b border-gray-200 font-mono text-right text-red-600' style={{ lineHeight: '1.6' }}>{fee.balance > 0 ? `-₹${fee.balance.toLocaleString('en-IN')}` : '₹0'}</td>
                    <td className='px-2 border-b border-gray-200 text-right' style={{ lineHeight: '1.6' }}>
                      <span className={`px-1 rounded text-[6px] font-bold ${
                        fee.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                        fee.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'
                      }`}>{fee.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className='bg-gray-100 font-bold'>
                  <td className='px-2 py-0.5 border-t border-gray-400'>TOTAL:</td>
                  <td className='px-2 py-0.5 border-t border-gray-400 font-mono text-right'>₹{feeStatementTotals.totalFees.toLocaleString('en-IN')}</td>
                  <td className='px-2 py-0.5 border-t border-gray-400 font-mono text-right text-blue-700'>₹{(feeStatementTotals.totalDiscount || 0).toLocaleString('en-IN')}</td>
                  <td className='px-2 py-0.5 border-t border-gray-400 font-mono text-right font-bold text-emerald-700'>₹{(feeStatementTotals.totalFees - (feeStatementTotals.totalDiscount || 0)).toLocaleString('en-IN')}</td>
                  <td className='px-2 py-0.5 border-t border-gray-400 font-mono text-right text-green-700'>₹{feeStatementTotals.totalPaid.toLocaleString('en-IN')}</td>
                  <td className='px-2 py-0.5 border-t border-gray-400 font-mono text-right text-red-700'>{feeStatementTotals.totalBalance > 0 ? `-₹${feeStatementTotals.totalBalance.toLocaleString('en-IN')}` : '₹0'}</td>
                  <td className='px-2 py-0.5 border-t border-gray-400'></td>
                </tr>
              </tfoot>
            </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-end mt-2 pt-2 border-t border-dashed border-gray-400 gap-1'>
          <div className='text-[8px] sm:text-[9px] text-gray-500 italic'>
            {printSettings?.footer_content ? (
              <span dangerouslySetInnerHTML={{ __html: printSettings.footer_content.replace(/<[^>]*>/g, '') }} />
            ) : (
              'This is a computer generated receipt. No signature required.'
            )}
          </div>
          <div className='text-[8px] text-gray-400'>
            Printed: {format(currentDateTime, 'dd/MM/yyyy hh:mm a')}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }
          .print-hidden, .no-print {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Page 1: Force 2 receipts into exactly one A4 page */
          .page-1-receipts {
            display: flex !important;
            flex-direction: column !important;
            height: calc(297mm - 10mm) !important;
            overflow: hidden !important;
            page-break-after: auto !important;
          }
          .page-1-receipts .page1-receipt {
            flex: 1 1 0% !important;
            min-height: 0 !important;
            max-height: 49.5% !important;
            overflow: hidden !important;
            break-inside: auto !important;
            page-break-inside: auto !important;
          }
          .page-1-receipts .cut-line-separator {
            flex: 0 0 auto !important;
            height: 5mm !important;
            overflow: hidden !important;
          }
          /* Compact print styles for fitting 2 receipts on A5 each */
          .page1-receipt .p-3 {
            padding: 2mm !important;
          }
          .page1-receipt .mb-3 {
            margin-bottom: 1.5mm !important;
          }
          .page1-receipt .mb-2 {
            margin-bottom: 1mm !important;
          }
          .page1-receipt .mt-2 {
            margin-top: 1mm !important;
          }
          .page1-receipt .pt-2 {
            padding-top: 1mm !important;
          }
          .page1-receipt .py-1 {
            padding-top: 0.5mm !important;
            padding-bottom: 0.5mm !important;
          }
          .page1-receipt .gap-4 {
            gap: 1.5mm !important;
          }
          .page1-receipt table {
            font-size: 8px !important;
          }
          .page1-receipt .text-sm {
            font-size: 9px !important;
          }
          .page1-receipt .text-lg {
            font-size: 12px !important;
          }
          /* Single receipt on full page (bank copy) */
          .receipt-box:not(.page1-receipt) {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 2mm !important;
          }
          .receipt-box:not(.page1-receipt) {
            min-height: auto !important;
          }
          /* Hide ALL floating widgets during print */
          [class*="whatsapp"],
          [class*="chat"],
          [class*="widget"],
          [class*="floating"],
          [class*="crisp"],
          [class*="intercom"],
          [class*="tawk"],
          [class*="freshchat"],
          [id*="whatsapp"],
          [id*="chat"],
          [id*="widget"],
          div[style*="position: fixed"],
          div[style*="position:fixed"],
          iframe[src*="chat"],
          iframe[src*="widget"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
          }
        }
        @media screen {
          .print-container {
            max-width: 210mm;
            margin: 0 auto;
            background: #f5f5f5;
            min-height: 100vh;
            padding: 20px;
          }
          /* Mobile-responsive receipt on small screens */
          @media (max-width: 640px) {
            .print-container {
              max-width: 100%;
              padding: 8px;
              padding-bottom: 80px; /* Space for bottom nav */
              min-height: auto;
            }
            .receipt-box {
              font-size: 10px;
            }
            .receipt-box table {
              font-size: 9px !important;
            }
            .receipt-box .text-lg {
              font-size: 13px !important;
            }
            .receipt-box .text-[11px] {
              font-size: 10px !important;
            }
            .receipt-box .text-[10px] {
              font-size: 9px !important;
            }
            .receipt-box .text-[9px] {
              font-size: 8px !important;
            }
            .receipt-box .w-28 {
              width: 5rem !important;
            }
            .receipt-box .p-3 {
              padding: 6px !important;
            }
            .receipt-box .gap-4 {
              gap: 4px !important;
            }
            .receipt-box th,
            .receipt-box td {
              padding: 3px 4px !important;
            }
          }
        }
      `}</style>

      {/* Screen Header - Hidden in Print */}
      <div className='print-hidden bg-gradient-to-r from-blue-600 to-blue-800 text-white p-3 sm:p-4 sticky top-0 z-50 shadow-lg'>
        <div className='max-w-4xl mx-auto flex justify-between items-center gap-2'>
          <Button variant='ghost' className='text-white hover:bg-blue-700 px-2 sm:px-4' onClick={() => navigate(-1)}>
            <ArrowLeft className='mr-1 sm:mr-2 h-4 w-4' /><span className='hidden sm:inline'>Back</span>
          </Button>
          <h1 className='text-sm sm:text-lg font-semibold truncate'>Fee Receipt Preview</h1>
          <Button onClick={handlePrint} className='bg-white text-blue-700 hover:bg-blue-50 px-2 sm:px-4 text-xs sm:text-sm'>
            <Printer className='mr-1 sm:mr-2 h-4 w-4' /><span className='hidden sm:inline'>Print</span> Receipt
          </Button>
        </div>
      </div>

      {/* Print Container - Page 1: Office + Student | Page 2: Bank (if enabled) */}
      <div className='print-container bg-white' style={{ minHeight: '297mm' }}>
        {/* Page 1: Office Copy + Student Copy - forced into one A4 page */}
        <div className='page-1-receipts flex flex-col'>
          {receiptCopySettings.office_copy && (
            <Receipt copyType='OFFICE COPY' isPageOne={true} />
          )}

          {receiptCopySettings.office_copy && receiptCopySettings.student_copy && (
            <div className='cut-line-separator flex items-center justify-center py-1'>
              <div className='flex-1 border-t-2 border-dashed border-gray-400'></div>
              <span className='px-4 text-[10px] text-gray-500 print:text-gray-400'>✂ CUT HERE ✂</span>
              <div className='flex-1 border-t-2 border-dashed border-gray-400'></div>
            </div>
          )}

          {receiptCopySettings.student_copy && (
            <Receipt copyType='STUDENT COPY' isPageOne={true} />
          )}

          {/* Fallback if only one or neither copy */}
          {!receiptCopySettings.office_copy && !receiptCopySettings.student_copy && !receiptCopySettings.bank_copy && (
            <Receipt copyType='RECEIPT' isPageOne={true} />
          )}
        </div>

        {/* Page 2: Bank Copy (next page, if enabled in General Settings) */}
        {receiptCopySettings.bank_copy && (
          <div style={{ pageBreakBefore: 'always' }}>
            <Receipt copyType='BANK COPY' />
          </div>
        )}
      </div>
    </>
  );
};

export default PrintFeesReceipt;
