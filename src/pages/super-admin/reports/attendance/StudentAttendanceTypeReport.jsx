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

const StudentAttendanceTypeReport = () => {
  const { school } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef();

  const columns = useMemo(() => [
    { key: 'student_name', label: 'Student Name' },
    { key: 'roll_number', label: 'Roll No' },
    { key: 'class_section', label: 'Class' },
    { key: 'date_formatted', label: 'Date' },
    { key: 'status', label: 'Status' },
    { key: 'note', label: 'Note' }
  ], []);

  const exportData = useMemo(() => {
    return reportData.map(row => ({
      student_name: row.student?.full_name || '',
      roll_number: row.student?.roll_number || '',
      class_section: `${row.student?.class?.name || ''} (${row.student?.section?.name || ''})`,
      date_formatted: format(new Date(row.date), 'dd-MM-yyyy'),
      status: row.status || '',
      note: row.note || ''
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
    
    let query = supabase
      .from('student_attendance')
      .select(`
        date,
        status,
        note,
        student:profiles (
          full_name,
          roll_number,
          class:classes!student_profiles_class_id_fkey(name),
          section:sections (name)
        )
      `)
      .eq('branch_id', school.id)
      .eq('student.class_id', selectedClass)
      .gte('date', dateFrom)
      .lte('date', dateTo);

    if (selectedSection) {
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

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Student Attendance Type Report</h1>
      <div className="bg-card p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div><label>Class</label><Select value={selectedClass} onValueChange={setSelectedClass}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div><label>Section</label><Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}><SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger><SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
          <div><label>Date From</label><DatePicker value={dateFrom} onChange={setDateFrom} /></div>
          <div><label>Date To</label><DatePicker value={dateTo} onChange={setDateTo} /></div>
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
                fileName="Student_Attendance_Type_Report"
                title="Student Attendance Type Report"
                printRef={printRef}
              />
            </div>
          )}
          <div ref={printRef}>
          <h2 className="text-xl font-semibold mb-4 text-center">Student Attendance Type Report</h2>
          <p className="text-center text-sm mb-4">From {format(new Date(dateFrom), 'dd-MM-yyyy')} to {format(new Date(dateTo), 'dd-MM-yyyy')}</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-muted">
                <th className="p-2">Student Name</th>
                <th className="p-2">Roll No</th>
                <th className="p-2">Class</th>
                <th className="p-2">Date</th>
                <th className="p-2">Status</th>
                <th className="p-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length > 0 ? reportData.map((row, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{row.student.full_name}</td>
                  <td className="p-2">{row.student.roll_number}</td>
                  <td className="p-2">{row.student.class.name} ({row.student.section.name})</td>
                  <td className="p-2">{format(new Date(row.date), 'dd-MM-yyyy')}</td>
                  <td className="p-2">{row.status}</td>
                  <td className="p-2">{row.note}</td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="text-center py-10 text-muted-foreground">No data found for the selected criteria.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentAttendanceTypeReport;
