import React, { useState, useMemo, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DataTableExport from '@/components/DataTableExport';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const BookDueReport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [memberType, setMemberType] = useState('all');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef();

  const columns = useMemo(() => [
    { key: 'book_title', label: 'Book Title' },
    { key: 'book_number', label: 'Book No' },
    { key: 'issue_date', label: 'Issue Date' },
    { key: 'due_date', label: 'Due Return' },
    { key: 'member_id_short', label: 'Member ID' },
    { key: 'library_card_no', label: 'Card No' },
    { key: 'enrollment_id', label: 'Enroll ID' },
    { key: 'member_name', label: 'Member Name' },
    { key: 'member_type', label: 'Type' }
  ], []);

  const exportData = useMemo(() => {
    return reportData.map(item => ({
      book_title: item.book?.book_title || '',
      book_number: item.book?.book_number || '',
      issue_date: item.issue_date || '',
      due_date: item.due_date || '',
      member_id_short: item.member?.id?.slice(0, 8) || '',
      library_card_no: item.member?.library_card_no || '',
      enrollment_id: item.member?.student?.enrollment_id || '-',
      member_name: item.member?.member_type === 'student' ? item.member?.student?.full_name : item.member?.staff?.full_name || '',
      member_type: item.member?.member_type || ''
    }));
  }, [reportData]);

  const handleSearch = async () => {
    setLoading(true);
    const today = format(new Date(), 'yyyy-MM-dd');

    let query = supabase
      .from('book_issues')
      .select(`
        issue_date,
        due_date,
        book:books(book_title, book_number),
        member:library_members(
          id,
          library_card_no, 
          member_type,
          student:student_profiles(enrollment_id, full_name),
          staff:employee_profiles(full_name)
        )
      `)
      .eq('branch_id', user.user_metadata.branch_id)
      .eq('is_returned', false)
      .lt('due_date', today); // Due date is before today

    if (memberType !== 'all') {
      // Client-side filter for member type as nested filter is complex
      // Or filter after fetch
    }

    const { data, error } = await query;

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      setReportData([]);
    } else {
      let filtered = data || [];
      if (memberType !== 'all') {
        filtered = filtered.filter(item => item.member?.member_type === memberType);
      }
      setReportData(filtered);
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Book Due Report</h1>
      <div className="bg-card p-4 rounded-lg shadow mb-6 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-sm font-medium">Member Type</label>
            <Select value={memberType} onValueChange={setMemberType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />} Search
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg shadow overflow-x-auto border border-border">
        {reportData.length > 0 && (
          <div className="bg-card p-3 rounded-lg shadow-sm mb-4">
            <DataTableExport
              data={exportData}
              columns={columns}
              fileName="Book_Due_Report"
              title="Book Due Report"
              printRef={printRef}
            />
          </div>
        )}
        <div ref={printRef}>
        <h2 className="text-xl font-bold mb-4 text-center">Book Due Report</h2>
        <table className="w-full text-sm text-left">
          <thead className="bg-muted uppercase border-b border-border">
            <tr>
              <th className="px-4 py-3">Book Title</th>
              <th className="px-4 py-3">Book No</th>
              <th className="px-4 py-3">Issue Date</th>
              <th className="px-4 py-3">Due Return</th>
              <th className="px-4 py-3">Member ID</th>
              <th className="px-4 py-3">Card No</th>
              <th className="px-4 py-3">Enroll ID</th>
              <th className="px-4 py-3">Member Name</th>
              <th className="px-4 py-3">Type</th>
            </tr>
          </thead>
          <tbody>
            {reportData.length === 0 ? (
              <tr><td colSpan="9" className="text-center py-4">No due books found</td></tr>
            ) : (
              reportData.map((item, idx) => (
                <tr key={idx} className="border-b border-border hover:bg-muted/50 bg-red-50 dark:bg-red-900/20">
                  <td className="px-4 py-3">{item.book?.book_title}</td>
                  <td className="px-4 py-3">{item.book?.book_number}</td>
                  <td className="px-4 py-3">{item.issue_date}</td>
                  <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400">{item.due_date}</td>
                  <td className="px-4 py-3">{item.member?.id.slice(0,8)}</td>
                  <td className="px-4 py-3">{item.member?.library_card_no}</td>
                  <td className="px-4 py-3">{item.member?.student?.enrollment_id || '-'}</td>
                  <td className="px-4 py-3">
                    {item.member?.member_type === 'student' ? item.member?.student?.full_name : item.member?.staff?.full_name}
                  </td>
                  <td className="px-4 py-3 capitalize">{item.member?.member_type}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BookDueReport;
