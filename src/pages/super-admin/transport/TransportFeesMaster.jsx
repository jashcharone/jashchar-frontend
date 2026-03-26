import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, IndianRupee, Route, MapPin, Calendar, TrendingUp, Settings, AlertCircle } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

const BILLING_MODES = [
    { value: 'annual', label: 'Annual', desc: 'Single annual fee — student pays any amount, any time' },
    { value: 'monthly', label: 'Monthly', desc: 'Split into monthly installments' },
    { value: 'term_wise', label: 'Term-wise', desc: 'Split into academic terms' },
    { value: 'quarterly', label: 'Quarterly', desc: '4 quarterly installments' },
    { value: 'half_yearly', label: 'Half-yearly', desc: '2 semester installments' },
];

const INSTALLMENT_LABELS = {
    annual: () => [{ num: 1, label: 'Annual' }],
    monthly: (workingMonths) => {
        const allMonths = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];
        return allMonths.slice(0, workingMonths).map((m, i) => ({ num: i + 1, label: m }));
    },
    term_wise: (_, numTerms) => Array.from({ length: numTerms }, (_, i) => ({ num: i + 1, label: `Term ${i + 1}` })),
    quarterly: () => [
        { num: 1, label: 'Q1 (Apr-Jun)' }, { num: 2, label: 'Q2 (Jul-Sep)' },
        { num: 3, label: 'Q3 (Oct-Dec)' }, { num: 4, label: 'Q4 (Jan-Mar)' }
    ],
    half_yearly: () => [
        { num: 1, label: 'H1 (Apr-Sep)' }, { num: 2, label: 'H2 (Oct-Mar)' }
    ],
};

