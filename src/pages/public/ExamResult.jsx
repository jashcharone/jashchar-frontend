import React, { useState, useEffect } from 'react';
import { useSchoolSlug } from '@/hooks/useSchoolSlug';
import publicCmsService from '@/services/publicCmsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Search, AlertCircle } from 'lucide-react';
import { PublicHeader, PublicFooter, TopBar } from '@/components/public/PublicLayoutComponents';
import { Helmet } from 'react-helmet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ExamResult = () => {
  const schoolAlias = useSchoolSlug();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  
  // Layout Data
  const [siteSettings, setSiteSettings] = useState(null);
  const [menus, setMenus] = useState([]);
  const [news, setNews] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Exam Data
  const [exams, setExams] = useState([]);
  const [formData, setFormData] = useState({
    enrollment_id: '',
    exam_id: ''
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch School Data & Site Settings
        const siteRes = await publicCmsService.getPublicSite(schoolAlias);
        if (!siteRes.success) {
            throw new Error(siteRes.message || 'School not found');
        }
        setSiteSettings(siteRes.data.settings);
        setMenus(siteRes.data.menus);

        // 2. Fetch News
        try {
            const newsRes = await publicCmsService.getPublicNewsList(schoolAlias);
            if (newsRes.success) setNews(newsRes.data);
        } catch (e) { console.error("News fetch failed", e); }

        // 3. Fetch Exams
        try {
            const examsRes = await publicCmsService.getPublicExams(schoolAlias);
            if (examsRes.success) {
                setExams(examsRes.data || []);
            }
        } catch (error) {
            if (error.response?.status === 403) {
                setIsEnabled(false);
            } else {
                console.error("Exams fetch failed", error);
            }
        }

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (schoolAlias) {
      fetchData();
    }
  }, [schoolAlias, toast]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!formData.enrollment_id || !formData.exam_id) {
        toast({ variant: 'destructive', title: 'Please fill all fields' });
        return;
    }

    setSearching(true);
    setError(null);
    setResult(null);

    try {
        const res = await publicCmsService.getPublicExamResult(schoolAlias, formData);
        if (res.success) {
            setResult(res.data);
        } else {
            setError(res.message || 'No result found');
        }
    } catch (err) {
        setError(err.response?.data?.message || 'Error fetching result');
    } finally {
        setSearching(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-50"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isEnabled) {
      return (
        <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">
            <Helmet><title>{`Exam Result | ${siteSettings?.school_name || 'School'}`}</title></Helmet>
            <TopBar settings={siteSettings} news={news} />
            <PublicHeader settings={siteSettings} menus={menus} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} slug={schoolAlias} />
            
            <div className="flex-grow flex items-center justify-center p-4 bg-gray-50">
                <Card className="w-full max-w-md text-center bg-red-50 border-red-200">
                    <CardContent className="pt-6">
                        <p className="text-red-600 font-medium">Exam Result module is Disabled Please Contact To Administrator</p>
                    </CardContent>
                </Card>
            </div>
            <PublicFooter settings={siteSettings} />
        </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">
      <Helmet><title>{`Exam Result | ${siteSettings?.school_name || 'School'}`}</title></Helmet>
      <TopBar settings={siteSettings} news={news} />
      <PublicHeader settings={siteSettings} menus={menus} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} slug={schoolAlias} />

      <div className="flex-grow bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">Exam Result</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Check Result</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-2">
                            <Label>Enroll ID <span className="text-red-500">*</span></Label>
                            <Input 
                                value={formData.enrollment_id} 
                                onChange={(e) => setFormData({...formData, enrollment_id: e.target.value})}
                                placeholder="Enter Enroll ID"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Exam <span className="text-red-500">*</span></Label>
                            <Select 
                                value={formData.exam_id} 
                                onValueChange={(val) => setFormData({...formData, exam_id: val})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Exam" />
                                </SelectTrigger>
                                <SelectContent>
                                    {exams.map(exam => (
                                        <SelectItem key={exam.id} value={exam.id.toString()}>
                                            {exam.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" disabled={searching}>
                            {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                            Search
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {result && (
                <Card>
                    <CardHeader>
                        <CardTitle>Result Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-500">Student Name</p>
                                <p className="font-semibold">{result.student_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Roll Number</p>
                                <p className="font-semibold">{result.roll_number || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Enroll ID</p>
                                <p className="font-semibold">{result.enrollment_id}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4">{result.exam_name}</h3>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Subject</TableHead>
                                            <TableHead className="text-right">Max Marks</TableHead>
                                            <TableHead className="text-right">Min Marks</TableHead>
                                            <TableHead className="text-right">Marks Obtained</TableHead>
                                            <TableHead className="text-right">Grade</TableHead>
                                            <TableHead>Note</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {result.subjects.map((subject, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{subject.name} ({subject.code})</TableCell>
                                                <TableCell className="text-right">{subject.max_marks}</TableCell>
                                                <TableCell className="text-right">{subject.min_marks}</TableCell>
                                                <TableCell className="text-right">{subject.get_marks}</TableCell>
                                                <TableCell className="text-right">{subject.grade}</TableCell>
                                                <TableCell>{subject.note}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="font-semibold">Percentage:</span> {result.percentage}%
                            </div>
                            <div>
                                <span className="font-semibold">Rank:</span> {result.rank || 0}
                            </div>
                            <div>
                                <span className="font-semibold">Result:</span> 
                                <span className={`ml-1 px-2 py-0.5 rounded text-white ${result.result_status === 'Pass' ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {result.result_status}
                                </span>
                            </div>
                            <div>
                                <span className="font-semibold">Division:</span> {result.division || '-'}
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 border-t">
                            <div className="text-sm font-semibold">Grand Total: {result.total_max_marks}</div>
                            <div className="text-sm font-semibold">Total Obtain Marks: {result.total_get_marks}</div>
                        </div>

                    </CardContent>
                </Card>
            )}
        </div>
      </div>
      <PublicFooter settings={siteSettings} />
    </div>
  );
};

export default ExamResult;
