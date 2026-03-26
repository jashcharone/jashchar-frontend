import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle, Play } from 'lucide-react';
import { format } from 'date-fns';

const BulkInvoiceGenerator = () => {
    const { toast } = useToast();
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState([]);

    useEffect(() => {
        fetchSchools();
    }, []);

    const fetchSchools = async () => {
        setLoading(true);
        try {
            // Fetch active schools with their subscriptions
            const { data, error } = await supabase
                .from('schools')
                .select(`
                    id, name, enrollment_id_number,
                    subscription:school_subscriptions (
                        id, plan_id, billing_type, status,
                        plan:subscription_plans (
                            name, price, per_student_charge, per_staff_charge, gst_percentage
                        )
                    )
                `)
                .eq('status', 'Active')
                .order('name');

            if (error) throw error;

            // Filter schools that have an active subscription
            const validSchools = data.filter(s => 
                s.subscription && 
                (Array.isArray(s.subscription) ? s.subscription.length > 0 : s.subscription)
            ).map(s => ({
                ...s,
                subscription: Array.isArray(s.subscription) ? s.subscription[0] : s.subscription
            }));

            setSchools(validSchools);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const generateInvoiceForSchool = async (school) => {
        try {
            const sub = school.subscription;
            const plan = sub.plan;

            // 1. Get Usage
            const { data: usageData } = await supabase.rpc('get_school_usage', { p_branch_id: school.id });
            const activeStudents = usageData?.active_students || 0;
            const activeStaff = usageData?.active_staff || 0;

            // 2. Calculate Bill
            let baseAmount = 0;
            if (sub.billing_type === 'Prepaid') {
                baseAmount = plan.price || 0;
            } else {
                // Usage Based
                baseAmount = (activeStudents * (plan.per_student_charge || 0)) + 
                             (activeStaff * (plan.per_staff_charge || 0));
            }

            const gstAmount = (baseAmount * (plan.gst_percentage || 0)) / 100;
            const totalAmount = baseAmount + gstAmount;

            if (totalAmount <= 0) return { status: 'skipped', message: 'Zero amount' };

            // 3. Create Invoice
            const { error } = await supabase.from('subscription_invoices').insert({
                branch_id: school.id,
                subscription_id: sub.id,
                invoice_number: `INV-${school.enrollment_id_number}-${Date.now()}`,
                generated_date: new Date().toISOString(),
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days due
                billing_period_start: new Date().toISOString(), // Simplified
                billing_period_end: new Date().toISOString(),
                amount: baseAmount,
                gst_amount: gstAmount,
                total_amount: totalAmount,
                payment_status: 'pending',
                student_count: activeStudents,
                staff_count: activeStaff
            });

            if (error) throw error;
            return { status: 'success', amount: totalAmount };

        } catch (error) {
            return { status: 'error', message: error.message };
        }
    };

    const handleBulkGenerate = async () => {
        setProcessing(true);
        setResults([]);
        const newResults = [];

        for (const school of schools) {
            const result = await generateInvoiceForSchool(school);
            newResults.push({ schoolName: school.name, ...result });
            setResults([...newResults]); // Update UI progressively
        }

        setProcessing(false);
        toast({ title: 'Batch Complete', description: 'Invoices generated successfully.' });
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Bulk Invoice Generator</h1>
                <Button onClick={handleBulkGenerate} disabled={processing || schools.length === 0}>
                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    Generate All Invoices
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Eligible Schools ({schools.length})</CardTitle></CardHeader>
                    <CardContent className="max-h-[400px] overflow-y-auto">
                        {loading ? <Loader2 className="animate-spin" /> : (
                            <ul className="space-y-2">
                                {schools.map(s => (
                                    <li key={s.id} className="p-2 border rounded flex justify-between">
                                        <span>{s.name}</span>
                                        <span className="text-sm text-muted-foreground">{s.subscription?.plan?.name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Generation Results</CardTitle></CardHeader>
                    <CardContent className="max-h-[400px] overflow-y-auto">
                        <ul className="space-y-2">
                            {results.map((r, idx) => (
                                <li key={idx} className="p-2 border rounded flex justify-between items-center">
                                    <span>{r.schoolName}</span>
                                    {r.status === 'success' && <span className="text-green-600 flex items-center"><CheckCircle className="w-4 h-4 mr-1"/> Generated</span>}
                                    {r.status === 'error' && <span className="text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/> Failed</span>}
                                    {r.status === 'skipped' && <span className="text-gray-500">Skipped</span>}
                                </li>
                            ))}
                            {results.length === 0 && <p className="text-muted-foreground text-center py-4">Click Generate to start.</p>}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default BulkInvoiceGenerator;
