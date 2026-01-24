import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';

const CbseReports = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [exams, setExams] = useState([]);

    // Filters
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedExam, setSelectedExam] = useState('');

    // Report Data
    const [templateReportData, setTemplateReportData] = useState([]);
    const [subjectReportData, setSubjectReportData] = useState([]);

    const fetchDependencies = useCallback(async () => {
        if (!user) return;
        const branchId = user.profile.branch_id;
        const [classesRes, sectionsRes, templatesRes, examsRes] = await Promise.all([
            supabase.from('classes').select('id, name').eq('branch_id', branchId),
            supabase.from('sections').select('id, name').eq('branch_id', branchId),
            supabase.from('cbse_marksheet_templates').select('id, name').eq('branch_id', branchId),
            supabase.from('cbse_exams').select('id, name').eq('branch_id', branchId),
        ]);
        setClasses(classesRes.data || []);
        setSections(sectionsRes.data || []);
        setTemplates(templatesRes.data || []);
        setExams(examsRes.data || []);
    }, [user]);

    useEffect(() => { fetchDependencies(); }, [fetchDependencies]);

    const handleTemplateReportSearch = async () => {
        if (!selectedClass || !selectedSection || !selectedTemplate) {
            toast({ variant: 'destructive', title: 'Please select class, section, and template.' });
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from('cbse_template_ranks')
            .select('*, student:student_profiles(full_name, school_code)')
            .eq('template_id', selectedTemplate);
        
        if (error) toast({ variant: 'destructive', title: 'Error fetching template report', description: error.message });
        else setTemplateReportData(data);
        setLoading(false);
    };

    const handleSubjectReportSearch = async () => {
        if (!selectedExam) {
            toast({ variant: 'destructive', title: 'Please select an exam.' });
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from('cbse_exam_marks')
            .select(`
                *,
                student:profiles(full_name, roll_number),
                exam_subject:cbse_exam_subjects(subjects(name))
            `)
            .eq('exam_id', selectedExam);
        
        if (error) toast({ variant: 'destructive', title: 'Error fetching subject report', description: error.message });
        else setSubjectReportData(data);
        setLoading(false);
    };

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-6">CBSE Examination Reports</h1>
            <Tabs defaultValue="template_marks">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="template_marks">Template Marks Report</TabsTrigger>
                    <TabsTrigger value="subject_marks">Subject Marks Report</TabsTrigger>
                </TabsList>
                <TabsContent value="template_marks">
                    <Card>
                        <CardHeader>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div><Label>Class</Label><Select value={selectedClass} onValueChange={setSelectedClass}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                                <div><Label>Section</Label><Select value={selectedSection} onValueChange={setSelectedSection}><SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger><SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                                <div><Label>Template</Label><Select value={selectedTemplate} onValueChange={setSelectedTemplate}><SelectTrigger><SelectValue placeholder="Select Template" /></SelectTrigger><SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
                                <Button onClick={handleTemplateReportSearch} disabled={loading}><Search className="mr-2 h-4 w-4" />{loading ? 'Searching...' : 'Search'}</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Admission No</TableHead><TableHead>Grand Total</TableHead><TableHead>Percentage</TableHead><TableHead>Grade</TableHead><TableHead>Rank</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {loading ? <TableRow><TableCell colSpan={6} className="text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> :
                                     templateReportData.length > 0 ? templateReportData.map(row => (
                                        <TableRow key={row.id}>
                                            <TableCell>{row.student?.full_name}</TableCell>
                                            <TableCell>{row.student?.school_code}</TableCell>
                                            <TableCell>{row.grand_total}</TableCell>
                                            <TableCell>{row.percentage}%</TableCell>
                                            <TableCell>{row.grade}</TableCell>
                                            <TableCell>{row.rank}</TableCell>
                                        </TableRow>
                                     )) : <TableRow><TableCell colSpan={6} className="text-center">No data found.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="subject_marks">
                    <Card>
                        <CardHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div><Label>Exam</Label><Select value={selectedExam} onValueChange={setSelectedExam}><SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger><SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
                                <Button onClick={handleSubjectReportSearch} disabled={loading}><Search className="mr-2 h-4 w-4" />{loading ? 'Searching...' : 'Search'}</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Roll No</TableHead><TableHead>Subject</TableHead><TableHead>Theory</TableHead><TableHead>Practical</TableHead><TableHead>Assignment</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {loading ? <TableRow><TableCell colSpan={7} className="text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> :
                                     subjectReportData.length > 0 ? subjectReportData.map(row => (
                                        <TableRow key={row.id}>
                                            <TableCell>{row.student?.full_name}</TableCell>
                                            <TableCell>{row.student?.roll_number}</TableCell>
                                            <TableCell>{row.exam_subject?.subjects.name}</TableCell>
                                            <TableCell>{row.marks_theory}</TableCell>
                                            <TableCell>{row.marks_practical}</TableCell>
                                            <TableCell>{row.marks_assignment}</TableCell>
                                            <TableCell>{(row.marks_theory || 0) + (row.marks_practical || 0) + (row.marks_assignment || 0)}</TableCell>
                                        </TableRow>
                                     )) : <TableRow><TableCell colSpan={7} className="text-center">No data found.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    );
};

export default CbseReports;
