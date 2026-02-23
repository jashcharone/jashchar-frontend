/**
 * ParentExamSchedule - View child's exam schedule
 */
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ChildSelector from '@/components/ChildSelector';
import { useParentChild } from '@/contexts/ParentChildContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, FileText } from 'lucide-react';
import { format } from 'date-fns';

const ParentExamSchedule = () => {
  const { selectedChild } = useParentChild();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examSubjects, setExamSubjects] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      if (!selectedChild?.id || !selectedChild?.branch_id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let query = supabase
          .from('exams')
          .select('id, name, description, created_at')
          .eq('branch_id', selectedChild.branch_id)
          .eq('class_id', selectedChild.class_id)
          .eq('is_publish', true)
          .order('created_at', { ascending: false });

        if (selectedChild.section_id) {
          query = query.contains('section_ids', [selectedChild.section_id]);
        }

        const { data, error } = await query;
        if (error) throw error;
        setExams(data || []);
      } catch (error) {
        console.error('Error fetching exams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [selectedChild]);

  const handleViewExam = async (exam) => {
    setSelectedExam(exam);
    setModalOpen(true);
    setModalLoading(true);

    try {
      const { data, error } = await supabase
        .from('exam_subjects')
        .select(`
          id, date, time, duration, credit_hours, room_no, max_marks, min_marks,
          subject:subjects (name, code)
        `)
        .eq('exam_id', exam.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setExamSubjects(data || []);
    } catch (error) {
      console.error('Error fetching exam subjects:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const childName = selectedChild ? (selectedChild.full_name || `${selectedChild.first_name} ${selectedChild.last_name}`) : '';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Exam Schedule
        </h1>

        <ChildSelector />

        {!selectedChild ? (
          <Card className="p-8 text-center text-muted-foreground">No child selected</Card>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : exams.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No published exam schedules found for {childName}
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Exam Schedules - {childName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Exam Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exams.map((exam, idx) => (
                      <TableRow key={exam.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-medium">{exam.name}</TableCell>
                        <TableCell>{exam.description || '-'}</TableCell>
                        <TableCell>{exam.created_at ? format(new Date(exam.created_at), 'dd MMM yyyy') : '-'}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => handleViewExam(exam)}>
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exam Detail Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedExam?.name} - Schedule</DialogTitle>
            </DialogHeader>
            {modalLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : examSubjects.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No subjects scheduled yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Max Marks</TableHead>
                      <TableHead>Min Marks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examSubjects.map(sub => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.subject?.name || '-'}</TableCell>
                        <TableCell>{sub.date ? format(new Date(sub.date), 'dd MMM yyyy') : '-'}</TableCell>
                        <TableCell>{sub.time || '-'}</TableCell>
                        <TableCell>{sub.duration || '-'}</TableCell>
                        <TableCell>{sub.room_no || '-'}</TableCell>
                        <TableCell>{sub.max_marks || '-'}</TableCell>
                        <TableCell>{sub.min_marks || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ParentExamSchedule;
