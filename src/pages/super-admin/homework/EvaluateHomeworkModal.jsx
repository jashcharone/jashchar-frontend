import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const EvaluateHomeworkModal = ({ isOpen, onClose, homework, onSuccess }) => {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evaluationData, setEvaluationData] = useState({});
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (homework && isOpen) {
      fetchStudentsAndEvaluations();
    }
  }, [homework, isOpen]);

  const fetchStudentsAndEvaluations = async () => {
    setLoading(true);
    try {
      // 1. Fetch students in class & section
      const { data: studentsData, error: studentsError } = await supabase
        .from('student_profiles')
        .select('id, full_name, admission_no, roll_number')
        .eq('class_id', homework.class_id)
        .eq('section_id', homework.section_id)
        .eq('branch_id', homework.branch_id)
        .order('full_name');

      if (studentsError) throw studentsError;

      // 2. Fetch existing evaluations
      const { data: evalsData, error: evalsError } = await supabase
        .from('homework_evaluations')
        .select('*')
        .eq('homework_id', homework.id);
        
      if (evalsError) throw evalsError;

      setStudents(studentsData || []);
      
      // Map evaluations by student_id
      const evalMap = {};
      evalsData?.forEach(ev => {
        evalMap[ev.student_id] = {
           marks: ev.marks,
           note: ev.note,
           status: ev.status,
           id: ev.id // Store ID for update
        };
      });
      setEvaluationData(evalMap);

    } catch (error) {
      console.error("Error fetching evaluation data:", error);
      toast({ title: "Error", description: "Failed to load students", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (studentId, field, value) => {
    setEvaluationData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare upserts
      const upserts = students.map(student => {
        const currentEval = evaluationData[student.id] || {};
        
        const marks = currentEval.marks;
        const note = currentEval.note;
        const status = (marks !== undefined && marks !== '') ? 'Evaluated' : 'Pending';

        return {
          ...(currentEval.id ? { id: currentEval.id } : {}), // Include ID if updating
          branch_id: homework.branch_id,
          homework_id: homework.id,
          student_id: student.id,
          marks: marks === '' ? null : marks,
          note: note,
          status: status,
          evaluation_date: evaluationDate
        };
      }).filter(item => item.marks !== undefined || item.note !== undefined || item.id); // Filter out untouched new records

      if (upserts.length > 0) {
         const { error } = await supabase.from('homework_evaluations').upsert(upserts, { onConflict: 'homework_id, student_id' });
         if (error) throw error;
      }
      
      toast({ title: "Success", description: "Evaluations saved successfully" });
      onSuccess();
      onClose();

    } catch (error) {
      console.error("Error saving evaluations:", error);
      toast({ title: "Error", description: "Failed to save evaluations", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Evaluate Homework</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-md mb-4 text-sm">
           <div><span className="font-bold">Class:</span> {homework.classes?.name}</div>
           <div><span className="font-bold">Section:</span> {homework.sections?.name}</div>
           <div><span className="font-bold">Subject:</span> {homework.subjects?.name}</div>
           <div><span className="font-bold">Date:</span> {format(new Date(homework.homework_date), 'dd/MM/yyyy')}</div>
           <div><span className="font-bold">Submission:</span> {format(new Date(homework.submission_date), 'dd/MM/yyyy')}</div>
           <div><span className="font-bold">Max Marks:</span> {homework.max_marks}</div>
           <div className="col-span-2"><span className="font-bold">Description:</span> <span dangerouslySetInnerHTML={{__html: homework.description?.substring(0, 50) + '...'}} /></div>
        </div>

        <div className="flex items-center gap-4 mb-2">
            <label className="text-sm font-medium">Evaluation Date:</label>
            <Input 
                type="date" 
                className="w-40" 
                value={evaluationDate} 
                onChange={(e) => setEvaluationDate(e.target.value)} 
            />
        </div>

        <div className="flex-1 overflow-auto border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-100">
                        <TableHead>Student Name</TableHead>
                        <TableHead>Admission No</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-32">Marks</TableHead>
                        <TableHead>Note</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={5} className="text-center">Loading students...</TableCell></TableRow>
                    ) : students.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center">No students found in this class/section</TableCell></TableRow>
                    ) : (
                        students.map(student => {
                            const ev = evaluationData[student.id] || {};
                            const isEvaluated = ev.status === 'Evaluated';
                            
                            return (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium">{student.full_name}</TableCell>
                                    <TableCell>{student.admission_no}</TableCell>
                                    <TableCell>
                                        {isEvaluated ? (
                                            <Badge className="bg-green-500">Evaluated</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                            type="number" 
                                            value={ev.marks || ''} 
                                            onChange={(e) => handleInputChange(student.id, 'marks', e.target.value)}
                                            placeholder={`Max ${homework.max_marks}`}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Textarea 
                                            value={ev.note || ''} 
                                            onChange={(e) => handleInputChange(student.id, 'note', e.target.value)}
                                            placeholder="Feedback"
                                            rows={1}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
            {saving ? 'Saving...' : 'Save Evaluation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EvaluateHomeworkModal;
