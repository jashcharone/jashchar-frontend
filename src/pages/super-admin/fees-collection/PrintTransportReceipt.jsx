import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, ArrowLeft, Bus } from 'lucide-react';
import { format } from 'date-fns';

const PrintTransportReceipt = () => {
    const { paymentId } = useParams();
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [printHeaderImage, setPrintHeaderImage] = useState(null);
    const [receiptFormat, setReceiptFormat] = useState('detailed'); // 'detailed' or 'summary'

    const fetchDetails = useCallback(async () => {
        if (!paymentId || !selectedBranch?.id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            // Fetch payment to get transaction_id
            const { data: initialPayment, error: paymentError } = await supabase
                .from('transport_fee_payments')
                .select('*')
                .eq('id', paymentId)
                .eq('branch_id', selectedBranch.id)
                .single();

            if (paymentError) throw paymentError;
            if (!initialPayment) throw new Error('Payment not found');

            // Fetch ALL payments with same transaction_id (for multi-month payments)
            const { data: transactionPayments } = await supabase
                .from('transport_fee_payments')
                .select('*')
                .eq('transaction_id', initialPayment.transaction_id)
                .eq('branch_id', selectedBranch.id)
                .order('created_at', { ascending: true });

            // Use all payments from same transaction, or fallback to single payment
            const payments = transactionPayments && transactionPayments.length > 0 ? transactionPayments : [initialPayment];
            const payment = payments[0]; // For backward compatibility

            // Fetch student
            const { data: student } = await supabase
                .from('student_profiles')
                .select('*, classes!student_profiles_class_id_fkey(name), sections!student_profiles_section_id_fkey(name)')
                .eq('id', payment.student_id)
                .single();

            // Fetch transport details
            const { data: transport } = await supabase
                .from('student_transport_details')
                .select(`
                    *,
                    route:transport_route_id(route_title),
                    pickup_point:transport_pickup_point_id(name)
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

            // Fetch print header image from print_settings
            const { data: printSettings } = await supabase
                .from('print_settings')
                .select('header_image_url')
                .eq('branch_id', selectedBranch.id)
                .eq('type', 'fees_receipt')
                .maybeSingle();

            if (printSettings?.header_image_url) {
                setPrintHeaderImage(printSettings.header_image_url);
            }

            // Fetch branch settings for receipt format (saved in branches table by GeneralSetting)
            const { data: branchData } = await supabase
                .from('branches')
                .select('transport_hostel_receipt_format')
                .eq('id', selectedBranch.id)
                .maybeSingle();

            if (branchData?.transport_hostel_receipt_format) {
                setReceiptFormat(branchData.transport_hostel_receipt_format);
            }

            // Fetch ALL transport payments for this student to calculate summary
            const { data: allTransportPayments } = await supabase
                .from('transport_fee_payments')
                .select('*')
                .eq('student_id', payment.student_id)
                .eq('branch_id', selectedBranch.id)
                .is('reverted_at', null);

            // Calculate transport fee summary
            let transportSummary = null;
            if (transport && transport.transport_fee > 0) {
                const monthlyFee = Number(transport.transport_fee) || 0;
                const totalMonths = 12; // Default 12 months
                const totalFee = monthlyFee * totalMonths;
                const totalPaid = (allTransportPayments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
                const totalDiscount = (allTransportPayments || []).reduce((sum, p) => sum + Number(p.discount_amount || 0), 0);
                const paidMonthsCount = (allTransportPayments || []).length;
                const balance = Math.max(0, totalFee - totalPaid - totalDiscount);
                
                // Get paid months list
                const paidMonths = (allTransportPayments || []).map(p => p.payment_month).filter(Boolean);

                transportSummary = {
                    monthlyFee,
                    totalMonths,
                    totalFee,
                    totalPaid,
                    totalDiscount,
                    balance,
                    paidMonthsCount,
                    unpaidMonthsCount: totalMonths - paidMonthsCount,
                    paidMonths,
                    status: balance <= 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid'
                };
            }

            setPaymentDetails({
                payment,
                payments, // Array of all payments in this transaction
                student,
                transport,
                school,
                branch: selectedBranch,
                transportSummary
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
                <Loader2 className='animate-spin h-8 w-8 text-blue-600' />
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

    const { payment, payments = [payment], student, transport, school, branch, transportSummary } = paymentDetails;
    const currencySymbol = '₹';

    // Calculate totals from all payments in this transaction
    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalDiscount = payments.reduce((sum, p) => sum + Number(p.discount_amount || 0), 0);
    const totalFine = payments.reduce((sum, p) => sum + Number(p.fine_paid || 0), 0);
    const totalPaid = totalAmount - totalDiscount + totalFine;

    const Receipt = ({ copyType }) => (
        <div className='receipt-box bg-white text-black border border-gray-400' style={{ 
            width: '100%', 
            minHeight: '45vh',
            padding: '0',
            pageBreakInside: 'avoid'
        }}>
            {/* Header */}
            {printHeaderImage ? (
                <div className='border-b-2 border-gray-800'>
                    <img src={printHeaderImage} alt='Header' className='w-full h-auto object-contain' style={{ maxHeight: '120px' }} />
                </div>
            ) : (
                <div className='flex justify-between items-center p-3 border-b-2 border-gray-800 bg-blue-50'>
                    <div className='flex items-center gap-3'>
                        {school?.logo_url && <img src={school.logo_url} alt='Logo' className='h-12' />}
                        <div>
                            <h1 className='text-lg font-bold uppercase text-gray-900'>{school?.name || branch?.branch_name || '-'}</h1>
                            {school?.address && <p className='text-xs text-gray-600'>{school.address}</p>}
                        </div>
                    </div>
                    <div className='text-right text-[9px] text-gray-600'>
                        {(school?.pincode || school?.city) && <p>{[school?.city, school?.state, school?.pincode].filter(Boolean).join(', ')}</p>}
                        {school?.contact_number && <p>Phone: {school.contact_number}</p>}
                    </div>
                </div>
            )}

            {/* Title Bar */}
            <div className='bg-blue-800 text-white text-center py-1 flex items-center justify-center gap-2'>
                <Bus className='h-4 w-4' />
                <span className='text-sm font-semibold tracking-wide'>TRANSPORT FEE RECEIPT</span>
            </div>

            {/* Copy Type & Receipt Info */}
            <div className='flex justify-between items-center px-3 py-1.5 bg-gray-100 border-b text-[10px]'>
                <span className='font-bold text-gray-800 uppercase tracking-wide'>{copyType}</span>
                <span className='text-gray-700'>
                    Receipt No: <span className='font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded'>{payment.transaction_id}</span>
                </span>
            </div>

            {/* Content */}
            <div className='p-3'>
                {/* Student & Transport Info */}
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
                                    <td className='font-semibold text-gray-700 py-0.5'>Route</td>
                                    <td className='py-0.5'>: {transport?.route?.route_title || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td className='font-semibold text-gray-700 py-0.5'>Pickup Point</td>
                                    <td className='py-0.5'>: {transport?.pickup_point?.name || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td className='font-semibold text-gray-700 py-0.5'>Vehicle</td>
                                    <td className='py-0.5'>: {transport?.vehicle_number || 'N/A'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment Details Table */}
                {receiptFormat === 'summary' ? (
                    /* SUMMARY FORMAT - Clean installment-wise receipt */
                    <>
                        {/* Billing Cycle Info Header */}
                        {transport?.billing_cycle && transport.billing_cycle !== 'monthly' && (
                            <div className='mb-2 p-2 rounded bg-blue-50 border-l-4 border-blue-500 text-[10px]'>
                                <div className='flex justify-between items-center'>
                                    <span className='font-semibold text-blue-800'>
                                        📅 Billing Cycle: {transport.billing_cycle === 'quarterly' ? 'Quarterly' : 
                                                          transport.billing_cycle === 'half_yearly' ? 'Half-Yearly' : 
                                                          transport.billing_cycle === 'annual' ? 'Annual' : 
                                                          transport.billing_cycle === 'one_time' ? 'One-Time' : 'Monthly'}
                                    </span>
                                    <span className='text-gray-600'>
                                        Annual Fee: ₹{transportSummary?.totalFee?.toLocaleString('en-IN') || '-'}
                                    </span>
                                </div>
                            </div>
                        )}
                        <table className='w-full border-collapse text-[11px] mb-3'>
                            <thead>
                                <tr className='bg-gray-200'>
                                    <th className='border border-gray-400 p-1.5 text-center w-10'>S.No</th>
                                    <th className='border border-gray-400 p-1.5 text-left'>Fee Particulars</th>
                                    <th className='border border-gray-400 p-1.5 text-right'>Amount (₹)</th>
                                    <th className='border border-gray-400 p-1.5 text-right'>Discount (₹)</th>
                                    <th className='border border-gray-400 p-1.5 text-right'>Fine (₹)</th>
                                    <th className='border border-gray-400 p-1.5 text-right'>Paid (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className='border border-gray-400 p-1.5 text-center'>1</td>
                                    <td className='border border-gray-400 p-1.5'>
                                        Transport Fee
                                        {payments.length > 1 && (
                                            <span className='text-gray-500 text-[9px] ml-1'>
                                                ({payments.map(p => p.payment_month).filter(Boolean).join(', ')})
                                            </span>
                                        )}
                                        {payments.length === 1 && payments[0].payment_month && (
                                            <span className='text-gray-500 text-[9px] ml-1'>({payments[0].payment_month})</span>
                                        )}
                                    </td>
                                    <td className='border border-gray-400 p-1.5 text-right font-mono'>{totalAmount.toLocaleString('en-IN')}</td>
                                    <td className='border border-gray-400 p-1.5 text-right font-mono text-green-700'>{totalDiscount.toLocaleString('en-IN')}</td>
                                    <td className='border border-gray-400 p-1.5 text-right font-mono text-red-700'>{totalFine.toLocaleString('en-IN')}</td>
                                    <td className='border border-gray-400 p-1.5 text-right font-mono text-blue-700 font-bold'>{totalPaid.toLocaleString('en-IN')}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr className='bg-blue-100 font-bold'>
                                    <td colSpan='5' className='border border-gray-400 p-1.5 text-right'>TOTAL PAID</td>
                                    <td className='border border-gray-400 p-1.5 text-right font-mono text-blue-800'>
                                        {currencySymbol}{totalPaid.toLocaleString('en-IN')}
                                    </td>
                                </tr>
                                {transportSummary && transportSummary.balance > 0 && (
                                    <tr className='bg-orange-50'>
                                        <td colSpan='5' className='border border-gray-400 p-1.5 text-right text-orange-700'>Balance Due</td>
                                        <td className='border border-gray-400 p-1.5 text-right font-mono text-orange-700 font-bold'>
                                            {currencySymbol}{transportSummary.balance.toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                )}
                            </tfoot>
                        </table>
                    </>
                ) : (
                    /* DETAILED FORMAT - Month-wise breakdown */
                    <table className='w-full border-collapse text-[11px] mb-3'>
                        <thead>
                            <tr className='bg-gray-200'>
                                <th className='border border-gray-400 p-1.5 text-center w-10'>S.No</th>
                                <th className='border border-gray-400 p-1.5 text-left'>Fee Particulars</th>
                                <th className='border border-gray-400 p-1.5 text-right'>Total Fee (₹)</th>
                                <th className='border border-gray-400 p-1.5 text-right'>Discount (₹)</th>
                                <th className='border border-gray-400 p-1.5 text-right'>Fine (₹)</th>
                                <th className='border border-gray-400 p-1.5 text-right'>Paid (₹)</th>
                                <th className='border border-gray-400 p-1.5 text-right'>Balance (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p, idx) => (
                                <tr key={p.id || idx}>
                                    <td className='border border-gray-400 p-1.5 text-center'>{idx + 1}</td>
                                    <td className='border border-gray-400 p-1.5'>Transport Fee {p.payment_month ? `(${p.payment_month})` : ''}</td>
                                    <td className='border border-gray-400 p-1.5 text-right font-mono'>{Number(p.amount).toLocaleString('en-IN')}</td>
                                    <td className='border border-gray-400 p-1.5 text-right font-mono text-green-700'>{Number(p.discount_amount || 0).toLocaleString('en-IN')}</td>
                                    <td className='border border-gray-400 p-1.5 text-right font-mono text-red-700'>{Number(p.fine_paid || 0).toLocaleString('en-IN')}</td>
                                    <td className='border border-gray-400 p-1.5 text-right font-mono text-blue-700'>{(Number(p.amount) - Number(p.discount_amount || 0) + Number(p.fine_paid || 0)).toLocaleString('en-IN')}</td>
                                    <td className='border border-gray-400 p-1.5 text-right font-mono text-orange-700'>{idx === payments.length - 1 && transportSummary ? Number(transportSummary.balance).toLocaleString('en-IN') : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className='bg-blue-100 font-bold'>
                                <td colSpan='5' className='border border-gray-400 p-1.5 text-right'>TOTAL ({payments.length} month{payments.length > 1 ? 's' : ''})</td>
                                <td className='border border-gray-400 p-1.5 text-right font-mono text-blue-800'>
                                    {currencySymbol}{totalPaid.toLocaleString('en-IN')}
                                </td>
                                <td className='border border-gray-400 p-1.5 text-right font-mono text-orange-800'>
                                    {currencySymbol}{transportSummary ? Number(transportSummary.balance).toLocaleString('en-IN') : '0'}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                )}

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

                {/* Transport Fee Summary - Show detailed version only in 'detailed' format */}
                {transportSummary && receiptFormat === 'detailed' && (
                    <div className='mt-2 mb-3 border-t border-blue-300 pt-2'>
                        <div className='text-[9px] font-semibold text-blue-700 mb-1 flex justify-between items-center'>
                            <span>🚌 TRANSPORT FEE SUMMARY (All Months)</span>
                            <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold ${
                                transportSummary.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                                transportSummary.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' : 
                                'bg-red-100 text-red-700'
                            }`}>{transportSummary.status}</span>
                        </div>
                        <div className='grid grid-cols-2 gap-2 text-[8px]'>
                            <div className='bg-blue-50 p-1.5 rounded'>
                                <div className='text-gray-500'>Route: <span className='text-blue-800 font-medium'>{transport?.route?.route_title || 'N/A'}</span></div>
                                <div className='text-gray-500'>Pickup: <span className='text-blue-800 font-medium'>{transport?.pickup_point?.name || 'N/A'}</span></div>
                                {transportSummary.paidMonths && transportSummary.paidMonths.length > 0 && (
                                    <div className='text-gray-500 mt-1'>Paid Months: <span className='text-green-700 font-medium'>{transportSummary.paidMonths.join(', ')}</span></div>
                                )}
                            </div>
                            <div className='bg-blue-50 p-1.5 rounded'>
                                <div className='flex justify-between'>
                                    <span className='text-gray-500'>Monthly Fee:</span>
                                    <span className='font-mono'>₹{transportSummary.monthlyFee.toLocaleString('en-IN')}</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-gray-500'>Total ({transportSummary.totalMonths} months):</span>
                                    <span className='font-mono'>₹{transportSummary.totalFee.toLocaleString('en-IN')}</span>
                                </div>
                                <div className='flex justify-between text-green-600'>
                                    <span>Paid ({transportSummary.paidMonthsCount} months):</span>
                                    <span className='font-mono font-semibold'>₹{transportSummary.totalPaid.toLocaleString('en-IN')}</span>
                                </div>
                                <div className='flex justify-between text-red-600 font-semibold'>
                                    <span>Balance ({transportSummary.unpaidMonthsCount} months):</span>
                                    <span className='font-mono'>₹{transportSummary.balance.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
            <div className='print-hidden bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 sticky top-0 z-50 shadow-lg'>
                <div className='max-w-4xl mx-auto flex justify-between items-center'>
                    <Button variant='ghost' className='text-white hover:bg-blue-700' onClick={() => navigate(-1)}>
                        <ArrowLeft className='mr-2 h-4 w-4' />Back
                    </Button>
                    <h1 className='text-lg font-semibold'>Transport Fee Receipt</h1>
                    <Button onClick={handlePrint} className='bg-white text-blue-700 hover:bg-blue-50'>
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

export default PrintTransportReceipt;
