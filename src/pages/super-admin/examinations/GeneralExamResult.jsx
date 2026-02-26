import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Search } from 'lucide-react';

const GeneralExamResult = () => {
  const { user, currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  
  // Dropdown states
  const [examGroups, setExamGroups] = useState([]);
  const [exams, setExams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  // Selection states
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  useEffect(() => {
    if (branchId) fetchInitialData();
  }, [branchId]);

  const fetchInitialData = async () => {
    const [groupsRes, sessionsRes, classesRes] = await Promise.all([
      supabase.from('exam_groups').select('*').eq('branch_id', branchId),
      supabase.from('sessions').select('*'),
      supabase.from('classes').select('*').eq('branch_id', branchId)
    ]);
    if (groupsRes.data) setExamGroups(groupsRes.data);
    if (sessionsRes.data) setSessions(sessionsRes.data);
    if (classesRes.data) setClasses(classesRes.data);
  };

  const handleClassChange = async (classId) => {
    setSelectedClass(classId);
    const { data } = await supabase.from('sections').select('*').eq('branch_id', branchId);
    setSections(data || []);
  };

  const handleGroupChange = async (groupId) => {
    setSelectedGroup(groupId);
    const { data } = await supabase.from('exams').select('*').eq('exam_group_id', groupId);
    setExams(data || []);
  };

  const handleSearch = async () => {
    if (!selectedExam || !selectedClass || !selectedSection) {
      toast({ title: "Error", description: "Please select Exam, Class and Section", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Fetch students filtered by current session
      let studentQuery = supabase
        .from('student_profiles')
        .select('id, full_name, roll_number, admission_no, session_id')
        .eq('branch_id', branchId)
        .eq('class_id', selectedClass)
        .eq('section_id', selectedSection);
      
      // Filter by session if available
      if (currentSessionId) {
        studentQuery = studentQuery.eq('session_id', currentSessionId);
      }
      
      const { data: students } = await studentQuery;

      // Fetch marks (Mocking structure as exam_marks might vary)
      // In real scenario: join exam_marks with exam_subjects
      const mockResults = students.map(student => {
        const obtained = Math.floor(Math.random() * 500);
        const total = 500;
        const percentage = (obtained / total) * 100;
        return {
          ...student,
          subjects: [
            { name: 'Math', max: 100, min: 33, obtained: Math.floor(Math.random() * 100), note: '' },
            { name: 'Science', max: 100, min: 33, obtained: Math.floor(Math.random() * 100), note: '' },
            { name: 'English', max: 100, min: 33, obtained: Math.floor(Math.random() * 100), note: '' },
            { name: 'History', max: 100, min: 33, obtained: Math.floor(Math.random() * 100), note: '' },
            { name: 'Geography', max: 100, min: 33, obtained: Math.floor(Math.random() * 100), note: '' },
          ],
          grand_total: obtained,
          total_max: total,
          percentage: percentage.toFixed(2),
          result: percentage >= 33 ? 'Pass' : 'Fail',
          division: percentage >= 60 ? 'First' : percentage >= 45 ? 'Second' : 'Third'
        };
      });

      setResults(mockResults);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch results", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Exam Result</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Select onValueChange={handleGroupChange}>
              <SelectTrigger><SelectValue placeholder="Exam Group" /></SelectTrigger>
              <SelectContent>{examGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select onValueChange={setSelectedExam}>
              <SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger>
              <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select onValueChange={setSelectedSession}>
              <SelectTrigger><SelectValue placeholder="Session" /></SelectTrigger>
              <SelectContent>{sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select onValueChange={handleClassChange}>
              <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select onValueChange={setSelectedSection}>
              <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
              <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Search
          </Button>
        </div>

        {results.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Subjects (Obt/Max)</TableHead>
                  <TableHead>Grand Total</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((student, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{student.full_name}</TableCell>
                    <TableCell>{student.roll_number}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {student.subjects.map((sub, i) => (
                          <div key={i} className="text-xs border rounded p-1 bg-gray-50">
                            <span className="font-bold">{sub.name}:</span> {sub.obtained}/{sub.max}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{student.grand_total}/{student.total_max}</TableCell>
                    <TableCell>{student.percentage}%</TableCell>
                    <TableCell>{student.division}</TableCell>
                    <TableCell>
                      <Badge variant={student.result === 'Pass' ? 'success' : 'destructive'} className={student.result === 'Pass' ? 'bg-green-500' : 'bg-red-500'}>
                        {student.result}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GeneralExamResult;
