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

const FeesStatementReport = () => {
  const { school } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef();

  const columns = useMemo(() => [
    { key: 'fee_group', label: 'Fees Group' },
    { key: 'fee_code', label: 'Fees Code' },
    { key: 'due_date_formatted', label: 'Due Date' },
    { key: 'status', label: 'Status' },
    { key: 'amount', label: 'Amount' },
    { key: 'payment_id_short', label: 'Payment ID' },
    { key: 'payment_mode', label: 'Mode' },
    { key: 'payment_date_formatted', label: 'Date' },
    { key: 'paid', label: 'Paid' },
    { key: 'discount', label: 'Discount' },
    { key: 'fine', label: 'Fine' },
    { key: 'balance', label: 'Balance' }
  ], []);

  const exportData = useMemo(() => {
    return reportData.map(row => ({
      ...row,
      due_date_formatted: format(new Date(row.due_date), 'dd-MM-yyyy'),
      payment_id_short: row.payment_id?.substring(0, 8) || '',
      payment_date_formatted: row.payment_date ? format(new Date(row.payment_date), 'dd-MM-yyyy') : '',
      amount: row.amount.toFixed(2),
      paid: row.paid.toFixed(2),
      discount: row.discount.toFixed(2),
      fine: row.fine.toFixed(2),
      balance: row.balance.toFixed(2)
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

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass || !selectedSection) {
        setStudents([]);
        setSelectedStudent('');
        return;
      }
      // Use student_profiles table for student data
      const { data, error } = await supabase.from('student_profiles').select('id, full_name').eq('class_id', selectedClass).eq('section_id', selectedSection);
      if (error) toast({ variant: 'destructive', title: 'Error fetching students' });
      else setStudents(data || []);
    };
    fetchStudents();
  }, [selectedClass, selectedSection, toast]);

  const handleSearch = async () => {
    if (!selectedStudent) {
      toast({ variant: 'destructive', title: 'Please select a student.' });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc('get_fees_statement', { p_student_id: selectedStudent });

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching report data', description: error.message });
      setReportData([]);
    } else {
      setReportData(data);
    }
    setLoading(false);
  };

  const totalAmount = reportData.reduce((sum, row) => sum + row.amount, 0);
  const totalPaid = reportData.reduce((sum, row) => sum + row.paid, 0);
  const totalDiscount = reportData.reduce((sum, row) => sum + row.discount, 0);
  const totalFine = reportData.reduce((sum, row) => sum + row.fine, 0);
  const totalBalance = reportData.reduce((sum, row) => sum + row.balance, 0);

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Fees Statement Report</h1>
      <div className="bg-card p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div><label>Class</label><Select value={selectedClass} onValueChange={setSelectedClass}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div><label>Section</label><Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}><SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger><SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
          <div><label>Student</label><Select value={selectedStudent} onValueChange={setSelectedStudent} disabled={!selectedSection}><SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger><SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent></Select></div>
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
                fileName="Fees_Statement_Report"
                title="Fees Statement"
                printRef={printRef}
              />
            </div>
          )}
          <div ref={printRef}>
          <h2 className="text-xl font-semibold mb-4 text-center">Fees Statement</h2>
          {selectedStudent && <p className="text-center text-sm mb-4">Student: {students.find(s => s.id === selectedStudent)?.full_name}</p>}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-muted">
                <th className="p-2">Fees Group</th>
                <th className="p-2">Fees Code</th>
                <th className="p-2">Due Date</th>
                <th className="p-2">Status</th>
                <th className="p-2 text-right">Amount</th>
                <th className="p-2">Payment ID</th>
                <th className="p-2">Mode</th>
                <th className="p-2">Date</th>
                <th className="p-2 text-right">Paid</th>
                <th className="p-2 text-right">Discount</th>
                <th className="p-2 text-right">Fine</th>
                <th className="p-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length > 0 ? reportData.map((row, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{row.fee_group}</td>
                  <td className="p-2">{row.fee_code}</td>
                  <td className="p-2">{format(new Date(row.due_date), 'dd-MM-yyyy')}</td>
                  <td className="p-2">{row.status}</td>
                  <td className="p-2 text-right">{row.amount.toFixed(2)}</td>
                  <td className="p-2">{row.payment_id?.substring(0, 8)}</td>
                  <td className="p-2">{row.payment_mode}</td>
                  <td className="p-2">{row.payment_date ? format(new Date(row.payment_date), 'dd-MM-yyyy') : ''}</td>
                  <td className="p-2 text-right">{row.paid.toFixed(2)}</td>
                  <td className="p-2 text-right">{row.discount.toFixed(2)}</td>
                  <td className="p-2 text-right">{row.fine.toFixed(2)}</td>
                  <td className="p-2 text-right">{row.balance.toFixed(2)}</td>
                </tr>
              )) : (
                <tr><td colSpan="12" className="text-center py-10 text-muted-foreground">No data found for the selected student.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-muted">
                <td colSpan="4" className="p-2 text-right">Grand Total:</td>
                <td className="p-2 text-right">{totalAmount.toFixed(2)}</td>
                <td colSpan="3"></td>
                <td className="p-2 text-right">{totalPaid.toFixed(2)}</td>
                <td className="p-2 text-right">{totalDiscount.toFixed(2)}</td>
                <td className="p-2 text-right">{totalFine.toFixed(2)}</td>
                <td className="p-2 text-right">{totalBalance.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default FeesStatementReport;
