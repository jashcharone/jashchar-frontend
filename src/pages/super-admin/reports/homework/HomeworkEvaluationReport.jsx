import React, { useState, useEffect, useMemo, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DataTableExport from '@/components/DataTableExport';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

const HomeworkEvaluationReport = () => {
  const { user, currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;
  
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const printRef = useRef();

  const columns = useMemo(() => [
    { key: 'subject', label: 'Subject' },
    { key: 'homework_date_formatted', label: 'Homework Date' },
    { key: 'submission_date_formatted', label: 'Submission Date' },
    { key: 'complete_incomplete', label: 'Complete / Incomplete' },
    { key: 'percentage_formatted', label: 'Complete %' }
  ], []);

  const exportData = useMemo(() => {
    return reportData.map(item => ({
      ...item,
      homework_date_formatted: format(new Date(item.homeworkDate), 'dd/MM/yyyy'),
      submission_date_formatted: format(new Date(item.submissionDate), 'dd/MM/yyyy'),
      complete_incomplete: `${item.completed} / ${item.incomplete}`,
      percentage_formatted: `${item.percentage}%`
    }));
  }, [reportData]);

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

  useEffect(() => {
    if (branchId) {
      fetchClasses();
    }
  }, [branchId]);

  // --- Data Fetching for Dropdowns ---
  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('*').eq('branch_id', branchId);
    setClasses(data || []);
  };

  const fetchSections = async (classId) => {
    if (!classId) { setSections([]); return; }
    const { data } = await supabase
      .from('sections')
      .select('*, class_sections!inner(class_id)')
      .eq('class_sections.class_id', classId)
      .eq('branch_id', branchId);
    setSections(data || []);
  };

  const fetchSubjectGroups = async (classId) => {
    if (!classId) { setSubjectGroups([]); return; }
    const { data } = await supabase
      .from('subject_groups')
      .select('*')
      .eq('branch_id', branchId)
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

  // --- Handlers ---
  const handleClassChange = (val) => {
    setFilters(prev => ({ ...prev, class_id: val, section_id: '', subject_group_id: '', subject_id: '' }));
    fetchSections(val);
    fetchSubjectGroups(val);
  };

  const handleSubjectGroupChange = (val) => {
    setFilters(prev => ({ ...prev, subject_group_id: val, subject_id: '' }));
    fetchSubjects(val);
  };

  // --- Main Search Logic ---
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
          classes(name),
          sections(name)
        `)
        .eq('branch_id', branchId)
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

      // 2. Fetch Student Count for Class/Section - Filter by session
      let studentCountQuery = supabase
        .from('student_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .eq('class_id', filters.class_id)
        .eq('section_id', filters.section_id);
      
      // Add session filter if available
      if (currentSessionId) {
        studentCountQuery = studentCountQuery.eq('session_id', currentSessionId);
      }
      
      const { count: studentCount, error: countError } = await studentCountQuery;
      if (countError) throw countError;

      // 3. Fetch Evaluations for these homeworks to count completions
      const homeworkIds = homeworks.map(h => h.id);
      const { data: evaluations, error: evalError } = await supabase
        .from('homework_evaluations')
        .select('homework_id, status')
        .in('homework_id', homeworkIds)
        .eq('status', 'Evaluated');

      if (evalError) throw evalError;

      // 4. Aggregate Data
      const result = homeworks.map(hw => {
        const completedCount = evaluations.filter(e => e.homework_id === hw.id).length;
        // Note: Incomplete = Total Students - Completed. 
        // If total students is 0 (shouldn't happen often), incomplete is 0.
        const incompleteCount = Math.max(0, (studentCount || 0) - completedCount);
        const percentage = studentCount > 0 ? ((completedCount / studentCount) * 100).toFixed(2) : "0.00";

        return {
          id: hw.id,
          subject: `${hw.subjects?.name} (${hw.subjects?.code || ''})`,
          homeworkDate: hw.homework_date,
          submissionDate: hw.submission_date,
          completed: completedCount,
          incomplete: incompleteCount,
          total: studentCount,
          percentage: percentage
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

  const filteredReport = reportData.filter(item => 
    item.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 bg-background min-h-screen">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Homework Evaluation Report</h1>
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
              <CardTitle className="text-lg">Homework Evaluation Report</CardTitle>
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
                {exportData.length > 0 && (
                  <DataTableExport
                    data={exportData}
                    columns={columns}
                    fileName="Homework_Evaluation_Report"
                    title="Homework Evaluation Report"
                    printRef={printRef}
                  />
                )}
              </div>

              <div ref={printRef} className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead>Subject</TableHead>
                      <TableHead>Homework Date</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Complete / Incomplete</TableHead>
                      <TableHead className="text-right">Complete %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReport.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.subject}</TableCell>
                        <TableCell>{format(new Date(item.homeworkDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{format(new Date(item.submissionDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{item.completed} / {item.incomplete}</TableCell>
                        <TableCell className="text-right">{item.percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Records: 1 to {filteredReport.length} of {filteredReport.length}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HomeworkEvaluationReport;
