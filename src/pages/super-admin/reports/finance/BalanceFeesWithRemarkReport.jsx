import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReactToPrint } from 'react-to-print';

const BalanceFeesWithRemarkReport = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [filters, setFilters] = useState({ class_id: '', section_id: 'all' });
    const [reportData, setReportData] = useState(null);
    const printRef = useRef();

    const branchId = user?.profile?.branch_id;

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

        const { data, error } = await supabase.rpc('get_balance_fees_report_with_remark', {
            p_branch_id: branchId,
            p_class_id: filters.class_id,
            p_section_id: filters.section_id === 'all' ? null : filters.section_id
        });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching report data', description: error.message });
        } else {
            setReportData(data);
        }
        setLoading(false);
    };

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
    });

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-6">Balance Fees Report With Remark</h1>
            <Card className="mb-6">
                <CardHeader><CardTitle>Select Criteria</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="text-sm">Class *</label>
                            <Select value={filters.class_id} onValueChange={v => handleFilterChange('class_id', v)}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div>
                            <label className="text-sm">Section</label>
                            <Select value={filters.section_id} onValueChange={v => handleFilterChange('section_id', v)} disabled={!filters.class_id}><SelectTrigger><SelectValue placeholder="All Sections" /></SelectTrigger><SelectContent><SelectItem value="all">All Sections</SelectItem>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <Button onClick={handleSearch} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Search />} Search</Button>
                    </div>
                </CardContent>
            </Card>

            {reportData && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Balance Fees Report With Remark</CardTitle>
                        <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
                    </CardHeader>
                    <CardContent ref={printRef}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted">
                                    <tr className="text-left">
                                        {['Student Name (Admission No)', 'Class', 'Fees', 'Amount', 'Paid', 'Balance', 'Guardian Phone', 'Remark'].map(h => <th key={h} className="p-2">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((row, idx) => (
                                        <tr key={idx} className="border-b">
                                            <td className="p-2">{row.student_name} ({row.admission_no})</td>
                                            <td className="p-2">{row.class_name} ({row.section_name})</td>
                                            <td className="p-2">
                                                <ul>
                                                    {row.fees_details?.map((fee, i) => <li key={i}>{fee}</li>)}
                                                </ul>
                                            </td>
                                            <td className="p-2 text-right">₹{Number(row.total_amount).toFixed(2)}</td>
                                            <td className="p-2 text-right">₹{Number(row.total_paid).toFixed(2)}</td>
                                            <td className="p-2 text-right font-bold">₹{Number(row.balance).toFixed(2)}</td>
                                            <td className="p-2">{row.guardian_phone}</td>
                                            <td className="p-2 border-l border-dashed"></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </DashboardLayout>
    );
};

export default BalanceFeesWithRemarkReport;
