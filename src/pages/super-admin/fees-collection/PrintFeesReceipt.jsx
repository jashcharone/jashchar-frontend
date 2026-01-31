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
  
  const branchId = user?.profile?.branch_id;
  const userOrgId = organizationId || user?.profile?.organization_id;

  const fetchAllDetails = useCallback(async () => {
    if (!paymentId || !branchId || !selectedBranch) {
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
        .eq('branch_id', selectedBranch.id)
        .limit(1)
        .single();

      if (initialError) throw initialError;
      if (!initialData) throw new Error('Payment not found');

      const { transaction_id: transactionId, student_id: studentId } = initialData;

      // 2. Fetch All Payments
      let paymentQuery = supabase.from('fee_payments').select('*').eq('branch_id', selectedBranch.id);
      if (transactionId) {
        paymentQuery = paymentQuery.eq('transaction_id', transactionId);
      } else {
        paymentQuery = paymentQuery.in('id', paymentIds);
      }
      const { data: paymentData, error: paymentError } = await paymentQuery;
      if (paymentError) throw paymentError;

      // 3. Fetch Student
      let student = null;
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, classes(name), sections(name)')
        .eq('id', studentId)
        .eq('branch_id', selectedBranch.id)
        .maybeSingle();

      if (profileData) {
        student = { ...profileData, class: profileData.classes, section: profileData.sections };
      } else {
        const { data: studentProfileData } = await supabase
          .from('student_profiles')
          .select('*, classes!student_profiles_class_id_fkey(name), sections!student_profiles_section_id_fkey(name)')
          .eq('id', studentId)
          .eq('branch_id', selectedBranch.id)
          .maybeSingle();
        if (studentProfileData) {
          student = { ...studentProfileData, class: studentProfileData.classes, section: studentProfileData.sections };
        }
      }
      if (!student) throw new Error('Student not found');

      // 4. Fetch Fee Masters
      const feeMasterIds = [...new Set(paymentData.map(p => p.fee_master_id).filter(Boolean))];
      const { data: feeMasters } = await supabase.from('fee_masters').select('*').in('id', feeMasterIds);

      const paymentsWithMaster = paymentData.map(p => ({
        ...p,
        fee_master: feeMasters?.find(fm => fm.id === p.fee_master_id) || { name: 'Fee', amount: 0 }
      }));

      // 5. Fetch Print Settings
      let settingsData = null;
      const { data: branchSettings } = await supabase
        .from('print_settings')
        .select('*')
        .eq('branch_id', selectedBranch.id)
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
        .eq('id', selectedBranch.id)
        .single();

      // Fetch branch settings for receipt copy options
      const { data: branchData } = await supabase
        .from('branches')
        .select('print_receipt_office_copy, print_receipt_student_copy, print_receipt_bank_copy')
        .eq('id', selectedBranch.id)
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

      setPaymentDetails({
        student,
        school: schoolData,
        branch: selectedBranch,
        payments: paymentsWithMaster,
        totalPaid,
        totalDiscount,
        totalFine,
        transactionId: displayTransactionId,
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

  const handlePrint = () => {
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

  const { student, school, branch, payments, totalPaid, totalDiscount, totalFine, transactionId } = paymentDetails;

  // Calculate number of enabled copies
  const enabledCopiesCount = [
    receiptCopySettings.office_copy,
    receiptCopySettings.student_copy,
    receiptCopySettings.bank_copy
  ].filter(Boolean).length || 1;

  // Calculate receipt height based on number of copies
  const getReceiptHeight = () => {
    if (enabledCopiesCount === 1) return '95vh';
    if (enabledCopiesCount === 2) return '47vh';
    return '30vh'; // 3 copies
  };

  // Single Receipt Component - dynamic size based on copies
  const Receipt = ({ copyType }) => (
    <div className='receipt-box bg-white text-black border border-gray-400' style={{ 
      width: '100%', 
      minHeight: getReceiptHeight(),
      padding: '0',
      boxSizing: 'border-box',
      pageBreakInside: 'avoid'
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
        <div className='flex justify-between items-center p-3 border-b-2 border-gray-800 bg-gray-50'>
          <div className='flex items-center gap-3'>
            {school?.logo_url && <img src={school.logo_url} alt='Logo' className='h-12' />}
            <div>
              <h1 className='text-lg font-bold uppercase text-gray-900'>{school?.name || branch?.branch_name}</h1>
              <p className='text-xs text-gray-600'>{branch?.branch_name}</p>
            </div>
          </div>
          <div className='text-right text-[9px] text-gray-600'>
            {school?.address && <p>{school.address}</p>}
            {school?.contact_number && <p>Phone: {school.contact_number}</p>}
            {school?.contact_email && <p>Email: {school.contact_email}</p>}
          </div>
        </div>
      )}

      {/* Title Bar */}
      <div className='bg-gray-900 text-white text-center py-1'>
        <span className='text-sm font-semibold tracking-wide'>FEES RECEIPT</span>
      </div>

      {/* Copy Type & Receipt Info */}
      <div className='flex justify-between items-center px-3 py-1.5 bg-gray-100 border-b text-[10px]'>
        <span className='font-bold text-gray-800 uppercase tracking-wide'>{copyType}</span>
        <span className='text-gray-700'>
          Receipt No: <span className='font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded'>{transactionId}</span>
        </span>
      </div>

      {/* Content */}
      <div className='p-3'>
        {/* Student & Transaction Info */}
        <div className='flex justify-between gap-4 mb-3 text-[11px]'>
          <div className='flex-1'>
            <table className='w-full'>
              <tbody>
                <tr>
                  <td className='font-semibold text-gray-700 py-0.5 w-28'>Student Name</td>
                  <td className='py-0.5'>: <span className='font-medium'>{student.full_name}</span></td>
                </tr>
                <tr>
                  <td className='font-semibold text-gray-700 py-0.5'>Admission No</td>
                  <td className='py-0.5'>: <span className='font-mono'>{student.school_code || student.admission_no || '-'}</span></td>
                </tr>
                <tr>
                  <td className='font-semibold text-gray-700 py-0.5'>Father's Name</td>
                  <td className='py-0.5'>: {student.father_name || '-'}</td>
                </tr>
                <tr>
                  <td className='font-semibold text-gray-700 py-0.5'>Class</td>
                  <td className='py-0.5'>: {student.classes?.name || student.class?.name || '-'} ({student.sections?.name || student.section?.name || '-'})</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className='flex-1'>
            <table className='w-full'>
              <tbody>
                <tr>
                  <td className='font-semibold text-gray-700 py-0.5 w-28'>Date</td>
                  <td className='py-0.5'>: <span className='font-medium'>{format(currentDateTime, 'dd-MM-yyyy')}</span></td>
                </tr>
                <tr>
                  <td className='font-semibold text-gray-700 py-0.5'>Time</td>
                  <td className='py-0.5'>: <span className='font-medium'>{format(currentDateTime, 'hh:mm a')}</span></td>
                </tr>
                <tr>
                  <td className='font-semibold text-gray-700 py-0.5'>Payment Mode</td>
                  <td className='py-0.5'>: <span className='uppercase font-medium'>{payments[0]?.payment_mode || 'Cash'}</span></td>
                </tr>
                <tr>
                  <td className='font-semibold text-gray-700 py-0.5'>Branch</td>
                  <td className='py-0.5'>: {branch?.branch_name || school?.name || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Fee Table */}
        <table className='w-full text-[10px] border-collapse border border-gray-400 mb-2'>
          <thead>
            <tr className='bg-gray-800 text-white'>
              <th className='border border-gray-400 p-1.5 text-left w-8'>S.No</th>
              <th className='border border-gray-400 p-1.5 text-left'>Fee Particulars</th>
              <th className='border border-gray-400 p-1.5 text-right w-20'>Amount (₹)</th>
              <th className='border border-gray-400 p-1.5 text-right w-20'>Discount (₹)</th>
              <th className='border border-gray-400 p-1.5 text-right w-16'>Fine (₹)</th>
              <th className='border border-gray-400 p-1.5 text-right w-20'>Paid (₹)</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p, idx) => (
              <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className='border border-gray-300 p-1.5 text-center'>{idx + 1}</td>
                <td className='border border-gray-300 p-1.5 font-medium'>{p.fee_master?.name || 'Fee'}</td>
                <td className='border border-gray-300 p-1.5 text-right font-mono'>{Number(p.fee_master?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className='border border-gray-300 p-1.5 text-right font-mono'>{Number(p.discount_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className='border border-gray-300 p-1.5 text-right font-mono'>{Number(p.fine_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className='border border-gray-300 p-1.5 text-right font-mono font-semibold'>{Number(p.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className='bg-gray-100 font-bold'>
              <td colSpan='5' className='border border-gray-400 p-1.5 text-right'>Total Paid:</td>
              <td className='border border-gray-400 p-1.5 text-right font-mono text-green-700'>₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            {totalDiscount > 0 && (
              <tr className='bg-blue-50'>
                <td colSpan='5' className='border border-gray-400 p-1.5 text-right text-blue-700'>Total Discount:</td>
                <td className='border border-gray-400 p-1.5 text-right font-mono text-blue-700'>₹{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            )}
          </tfoot>
        </table>

        {/* Footer */}
        <div className='flex justify-between items-end mt-2 pt-2 border-t border-dashed border-gray-400'>
          <div className='text-[9px] text-gray-500 italic'>
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
            margin: 6mm;
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
          .receipt-box {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 2mm !important;
          }
          /* Make receipts smaller if 3 copies */
          .receipt-box {
            min-height: auto !important;
          }
          /* Hide ALL floating widgets, chat icons, WhatsApp buttons during print */
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
        }
      `}</style>

      {/* Screen Header - Hidden in Print */}
      <div className='print-hidden bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 sticky top-0 z-50 shadow-lg'>
        <div className='max-w-4xl mx-auto flex justify-between items-center'>
          <Button variant='ghost' className='text-white hover:bg-blue-700' onClick={() => navigate(-1)}>
            <ArrowLeft className='mr-2 h-4 w-4' />Back
          </Button>
          <h1 className='text-lg font-semibold'>Fee Receipt Preview</h1>
          <Button onClick={handlePrint} className='bg-white text-blue-700 hover:bg-blue-50'>
            <Printer className='mr-2 h-4 w-4' />Print Receipt
          </Button>
        </div>
      </div>

      {/* Print Container - A4 with receipt copies based on settings */}
      <div className='print-container bg-white' style={{ minHeight: '297mm' }}>
        <div className='flex flex-col gap-4' style={{ height: '100%' }}>
          {/* Dynamically render enabled copies */}
          {receiptCopySettings.office_copy && (
            <>
              <Receipt copyType='OFFICE COPY' />
              {(receiptCopySettings.student_copy || receiptCopySettings.bank_copy) && (
                <div className='flex items-center justify-center py-1 print:py-0'>
                  <div className='flex-1 border-t-2 border-dashed border-gray-400'></div>
                  <span className='px-4 text-[10px] text-gray-500 print:text-gray-400'>✂ CUT HERE ✂</span>
                  <div className='flex-1 border-t-2 border-dashed border-gray-400'></div>
                </div>
              )}
            </>
          )}

          {receiptCopySettings.student_copy && (
            <>
              <Receipt copyType='STUDENT COPY' />
              {receiptCopySettings.bank_copy && (
                <div className='flex items-center justify-center py-1 print:py-0'>
                  <div className='flex-1 border-t-2 border-dashed border-gray-400'></div>
                  <span className='px-4 text-[10px] text-gray-500 print:text-gray-400'>✂ CUT HERE ✂</span>
                  <div className='flex-1 border-t-2 border-dashed border-gray-400'></div>
                </div>
              )}
            </>
          )}

          {receiptCopySettings.bank_copy && (
            <Receipt copyType='BANK COPY' />
          )}

          {/* Fallback if nothing is enabled - show at least one copy */}
          {!receiptCopySettings.office_copy && !receiptCopySettings.student_copy && !receiptCopySettings.bank_copy && (
            <Receipt copyType='RECEIPT' />
          )}
        </div>
      </div>
    </>
  );
};

export default PrintFeesReceipt;
