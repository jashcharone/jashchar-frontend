import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, IndianRupee } from 'lucide-react';

const OfflinePayment = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { toast } = useToast();
  const branchId = user?.user_metadata?.branch_id;

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({ class_id: '', section_id: '', student_id: '' });

  useEffect(() => {
    if (branchId) fetchClasses();
  }, [branchId]);

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('id, name').eq('branch_id', branchId);
    setClasses(data || []);
  };

  useEffect(() => {
    if (filters.class_id) {
      const fetchSections = async () => {
        const { data } = await supabase.from('class_sections').select('sections(id, name)').eq('class_id', filters.class_id);
        setSections(data?.map(i => i.sections) || []);
      };
      fetchSections();
    } else setSections([]);
  }, [filters.class_id]);

  useEffect(() => {
    if (filters.class_id && filters.section_id) {
      const fetchStudents = async () => {
        const { data } = await supabase.from('student_profiles')
          .select('id, full_name').eq('class_id', filters.class_id).eq('section_id', filters.section_id).eq('branch_id', branchId);
        setStudents(data || []);
      };
      fetchStudents();
    } else setStudents([]);
  }, [filters.class_id, filters.section_id]);

  const handleSearch = async () => {
    if (!filters.student_id) return toast({ variant: 'destructive', title: 'Select a student' });
    setLoading(true);
    
    // Get all published courses for this class
    const { data: allCourses } = await supabase.from('online_courses')
      .select('*').eq('branch_id', branchId).eq('class_id', filters.class_id).eq('is_published', true);

    // Get already purchased courses
    const { data: purchases } = await supabase.from('student_course_purchases')
      .select('course_id, status').eq('student_id', filters.student_id);
    
    const purchasedIds = purchases?.map(p => p.course_id) || [];
    
    // Map status
    const coursesWithStatus = allCourses?.map(c => ({
      ...c,
      is_purchased: purchasedIds.includes(c.id),
      purchase_status: purchases?.find(p => p.course_id === c.id)?.status || 'unpaid'
    })) || [];

    setCourses(coursesWithStatus);
    setLoading(false);
  };

  const handlePay = async (course) => {
    if (!window.confirm(`Collect payment for ${course.title}?`)) return;
    
    const { error } = await supabase.from('student_course_purchases').insert({
      branch_id: branchId,
      session_id: currentSessionId,
      organization_id: organizationId,
      student_id: filters.student_id,
      course_id: course.id,
      price_paid: course.price,
      payment_method: 'offline',
      status: 'paid'
    });

    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else {
      toast({ title: 'Payment Collected' });
      handleSearch(); // refresh
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Offline Payment</h1>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={filters.class_id} onValueChange={v => setFilters({...filters, class_id: v, section_id: '', student_id: ''})}>
                  <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={filters.section_id} onValueChange={v => setFilters({...filters, section_id: v, student_id: ''})}>
                  <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                  <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Student</Label>
                <Select value={filters.student_id} onValueChange={v => setFilters({...filters, student_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
                  <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Course</TableHead><TableHead>Price</TableHead><TableHead>Current Price</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow> : 
                  courses.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8">No courses found for this student.</TableCell></TableRow> :
                  courses.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell>${c.price}</TableCell>
                      <TableCell>${c.discount > 0 ? (c.price - (c.price * c.discount / 100)).toFixed(2) : c.price}</TableCell>
                      <TableCell>
                        {c.is_purchased ? <span className="text-green-600 font-bold">Paid</span> : <span className="text-red-500">Unpaid</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        {!c.is_purchased && !c.is_free && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handlePay(c)}>
                            <IndianRupee className="mr-1 h-3 w-3" /> Pay
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OfflinePayment;
