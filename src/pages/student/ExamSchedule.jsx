import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Search, FileText, Sheet, Printer, Copy, X } from 'lucide-react';
import { format } from 'date-fns';

const StudentExamSchedule = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [selectedExam, setSelectedExam] = useState(null);
  const [examSubjects, setExamSubjects] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (user?.profile) {
      fetchExams();
    }
  }, [user]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const profile = user.profile;
      
      // Fetch exams applicable to the student's class and section
      // Note: Using 'contains' for array column section_ids
      let query = supabase
        .from('exams')
        .select('id, name, description, created_at')
        .eq('branch_id', profile.branch_id)
        .eq('class_id', profile.class_id)
        .eq('is_publish', true)
        .order('created_at', { ascending: false });

      if (profile.section_id) {
        query = query.contains('section_ids', [profile.section_id]);
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

  const handleViewExam = async (exam) => {
    setSelectedExam(exam);
    setModalOpen(true);
    setModalLoading(true);
    setModalSearchTerm('');

    try {
      const { data, error } = await supabase
        .from('exam_subjects')
        .select(`
          id,
          date,
          time,
          duration,
          credit_hours,
          room_no,
          max_marks,
          min_marks,
          subject:subjects (
            name,
            code
          )
        `)
        .eq('exam_id', exam.id);

      if (error) throw error;
      setExamSubjects(data || []);
    } catch (error) {
      console.error('Error fetching exam subjects:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredExams = exams.filter(exam => 
    exam.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubjects = examSubjects.filter(item => 
    item.subject?.name.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
    item.subject?.code.toLowerCase().includes(modalSearchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 bg-background min-h-screen">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Exam Schedule</h1>
        </div>

        <Card className="border-t-4 border-t-orange-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" title="Copy"><Copy className="h-4 w-4 text-muted-foreground" /></Button>
                <Button variant="outline" size="icon" title="Excel"><Sheet className="h-4 w-4 text-muted-foreground" /></Button>
                <Button variant="outline" size="icon" title="CSV"><FileText className="h-4 w-4 text-muted-foreground" /></Button>
                <Button variant="outline" size="icon" title="PDF"><FileText className="h-4 w-4 text-muted-foreground" /></Button>
                <Button variant="outline" size="icon" title="Print"><Printer className="h-4 w-4 text-muted-foreground" /></Button>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="w-[100px]">#</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center h-24">Loading...</TableCell>
                    </TableRow>
                  ) : filteredExams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No exams found</TableCell>
                    </TableRow>
                  ) : (
                    filteredExams.map((exam, index) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <button 
                            onClick={() => handleViewExam(exam)}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium focus:outline-none"
                          >
                            {exam.name}
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-8 bg-gray-700 hover:bg-gray-800 text-white shadow-sm"
                            onClick={() => handleViewExam(exam)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Records: 1 to {filteredExams.length} of {filteredExams.length}
            </div>
          </CardContent>
        </Card>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0">
            <DialogHeader className="p-6 pb-2">
              <div className="flex justify-between items-center">
                <DialogTitle className="text-xl font-semibold text-gray-800">
                  {selectedExam?.name}
                </DialogTitle>
              </div>
            </DialogHeader>
            
            <div className="px-6 py-4 space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search..."
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0"><Copy className="h-3.5 w-3.5" /></Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0"><Sheet className="h-3.5 w-3.5" /></Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0"><FileText className="h-3.5 w-3.5" /></Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0"><Printer className="h-3.5 w-3.5" /></Button>
                </div>
              </div>

              <div className="border rounded-md flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50 sticky top-0">
                      <TableHead className="font-semibold text-gray-700">Subject</TableHead>
                      <TableHead className="font-semibold text-gray-700">Date</TableHead>
                      <TableHead className="font-semibold text-gray-700">Time</TableHead>
                      <TableHead className="font-semibold text-gray-700">Duration</TableHead>
                      <TableHead className="font-semibold text-gray-700">Credit Hours</TableHead>
                      <TableHead className="font-semibold text-gray-700">Room Number</TableHead>
                      <TableHead className="font-semibold text-gray-700">Marks (Max.)</TableHead>
                      <TableHead className="font-semibold text-gray-700">Marks (Min.)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modalLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center h-24">Loading schedule...</TableCell>
                      </TableRow>
                    ) : filteredSubjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                          No subjects scheduled
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubjects.map((item, idx) => (
                        <TableRow key={item.id || idx}>
                          <TableCell className="font-medium">
                            {item.subject?.name} {item.subject?.code ? `(${item.subject.code})` : ''}
                          </TableCell>
                          <TableCell>{item.date ? format(new Date(item.date), 'dd-MMM-yyyy') : '-'}</TableCell>
                          <TableCell>{item.time || '-'}</TableCell>
                          <TableCell>{item.duration || '-'}</TableCell>
                          <TableCell>{item.credit_hours || '-'}</TableCell>
                          <TableCell>{item.room_no || '-'}</TableCell>
                          <TableCell>{item.max_marks || '0.00'}</TableCell>
                          <TableCell>{item.min_marks || '0.00'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="text-xs text-muted-foreground">
                Records: 1 to {filteredSubjects.length} of {filteredSubjects.length}
              </div>
            </div>

            <DialogFooter className="p-6 pt-2 border-t">
              <DialogClose asChild>
                <Button variant="secondary" className="bg-gray-700 text-white hover:bg-gray-800">Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default StudentExamSchedule;
