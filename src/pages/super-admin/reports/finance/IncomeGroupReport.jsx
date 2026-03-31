import React, { useState, useEffect, useMemo, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DataTableExport from '@/components/DataTableExport';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';

const IncomeGroupReport = () => {
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [incomeHeads, setIncomeHeads] = useState([]);
    const [filters, setFilters] = useState({ search_type: 'this_month', income_head_id: 'all' });
    const [reportData, setReportData] = useState(null);

    const branchId = selectedBranch?.id || user?.profile?.branch_id;
    const printRef = useRef();

    const columns = useMemo(() => [
        { key: 'income_head', label: 'Income Head' },
        { key: 'count', label: 'Items Count' },
        { key: 'total', label: 'Total Amount (?)' }
    ], []);

    const exportData = useMemo(() => {
        if (!reportData) return [];
        return Object.entries(reportData).map(([head, data]) => ({
            income_head: head,
            count: data.count,
            total: `?${data.total.toFixed(2)}`
        }));
    }, [reportData]);

    useEffect(() => {
        if (!branchId) return;
        const fetchIncomeHeads = async () => {
            const { data, error } = await supabase.from('income_heads').select('id, name').eq('branch_id', branchId);
            if (error) toast({ variant: 'destructive', title: 'Error fetching income heads' });
            else setIncomeHeads(data);
        };
        fetchIncomeHeads();
    }, [branchId, toast]);

    const handleSearch = async () => {
        setLoading(true);
        setReportData(null);
        
        let from, to;
        const now = new Date();
        switch(filters.search_type) {
            case 'today': from = now; to = now; break;
            case 'this_week': from = new Date(now.setDate(now.getDate() - now.getDay())); to = new Date(now.setDate(now.getDate() - now.getDay() + 6)); break;
            case 'last_week': const lastWeekStart = new Date(now.setDate(now.getDate() - now.getDay() - 7)); from = lastWeekStart; to = new Date(lastWeekStart.setDate(lastWeekStart.getDate() + 6)); break;
            case 'this_month': from = startOfMonth(now); to = endOfMonth(now); break;
            case 'last_month': const lastMonth = subMonths(now, 1); from = startOfMonth(lastMonth); to = endOfMonth(lastMonth); break;
            case 'this_year': from = startOfYear(now); to = endOfYear(now); break;
            case 'last_year': const lastYear = new Date(now.getFullYear() - 1, 0, 1); from = startOfYear(lastYear); to = endOfYear(lastYear); break;
            default: from = now; to = now;
        }

        let query = supabase
            .from('income')
            .select('*, income_heads!inner(name)')
            .eq('branch_id', branchId)
            .gte('date', format(from, 'yyyy-MM-dd'))
            .lte('date', format(to, 'yyyy-MM-dd'));

        if (filters.income_head_id !== 'all') {
            query = query.eq('income_head_id', filters.income_head_id);
        }

        const { data, error } = await query;

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching report data', description: error.message });
        } else {
             const groupedData = data.reduce((acc, income) => {
                const headName = income.income_heads.name;
                if (!acc[headName]) {
                    acc[headName] = { total: 0, count: 0 };
                }
                acc[headName].total += income.amount;
                acc[headName].count += 1;
                return acc;
            }, {});
            setReportData(groupedData);
        }
        setLoading(false);
    };

    const grandTotal = reportData ? Object.values(reportData).reduce((sum, group) => sum + group.total, 0) : 0;

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-6">Income Group Report</h1>
            <Card className="mb-6">
                <CardHeader><CardTitle>Select Criteria</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="text-sm">Search Type</label>
                            <Select value={filters.search_type} onValueChange={v => setFilters(p => ({...p, search_type: v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="this_month">This Month</SelectItem><SelectItem value="this_year">This Year</SelectItem><SelectItem value="last_year">Last Year</SelectItem></SelectContent></Select>
                        </div>
                         <div>
                            <label className="text-sm">Search Income Head</label>
                            <Select value={filters.income_head_id} onValueChange={v => setFilters(p => ({...p, income_head_id: v}))}><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{incomeHeads.map(head => <SelectItem key={head.id} value={head.id}>{head.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <Button onClick={handleSearch} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Search />} Search</Button>
                    </div>
                </CardContent>
            </Card>

            {reportData && (
                <Card>
                    <CardHeader><CardTitle>Income Group Report</CardTitle></CardHeader>
                    <CardContent>
                        {exportData.length > 0 && (
                            <div className="bg-card p-3 rounded-lg shadow-sm mb-4">
                                <DataTableExport
                                    data={exportData}
                                    columns={columns}
                                    fileName="Income_Group_Report"
                                    title="Income Group Report"
                                    printRef={printRef}
                                />
                            </div>
                        )}
                        <div ref={printRef} className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted"><tr className="text-left"><th className="p-2">Income Head</th><th className="p-2">Total Amount (?)</th></tr></thead>
                                <tbody>
                                    {Object.entries(reportData).map(([head, data]) => (
                                        <tr key={head} className="border-b">
                                            <td className="p-2 font-medium">{head} ({data.count} {data.count > 1 ? 'items' : 'item'})</td>
                                            <td className="p-2 text-right">₹{data.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="font-bold bg-muted"><tr><td className="p-2 text-right">Grand Total</td><td className="p-2 text-right">₹{grandTotal.toFixed(2)}</td></tr></tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </DashboardLayout>
    );
};

export default IncomeGroupReport;

