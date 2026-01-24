import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Search, RotateCcw, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LibraryIssueReturn = () => {
  const { user, currentSessionId } = useAuth();
  const { toast } = useToast();
  
  const [searchId, setSearchId] = useState('');
  const [member, setMember] = useState(null);
  const [books, setBooks] = useState([]);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Issue Form State
  const [selectedBook, setSelectedBook] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (user?.user_metadata?.branch_id) {
      fetchAvailableBooks();
    }
  }, [user]);

  const fetchAvailableBooks = async () => {
    const { data } = await supabase
      .from('books')
      .select('id, book_title, book_number, available')
      .eq('branch_id', user.user_metadata.branch_id)
      .gt('available', 0);
    setBooks(data || []);
  };

  const searchMember = async () => {
    if (!searchId) return;
    setLoading(true);
    setMember(null);
    setIssuedBooks([]);

    try {
      // Try finding by Library Card No directly
      let { data: memberData, error } = await supabase
        .from('library_members')
        .select(`
          id, 
          library_card_no, 
          member_type,
          student:student_profiles(id, full_name, school_code, phone, gender, class:classes(name), section:sections(name)),
          staff:employee_profiles(id, full_name, phone, role:roles(name))
        `)
        .eq('branch_id', user.user_metadata.branch_id)
        .eq('library_card_no', searchId)
        .maybeSingle();

      // If not found by card, try finding by Admission No (school_code) for students
      if (!memberData) {
         const { data: student } = await supabase
            .from('student_profiles')
            .select('id')
            .eq('branch_id', user.user_metadata.branch_id)
            .eq('school_code', searchId)
            .maybeSingle();
         
         if (student) {
             const { data: mem } = await supabase
                .from('library_members')
                .select(`
                  id, 
                  library_card_no, 
                  member_type,
                  student:student_profiles(id, full_name, school_code, phone, gender, class:classes(name), section:sections(name)),
                  staff:employee_profiles(id, full_name, phone, role:roles(name))
                `)
                .eq('branch_id', user.user_metadata.branch_id)
                .eq('student_id', student.id)
                .maybeSingle();
             memberData = mem;
         }
      }

      if (memberData) {
        setMember(memberData);
        fetchMemberIssuedBooks(memberData.id);
      } else {
        toast({ title: "Not Found", description: "Member not found", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Search failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberIssuedBooks = async (memberId) => {
    const { data } = await supabase
      .from('book_issues')
      .select(`
        id,
        issue_date,
        due_date,
        return_date,
        is_returned,
        book:books(book_title, book_number, author)
      `)
      .eq('member_id', memberId)
      .eq('branch_id', user.user_metadata.branch_id)
      .order('issue_date', { ascending: false });
      
    setIssuedBooks(data || []);
  };

  const handleIssueBook = async () => {
    if (!member || !selectedBook || !dueDate) {
      toast({ title: "Error", description: "Select book and due date", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from('book_issues').insert([{
        branch_id: user.user_metadata.branch_id,
        book_id: selectedBook,
        member_id: member.id,
        issue_date: issueDate,
        due_date: dueDate,
        is_returned: false
      }]);

      if (error) throw error;

      toast({ title: "Success", description: "Book issued successfully" });
      fetchMemberIssuedBooks(member.id);
      fetchAvailableBooks(); // Refresh inventory
      setSelectedBook('');
      setDueDate('');
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to issue book", variant: "destructive" });
    }
  };

  const handleReturnBook = async (issueId) => {
    if (!window.confirm('Confirm return?')) return;

    try {
      const { error } = await supabase
        .from('book_issues')
        .update({ 
          is_returned: true, 
          return_date: new Date().toISOString().split('T')[0] 
        })
        .eq('id', issueId);

      if (error) throw error;

      toast({ title: "Success", description: "Book returned successfully" });
      fetchMemberIssuedBooks(member.id);
      fetchAvailableBooks();
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to return book", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Issue / Return Book</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Col: Search and Profile */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader><CardTitle>Search Member</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Card No / Admission No" 
                    value={searchId} 
                    onChange={(e) => setSearchId(e.target.value)} 
                  />
                  <Button onClick={searchMember} disabled={loading}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {member && (
              <>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center mb-4">
                      <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                        <span className="text-2xl font-bold text-gray-400">
                          {(member.member_type === 'student' ? member.student?.full_name : member.staff?.full_name)?.charAt(0)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold">
                        {member.member_type === 'student' ? member.student?.full_name : member.staff?.full_name}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">{member.member_type}</p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-gray-500">Card No</span>
                        <span className="font-medium">{member.library_card_no}</span>
                      </div>
                      {member.member_type === 'student' && (
                        <>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-gray-500">Admission No</span>
                            <span className="font-medium">{member.student?.school_code}</span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-gray-500">Class</span>
                            <span className="font-medium">{member.student?.class?.name} ({member.student?.section?.name})</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-gray-500">Phone</span>
                        <span className="font-medium">{member.member_type === 'student' ? member.student?.phone : member.staff?.phone}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Issue New Book</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Book</Label>
                      <Select value={selectedBook} onValueChange={setSelectedBook}>
                        <SelectTrigger><SelectValue placeholder="Select Book" /></SelectTrigger>
                        <SelectContent>
                          {books.map(b => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.book_title} ({b.book_number})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Return Date</Label>
                      <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </div>
                    <Button className="w-full" onClick={handleIssueBook}>Issue Book</Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Right Col: Issue History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle>Book Issue History</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book Title</TableHead>
                      <TableHead>Book No</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Return Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issuedBooks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">No books issued</TableCell>
                      </TableRow>
                    ) : (
                      issuedBooks.map((issue) => (
                        <TableRow key={issue.id}>
                          <TableCell className="font-medium">{issue.book?.book_title}</TableCell>
                          <TableCell>{issue.book?.book_number}</TableCell>
                          <TableCell>{issue.issue_date}</TableCell>
                          <TableCell>{issue.due_date}</TableCell>
                          <TableCell>{issue.return_date || '-'}</TableCell>
                          <TableCell>
                            {issue.is_returned ? (
                              <span className="text-green-600 font-medium">Returned</span>
                            ) : (
                              <span className="text-red-600 font-medium">Not Returned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!issue.is_returned && (
                              <Button size="sm" variant="ghost" onClick={() => handleReturnBook(issue.id)} title="Return Book">
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LibraryIssueReturn;
