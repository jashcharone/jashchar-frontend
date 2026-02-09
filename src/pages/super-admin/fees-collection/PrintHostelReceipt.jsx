import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, ArrowLeft, Building2 } from 'lucide-react';
import { format } from 'date-fns';

const PrintHostelReceipt = () => {
    const { paymentId } = useParams();
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDetails = useCallback(async () => {
        if (!paymentId || !selectedBranch?.id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            // Fetch payment
            const { data: payment, error: paymentError } = await supabase
                .from('hostel_fee_payments')
                .select('*')
                .eq('id', paymentId)
                .eq('branch_id', selectedBranch.id)
                .single();

            if (paymentError) throw paymentError;
            if (!payment) throw new Error('Payment not found');

            // Fetch student
            const { data: student } = await supabase
                .from('student_profiles')
                .select('*, classes!student_profiles_class_id_fkey(name), sections!student_profiles_section_id_fkey(name)')
                .eq('id', payment.student_id)
                .single();

            // Fetch hostel details
            const { data: hostel } = await supabase
                .from('student_hostel_details')
                .select(`
                    *,
                    room:room_id(room_number_name, cost_per_bed),
                    room_type:hostel_room_type(name, cost)
                `)
                .eq('student_id', payment.student_id)
                .eq('branch_id', selectedBranch.id)
                .maybeSingle();

            // Fetch school info
            const { data: school } = await supabase
                .from('schools')
                .select('*')
                .eq('id', selectedBranch.id)
                .maybeSingle();

            setPaymentDetails({
                payment,
                student,
                hostel,
                school,
                branch: selectedBranch
            });
        } catch (error) {
            console.error('Error:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [paymentId, selectedBranch, toast]);

    useEffect(() => {
        if (selectedBranch) fetchDetails();
    }, [fetchDetails, selectedBranch]);

    const handlePrint = () => window.print();

    if (loading) {
        return (
            <div className='flex justify-center items-center h-screen bg-white'>
                <Loader2 className='animate-spin h-8 w-8 text-purple-600' />
                <span className='ml-2'>Loading receipt...</span>
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

    const { payment, student, hostel, school, branch } = paymentDetails;
    const currencySymbol = '₹';

    const Receipt = ({ copyType }) => (
        <div className='receipt-box bg-white text-black border border-gray-400' style={{ 
            width: '100%', 
            minHeight: '45vh',
            padding: '0',
            pageBreakInside: 'avoid'
        }}>
            {/* Header */}
            <div className='flex justify-between items-center p-3 border-b-2 border-gray-800 bg-purple-50'>
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
                </div>
            </div>

            {/* Title Bar */}
            <div className='bg-purple-800 text-white text-center py-1 flex items-center justify-center gap-2'>
                <Building2 className='h-4 w-4' />
                <span className='text-sm font-semibold tracking-wide'>HOSTEL FEE RECEIPT</span>
            </div>

            {/* Copy Type & Receipt Info */}
            <div className='flex justify-between items-center px-3 py-1.5 bg-gray-100 border-b text-[10px]'>
                <span className='font-bold text-gray-800 uppercase tracking-wide'>{copyType}</span>
                <span className='text-gray-700'>
                    Receipt No: <span className='font-mono font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded'>{payment.transaction_id}</span>
                </span>
            </div>

            {/* Content */}
            <div className='p-3'>
                {/* Student & Hostel Info */}
                <div className='flex justify-between gap-4 mb-3 text-[11px]'>
                    <div className='flex-1'>
                        <table className='w-full'>
                            <tbody>
                                <tr>
                                    <td className='font-semibold text-gray-700 py-0.5 w-28'>Student Name</td>
                                    <td className='py-0.5'>: <span className='font-medium'>{student?.full_name}</span></td>
                                </tr>
                                <tr>
                                    <td className='font-semibold text-gray-700 py-0.5'>Admission No</td>
                                    <td className='py-0.5'>: <span className='font-mono'>{student?.school_code || student?.admission_no || '-'}</span></td>
                                </tr>
                                <tr>
                                    <td className='font-semibold text-gray-700 py-0.5'>Father's Name</td>
                                    <td className='py-0.5'>: {student?.father_name || '-'}</td>
                                </tr>
                                <tr>
                                    <td className='font-semibold text-gray-700 py-0.5'>Class</td>
                                    <td className='py-0.5'>: {student?.classes?.name || '-'} ({student?.sections?.name || '-'})</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className='flex-1'>
                        <table className='w-full'>
                            <tbody>
                                <tr>
                                    <td className='font-semibold text-gray-700 py-0.5 w-24'>Date</td>
                                    <td className='py-0.5'>: {format(new Date(payment.payment_date), 'dd MMM yyyy')}</td>
                                </tr>
                                <tr>
                                    <td className='font-semibold text-gray-700 py-0.5'>Room</td>
                                    <td className='py-0.5'>: {hostel?.room?.room_number_name || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td className='font-semibold text-gray-700 py-0.5'>Room Type</td>
                                    <td className='py-0.5'>: {hostel?.room_type?.name || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td className='font-semibold text-gray-700 py-0.5'>Bed No</td>
                                    <td className='py-0.5'>: {hostel?.bed_number || 'N/A'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment Details Table */}
                <table className='w-full border-collapse text-[11px] mb-3'>
                    <thead>
                        <tr className='bg-gray-200'>
                            <th className='border border-gray-400 p-1.5 text-left'>Description</th>
                            <th className='border border-gray-400 p-1.5 text-center'>Month</th>
                            <th className='border border-gray-400 p-1.5 text-right w-24'>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className='border border-gray-400 p-1.5'>Hostel Fee</td>
                            <td className='border border-gray-400 p-1.5 text-center'>{payment.payment_month || '-'}</td>
                            <td className='border border-gray-400 p-1.5 text-right font-mono'>{currencySymbol}{Number(payment.amount).toLocaleString('en-IN')}</td>
                        </tr>
                        {Number(payment.discount_amount) > 0 && (
                            <tr>
                                <td className='border border-gray-400 p-1.5'>Discount</td>
                                <td className='border border-gray-400 p-1.5 text-center'>-</td>
                                <td className='border border-gray-400 p-1.5 text-right font-mono text-green-700'>-{currencySymbol}{Number(payment.discount_amount).toLocaleString('en-IN')}</td>
                            </tr>
                        )}
                        {Number(payment.fine_paid) > 0 && (
                            <tr>
                                <td className='border border-gray-400 p-1.5'>Fine</td>
                                <td className='border border-gray-400 p-1.5 text-center'>-</td>
                                <td className='border border-gray-400 p-1.5 text-right font-mono text-red-700'>+{currencySymbol}{Number(payment.fine_paid).toLocaleString('en-IN')}</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr className='bg-purple-100 font-bold'>
                            <td colSpan='2' className='border border-gray-400 p-1.5 text-right'>TOTAL PAID</td>
                            <td className='border border-gray-400 p-1.5 text-right font-mono text-purple-800'>
                                {currencySymbol}{(Number(payment.amount) - Number(payment.discount_amount || 0) + Number(payment.fine_paid || 0)).toLocaleString('en-IN')}
                            </td>
                        </tr>
                    </tfoot>
                </table>

                {/* Payment Mode & Note */}
                <div className='flex justify-between text-[10px] mb-3'>
                    <div>
                        <span className='text-gray-600'>Payment Mode:</span>
                        <span className='ml-1 font-medium bg-gray-100 px-2 py-0.5 rounded'>{payment.payment_mode}</span>
                    </div>
                    {payment.note && (
                        <div>
                            <span className='text-gray-600'>Note:</span>
                            <span className='ml-1'>{payment.note}</span>
                        </div>
                    )}
                </div>

                {/* Signature */}
                <div className='flex justify-between items-end pt-4 text-[10px]'>
                    <div className='text-center'>
                        <div className='border-t border-gray-400 pt-1 px-8'>Student/Parent Sign</div>
                    </div>
                    <div className='text-center'>
                        <div className='border-t border-gray-400 pt-1 px-8'>Authorized Signatory</div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 5mm; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .print-hidden { display: none !important; }
                    .receipt-box { break-inside: avoid !important; page-break-inside: avoid !important; margin-bottom: 2mm !important; }
                }
                @media screen {
                    .print-container { max-width: 210mm; margin: 0 auto; background: #f5f5f5; min-height: 100vh; padding: 20px; }
                }
            `}</style>

            {/* Screen Header */}
            <div className='print-hidden bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4 sticky top-0 z-50 shadow-lg'>
                <div className='max-w-4xl mx-auto flex justify-between items-center'>
                    <Button variant='ghost' className='text-white hover:bg-purple-700' onClick={() => navigate(-1)}>
                        <ArrowLeft className='mr-2 h-4 w-4' />Back
                    </Button>
                    <h1 className='text-lg font-semibold'>Hostel Fee Receipt</h1>
                    <Button onClick={handlePrint} className='bg-white text-purple-700 hover:bg-purple-50'>
                        <Printer className='mr-2 h-4 w-4' />Print Receipt
                    </Button>
                </div>
            </div>

            {/* Print Container */}
            <div className='print-container bg-white' style={{ minHeight: '297mm' }}>
                <div className='flex flex-col gap-4'>
                    <Receipt copyType='OFFICE COPY' />
                    <div className='flex items-center justify-center py-1 print:py-0'>
                        <div className='flex-1 border-t-2 border-dashed border-gray-400'></div>
                        <span className='px-4 text-[10px] text-gray-500'>✂ CUT HERE ✂</span>
                        <div className='flex-1 border-t-2 border-dashed border-gray-400'></div>
                    </div>
                    <Receipt copyType='STUDENT COPY' />
                </div>
            </div>
        </>
    );
};

export default PrintHostelReceipt;
