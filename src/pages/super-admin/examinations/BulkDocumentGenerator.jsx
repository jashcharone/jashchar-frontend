import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { 
    admitCardTemplateService, 
    marksheetTemplateService, 
    reportCardTemplateService,
    documentGenerationService,
    examService
} from '@/services/examinationService';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/utils/dateUtils';
import { 
    FileText, Download, Printer, Clock, CheckCircle, 
    XCircle, RefreshCw, Users, BookOpen, Award, FileCheck
} from 'lucide-react';

const BulkDocumentGenerator = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    
    const [activeTab, setActiveTab] = useState('generate');
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    
    // Data states
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [exams, setExams] = useState([]);
    const [students, setStudents] = useState([]);
    const [admitCardTemplates, setAdmitCardTemplates] = useState([]);
    const [marksheetTemplates, setMarksheetTemplates] = useState([]);
    const [reportCardTemplates, setReportCardTemplates] = useState([]);
    const [generationHistory, setGenerationHistory] = useState([]);
    
    // Form states
    const [documentType, setDocumentType] = useState('admit_card');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    
    // Preview states
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewStudent, setPreviewStudent] = useState(null);
    const [generationProgress, setGenerationProgress] = useState(0);

    useEffect(() => {
        if (selectedBranch?.id) {
            loadInitialData();
        }
    }, [selectedBranch?.id]);

    useEffect(() => {
        if (selectedClass) {
            loadSections();
        }
    }, [selectedClass]);

    useEffect(() => {
        if (selectedSection) {
            loadStudents();
        }
    }, [selectedSection]);

    useEffect(() => {
        loadTemplates();
    }, [documentType]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadClasses(),
                loadExams(),
                loadTemplates(),
                loadGenerationHistory()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadClasses = async () => {
        const { data, error } = await supabase
            .from('classes')
            .select('id, class_name')
            .eq('branch_id', selectedBranch.id)
            .eq('is_active', true)
            .order('class_name');
        
        if (!error) setClasses(data || []);
    };

    const loadSections = async () => {
        const { data, error } = await supabase
            .from('sections')
            .select('id, section_name')
            .eq('class_id', selectedClass)
            .eq('is_active', true)
            .order('section_name');
        
        if (!error) setSections(data || []);
    };

    const loadExams = async () => {
        try {
            const response = await examService.getExams({
                branch_id: selectedBranch.id,
                session_id: currentSessionId
            });
            if (response.data.success) {
                setExams(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading exams:', error);
        }
    };

    const loadStudents = async () => {
        const { data, error } = await supabase
            .from('students')
            .select('id, first_name, last_name, admission_no, roll_no, father_name')
            .eq('section_id', selectedSection)
            .eq('branch_id', selectedBranch.id)
            .eq('is_active', true)
            .order('roll_no');
        
        if (!error) {
            setStudents(data || []);
            setSelectedStudents([]);
            setSelectAll(false);
        }
    };

    const loadTemplates = async () => {
        const params = {
            organization_id: organizationId,
            branch_id: selectedBranch?.id
        };

        try {
            if (documentType === 'admit_card') {
                const response = await admitCardTemplateService.getTemplates(params);
                if (response.data.success) setAdmitCardTemplates(response.data.data || []);
            } else if (documentType === 'marksheet') {
                const response = await marksheetTemplateService.getTemplates(params);
                if (response.data.success) setMarksheetTemplates(response.data.data || []);
            } else if (documentType === 'report_card') {
                const response = await reportCardTemplateService.getTemplates(params);
                if (response.data.success) setReportCardTemplates(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    };

    const loadGenerationHistory = async () => {
        try {
            const response = await documentGenerationService.getGenerationHistory({
                organization_id: organizationId,
                branch_id: selectedBranch.id,
                session_id: currentSessionId
            });
            if (response.data.success) {
                setGenerationHistory(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading generation history:', error);
        }
    };

    const getTemplates = () => {
        switch (documentType) {
            case 'admit_card': return admitCardTemplates;
            case 'marksheet': return marksheetTemplates;
            case 'report_card': return reportCardTemplates;
            default: return [];
        }
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(s => s.id));
        }
        setSelectAll(!selectAll);
    };

    const handleStudentSelect = (studentId) => {
        if (selectedStudents.includes(studentId)) {
            setSelectedStudents(prev => prev.filter(id => id !== studentId));
        } else {
            setSelectedStudents(prev => [...prev, studentId]);
        }
    };

    const handleGenerate = async () => {
        if (!selectedTemplate) {
            toast.error('Please select a template');
            return;
        }
        if (selectedStudents.length === 0) {
            toast.error('Please select at least one student');
            return;
        }
        if ((documentType === 'admit_card' || documentType === 'marksheet') && !selectedExam) {
            toast.error('Please select an exam');
            return;
        }

        setGenerating(true);
        setGenerationProgress(0);

        try {
            const response = await documentGenerationService.generateDocuments({
                organization_id: organizationId,
                branch_id: selectedBranch.id,
                session_id: currentSessionId,
                document_type: documentType,
                template_id: selectedTemplate,
                exam_id: selectedExam || null,
                generated_for: 'custom',
                class_id: selectedClass,
                section_id: selectedSection,
                student_ids: selectedStudents,
                generated_by: user.id
            });

            if (response.data.success) {
                // Simulate progress
                for (let i = 0; i <= 100; i += 10) {
                    setGenerationProgress(i);
                    await new Promise(r => setTimeout(r, 100));
                }

                toast.success(`Generated documents for ${response.data.data.students_count} students`);
                loadGenerationHistory();
                
                // Open print preview or download
                handlePrintPreview(response.data.data.students);
            }
        } catch (error) {
            console.error('Error generating documents:', error);
            toast.error('Failed to generate documents');
        } finally {
            setGenerating(false);
            setGenerationProgress(0);
        }
    };

    const handlePrintPreview = (studentsList) => {
        // For now, show a preview dialog
        if (studentsList?.length > 0) {
            setPreviewStudent(studentsList[0]);
            setPreviewOpen(true);
        }
    };

    const getDocumentTypeIcon = (type) => {
        switch (type) {
            case 'admit_card': return <FileText className="w-4 h-4" />;
            case 'marksheet': return <Award className="w-4 h-4" />;
            case 'report_card': return <BookOpen className="w-4 h-4" />;
            default: return <FileCheck className="w-4 h-4" />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return <Badge variant="success" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
            case 'processing':
                return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>;
            case 'failed':
                return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
            default:
                return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Bulk Document Generator</h1>
                    <p className="text-muted-foreground">Generate admit cards, marksheets, and report cards in bulk</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="generate">Generate Documents</TabsTrigger>
                    <TabsTrigger value="history">Generation History</TabsTrigger>
                </TabsList>

                <TabsContent value="generate" className="mt-4">
                    <div className="grid grid-cols-3 gap-6">
                        {/* Left Panel - Selection */}
                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle className="text-lg">Document Selection</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Document Type</Label>
                                    <Select value={documentType} onValueChange={setDocumentType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admit_card">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4" /> Admit Card
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="marksheet">
                                                <div className="flex items-center gap-2">
                                                    <Award className="w-4 h-4" /> Marksheet
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="report_card">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="w-4 h-4" /> Report Card
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Template</Label>
                                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select template" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getTemplates().map(template => (
                                                <SelectItem key={template.id} value={template.id}>
                                                    {template.template_name}
                                                    {template.is_default && ' (Default)'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {(documentType === 'admit_card' || documentType === 'marksheet') && (
                                    <div className="space-y-2">
                                        <Label>Examination</Label>
                                        <Select value={selectedExam} onValueChange={setSelectedExam}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select exam" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {exams.map(exam => (
                                                    <SelectItem key={exam.id} value={exam.id}>
                                                        {exam.exam_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Class</Label>
                                    <Select value={selectedClass} onValueChange={(v) => {
                                        setSelectedClass(v);
                                        setSelectedSection('');
                                        setStudents([]);
                                    }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(cls => (
                                                <SelectItem key={cls.id} value={cls.id}>
                                                    {cls.class_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Section</Label>
                                    <Select 
                                        value={selectedSection} 
                                        onValueChange={setSelectedSection}
                                        disabled={!selectedClass}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sections.map(sec => (
                                                <SelectItem key={sec.id} value={sec.id}>
                                                    {sec.section_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Right Panel - Students */}
                        <Card className="col-span-2">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg">Select Students</CardTitle>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-muted-foreground">
                                            {selectedStudents.length} of {students.length} selected
                                        </span>
                                        {students.length > 0 && (
                                            <Button variant="outline" size="sm" onClick={handleSelectAll}>
                                                {selectAll ? 'Deselect All' : 'Select All'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {!selectedSection ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>Select class and section to load students</p>
                                    </div>
                                ) : students.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No students found in this section</p>
                                    </div>
                                ) : (
                                    <ScrollArea className="h-[400px]">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12">
                                                        <Checkbox
                                                            checked={selectAll}
                                                            onCheckedChange={handleSelectAll}
                                                        />
                                                    </TableHead>
                                                    <TableHead>Roll No</TableHead>
                                                    <TableHead>Admission No</TableHead>
                                                    <TableHead>Student Name</TableHead>
                                                    <TableHead>Father's Name</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {students.map(student => (
                                                    <TableRow key={student.id}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedStudents.includes(student.id)}
                                                                onCheckedChange={() => handleStudentSelect(student.id)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>{student.roll_no || '-'}</TableCell>
                                                        <TableCell>{student.admission_no}</TableCell>
                                                        <TableCell className="font-medium">
                                                            {student.first_name} {student.last_name}
                                                        </TableCell>
                                                        <TableCell>{student.father_name || '-'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                )}

                                {/* Generate Button */}
                                <div className="mt-6 flex items-center justify-between">
                                    {generating ? (
                                        <div className="flex-1 mr-4">
                                            <Progress value={generationProgress} className="h-2" />
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Generating documents... {generationProgress}%
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex-1" />
                                    )}
                                    <Button 
                                        onClick={handleGenerate}
                                        disabled={generating || selectedStudents.length === 0 || !selectedTemplate}
                                        size="lg"
                                    >
                                        {generating ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Printer className="w-4 h-4 mr-2" />
                                                Generate & Print ({selectedStudents.length})
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Generation History</CardTitle>
                                <Button variant="outline" size="sm" onClick={loadGenerationHistory}>
                                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {generationHistory.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No generation history found</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Exam</TableHead>
                                            <TableHead>Students</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Generated At</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {generationHistory.map(record => (
                                            <TableRow key={record.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getDocumentTypeIcon(record.document_type)}
                                                        <span className="capitalize">
                                                            {record.document_type.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{record.exam?.exam_name || '-'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {record.generated_count}/{record.total_students}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(record.status)}</TableCell>
                                                <TableCell>{formatDate(record.generated_at)}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {record.status === 'completed' && record.file_url && (
                                                            <Button variant="outline" size="sm">
                                                                <Download className="w-4 h-4 mr-1" /> Download
                                                            </Button>
                                                        )}
                                                        {record.status === 'completed' && (
                                                            <Button variant="outline" size="sm">
                                                                <Printer className="w-4 h-4 mr-1" /> Reprint
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Document Preview</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-gray-100 p-8 rounded-lg text-center">
                            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <p className="text-lg font-semibold mb-2">
                                Documents Generated Successfully
                            </p>
                            <p className="text-muted-foreground mb-4">
                                {selectedStudents.length} {documentType.replace('_', ' ')}(s) ready for printing
                            </p>
                            <div className="flex justify-center gap-4">
                                <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                                    Close
                                </Button>
                                <Button onClick={() => {
                                    // Trigger print
                                    window.print();
                                }}>
                                    <Printer className="w-4 h-4 mr-2" /> Print All
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BulkDocumentGenerator;
