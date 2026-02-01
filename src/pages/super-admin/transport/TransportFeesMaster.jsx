import React, { useState, useEffect, useCallback } from 'react';
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
import { Loader2, Save } from 'lucide-react';
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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [copyFirst, setCopyFirst] = useState(false);
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const fetchFeesMaster = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        try {
            let query = supabase
                .from('transport_fees_master')
                .select('*')
                .eq('branch_id', branchId);

            const { data, error } = await query;

            if (error) throw error;

            const feeMap = new Map(data.map(item => [item.month, item]));
            const initialData = months.map(month => {
                const existing = feeMap.get(month);
                return existing || {
                    branch_id: branchId,
                    session_id: currentSessionId,
                    organization_id: organizationId,
                    month: month,
                    due_date: null,
                    fine_type: 'none',
                    fine_value: null,
                };
            });
            setFeesMaster(initialData);

        } catch (error) {
            toast({ variant: "destructive", title: "Error fetching transport fees master", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [branchId, currentSessionId, organizationId, toast]);

    useEffect(() => {
        fetchFeesMaster();
    }, [fetchFeesMaster]);

    const handleInputChange = (index, field, value) => {
        const updatedFeesMaster = [...feesMaster];
        const currentItem = { ...updatedFeesMaster[index] };
        currentItem[field] = value;
        
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
                 session_id: currentSessionId,
                 organization_id: organizationId,
                 fine_value: rest.fine_type !== 'none' ? rest.fine_value : null,
                 due_date: rest.due_date || null
            }));

            const { error } = await supabase
                .from('transport_fees_master')
                .upsert(upsertData, { onConflict: 'branch_id, month' });

            if (error) throw error;

            toast({ title: "Success", description: "Transport fees master saved successfully." });
            fetchFeesMaster();
        } catch (error) {
            toast({ variant: "destructive", title: "Error saving data", description: error.message });
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
                    <title>Transport Fees Master | Jashchar ERP</title>
                </Helmet>
                <h1 className="text-2xl font-bold mb-6">Transport Fees Master</h1>

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
            </div>
        </DashboardLayout>
    );
};

export default TransportFeesMaster;
