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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, IndianRupee, Route, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

const months = [
    "April", "May", "June", "July", "August", "September",
    "October", "November", "December", "January", "February", "March"
];

const TransportFeesMaster = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [feesMaster, setFeesMaster] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [routePickupMappings, setRoutePickupMappings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [copyFirst, setCopyFirst] = useState(false);
    const [activeTab, setActiveTab] = useState('monthly');
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    // Stats
    const stats = useMemo(() => {
        const configuredMonths = feesMaster.filter(f => f.due_date).length;
        const withFines = feesMaster.filter(f => f.fine_type !== 'none').length;
        const routeCount = routes.length;
        const stopsWithFees = routePickupMappings.filter(m => m.monthly_fees > 0).length;
        return { configuredMonths, withFines, routeCount, stopsWithFees };
    }, [feesMaster, routes, routePickupMappings]);

    const fetchData = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        try {
            const [feesRes, routesRes, mappingsRes] = await Promise.all([
                supabase.from('transport_fees_master').select('*').eq('branch_id', branchId),
                supabase.from('transport_routes').select('id, route_title, is_active').eq('branch_id', branchId).order('route_title'),
                supabase.from('route_pickup_point_mappings').select('*, route:route_id(route_title), pickup_point:pickup_point_id(name)').eq('branch_id', branchId).order('stop_order')
            ]);

            if (feesRes.error) throw feesRes.error;

            setRoutes(routesRes.data || []);
            setRoutePickupMappings(mappingsRes.data || []);

            const feeMap = new Map((feesRes.data || []).map(item => [item.month, item]));
            const initialData = months.map(month => {
                const existing = feeMap.get(month);
                return existing || {
                    branch_id: branchId,
                    month: month,
                    due_date: null,
                    fine_type: 'none',
                    fine_value: null,
                };
            });
            setFeesMaster(initialData);
        } catch (error) {
            toast({ variant: "destructive", title: "Error fetching data", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [branchId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInputChange = (index, field, value) => {
        const updatedFeesMaster = [...feesMaster];
        const currentItem = { ...updatedFeesMaster[index] };
        
        if (field === 'fine_value') {
            currentItem[field] = value === '' ? null : parseFloat(value);
        } else {
            currentItem[field] = value;
        }
        
        if (field === 'fine_type' && value === 'none') {
            currentItem.fine_value = null;
        }

        updatedFeesMaster[index] = currentItem;

        if (copyFirst && index === 0) {
            applyCopyToAll(currentItem);
        } else {
            setFeesMaster(updatedFeesMaster);
        }
    };
    
    const applyCopyToAll = (firstMonthData) => {
        const updatedFeesMaster = feesMaster.map(item => ({
            ...item,
            due_date: firstMonthData.due_date,
            fine_type: firstMonthData.fine_type,
            fine_value: firstMonthData.fine_type !== 'none' ? firstMonthData.fine_value : null,
        }));
        setFeesMaster(updatedFeesMaster);
    };

    const handleCopyFirstChange = (checked) => {
        setCopyFirst(checked);
        if (checked && feesMaster.length > 0) {
            applyCopyToAll(feesMaster[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const upsertData = feesMaster.map(({ id, ...rest }) => ({
                 ...rest,
                 branch_id: branchId || null,
                 organization_id: organizationId,
                 session_id: currentSessionId,
                 fine_value: rest.fine_type !== 'none' && rest.fine_value != null 
                     ? parseFloat(rest.fine_value) 
                     : null,
                 due_date: rest.due_date || null
            }));

            const { error: deleteError } = await supabase
                .from('transport_fees_master')
                .delete()
                .eq('branch_id', branchId);

            if (deleteError) throw deleteError;

            const { error: insertError } = await supabase
                .from('transport_fees_master')
                .insert(upsertData);

            if (insertError) throw insertError;

            toast({ title: "Success", description: "Transport fees master saved successfully." });
            fetchData();
        } catch (error) {
            toast({ variant: "destructive", title: "Error saving data", description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleStopFeeChange = async (mappingId, newFee) => {
        const { error } = await supabase
            .from('route_pickup_point_mappings')
            .update({ monthly_fees: newFee ? parseFloat(newFee) : null })
            .eq('id', mappingId);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error updating stop fee', description: error.message });
        } else {
            setRoutePickupMappings(prev => prev.map(m => m.id === mappingId ? { ...m, monthly_fees: newFee ? parseFloat(newFee) : null } : m));
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
                <h1 className="text-2xl font-bold mb-6">💰 Transport Fees Master</h1>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-card rounded-xl shadow p-4 border-l-4 border-blue-500">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-8 w-8 text-blue-500" />
                            <div><p className="text-xs text-muted-foreground">Months Configured</p><p className="text-2xl font-bold">{stats.configuredMonths}/12</p></div>
                        </div>
                    </div>
                    <div className="bg-card rounded-xl shadow p-4 border-l-4 border-amber-500">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="h-8 w-8 text-amber-500" />
                            <div><p className="text-xs text-muted-foreground">With Late Fines</p><p className="text-2xl font-bold">{stats.withFines}</p></div>
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
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <Button variant={activeTab === 'monthly' ? 'default' : 'outline'} onClick={() => setActiveTab('monthly')}>
                        <Calendar className="mr-2 h-4 w-4" /> Monthly Due Dates & Fines
                    </Button>
                    <Button variant={activeTab === 'routewise' ? 'default' : 'outline'} onClick={() => setActiveTab('routewise')}>
                        <Route className="mr-2 h-4 w-4" /> Route-wise Stop Fees
                    </Button>
                </div>

                {/* Monthly Fees Config Tab */}
                {activeTab === 'monthly' && (
                    <form onSubmit={handleSubmit}>
                        <Card>
                            <CardHeader>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="copyFirst" checked={copyFirst} onCheckedChange={handleCopyFirstChange} />
                                    <label htmlFor="copyFirst" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Copy First Fees Detail For All Months
                                    </label>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {feesMaster.map((fee, index) => (
                                        <Card key={fee.month} className="p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                                <div className="md:col-span-2">
                                                    <Label className="font-semibold text-lg">{fee.month}</Label>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <Label htmlFor={`due_date_${index}`}>Due Date</Label>
                                                    <Input
                                                        id={`due_date_${index}`}
                                                        type="date"
                                                        value={formatDateForInput(fee.due_date)}
                                                        onChange={(e) => handleInputChange(index, 'due_date', e.target.value)}
                                                    />
                                                </div>
                                                <div className="md:col-span-4">
                                                    <Label>Fine Type</Label>
                                                    <RadioGroup
                                                        value={fee.fine_type}
                                                        onValueChange={(value) => handleInputChange(index, 'fine_type', value)}
                                                        className="flex items-center space-x-4 mt-2"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="none" id={`fine_none_${index}`} />
                                                            <Label htmlFor={`fine_none_${index}`}>None</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="percentage" id={`fine_percentage_${index}`} />
                                                            <Label htmlFor={`fine_percentage_${index}`}>Percentage (%)</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="fixed" id={`fine_fixed_${index}`} />
                                                            <Label htmlFor={`fine_fixed_${index}`}>Fix Amount</Label>
                                                        </div>
                                                    </RadioGroup>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Value"
                                                        disabled={fee.fine_type !== 'percentage'}
                                                        value={fee.fine_type === 'percentage' ? fee.fine_value || '' : ''}
                                                        onChange={(e) => handleInputChange(index, 'fine_value', e.target.value)}
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Value"
                                                        disabled={fee.fine_type !== 'fixed'}
                                                        value={fee.fine_type === 'fixed' ? fee.fine_value || '' : ''}
                                                        onChange={(e) => handleInputChange(index, 'fine_value', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                <div className="flex justify-end mt-6">
                                    <Button type="submit" disabled={saving}>
                                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Save
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                )}

                {/* Route-wise Fees Tab */}
                {activeTab === 'routewise' && (
                    <div className="space-y-6">
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
                                                        <th className="px-4 py-2 text-left">Distance (km)</th>
                                                        <th className="px-4 py-2 text-left">Pickup Time</th>
                                                        <th className="px-4 py-2 text-left w-40">Monthly Fee (₹)</th>
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
                                                            <td className="px-4 py-2">{stop.pickup_time || '-'}</td>
                                                            <td className="px-4 py-2">
                                                                <div className="flex items-center gap-1">
                                                                    <IndianRupee className="h-3 w-3 text-muted-foreground" />
                                                                    <Input 
                                                                        type="number" 
                                                                        className="h-8 w-28" 
                                                                        value={stop.monthly_fees || ''} 
                                                                        onChange={(e) => handleStopFeeChange(stop.id, e.target.value)}
                                                                        placeholder="0"
                                                                    />
                                                                </div>
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
            </div>
        </DashboardLayout>
    );
};

export default TransportFeesMaster;
