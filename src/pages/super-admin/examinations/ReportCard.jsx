import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Search, Printer, User, BookOpen } from 'lucide-react';

const ReportCard = () => {
  const { user, currentSessionId } = useAuth();
  const { toast } = useToast();
  const branchId = user?.profile?.branch_id;
  const organizationId = user?.profile?.organization_id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Dropdown data
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);

  // Selection states
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  // Report card data
  const [reportData, setReportData] = useState(null);
  const [examGroups, setExamGroups] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);

  const fetchInitialData = useCallback(async () => {
    if (!branchId) return;
    try {
      const { data: classData } = await supabase
        .from('classes')
        .select('id, name')
        .eq('branch_id', branchId)
        .order('name');
      setClasses(classData || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setInitialLoading(false);
    }
  }, [branchId]);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  const handleClassChange = async (classId) => {
    setSelectedClass(classId);
    setSelectedSection('');
    setSelectedStudent('');
    setReportData(null);
    setStudentInfo(null);

    const { data } = await supabase
      .from('sections')
      .select('id, name')
      .eq('branch_id', branchId)
      .order('name');
    setSections(data || []);
  };

  const handleSectionChange = async (sectionId) => {
    setSelectedSection(sectionId);
    setSelectedStudent('');
    setReportData(null);
    setStudentInfo(null);

    let query = supabase
      .from('student_profiles')
      .select('id, full_name, roll_number, admission_no')
      .eq('branch_id', branchId)
      .eq('class_id', selectedClass)
      .eq('section_id', sectionId)
      .eq('is_active', true)
      .order('roll_number');

    if (currentSessionId) {
      query = query.eq('session_id', currentSessionId);
    }

    const { data } = await query;
    setStudents(data || []);
  };

  const handleSearch = async () => {
    if (!selectedStudent) {
      toast({ title: "Error", description: "Please select a Student", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Fetch student info
      const { data: student } = await supabase
        .from('student_profiles')
        .select(`
          id, full_name, roll_number, admission_no, dob, gender, 
          father_name, mother_name, phone, email, photo_url,
          class_id, section_id
        `)
        .eq('id', selectedStudent)
        .single();

      if (!student) {
        toast({ title: "Error", description: "Student not found", variant: "destructive" });
        return;
      }

      // Get class and section names
      const [classRes, sectionRes] = await Promise.all([
        supabase.from('classes').select('name').eq('id', student.class_id).single(),
        supabase.from('sections').select('name').eq('id', student.section_id).single(),
      ]);

      setStudentInfo({
        ...student,
        class_name: classRes.data?.name || 'N/A',
        section_name: sectionRes.data?.name || 'N/A',
      });

      // Fetch exam groups for this branch
      const { data: groups } = await supabase
        .from('exam_groups')
        .select('id, name')
        .eq('branch_id', branchId)
        .order('name');
      setExamGroups(groups || []);

      // Fetch exams for these groups
      const groupIds = (groups || []).map(g => g.id);
      if (groupIds.length === 0) {
        setReportData({ exams: [], results: {} });
        setLoading(false);
        return;
      }

      const { data: exams } = await supabase
        .from('exams')
        .select('id, name, exam_group_id')
        .in('exam_group_id', groupIds)
        .order('name');

      // Fetch exam subjects for all exams
      const examIds = (exams || []).map(e => e.id);
      let subjects = [];
      if (examIds.length > 0) {
        const { data: subData } = await supabase
          .from('exam_subjects')
          .select('id, exam_id, subject_name, max_marks, min_marks')
          .in('exam_id', examIds);
        subjects = subData || [];
      }

      // Fetch student's marks
      const subjectIds = subjects.map(s => s.id);
      let marks = [];
      if (subjectIds.length > 0) {
        const { data: marksData } = await supabase
          .from('exam_marks')
          .select('exam_subject_id, marks_obtained, is_absent, remarks')
          .eq('student_id', selectedStudent)
          .in('exam_subject_id', subjectIds);
        marks = marksData || [];
      }

      // Build report structure
      const marksMap = {};
      marks.forEach(m => { marksMap[m.exam_subject_id] = m; });

      const examResults = {};
      (exams || []).forEach(exam => {
        const examSubjects = subjects.filter(s => s.exam_id === exam.id);
        const subjectResults = examSubjects.map(sub => {
          const mark = marksMap[sub.id];
          return {
            subject: sub.subject_name,
            max_marks: sub.max_marks,
            min_marks: sub.min_marks,
            obtained: mark ? (mark.is_absent ? 'AB' : mark.marks_obtained) : '-',
            is_absent: mark?.is_absent || false,
            remarks: mark?.remarks || '',
            passed: mark && !mark.is_absent ? mark.marks_obtained >= sub.min_marks : false,
          };
        });

        const totalObtained = subjectResults.reduce((sum, s) => {
          return sum + (typeof s.obtained === 'number' ? s.obtained : 0);
        }, 0);
        const totalMax = subjectResults.reduce((sum, s) => sum + (s.max_marks || 0), 0);
        const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : '0.00';
        const allPassed = subjectResults.every(s => s.passed || s.obtained === '-');

        examResults[exam.id] = {
          exam_name: exam.name,
          group: groups.find(g => g.id === exam.exam_group_id)?.name || '',
          subjects: subjectResults,
          total_obtained: totalObtained,
          total_max: totalMax,
          percentage: percentage,
          result: subjectResults.length > 0 ? (allPassed ? 'Pass' : 'Fail') : 'N/A',
        };
      });

      setReportData({ exams: exams || [], results: examResults });
    } catch (error) {
      console.error('ReportCard error:', error);
      toast({ title: "Error", description: "Failed to generate report card", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Report Card</h1>
          {reportData && (
            <Button variant="outline" onClick={handlePrint} className="print:hidden">
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="print:hidden">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Class</label>
                <Select onValueChange={handleClassChange} value={selectedClass}>
                  <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Section</label>
                <Select onValueChange={handleSectionChange} value={selectedSection} disabled={!selectedClass}>
                  <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                  <SelectContent>
                    {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Student</label>
                <Select onValueChange={setSelectedStudent} value={selectedStudent} disabled={!selectedSection}>
                  <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name} {s.roll_number ? `(${s.roll_number})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} disabled={loading || !selectedStudent} className="w-full">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Generate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Info Card */}
        {studentInfo && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" /> Student Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-gray-500">Name:</span> <span className="font-medium">{studentInfo.full_name}</span></div>
                <div><span className="text-gray-500">Admission No:</span> <span className="font-medium">{studentInfo.admission_no || 'N/A'}</span></div>
                <div><span className="text-gray-500">Roll No:</span> <span className="font-medium">{studentInfo.roll_number || 'N/A'}</span></div>
                <div><span className="text-gray-500">Class:</span> <span className="font-medium">{studentInfo.class_name} - {studentInfo.section_name}</span></div>
                <div><span className="text-gray-500">Father:</span> <span className="font-medium">{studentInfo.father_name || 'N/A'}</span></div>
                <div><span className="text-gray-500">Mother:</span> <span className="font-medium">{studentInfo.mother_name || 'N/A'}</span></div>
                <div><span className="text-gray-500">DOB:</span> <span className="font-medium">{studentInfo.dob || 'N/A'}</span></div>
                <div><span className="text-gray-500">Gender:</span> <span className="font-medium">{studentInfo.gender || 'N/A'}</span></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exam Results */}
        {reportData && (
          <>
            {reportData.exams.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No Exams Found</p>
                  <p className="text-sm">No exam groups or exams have been configured for this branch yet.</p>
                </CardContent>
              </Card>
            ) : (
              reportData.exams.map(exam => {
                const result = reportData.results[exam.id];
                if (!result || result.subjects.length === 0) return null;
                return (
                  <Card key={exam.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {result.group && <span className="text-gray-500 text-sm mr-2">[{result.group}]</span>}
                          {result.exam_name}
                        </CardTitle>
                        <Badge
                          className={result.result === 'Pass' ? 'bg-green-100 text-green-700 border-green-200' : result.result === 'Fail' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700'}
                        >
                          {result.result}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead className="text-center">Max Marks</TableHead>
                            <TableHead className="text-center">Min Marks</TableHead>
                            <TableHead className="text-center">Obtained</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead>Remarks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.subjects.map((sub, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{sub.subject}</TableCell>
                              <TableCell className="text-center">{sub.max_marks}</TableCell>
                              <TableCell className="text-center">{sub.min_marks}</TableCell>
                              <TableCell className="text-center font-semibold">
                                {sub.is_absent ? (
                                  <span className="text-orange-500">AB</span>
                                ) : (
                                  <span className={typeof sub.obtained === 'number' && sub.obtained < sub.min_marks ? 'text-red-500' : ''}>
                                    {sub.obtained}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {sub.obtained === '-' ? (
                                  <span className="text-gray-400">-</span>
                                ) : sub.passed ? (
                                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Pass</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">{sub.is_absent ? 'Absent' : 'Fail'}</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">{sub.remarks}</TableCell>
                            </TableRow>
                          ))}
                          {/* Total Row */}
                          <TableRow className="bg-gray-50 dark:bg-gray-800 font-semibold">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-center">{result.total_max}</TableCell>
                            <TableCell className="text-center">-</TableCell>
                            <TableCell className="text-center">{result.total_obtained}</TableCell>
                            <TableCell className="text-center">{result.percentage}%</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReportCard;
