import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, FileText, Printer, FileSpreadsheet, Search } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isSameDay } from 'date-fns';

const StudentCoursePurchaseReport = ({ branchId }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    searchType: 'this_month',
    paymentType: 'all',
    paymentStatus: 'all',
    usersType: 'all'
  });

  // Date ranges logic
  const getDateRange = (type) => {
    const now = new Date();
    if (type === 'today') return { start: now, end: now };
    if (type === 'this_month') return { start: startOfMonth(now), end: endOfMonth(now) };
    if (type === 'last_6_months') return { start: subMonths(now, 6), end: now };
    return null; // custom not implemented fully in this demo scope
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('student_course_purchases')
        .select(`
          *,
          course:online_courses(title, price, teacher:employee_profiles(full_name)),
          student:student_profiles(full_name, school_code),
          guest:guest_users(name)
        `)
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false });

      // Date Filter
      const range = getDateRange(filters.searchType);
      if (range) {
        if (filters.searchType === 'today') {
           query = query.gte('created_at', range.start.toISOString().split('T')[0]).lte('created_at', range.end.toISOString().split('T')[0] + ' 23:59:59');
        } else {
           query = query.gte('created_at', range.start.toISOString()).lte('created_at', range.end.toISOString());
        }
      }

      // Other Filters
      if (filters.paymentType !== 'all') query = query.eq('payment_method', filters.paymentType); // Assuming 'online'/'offline' stored in payment_method
      if (filters.paymentStatus !== 'all') query = query.eq('status', filters.paymentStatus);
      if (filters.usersType === 'student') query = query.not('student_id', 'is', null);
      if (filters.usersType === 'guest') query = query.not('guest_id', 'is', null);

      const { data: result, error } = await query;
      if (error) throw error;
      setData(result || []);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (branchId) handleSearch();
  }, [branchId]);

  // Filtered Data for Text Search
  const filteredData = data.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    const name = item.student?.full_name || item.guest?.name || '';
    const courseTitle = item.course?.title || '';
    return name.toLowerCase().includes(searchLower) || courseTitle.toLowerCase().includes(searchLower);
  });

  const grandTotal = filteredData.reduce((sum, item) => sum + (item.price_paid || 0), 0);

  const handlePrint = () => window.print();
  
  const handleExportCSV = () => {
    const headers = ['Student/Guest', 'Date', 'Course', 'Course Provider', 'Payment Type', 'Payment Method', 'Price'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        item.student?.full_name || item.guest?.name || 'Unknown',
        format(new Date(item.created_at), 'dd/MM/yyyy'),
        item.course?.title,
        'Internal', // Provider assumption
        item.payment_method === 'offline' ? 'Offline' : 'Online',
        item.payment_method,
        item.price_paid
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'purchase_report.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Type</label>
              <Select value={filters.searchType} onValueChange={v => setFilters({...filters, searchType: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Type</label>
              <Select value={filters.paymentType} onValueChange={v => setFilters({...filters, paymentType: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Status</label>
              <Select value={filters.paymentStatus} onValueChange={v => setFilters({...filters, paymentStatus: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="paid">Success</SelectItem>
                  <SelectItem value="pending">Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Users Type</label>
              <Select value={filters.usersType} onValueChange={v => setFilters({...filters, usersType: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch}><Search className="mr-2 h-4 w-4" /> Search</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 flex justify-between items-center border-b">
            <Input 
              placeholder="Search..." 
              className="max-w-sm" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleExportCSV} title="Export Excel"><FileSpreadsheet className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={handlePrint} title="Print"><Printer className="h-4 w-4" /></Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student / Guest</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Course Provider</TableHead>
                <TableHead>Payment Type</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Price ($)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
              ) : (
                <>
                  {filteredData.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.student?.full_name || item.guest?.name}</span>
                          <span className="text-xs text-muted-foreground">{item.student ? `(Student - ${item.student.school_code})` : '(Guest)'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(item.created_at), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{item.course?.title}</TableCell>
                      <TableCell>Youtube</TableCell> {/* Placeholder as per prompt image usually implies provider like Youtube if hosted there */}
                      <TableCell className="capitalize">{item.payment_method === 'offline' ? 'Offline' : 'Online'}</TableCell>
                      <TableCell className="capitalize">{item.payment_method}</TableCell>
                      <TableCell className="text-right">${item.price_paid}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-slate-50 font-bold">
                    <TableCell colSpan={6}>Grand Total</TableCell>
                    <TableCell className="text-right">${grandTotal.toFixed(2)}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentCoursePurchaseReport;
