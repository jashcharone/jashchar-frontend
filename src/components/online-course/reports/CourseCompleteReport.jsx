import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Search } from 'lucide-react';
import CoursePerformanceModal from './CoursePerformanceModal';

const CourseCompleteReport = ({ branchId }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  
  const [filters, setFilters] = useState({ class_id: '', course_id: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (branchId) {
      fetchClasses();
      fetchCourses();
    }
  }, [branchId]);

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('id, name').eq('branch_id', branchId);
    setClasses(data || []);
  };

  const fetchCourses = async () => {
    const { data } = await supabase.from('online_courses').select('id, title').eq('branch_id', branchId);
    setCourses(data || []);
  };

  const handleSearch = async () => {
    if (!filters.course_id) return; 
    setLoading(true);
    try {
      // 1. Get students who purchased/enrolled in the course
      // Note: In a real "Complete Report", we'd query enrolled students. 
      // We'll use `student_course_purchases` as the base for "enrolled".
      
      const { data: purchases } = await supabase
        .from('student_course_purchases')
        .select('student_id, student:student_profiles(id, full_name, enrollment_id, class_id)')
        .eq('course_id', filters.course_id)
        .eq('branch_id', branchId);

      if (!purchases) { setData([]); return; }

      // Filter by Class if selected
      let students = purchases.map(p => p.student).filter(Boolean);
      if (filters.class_id) {
        students = students.filter(s => s.class_id === filters.class_id);
      }

      // Calculate progress for each student
      // Get total lessons for the course
      const { count: totalLessons } = await supabase
        .from('course_lessons')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', filters.course_id);

      // Get progress for these students
      const { data: progressData } = await supabase
        .from('student_course_progress')
        .select('student_id, lesson_id')
        .eq('course_id', filters.course_id)
        .in('student_id', students.map(s => s.id));

      // Map data
      const report = students.map(student => {
        const completed = progressData?.filter(p => p.student_id === student.id).length || 0;
        const percentage = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
        return {
          ...student,
          progress: percentage
        };
      });

      setData(report);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={filters.class_id} onValueChange={v => setFilters({...filters, class_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Course *</label>
              <Select value={filters.course_id} onValueChange={v => setFilters({...filters, course_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select Course" /></SelectTrigger>
                <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch}><Search className="mr-2 h-4 w-4" /> Search</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Enroll ID</TableHead>
                <TableHead>Course Progress</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow> :
                data.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No records found. Select a course to search.</TableCell></TableRow> :
                data.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.full_name}</TableCell>
                    <TableCell>{s.enrollment_id}</TableCell>
                    <TableCell>{s.progress}%</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedStudent(s.id); setModalOpen(true); }}>
                        Course Performance
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CoursePerformanceModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        studentId={selectedStudent}
        courseId={filters.course_id}
        branchId={branchId}
      />
    </div>
  );
};

export default CourseCompleteReport;
