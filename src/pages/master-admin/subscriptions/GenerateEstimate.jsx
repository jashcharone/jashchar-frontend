import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, FileText, Download, Send, Save, IndianRupee, Building2, User, Phone, Mail, MapPin, Receipt, Check, ChevronsUpDown } from 'lucide-react';
import DatePicker from '@/components/ui/DatePicker';
import { format, addDays } from 'date-fns';
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

// ========== PDF Generation Helper ==========
const generateEstimatePDF = async (estimate, lineItems, settings) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Estimate - ${estimate.estimate_number}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                padding: 40px;
                max-width: 800px;
                margin: 0 auto;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 3px solid #2563eb;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .company-info h1 {
                color: #2563eb;
                font-size: 28px;
                margin-bottom: 5px;
            }
            .company-info p {
                color: #666;
                font-size: 12px;
            }
            .estimate-meta {
                text-align: right;
            }
            .estimate-meta h2 {
                font-size: 32px;
                color: #2563eb;
                margin-bottom: 10px;
            }
            .estimate-meta .detail {
                font-size: 13px;
                color: #555;
            }
            .estimate-meta .number {
                font-weight: bold;
                color: #333;
            }
            .client-section {
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
            }
            .client-section h3 {
                color: #2563eb;
                font-size: 14px;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .client-section p {
                font-size: 14px;
                margin-bottom: 5px;
            }
            .client-name {
                font-size: 18px;
                font-weight: bold;
                color: #333;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            th {
                background: #2563eb;
                color: white;
                padding: 12px 15px;
                text-align: left;
                font-size: 13px;
                text-transform: uppercase;
            }
            th:last-child, td:last-child {
                text-align: right;
            }
            td {
                padding: 12px 15px;
                border-bottom: 1px solid #e5e7eb;
                font-size: 14px;
            }
            tr:nth-child(even) {
                background: #f9fafb;
            }
            .totals {
                width: 350px;
                margin-left: auto;
            }
            .totals table {
                margin-bottom: 0;
            }
            .totals td {
                padding: 8px 15px;
                border: none;
            }
            .totals tr:last-child {
                background: #2563eb;
                color: white;
                font-size: 16px;
                font-weight: bold;
            }
            .totals tr:last-child td {
                padding: 12px 15px;
            }
            .discount-row {
                color: #16a34a;
            }
            .terms {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
            }
            .terms h4 {
                font-size: 14px;
                color: #2563eb;
                margin-bottom: 10px;
            }
            .terms p {
                font-size: 12px;
                color: #666;
                white-space: pre-line;
            }
            .footer {
                margin-top: 40px;
                text-align: center;
                color: #999;
                font-size: 11px;
            }
            .validity {
                background: #fef3c7;
                color: #92400e;
                padding: 10px 15px;
                border-radius: 5px;
                font-size: 13px;
                margin-bottom: 20px;
                text-align: center;
            }
            @media print {
                body { padding: 20px; }
                .no-print { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-info">
                <h1>${settings?.company_name || 'Jashchar ERP'}</h1>
                <p>${settings?.company_tagline || 'School & College ERP Solutions'}</p>
                ${settings?.company_address ? `<p>${settings.company_address}</p>` : ''}
                ${settings?.company_phone ? `<p>Phone: ${settings.company_phone}</p>` : ''}
                ${settings?.company_email ? `<p>Email: ${settings.company_email}</p>` : ''}
                ${settings?.company_gstin ? `<p>GSTIN: ${settings.company_gstin}</p>` : ''}
            </div>
            <div class="estimate-meta">
                <h2>ESTIMATE</h2>
                <p class="detail">Estimate No: <span class="number">${estimate.estimate_number}</span></p>
                <p class="detail">Date: <span class="number">${format(new Date(estimate.estimate_date), 'dd MMM yyyy')}</span></p>
                <p class="detail">Valid Until: <span class="number">${format(new Date(estimate.valid_until), 'dd MMM yyyy')}</span></p>
            </div>
        </div>
        
        <div class="validity">
            ⏰ This estimate is valid until ${format(new Date(estimate.valid_until), 'dd MMMM yyyy')}
        </div>
        
        <div class="client-section">
            <h3>Estimate For</h3>
            <p class="client-name">${estimate.client_name}</p>
            ${estimate.client_address ? `<p>${estimate.client_address}</p>` : ''}
            ${estimate.client_phone ? `<p>Phone: ${estimate.client_phone}</p>` : ''}
            ${estimate.client_email ? `<p>Email: ${estimate.client_email}</p>` : ''}
            ${estimate.client_gstin ? `<p>GSTIN: ${estimate.client_gstin}</p>` : ''}
        </div>
        
        <table>
            <thead>
                <tr>
                    <th style="width: 40px;">#</th>
                    <th>Description</th>
                    <th style="width: 80px;">Qty</th>
                    <th style="width: 80px;">Unit</th>
                    <th style="width: 120px;">Rate</th>
                    <th style="width: 120px;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${lineItems.map((item, index) => `
                    <tr class="${item.is_discount ? 'discount-row' : ''}">
                        <td>${index + 1}</td>
                        <td>${item.description}</td>
                        <td>${item.quantity}</td>
                        <td>${item.unit}</td>
                        <td>${formatCurrency(item.unit_price)}</td>
                        <td>${item.is_discount ? '- ' : ''}${formatCurrency(Math.abs(item.amount))}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="totals">
            <table>
                <tr>
                    <td>Subtotal</td>
                    <td>${formatCurrency(estimate.subtotal)}</td>
                </tr>
                ${estimate.discount_amount > 0 ? `
                <tr class="discount-row">
                    <td>Discount</td>
                    <td>- ${formatCurrency(estimate.discount_amount)}</td>
                </tr>
                ` : ''}
                <tr>
                    <td>GST (${estimate.gst_percentage}%)</td>
                    <td>${formatCurrency(estimate.gst_amount)}</td>
                </tr>
                <tr>
                    <td>Total Amount</td>
                    <td>${formatCurrency(estimate.total_amount)}</td>
                </tr>
            </table>
        </div>
        
        ${estimate.terms_and_conditions ? `
        <div class="terms">
            <h4>Terms & Conditions</h4>
            <p>${estimate.terms_and_conditions}</p>
        </div>
        ` : ''}
        
        <div class="footer">
            <p>Thank you for your interest in ${settings?.company_name || 'Jashchar ERP'}!</p>
            <p>${settings?.company_website || 'www.jashcharerp.com'}</p>
        </div>
        
        <script>
            window.onload = function() { window.print(); }
        </script>
    </body>
    </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
};

// ========== Main Component ==========
const GenerateEstimate = () => {
    const { estimateId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [schools, setSchools] = useState([]);
    const [plans, setPlans] = useState([]);
    const [settings, setSettings] = useState(null);
    const [openSchoolCombobox, setOpenSchoolCombobox] = useState(false);
    
    // Estimate State
    const [estimate, setEstimate] = useState({
        estimate_number: '',
        estimate_date: format(new Date(), 'yyyy-MM-dd'),
        valid_until: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        school_id: null,
        client_name: '',
        client_email: '',
        client_phone: '',
        client_address: '',
        client_gstin: '',
        gst_percentage: 18,
        subtotal: 0,
        discount_amount: 0,
        gst_amount: 0,
        total_amount: 0,
        billing_cycle: 'yearly',
        plan_id: null,
        terms_and_conditions: '',
        internal_notes: '',
        status: 'draft'
    });
    
    // Line Items
    const [lineItems, setLineItems] = useState([]);
    
    // ========== Data Fetching ==========
    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch schools, plans, and settings in parallel
            const [schoolsRes, plansRes, settingsRes] = await Promise.all([
                supabase.from('schools').select('id, name, contact_email, contact_number, address').eq('status', 'Active').order('name'),
                supabase.from('subscription_plans').select('*').order('name'),
                supabase.from('estimate_settings').select('*').limit(1).single()
            ]);
            
            if (schoolsRes.data) setSchools(schoolsRes.data);
            if (plansRes.data) setPlans(plansRes.data);
            if (settingsRes.data) {
                setSettings(settingsRes.data);
                setEstimate(prev => ({
                    ...prev,
                    terms_and_conditions: settingsRes.data.default_terms || prev.terms_and_conditions
                }));
            }
            
            // If editing existing estimate
            if (estimateId && estimateId !== 'new') {
                const { data: existingEstimate, error: estError } = await supabase
                    .from('subscription_estimates')
                    .select('*')
                    .eq('id', estimateId)
                    .single();
                
                if (estError) throw estError;
                
                setEstimate({
                    ...existingEstimate,
                    estimate_date: existingEstimate.estimate_date,
                    valid_until: existingEstimate.valid_until
                });
                
                // Fetch line items
                const { data: items } = await supabase
                    .from('estimate_line_items')
                    .select('*')
                    .eq('estimate_id', estimateId)
                    .order('item_order');
                
                if (items) setLineItems(items);
            }
            
        } catch (error) {
            console.error('Fetch Error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data.' });
        } finally {
            setLoading(false);
        }
    }, [estimateId, toast]);
    
    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);
    
    // ========== Handlers ==========
    const handleEstimateChange = (key, value) => {
        setEstimate(prev => ({ ...prev, [key]: value }));
    };
    
    const handleSchoolSelect = (schoolId) => {
        const school = schools.find(s => s.id === schoolId);
        if (school) {
            setEstimate(prev => ({
                ...prev,
                school_id: school.id,
                client_name: school.name,
                client_email: school.contact_email || '',
                client_phone: school.contact_number || '',
                client_address: school.address || ''
            }));
        }
        setOpenSchoolCombobox(false);
    };
    
    const handlePlanSelect = (planId) => {
        const plan = plans.find(p => p.id === planId);
        if (plan) {
            setEstimate(prev => ({ ...prev, plan_id: planId }));
            
            // Auto-add plan as line item
            const planItem = {
                id: `temp-${Date.now()}`,
                item_order: lineItems.length,
                item_type: 'service',
                description: `${plan.name} Plan - ${estimate.billing_cycle === 'yearly' ? 'Annual' : 'Monthly'} Subscription`,
                quantity: 1,
                unit: estimate.billing_cycle === 'yearly' ? 'year' : 'month',
                unit_price: estimate.billing_cycle === 'yearly' ? (plan.yearly_price || plan.price) : (plan.base_price || plan.price),
                amount: estimate.billing_cycle === 'yearly' ? (plan.yearly_price || plan.price) : (plan.base_price || plan.price),
                is_discount: false
            };
            
            setLineItems(prev => [...prev, planItem]);
            recalculateTotals([...lineItems, planItem]);
        }
    };
    
    // Line Items Management
    const addLineItem = (isDiscount = false) => {
        const newItem = {
            id: `temp-${Date.now()}`,
            item_order: lineItems.length,
            item_type: isDiscount ? 'discount' : 'custom',
            description: isDiscount ? 'Discount' : '',
            quantity: 1,
            unit: 'nos',
            unit_price: 0,
            amount: 0,
            is_discount: isDiscount
        };
        setLineItems(prev => [...prev, newItem]);
    };
    
    const updateLineItem = (index, key, value) => {
        setLineItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [key]: value };
            
            // Recalculate amount
            if (['quantity', 'unit_price'].includes(key)) {
                const qty = key === 'quantity' ? parseFloat(value) || 0 : parseFloat(updated[index].quantity) || 0;
                const price = key === 'unit_price' ? parseFloat(value) || 0 : parseFloat(updated[index].unit_price) || 0;
                updated[index].amount = qty * price;
            }
            
            recalculateTotals(updated);
            return updated;
        });
    };
    
    const removeLineItem = (index) => {
        setLineItems(prev => {
            const updated = prev.filter((_, i) => i !== index);
            recalculateTotals(updated);
            return updated;
        });
    };
    
    const recalculateTotals = (items) => {
        const subtotal = items.filter(i => !i.is_discount).reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
        const discount = items.filter(i => i.is_discount).reduce((sum, i) => sum + Math.abs(parseFloat(i.amount) || 0), 0);
        const gstAmount = ((subtotal - discount) * estimate.gst_percentage) / 100;
        const total = subtotal - discount + gstAmount;
        
        setEstimate(prev => ({
            ...prev,
            subtotal: parseFloat(subtotal.toFixed(2)),
            discount_amount: parseFloat(discount.toFixed(2)),
            gst_amount: parseFloat(gstAmount.toFixed(2)),
            total_amount: parseFloat(total.toFixed(2))
        }));
    };
    
    // Update totals when GST changes
    useEffect(() => {
        recalculateTotals(lineItems);
    }, [estimate.gst_percentage]);
    
    // ========== Save & Actions ==========
    const handleSave = async (newStatus = null) => {
        if (!estimate.client_name.trim()) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Client name is required.' });
            return;
        }
        
        if (lineItems.length === 0) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Add at least one line item.' });
            return;
        }
        
        setSaving(true);
        try {
            let estimateNumber = estimate.estimate_number;
            
            // Generate estimate number for new estimates
            if (!estimateNumber) {
                const { data: numData, error: numError } = await supabase.rpc('generate_estimate_number');
                if (numError) throw numError;
                estimateNumber = numData;
            }
            
            const estimateData = {
                estimate_number: estimateNumber,
                estimate_date: estimate.estimate_date,
                valid_until: estimate.valid_until,
                school_id: estimate.school_id,
                client_name: estimate.client_name,
                client_email: estimate.client_email,
                client_phone: estimate.client_phone,
                client_address: estimate.client_address,
                client_gstin: estimate.client_gstin,
                gst_percentage: estimate.gst_percentage,
                subtotal: estimate.subtotal,
                discount_amount: estimate.discount_amount,
                gst_amount: estimate.gst_amount,
                total_amount: estimate.total_amount,
                billing_cycle: estimate.billing_cycle,
                plan_id: estimate.plan_id,
                terms_and_conditions: estimate.terms_and_conditions,
                internal_notes: estimate.internal_notes,
                status: newStatus || estimate.status
            };
            
            let savedEstimateId = estimateId && estimateId !== 'new' ? estimateId : null;
            
            if (savedEstimateId) {
                // Update existing
                const { error } = await supabase
                    .from('subscription_estimates')
                    .update(estimateData)
                    .eq('id', savedEstimateId);
                
                if (error) throw error;
                
                // Delete old line items
                await supabase.from('estimate_line_items').delete().eq('estimate_id', savedEstimateId);
            } else {
                // Insert new
                const { data, error } = await supabase
                    .from('subscription_estimates')
                    .insert(estimateData)
                    .select()
                    .single();
                
                if (error) throw error;
                savedEstimateId = data.id;
            }
            
            // Insert line items
            const itemsToInsert = lineItems.map((item, index) => ({
                estimate_id: savedEstimateId,
                item_order: index,
                item_type: item.item_type,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unit_price: item.unit_price,
                amount: item.amount,
                is_discount: item.is_discount
            }));
            
            const { error: itemsError } = await supabase
                .from('estimate_line_items')
                .insert(itemsToInsert);
            
            if (itemsError) throw itemsError;
            
            toast({ title: 'Success!', description: `Estimate ${estimateNumber} saved successfully.` });
            
            // Update local state
            setEstimate(prev => ({ ...prev, estimate_number: estimateNumber, status: newStatus || prev.status }));
            
            // Navigate to list if new
            if (!estimateId || estimateId === 'new') {
                navigate(`/master-admin/estimates/${savedEstimateId}`);
            }
            
        } catch (error) {
            console.error('Save Error:', error);
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        } finally {
            setSaving(false);
        }
    };
    
    const handleGeneratePDF = () => {
        generateEstimatePDF(estimate, lineItems, settings);
    };
    
    // ========== Render ==========
    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col justify-center items-center h-[60vh]">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </DashboardLayout>
        );
    }
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };
    
    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">
                            {estimateId && estimateId !== 'new' ? 'Edit Estimate' : 'Create New Estimate'}
                        </h1>
                        {estimate.estimate_number && (
                            <p className="text-muted-foreground">Estimate #{estimate.estimate_number}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate('/master-admin/estimates')}>
                            Cancel
                        </Button>
                        <Button variant="outline" onClick={handleGeneratePDF} disabled={lineItems.length === 0}>
                            <Download className="mr-2 h-4 w-4" /> PDF
                        </Button>
                        <Button onClick={() => handleSave()} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" /> Save Draft
                        </Button>
                        <Button onClick={() => handleSave('sent')} disabled={saving} className="bg-green-600 hover:bg-green-700">
                            <Send className="mr-2 h-4 w-4" /> Save & Send
                        </Button>
                    </div>
                </div>
                
                {/* Main Form */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left - Client & Estimate Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Client Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" /> Client Information
                                </CardTitle>
                                <CardDescription>Select existing school or enter new client details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* School Selector */}
                                <div>
                                    <Label>Select Existing School (Optional)</Label>
                                    <Popover open={openSchoolCombobox} onOpenChange={setOpenSchoolCombobox}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                                {estimate.school_id 
                                                    ? schools.find(s => s.id === estimate.school_id)?.name 
                                                    : "Select school or enter manually..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search school..." />
                                                <CommandEmpty>No school found.</CommandEmpty>
                                                <CommandGroup className="max-h-[300px] overflow-auto">
                                                    {schools.map((school) => (
                                                        <CommandItem
                                                            key={school.id}
                                                            value={school.name}
                                                            onSelect={() => handleSchoolSelect(school.id)}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", estimate.school_id === school.id ? "opacity-100" : "opacity-0")} />
                                                            {school.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Client Name *</Label>
                                        <Input 
                                            value={estimate.client_name || ''} 
                                            onChange={e => handleEstimateChange('client_name', e.target.value)}
                                            placeholder="School / Organization Name"
                                        />
                                    </div>
                                    <div>
                                        <Label>Email</Label>
                                        <Input 
                                            type="email"
                                            value={estimate.client_email || ''} 
                                            onChange={e => handleEstimateChange('client_email', e.target.value)}
                                            placeholder="contact@school.com"
                                        />
                                    </div>
                                    <div>
                                        <Label>Phone</Label>
                                        <Input 
                                            value={estimate.client_phone || ''} 
                                            onChange={e => handleEstimateChange('client_phone', e.target.value)}
                                            placeholder="+91 XXXXX XXXXX"
                                        />
                                    </div>
                                    <div>
                                        <Label>GSTIN (Optional)</Label>
                                        <Input 
                                            value={estimate.client_gstin || ''} 
                                            onChange={e => handleEstimateChange('client_gstin', e.target.value)}
                                            placeholder="GST Number"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Address</Label>
                                    <Textarea 
                                        value={estimate.client_address || ''} 
                                        onChange={e => handleEstimateChange('client_address', e.target.value)}
                                        placeholder="Full Address"
                                        rows={2}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* Line Items */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Receipt className="h-5 w-5" /> Items & Services
                                        </CardTitle>
                                        <CardDescription>Add subscription plans, add-ons, or custom items</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        {/* Quick Plan Add */}
                                        <Select onValueChange={handlePlanSelect}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="+ Add Plan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {plans.map(plan => (
                                                    <SelectItem key={plan.id} value={plan.id}>
                                                        {plan.name} - {formatCurrency(plan.yearly_price || plan.price)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button variant="outline" size="sm" onClick={() => addLineItem(false)}>
                                            <Plus className="mr-1 h-4 w-4" /> Custom Item
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => addLineItem(true)} className="text-green-600">
                                            <Plus className="mr-1 h-4 w-4" /> Discount
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {lineItems.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>No items added yet</p>
                                        <p className="text-sm">Add a subscription plan or custom item to start</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Header */}
                                        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase pb-2 border-b">
                                            <div className="col-span-5">Description</div>
                                            <div className="col-span-2">Qty</div>
                                            <div className="col-span-2">Rate</div>
                                            <div className="col-span-2 text-right">Amount</div>
                                            <div className="col-span-1"></div>
                                        </div>
                                        
                                        {/* Items */}
                                        {lineItems.map((item, index) => (
                                            <div key={item.id} className={cn(
                                                "grid grid-cols-12 gap-2 items-center py-2",
                                                item.is_discount && "bg-green-50 rounded-lg px-2"
                                            )}>
                                                <div className="col-span-5">
                                                    <Input 
                                                        value={item.description || ''}
                                                        onChange={e => updateLineItem(index, 'description', e.target.value)}
                                                        placeholder={item.is_discount ? "Discount reason" : "Item description"}
                                                        className={item.is_discount ? "border-green-300" : ""}
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <Input 
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity ?? ''}
                                                        onChange={e => updateLineItem(index, 'quantity', e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <Select value={item.unit || 'nos'} onValueChange={v => updateLineItem(index, 'unit', v)}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="nos">Nos</SelectItem>
                                                            <SelectItem value="month">Month</SelectItem>
                                                            <SelectItem value="year">Year</SelectItem>
                                                            <SelectItem value="students">Students</SelectItem>
                                                            <SelectItem value="users">Users</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="col-span-2">
                                                    <Input 
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unit_price ?? ''}
                                                        onChange={e => updateLineItem(index, 'unit_price', e.target.value)}
                                                    />
                                                </div>
                                                <div className={cn(
                                                    "col-span-2 text-right font-semibold",
                                                    item.is_discount ? "text-green-600" : ""
                                                )}>
                                                    {item.is_discount && '- '}
                                                    {formatCurrency(Math.abs(item.amount))}
                                                </div>
                                                <div className="col-span-1 text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => removeLineItem(index)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        
                        {/* Terms */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Terms & Conditions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea 
                                    value={estimate.terms_and_conditions || ''}
                                    onChange={e => handleEstimateChange('terms_and_conditions', e.target.value)}
                                    placeholder="Enter terms and conditions..."
                                    rows={4}
                                />
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Right - Summary */}
                    <div className="space-y-6">
                        {/* Estimate Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Estimate Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Estimate Date</Label>
                                    <DatePicker 
                                        value={estimate.estimate_date || ''}
                                        onChange={d => handleEstimateChange('estimate_date', d)}
                                    />
                                </div>
                                <div>
                                    <Label>Valid Until</Label>
                                    <DatePicker 
                                        value={estimate.valid_until || ''}
                                        onChange={d => handleEstimateChange('valid_until', d)}
                                    />
                                </div>
                                <div>
                                    <Label>Billing Cycle</Label>
                                    <Select value={estimate.billing_cycle || 'yearly'} onValueChange={v => handleEstimateChange('billing_cycle', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>GST Percentage</Label>
                                    <Select value={String(estimate.gst_percentage ?? 18)} onValueChange={v => handleEstimateChange('gst_percentage', parseFloat(v))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">No GST (0%)</SelectItem>
                                            <SelectItem value="5">5%</SelectItem>
                                            <SelectItem value="12">12%</SelectItem>
                                            <SelectItem value="18">18%</SelectItem>
                                            <SelectItem value="28">28%</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* Totals */}
                        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <IndianRupee className="h-5 w-5" /> Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">{formatCurrency(estimate.subtotal)}</span>
                                </div>
                                {estimate.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Discount</span>
                                        <span className="font-medium">- {formatCurrency(estimate.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">GST ({estimate.gst_percentage}%)</span>
                                    <span className="font-medium">{formatCurrency(estimate.gst_amount)}</span>
                                </div>
                                <div className="border-t pt-3 flex justify-between">
                                    <span className="text-lg font-bold">Total</span>
                                    <span className="text-2xl font-bold text-primary">{formatCurrency(estimate.total_amount)}</span>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* Internal Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Internal Notes</CardTitle>
                                <CardDescription>Not visible to client</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea 
                                    value={estimate.internal_notes || ''}
                                    onChange={e => handleEstimateChange('internal_notes', e.target.value)}
                                    placeholder="Add internal notes..."
                                    rows={3}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default GenerateEstimate;
