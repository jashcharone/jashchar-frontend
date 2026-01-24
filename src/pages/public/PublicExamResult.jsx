import React, { useState, useEffect } from 'react';
import { useSchoolSlug } from '@/hooks/useSchoolSlug';
import publicCmsService from '@/services/publicCmsService';
import { PublicHeader, PublicFooter, TopBar } from '@/components/public/PublicLayoutComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, FileText, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet';

const PublicExamResult = () => {
  const schoolAlias = useSchoolSlug();
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState(null);
  const [settings, setSettings] = useState(null);
  const [menus, setMenus] = useState([]);
  const [news, setNews] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [admissionNo, setAdmissionNo] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);

  // Dummy exam list - in real app fetch from public.exams where is_publish_result = true
  const exams = [
    { id: '1', name: 'Annual Examination 2024' },
    { id: '2', name: 'Half Yearly Exam 2024' }
  ];

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
          setSettings(siteRes.data.settings);
          setMenus(siteRes.data.menus || []);
        }
        
        if (newsRes.success) {
          setNews(newsRes.data || []);
        }
      } catch (error) {
        console.error('Error fetching public site data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (schoolAlias) {
      fetchData();
    }
  }, [schoolAlias]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearched(true);
    // Simulate result fetch
    // In reality: await supabase.from('exam_results').select('*')...
    if (admissionNo === '12345') {
      setResult({
        student: 'John Doe',
        class: 'Class 10 - A',
        total: 450,
        max: 500,
        percentage: '90%',
        grade: 'A+',
        status: 'PASS'
      });
    } else {
      setResult(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!school) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Helmet>
        <title>Exam Results | {school?.name || 'School'}</title>
      </Helmet>

      {/* Top Bar */}
      <TopBar 
        school={school} 
        settings={settings} 
        news={news} 
      />

      {/* Header */}
      <PublicHeader 
        school={school} 
        menus={menus} 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
      />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Check Exam Results</h1>
            <p className="text-slate-600 mt-2">Enter your admission number to view results.</p>
          </div>

          <Card className="mb-8 shadow-md border-slate-200">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <Select onValueChange={setSelectedExam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Exam" />
                    </SelectTrigger>
                    <SelectContent>
                      {exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-1">
                  <Input 
                    placeholder="Admission No. (e.g. 12345)" 
                    value={admissionNo}
                    onChange={e => setAdmissionNo(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                  <Search className="mr-2 h-4 w-4" /> Search Result
                </Button>
              </form>
            </CardContent>
          </Card>

          {searched && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {result ? (
                <Card className="border-t-4 border-t-green-500 shadow-lg">
                  <CardHeader className="bg-green-50 border-b border-green-100">
                    <CardTitle className="text-green-800 flex items-center gap-2">
                      <FileText className="h-5 w-5" /> Result Found
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-slate-500 uppercase tracking-wide">Student Name</p>
                        <p className="font-bold text-lg text-slate-800">{result.student}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 uppercase tracking-wide">Class</p>
                        <p className="font-bold text-lg text-slate-800">{result.class}</p>
                      </div>
                      <div className="col-span-2 border-t border-slate-100 pt-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-slate-500 uppercase tracking-wide">Percentage</p>
                          <p className="text-3xl font-bold text-blue-600">{result.percentage}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Result Status</p>
                          <span className="inline-block px-4 py-1 bg-green-100 text-green-700 rounded-full font-bold text-sm border border-green-200">
                            {result.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-t-4 border-t-red-500 shadow-lg">
                  <CardContent className="pt-8 pb-8 text-center text-slate-600">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
                      <Search className="h-6 w-6" />
                    </div>
                    <p className="text-lg font-medium text-slate-800">No result found</p>
                    <p className="text-slate-500 mt-1">
                      We couldn't find any result for Admission No: <span className="font-mono font-bold text-slate-700">{admissionNo}</span>
                    </p>
                    <p className="text-sm mt-4 text-slate-400">Please check the number or contact school administration.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>

      <PublicFooter school={school} settings={settings} />
    </div>
  );
};

export default PublicExamResult;
