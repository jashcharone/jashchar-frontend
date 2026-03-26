import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Trash2, Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const RatingDetailsModal = ({ isOpen, onClose, courseId, branchId }) => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && courseId) {
      fetchReviews();
    }
  }, [isOpen, courseId]);

  const fetchReviews = async () => {
    setLoading(true);
    // Fetch reviews with joined user info
    const { data, error } = await supabase
      .from('course_reviews')
      .select(`
        id, rating, review,
        student:student_profiles(full_name, enrollment_id),
        guest:guest_users(name)
      `)
      .eq('course_id', courseId)
      .eq('branch_id', branchId);

    if (!error) {
      setReviews(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    const { error } = await supabase.from('course_reviews').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Review Deleted' });
      fetchReviews();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rating Details</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Review</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No reviews yet.</TableCell></TableRow>
              ) : (
                reviews.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.student?.full_name ? `${r.student.full_name} (${r.student.enrollment_id})` : r.guest?.name ? `${r.guest.name} (Guest)` : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <div className="flex text-orange-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < r.rating ? 'fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{r.review}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RatingDetailsModal;
