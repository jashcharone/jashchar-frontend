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
    const [receiptCopySettings, setReceiptCopySettings] = useState({ office_copy: true, student_copy: true, bank_copy: false });
    const [isOriginal, setIsOriginal] = useState(true);
    const [currentDateTime] = useState(new Date());

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

            // Fetch branch settings for copy settings (saved in branches table by GeneralSetting)
            const { data: branchData } = await supabase
                .from('branches')
                .select('print_receipt_office_copy, print_receipt_student_copy, print_receipt_bank_copy')
                .eq('id', selectedBranch.id)
                .maybeSingle();

            if (branchData) {
                setReceiptCopySettings({
                    office_copy: branchData.print_receipt_office_copy !== false,
                    student_copy: branchData.print_receipt_student_copy !== false,
                    bank_copy: branchData.print_receipt_bank_copy === true
                });
            }

            // Fetch ALL transport payments for this student to calculate summary
            const { data: allTransportPayments } = await supabase
                .from('transport_fee_payments')
                .select('*')
                .eq('student_id', payment.student_id)
                .eq('branch_id', selectedBranch.id)
                .is('reverted_at', null);

            // Calculate transport fee summary (respecting billing cycle)
            let transportSummary = null;
            if (transport && transport.transport_fee > 0) {
                const periodFee = Number(transport.transport_fee) || 0;
                const billingCycle = transport.billing_cycle || 'monthly';
                const totalMonths = 12; // Default 12 months per session
                
                // Calculate total annual fee based on billing cycle
                // billing_cycle determines how the fee amount is interpreted:
                // monthly: fee × 12, quarterly: fee × 4, half_yearly: fee × 2, annual/one_time: fee × 1
                const periods = {
                    monthly: totalMonths,
                    quarterly: Math.ceil(totalMonths / 3),
                    half_yearly: Math.ceil(totalMonths / 6),
                    annual: 1,
                    one_time: 1
                };
                const periodsCount = periods[billingCycle] || totalMonths;
                const totalFee = periodFee * periodsCount;
                const monthlyFee = totalFee / totalMonths; // Monthly equivalent
                
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
                    billingCycle,
                    status: balance <= 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid'
                };
            }

            // Check if this receipt has been printed before (Original vs Reprint)
            const anyPrinted = payments.some(p => p.printed_at);
            setIsOriginal(!anyPrinted);

            // Receipt generated date = first payment's created_at
            const receiptCreatedAt = payments[0]?.created_at || payments[0]?.payment_date || new Date().toISOString();

            setPaymentDetails({
                payment,
                payments, // Array of all payments in this transaction
                student,
                transport,
                school,
                branch: selectedBranch,
                transportSummary,
                receiptCreatedAt,
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

    const handlePrint = async () => {
        if (isOriginal && paymentDetails?.payments?.length > 0) {
            const paymentIds = paymentDetails.payments.map(p => p.id);
            const { data: updateResult, error: updateError } = await supabase
                .from('transport_fee_payments')
                .update({ printed_at: new Date().toISOString() })
                .in('id', paymentIds)
                .select('id, printed_at');
            
            if (!updateError && updateResult?.length > 0) {
                setIsOriginal(false);
            }
        }
        window.print();
    };

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

    const { payment, payments = [payment], student, transport, school, branch, transportSummary, receiptCreatedAt } = paymentDetails;
    const receiptDate = receiptCreatedAt ? new Date(receiptCreatedAt) : currentDateTime;

    // Receipt No = short serial (e.g., T00001), Transaction ID = full reference in Payment History
    const receiptNo = (() => {
        const txnId = payment?.transaction_id || '';
        const parts = txnId.split('/');
        return parts.length === 3 ? parts[2] : txnId || '-';
    })();

    // Calculate totals from all payments in this transaction
    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalDiscount = payments.reduce((sum, p) => sum + Number(p.discount_amount || 0), 0);
    const totalFine = payments.reduce((sum, p) => sum + Number(p.fine_paid || 0), 0);
    const totalPaid = totalAmount - totalDiscount + totalFine;

    const Receipt = ({ copyType, isPageOne = false }) => (
        <div className={`receipt-box bg-white text-black border border-gray-400 ${isPageOne ? 'page1-receipt' : ''}`} style={{ 
            width: '100%', 
            minHeight: isPageOne ? 'auto' : '45vh',
            padding: '0',
            pageBreakInside: isPageOne ? 'auto' : 'avoid'
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

            {/* Title Bar - includes Copy Type, Original/Reprint, & Receipt No */}
            <div className='bg-blue-800 text-white py-1 px-3 flex justify-between items-center'>
                <span className='text-[10px] font-bold uppercase tracking-wide opacity-90'>{copyType}</span>
                <div className='text-center flex items-center gap-1'>
                    <Bus className='h-3 w-3' />
                    <span className='text-sm font-semibold tracking-wide'>TRANSPORT FEE RECEIPT</span>
                    <span className={`ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${isOriginal ? 'bg-green-500/30 text-green-200' : 'bg-yellow-500/30 text-yellow-200'}`}>
                        {isOriginal ? 'ORIGINAL' : 'REPRINT COPY'}
                    </span>
                </div>
                <span className='text-[10px]'>
                    Receipt No: <span className='font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded'>{receiptNo}</span>
                </span>
            </div>

            {/* Content */}
            <div className='p-3'>
                {/* Student & Transport Info - Compact */}
                <div className='flex justify-between gap-4 mb-2 text-[11px]' style={{ lineHeight: '1.4' }}>
                    <div className='flex-1'>
                        <table className='w-full' style={{ borderSpacing: 0 }}>
                            <tbody>
                                <tr>
                                    <td className='font-semibold text-gray-700 w-28' style={{ padding: '1px 0' }}>Student Name</td>
                                    <td style={{ padding: '1px 0' }}>: <span className='font-bold text-gray-900 text-[12px]'>{student?.full_name}</span></td>
                                </tr>
                                <tr>
                                    <td className='font-semibold text-gray-700' style={{ padding: '1px 0' }}>Admission No</td>
                                    <td style={{ padding: '1px 0' }}>: <span className='font-mono font-bold text-gray-900 bg-gray-100 px-1 rounded'>{student?.school_code || student?.admission_no || '-'}</span></td>
                                </tr>
                                <tr>
                                    <td className='font-semibold text-gray-700' style={{ padding: '1px 0' }}>Father's Name</td>
                                    <td style={{ padding: '1px 0' }}>: {student?.father_name || '-'}</td>
                                </tr>
                                <tr>
                                    <td className='font-semibold text-gray-700' style={{ padding: '1px 0' }}>Class</td>
                                    <td style={{ padding: '1px 0' }}>: {student?.classes?.name || '-'} ({student?.sections?.name || '-'})</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className='flex-1'>
                        <table className='w-full' style={{ borderSpacing: 0 }}>
                            <tbody>
                                <tr>
                                    <td className='font-semibold text-gray-700 w-24' style={{ padding: '1px 0' }}>Date</td>
                                    <td style={{ padding: '1px 0' }}>: <span className='font-medium'>{format(receiptDate, 'dd-MM-yyyy')}</span></td>
                                </tr>
                                <tr>
                                    <td className='font-semibold text-gray-700' style={{ padding: '1px 0' }}>Time</td>
                                    <td style={{ padding: '1px 0' }}>: <span className='font-medium'>{format(receiptDate, 'hh:mm a')}</span></td>
                                </tr>
                                <tr>
                                    <td className='font-semibold text-gray-700' style={{ padding: '1px 0' }}>Route</td>
                                    <td style={{ padding: '1px 0' }}>: {transport?.route?.route_title || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td className='font-semibold text-gray-700' style={{ padding: '1px 0' }}>Payment Mode</td>
                                    <td style={{ padding: '1px 0' }}>: <span className='uppercase font-medium'>{payment.payment_mode || 'Cash'}</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Fee Table - Matching Fees Receipt design. Discount/Fine shown only when applicable */}
                <table className='w-full text-[10px] border-collapse border border-gray-400 mb-2'>
                    <thead>
                        <tr className='bg-blue-900 text-white'>
                            <th className='border border-gray-400 p-1.5 text-left w-6'>S.No</th>
                            <th className='border border-gray-400 p-1.5 text-left'>Fee Particulars</th>
                            <th className='border border-gray-400 p-1.5 text-right w-16' style={{ whiteSpace: 'nowrap' }}>Total Fee&nbsp;(₹)</th>
                            {totalDiscount > 0 && <th className='border border-gray-400 p-1.5 text-right w-14' style={{ whiteSpace: 'nowrap' }}>Discount&nbsp;(₹)</th>}
                            {totalFine > 0 && <th className='border border-gray-400 p-1.5 text-right w-14' style={{ whiteSpace: 'nowrap' }}>Fine&nbsp;(₹)</th>}
                            <th className='border border-gray-400 p-1.5 text-right w-14' style={{ whiteSpace: 'nowrap' }}>Paid&nbsp;(₹)</th>
                            <th className='border border-gray-400 p-1.5 text-right w-16' style={{ whiteSpace: 'nowrap' }}>Balance&nbsp;(₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className='bg-white'>
                            <td className='border border-gray-300 p-1.5 text-center'>1</td>
                            <td className='border border-gray-300 p-1.5 font-medium'>
                                Transport Fee
                                {payments.length > 0 && (
                                    <span className='text-[8px] text-gray-500 ml-1'>
                                        ({payments.map(p => p.payment_month).filter(Boolean).join(', ')})
                                    </span>
                                )}
                            </td>
                            <td className='border border-gray-300 p-1.5 text-right font-mono'>{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            {totalDiscount > 0 && <td className='border border-gray-300 p-1.5 text-right font-mono'>{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>}
                            {totalFine > 0 && <td className='border border-gray-300 p-1.5 text-right font-mono'>{totalFine.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>}
                            <td className='border border-gray-300 p-1.5 text-right font-mono font-semibold'>{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className='border border-gray-300 p-1.5 text-right font-mono font-semibold text-red-600'>{transportSummary ? transportSummary.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr className='bg-gray-100 font-bold'>
                            <td colSpan='2' className='border border-gray-400 p-1.5 text-right'>TOTAL:</td>
                            <td className='border border-gray-400 p-1.5 text-right font-mono'>{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            {totalDiscount > 0 && <td className='border border-gray-400 p-1.5 text-right font-mono text-blue-700'>{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>}
                            {totalFine > 0 && <td className='border border-gray-400 p-1.5 text-right font-mono'>{totalFine.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>}
                            <td className='border border-gray-400 p-1.5 text-right font-mono text-green-700'>{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className='border border-gray-400 p-1.5 text-right font-mono text-red-700'>{transportSummary ? transportSummary.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</td>
                        </tr>
                    </tfoot>
                </table>

                {/* Payment Summary Box - Matching Fees Receipt */}
                <div className='flex justify-between gap-2 mb-1'>
                    <div className='flex-1 bg-green-50 border border-green-300 rounded px-2 py-1 text-center'>
                        <div className='text-[7px] text-green-600 uppercase font-semibold'>Amount Paid</div>
                        <div className='text-[11px] font-bold text-green-800'>₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    </div>
                    {totalDiscount > 0 && (
                        <div className='flex-1 bg-blue-50 border border-blue-300 rounded px-2 py-1 text-center'>
                            <div className='text-[7px] text-blue-600 uppercase font-semibold'>Discount</div>
                            <div className='text-[11px] font-bold text-blue-800'>₹{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        </div>
                    )}
                    {transportSummary && transportSummary.balance > 0 && (
                        <div className='flex-1 bg-red-50 border border-red-300 rounded px-2 py-1 text-center'>
                            <div className='text-[7px] text-red-600 uppercase font-semibold'>Balance Due</div>
                            <div className='text-[11px] font-bold text-red-800'>₹{transportSummary.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        </div>
                    )}
                </div>

                {/* Note (if any) */}
                {payment.note && (
                    <div className='text-[10px] mb-2'>
                        <span className='text-gray-600'>Note:</span>
                        <span className='ml-1'>{payment.note}</span>
                    </div>
                )}

                {/* Transport Fee Statement - Bordered table matching fees receipt */}
                {transportSummary && (
                    <div className='mt-1 border border-gray-400 rounded'>
                        {/* Header */}
                        <div className='bg-gray-100 border-b border-gray-400 px-2 py-0.5 flex justify-between items-center'>
                            <span className='text-[8px] font-semibold text-gray-700'>🚌 TRANSPORT FEE STATEMENT</span>
                            <span className='text-[7px]'>
                                <span className={`px-1 rounded font-bold ${
                                    transportSummary.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                                    transportSummary.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' : 
                                    'bg-red-100 text-red-700'
                                }`}>{transportSummary.status}</span>
                            </span>
                        </div>
                        {/* Table */}
                        <table className='w-full text-[7px] border-collapse'>
                            <thead>
                                <tr className='bg-gray-50'>
                                    <th className='text-left px-2 py-0.5 font-semibold text-gray-600 border-b border-gray-300'>Details</th>
                                    <th className='text-right px-2 py-0.5 font-semibold text-gray-600 border-b border-gray-300 w-16'>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className='bg-white'>
                                    <td className='px-2 border-b border-gray-200 text-gray-700' style={{ lineHeight: '1.6' }}>
                                        Route: <span className='font-medium'>{transport?.route?.route_title || 'N/A'}</span>
                                        {transport?.pickup_point?.name && <span className='text-gray-400 ml-1'>({transport.pickup_point.name})</span>}
                                    </td>
                                    <td className='px-2 border-b border-gray-200 font-mono text-right' style={{ lineHeight: '1.6' }}>
                                        Billing: {transportSummary.billingCycle === 'annual' ? 'Annual' : transportSummary.billingCycle === 'one_time' ? 'One-Time' : transportSummary.billingCycle === 'monthly' ? 'Monthly' : transportSummary.billingCycle}
                                    </td>
                                </tr>
                                <tr className='bg-gray-50'>
                                    <td className='px-2 border-b border-gray-200 text-gray-700' style={{ lineHeight: '1.6' }}>Total Fee</td>
                                    <td className='px-2 border-b border-gray-200 font-mono text-right' style={{ lineHeight: '1.6' }}>₹{transportSummary.totalFee.toLocaleString('en-IN')}</td>
                                </tr>
                                <tr className='bg-white'>
                                    <td className='px-2 border-b border-gray-200 text-green-600' style={{ lineHeight: '1.6' }}>Total Paid</td>
                                    <td className='px-2 border-b border-gray-200 font-mono text-right text-green-600' style={{ lineHeight: '1.6' }}>₹{transportSummary.totalPaid.toLocaleString('en-IN')}</td>
                                </tr>
                                {transportSummary.totalDiscount > 0 && (
                                <tr className='bg-gray-50'>
                                    <td className='px-2 border-b border-gray-200 text-blue-600' style={{ lineHeight: '1.6' }}>Total Discount</td>
                                    <td className='px-2 border-b border-gray-200 font-mono text-right text-blue-600' style={{ lineHeight: '1.6' }}>₹{transportSummary.totalDiscount.toLocaleString('en-IN')}</td>
                                </tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr className='bg-gray-100 font-bold'>
                                    <td className='px-2 py-0.5 border-t border-gray-400 text-red-700'>Balance Due</td>
                                    <td className='px-2 py-0.5 border-t border-gray-400 font-mono text-right text-red-700'>{transportSummary.balance > 0 ? `₹${transportSummary.balance.toLocaleString('en-IN')}` : '₹0'}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {/* Footer */}
                <div className='flex justify-between items-end mt-2 pt-2 border-t border-dashed border-gray-400'>
                    <div className='text-[9px] text-gray-500 italic'>
                        This is a computer generated receipt. No signature required.
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
            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 5mm; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .print-hidden { display: none !important; }
                    .page-1-receipts {
                        display: flex !important;
                        flex-direction: column !important;
                        height: calc(297mm - 10mm) !important;
                        overflow: hidden !important;
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
                    .page1-receipt .p-3 { padding: 2mm !important; }
                    .page1-receipt .mb-3 { margin-bottom: 1.5mm !important; }
                    .page1-receipt .mb-2 { margin-bottom: 1mm !important; }
                    .page1-receipt .mt-2 { margin-top: 1mm !important; }
                    .page1-receipt .pt-2 { padding-top: 1mm !important; }
                    .page1-receipt .pt-4 { padding-top: 2mm !important; }
                    .page1-receipt .gap-4 { gap: 1.5mm !important; }
                    .page1-receipt table { font-size: 8px !important; }
                    .page1-receipt .text-sm { font-size: 9px !important; }
                    .page1-receipt .text-lg { font-size: 12px !important; }
                    .receipt-box:not(.page1-receipt) { break-inside: avoid !important; page-break-inside: avoid !important; margin-bottom: 2mm !important; min-height: auto !important; }
                }
                @media screen {
                    .print-container { max-width: 210mm; margin: 0 auto; background: #f5f5f5; min-height: 100vh; padding: 20px; }
                    @media (max-width: 640px) { .print-container { max-width: 100%; padding: 8px; padding-bottom: 80px; min-height: auto; } .receipt-box table { font-size: 9px !important; } .receipt-box .p-3 { padding: 6px !important; } }
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
                            <span className='px-4 text-[10px] text-gray-500'>✂ CUT HERE ✂</span>
                            <div className='flex-1 border-t-2 border-dashed border-gray-400'></div>
                        </div>
                    )}

                    {receiptCopySettings.student_copy && (
                        <Receipt copyType='STUDENT COPY' isPageOne={true} />
                    )}

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

export default PrintTransportReceipt;
