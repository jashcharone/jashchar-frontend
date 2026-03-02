import React, { useState, useEffect, useMemo, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DataTableExport from '@/components/DataTableExport';

const BalanceFeesReport = () => {
    const { user, school } = useAuth();
    const { selectedBranch } = useBranch();
    const currencySymbol = school?.currency_symbol || '₹';
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [filters, setFilters] = useState({ class_id: '', section_id: 'all', search_type: 'balance' });
    const [reportData, setReportData] = useState(null);
    const [grandTotals, setGrandTotals] = useState({ total_fees: 0, paid_fees: 0, discount: 0, fine: 0, balance: 0 });
    const printRef = useRef();

    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    // Column definitions for export
    const columns = useMemo(() => [
        { key: 'student_name', label: 'Student Name' },
        { key: 'class_section', label: 'Class' },
        { key: 'admission_no', label: 'Admission No' },
        { key: 'roll_number', label: 'Roll Number' },
        { key: 'father_name', label: 'Father Name' },
        { key: 'total_fees', label: 'Total Fees' },
        { key: 'paid_fees', label: 'Paid Fees' },
        { key: 'discount', label: 'Discount' },
        { key: 'fine', label: 'Fine' },
        { key: 'balance', label: 'Balance' },
    ], []);

    // Transform data for export
    const exportData = useMemo(() => {
        if (!reportData) return [];
        return reportData.map(row => ({
            ...row,
            class_section: `${row.class_name} (${row.section_name})`,
            total_fees: Number(row.total_fees).toFixed(2),
            paid_fees: Number(row.paid_fees).toFixed(2),
            discount: Number(row.discount).toFixed(2),
            fine: Number(row.fine).toFixed(2),
            balance: Number(row.balance).toFixed(2),
        }));
    }, [reportData]);

    useEffect(() => {
        const fetchClasses = async () => {
            if (!branchId) return;
            const { data, error } = await supabase.from('classes').select('id, name').eq('branch_id', branchId);
            if (error) toast({ variant: 'destructive', title: 'Error fetching classes' });
            else setClasses(data);
        };
        fetchClasses();
    }, [branchId, toast]);

    useEffect(() => {
        if (filters.class_id) {
            const fetchSections = async () => {
                const { data } = await supabase.from('class_sections').select('sections(id, name)').eq('class_id', filters.class_id);
                setSections(data ? data.map(item => item.sections).filter(Boolean) : []);
            };
            fetchSections();
        } else {
            setSections([]);
        }
    }, [filters.class_id]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        if (key === 'class_id') setFilters(prev => ({ ...prev, section_id: 'all' }));
    };

    const handleSearch = async () => {
        if (!filters.class_id) {
            toast({ variant: 'destructive', title: 'Please select a class.' });
            return;
        }
        setLoading(true);
        setReportData(null);

        const { data, error } = await supabase.rpc('get_balance_fees_report', {
            p_branch_id: branchId,
            p_class_id: filters.class_id,
            p_section_id: filters.section_id === 'all' ? null : filters.section_id,
            p_search_type: filters.search_type
        });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching report data', description: error.message });
        } else {
            setReportData(data);
            const totals = data.reduce((acc, row) => ({
                total_fees: acc.total_fees + Number(row.total_fees),
                paid_fees: acc.paid_fees + Number(row.paid_fees),
                discount: acc.discount + Number(row.discount),
                fine: acc.fine + Number(row.fine),
                balance: acc.balance + Number(row.balance),
            }), { total_fees: 0, paid_fees: 0, discount: 0, fine: 0, balance: 0 });
            setGrandTotals(totals);
        }
        setLoading(false);
    };

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-6">Balance Fees Report</h1>
            <Card className="mb-6">
                <CardHeader><CardTitle>Select Criteria</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="text-sm">Class *</label>
                            <Select value={filters.class_id} onValueChange={v => handleFilterChange('class_id', v)}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div>
                            <label className="text-sm">Section</label>
                            <Select value={filters.section_id} onValueChange={v => handleFilterChange('section_id', v)} disabled={!filters.class_id}><SelectTrigger><SelectValue placeholder="All Sections" /></SelectTrigger><SelectContent><SelectItem value="all">All Sections</SelectItem>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div>
                            <label className="text-sm">Search Type</label>
                            <Select value={filters.search_type} onValueChange={v => handleFilterChange('search_type', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="balance">With Balance</SelectItem><SelectItem value="paid">Fully Paid</SelectItem><SelectItem value="all">All Students</SelectItem></SelectContent></Select>
                        </div>
                        <Button onClick={handleSearch} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Search />} Search</Button>
                    </div>
                </CardContent>
            </Card>

            {reportData && (
                <>
                    {/* Export Buttons */}
                    <div className="bg-card p-3 rounded-lg shadow-sm mb-4">
                        <DataTableExport
                            data={exportData}
                            columns={columns}
                            fileName={`Balance_Fees_Report`}
                            title="Balance Fees Report"
                            printRef={printRef}
                        />
                    </div>

                    <Card>
                        <CardHeader><CardTitle>Balance Fees Report</CardTitle></CardHeader>
                        <CardContent>
                            <div ref={printRef} className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                        <tr className="text-left">
                                            {['Student Name', 'Class', 'Admission No', 'Roll Number', 'Father Name', 'Total Fees', 'Paid Fees', 'Discount', 'Fine', 'Balance'].map(h => <th key={h} className="p-2">{h}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((row, idx) => (
                                            <tr key={idx} className="border-b">
                                                <td className="p-2">{row.student_name}</td>
                                                <td className="p-2">{row.class_name} ({row.section_name})</td>
                                                <td className="p-2">{row.admission_no}</td>
                                                <td className="p-2">{row.roll_number}</td>
                                                <td className="p-2">{row.father_name}</td>
                                                <td className="p-2 text-right">{currencySymbol}{Number(row.total_fees).toFixed(2)}</td>
                                                <td className="p-2 text-right">{currencySymbol}{Number(row.paid_fees).toFixed(2)}</td>
                                                <td className="p-2 text-right">{currencySymbol}{Number(row.discount).toFixed(2)}</td>
                                                <td className="p-2 text-right">{currencySymbol}{Number(row.fine).toFixed(2)}</td>
                                                <td className="p-2 text-right font-bold">{currencySymbol}{Number(row.balance).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="font-bold bg-muted">
                                        <tr>
                                            <td colSpan="5" className="p-2 text-right">Grand Total</td>
                                            <td className="p-2 text-right">{currencySymbol}{grandTotals.total_fees.toFixed(2)}</td>
                                            <td className="p-2 text-right">{currencySymbol}{grandTotals.paid_fees.toFixed(2)}</td>
                                            <td className="p-2 text-right">{currencySymbol}{grandTotals.discount.toFixed(2)}</td>
                                            <td className="p-2 text-right">{currencySymbol}{grandTotals.fine.toFixed(2)}</td>
                                            <td className="p-2 text-right">{currencySymbol}{grandTotals.balance.toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </DashboardLayout>
    );
};

export default BalanceFeesReport;
