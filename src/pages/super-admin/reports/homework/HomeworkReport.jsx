import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, Copy, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import StudentListModal from './StudentListModal';

const HomeworkReport = () => {
  const { user, currentSessionId } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Filters
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjectGroups, setSubjectGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [filters, setFilters] = useState({
    class_id: '',
    section_id: '',
    subject_group_id: '',
    subject_id: ''
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalStudents, setModalStudents] = useState([]);

  useEffect(() => {
    if (user?.profile?.branch_id) {
      fetchClasses();
    }
  }, [user]);

  // --- Data Fetching for Dropdowns ---
  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('*').eq('branch_id', user.profile.branch_id);
    setClasses(data || []);
  };

  const fetchSections = async (classId) => {
    if (!classId) { setSections([]); return; }
    const { data } = await supabase
      .from('sections')
      .select('*, class_sections!inner(class_id)')
      .eq('class_sections.class_id', classId)
      .eq('branch_id', user.profile.branch_id);
    setSections(data || []);
  };

  const fetchSubjectGroups = async (classId) => {
    if (!classId) { setSubjectGroups([]); return; }
    const { data } = await supabase
      .from('subject_groups')
      .select('*')
      .eq('branch_id', user.profile.branch_id)
      .contains('class_ids', [classId]);
    setSubjectGroups(data || []);
  };

  const fetchSubjects = async (groupId) => {
    if (!groupId) { setSubjects([]); return; }
    const { data: groupData } = await supabase
        .from('subject_groups')
        .select('subject_ids')
        .eq('id', groupId)
        .single();
    
    if (groupData?.subject_ids) {
        const { data: subjectsData } = await supabase
            .from('subjects')
            .select('*')
            .in('id', groupData.subject_ids);
        setSubjects(subjectsData || []);
    }
  };

  const handleClassChange = (val) => {
    setFilters(prev => ({ ...prev, class_id: val, section_id: '', subject_group_id: '', subject_id: '' }));
    fetchSections(val);
    fetchSubjectGroups(val);
  };

  const handleSubjectGroupChange = (val) => {
    setFilters(prev => ({ ...prev, subject_group_id: val, subject_id: '' }));
    fetchSubjects(val);
  };

  const handleSearch = async () => {
    if (!filters.class_id || !filters.section_id) {
      toast({ title: "Error", description: "Class and Section are required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch Homeworks
      let query = supabase
        .from('homeworks')
        .select(`
          id,
          homework_date,
          submission_date,
          subjects(name, code),
          subject_groups(name),
          classes(name),
          sections(name)
        `)
        .eq('branch_id', user.profile.branch_id)
        .eq('class_id', filters.class_id)
        .eq('section_id', filters.section_id);

      if (filters.subject_group_id) query = query.eq('subject_group_id', filters.subject_group_id);
      if (filters.subject_id) query = query.eq('subject_id', filters.subject_id);

      const { data: homeworks, error: hwError } = await query;
      if (hwError) throw hwError;

      if (!homeworks || homeworks.length === 0) {
        setReportData([]);
        setLoading(false);
        toast({ title: "Info", description: "No homework found for criteria" });
        return;
      }

      // 2. Fetch All Students in Class/Section (Base Data) - Filter by session
      let studentsQuery = supabase
        .from('student_profiles')
        .select('id, full_name, school_code, phone, father_name, date_of_birth, gender')
        .eq('branch_id', user.profile.branch_id)
        .eq('class_id', filters.class_id)
        .eq('section_id', filters.section_id);
      
      // Add session filter if available
      if (currentSessionId) {
        studentsQuery = studentsQuery.eq('session_id', currentSessionId);
      }
      
      const { data: allStudents, error: studentsError } = await studentsQuery;

      if (studentsError) throw studentsError;

      // Enrich student data with class/section names for the modal
      const enrichedStudents = allStudents.map(s => ({
        ...s,
        class_name: homeworks[0].classes.name,
        section_name: homeworks[0].sections.name
      }));

      // 3. Fetch Evaluations for these homeworks
      const homeworkIds = homeworks.map(h => h.id);
      const { data: evaluations, error: evalError } = await supabase
        .from('homework_evaluations')
        .select('homework_id, student_id, status')
        .in('homework_id', homeworkIds);

      if (evalError) throw evalError;

      // 4. Process Data per Homework
      const result = homeworks.map(hw => {
        const hwEvals = evaluations.filter(e => e.homework_id === hw.id);
        
        // Determine status lists
        const submittedStudentIds = hwEvals
            .filter(e => e.status === 'Evaluated') // Assuming 'Evaluated' implies submitted/completed
            .map(e => e.student_id);
            
        const submittedStudents = enrichedStudents.filter(s => submittedStudentIds.includes(s.id));
        const pendingStudents = enrichedStudents.filter(s => !submittedStudentIds.includes(s.id));

        return {
          id: hw.id,
          class: hw.classes.name,
          section: hw.sections.name,
          subjectGroup: hw.subject_groups?.name,
          subject: `${hw.subjects?.name} (${hw.subjects?.code || ''})`,
          homeworkDate: hw.homework_date,
          submissionDate: hw.submission_date,
          totalStudentsList: enrichedStudents,
          submittedStudentsList: submittedStudents,
          pendingStudentsList: pendingStudents,
          // Counts for display
          totalCount: enrichedStudents.length,
          submittedCount: submittedStudents.length,
          pendingCount: pendingStudents.length
        };
      });

      setReportData(result);
      toast({ title: "Success", description: "Report generated successfully" });

    } catch (error) {
      console.error("Error generating report:", error);
      toast({ title: "Error", description: "Failed to generate report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openStudentModal = (title, students) => {
    setModalTitle(title);
    setModalStudents(students);
    setModalOpen(true);
  };

  const filteredReport = reportData.filter(item => 
    item.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 bg-background min-h-screen">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Homework Report</h1>
        </div>

        <Card className="border-t-4 border-t-orange-500 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Select Criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Class *</label>
                <Select value={filters.class_id} onValueChange={handleClassChange}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Section *</label>
                <Select value={filters.section_id} onValueChange={(val) => setFilters({...filters, section_id: val})}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject Group</label>
                <Select value={filters.subject_group_id} onValueChange={handleSubjectGroupChange}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {subjectGroups.map(sg => <SelectItem key={sg.id} value={sg.id}>{sg.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Select value={filters.subject_id} onValueChange={(val) => setFilters({...filters, subject_id: val})}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSearch} className="bg-gray-800 hover:bg-gray-900 text-white">
                <Search className="h-4 w-4 mr-2" /> Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {reportData.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Homework Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" title="Copy"><Copy className="h-4 w-4 text-gray-600" /></Button>
                  <Button variant="outline" size="icon" title="Excel"><FileSpreadsheet className="h-4 w-4 text-gray-600" /></Button>
                  <Button variant="outline" size="icon" title="CSV"><FileText className="h-4 w-4 text-gray-600" /></Button>
                  <Button variant="outline" size="icon" title="Print"><Printer className="h-4 w-4 text-gray-600" /></Button>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Subject Group</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Homework Date</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead className="text-center">Student Count</TableHead>
                      <TableHead className="text-center">Homework Submitted</TableHead>
                      <TableHead className="text-center">Pending Student</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReport.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.class}</TableCell>
                        <TableCell>{item.section}</TableCell>
                        <TableCell>{item.subjectGroup}</TableCell>
                        <TableCell className="font-medium">{item.subject}</TableCell>
                        <TableCell>{format(new Date(item.homeworkDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{format(new Date(item.submissionDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="link" className="h-auto p-0 font-bold text-blue-600" onClick={() => openStudentModal(`Total Students - ${item.subject}`, item.totalStudentsList)}>
                            {item.totalCount}
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="link" className="h-auto p-0 font-bold text-green-600" onClick={() => openStudentModal(`Submitted Homework - ${item.subject}`, item.submittedStudentsList)}>
                            {item.submittedCount}
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="link" className="h-auto p-0 font-bold text-red-600" onClick={() => openStudentModal(`Pending Homework - ${item.subject}`, item.pendingStudentsList)}>
                            {item.pendingCount}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Records: 1 to {filteredReport.length} of {filteredReport.length}
              </div>
            </CardContent>
          </Card>
        )}

        <StudentListModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          title={modalTitle}
          students={modalStudents}
        />
      </div>
    </DashboardLayout>
  );
};

export default HomeworkReport;
