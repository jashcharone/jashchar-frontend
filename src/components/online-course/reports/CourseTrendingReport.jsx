import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Printer } from 'lucide-react';

const CourseTrendingReport = ({ branchId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (branchId) fetchData();
  }, [branchId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: courses } = await supabase
      .from('online_courses')
      .select(`*, class:classes(name), teacher:employee_profiles(full_name)`)
      .eq('branch_id', branchId)
      .order('view_count', { ascending: false }); // Trending usually implies views
    
    setData(courses || []);
    setLoading(false);
  };

  const filteredData = data.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 flex justify-between items-center border-b">
          <Input placeholder="Search..." className="max-w-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => window.print()}><Printer className="h-4 w-4" /></Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>View Count</TableHead>
              <TableHead>Assign Teacher</TableHead>
              <TableHead>Price ($)</TableHead>
              <TableHead className="text-right">Current Price ($)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow> :
              filteredData.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell>{c.class?.name}</TableCell>
                  <TableCell>{c.view_count || 0}</TableCell>
                  <TableCell>{c.teacher?.full_name}</TableCell>
                  <TableCell>${c.price}</TableCell>
                  <TableCell className="text-right">${c.discount > 0 ? (c.price - (c.price * c.discount / 100)).toFixed(2) : c.price}</TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CourseTrendingReport;
