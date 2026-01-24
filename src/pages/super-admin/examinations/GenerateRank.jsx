import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Search, Trophy } from 'lucide-react';

const GenerateRank = () => {
  const { user, currentSessionId } = useAuth();
  const { toast } = useToast();
  const branchId = user?.profile?.branch_id;
  const [loading, setLoading] = useState(false);
  const [ranks, setRanks] = useState([]);
  
  const [examGroups, setExamGroups] = useState([]);
  const [exams, setExams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  useEffect(() => { if (branchId) fetchInitialData(); }, [branchId]);

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
    if (!selectedExam || !selectedClass) {
      toast({ title: "Error", description: "Select Exam and Class", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Fetch students filtered by current session
      let studentQuery = supabase.from('student_profiles').select('id, full_name, roll_number, session_id').eq('branch_id', branchId).eq('class_id', selectedClass);
      
      if (currentSessionId) {
        studentQuery = studentQuery.eq('session_id', currentSessionId);
      }
      
      const { data: students } = await studentQuery;
      
      const mockRanks = students.map(s => ({
        ...s,
        total_marks: Math.floor(Math.random() * 500),
        percentage: (Math.random() * 100).toFixed(2)
      })).sort((a, b) => b.total_marks - a.total_marks).map((s, i) => ({ ...s, rank: i + 1 }));

      setRanks(mockRanks);
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate ranks", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Rank Report</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Select onValueChange={handleGroupChange}><SelectTrigger><SelectValue placeholder="Exam Group" /></SelectTrigger><SelectContent>{examGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent></Select>
            <Select onValueChange={setSelectedExam}><SelectTrigger><SelectValue placeholder="Exam" /></SelectTrigger><SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select>
            <Select onValueChange={setSelectedSession}><SelectTrigger><SelectValue placeholder="Session" /></SelectTrigger><SelectContent>{sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
            <Select onValueChange={handleClassChange}><SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
            <Select onValueChange={setSelectedSection}><SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger><SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
          </div>
          <Button onClick={handleSearch} disabled={loading}><Search className="mr-2 h-4 w-4" /> Search</Button>
        </div>

        {ranks.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranks.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-bold flex items-center gap-2">
                      {r.rank === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                      {r.rank === 2 && <Trophy className="h-4 w-4 text-gray-400" />}
                      {r.rank === 3 && <Trophy className="h-4 w-4 text-amber-600" />}
                      {r.rank}
                    </TableCell>
                    <TableCell>{r.full_name}</TableCell>
                    <TableCell>{r.roll_number}</TableCell>
                    <TableCell>{r.total_marks}</TableCell>
                    <TableCell>{r.percentage}%</TableCell>
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

export default GenerateRank;
