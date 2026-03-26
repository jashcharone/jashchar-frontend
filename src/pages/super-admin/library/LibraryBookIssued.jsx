import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Search, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const LibraryBookIssued = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.user_metadata?.branch_id) {
      fetchIssuedBooks();
    }
  }, [user]);

  const fetchIssuedBooks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('book_issues')
        .select(`
          id,
          issue_date,
          due_date,
          return_date,
          is_returned,
          book:books(book_title, book_number, author),
          member:library_members(
            library_card_no, 
            member_type,
            student:student_profiles(full_name),
            staff:employee_profiles(full_name)
          )
        `)
        .eq('branch_id', user.user_metadata.branch_id)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setIssuedBooks(data || []);
    } catch (error) {
      console.error('Error fetching issued books:', error);
      toast({
        title: "Error",
        description: "Failed to fetch issued books.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = issuedBooks.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const memberName = item.member?.member_type === 'student' ? item.member?.student?.full_name : item.member?.staff?.full_name;
    return (
      item.book?.book_title?.toLowerCase().includes(searchLower) ||
      item.book?.book_number?.toLowerCase().includes(searchLower) ||
      item.book?.author?.toLowerCase().includes(searchLower) ||
      memberName?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Book Issued List</h1>

        <div className="bg-card rounded-lg shadow border border-border p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book Title</TableHead>
                    <TableHead>Book No</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Member Name</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Return Date</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBooks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">No records found</TableCell>
                    </TableRow>
                  ) : (
                    filteredBooks.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.book?.book_title}</TableCell>
                        <TableCell>{item.book?.book_number}</TableCell>
                        <TableCell>{item.book?.author}</TableCell>
                        <TableCell>
                          {item.member?.member_type === 'student' 
                            ? item.member?.student?.full_name 
                            : item.member?.staff?.full_name} 
                          <span className="text-xs text-muted-foreground ml-1">({item.member?.library_card_no})</span>
                        </TableCell>
                        <TableCell>{item.issue_date}</TableCell>
                        <TableCell>{item.due_date}</TableCell>
                        <TableCell>{item.return_date || '-'}</TableCell>
                        <TableCell>
                          {item.is_returned ? (
                            <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">Returned</Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400">Issued</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LibraryBookIssued;
