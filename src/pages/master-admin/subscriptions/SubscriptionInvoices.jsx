import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Search, Download, Eye, IndianRupee } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import DatePicker from '@/components/ui/DatePicker';
import { Textarea } from '@/components/ui/textarea';

const RazorpayButton = ({ invoice, onPaymentSuccess }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        try {
            // 1. Create Razorpay Order via Backend
            const orderResponse = await fetch('/api/billing/payment/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({ invoiceId: invoice.id })
            });

            if (!orderResponse.ok) {
                const errorData = await orderResponse.json();
                throw new Error(errorData.message || 'Failed to create payment order');
            }

            const orderData = await orderResponse.json();

            // 2. Initialize Razorpay Checkout
            const options = {
                key: orderData.key_id,
                amount: orderData.amount, // Already in paise from backend
                currency: orderData.currency,
                order_id: orderData.id,
                name: 'Jashchar ERP',
                description: `Payment for Invoice #${invoice.invoice_number}`,
                image: 'https://jashchar.com/assets/img/logo.png',
                handler: async function (response) {
                    // 3. Verify Payment Signature via Backend
                    try {
                        const verifyResponse = await fetch('/api/billing/payment/verify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                            },
                            body: JSON.stringify({
                                invoiceId: invoice.id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        if (!verifyResponse.ok) {
                            const errorData = await verifyResponse.json();
                            throw new Error(errorData.message || 'Payment verification failed');
                        }

                        const verifyData = await verifyResponse.json();
                        
                        toast({ 
                            title: 'Payment Successful!', 
                            description: `Transaction ID: ${response.razorpay_payment_id}` 
                        });

                        // Refresh invoice list
                        if (onPaymentSuccess) {
                            onPaymentSuccess();
                        } else {
                            window.location.reload();
                        }

                    } catch (verifyError) {
                        console.error('Payment Verification Error:', verifyError);
                        toast({ 
                            variant: 'destructive', 
                            title: 'Payment Verification Failed', 
                            description: verifyError.message || 'Please contact support with payment ID: ' + response.razorpay_payment_id
                        });
                    }
                },
                prefill: {
                    name: invoice.school?.name || 'School Admin',
                    email: invoice.school?.contact_email || '',
                },
                notes: {
                    invoice_id: invoice.invoice_number,
                    branch_id: invoice.branch_id,
                },
                theme: {
                    color: '#3B82F6',
                },
                modal: {
                    ondismiss: function() {
                        setLoading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast({ 
                    variant: 'destructive', 
                    title: 'Payment Failed', 
                    description: response.error.description || 'Payment could not be completed'
                });
                setLoading(false);
            });
            
            rzp.open();
            // Note: setLoading(false) will be called in modal.ondismiss or payment.failed

        } catch (error) {
            console.error("Payment Error:", error);
            toast({ 
                variant: 'destructive', 
                title: 'Payment Error', 
                description: error.message || "Failed to initiate payment." 
            });
            setLoading(false);
        }
    };

    return <Button onClick={handlePayment} disabled={loading || invoice.payment_status === 'paid'}>
        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <IndianRupee className="mr-2 h-4 w-4" />} 
        Pay Now
    </Button>;
}

const ManualPaymentDialog = ({ invoice, onPaymentSuccess }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [paymentData, setPaymentData] = useState({
        mode: 'Cash',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        transaction_id: ''
    });

    const handleValueChange = (key, value) => {
        setPaymentData(prev => ({ ...prev, [key]: value }));
    };

    const handleSavePayment = async () => {
        setLoading(true);
        // 1. Update invoice status
        const { error: invoiceError } = await supabase
            .from('subscription_invoices')
            .update({
                payment_status: 'paid',
                paid_date: paymentData.date,
            })
            .eq('id', invoice.id);
        
        if (invoiceError) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update invoice.' });
            setLoading(false);
            return;
        }

        // 2. Log to billing audit
        await supabase.from('billing_audit').insert({
            subscription_id: invoice.subscription_id,
            amount_calculated: invoice.total_amount,
            notes: `Manual payment recorded by admin. Mode: ${paymentData.mode}. Notes: ${paymentData.notes}. Txn ID: ${paymentData.transaction_id}`
        });

        // 3. (Optional) Create a transaction record
        // Removed 'created_by' as it does not exist in the transactions table schema
        const { error: txnError } = await supabase.from('transactions').insert({
            branch_id: invoice.branch_id,
            subscription_plan_id: invoice.subscription.plan_id,
            amount: invoice.total_amount,
            payment_method: paymentData.mode,
            transaction_id: paymentData.transaction_id,
            status: 'Success'
        });

        if (txnError) {
             console.error("Transaction insert error:", txnError);
             // We log the error but don't block the success flow since the invoice is already updated
        }

        toast({ title: 'Success', description: 'Payment recorded successfully.' });
        onPaymentSuccess();
        setIsOpen(false);
        setLoading(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Manual Payment</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Record Manual Payment for Invoice #{invoice.invoice_number}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>Payment Mode</Label><Select value={paymentData.mode} onValueChange={v => handleValueChange('mode', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Cheque">Cheque</SelectItem><SelectItem value="Bank Transfer">Bank Transfer</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
                        <div><DatePicker label="Payment Date" value={paymentData.date} onChange={d => handleValueChange('date', d)} /></div>
                    </div>
                    <div><Label>Transaction ID / Ref #</Label><Input value={paymentData.transaction_id} onChange={e => handleValueChange('transaction_id', e.target.value)} /></div>
                    <div><Label>Notes</Label><Textarea value={paymentData.notes} onChange={e => handleValueChange('notes', e.target.value)} /></div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={handleSavePayment} disabled={loading}>{loading && <Loader2 className="animate-spin mr-2" />} Save Payment</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const SubscriptionInvoices = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchInvoices = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('subscription_invoices')
            .select(`*, school:schools (name, logo_url, contact_email), subscription:school_subscriptions(plan_id)`)
            .order('created_at', { ascending: false });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to fetch invoices', description: error.message });
        } else {
            setInvoices(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        fetchInvoices();
        
        return () => {
            document.body.removeChild(script);
        };
    }, []);
    
    const getStatusBadge = (status) => {
        switch(status?.toLowerCase()) {
            case 'paid': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'overdue': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredInvoices = invoices.filter(inv => 
        (inv.school?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (inv.invoice_number?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Subscription Invoices</h1>
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by school or invoice number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
            </div>
             <div className="bg-card p-6 rounded-xl shadow-lg border">
                <h2 className="text-xl font-semibold mb-4">All Invoices</h2>
                 {loading ? (
                    <div className="text-center py-10"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-muted/50"><tr className="border-b">
                                <th className="px-6 py-3">Invoice #</th>
                                <th className="px-6 py-3">School</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Due Date</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-center">Actions</th>
                            </tr></thead>
                            <tbody>
                            {filteredInvoices.map((invoice) => (
                                <tr key={invoice.id} className="border-b hover:bg-muted/50">
                                    <td className="px-6 py-4 font-mono text-primary">{invoice.invoice_number}</td>
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <img src={invoice.school?.logo_url || `https://ui-avatars.com/api/?name=${(invoice.school?.name || 'S').charAt(0)}&background=random&color=fff`} alt="" className="w-8 h-8 rounded-full" />
                                        {invoice.school?.name || 'Unknown School'}
                                    </td>
                                    <td className="px-6 py-4 font-semibold">₹{(invoice.total_amount || invoice.amount || 0).toFixed(2)}</td>
                                    <td className="px-6 py-4">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-6 py-4"><Badge className={getStatusBadge(invoice.payment_status)}>{invoice.payment_status || 'Pending'}</Badge></td>
                                    <td className="px-6 py-4 text-center space-x-2">
                                        {(invoice.payment_status !== 'paid' && invoice.status !== 'paid') && <RazorpayButton invoice={invoice} onPaymentSuccess={fetchInvoices} />}
                                        <Button variant="ghost" size="icon" onClick={() => toast({ title: 'Coming Soon!' })} title="View Invoice"><Eye className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" title="Download PDF" onClick={() => toast({ title: 'Coming Soon!' })}><Download className="h-4 w-4" /></Button>
                                        {invoice.payment_status !== 'paid' && <ManualPaymentDialog invoice={invoice} onPaymentSuccess={fetchInvoices} />}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {filteredInvoices.length === 0 && <p className="text-center py-10 text-muted-foreground">No invoices found.</p>}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default SubscriptionInvoices;
