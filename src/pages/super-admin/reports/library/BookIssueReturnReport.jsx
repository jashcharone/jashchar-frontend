import React, { useState, useMemo, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DataTableExport from '@/components/DataTableExport';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Search, Loader2 } from 'lucide-react';

const BookIssueReturnReport = () => {
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
    { key: 'return_date', label: 'Return Date' },
    { key: 'member_id_short', label: 'Member ID' },
    { key: 'library_card_no', label: 'Card No' },
    { key: 'admission_no', label: 'Adm No' },
    { key: 'member_name', label: 'Member Name' },
    { key: 'member_type', label: 'Type' }
  ], []);

  const exportData = useMemo(() => {
    return reportData.map(item => ({
      book_title: item.book?.book_title || '',
      book_number: item.book?.book_number || '',
      issue_date: item.issue_date || '',
      return_date: item.return_date || '',
      member_id_short: item.member?.id?.slice(0, 8) || '',
      library_card_no: item.member?.library_card_no || '',
      admission_no: item.member?.student?.school_code || '-',
      member_name: item.member?.member_type === 'student' ? item.member?.student?.full_name : item.member?.staff?.full_name || '',
      member_type: item.member?.member_type || ''
    }));
  }, [reportData]);

  const handleSearch = async () => {
    setLoading(true);
    
    // Fetch all history (returned books)
    let query = supabase
      .from('book_issues')
      .select(`
        issue_date,
        due_date,
        return_date,
        is_returned,
        book:books(book_title, book_number),
        member:library_members(
          id,
          library_card_no, 
          member_type,
          student:student_profiles(school_code, full_name),
          staff:employee_profiles(full_name)
        )
      `)
      .eq('branch_id', user.user_metadata.branch_id)
      .eq('is_returned', true); // Only returned books

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
      <h1 className="text-2xl font-bold mb-4">Book Issue Return Report</h1>
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
              fileName="Book_Issue_Return_Report"
              title="Book Issue Return Report"
              printRef={printRef}
            />
          </div>
        )}
        <div ref={printRef}>
        <h2 className="text-xl font-bold mb-4 text-center">Book Issue Return Report</h2>
        <table className="w-full text-sm text-left">
          <thead className="bg-muted uppercase border-b border-border">
            <tr>
              <th className="px-4 py-3">Book Title</th>
              <th className="px-4 py-3">Book No</th>
              <th className="px-4 py-3">Issue Date</th>
              <th className="px-4 py-3">Return Date</th>
              <th className="px-4 py-3">Member ID</th>
              <th className="px-4 py-3">Card No</th>
              <th className="px-4 py-3">Adm No</th>
              <th className="px-4 py-3">Member Name</th>
              <th className="px-4 py-3">Type</th>
            </tr>
          </thead>
          <tbody>
            {reportData.length === 0 ? (
              <tr><td colSpan="9" className="text-center py-4">No returned books found</td></tr>
            ) : (
              reportData.map((item, idx) => (
                <tr key={idx} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3">{item.book?.book_title}</td>
                  <td className="px-4 py-3">{item.book?.book_number}</td>
                  <td className="px-4 py-3">{item.issue_date}</td>
                  <td className="px-4 py-3 text-green-600 dark:text-green-400 font-medium">{item.return_date}</td>
                  <td className="px-4 py-3">{item.member?.id.slice(0,8)}</td>
                  <td className="px-4 py-3">{item.member?.library_card_no}</td>
                  <td className="px-4 py-3">{item.member?.student?.school_code || '-'}</td>
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

export default BookIssueReturnReport;
