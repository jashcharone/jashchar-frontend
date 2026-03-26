import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Eye, Printer, Star } from 'lucide-react';
import RatingDetailsModal from './RatingDetailsModal';

const CourseRatingReport = ({ branchId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (branchId) fetchData();
  }, [branchId]);

  const fetchData = async () => {
    setLoading(true);
    // Fetch courses with aggregated ratings
    // Supabase doesn't support aggregation in simple select cleanly without a view or function.
    // We will fetch reviews and aggregate in JS for simplicity in this environment.
    
    const { data: courses } = await supabase.from('online_courses').select('id, title, class:classes(name)').eq('branch_id', branchId);
    const { data: reviews } = await supabase.from('course_reviews').select('course_id, rating').eq('branch_id', branchId);

    const aggregated = courses?.map(c => {
      const courseReviews = reviews?.filter(r => r.course_id === c.id) || [];
      const totalRating = courseReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = courseReviews.length > 0 ? totalRating / courseReviews.length : 0;
      
      return {
        ...c,
        review_count: courseReviews.length,
        avg_rating: avgRating
      };
    }) || [];

    setData(aggregated);
    setLoading(false);
  };

  const filteredData = data.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 flex justify-between items-center border-b">
          <Input placeholder="Search..." className="max-w-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          <Button variant="outline" size="icon" onClick={() => window.print()}><Printer className="h-4 w-4" /></Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Review Count</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow> :
              filteredData.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell>{c.class?.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="mr-2 font-bold text-sm">{c.avg_rating.toFixed(1)}</span>
                      <div className="flex text-orange-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < Math.round(c.avg_rating) ? 'fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{c.review_count}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedCourseId(c.id); setModalOpen(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </CardContent>

      <RatingDetailsModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        courseId={selectedCourseId} 
        branchId={branchId} 
      />
    </Card>
  );
};

export default CourseRatingReport;
