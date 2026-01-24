import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Trash2, Search, Plus, Loader2 } from 'lucide-react';

const LibraryBooks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  
  const [formData, setFormData] = useState({
    book_title: '',
    book_number: '',
    isbn_number: '',
    publisher: '',
    author: '',
    subject: '',
    rack_number: '',
    qty: '',
    book_price: '',
    post_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    if (user?.user_metadata?.branch_id) {
      fetchBooks();
    }
  }, [user]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('branch_id', user.user_metadata.branch_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({
        title: "Error",
        description: "Failed to fetch book list.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.book_title) {
      toast({ title: "Error", description: "Book Title is required", variant: "destructive" });
      return;
    }

    try {
      const bookData = {
        ...formData,
        branch_id: user.user_metadata.branch_id,
        qty: parseInt(formData.qty) || 0,
        book_price: parseFloat(formData.book_price) || 0,
        // When creating, available = qty. When editing, recalculate available based on diff
        available: editingBook ? (editingBook.available + ((parseInt(formData.qty) || 0) - editingBook.qty)) : (parseInt(formData.qty) || 0)
      };

      if (editingBook) {
        const { error } = await supabase
          .from('books')
          .update(bookData)
          .eq('id', editingBook.id);
          
        if (error) throw error;
        toast({ title: "Success", description: "Book updated successfully" });
      } else {
        const { error } = await supabase.from('books').insert([bookData]);
        if (error) throw error;
        toast({ title: "Success", description: "Book added successfully" });
      }

      resetForm();
      setIsModalOpen(false);
      fetchBooks();
    } catch (error) {
      console.error('Error saving book:', error);
      toast({ title: "Error", description: "Failed to save book", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      book_title: '',
      book_number: '',
      isbn_number: '',
      publisher: '',
      author: '',
      subject: '',
      rack_number: '',
      qty: '',
      book_price: '',
      post_date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setEditingBook(null);
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    setFormData({
      book_title: book.book_title,
      book_number: book.book_number || '',
      isbn_number: book.isbn_number || '',
      publisher: book.publisher || '',
      author: book.author || '',
      subject: book.subject || '',
      rack_number: book.rack_number || '',
      qty: book.qty,
      book_price: book.book_price || '',
      post_date: book.post_date,
      description: book.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    
    try {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Success", description: "Book deleted successfully" });
      fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({ title: "Error", description: "Failed to delete book. It may be issued to a student.", variant: "destructive" });
    }
  };

  const filteredBooks = books.filter(book => {
    const searchLower = searchTerm.toLowerCase();
    return (
      book.book_title?.toLowerCase().includes(searchLower) ||
      book.book_number?.toLowerCase().includes(searchLower) ||
      book.isbn_number?.toLowerCase().includes(searchLower) ||
      book.author?.toLowerCase().includes(searchLower) ||
      book.subject?.toLowerCase().includes(searchLower) ||
      book.publisher?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Library Books</h1>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Book
          </Button>
        </div>

        <div className="bg-card rounded-lg shadow border border-border p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search books..." 
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
                    <TableHead>ISBN</TableHead>
                    <TableHead>Publisher</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Rack No</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Post Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBooks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8">No books found</TableCell>
                    </TableRow>
                  ) : (
                    filteredBooks.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell className="font-medium">{book.book_title}</TableCell>
                        <TableCell>{book.book_number}</TableCell>
                        <TableCell>{book.isbn_number}</TableCell>
                        <TableCell>{book.publisher}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell>{book.subject}</TableCell>
                        <TableCell>{book.rack_number}</TableCell>
                        <TableCell>{book.qty} <span className="text-xs text-gray-500">(Avl: {book.available})</span></TableCell>
                        <TableCell>{book.book_price}</TableCell>
                        <TableCell>{book.post_date}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(book)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(book.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingBook ? 'Edit Book' : 'Add Book'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Book Title *</Label>
                <Input name="book_title" value={formData.book_title} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label>Book Number</Label>
                <Input name="book_number" value={formData.book_number} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>ISBN Number</Label>
                <Input name="isbn_number" value={formData.isbn_number} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Publisher</Label>
                <Input name="publisher" value={formData.publisher} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input name="author" value={formData.author} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input name="subject" value={formData.subject} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Rack Number</Label>
                <Input name="rack_number" value={formData.rack_number} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" name="qty" value={formData.qty} onChange={handleInputChange} min="0" />
              </div>
              <div className="space-y-2">
                <Label>Book Price</Label>
                <Input type="number" name="book_price" value={formData.book_price} onChange={handleInputChange} step="0.01" />
              </div>
              <div className="space-y-2">
                <Label>Post Date</Label>
                <Input type="date" name="post_date" value={formData.post_date} onChange={handleInputChange} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Description</Label>
                <Textarea name="description" value={formData.description} onChange={handleInputChange} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default LibraryBooks;
