import React, { useState, useEffect } from 'react';
import { useSchoolSlug } from '@/hooks/useSchoolSlug';
import publicCmsService from '@/services/publicCmsService';
import { supabase } from '@/lib/customSupabaseClient';
import { PublicHeader, PublicFooter, TopBar } from '@/components/public/PublicLayoutComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Search, FileText, Loader2, GraduationCap, Award, TrendingUp, Printer, Download, CheckCircle, XCircle, AlertTriangle, BookOpen, BarChart3, Trophy } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';

const ExamResultPage = () => {
  const schoolAlias = useSchoolSlug();
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [school, setSchool] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);
  const [menus, setMenus] = useState([]);
  const [news, setNews] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [siteRes, newsRes] = await Promise.all([
          publicCmsService.getPublicSite(schoolAlias),
          publicCmsService.getPublicNewsList(schoolAlias)
        ]);

        if (siteRes.success) {
          setSchool(siteRes.data.school);
          setSiteSettings(siteRes.data.settings);
          setMenus(siteRes.data.menus || []);
          
          // Fetch exams for this school
          // Note: Using basic columns that are likely to exist
          const { data: publishedExams, error: examError } = await supabase
            .from('exams')
            .select('id, name, session_id, created_at')
            .eq('branch_id', siteRes.data.school.id)
            .order('created_at', { ascending: false });
          
          if (!examError) {
            setExams(publishedExams || []);
          } else {
            console.error('Error fetching exams:', examError);
            setExams([]);
          }
        }
        
        if (newsRes.success) {
          setNews(newsRes.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (schoolAlias) {
      fetchData();
    }
  }, [schoolAlias]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    
    if (!selectedExam) {
      setError('Please select an exam');
      return;
    }
    
    if (!admissionNo.trim()) {
      setError('Please enter admission number');
      return;
    }

    setSearching(true);
    setSearched(true);
    
    try {
      // Fetch student by admission number
      const { data: student, error: studentError } = await supabase
        .from('student_profiles')
        .select('id, full_name, school_code, class_id, section_id, photo_url, roll_number')
        .eq('branch_id', school.id)
        .eq('school_code', admissionNo.trim())
        .single();

      if (studentError || !student) {
        setError('Student not found with this admission number');
        setSearching(false);
        return;
      }

      // Fetch exam schedule to get subjects
      const { data: examSchedule } = await supabase
        .from('exam_schedules')
        .select('id, subject_id, max_marks, passing_marks, subjects(name)')
        .eq('exam_id', selectedExam);

      if (!examSchedule || examSchedule.length === 0) {
        setError('No exam schedule found for this exam');
        setSearching(false);
        return;
      }

      // Fetch marks for this student
      const { data: marks } = await supabase
        .from('exam_marks')
        .select('exam_schedule_id, marks_obtained, is_absent, remarks')
        .eq('student_id', student.id)
        .in('exam_schedule_id', examSchedule.map(e => e.id));

      // Fetch class and section names
      const [{ data: classData }, { data: sectionData }, { data: examData }] = await Promise.all([
        supabase.from('classes').select('name').eq('id', student.class_id).single(),
        supabase.from('sections').select('name').eq('id', student.section_id).single(),
        supabase.from('exams').select('name, session_id').eq('id', selectedExam).single()
      ]);

      // Process results
      const subjectResults = examSchedule.map(schedule => {
        const mark = marks?.find(m => m.exam_schedule_id === schedule.id);
        const obtained = mark?.marks_obtained || 0;
        const percentage = schedule.max_marks > 0 ? (obtained / schedule.max_marks) * 100 : 0;
        const passed = mark?.is_absent ? false : obtained >= (schedule.passing_marks || 0);
        
        return {
          subject: schedule.subjects?.name || 'Unknown',
          maxMarks: schedule.max_marks,
          passingMarks: schedule.passing_marks,
          obtained: mark?.is_absent ? 'AB' : obtained,
          percentage: percentage.toFixed(1),
          status: mark?.is_absent ? 'Absent' : passed ? 'Pass' : 'Fail',
          remarks: mark?.remarks || ''
        };
      });

      const validMarks = subjectResults.filter(s => s.obtained !== 'AB');
      const totalObtained = validMarks.reduce((sum, s) => sum + (typeof s.obtained === 'number' ? s.obtained : 0), 0);
      const totalMax = validMarks.reduce((sum, s) => sum + s.maxMarks, 0);
      const overallPercentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : 0;
      const allPassed = subjectResults.every(s => s.status === 'Pass');
      const hasAbsent = subjectResults.some(s => s.status === 'Absent');

      // Calculate grade
      let grade = 'F';
      let gradeRemark = 'Needs Improvement';
      if (overallPercentage >= 90) { grade = 'A+'; gradeRemark = 'Outstanding'; }
      else if (overallPercentage >= 80) { grade = 'A'; gradeRemark = 'Excellent'; }
      else if (overallPercentage >= 70) { grade = 'B+'; gradeRemark = 'Very Good'; }
      else if (overallPercentage >= 60) { grade = 'B'; gradeRemark = 'Good'; }
      else if (overallPercentage >= 50) { grade = 'C+'; gradeRemark = 'Above Average'; }
      else if (overallPercentage >= 40) { grade = 'C'; gradeRemark = 'Average'; }
      else if (overallPercentage >= 33) { grade = 'D'; gradeRemark = 'Below Average'; }

      setResult({
        student: {
          ...student,
          className: classData?.name || '',
          sectionName: sectionData?.name || ''
        },
        exam: examData,
        subjects: subjectResults,
        totalObtained,
        totalMax,
        percentage: overallPercentage,
        grade,
        gradeRemark,
        resultStatus: hasAbsent ? 'Incomplete' : allPassed ? 'PASS' : 'FAIL'
      });
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching');
    } finally {
      setSearching(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status) => {
    if (status === 'Pass') return 'text-green-600 bg-green-100';
    if (status === 'Fail') return 'text-red-600 bg-red-100';
    return 'text-amber-600 bg-amber-100';
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A+': 'from-emerald-500 to-green-600',
      'A': 'from-green-500 to-emerald-600',
      'B+': 'from-blue-500 to-indigo-600',
      'B': 'from-indigo-500 to-purple-600',
      'C+': 'from-amber-500 to-orange-600',
      'C': 'from-orange-500 to-red-500',
      'D': 'from-red-500 to-rose-600',
      'F': 'from-gray-500 to-gray-700'
    };
    return colors[grade] || 'from-gray-500 to-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 font-sans">
      <Helmet>
        <title>Exam Results | {school?.name || 'School'}</title>
      </Helmet>

      <TopBar settings={siteSettings} news={news} />
      <PublicHeader 
        settings={siteSettings} 
        menus={menus} 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen}
        slug={schoolAlias}
      />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl shadow-lg mb-4">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Exam Results
            </h1>
            <p className="text-gray-600 mt-3 text-lg">Enter your admission number to view your examination results</p>
          </div>

          {/* Search Form */}
          <Card className="mb-8 shadow-xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-orange-600 p-4">
              <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                <Search className="h-5 w-5" /> Search Result
              </h2>
            </div>
            <CardContent className="pt-6 pb-8">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Admission No <span className="text-red-500">*</span></label>
                    <Input 
                      placeholder="Enter your admission number" 
                      value={admissionNo}
                      onChange={e => setAdmissionNo(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Select Exam <span className="text-red-500">*</span></label>
                    <Select onValueChange={setSelectedExam} value={selectedExam}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select Examination" />
                      </SelectTrigger>
                      <SelectContent>
                        {exams.length > 0 ? (
                          exams.map(e => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-exams" disabled>No exams available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {error && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg"
                  >
                    <AlertTriangle className="h-5 w-5" />
                    {error}
                  </motion.div>
                )}

                <Button 
                  type="submit" 
                  disabled={searching}
                  className="w-full md:w-auto h-12 px-8 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                >
                  {searching ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Searching...</>
                  ) : (
                    <><Search className="mr-2 h-5 w-5" /> Search</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Result Display */}
          <AnimatePresence>
            {searched && result && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="space-y-6"
              >
                {/* Student Info & Summary */}
                <Card className="shadow-xl border-0 overflow-hidden print:shadow-none">
                  <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-4 flex justify-between items-center">
                    <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                      <Award className="h-5 w-5" /> Result Card - {result.exam?.name}
                    </h2>
                    <div className="flex gap-2 print:hidden">
                      <Button variant="secondary" size="sm" onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-1" /> Print
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    {/* Student Details */}
                    <div className="grid md:grid-cols-5 gap-6 mb-8">
                      <div className="md:col-span-1 flex justify-center">
                        <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                          {result.student.photo_url ? (
                            <img src={result.student.photo_url} alt="Student" className="w-full h-full object-cover" />
                          ) : (
                            <GraduationCap className="h-12 w-12 text-slate-400" />
                          )}
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Student Name</p>
                          <p className="font-bold text-xl text-gray-900">{result.student.full_name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Admission No</p>
                            <p className="font-semibold">{result.student.school_code}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Roll No</p>
                            <p className="font-semibold">{result.student.roll_number || '-'}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Class & Section</p>
                          <p className="font-semibold">{result.student.className} - {result.student.sectionName}</p>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        {/* Grade Display */}
                        <div className={`rounded-2xl bg-gradient-to-br ${getGradeColor(result.grade)} p-6 text-white text-center`}>
                          <p className="text-sm opacity-80">Overall Grade</p>
                          <p className="text-5xl font-black">{result.grade}</p>
                          <p className="text-sm opacity-90 mt-1">{result.gradeRemark}</p>
                          <div className="mt-3 pt-3 border-t border-white/20">
                            <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold ${
                              result.resultStatus === 'PASS' ? 'bg-white/20' : 
                              result.resultStatus === 'FAIL' ? 'bg-red-900/50' : 'bg-amber-900/50'
                            }`}>
                              {result.resultStatus === 'PASS' && <CheckCircle className="h-4 w-4 inline mr-1" />}
                              {result.resultStatus === 'FAIL' && <XCircle className="h-4 w-4 inline mr-1" />}
                              {result.resultStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Marks Summary */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="p-4 text-center">
                          <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                          <p className="text-sm text-blue-600">Total Marks</p>
                          <p className="text-2xl font-bold text-blue-700">{result.totalObtained}/{result.totalMax}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <CardContent className="p-4 text-center">
                          <BarChart3 className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                          <p className="text-sm text-purple-600">Percentage</p>
                          <p className="text-2xl font-bold text-purple-700">{result.percentage}%</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                        <CardContent className="p-4 text-center">
                          <Trophy className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                          <p className="text-sm text-emerald-600">Subjects</p>
                          <p className="text-2xl font-bold text-emerald-700">{result.subjects.length}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Subject-wise Results Table */}
                    <div className="overflow-x-auto rounded-xl border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="font-bold">Subject</TableHead>
                            <TableHead className="text-center font-bold">Max Marks</TableHead>
                            <TableHead className="text-center font-bold">Passing</TableHead>
                            <TableHead className="text-center font-bold">Obtained</TableHead>
                            <TableHead className="text-center font-bold">Percentage</TableHead>
                            <TableHead className="text-center font-bold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.subjects.map((subject, idx) => (
                            <TableRow key={idx} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{subject.subject}</TableCell>
                              <TableCell className="text-center">{subject.maxMarks}</TableCell>
                              <TableCell className="text-center">{subject.passingMarks}</TableCell>
                              <TableCell className="text-center font-bold text-lg">
                                {subject.obtained}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center gap-2">
                                  <Progress value={parseFloat(subject.percentage)} className="h-2 w-16" />
                                  <span className="text-sm">{subject.percentage}%</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={getStatusColor(subject.status)}>
                                  {subject.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {searched && !result && !error && !searching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No result found for the given admission number</p>
                <p className="text-gray-400 text-sm mt-2">Please check your admission number and try again</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <PublicFooter settings={siteSettings} />
    </div>
  );
};

export default ExamResultPage;
