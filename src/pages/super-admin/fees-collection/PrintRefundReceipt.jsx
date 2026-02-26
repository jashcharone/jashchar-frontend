import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, ArrowLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const PrintRefundReceipt = () => {
    const { refundId } = useParams();
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [refundData, setRefundData] = useState(null);
    const [student, setStudent] = useState(null);
    const [school, setSchool] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentDateTime] = useState(new Date());

    const branchId = user?.profile?.branch_id;
    const userOrgId = organizationId || user?.profile?.organization_id;

    const fetchDetails = useCallback(async () => {
        if (!refundId || !selectedBranch?.id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            // 1. Fetch refund record
            const { data: refund, error: refundError } = await supabase
                .from('fee_refunds')
                .select('*')
                .eq('id', refundId)
                .eq('branch_id', selectedBranch.id)
                .single();

            if (refundError) throw refundError;
            if (!refund) throw new Error('Refund record not found');
            setRefundData(refund);

            // 2. Fetch student
            const { data: studentData } = await supabase
                .from('student_profiles')
                .select('*, classes!student_profiles_class_id_fkey(name), sections!student_profiles_section_id_fkey(name)')
                .eq('id', refund.student_id)
                .eq('branch_id', selectedBranch.id)
                .maybeSingle();

            setStudent(studentData);

            // 3. Fetch school/branch info
            const { data: schoolData } = await supabase
                .from('branches')
                .select('*, schools!branches_school_id_fkey(name, logo_url, address, phone, email, website)')
                .eq('id', selectedBranch.id)
                .maybeSingle();

            setSchool(schoolData);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [refundId, selectedBranch?.id, toast]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
                <span className="ml-2">Loading refund receipt...</span>
            </div>
        );
    }

    if (!refundData || !student) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <p className="text-lg text-muted-foreground">Refund record not found</p>
                <Button onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" />Go Back</Button>
            </div>
        );
    }

    const schoolInfo = school?.schools || {};
    const currencySymbol = '₹';

    return (
        <div>
            {/* Print Controls - Hidden in print */}
            <div className="print:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-10">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />Back
                </Button>
                <div className="flex gap-2">
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />Print Receipt
                    </Button>
                </div>
            </div>

            {/* Receipt Content */}
            <div className="max-w-[210mm] mx-auto p-8 print:p-4 bg-white">
                <div className="border-2 border-gray-800 p-6">
                    {/* Header */}
                    <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
                        {schoolInfo.logo_url && (
                            <img src={schoolInfo.logo_url} alt="Logo" className="h-16 mx-auto mb-2" />
                        )}
                        <h1 className="text-xl font-bold uppercase">{schoolInfo.name || school?.name || 'School Name'}</h1>
                        {schoolInfo.address && <p className="text-sm text-gray-600">{schoolInfo.address}</p>}
                        <div className="flex justify-center gap-4 text-xs text-gray-500 mt-1">
                            {schoolInfo.phone && <span>📞 {schoolInfo.phone}</span>}
                            {schoolInfo.email && <span>✉ {schoolInfo.email}</span>}
                        </div>
                        <div className="mt-2 bg-orange-100 inline-block px-4 py-1 rounded">
                            <h2 className="text-lg font-bold text-orange-700">FEE REFUND RECEIPT</h2>
                        </div>
                    </div>

                    {/* Receipt Info */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                            <p><span className="text-gray-500">Receipt No:</span> <strong>{refundData.transaction_id || '-'}</strong></p>
                            <p><span className="text-gray-500">Date:</span> <strong>{format(parseISO(refundData.refund_date || refundData.created_at), 'dd MMM yyyy')}</strong></p>
                        </div>
                        <div className="text-right">
                            <p><span className="text-gray-500">Status:</span> <strong className="text-green-600 uppercase">{refundData.status}</strong></p>
                            {refundData.reference_number && (
                                <p><span className="text-gray-500">Ref No:</span> <strong>{refundData.reference_number}</strong></p>
                            )}
                        </div>
                    </div>

                    {/* Student Info */}
                    <div className="bg-gray-50 p-3 rounded mb-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <p><span className="text-gray-500">Student Name:</span> <strong>{student.full_name}</strong></p>
                            <p><span className="text-gray-500">Admission No:</span> <strong>{student.school_code || '-'}</strong></p>
                            <p><span className="text-gray-500">Class:</span> <strong>{student.classes?.name || '-'} ({student.sections?.name || '-'})</strong></p>
                            <p><span className="text-gray-500">Father's Name:</span> <strong>{student.father_name || '-'}</strong></p>
                        </div>
                    </div>

                    {/* Refund Details Table */}
                    <table className="w-full text-sm border-collapse mb-4">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 p-2 text-left">Description</th>
                                <th className="border border-gray-300 p-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 p-2">
                                    <p className="font-medium capitalize">{refundData.refund_type} Fee Refund</p>
                                    <p className="text-xs text-gray-500">Reason: {refundData.refund_reason}</p>
                                    {refundData.note && <p className="text-xs text-gray-400">Note: {refundData.note}</p>}
                                </td>
                                <td className="border border-gray-300 p-2 text-right font-mono">
                                    {currencySymbol}{Number(refundData.refund_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                            <tr className="bg-gray-50">
                                <td className="border border-gray-300 p-2 text-xs text-gray-500">
                                    Original Amount Paid
                                </td>
                                <td className="border border-gray-300 p-2 text-right font-mono text-xs text-gray-500">
                                    {currencySymbol}{Number(refundData.original_total_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr className="bg-orange-50 font-bold">
                                <td className="border border-gray-300 p-2">Total Refund Amount</td>
                                <td className="border border-gray-300 p-2 text-right font-mono text-lg text-orange-700">
                                    {currencySymbol}{Number(refundData.refund_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* Payment Mode */}
                    <div className="text-sm mb-6">
                        <p><span className="text-gray-500">Refund Mode:</span> <strong>{refundData.refund_mode}</strong></p>
                        {refundData.approved_at && (
                            <p><span className="text-gray-500">Approved on:</span> <strong>{format(parseISO(refundData.approved_at), 'dd MMM yyyy')}</strong></p>
                        )}
                        {refundData.completed_at && (
                            <p><span className="text-gray-500">Completed on:</span> <strong>{format(parseISO(refundData.completed_at), 'dd MMM yyyy')}</strong></p>
                        )}
                    </div>

                    {/* Amount in Words (approximation) */}
                    <div className="border-t border-gray-300 pt-3 mb-6">
                        <p className="text-sm italic text-gray-600">
                            Amount: {currencySymbol}{Number(refundData.refund_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} 
                            <span className="ml-2">({refundData.refund_mode})</span>
                        </p>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-3 gap-4 mt-12 text-center text-sm">
                        <div>
                            <div className="border-t border-gray-400 pt-2 mt-8">
                                <p className="font-medium">Receiver's Signature</p>
                            </div>
                        </div>
                        <div>
                            <div className="border-t border-gray-400 pt-2 mt-8">
                                <p className="font-medium">Accountant</p>
                            </div>
                        </div>
                        <div>
                            <div className="border-t border-gray-400 pt-2 mt-8">
                                <p className="font-medium">Principal / Authority</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-400 mt-6 border-t pt-2">
                        <p>This is a computer-generated receipt. Printed on {format(currentDateTime, 'dd MMM yyyy, hh:mm a')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintRefundReceipt;
