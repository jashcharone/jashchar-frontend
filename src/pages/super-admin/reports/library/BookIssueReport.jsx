import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Search, Loader2, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

const BookIssueReport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchType, setSearchType] = useState('this_month');
  const [memberType, setMemberType] = useState('all');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const printRef = React.useRef();

  const handleSearch = async () => {
    setLoading(true);
    
    // Date calculation
    let fromDate, toDate;
    const today = new Date();
    
    if (searchType === 'today') {
      fromDate = format(today, 'yyyy-MM-dd');
      toDate = format(today, 'yyyy-MM-dd');
    } else if (searchType === 'this_month') {
      fromDate = format(startOfMonth(today), 'yyyy-MM-dd');
      toDate = format(endOfMonth(today), 'yyyy-MM-dd');
    } else if (searchType === 'last_30_days') {
      fromDate = format(subDays(today, 30), 'yyyy-MM-dd');
      toDate = format(today, 'yyyy-MM-dd');
    } else {
      // All time (defaulting to a wide range or omit filter)
      fromDate = '2000-01-01';
      toDate = '2100-01-01';
    }

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
          student:student_profiles(school_code, full_name),
          staff:employee_profiles(full_name)
        )
      `)
      .eq('branch_id', user.user_metadata.branch_id)
      .gte('issue_date', fromDate)
      .lte('issue_date', toDate);

    if (memberType !== 'all') {
      query = query.eq('member.member_type', memberType);
    }

    const { data, error } = await query;

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching report', description: error.message });
      setReportData([]);
    } else {
      setReportData(data || []);
    }
    setLoading(false);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Book Issue Report</h1>
      <div className="bg-card p-4 rounded-lg shadow mb-6 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-sm font-medium">Search Type</label>
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                <SelectItem value="all_time">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
            <Button variant="outline" onClick={handlePrint} disabled={reportData.length === 0}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </div>
        </div>
      </div>

      <div ref={printRef} className="bg-card p-6 rounded-lg shadow overflow-x-auto border border-border">
        <h2 className="text-xl font-bold mb-4 text-center">Book Issue Report</h2>
        <table className="w-full text-sm text-left">
          <thead className="bg-muted uppercase border-b border-border">
            <tr>
              <th className="px-4 py-3">Book Title</th>
              <th className="px-4 py-3">Book No</th>
              <th className="px-4 py-3">Issue Date</th>
              <th className="px-4 py-3">Due Return</th>
              <th className="px-4 py-3">Member ID</th>
              <th className="px-4 py-3">Card No</th>
              <th className="px-4 py-3">Adm No</th>
              <th className="px-4 py-3">Member Name</th>
              <th className="px-4 py-3">Type</th>
            </tr>
          </thead>
          <tbody>
            {reportData.length === 0 ? (
              <tr><td colSpan="9" className="text-center py-4">No data found</td></tr>
            ) : (
              reportData.map((item, idx) => (
                <tr key={idx} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3">{item.book?.book_title}</td>
                  <td className="px-4 py-3">{item.book?.book_number}</td>
                  <td className="px-4 py-3">{item.issue_date}</td>
                  <td className="px-4 py-3">{item.due_date}</td>
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
    </DashboardLayout>
  );
};

export default BookIssueReport;
