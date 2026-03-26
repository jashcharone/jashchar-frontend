import React, { useState, useEffect, useMemo, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DataTableExport from '@/components/DataTableExport';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const BalanceFeesStatementReport = () => {
  const { school } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef();

  const columns = useMemo(() => [
    { key: 'enrollment_id', label: 'Enroll ID' },
    { key: 'student_name', label: 'Student Name' },
    { key: 'class_section', label: 'Class' },
    { key: 'fee_group', label: 'Fees Group' },
    { key: 'fee_code', label: 'Fees Code' },
    { key: 'due_date_formatted', label: 'Due Date' },
    { key: 'amount_formatted', label: 'Amount' },
    { key: 'paid_formatted', label: 'Paid' },
    { key: 'discount_formatted', label: 'Discount' },
    { key: 'balance_formatted', label: 'Balance' }
  ], []);

  const exportData = useMemo(() => {
    return reportData.map(row => ({
      ...row,
      class_section: `${row.class_name} (${row.section_name})`,
      due_date_formatted: format(new Date(row.due_date), 'dd-MM-yyyy'),
      amount_formatted: row.amount.toFixed(2),
      paid_formatted: row.paid.toFixed(2),
      discount_formatted: row.discount.toFixed(2),
      balance_formatted: row.balance.toFixed(2)
    }));
  }, [reportData]);

  useEffect(() => {
    if (!school?.id) return;
    const fetchClasses = async () => {
      const { data, error } = await supabase.from('classes').select('id, name').eq('branch_id', school.id);
      if (error) toast({ variant: 'destructive', title: 'Error fetching classes' });
      else setClasses(data);
    };
    fetchClasses();
  }, [school, toast]);

  useEffect(() => {
    const fetchSections = async () => {
      if (!selectedClass) {
        setSections([]);
        setSelectedSection('');
        return;
      }
      const { data, error } = await supabase.from('class_sections').select('sections(id, name)').eq('class_id', selectedClass);
      if (error) toast({ variant: 'destructive', title: 'Error fetching sections' });
      else setSections(data.map(item => item.sections));
    };
    fetchSections();
  }, [selectedClass, toast]);

  const handleSearch = async () => {
    if (!selectedClass) {
      toast({ variant: 'destructive', title: 'Please select a class.' });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc('get_fees_statement_for_class', {
      p_branch_id: school.id,
      p_class_id: selectedClass,
      p_section_id: selectedSection || null
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching report data', description: error.message });
      setReportData([]);
    } else {
      // Filter for balance > 0
      const balanceData = data.filter(row => row.balance > 0);
      setReportData(balanceData);
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Balance Fees Statement Report</h1>
      <div className="bg-card p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div><label>Class</label><Select value={selectedClass} onValueChange={setSelectedClass}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div><label>Section</label><Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}><SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger><SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading} className="w-full">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Search</Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="bg-card p-4 rounded-lg shadow-sm overflow-x-auto">
          {reportData.length > 0 && (
            <div className="bg-card p-3 rounded-lg shadow-sm mb-4">
              <DataTableExport
                data={exportData}
                columns={columns}
                fileName="Balance_Fees_Statement_Report"
                title="Balance Fees Statement"
                printRef={printRef}
              />
            </div>
          )}
          <div ref={printRef}>
          <h2 className="text-xl font-semibold mb-4 text-center">Balance Fees Statement</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-muted">
                <th className="p-2">Enroll ID</th>
                <th className="p-2">Student Name</th>
                <th className="p-2">Class</th>
                <th className="p-2">Fees Group</th>
                <th className="p-2">Fees Code</th>
                <th className="p-2">Due Date</th>
                <th className="p-2 text-right">Amount</th>
                <th className="p-2 text-right">Paid</th>
                <th className="p-2 text-right">Discount</th>
                <th className="p-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length > 0 ? reportData.map((row, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{row.enrollment_id}</td>
                  <td className="p-2">{row.student_name}</td>
                  <td className="p-2">{row.class_name} ({row.section_name})</td>
                  <td className="p-2">{row.fee_group}</td>
                  <td className="p-2">{row.fee_code}</td>
                  <td className="p-2">{format(new Date(row.due_date), 'dd-MM-yyyy')}</td>
                  <td className="p-2 text-right">{row.amount.toFixed(2)}</td>
                  <td className="p-2 text-right">{row.paid.toFixed(2)}</td>
                  <td className="p-2 text-right">{row.discount.toFixed(2)}</td>
                  <td className="p-2 text-right">{row.balance.toFixed(2)}</td>
                </tr>
              )) : (
                <tr><td colSpan="10" className="text-center py-10 text-muted-foreground">No balance fees found for the selected criteria.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default BalanceFeesStatementReport;
