import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DatePicker from '@/components/ui/DatePicker';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Search, Loader2, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';

const FeesCollectionReport = () => {
  const { school } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [collectors, setCollectors] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedFeeType, setSelectedFeeType] = useState('all');
  const [selectedCollector, setSelectedCollector] = useState('all');
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const printRef = React.useRef();

  useEffect(() => {
    if (!school?.id) return;

    const fetchInitialData = async () => {
      const { data: roleData } = await supabase.from('roles').select('id').in('name', ['admin', 'school_owner', 'accountant', 'receptionist']);
      const roleIds = roleData ? roleData.map(r => r.id) : [];

      const [classRes, feeTypeRes, collectorRes] = await Promise.all([
        supabase.from('classes').select('id, name').eq('branch_id', school.id),
        supabase.from('fee_types').select('id, name').eq('branch_id', school.id),
        supabase.from('profiles').select('id, full_name').eq('branch_id', school.id).in('role_id', roleIds)
      ]);

      if (classRes.error) toast({ variant: 'destructive', title: 'Error fetching classes' });
      else setClasses(classRes.data);

      if (feeTypeRes.error) toast({ variant: 'destructive', title: 'Error fetching fee types' });
      else setFeeTypes(feeTypeRes.data);

      if (collectorRes.error) toast({ variant: 'destructive', title: 'Error fetching collectors' });
      else setCollectors(collectorRes.data);
    };

    fetchInitialData();
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
    const { data, error } = await supabase.rpc('get_fees_collection_report', {
      p_branch_id: school.id,
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_class_id: selectedClass === 'all' ? null : selectedClass,
      p_section_id: selectedSection === 'all' ? null : selectedSection,
      p_fee_type_id: selectedFeeType === 'all' ? null : selectedFeeType,
      p_collected_by: selectedCollector === 'all' ? null : selectedCollector,
      p_group_by: 'date' // Or make this dynamic if needed
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching report data', description: error.message });
      setReportData([]);
    } else {
      setReportData(data);
    }
    setLoading(false);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  const totalPaid = reportData.reduce((sum, row) => sum + row.paid, 0);
  const totalDiscount = reportData.reduce((sum, row) => sum + row.discount, 0);
  const totalFine = reportData.reduce((sum, row) => sum + row.fine, 0);
  const grandTotal = reportData.reduce((sum, row) => sum + row.total, 0);

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Fees Collection Report</h1>
      <div className="bg-card p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <DatePicker label="Date From" value={dateFrom} onChange={setDateFrom} />
          <DatePicker label="Date To" value={dateTo} onChange={setDateTo} />
          <div><label>Class</label><Select value={selectedClass} onValueChange={setSelectedClass}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Classes</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div><label>Section</label><Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass || selectedClass === 'all'}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Sections</SelectItem>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
          <div><label>Fee Type</label><Select value={selectedFeeType} onValueChange={setSelectedFeeType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Fee Types</SelectItem>{feeTypes.map(ft => <SelectItem key={ft.id} value={ft.id}>{ft.name}</SelectItem>)}</SelectContent></Select></div>
          <div><label>Collected By</label><Select value={selectedCollector} onValueChange={setSelectedCollector}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Collectors</SelectItem>{collectors.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent></Select></div>
          <div className="col-span-1 md:col-span-2 flex gap-2">
            <Button onClick={handleSearch} disabled={loading} className="w-full">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Search</Button>
            <Button onClick={handlePrint} variant="outline" className="w-full" disabled={reportData.length === 0}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>
      ) : (
        <div ref={printRef} className="bg-card p-4 rounded-lg shadow-sm overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4 text-center">Fees Collection Report</h2>
          <p className="text-center text-sm mb-4">From {format(new Date(dateFrom), 'dd-MM-yyyy')} to {format(new Date(dateTo), 'dd-MM-yyyy')}</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-muted">
                <th className="p-2">Payment ID</th>
                <th className="p-2">Date</th>
                <th className="p-2">Admission No</th>
                <th className="p-2">Name</th>
                <th className="p-2">Class</th>
                <th className="p-2">Fee Type</th>
                <th className="p-2">Collected By</th>
                <th className="p-2">Mode</th>
                <th className="p-2 text-right">Paid</th>
                <th className="p-2 text-right">Discount</th>
                <th className="p-2 text-right">Fine</th>
                <th className="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length > 0 ? reportData.map(row => (
                <tr key={row.payment_id} className="border-b">
                  <td className="p-2">{row.payment_id.substring(0, 8)}</td>
                  <td className="p-2">{format(new Date(row.date), 'dd-MM-yyyy')}</td>
                  <td className="p-2">{row.admission_no}</td>
                  <td className="p-2">{row.student_name}</td>
                  <td className="p-2">{row.class_name} ({row.section_name})</td>
                  <td className="p-2">{row.fee_type}</td>
                  <td className="p-2">{row.collected_by}</td>
                  <td className="p-2">{row.mode}</td>
                  <td className="p-2 text-right">{row.paid.toFixed(2)}</td>
                  <td className="p-2 text-right">{row.discount.toFixed(2)}</td>
                  <td className="p-2 text-right">{row.fine.toFixed(2)}</td>
                  <td className="p-2 text-right">{row.total.toFixed(2)}</td>
                </tr>
              )) : (
                <tr><td colSpan="12" className="text-center py-10 text-muted-foreground">No data found for the selected criteria.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-muted">
                <td colSpan="8" className="p-2 text-right">Grand Total:</td>
                <td className="p-2 text-right">{totalPaid.toFixed(2)}</td>
                <td className="p-2 text-right">{totalDiscount.toFixed(2)}</td>
                <td className="p-2 text-right">{totalFine.toFixed(2)}</td>
                <td className="p-2 text-right">{grandTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default FeesCollectionReport;
