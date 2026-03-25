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
import { Loader2, Save, IndianRupee, Building, Calendar, Settings, AlertCircle, Bed } from 'lucide-react';
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

const HostelFeesMaster = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();

    // Tab 1: Billing Setup
    const [billingMode, setBillingMode] = useState('annual');
    const [workingMonths, setWorkingMonths] = useState(10);
    const [numTerms, setNumTerms] = useState(3);
    const [prorateMidYear, setProrateMidYear] = useState(true);
    const [hasMessFee, setHasMessFee] = useState(false);
    const [hasLaundryFee, setHasLaundryFee] = useState(false);
    const [hasElectricityFee, setHasElectricityFee] = useState(false);
    const [billingSettingsId, setBillingSettingsId] = useState(null);

    // Tab 2: Room-Type Fees
    const [hostels, setHostels] = useState([]);
    const [roomTypeFees, setRoomTypeFees] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);

    // Tab 3: Due Dates & Fines
    const [installmentConfig, setInstallmentConfig] = useState([]);
    const [copyFirst, setCopyFirst] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('billing');
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    // Stats
    const stats = useMemo(() => {
        const hostelCount = hostels.length;
        const roomTypesWithFees = roomTypeFees.filter(r => (r.annual_accommodation_fee || 0) > 0).length;
        const configuredInstallments = installmentConfig.filter(c => c.due_date).length;
        const totalInstallments = installmentConfig.length;
        return { hostelCount, roomTypesWithFees, configuredInstallments, totalInstallments };
    }, [hostels, roomTypeFees, installmentConfig]);

    const currentInstallmentLabels = useMemo(() => {
        const fn = INSTALLMENT_LABELS[billingMode];
        return fn ? fn(workingMonths, numTerms) : [];
    }, [billingMode, workingMonths, numTerms]);

    const fetchData = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        try {
            const [masterRes, hostelsRes, roomTypesRes, roomTypeFeesRes, installmentRes] = await Promise.all([
                supabase.from('hostel_fees_master').select('*').eq('branch_id', branchId).eq('session_id', currentSessionId).maybeSingle(),
                supabase.from('hostels').select('id, name').eq('branch_id', branchId).order('name'),
                supabase.from('hostel_room_types').select('id, name').eq('branch_id', branchId).order('name'),
                supabase.from('hostel_room_type_fees').select('*').eq('branch_id', branchId).eq('session_id', currentSessionId),
                supabase.from('hostel_fee_installment_config').select('*').eq('branch_id', branchId).eq('session_id', currentSessionId).order('installment_number'),
            ]);

            setHostels(hostelsRes.data || []);
            setRoomTypes(roomTypesRes.data || []);
            setRoomTypeFees(roomTypeFeesRes.data || []);
            setInstallmentConfig(installmentRes.data || []);

            // Load billing settings
            const master = masterRes.data;
            if (master) {
                setBillingSettingsId(master.id);
                setBillingMode(master.billing_mode || 'annual');
                setWorkingMonths(master.working_months || 10);
                setNumTerms(master.num_terms || 3);
                setProrateMidYear(master.prorate_mid_year !== false);
                setHasMessFee(master.has_mess_fee || false);
                setHasLaundryFee(master.has_laundry_fee || false);
                setHasElectricityFee(master.has_electricity_fee || false);
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error fetching data", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [branchId, currentSessionId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ═══════════════════════════════════════════════════
    // TAB 1: Billing Setup
    // ═══════════════════════════════════════════════════
    const handleSaveBillingSetup = async () => {
        setSaving(true);
        try {
            const payload = {
                branch_id: branchId,
                session_id: currentSessionId,
                organization_id: organizationId,
                billing_mode: billingMode,
                working_months: workingMonths,
                num_terms: numTerms,
                prorate_mid_year: prorateMidYear,
                has_mess_fee: hasMessFee,
                has_laundry_fee: hasLaundryFee,
                has_electricity_fee: hasElectricityFee,
                updated_at: new Date().toISOString(),
            };

            if (billingSettingsId) {
                const { error } = await supabase
                    .from('hostel_fees_master')
                    .update(payload)
                    .eq('id', billingSettingsId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('hostel_fees_master')
                    .insert(payload)
                    .select('id')
                    .single();
                if (error) throw error;
                setBillingSettingsId(data.id);
            }

            toast({ title: "Billing Setup Saved", description: `Mode: ${billingMode.replace('_', ' ')}` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error saving", description: error.message });
        } finally {
            setSaving(false);
        }
    };

    // ═══════════════════════════════════════════════════
    // TAB 2: Room-Type Fees
    // ═══════════════════════════════════════════════════
    const handleRoomTypeFeeChange = (hostelId, roomTypeName, field, value) => {
        setRoomTypeFees(prev => {
            const idx = prev.findIndex(r => r.hostel_id === hostelId && r.room_type === roomTypeName);
            const numVal = value ? parseFloat(value) : 0;
            if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], [field]: numVal };
                return updated;
            }
            return [...prev, {
                branch_id: branchId,
                session_id: currentSessionId,
                organization_id: organizationId,
                hostel_id: hostelId,
                room_type: roomTypeName,
                annual_accommodation_fee: 0,
                annual_mess_fee: 0,
                annual_laundry_fee: 0,
                annual_electricity_fee: 0,
                [field]: numVal,
            }];
        });
    };

    const getRoomTypeFeeValue = (hostelId, roomTypeName, field) => {
        const row = roomTypeFees.find(r => r.hostel_id === hostelId && r.room_type === roomTypeName);
        return row?.[field] || '';
    };

    const getRoomTypeTotal = (hostelId, roomTypeName) => {
        const row = roomTypeFees.find(r => r.hostel_id === hostelId && r.room_type === roomTypeName);
        if (!row) return 0;
        return (row.annual_accommodation_fee || 0) + (row.annual_mess_fee || 0) + (row.annual_laundry_fee || 0) + (row.annual_electricity_fee || 0);
    };

    const handleSaveRoomTypeFees = async () => {
        setSaving(true);
        try {
            // Delete existing and re-insert
            await supabase
                .from('hostel_room_type_fees')
                .delete()
                .eq('branch_id', branchId)
                .eq('session_id', currentSessionId);

            const validRows = roomTypeFees.filter(r =>
                r.hostel_id && r.room_type && (
                    (r.annual_accommodation_fee || 0) > 0 ||
                    (r.annual_mess_fee || 0) > 0 ||
                    (r.annual_laundry_fee || 0) > 0 ||
                    (r.annual_electricity_fee || 0) > 0
                )
            ).map(({ id, ...rest }) => ({
                ...rest,
                branch_id: branchId,
                session_id: currentSessionId,
                organization_id: organizationId,
            }));

            if (validRows.length > 0) {
                const { error } = await supabase
                    .from('hostel_room_type_fees')
                    .insert(validRows);
                if (error) throw error;
            }

            toast({ title: "Room-Type Fees Saved", description: `${validRows.length} room type fees configured.` });
            fetchData();
        } catch (error) {
            toast({ variant: "destructive", title: "Error saving", description: error.message });
        } finally {
            setSaving(false);
        }
    };

    // ═══════════════════════════════════════════════════
    // TAB 3: Installment Due Dates & Fines
    // ═══════════════════════════════════════════════════
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
        if (field === 'fine_type' && value === 'none') item.fine_value = 0;
        updated[index] = item;

        if (copyFirst && index === 0) {
            setInstallmentConfig(updated.map((c, i) => i === 0 ? c : {
                ...c, due_date: item.due_date, fine_type: item.fine_type,
                fine_value: item.fine_type !== 'none' ? item.fine_value : 0,
            }));
        } else {
            setInstallmentConfig(updated);
        }
    };

    const handleSaveInstallments = async () => {
        setSaving(true);
        try {
            await supabase
                .from('hostel_fee_installment_config')
                .delete()
                .eq('branch_id', branchId)
                .eq('session_id', currentSessionId);

            const insertData = installmentConfig.map(c => ({
                branch_id: branchId,
                session_id: currentSessionId,
                organization_id: organizationId,
                installment_number: c.installment_number,
                installment_label: c.installment_label || `Installment ${c.installment_number}`,
                due_date: c.due_date || null,
                fine_type: c.fine_type || 'none',
                fine_value: c.fine_type !== 'none' ? (parseFloat(c.fine_value) || 0) : 0,
            }));

            const { error } = await supabase
                .from('hostel_fee_installment_config')
                .insert(insertData);
            if (error) throw error;

            toast({ title: "Due Dates & Fines Saved", description: `${insertData.length} installments configured.` });
            fetchData();
        } catch (error) {
            toast({ variant: "destructive", title: "Error saving", description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = parseISO(dateString);
        return isValid(date) ? format(date, 'yyyy-MM-dd') : '';
    };

    if (loading) {
        return <DashboardLayout><div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 lg:p-8">
                <Helmet>
                    <title>Hostel Fees Master | Jashchar ERP</title>
                </Helmet>
                <h1 className="text-2xl font-bold mb-6">🏠 Hostel Fees Master</h1>

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
                            <Building className="h-8 w-8 text-green-500" />
                            <div><p className="text-xs text-muted-foreground">Hostels</p><p className="text-2xl font-bold">{stats.hostelCount}</p></div>
                        </div>
                    </div>
                    <div className="bg-card rounded-xl shadow p-4 border-l-4 border-purple-500">
                        <div className="flex items-center gap-3">
                            <Bed className="h-8 w-8 text-purple-500" />
                            <div><p className="text-xs text-muted-foreground">Room Types with Fees</p><p className="text-2xl font-bold">{stats.roomTypesWithFees}</p></div>
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
                    <Button variant={activeTab === 'roomfees' ? 'default' : 'outline'} onClick={() => setActiveTab('roomfees')}>
                        <Bed className="mr-2 h-4 w-4" /> Room-Type Fees
                    </Button>
                    <Button variant={activeTab === 'duedates' ? 'default' : 'outline'} onClick={() => setActiveTab('duedates')}>
                        <Calendar className="mr-2 h-4 w-4" /> Due Dates & Fines
                    </Button>
                </div>

                {/* ═══════════════ TAB 1: BILLING SETUP ═══════════════ */}
                {activeTab === 'billing' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Hostel Billing Configuration</CardTitle>
                            <p className="text-sm text-muted-foreground">Configure how hostel fees are billed for this branch.</p>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Billing Mode */}
                            <div>
                                <Label className="text-base font-semibold mb-3 block">Billing Mode</Label>
                                <RadioGroup value={billingMode} onValueChange={setBillingMode} className="space-y-3">
                                    {BILLING_MODES.map(mode => (
                                        <div key={mode.value} className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${billingMode === mode.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}>
                                            <RadioGroupItem value={mode.value} id={`hbilling_${mode.value}`} className="mt-0.5" />
                                            <div>
                                                <Label htmlFor={`hbilling_${mode.value}`} className="font-medium cursor-pointer">{mode.label}</Label>
                                                <p className="text-sm text-muted-foreground">{mode.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            {billingMode === 'monthly' && (
                                <div className="p-4 bg-muted/30 rounded-lg border">
                                    <Label className="font-semibold">Working Months</Label>
                                    <p className="text-sm text-muted-foreground mb-2">How many months does the hostel operate per session?</p>
                                    <Select value={String(workingMonths)} onValueChange={(v) => setWorkingMonths(parseInt(v))}>
                                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10 months</SelectItem>
                                            <SelectItem value="11">11 months</SelectItem>
                                            <SelectItem value="12">12 months</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {billingMode === 'term_wise' && (
                                <div className="p-4 bg-muted/30 rounded-lg border">
                                    <Label className="font-semibold">Number of Terms</Label>
                                    <Select value={String(numTerms)} onValueChange={(v) => setNumTerms(parseInt(v))}>
                                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="2">2 Terms</SelectItem>
                                            <SelectItem value="3">3 Terms</SelectItem>
                                            <SelectItem value="4">4 Terms</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Fee Components Toggle */}
                            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                                <Label className="font-semibold text-base">Fee Components</Label>
                                <p className="text-sm text-muted-foreground">Select which components are charged separately. Accommodation is always included.</p>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="font-medium">Mess/Food Fee</Label>
                                        <p className="text-sm text-muted-foreground">Charge mess fee separately from room fee</p>
                                    </div>
                                    <Switch checked={hasMessFee} onCheckedChange={setHasMessFee} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="font-medium">Laundry Fee</Label>
                                        <p className="text-sm text-muted-foreground">Charge laundry fee separately</p>
                                    </div>
                                    <Switch checked={hasLaundryFee} onCheckedChange={setHasLaundryFee} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="font-medium">Electricity/AC Fee</Label>
                                        <p className="text-sm text-muted-foreground">Extra charge for AC rooms or electricity</p>
                                    </div>
                                    <Switch checked={hasElectricityFee} onCheckedChange={setHasElectricityFee} />
                                </div>
                            </div>

                            {/* Pro-rata */}
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                                <div>
                                    <Label className="font-medium">Pro-rata for mid-year joining</Label>
                                    <p className="text-sm text-muted-foreground">Auto-adjust fee when student joins mid-session</p>
                                </div>
                                <Switch checked={prorateMidYear} onCheckedChange={setProrateMidYear} />
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

                {/* ═══════════════ TAB 2: ROOM-TYPE FEES ═══════════════ */}
                {activeTab === 'roomfees' && (
                    <div className="space-y-6">
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 text-sm">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                                <p className="text-blue-700 dark:text-blue-300">
                                    <strong>Annual Fee is the Source of Truth.</strong> Enter annual fees per room type for each hostel.
                                    {hasMessFee && ' Mess fee column is enabled.'}
                                    {hasLaundryFee && ' Laundry fee column is enabled.'}
                                    {hasElectricityFee && ' Electricity fee column is enabled.'}
                                </p>
                            </div>
                        </div>

                        {hostels.length === 0 ? (
                            <Card className="p-8 text-center text-muted-foreground">
                                <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No hostels found. Create hostels first.</p>
                            </Card>
                        ) : roomTypes.length === 0 ? (
                            <Card className="p-8 text-center text-muted-foreground">
                                <Bed className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No room types found. Configure room types first.</p>
                            </Card>
                        ) : (
                            hostels.map(hostel => (
                                <Card key={hostel.id}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Building className="h-5 w-5 text-primary" />
                                            {hostel.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="border rounded-lg overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left">Room Type</th>
                                                        <th className="px-4 py-2 text-left w-40">Room/Accommodation (₹)</th>
                                                        {hasMessFee && <th className="px-4 py-2 text-left w-36">Mess (₹)</th>}
                                                        {hasLaundryFee && <th className="px-4 py-2 text-left w-36">Laundry (₹)</th>}
                                                        {hasElectricityFee && <th className="px-4 py-2 text-left w-36">Electricity (₹)</th>}
                                                        <th className="px-4 py-2 text-left w-36">Total Annual (₹)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {roomTypes.map(rt => (
                                                        <tr key={rt.id} className="border-t hover:bg-muted/30">
                                                            <td className="px-4 py-2 font-medium">{rt.name}</td>
                                                            <td className="px-4 py-2">
                                                                <Input
                                                                    type="number"
                                                                    className="h-8 w-32"
                                                                    value={getRoomTypeFeeValue(hostel.id, rt.name, 'annual_accommodation_fee')}
                                                                    onChange={(e) => handleRoomTypeFeeChange(hostel.id, rt.name, 'annual_accommodation_fee', e.target.value)}
                                                                    placeholder="0"
                                                                />
                                                            </td>
                                                            {hasMessFee && (
                                                                <td className="px-4 py-2">
                                                                    <Input
                                                                        type="number"
                                                                        className="h-8 w-32"
                                                                        value={getRoomTypeFeeValue(hostel.id, rt.name, 'annual_mess_fee')}
                                                                        onChange={(e) => handleRoomTypeFeeChange(hostel.id, rt.name, 'annual_mess_fee', e.target.value)}
                                                                        placeholder="0"
                                                                    />
                                                                </td>
                                                            )}
                                                            {hasLaundryFee && (
                                                                <td className="px-4 py-2">
                                                                    <Input
                                                                        type="number"
                                                                        className="h-8 w-32"
                                                                        value={getRoomTypeFeeValue(hostel.id, rt.name, 'annual_laundry_fee')}
                                                                        onChange={(e) => handleRoomTypeFeeChange(hostel.id, rt.name, 'annual_laundry_fee', e.target.value)}
                                                                        placeholder="0"
                                                                    />
                                                                </td>
                                                            )}
                                                            {hasElectricityFee && (
                                                                <td className="px-4 py-2">
                                                                    <Input
                                                                        type="number"
                                                                        className="h-8 w-32"
                                                                        value={getRoomTypeFeeValue(hostel.id, rt.name, 'annual_electricity_fee')}
                                                                        onChange={(e) => handleRoomTypeFeeChange(hostel.id, rt.name, 'annual_electricity_fee', e.target.value)}
                                                                        placeholder="0"
                                                                    />
                                                                </td>
                                                            )}
                                                            <td className="px-4 py-2 font-semibold text-primary">
                                                                ₹{getRoomTypeTotal(hostel.id, rt.name).toLocaleString('en-IN')}
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

                        {hostels.length > 0 && roomTypes.length > 0 && (
                            <div className="flex justify-end">
                                <Button onClick={handleSaveRoomTypeFees} disabled={saving}>
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save All Room-Type Fees
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════════ TAB 3: DUE DATES & FINES ═══════════════ */}
                {activeTab === 'duedates' && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Due Dates & Fines</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Configure due dates for <strong className="capitalize">{billingMode.replace('_', ' ')}</strong> billing mode
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="hcopyFirst" checked={copyFirst} onCheckedChange={setCopyFirst} />
                                    <label htmlFor="hcopyFirst" className="text-sm font-medium">Copy first to all</label>
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
                                                                <RadioGroupItem value="none" id={`hfine_none_${index}`} />
                                                                <Label htmlFor={`hfine_none_${index}`}>None</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="percentage" id={`hfine_pct_${index}`} />
                                                                <Label htmlFor={`hfine_pct_${index}`}>Percentage (%)</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="fixed" id={`hfine_fix_${index}`} />
                                                                <Label htmlFor={`hfine_fix_${index}`}>Fixed Amount</Label>
                                                            </div>
                                                        </RadioGroup>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <Label>{config.fine_type === 'percentage' ? '% Value' : 'Amount (₹)'}</Label>
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

export default HostelFeesMaster;
