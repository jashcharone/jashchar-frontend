import React, { useState, useEffect, useMemo, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DataTableExport from '@/components/DataTableExport';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DatePicker from '@/components/ui/DatePicker';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const OnlineFeesCollectionReport = () => {
  const { school, currentSessionId } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef();

  const columns = useMemo(() => [
    { key: 'payment_date_formatted', label: 'Date' },
    { key: 'admission_no', label: 'Admission No' },
    { key: 'student_name', label: 'Name' },
    { key: 'class_section', label: 'Class' },
    { key: 'transaction_id', label: 'Transaction ID' },
    { key: 'total_amount', label: 'Amount' }
  ], []);

  const exportData = useMemo(() => {
    return reportData.map(row => ({
      payment_date_formatted: format(new Date(row.payment_date), 'dd-MM-yyyy'),
      admission_no: row.student?.school_code || '',
      student_name: row.student?.full_name || '',
      class_section: `${row.student?.class?.name || ''} (${row.student?.section?.name || ''})`,
      transaction_id: row.transaction_id || '',
      total_amount: (row.amount + (row.fine_paid || 0)).toFixed(2)
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
      if (!selectedClass || selectedClass === 'all') {
        setSections([]);
        setSelectedSection('all');
        return;
      }
      const { data, error } = await supabase.from('class_sections').select('sections(id, name)').eq('class_id', selectedClass);
      if (error) toast({ variant: 'destructive', title: 'Error fetching sections' });
      else setSections(data.map(item => item.sections));
    };
    fetchSections();
  }, [selectedClass, toast]);

  const handleSearch = async () => {
    setLoading(true);
    let query = supabase
      .from('fee_payments')
      .select(`
        id,
        payment_date,
        transaction_id,
        amount,
        fine_paid,
        student:profiles (
          full_name,
          school_code,
          class:classes!student_profiles_class_id_fkey(name),
          section:sections (name)
        )
      `)
      .eq('branch_id', school.id)
      .in('payment_mode', ['Online', 'Card', 'UPI'])
      .gte('payment_date', dateFrom)
      .lte('payment_date', dateTo);
    
    // Add session filter if available
    if (currentSessionId) {
      query = query.eq('session_id', currentSessionId);
    }

    if (selectedClass !== 'all') {
      query = query.eq('student.class_id', selectedClass);
    }
    if (selectedSection !== 'all') {
      query = query.eq('student.section_id', selectedSection);
    }

    const { data, error } = await query;

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching report data', description: error.message });
      setReportData([]);
    } else {
      setReportData(data);
    }
    setLoading(false);
  };

  const grandTotal = reportData.reduce((sum, row) => sum + row.amount + (row.fine_paid || 0), 0);

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Online Fees Collection Report</h1>
      <div className="bg-card p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div><label>Date From</label><DatePicker value={dateFrom} onChange={setDateFrom} /></div>
          <div><label>Date To</label><DatePicker value={dateTo} onChange={setDateTo} /></div>
          <div><label>Class</label><Select value={selectedClass} onValueChange={setSelectedClass}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Classes</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div><label>Section</label><Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass || selectedClass === 'all'}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Sections</SelectItem>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="col-span-1 md:col-span-4 flex gap-2">
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
                fileName="Online_Fees_Collection_Report"
                title="Online Fees Collection Report"
                printRef={printRef}
              />
            </div>
          )}
          <div ref={printRef}>
          <h2 className="text-xl font-semibold mb-4 text-center">Online Fees Collection Report</h2>
          <p className="text-center text-sm mb-4">From {format(new Date(dateFrom), 'dd-MM-yyyy')} to {format(new Date(dateTo), 'dd-MM-yyyy')}</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-muted">
                <th className="p-2">Date</th>
                <th className="p-2">Admission No</th>
                <th className="p-2">Name</th>
                <th className="p-2">Class</th>
                <th className="p-2">Transaction ID</th>
                <th className="p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length > 0 ? reportData.map(row => (
                <tr key={row.id} className="border-b">
                  <td className="p-2">{format(new Date(row.payment_date), 'dd-MM-yyyy')}</td>
                  <td className="p-2">{row.student.school_code}</td>
                  <td className="p-2">{row.student.full_name}</td>
                  <td className="p-2">{row.student.class.name} ({row.student.section.name})</td>
                  <td className="p-2">{row.transaction_id}</td>
                  <td className="p-2 text-right">{(row.amount + (row.fine_paid || 0)).toFixed(2)}</td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="text-center py-10 text-muted-foreground">No data found for the selected criteria.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-muted">
                <td colSpan="5" className="p-2 text-right">Grand Total:</td>
                <td className="p-2 text-right">{grandTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default OnlineFeesCollectionReport;