const TransportFeesMaster = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();

    // Tab 1: Billing Setup
    const [billingMode, setBillingMode] = useState('monthly');
    const [workingMonths, setWorkingMonths] = useState(10);
    const [numTerms, setNumTerms] = useState(3);
    const [oneWayPercentage, setOneWayPercentage] = useState(60);
    const [prorateMidYear, setProrateMidYear] = useState(true);
    const [billingSettingsId, setBillingSettingsId] = useState(null);

    // Tab 2: Route Fees
    const [routes, setRoutes] = useState([]);
    const [routePickupMappings, setRoutePickupMappings] = useState([]);

    // Tab 3: Due Dates & Fines
    const [installmentConfig, setInstallmentConfig] = useState([]);
    const [copyFirst, setCopyFirst] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('billing');
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    // Stats
    const stats = useMemo(() => {
        const routeCount = routes.length;
        const stopsWithFees = routePickupMappings.filter(m => (m.annual_fee || 0) > 0 || (m.monthly_fees || 0) > 0).length;
        const configuredInstallments = installmentConfig.filter(c => c.due_date).length;
        const totalInstallments = installmentConfig.length;
        return { routeCount, stopsWithFees, configuredInstallments, totalInstallments, billingMode };
    }, [routes, routePickupMappings, installmentConfig, billingMode]);

    // Get installment labels based on current billing mode
    const currentInstallmentLabels = useMemo(() => {
        const fn = INSTALLMENT_LABELS[billingMode];
        return fn ? fn(workingMonths, numTerms) : [];
    }, [billingMode, workingMonths, numTerms]);

    const fetchData = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        try {
            const [feesRes, routesRes, mappingsRes, installmentRes] = await Promise.all([
                supabase.from('transport_fees_master').select('*').eq('branch_id', branchId).limit(1),
                supabase.from('transport_routes').select('id, route_title, is_active').eq('branch_id', branchId).order('route_title'),
                supabase.from('route_pickup_point_mappings').select('*, route:route_id(route_title), pickup_point:pickup_point_id(name)').eq('branch_id', branchId).order('stop_order'),
                supabase.from('transport_fee_installment_config').select('*').eq('branch_id', branchId).eq('session_id', currentSessionId).order('installment_number'),
            ]);

            setRoutes(routesRes.data || []);
            setRoutePickupMappings(mappingsRes.data || []);

            // Load billing settings from first transport_fees_master row
            const masterRow = feesRes.data?.[0];
            if (masterRow) {
                setBillingSettingsId(masterRow.id);
                if (masterRow.billing_mode) setBillingMode(masterRow.billing_mode);
                if (masterRow.working_months) setWorkingMonths(masterRow.working_months);
                if (masterRow.num_terms) setNumTerms(masterRow.num_terms);
                if (masterRow.one_way_percentage != null) setOneWayPercentage(masterRow.one_way_percentage);
                if (masterRow.prorate_mid_year != null) setProrateMidYear(masterRow.prorate_mid_year);
            }

            // Load installment config
            setInstallmentConfig(installmentRes.data || []);
        } catch (error) {
            toast({ variant: "destructive", title: "Error fetching data", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [branchId, currentSessionId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ---------------------------------------------------
    // TAB 1: Billing Setup Save
    // ---------------------------------------------------
    const handleSaveBillingSetup = async () => {
        setSaving(true);
        try {
            const billingPayload = {
                branch_id: branchId,
                organization_id: organizationId,
                session_id: currentSessionId,
                billing_mode: billingMode,
                working_months: workingMonths,
                num_terms: numTerms,
                one_way_percentage: parseFloat(oneWayPercentage),
                prorate_mid_year: prorateMidYear,
            };

            // Upsert billing settings into transport_fees_master
            // We store billing config in the first row (month = 'April' as anchor)
            const { error: deleteError } = await supabase
                .from('transport_fees_master')
                .delete()
                .eq('branch_id', branchId);
            if (deleteError) throw deleteError;

            const { error: insertError } = await supabase
                .from('transport_fees_master')
                .insert({ ...billingPayload, month: 'April', due_date: null, fine_type: 'none', fine_value: null });
            if (insertError) throw insertError;

            toast({ title: "Billing Setup Saved", description: `Mode: ${billingMode.replace('_', ' ')} | Working Months: ${workingMonths}` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error saving billing setup", description: error.message });
        } finally {
            setSaving(false);
        }
    };

    // ---------------------------------------------------
    // TAB 2: Route Fees
    // ---------------------------------------------------
    const handleStopFeeChange = async (mappingId, field, value) => {
        const numVal = value ? parseFloat(value) : null;
        const updateObj = { [field]: numVal };

        // Auto-sync: if annual_fee changes, update monthly_fees = annual / working_months
        if (field === 'annual_fee' && numVal != null) {
            updateObj.monthly_fees = Math.round((numVal / workingMonths) * 100) / 100;
        }
        // If monthly_fees changes, update annual_fee = monthly * working_months
        if (field === 'monthly_fees' && numVal != null) {
            updateObj.annual_fee = Math.round(numVal * workingMonths * 100) / 100;
        }

        const { error } = await supabase
            .from('route_pickup_point_mappings')
            .update(updateObj)
            .eq('id', mappingId);

        if (error) {
            toast({ variant: 'destructive', title: 'Error updating stop fee', description: error.message });
        } else {
            setRoutePickupMappings(prev => prev.map(m => m.id === mappingId ? { ...m, ...updateObj } : m));
        }
    };

    // ---------------------------------------------------
    // TAB 3: Installment Due Dates & Fines
    // ---------------------------------------------------
    const handleGenerateInstallments = () => {
        const labels = currentInstallmentLabels;
        const existingMap = new Map(installmentConfig.map(c => [c.installment_number, c]));

        const newConfig = labels.map(({ num, label }) => {
            const existing = existingMap.get(num);
            return existing || {
                branch_id: branchId,
                session_id: currentSessionId,
                organization_id: organizationId,
                installment_number: num,
                installment_label: label,
                due_date: null,
                fine_type: 'none',
                fine_value: 0,
            };
        });
        setInstallmentConfig(newConfig);
    };

    // Auto-generate when billing mode changes
    useEffect(() => {
        if (!loading && branchId) {
            handleGenerateInstallments();
        }
    }, [billingMode, workingMonths, numTerms]);

    const handleInstallmentChange = (index, field, value) => {
        const updated = [...installmentConfig];
        const item = { ...updated[index] };

        if (field === 'fine_value') {
            item[field] = value === '' ? 0 : parseFloat(value);
        } else {
            item[field] = value;
        }
        if (field === 'fine_type' && value === 'none') {
            item.fine_value = 0;
        }

        updated[index] = item;

        if (copyFirst && index === 0) {
            const first = item;
            setInstallmentConfig(updated.map((c, i) => i === 0 ? c : {
                ...c,
                due_date: first.due_date,
                fine_type: first.fine_type,
                fine_value: first.fine_type !== 'none' ? first.fine_value : 0,
            }));
        } else {
            setInstallmentConfig(updated);
        }
    };

    const handleSaveInstallments = async () => {
        setSaving(true);
        try {
            // Delete existing config for this branch+session
            await supabase
                .from('transport_fee_installment_config')
                .delete()
                .eq('branch_id', branchId)
                .eq('session_id', currentSessionId);

            const insertData = installmentConfig.map(c => ({
                branch_id: branchId,
                session_id: currentSessionId,
                organization_id: organizationId,
                installment_number: c.installment_number,
                installment_label: c.installment_label || currentInstallmentLabels.find(l => l.num === c.installment_number)?.label || `Installment ${c.installment_number}`,
                due_date: c.due_date || null,
                fine_type: c.fine_type || 'none',
                fine_value: c.fine_type !== 'none' ? (parseFloat(c.fine_value) || 0) : 0,
            }));

            const { error } = await supabase
                .from('transport_fee_installment_config')
                .insert(insertData);

            if (error) throw error;

            toast({ title: "Due Dates & Fines Saved", description: `${insertData.length} installments configured.` });
            fetchData();
        } catch (error) {
            toast({ variant: "destructive", title: "Error saving installments", description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = parseISO(dateString);
        return isValid(date) ? format(date, 'yyyy-MM-dd') : '';
    };

    // Group mappings by route
    const routeMappings = useMemo(() => {
        const grouped = {};
        routePickupMappings.forEach(m => {
            const routeId = m.route_id;
            if (!grouped[routeId]) grouped[routeId] = { route: m.route, stops: [] };
            grouped[routeId].stops.push(m);
        });
        return grouped;
    }, [routePickupMappings]);

    if (loading) {
        return <DashboardLayout><div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 lg:p-8">
                <Helmet>
                    <title>Transport Fees Master | Jashchar ERP</title>
                </Helmet>
                <h1 className="text-2xl font-bold mb-6">?? Transport Fees Master</h1>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-card rounded-xl shadow p-4 border-l-4 border-blue-500">
                        <div className="flex items-center gap-3">
                            <Settings className="h-8 w-8 text-blue-500" />
                            <div><p className="text-xs text-muted-foreground">Billing Mode</p><p className="text-xl font-bold capitalize">{billingMode.replace('_', ' ')}</p></div>
                        </div>
                    </div>
                    <div className="bg-card rounded-xl shadow p-4 border-l-4 border-green-500">
                        <div className="flex items-center gap-3">
                            <Route className="h-8 w-8 text-green-500" />
                            <div><p className="text-xs text-muted-foreground">Active Routes</p><p className="text-2xl font-bold">{stats.routeCount}</p></div>
                        </div>
                    </div>
                    <div className="bg-card rounded-xl shadow p-4 border-l-4 border-purple-500">
                        <div className="flex items-center gap-3">
                            <MapPin className="h-8 w-8 text-purple-500" />
                            <div><p className="text-xs text-muted-foreground">Stops with Fees</p><p className="text-2xl font-bold">{stats.stopsWithFees}</p></div>
                        </div>
                    </div>
                    <div className="bg-card rounded-xl shadow p-4 border-l-4 border-amber-500">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-8 w-8 text-amber-500" />
                            <div><p className="text-xs text-muted-foreground">Installments Set</p><p className="text-2xl font-bold">{stats.configuredInstallments}/{stats.totalInstallments}</p></div>
                        </div>
                    </div>
                </div>

                {/* 3 Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <Button variant={activeTab === 'billing' ? 'default' : 'outline'} onClick={() => setActiveTab('billing')}>
                        <Settings className="mr-2 h-4 w-4" /> Billing Setup
                    </Button>
                    <Button variant={activeTab === 'routewise' ? 'default' : 'outline'} onClick={() => setActiveTab('routewise')}>
                        <Route className="mr-2 h-4 w-4" /> Route-wise Fees
                    </Button>
                    <Button variant={activeTab === 'duedates' ? 'default' : 'outline'} onClick={() => setActiveTab('duedates')}>
                        <Calendar className="mr-2 h-4 w-4" /> Due Dates & Fines
                    </Button>
                </div>

                {/* --------------- TAB 1: BILLING SETUP --------------- */}
                {activeTab === 'billing' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Billing Configuration</CardTitle>
                            <p className="text-sm text-muted-foreground">Configure how transport fees are billed for this branch. This setting applies to ALL students.</p>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Billing Mode Selection */}
                            <div>
                                <Label className="text-base font-semibold mb-3 block">Billing Mode</Label>
                                <RadioGroup value={billingMode} onValueChange={setBillingMode} className="space-y-3">
                                    {BILLING_MODES.map(mode => (
                                        <div key={mode.value} className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${billingMode === mode.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}>
                                            <RadioGroupItem value={mode.value} id={`billing_${mode.value}`} className="mt-0.5" />
                                            <div>
                                                <Label htmlFor={`billing_${mode.value}`} className="font-medium cursor-pointer">{mode.label}</Label>
                                                <p className="text-sm text-muted-foreground">{mode.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            {/* Working Months (only for monthly) */}
                            {billingMode === 'monthly' && (
                                <div className="p-4 bg-muted/30 rounded-lg border">
                                    <Label className="font-semibold">Working Months</Label>
                                    <p className="text-sm text-muted-foreground mb-2">How many months does your school operate per session?</p>
                                    <Select value={String(workingMonths)} onValueChange={(v) => setWorkingMonths(parseInt(v))}>
                                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10 months (Jun-Mar)</SelectItem>
                                            <SelectItem value="11">11 months (May-Mar)</SelectItem>
                                            <SelectItem value="12">12 months (Apr-Mar)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Number of Terms (only for term_wise) */}
                            {billingMode === 'term_wise' && (
                                <div className="p-4 bg-muted/30 rounded-lg border">
                                    <Label className="font-semibold">Number of Terms</Label>
                                    <p className="text-sm text-muted-foreground mb-2">How many academic terms per session?</p>
                                    <Select value={String(numTerms)} onValueChange={(v) => setNumTerms(parseInt(v))}>
                                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="2">2 Terms (Semester)</SelectItem>
                                            <SelectItem value="3">3 Terms (Trimester)</SelectItem>
                                            <SelectItem value="4">4 Terms (Quarter)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Additional Settings */}
                            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                                <Label className="font-semibold text-base">Additional Settings</Label>
                                
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="font-medium">Pro-rata for mid-year joining</Label>
                                        <p className="text-sm text-muted-foreground">Auto-adjust fee when student joins mid-session</p>
                                    </div>
                                    <Switch checked={prorateMidYear} onCheckedChange={setProrateMidYear} />
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <Label className="font-medium">One-way fee percentage</Label>
                                        <p className="text-sm text-muted-foreground">% of full fee charged for one-way transport</p>
                                    </div>
                                    <div className="flex items-center gap-2 w-32">
                                        <Input
                                            type="number"
                                            min="10"
                                            max="100"
                                            value={oneWayPercentage}
                                            onChange={(e) => setOneWayPercentage(e.target.value)}
                                            className="h-9"
                                        />
                                        <span className="text-sm font-medium">%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-blue-700 dark:text-blue-300">Preview</p>
                                        <p className="text-sm text-blue-600 dark:text-blue-400">
                                            {billingMode === 'annual' && 'Students will see 1 annual fee row. They can pay any amount at any time.'}
                                            {billingMode === 'monthly' && `Fee will be split into ${workingMonths} monthly installments. E.g., ?30,000 annual = ?${Math.round(30000/workingMonths).toLocaleString('en-IN')}/month`}
                                            {billingMode === 'term_wise' && `Fee will be split into ${numTerms} term installments. E.g., ?30,000 annual = ?${Math.round(30000/numTerms).toLocaleString('en-IN')}/term`}
                                            {billingMode === 'quarterly' && 'Fee will be split into 4 quarterly installments. E.g., ?30,000 annual = ?7,500/quarter'}
                                            {billingMode === 'half_yearly' && 'Fee will be split into 2 half-yearly installments. E.g., ?30,000 annual = ?15,000/semester'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={handleSaveBillingSetup} disabled={saving}>
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Billing Setup
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* --------------- TAB 2: ROUTE-WISE FEES --------------- */}
                {activeTab === 'routewise' && (
                    <div className="space-y-6">
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 text-sm">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                                <p className="text-blue-700 dark:text-blue-300">
                                    <strong>Annual Fee is the Source of Truth.</strong> Enter the annual fee per stop. 
                                    Monthly fee is auto-calculated as Annual ÷ {workingMonths} months.
                                    {billingMode !== 'monthly' && billingMode !== 'annual' && 
                                        ` Per-installment = Annual ÷ ${billingMode === 'quarterly' ? '4' : billingMode === 'half_yearly' ? '2' : numTerms}.`}
                                </p>
                            </div>
                        </div>

                        {Object.keys(routeMappings).length === 0 ? (
                            <Card className="p-8 text-center text-muted-foreground">
                                <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No routes with pickup point mappings found.</p>
                                <p className="text-sm mt-1">Configure routes and map pickup points first.</p>
                            </Card>
                        ) : (
                            Object.entries(routeMappings).map(([routeId, { route, stops }]) => (
                                <Card key={routeId}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Route className="h-5 w-5 text-primary" />
                                            {route?.route_title || 'Unknown Route'}
                                            <span className="text-sm font-normal text-muted-foreground ml-2">({stops.length} stops)</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="border rounded-lg overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left w-12">Order</th>
                                                        <th className="px-4 py-2 text-left">Stop Name</th>
                                                        <th className="px-4 py-2 text-left">Distance</th>
                                                        <th className="px-4 py-2 text-left w-44">Annual Fee (?)</th>
                                                        <th className="px-4 py-2 text-left w-36">Monthly (?)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {stops.map((stop) => (
                                                        <tr key={stop.id} className="border-t hover:bg-muted/30">
                                                            <td className="px-4 py-2 font-medium">{stop.stop_order || '-'}</td>
                                                            <td className="px-4 py-2">
                                                                <div className="flex items-center gap-1">
                                                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                                                    {stop.pickup_point?.name || 'Unknown'}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2">{stop.distance || '-'}</td>
                                                            <td className="px-4 py-2">
                                                                <div className="flex items-center gap-1">
                                                                    <IndianRupee className="h-3 w-3 text-muted-foreground" />
                                                                    <Input
                                                                        type="number"
                                                                        className="h-8 w-32"
                                                                        value={stop.annual_fee || ''}
                                                                        onChange={(e) => handleStopFeeChange(stop.id, 'annual_fee', e.target.value)}
                                                                        placeholder="0"
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2 text-muted-foreground">
                                                                ?{((stop.annual_fee || stop.monthly_fees * workingMonths || 0) / workingMonths).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {/* --------------- TAB 3: DUE DATES & FINES --------------- */}
                {activeTab === 'duedates' && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Due Dates & Fines</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Configure due dates for <strong className="capitalize">{billingMode.replace('_', ' ')}</strong> billing mode 
                                        ({currentInstallmentLabels.length} installment{currentInstallmentLabels.length !== 1 ? 's' : ''})
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="copyFirstInst" checked={copyFirst} onCheckedChange={setCopyFirst} />
                                    <label htmlFor="copyFirstInst" className="text-sm font-medium">Copy first to all</label>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {installmentConfig.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No installments configured yet.</p>
                                    <Button variant="outline" className="mt-4" onClick={handleGenerateInstallments}>
                                        Generate Installments
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {installmentConfig.map((config, index) => {
                                        const label = currentInstallmentLabels[index]?.label || config.installment_label || `Installment ${index + 1}`;
                                        return (
                                            <Card key={index} className="p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                                    <div className="md:col-span-2">
                                                        <Label className="font-semibold text-lg">{label}</Label>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <Label>Due Date</Label>
                                                        <Input
                                                            type="date"
                                                            value={formatDateForInput(config.due_date)}
                                                            onChange={(e) => handleInstallmentChange(index, 'due_date', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="md:col-span-4">
                                                        <Label>Fine Type</Label>
                                                        <RadioGroup
                                                            value={config.fine_type || 'none'}
                                                            onValueChange={(value) => handleInstallmentChange(index, 'fine_type', value)}
                                                            className="flex items-center space-x-4 mt-2"
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="none" id={`fine_none_${index}`} />
                                                                <Label htmlFor={`fine_none_${index}`}>None</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="percentage" id={`fine_pct_${index}`} />
                                                                <Label htmlFor={`fine_pct_${index}`}>Percentage (%)</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="fixed" id={`fine_fix_${index}`} />
                                                                <Label htmlFor={`fine_fix_${index}`}>Fixed Amount</Label>
                                                            </div>
                                                        </RadioGroup>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <Label>{config.fine_type === 'percentage' ? '% Value' : 'Amount (?)'}</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0"
                                                            disabled={config.fine_type === 'none'}
                                                            value={config.fine_type !== 'none' ? config.fine_value || '' : ''}
                                                            onChange={(e) => handleInstallmentChange(index, 'fine_value', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}

                                    <div className="flex justify-end mt-6">
                                        <Button onClick={handleSaveInstallments} disabled={saving}>
                                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            Save Due Dates & Fines
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default TransportFeesMaster;
