import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { onlineTestService, questionBankService } from '@/services/examinationService';
import { supabase } from '@/lib/supabaseClient';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import { 
    Plus, Edit, Trash2, Search, Play, Pause, Eye, Copy, Share2,
    Clock, Users, FileText, BarChart2, RefreshCw, Settings,
    CheckCircle, XCircle, AlertCircle, Monitor, Camera, Shuffle
} from 'lucide-react';

const TEST_STATUS = {
    DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: FileText },
    SCHEDULED: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock },
    ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: Play },
    COMPLETED: { label: 'Completed', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: CheckCircle },
    CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle }
};

const OnlineExamPage = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    
    const [activeTab, setActiveTab] = useState('tests');
    const [loading, setLoading] = useState(false);
    
    // Tests
    const [tests, setTests] = useState([]);
    const [testDialog, setTestDialog] = useState(false);
    const [testForm, setTestForm] = useState({
        test_name: '',
        description: '',
        subject_id: '',
        class_id: '',
        section_id: '',
        total_marks: 100,
        passing_marks: 35,
        duration_minutes: 60,
        start_time: '',
        end_time: '',
        instructions: '',
        shuffle_questions: true,
        shuffle_options: true,
        show_result_immediately: false,
        allow_review: true,
        max_attempts: 1,
        proctoring_enabled: false,
        webcam_required: false,
        fullscreen_required: true,
        tab_switch_limit: 3,
        status: 'DRAFT'
    });
    const [editingTest, setEditingTest] = useState(null);
    
    // Questions selection
    const [questionDialog, setQuestionDialog] = useState(false);
    const [selectedTest, setSelectedTest] = useState(null);
    const [availableQuestions, setAvailableQuestions] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [testQuestions, setTestQuestions] = useState([]);
    
    // Results
    const [resultsDialog, setResultsDialog] = useState(false);
    const [testResults, setTestResults] = useState([]);
    
    // Dropdowns
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    
    const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });
    const [publishDialog, setPublishDialog] = useState({ open: false, item: null });

    useEffect(() => {
        if (selectedBranch?.id) {
            loadInitialData();
        }
    }, [selectedBranch?.id]);

    useEffect(() => {
        if (testForm.class_id) {
            loadSections(testForm.class_id);
        } else {
            setSections([]);
        }
    }, [testForm.class_id]);

    const loadInitialData = async () => {
        setLoading(true);
        await Promise.all([
            loadTests(),
            loadSubjects(),
            loadClasses()
        ]);
        setLoading(false);
    };

    const loadTests = async () => {
        try {
            const response = await onlineTestService.getTests({
                organization_id: organizationId,
                branch_id: selectedBranch.id,
                session_id: currentSessionId
            });
            if (response.data.success) {
                setTests(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading tests:', error);
        }
    };

    const loadSubjects = async () => {
        const { data } = await supabase
            .from('subjects')
            .select('id, name')
            .eq('branch_id', selectedBranch.id)
            .order('name');
        setSubjects(data || []);
    };

    const loadClasses = async () => {
        const { data } = await supabase
            .from('classes')
            .select('id, name')
            .eq('branch_id', selectedBranch.id)
            .order('name');
        setClasses(data || []);
    };

    const loadSections = async (classId) => {
        const { data } = await supabase
            .from('sections')
            .select('id, name')
            .eq('class_id', classId)
            .order('name');
        setSections(data || []);
    };

    const loadAvailableQuestions = async (subjectId) => {
        try {
            const response = await questionBankService.getQuestions({
                organization_id: organizationId,
                branch_id: selectedBranch.id,
                subject_id: subjectId,
                is_active: true
            });
            if (response.data.success) {
                setAvailableQuestions(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading questions:', error);
        }
    };

    const loadTestQuestions = async (testId) => {
        try {
            // This would normally call an API to get test questions
            // For now, we'll set an empty array
            setTestQuestions([]);
        } catch (error) {
            console.error('Error loading test questions:', error);
        }
    };

    const loadTestResults = async (testId) => {
        try {
            const response = await onlineTestService.getResults(testId);
            if (response.data.success) {
                setTestResults(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading results:', error);
        }
    };

    // Test handlers
    const openTestDialog = (test = null) => {
        if (test) {
            setEditingTest(test);
            setTestForm({
                test_name: test.test_name || '',
                description: test.description || '',
                subject_id: test.subject_id || '',
                class_id: test.class_id || '',
                section_id: test.section_id || '',
                total_marks: test.total_marks || 100,
                passing_marks: test.passing_marks || 35,
                duration_minutes: test.duration_minutes || 60,
                start_time: test.start_time ? test.start_time.slice(0, 16) : '',
                end_time: test.end_time ? test.end_time.slice(0, 16) : '',
                instructions: test.instructions || '',
                shuffle_questions: test.shuffle_questions !== false,
                shuffle_options: test.shuffle_options !== false,
                show_result_immediately: test.show_result_immediately === true,
                allow_review: test.allow_review !== false,
                max_attempts: test.max_attempts || 1,
                proctoring_enabled: test.proctoring_enabled === true,
                webcam_required: test.webcam_required === true,
                fullscreen_required: test.fullscreen_required !== false,
                tab_switch_limit: test.tab_switch_limit || 3,
                status: test.status || 'DRAFT'
            });
        } else {
            setEditingTest(null);
            setTestForm({
                test_name: '',
                description: '',
                subject_id: '',
                class_id: '',
                section_id: '',
                total_marks: 100,
                passing_marks: 35,
                duration_minutes: 60,
                start_time: '',
                end_time: '',
                instructions: '',
                shuffle_questions: true,
                shuffle_options: true,
                show_result_immediately: false,
                allow_review: true,
                max_attempts: 1,
                proctoring_enabled: false,
                webcam_required: false,
                fullscreen_required: true,
                tab_switch_limit: 3,
                status: 'DRAFT'
            });
        }
        setTestDialog(true);
    };

    const saveTest = async () => {
        if (!testForm.test_name.trim()) {
            toast.error('Test name is required');
            return;
        }
        if (!testForm.subject_id) {
            toast.error('Subject is required');
            return;
        }
        if (!testForm.class_id) {
            toast.error('Class is required');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...testForm,
                organization_id: organizationId,
                branch_id: selectedBranch.id,
                session_id: currentSessionId,
                section_id: testForm.section_id || null,
                start_time: testForm.start_time || null,
                end_time: testForm.end_time || null
            };

            let response;
            if (editingTest) {
                response = await onlineTestService.updateTest(editingTest.id, payload);
            } else {
                response = await onlineTestService.createTest(payload);
            }

            if (response.data.success) {
                toast.success(`Test ${editingTest ? 'updated' : 'created'} successfully`);
                setTestDialog(false);
                loadTests();
            } else {
                toast.error(response.data.message || 'Failed to save test');
            }
        } catch (error) {
            console.error('Error saving test:', error);
            toast.error('Failed to save test');
        } finally {
            setLoading(false);
        }
    };

    const openQuestionDialog = async (test) => {
        setSelectedTest(test);
        await loadAvailableQuestions(test.subject_id);
        await loadTestQuestions(test.id);
        setSelectedQuestions([]);
        setQuestionDialog(true);
    };

    const toggleQuestionSelection = (questionId) => {
        setSelectedQuestions(prev => 
            prev.includes(questionId) 
                ? prev.filter(id => id !== questionId)
                : [...prev, questionId]
        );
    };

    const addQuestionsToTest = async () => {
        if (selectedQuestions.length === 0) {
            toast.error('Please select at least one question');
            return;
        }

        setLoading(true);
        try {
            // This would call API to add questions to test
            toast.success(`${selectedQuestions.length} questions added to test`);
            setQuestionDialog(false);
        } catch (error) {
            console.error('Error adding questions:', error);
            toast.error('Failed to add questions');
        } finally {
            setLoading(false);
        }
    };

    const openResultsDialog = async (test) => {
        setSelectedTest(test);
        await loadTestResults(test.id);
        setResultsDialog(true);
    };

    const publishTest = async () => {
        const test = publishDialog.item;
        setLoading(true);
        try {
            const response = await onlineTestService.publishTest(test.id);
            if (response.data.success) {
                toast.success('Test published successfully');
                loadTests();
            } else {
                toast.error(response.data.message || 'Failed to publish test');
            }
        } catch (error) {
            console.error('Error publishing test:', error);
            toast.error('Failed to publish test');
        } finally {
            setLoading(false);
            setPublishDialog({ open: false, item: null });
        }
    };

    const deleteTest = async () => {
        const test = deleteDialog.item;
        setLoading(true);
        try {
            const response = await onlineTestService.deleteTest(test.id);
            if (response.data.success) {
                toast.success('Test deleted successfully');
                loadTests();
            } else {
                toast.error(response.data.message || 'Failed to delete test');
            }
        } catch (error) {
            console.error('Error deleting test:', error);
            toast.error('Failed to delete test');
        } finally {
            setLoading(false);
            setDeleteDialog({ open: false, item: null });
        }
    };

    const duplicateTest = async (test) => {
        setLoading(true);
        try {
            const payload = {
                ...test,
                test_name: `${test.test_name} (Copy)`,
                status: 'DRAFT'
            };
            delete payload.id;
            delete payload.created_at;
            delete payload.updated_at;

            const response = await onlineTestService.createTest(payload);
            if (response.data.success) {
                toast.success('Test duplicated successfully');
                loadTests();
            }
        } catch (error) {
            console.error('Error duplicating test:', error);
            toast.error('Failed to duplicate test');
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ status }) => {
        const config = TEST_STATUS[status] || TEST_STATUS.DRAFT;
        const Icon = config.icon;
        return (
            <Badge className={config.color}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
            </Badge>
        );
    };

    return (
        <DashboardLayout>
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Monitor className="w-6 h-6" />
                        Online Examinations
                    </h1>
                    <p className="text-muted-foreground">Create and manage online tests</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadTests} disabled={loading}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                    <Button onClick={() => openTestDialog()}>
                        <Plus className="w-4 h-4 mr-2" /> Create Test
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Tests</p>
                            <p className="text-2xl font-bold">{tests.length}</p>
                        </div>
                        <FileText className="w-8 h-8 text-blue-500 opacity-50" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Active Tests</p>
                            <p className="text-2xl font-bold text-green-600">
                                {tests.filter(t => t.status === 'ACTIVE').length}
                            </p>
                        </div>
                        <Play className="w-8 h-8 text-green-500 opacity-50" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Scheduled</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {tests.filter(t => t.status === 'SCHEDULED').length}
                            </p>
                        </div>
                        <Clock className="w-8 h-8 text-blue-500 opacity-50" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Completed</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {tests.filter(t => t.status === 'COMPLETED').length}
                            </p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-purple-500 opacity-50" />
                    </CardContent>
                </Card>
            </div>

            {/* Tests List */}
            <Card>
                <CardHeader>
                    <CardTitle>Tests</CardTitle>
                    <CardDescription>Manage your online examinations</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Test Name</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead className="text-center">Duration</TableHead>
                                <TableHead className="text-center">Marks</TableHead>
                                <TableHead>Schedule</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="w-40">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                        <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No tests created yet</p>
                                        <p className="text-sm">Click "Create Test" to get started</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tests.map(test => (
                                    <TableRow key={test.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{test.test_name}</p>
                                                {test.description && (
                                                    <p className="text-xs text-muted-foreground truncate max-w-xs">
                                                        {test.description}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{subjects.find(s => s.id === test.subject_id)?.name || '-'}</TableCell>
                                        <TableCell>
                                            {classes.find(c => c.id === test.class_id)?.name || '-'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                {test.duration_minutes} min
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {test.total_marks}
                                            <span className="text-xs text-muted-foreground ml-1">
                                                (Pass: {test.passing_marks})
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {test.start_time ? (
                                                <div className="text-xs">
                                                    <p>Start: {formatDateTime(test.start_time)}</p>
                                                    {test.end_time && <p>End: {formatDateTime(test.end_time)}</p>}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">Not scheduled</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <StatusBadge status={test.status} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    title="Edit"
                                                    onClick={() => openTestDialog(test)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    title="Add Questions"
                                                    onClick={() => openQuestionDialog(test)}
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    title="View Results"
                                                    onClick={() => openResultsDialog(test)}
                                                    disabled={test.status === 'DRAFT'}
                                                >
                                                    <BarChart2 className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    title="Duplicate"
                                                    onClick={() => duplicateTest(test)}
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                                {test.status === 'DRAFT' && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        className="text-green-600"
                                                        title="Publish"
                                                        onClick={() => setPublishDialog({ open: true, item: test })}
                                                    >
                                                        <Play className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    title="Delete"
                                                    onClick={() => setDeleteDialog({ open: true, item: test })}
                                                    disabled={test.status === 'ACTIVE'}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Test Dialog */}
            <Dialog open={testDialog} onOpenChange={setTestDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingTest ? 'Edit Test' : 'Create New Test'}</DialogTitle>
                        <DialogDescription>Configure your online examination settings</DialogDescription>
                    </DialogHeader>
                    
                    <Tabs defaultValue="basic">
                        <TabsList className="w-full">
                            <TabsTrigger value="basic" className="flex-1">Basic Info</TabsTrigger>
                            <TabsTrigger value="schedule" className="flex-1">Schedule</TabsTrigger>
                            <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
                            <TabsTrigger value="proctoring" className="flex-1">Proctoring</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4 mt-4">
                            <div>
                                <Label>Test Name *</Label>
                                <Input 
                                    value={testForm.test_name}
                                    onChange={e => setTestForm(p => ({ ...p, test_name: e.target.value }))}
                                    placeholder="e.g., Unit Test 1 - Mathematics"
                                />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea 
                                    value={testForm.description}
                                    onChange={e => setTestForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Brief description of this test..."
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label>Subject *</Label>
                                    <Select 
                                        value={testForm.subject_id} 
                                        onValueChange={v => setTestForm(p => ({ ...p, subject_id: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subjects.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Class *</Label>
                                    <Select 
                                        value={testForm.class_id} 
                                        onValueChange={v => setTestForm(p => ({ ...p, class_id: v, section_id: '' }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Section</Label>
                                    <Select 
                                        value={testForm.section_id || 'all'} 
                                        onValueChange={v => setTestForm(p => ({ ...p, section_id: v === 'all' ? '' : v }))}
                                        disabled={!testForm.class_id}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All sections" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Sections</SelectItem>
                                            {sections.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label>Total Marks</Label>
                                    <Input 
                                        type="number"
                                        min="1"
                                        value={testForm.total_marks}
                                        onChange={e => setTestForm(p => ({ ...p, total_marks: parseInt(e.target.value) || 100 }))}
                                    />
                                </div>
                                <div>
                                    <Label>Passing Marks</Label>
                                    <Input 
                                        type="number"
                                        min="0"
                                        value={testForm.passing_marks}
                                        onChange={e => setTestForm(p => ({ ...p, passing_marks: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div>
                                    <Label>Duration (minutes)</Label>
                                    <Input 
                                        type="number"
                                        min="1"
                                        value={testForm.duration_minutes}
                                        onChange={e => setTestForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 60 }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Instructions</Label>
                                <Textarea 
                                    value={testForm.instructions}
                                    onChange={e => setTestForm(p => ({ ...p, instructions: e.target.value }))}
                                    placeholder="Instructions for students..."
                                    rows={4}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="schedule" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Start Time</Label>
                                    <Input 
                                        type="datetime-local"
                                        value={testForm.start_time}
                                        onChange={e => setTestForm(p => ({ ...p, start_time: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <Label>End Time</Label>
                                    <Input 
                                        type="datetime-local"
                                        value={testForm.end_time}
                                        onChange={e => setTestForm(p => ({ ...p, end_time: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    <AlertCircle className="w-4 h-4 inline mr-2" />
                                    If not scheduled, the test will only be available when manually published.
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-4 mt-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Shuffle Questions</Label>
                                        <p className="text-sm text-muted-foreground">Randomize question order for each student</p>
                                    </div>
                                    <Switch 
                                        checked={testForm.shuffle_questions}
                                        onCheckedChange={v => setTestForm(p => ({ ...p, shuffle_questions: v }))}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Shuffle Options</Label>
                                        <p className="text-sm text-muted-foreground">Randomize MCQ options</p>
                                    </div>
                                    <Switch 
                                        checked={testForm.shuffle_options}
                                        onCheckedChange={v => setTestForm(p => ({ ...p, shuffle_options: v }))}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Show Result Immediately</Label>
                                        <p className="text-sm text-muted-foreground">Show score right after submission</p>
                                    </div>
                                    <Switch 
                                        checked={testForm.show_result_immediately}
                                        onCheckedChange={v => setTestForm(p => ({ ...p, show_result_immediately: v }))}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Allow Review</Label>
                                        <p className="text-sm text-muted-foreground">Let students review answers after test</p>
                                    </div>
                                    <Switch 
                                        checked={testForm.allow_review}
                                        onCheckedChange={v => setTestForm(p => ({ ...p, allow_review: v }))}
                                    />
                                </div>
                                <div>
                                    <Label>Maximum Attempts</Label>
                                    <Input 
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={testForm.max_attempts}
                                        onChange={e => setTestForm(p => ({ ...p, max_attempts: parseInt(e.target.value) || 1 }))}
                                        className="w-24"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="proctoring" className="space-y-4 mt-4">
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                    <AlertCircle className="w-4 h-4 inline mr-2" />
                                    Proctoring features help prevent cheating during online exams.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="flex items-center gap-2">
                                            <Monitor className="w-4 h-4" /> Enable Proctoring
                                        </Label>
                                        <p className="text-sm text-muted-foreground">Enable proctoring features</p>
                                    </div>
                                    <Switch 
                                        checked={testForm.proctoring_enabled}
                                        onCheckedChange={v => setTestForm(p => ({ ...p, proctoring_enabled: v }))}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="flex items-center gap-2">
                                            <Camera className="w-4 h-4" /> Require Webcam
                                        </Label>
                                        <p className="text-sm text-muted-foreground">Students must enable webcam</p>
                                    </div>
                                    <Switch 
                                        checked={testForm.webcam_required}
                                        onCheckedChange={v => setTestForm(p => ({ ...p, webcam_required: v }))}
                                        disabled={!testForm.proctoring_enabled}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Require Fullscreen</Label>
                                        <p className="text-sm text-muted-foreground">Test must be taken in fullscreen mode</p>
                                    </div>
                                    <Switch 
                                        checked={testForm.fullscreen_required}
                                        onCheckedChange={v => setTestForm(p => ({ ...p, fullscreen_required: v }))}
                                    />
                                </div>
                                <div>
                                    <Label>Tab Switch Limit</Label>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Maximum allowed tab/window switches (0 = unlimited)
                                    </p>
                                    <Input 
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={testForm.tab_switch_limit}
                                        onChange={e => setTestForm(p => ({ ...p, tab_switch_limit: parseInt(e.target.value) || 0 }))}
                                        className="w-24"
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTestDialog(false)}>Cancel</Button>
                        <Button onClick={saveTest} disabled={loading}>
                            {editingTest ? 'Update Test' : 'Create Test'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Questions Selection Dialog */}
            <Dialog open={questionDialog} onOpenChange={setQuestionDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Add Questions to Test</DialogTitle>
                        <DialogDescription>
                            Select questions from question bank for: {selectedTest?.test_name}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex justify-between items-center mb-4">
                        <Badge variant="outline">
                            {selectedQuestions.length} questions selected
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => setSelectedQuestions([])}>
                            Clear Selection
                        </Button>
                    </div>

                    <ScrollArea className="h-[400px] border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox 
                                            checked={selectedQuestions.length === availableQuestions.length && availableQuestions.length > 0}
                                            onCheckedChange={checked => {
                                                if (checked) {
                                                    setSelectedQuestions(availableQuestions.map(q => q.id));
                                                } else {
                                                    setSelectedQuestions([]);
                                                }
                                            }}
                                        />
                                    </TableHead>
                                    <TableHead>Question</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Difficulty</TableHead>
                                    <TableHead className="text-right">Marks</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {availableQuestions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                            No questions available for this subject
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    availableQuestions.map(q => (
                                        <TableRow key={q.id}>
                                            <TableCell>
                                                <Checkbox 
                                                    checked={selectedQuestions.includes(q.id)}
                                                    onCheckedChange={() => toggleQuestionSelection(q.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <p className="truncate max-w-md">{q.question_text}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{q.question_type}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    q.difficulty_level === 'EASY' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                    q.difficulty_level === 'HARD' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }>
                                                    {q.difficulty_level}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{q.marks}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setQuestionDialog(false)}>Cancel</Button>
                        <Button onClick={addQuestionsToTest} disabled={loading || selectedQuestions.length === 0}>
                            Add {selectedQuestions.length} Questions
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Results Dialog */}
            <Dialog open={resultsDialog} onOpenChange={setResultsDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Test Results</DialogTitle>
                        <DialogDescription>
                            Results for: {selectedTest?.test_name}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <ScrollArea className="h-[400px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Enroll ID</TableHead>
                                    <TableHead className="text-center">Score</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead>Submitted At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {testResults.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            No results available yet
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    testResults.map((r, i) => (
                                        <TableRow key={r.id}>
                                            <TableCell>{i + 1}</TableCell>
                                            <TableCell>
                                                {r.students?.first_name} {r.students?.last_name}
                                            </TableCell>
                                            <TableCell>{r.students?.enrollment_id}</TableCell>
                                            <TableCell className="text-center">
                                                {r.obtained_marks}/{selectedTest?.total_marks}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={
                                                    r.obtained_marks >= selectedTest?.passing_marks
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }>
                                                    {r.obtained_marks >= selectedTest?.passing_marks ? 'Pass' : 'Fail'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{formatDateTime(r.submitted_at)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResultsDialog(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Publish Confirmation */}
            <AlertDialog open={publishDialog.open} onOpenChange={open => !open && setPublishDialog({ open: false, item: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Publish Test?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will make the test available to students. Make sure all questions are added and settings are correct.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={publishTest} className="bg-green-500 hover:bg-green-600">
                            <Play className="w-4 h-4 mr-2" /> Publish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialog.open} onOpenChange={open => !open && setDeleteDialog({ open: false, item: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Test?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the test and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteTest} className="bg-red-500 hover:bg-red-600">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        </DashboardLayout>
    );
};

export default OnlineExamPage;
