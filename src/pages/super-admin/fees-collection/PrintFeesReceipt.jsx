import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css'; // Ensure CSS is imported

const QuillReader = ({ content }) => (
  <ReactQuill
    value={content || ''}
    readOnly={true}
    theme={'bubble'}
    className='[&_.ql-editor]:p-0'
  />
);

const PrintFeesReceipt = () => {
  const { paymentId } = useParams();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [printSettings, setPrintSettings] = useState(null);
  const [schoolSettings, setSchoolSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoPrintTriggered, setAutoPrintTriggered] = useState(false);
  const printRef = useRef(null);
  const branchId = user?.profile?.branch_id;

  const fetchAllDetails = useCallback(async () => {
    if (!paymentId || !branchId || !selectedBranch) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const paymentIds = paymentId.split(',');

      // 1. Fetch Initial Payment Info to get Transaction ID and Student ID
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

      // 2. Fetch All Payments in this Transaction
      let paymentQuery = supabase.from('fee_payments').select('*').eq('branch_id', selectedBranch.id);
      
      if (transactionId) {
        paymentQuery = paymentQuery.eq('transaction_id', transactionId);
      } else {
        paymentQuery = paymentQuery.in('id', paymentIds);
      }

      const { data: paymentData, error: paymentError } = await paymentQuery;
      if (paymentError) throw paymentError;

      // 3. Fetch Student Details
      // Try 'profiles' first (used in StudentFees), fallback to 'student_profiles' (used in CollectFees)
      let student = null;
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, classes(name), sections(name)')
        .eq('id', studentId)
        .eq('branch_id', selectedBranch.id)
        .maybeSingle(); // Use maybeSingle() to return null instead of error when 0 rows

      if (profileData) {
        student = {
            ...profileData,
            class: profileData.classes, // Map for compatibility
            section: profileData.sections
        };
      } else {
         // Fallback - use explicit FK relationship names to avoid ambiguity
         const { data: studentProfileData } = await supabase
            .from('student_profiles')
            .select('*, classes!student_profiles_class_id_fkey(name), sections!student_profiles_section_id_fkey(name)')
            .eq('id', studentId)
            .eq('branch_id', selectedBranch.id)
            .maybeSingle();
         if (studentProfileData) {
             student = {
                 ...studentProfileData,
                 class: studentProfileData.classes,
                 section: studentProfileData.sections
             };
         }
      }

      if (!student) throw new Error('Student profile not found');

      // 4. Fetch Fee Masters
      const feeMasterIds = [...new Set(paymentData.map(p => p.fee_master_id).filter(Boolean))];
      const { data: feeMasters, error: feeMasterError } = await supabase
        .from('fee_masters')
        .select('*')
        .in('id', feeMasterIds);
        
      if (feeMasterError) console.error("Error fetching fee masters:", feeMasterError);

      // Attach fee master to payments
      const paymentsWithMaster = paymentData.map(p => ({
          ...p,
          fee_master: feeMasters?.find(fm => fm.id === p.fee_master_id) || { name: 'Unknown Fee', amount: 0 }
      }));

      // 5. Fetch Print Settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('print_settings')
        .select('header_image_url, footer_content')
        .eq('branch_id', branchId)
        .eq('branch_id', selectedBranch.id)
        .eq('type', 'fees_receipt')
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      // 6. Fetch School Settings
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('print_receipt_office_copy, print_receipt_student_copy, print_receipt_bank_copy, name, address, contact_number, contact_email, logo_url')
        .eq('id', branchId)
        .single();

      if (schoolError) throw schoolError;

      // 7. Calculate Balances
      const { data: allHistory, error: historyError } = await supabase
        .from('fee_payments')
        .select('amount, discount_amount, fee_master_id')
        .eq('student_id', studentId)
        .in('fee_master_id', feeMasterIds);

      if (historyError) throw historyError;

      const feeBalances = {};
      const paymentsByMaster = {};
      
      if (allHistory) {
          allHistory.forEach(p => {
              if (!paymentsByMaster[p.fee_master_id]) paymentsByMaster[p.fee_master_id] = 0;
              paymentsByMaster[p.fee_master_id] += (Number(p.amount || 0) + Number(p.discount_amount || 0));
          });
      }

      paymentsWithMaster.forEach(p => {
          if (p.fee_master) {
              const totalFee = Number(p.fee_master.amount || 0);
              const totalPaid = paymentsByMaster[p.fee_master_id] || 0;
              feeBalances[p.fee_master_id] = Math.max(0, totalFee - totalPaid);
          }
      });

      const combinedDetails = {
        student,
        school: schoolData,
        payments: paymentsWithMaster,
        totalPaidForThisTxn: paymentsWithMaster.reduce(
          (sum, p) => sum + Number(p.amount || 0) + Number(p.fine_paid || 0),
          0
        ),
        totalDiscountForThisTxn: paymentsWithMaster.reduce(
          (sum, p) => sum + Number(p.discount_amount || 0),
          0
        ),
        feeBalances,
      };

      setPaymentDetails(combinedDetails);
      setPrintSettings(settingsData);
      setSchoolSettings(schoolData);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error fetching receipt data',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [paymentId, branchId, toast]);

  useEffect(() => {
    fetchAllDetails();
  }, [fetchAllDetails]);

  useEffect(() => {
    if (!loading && paymentDetails && !autoPrintTriggered) {
      setTimeout(() => {
        window.print();
        setAutoPrintTriggered(true);
      }, 800);
    }
  }, [loading, paymentDetails, autoPrintTriggered]);

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <Loader2 className='animate-spin h-8 w-8 text-primary' />
        <span className='ml-2'>Loading receipt...</span>
      </div>
    );
  }

  if (!paymentDetails) {
    return (
      <div className='flex justify-center items-center h-screen text-destructive'>
        Could not load receipt details.
      </div>
    );
  }

  const { student, school, payments, totalPaidForThisTxn, totalDiscountForThisTxn, feeBalances } =
    paymentDetails;

  const ReceiptContent = ({ copyType }) => (
    <div className='p-4 border border-black break-inside-avoid bg-white text-black'>
      <header className='flex justify-between items-center pb-2 border-b-2 border-black'>
        {printSettings?.header_image_url ? (
          <img
            src={printSettings.header_image_url}
            alt='School Header'
            className='w-full h-auto object-contain'
            style={{ maxHeight: '60px' }}
          />
        ) : (
          <>
            <div className='flex items-center'>
              {school.logo_url && (
                <img src={school.logo_url} alt='School Logo' className='h-12 mr-3' />
              )}
              <div>
                <h1 className='text-xl font-bold uppercase'>{school.name}</h1>
              </div>
            </div>
            <div className='text-right text-[9px]'>
              {school.address && <p>{school.address}</p>}
              {school.contact_number && (
                <p><strong>Phone:</strong> {school.contact_number}</p>
              )}
              {school.contact_email && (
                <p><strong>Email:</strong> {school.contact_email}</p>
              )}
            </div>
          </>
        )}
      </header>

      <div className='text-center my-2'>
        <h2 className='text-base font-bold inline-block px-3 py-1 border-2 border-black'>
          Fees Receipt
        </h2>
        {copyType && <p className='text-[10px] mt-1 font-semibold'>{copyType}</p>}
      </div>

      <div className='flex justify-between items-start mb-3 text-[11px]'>
        <div>
          <p><strong>Student Name:</strong> {student.full_name}</p>
          <p><strong>Admission No:</strong> {student.school_code}</p>
          <p><strong>Father Name:</strong> {student.father_name}</p>
          <p><strong>Class:</strong> {student.classes?.name} ({student.sections?.name})</p>
        </div>
        <div>
          <p><strong>Transaction ID:</strong> {payments.map((p) => p.transaction_id || p.id.substring(0, 8)).join(', ')}</p>
          <p><strong>Date:</strong> {format(new Date(payments[0].payment_date), 'dd-MM-yyyy')}</p>
          <p><strong>Payment Mode:</strong> {[...new Set(payments.map((p) => p.payment_mode))].join(', ')}</p>
        </div>
      </div>

      <table className='w-full text-[11px] border-collapse text-black'>
        <thead>
          <tr className='border-y-2 border-black bg-white'>
            <th className='p-1 text-left text-black'>S.No.</th>
            <th className='p-1 text-left text-black'>Particulars</th>
            <th className='p-1 text-right text-black'>Amount (₹)</th>
            <th className='p-1 text-right text-black'>Discount (₹)</th>
            <th className='p-1 text-right text-black'>Fine (₹)</th>
            <th className='p-1 text-right text-black'>Paid (₹)</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p, index) => (
            <tr key={p.id} className='border-b'>
              <td className='p-1'>{index + 1}</td>
              <td className='p-1'>{p.fee_master?.name || 'Fee'}</td>
              <td className='p-1 text-right'>{Number(p.fee_master?.amount || 0).toFixed(2)}</td>
              <td className='p-1 text-right'>{Number(p.discount_amount || 0).toFixed(2)}</td>
              <td className='p-1 text-right'>{Number(p.fine_paid || 0).toFixed(2)}</td>
              <td className='p-1 text-right'>{Number(p.amount || 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className='font-bold border-t-2 border-black'>
            <td colSpan='4' className='p-1 text-right'>Total Paid</td>
            <td colSpan='2' className='p-1 text-right'>₹{totalPaidForThisTxn.toFixed(2)}</td>
          </tr>
          {totalDiscountForThisTxn > 0 && (
            <tr className='font-bold border-t'>
              <td colSpan='4' className='p-1 text-right'>Total Discount</td>
              <td colSpan='2' className='p-1 text-right'>₹{totalDiscountForThisTxn.toFixed(2)}</td>
            </tr>
          )}
          {Object.entries(feeBalances).map(([masterId, balance]) => {
            const feeItem = payments.find((p) => p.fee_master_id === masterId);
            return (
              <tr key={masterId} className='font-bold border-t'>
                <td colSpan='4' className='p-1 text-right'>
                  Balance for {feeItem?.fee_master?.name}
                </td>
                <td colSpan='2' className='p-1 text-right'>₹{Number(balance).toFixed(2)}</td>
              </tr>
            );
          })}
        </tfoot>
      </table>

      <footer className='mt-4 pt-2 border-t text-[10px] text-center'>
        {printSettings?.footer_content ? (
          <div className='prose prose-sm max-w-none'>
            <QuillReader content={printSettings.footer_content} />
          </div>
        ) : (
          <p>This receipt is computer generated hence no signature is required.</p>
        )}
      </footer>
    </div>
  );

  return (
    <div className="bg-white min-h-screen text-black" style={{ backgroundColor: 'white', color: 'black' }}>
      <div className="max-w-4xl mx-auto p-4 flex justify-between items-center print-hidden">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Print Again
        </Button>
      </div>

      <div className="print-container bg-white text-black" ref={printRef}>
        {/* Page 1: Office + Student Copy (Half A4 each) */}
        <div className="page bg-white text-black">
          <ReceiptContent copyType="Office Copy" />
          <div className="cut-line text-center my-2 text-[10px] text-black">
            ○ï¸ --------------------------- CUT HERE --------------------------- ○ï¸
          </div>
          <ReceiptContent copyType="Student Copy" />
        </div>

        {/* Page 2: Bank Copy */}
        <div className="page break-page bg-white text-black">
          <ReceiptContent copyType="Bank Copy" />
        </div>
      </div>

      <style type="text/css">
        {`
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          @media print {
            body {
              background-color: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact;
            }
            .print-hidden { display: none !important; }
            .break-page { page-break-before: always; }
            .page {
               border: none !important;
               margin: 0 !important;
               padding: 0 !important;
            }
          }

          @media screen {
            .page {
              width: 210mm;
              margin: 20px auto;
              padding: 10mm;
              background: white;
              border: 1px solid #ddd;
              color: black;
            }
            .cut-line {
              border-top: 2px dashed #000;
              margin: 12px 0;
              text-align: center;
            }
          }
          
          /* Force black text everywhere inside print container */
          .print-container * {
             color: black !important;
             border-color: black !important;
          }
          
          /* Override Quill editor styles */
          .ql-editor {
             color: black !important;
          }
          .ql-editor p {
             color: black !important;
          }
        `}
      </style>
    </div>
  );
};

export default PrintFeesReceipt;
