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
import { Search, FileText, Loader2, GraduationCap, Award, TrendingUp, Printer, Download, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';

const CBSEExamResult = () => {
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
          
          // Fetch CBSE exams for this school
          // Note: Not all columns may exist, so we fetch basic columns
          const { data: cbseExams, error: examError } = await supabase
            .from('cbse_exams')
            .select('id, name, created_at')
            .eq('branch_id', siteRes.data.school.id)
            .order('created_at', { ascending: false });
          
          if (!examError) {
            setExams(cbseExams || []);
          } else {
            console.error('Error fetching CBSE exams:', examError);
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
        .select('id, full_name, school_code, class_id, section_id, photo_url')
        .eq('branch_id', school.id)
        .eq('school_code', admissionNo.trim())
        .single();

      if (studentError || !student) {
        setError('Student not found with this admission number');
        setSearching(false);
        return;
      }

      // Fetch CBSE exam results
      const { data: examResult, error: resultError } = await supabase
        .from('cbse_exam_results')
        .select(`
          *,
          exam:cbse_exams(name),
          subjects:cbse_exam_result_subjects(
            subject_name,
            theory_marks,
            practical_marks,
            total_marks,
            max_marks,
            grade,
            grade_point
          )
        `)
        .eq('cbse_exam_id', selectedExam)
        .eq('student_id', student.id)
        .single();

      if (resultError || !examResult) {
        setError('Result not found for this exam');
        setSearching(false);
        return;
      }

      // Fetch class and section names
      const { data: classData } = await supabase
        .from('classes')
        .select('name')
        .eq('id', student.class_id)
        .single();

      const { data: sectionData } = await supabase
        .from('sections')
        .select('name')
        .eq('id', student.section_id)
        .single();

      setResult({
        student: {
          ...student,
          className: classData?.name || '',
          sectionName: sectionData?.name || ''
        },
        exam: examResult.exam,
        subjects: examResult.subjects || [],
        totalMarks: examResult.total_marks_obtained,
        maxMarks: examResult.total_max_marks,
        percentage: examResult.percentage,
        cgpa: examResult.cgpa,
        overallGrade: examResult.overall_grade,
        result: examResult.result_status,
        rank: examResult.rank
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

  const getGradeColor = (grade) => {
    const colors = {
      'A1': 'bg-emerald-500',
      'A2': 'bg-green-500',
      'B1': 'bg-lime-500',
      'B2': 'bg-yellow-500',
      'C1': 'bg-amber-500',
      'C2': 'bg-orange-500',
      'D': 'bg-red-400',
      'E': 'bg-red-600'
    };
    return colors[grade] || 'bg-gray-500';
  };

  const getResultColor = (status) => {
    if (status?.toLowerCase() === 'pass') return 'text-green-600 bg-green-100';
    if (status?.toLowerCase() === 'fail') return 'text-red-600 bg-red-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans">
      <Helmet>
        <title>CBSE Exam Results | {school?.name || 'School'}</title>
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              CBSE Exam Results
            </h1>
            <p className="text-gray-600 mt-3 text-lg">Enter your admission number to view your CBSE examination results</p>
          </div>

          {/* Search Form */}
          <Card className="mb-8 shadow-xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
              <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                <Search className="h-5 w-5" /> Search Result
              </h2>
            </div>
            <CardContent className="pt-6 pb-8">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
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
                              {e.name} {e.exam_year ? `(${e.exam_year})` : ''}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-exams" disabled>No exams available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Admission No <span className="text-red-500">*</span></label>
                    <Input 
                      placeholder="Enter your admission number" 
                      value={admissionNo}
                      onChange={e => setAdmissionNo(e.target.value)}
                      className="h-12"
                    />
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
                  className="w-full md:w-auto h-12 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  {searching ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Searching...</>
                  ) : (
                    <><Search className="mr-2 h-5 w-5" /> Search Result</>
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
                {/* Student Info Card */}
                <Card className="shadow-xl border-0 overflow-hidden print:shadow-none">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 flex justify-between items-center">
                    <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                      <Award className="h-5 w-5" /> Result Card
                    </h2>
                    <div className="flex gap-2 print:hidden">
                      <Button variant="secondary" size="sm" onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-1" /> Print
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-4 gap-6 mb-6">
                      <div className="md:col-span-1 flex justify-center">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                          {result.student.photo_url ? (
                            <img src={result.student.photo_url} alt="Student" className="w-full h-full object-cover" />
                          ) : (
                            <GraduationCap className="h-12 w-12 text-indigo-400" />
                          )}
                        </div>
                      </div>
                      <div className="md:col-span-3 grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Student Name</p>
                          <p className="font-semibold text-lg">{result.student.full_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Admission No</p>
                          <p className="font-semibold text-lg">{result.student.school_code}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Class</p>
                          <p className="font-semibold">{result.student.className} - {result.student.sectionName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Examination</p>
                          <p className="font-semibold">{result.exam?.name}</p>
                        </div>
                      </div>
                    </div>

                    {/* Subject-wise Results */}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>Subject</TableHead>
                            <TableHead className="text-center">Theory</TableHead>
                            <TableHead className="text-center">Practical</TableHead>
                            <TableHead className="text-center">Total</TableHead>
                            <TableHead className="text-center">Max Marks</TableHead>
                            <TableHead className="text-center">Grade</TableHead>
                            <TableHead className="text-center">Grade Point</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.subjects.map((subject, idx) => (
                            <TableRow key={idx} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{subject.subject_name}</TableCell>
                              <TableCell className="text-center">{subject.theory_marks ?? '-'}</TableCell>
                              <TableCell className="text-center">{subject.practical_marks ?? '-'}</TableCell>
                              <TableCell className="text-center font-semibold">{subject.total_marks}</TableCell>
                              <TableCell className="text-center">{subject.max_marks}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={`${getGradeColor(subject.grade)} text-white`}>
                                  {subject.grade}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">{subject.grade_point}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Summary */}
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-blue-600">Total Marks</p>
                          <p className="text-2xl font-bold text-blue-700">{result.totalMarks}/{result.maxMarks}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-purple-600">Percentage</p>
                          <p className="text-2xl font-bold text-purple-700">{result.percentage}%</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-amber-600">CGPA</p>
                          <p className="text-2xl font-bold text-amber-700">{result.cgpa}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-indigo-600">Grade</p>
                          <p className="text-2xl font-bold text-indigo-700">{result.overallGrade}</p>
                        </CardContent>
                      </Card>
                      <Card className={`${getResultColor(result.result)} border`}>
                        <CardContent className="p-4 text-center">
                          <p className="text-sm">Result</p>
                          <p className="text-2xl font-bold flex items-center justify-center gap-1">
                            {result.result?.toLowerCase() === 'pass' ? (
                              <CheckCircle className="h-6 w-6" />
                            ) : (
                              <XCircle className="h-6 w-6" />
                            )}
                            {result.result}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {result.rank && (
                      <div className="mt-4 text-center">
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-lg">
                          <TrendingUp className="h-5 w-5 mr-2 inline" />
                          Class Rank: #{result.rank}
                        </Badge>
                      </div>
                    )}
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* CBSE Grading Info */}
          <Card className="mt-8 shadow-lg border-0 print:hidden">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" /> CBSE Grading Scale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2 text-center text-sm">
                {[
                  { grade: 'A1', range: '91-100', point: '10' },
                  { grade: 'A2', range: '81-90', point: '9' },
                  { grade: 'B1', range: '71-80', point: '8' },
                  { grade: 'B2', range: '61-70', point: '7' },
                  { grade: 'C1', range: '51-60', point: '6' },
                  { grade: 'C2', range: '41-50', point: '5' },
                  { grade: 'D', range: '33-40', point: '4' },
                  { grade: 'E', range: 'Below 33', point: '0' }
                ].map(g => (
                  <div key={g.grade} className="p-2 rounded-lg bg-gray-50">
                    <Badge className={`${getGradeColor(g.grade)} text-white mb-1`}>{g.grade}</Badge>
                    <p className="text-xs text-gray-600">{g.range}</p>
                    <p className="text-xs text-gray-400">GP: {g.point}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <PublicFooter settings={siteSettings} />
    </div>
  );
};

export default CBSEExamResult;
