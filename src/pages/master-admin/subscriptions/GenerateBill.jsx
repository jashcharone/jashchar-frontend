import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, IndianRupee, Percent, FileText, RefreshCw, AlertCircle, Check, ChevronsUpDown, Search } from 'lucide-react';
import DatePicker from '@/components/ui/DatePicker';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const isValidUUID = (uuid) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
};

const GenerateBill = () => {
    const { branchId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    // States for main functionality
    const [school, setSchool] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [plan, setPlan] = useState(null);
    const [usage, setUsage] = useState({ active_students: 0, active_staff: 0 });
    const [billDetails, setBillDetails] = useState({
        student_count: 0,
        staff_count: 0,
        student_rate: 0,
        staff_rate: 0,
        base_amount: 0,
        gst_percentage: 0,
        gst_amount: 0,
        total_amount: 0,
        due_date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // States for School Selection (when ID is 'new')
    const [schoolsList, setSchoolsList] = useState([]);
    const [openCombobox, setOpenCombobox] = useState(false);
    const [isSelectingSchool, setIsSelectingSchool] = useState(false);

    const fetchSchoolsList = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('schools')
            .select('id, name, enrollment_id_number')
            .eq('status', 'Active')
            .order('name');
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load schools list.' });
        } else {
            setSchoolsList(data || []);
        }
        setLoading(false);
    }, [toast]);

    const fetchInitialData = useCallback(async () => {
        // If no ID or invalid ID (like 'new'), switch to selection mode
        if (!branchId || !isValidUUID(branchId)) {
            setIsSelectingSchool(true);
            await fetchSchoolsList();
            return;
        }
        
        setIsSelectingSchool(false);
        setLoading(true);
        setError(null);

        try {
            // 1. Fetch School Details with Subscription
            const { data: schoolData, error: schoolError } = await supabase
                .from('schools')
                .select(`
                    name,
                    subscription:school_subscriptions (
                        id,
                        plan_id,
                        billing_type,
                        plan:subscription_plans (
                            name,
                            plan_type,
                            price,
                            per_student_charge,
                            per_staff_charge,
                            gst_percentage
                        )
                    )
                `)
                .eq('id', branchId)
                .maybeSingle();

            if (schoolError) {
                throw new Error(`Failed to fetch school data: ${schoolError.message}`);
            }

            if (!schoolData) {
                throw new Error("School not found.");
            }

            // Handle One-to-Many relationship
            const subscriptions = schoolData.subscription || [];
            const schoolSub = Array.isArray(subscriptions) ? subscriptions[0] : subscriptions;

            if (!schoolSub) {
                throw new Error("No active subscription found for this school.");
            }

            if (!schoolSub.plan) {
                throw new Error("Subscription plan details are missing.");
            }

            setSchool(schoolData);
            setSubscription(schoolSub);
            setPlan(schoolSub.plan);

            // 2. Fetch Usage Stats via RPC
            let currentStudentCount = 0;
            let currentStaffCount = 0;

            try {
                const { data: usageData, error: usageError } = await supabase.rpc('get_school_usage', { p_branch_id: branchId });

                if (usageError) {
                    console.warn("Usage RPC Error:", usageError);
                    toast({ variant: "warning", title: "Usage Data Warning", description: "Could not fetch live usage stats. Defaulting to 0." });
                } else {
                    currentStudentCount = usageData && usageData[0] ? usageData[0].active_students : 0;
                    currentStaffCount = usageData && usageData[0] ? usageData[0].active_staff : 0;
                }
            } catch (rpcErr) {
                console.warn("RPC Call Failed:", rpcErr);
            }

            setUsage({ active_students: currentStudentCount, active_staff: currentStaffCount });

            // 3. Calculate Initial Bill
            const studentRate = schoolSub.plan.per_student_charge || 0;
            const staffRate = schoolSub.plan.per_staff_charge || 0;
            const planPrice = schoolSub.plan.price || 0;
            const gstPercentage = schoolSub.plan.gst_percentage || 18;

            let baseAmount = 0;
            if (schoolSub.plan.plan_type === 'Postpaid') {
                baseAmount = (currentStudentCount * studentRate) + (currentStaffCount * staffRate);
            } else {
                baseAmount = planPrice;
            }

            const gstAmount = (baseAmount * gstPercentage) / 100;
            const totalAmount = baseAmount + gstAmount;

            setBillDetails(prev => ({
                ...prev,
                student_count: currentStudentCount,
                staff_count: currentStaffCount,
                student_rate: studentRate,
                staff_rate: staffRate,
                base_amount: parseFloat(baseAmount.toFixed(2)),
                gst_percentage: gstPercentage,
                gst_amount: parseFloat(gstAmount.toFixed(2)),
                total_amount: parseFloat(totalAmount.toFixed(2)),
            }));

        } catch (err) {
            console.error("Fetch Initial Data Error:", err);
            let msg = err.message;
            if (msg === "Failed to fetch") {
                msg = "Network error. Please check your internet connection or firewall.";
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [branchId, toast, fetchSchoolsList]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleSchoolSelect = (currentValue) => {
        setOpenCombobox(false);
        navigate(`/master-admin/subscriptions/bill/${currentValue}`);
    };

    const handleDetailChange = (key, value) => {
        setBillDetails(prev => {
            const newDetails = { ...prev, [key]: value };
            
            if (['student_count', 'staff_count', 'student_rate', 'staff_rate', 'base_amount', 'gst_percentage'].includes(key)) {
                 newDetails[key] = parseFloat(value) || 0;
            }

            let baseAmount = 0;
            if (plan && plan.plan_type === 'Postpaid') {
                baseAmount = (newDetails.student_count * newDetails.student_rate) + (newDetails.staff_count * newDetails.staff_rate);
            } else {
                if (key === 'base_amount') {
                    baseAmount = parseFloat(value) || 0;
                } else {
                    baseAmount = prev.base_amount;
                }
            }
            
            const gstAmount = (baseAmount * newDetails.gst_percentage) / 100;
            const totalAmount = baseAmount + gstAmount;
            
            return {
                ...newDetails,
                base_amount: parseFloat(baseAmount.toFixed(2)),
                gst_amount: parseFloat(gstAmount.toFixed(2)),
                total_amount: parseFloat(totalAmount.toFixed(2)),
            };
        });
    };

    const handleGenerateInvoice = async () => {
        if (!billDetails.due_date) {
             toast({ variant: 'destructive', title: 'Validation Error', description: 'Due date is required.' });
             return;
        }

        setIsGenerating(true);
        try {
            const invoiceNumber = `INV-${format(new Date(), 'yyyyMMdd')}-${Math.floor(1000 + Math.random() * 9000)}`;
            
            const { data: invoiceData, error: invoiceError } = await supabase
                .from('subscription_invoices')
                .insert({
                    branch_id: branchId,
                    subscription_id: subscription.id,
                    invoice_number: invoiceNumber,
                    amount: billDetails.base_amount,
                    gst_amount: billDetails.gst_amount,
                    discount_applied: 0,
                    total_amount: billDetails.total_amount,
                    payment_status: 'pending',
                    generated_date: new Date().toISOString(),
                    due_date: billDetails.due_date,
                })
                .select()
                .single();

            if (invoiceError) throw invoiceError;

            const { error: auditError } = await supabase.from('billing_audit').insert({
                subscription_id: subscription.id,
                run_date: new Date().toISOString(),
                student_count: billDetails.student_count,
                staff_count: billDetails.staff_count,
                amount_calculated: billDetails.total_amount,
                notes: billDetails.description || `Manual Invoice ${invoiceNumber} generated. Plan: ${plan?.name}`
            });

            if (auditError) console.warn("Audit log failed:", auditError);
            
            toast({ title: "Success!", description: `Invoice #${invoiceNumber} generated successfully.` });
            navigate('/master-admin/subscription-invoices');

        } catch (error) {
            console.error("Generation Error:", error);
            toast({ variant: 'destructive', title: 'Invoice Generation Failed', description: error.message });
        } finally {
            setIsGenerating(false);
        }
    };

    // Loading State
    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col justify-center items-center h-[60vh]">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">
                        {isSelectingSchool ? 'Loading schools...' : 'Loading subscription details...'}
                    </p>
                </div>
            </DashboardLayout>
        );
    }

    // School Selection Mode
    if (isSelectingSchool) {
        return (
            <DashboardLayout>
                <div className="flex flex-col justify-center items-center h-[60vh] space-y-6 p-4">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold">Generate New Bill</h1>
                        <p className="text-muted-foreground">Select a school to generate an invoice for their subscription.</p>
                    </div>
                    
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Select School</CardTitle>
                            <CardDescription>Search active schools by name</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openCombobox}
                                        className="w-full justify-between"
                                    >
                                        Select a school...
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search school..." />
                                        <CommandEmpty>No school found.</CommandEmpty>
                                        <CommandGroup>
                                            {schoolsList.map((s) => (
                                                <CommandItem
                                                    key={s.id}
                                                    value={s.name}
                                                    onSelect={() => handleSchoolSelect(s.id)}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            branchId === s.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span>{s.name}</span>
                                                        <span className="text-xs text-muted-foreground">Code: {s.enrollment_id_number}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </CardContent>
                    </Card>
                    
                    <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
                </div>
            </DashboardLayout>
        );
    }

    // Error State
    if (error) {
        return (
            <DashboardLayout>
                <div className="p-6 max-w-2xl mx-auto flex flex-col items-center justify-center h-[60vh]">
                    <Alert variant="destructive" className="mb-6 w-full">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error Loading Bill Data</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <div className="flex gap-4">
                        <Button onClick={fetchInitialData} className="min-w-[120px]">
                            <RefreshCw className="mr-2 h-4 w-4" /> Retry
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/master-admin/subscriptions/bill/new')}>Select Different School</Button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Main Form
    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Generate Bill</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/master-admin/subscriptions/bill/new')}>Change School</Button>
                    <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
                </div>
            </div>
            <Card className="max-w-5xl mx-auto">
                <CardHeader>
                    <CardTitle>Bill for {school?.name}</CardTitle>
                    <CardDescription>
                        Subscription Plan: <span className="font-semibold text-primary">{plan?.name}</span> ({plan?.plan_type})
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Student Count */}
                        <div className="space-y-2">
                            <Label>Active Students</Label>
                            <Input 
                                type="number" 
                                value={billDetails.student_count} 
                                onChange={(e) => handleDetailChange('student_count', e.target.value)} 
                            />
                            <p className="text-xs text-muted-foreground">Live count from database</p>
                        </div>
                        
                        {/* Postpaid Logic */}
                        {plan?.plan_type === 'Postpaid' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Rate per Student</Label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9" type="number" value={billDetails.student_rate} onChange={(e) => handleDetailChange('student_rate', e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Student Total</Label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9 bg-muted" type="number" value={(billDetails.student_count * billDetails.student_rate).toFixed(2)} readOnly disabled />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Active Staff</Label>
                                    <Input type="number" value={billDetails.staff_count} onChange={(e) => handleDetailChange('staff_count', e.target.value)} />
                                    <p className="text-xs text-muted-foreground">Live count from database</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Rate per Staff</Label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9" type="number" value={billDetails.staff_rate} onChange={(e) => handleDetailChange('staff_rate', e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Staff Total</Label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9 bg-muted" type="number" value={(billDetails.staff_count * billDetails.staff_rate).toFixed(2)} readOnly disabled />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Due Date */}
                        <div className="space-y-2">
                            <Label>Due Date</Label>
                            <DatePicker 
                                value={billDetails.due_date ? new Date(billDetails.due_date) : new Date()} 
                                onChange={(date) => handleDetailChange('due_date', date ? format(date, 'yyyy-MM-dd') : '')} 
                            />
                        </div>
                        
                        {/* Description */}
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2">
                            <Label>Description / Notes</Label>
                            <Textarea 
                                placeholder="Enter any notes for this bill (visible in audit logs)..." 
                                value={billDetails.description} 
                                onChange={(e) => handleDetailChange('description', e.target.value)}
                                className="min-h-[80px]"
                            />
                        </div>
                    </div>

                    {/* Calculation Summary */}
                    <div className="border rounded-lg p-6 bg-slate-50 dark:bg-slate-900">
                        <h3 className="font-semibold mb-4 text-lg">Payment Summary</h3>
                        <div className="space-y-3 max-w-md ml-auto">
                            <div className="flex justify-between items-center">
                                <Label className="text-base font-normal">Base Amount</Label>
                                <div className="relative w-40">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        className="pl-9 h-10" 
                                        type="number" 
                                        value={billDetails.base_amount} 
                                        onChange={(e) => handleDetailChange('base_amount', e.target.value)} 
                                        disabled={plan?.plan_type === 'Postpaid'} 
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <Label className="text-base font-normal">GST (%)</Label>
                                <div className="flex items-center gap-2 justify-end w-40">
                                    <div className="relative w-full">
                                        <Input 
                                            className="pr-8 h-10 text-right" 
                                            type="number" 
                                            value={billDetails.gst_percentage} 
                                            onChange={(e) => handleDetailChange('gst_percentage', e.target.value)} 
                                        />
                                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <Label className="text-base font-normal">GST Amount</Label>
                                <span className="font-medium">?{billDetails.gst_amount.toFixed(2)}</span>
                            </div>
                            
                            <div className="flex justify-between items-center text-xl font-bold pt-4 border-t border-slate-200 dark:border-slate-700">
                                <Label className="text-xl font-bold">Total Payable</Label>
                                <span className="text-green-600">?{billDetails.total_amount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-4">
                        <Button variant="outline" onClick={() => navigate(-1)} type="button">Cancel</Button>
                        <Button onClick={handleGenerateInvoice} disabled={isGenerating} size="lg" className="bg-green-600 hover:bg-green-700 min-w-[180px]">
                            {isGenerating ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <FileText className="mr-2 h-5 w-5" />}
                            {isGenerating ? 'Generating...' : 'Generate Invoice'}
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default GenerateBill;
