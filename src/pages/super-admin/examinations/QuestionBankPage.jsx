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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { questionBankService } from '@/services/examinationService';
import { supabase } from '@/lib/supabaseClient';
import { 
    Plus, Edit, Trash2, Search, FolderTree, BookOpen, 
    Filter, Upload, Download, RefreshCw, ChevronRight,
    HelpCircle, CheckSquare, Type, List, ArrowRight
} from 'lucide-react';

const QUESTION_TYPES = [
    { value: 'MCQ', label: 'Multiple Choice', icon: CheckSquare },
    { value: 'TRUE_FALSE', label: 'True/False', icon: CheckSquare },
    { value: 'FILL_BLANK', label: 'Fill in the Blank', icon: Type },
    { value: 'SHORT_ANSWER', label: 'Short Answer', icon: Type },
    { value: 'LONG_ANSWER', label: 'Long Answer', icon: Type },
    { value: 'MATCH', label: 'Match the Following', icon: ArrowRight }
];

const DIFFICULTY_LEVELS = [
    { value: 'EASY', label: 'Easy', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    { value: 'HARD', label: 'Hard', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
];

const COGNITIVE_LEVELS = [
    { value: 'KNOWLEDGE', label: 'Knowledge' },
    { value: 'COMPREHENSION', label: 'Comprehension' },
    { value: 'APPLICATION', label: 'Application' },
    { value: 'ANALYSIS', label: 'Analysis' },
    { value: 'SYNTHESIS', label: 'Synthesis' },
    { value: 'EVALUATION', label: 'Evaluation' }
];

const QuestionBankPage = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    
    const [activeTab, setActiveTab] = useState('questions');
    const [loading, setLoading] = useState(false);
    
    // Categories
    const [categories, setCategories] = useState([]);
    const [categoryDialog, setCategoryDialog] = useState(false);
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '', parent_id: '' });
    const [editingCategory, setEditingCategory] = useState(null);
    
    // Questions
    const [questions, setQuestions] = useState([]);
    const [questionDialog, setQuestionDialog] = useState(false);
    const [questionForm, setQuestionForm] = useState({
        subject_id: '',
        category_id: '',
        question_type: 'MCQ',
        question_text: '',
        question_image_url: '',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
        marks: 1,
        negative_marks: 0,
        difficulty_level: 'MEDIUM',
        cognitive_level: 'KNOWLEDGE',
        is_active: true
    });
    const [editingQuestion, setEditingQuestion] = useState(null);
    
    // Dropdowns
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    
    // Filters
    const [filters, setFilters] = useState({
        subject_id: '',
        category_id: '',
        question_type: '',
        difficulty: '',
        search: ''
    });
    
    const [deleteDialog, setDeleteDialog] = useState({ open: false, type: '', item: null });

    useEffect(() => {
        if (selectedBranch?.id) {
            loadInitialData();
        }
    }, [selectedBranch?.id]);

    const loadInitialData = async () => {
        setLoading(true);
        await Promise.all([
            loadCategories(),
            loadQuestions(),
            loadSubjects(),
            loadClasses()
        ]);
        setLoading(false);
    };

    const loadCategories = async () => {
        try {
            const response = await questionBankService.getCategories({
                organization_id: organizationId,
                branch_id: selectedBranch.id
            });
            if (response.data.success) {
                setCategories(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const loadQuestions = async () => {
        try {
            const response = await questionBankService.getQuestions({
                organization_id: organizationId,
                branch_id: selectedBranch.id,
                ...filters
            });
            if (response.data.success) {
                setQuestions(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading questions:', error);
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

    // Category handlers
    const openCategoryDialog = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setCategoryForm({
                name: category.name,
                description: category.description || '',
                parent_id: category.parent_id || ''
            });
        } else {
            setEditingCategory(null);
            setCategoryForm({ name: '', description: '', parent_id: '' });
        }
        setCategoryDialog(true);
    };

    const saveCategory = async () => {
        if (!categoryForm.name.trim()) {
            toast.error('Category name is required');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...categoryForm,
                organization_id: organizationId,
                branch_id: selectedBranch.id,
                parent_id: categoryForm.parent_id || null
            };

            let response;
            if (editingCategory) {
                response = await questionBankService.updateCategory(editingCategory.id, payload);
            } else {
                response = await questionBankService.createCategory(payload);
            }

            if (response.data.success) {
                toast.success(`Category ${editingCategory ? 'updated' : 'created'} successfully`);
                setCategoryDialog(false);
                loadCategories();
            } else {
                toast.error(response.data.message || 'Failed to save category');
            }
        } catch (error) {
            console.error('Error saving category:', error);
            toast.error('Failed to save category');
        } finally {
            setLoading(false);
        }
    };

    // Question handlers
    const openQuestionDialog = (question = null) => {
        if (question) {
            setEditingQuestion(question);
            setQuestionForm({
                subject_id: question.subject_id || '',
                category_id: question.category_id || '',
                question_type: question.question_type || 'MCQ',
                question_text: question.question_text || '',
                question_image_url: question.question_image_url || '',
                options: question.options || ['', '', '', ''],
                correct_answer: question.correct_answer || '',
                explanation: question.explanation || '',
                marks: question.marks || 1,
                negative_marks: question.negative_marks || 0,
                difficulty_level: question.difficulty_level || 'MEDIUM',
                cognitive_level: question.cognitive_level || 'KNOWLEDGE',
                is_active: question.is_active !== false
            });
        } else {
            setEditingQuestion(null);
            setQuestionForm({
                subject_id: '',
                category_id: '',
                question_type: 'MCQ',
                question_text: '',
                question_image_url: '',
                options: ['', '', '', ''],
                correct_answer: '',
                explanation: '',
                marks: 1,
                negative_marks: 0,
                difficulty_level: 'MEDIUM',
                cognitive_level: 'KNOWLEDGE',
                is_active: true
            });
        }
        setQuestionDialog(true);
    };

    const saveQuestion = async () => {
        if (!questionForm.subject_id) {
            toast.error('Subject is required');
            return;
        }
        if (!questionForm.question_text.trim()) {
            toast.error('Question text is required');
            return;
        }
        if (!questionForm.correct_answer.trim()) {
            toast.error('Correct answer is required');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...questionForm,
                organization_id: organizationId,
                branch_id: selectedBranch.id,
                session_id: currentSessionId,
                category_id: questionForm.category_id || null,
                options: questionForm.question_type === 'MCQ' || questionForm.question_type === 'MATCH' 
                    ? questionForm.options.filter(o => o.trim()) 
                    : null
            };

            let response;
            if (editingQuestion) {
                response = await questionBankService.updateQuestion(editingQuestion.id, payload);
            } else {
                response = await questionBankService.createQuestion(payload);
            }

            if (response.data.success) {
                toast.success(`Question ${editingQuestion ? 'updated' : 'created'} successfully`);
                setQuestionDialog(false);
                loadQuestions();
            } else {
                toast.error(response.data.message || 'Failed to save question');
            }
        } catch (error) {
            console.error('Error saving question:', error);
            toast.error('Failed to save question');
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        const { type, item } = deleteDialog;
        setLoading(true);
        try {
            let response;
            if (type === 'category') {
                response = await questionBankService.deleteCategory(item.id);
            } else {
                response = await questionBankService.deleteQuestion(item.id);
            }

            if (response.data.success) {
                toast.success(`${type === 'category' ? 'Category' : 'Question'} deleted successfully`);
                if (type === 'category') {
                    loadCategories();
                } else {
                    loadQuestions();
                }
            } else {
                toast.error(response.data.message || 'Failed to delete');
            }
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Failed to delete');
        } finally {
            setLoading(false);
            setDeleteDialog({ open: false, type: '', item: null });
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value === 'all' ? '' : value }));
    };

    const applyFilters = () => {
        loadQuestions();
    };

    const updateOption = (index, value) => {
        const newOptions = [...questionForm.options];
        newOptions[index] = value;
        setQuestionForm(prev => ({ ...prev, options: newOptions }));
    };

    const addOption = () => {
        setQuestionForm(prev => ({ ...prev, options: [...prev.options, ''] }));
    };

    return (
        <DashboardLayout>
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BookOpen className="w-6 h-6" />
                        Question Bank
                    </h1>
                    <p className="text-muted-foreground">Manage questions for online examinations</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadInitialData} disabled={loading}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                    <Button variant="outline">
                        <Upload className="w-4 h-4 mr-2" /> Import
                    </Button>
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" /> Export
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="questions">
                        <HelpCircle className="w-4 h-4 mr-2" /> Questions ({questions.length})
                    </TabsTrigger>
                    <TabsTrigger value="categories">
                        <FolderTree className="w-4 h-4 mr-2" /> Categories ({categories.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="questions" className="mt-4 space-y-4">
                    {/* Filters */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="grid grid-cols-6 gap-4">
                                <div>
                                    <Select value={filters.subject_id || 'all'} onValueChange={v => handleFilterChange('subject_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Subjects</SelectItem>
                                            {subjects.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Select value={filters.category_id || 'all'} onValueChange={v => handleFilterChange('category_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {categories.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Select value={filters.question_type || 'all'} onValueChange={v => handleFilterChange('question_type', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            {QUESTION_TYPES.map(t => (
                                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Select value={filters.difficulty || 'all'} onValueChange={v => handleFilterChange('difficulty', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Difficulty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Levels</SelectItem>
                                            {DIFFICULTY_LEVELS.map(d => (
                                                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                                    <Input 
                                        className="pl-9"
                                        placeholder="Search..."
                                        value={filters.search}
                                        onChange={e => handleFilterChange('search', e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={applyFilters} className="flex-1">
                                        <Filter className="w-4 h-4 mr-2" /> Apply
                                    </Button>
                                    <Button onClick={() => openQuestionDialog()}>
                                        <Plus className="w-4 h-4 mr-2" /> Add
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Questions List */}
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Question</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Difficulty</TableHead>
                                        <TableHead className="text-right">Marks</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="w-24">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {questions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                                No questions found. Click "Add" to create one.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        questions.map((q, index) => (
                                            <TableRow key={q.id}>
                                                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                                <TableCell className="max-w-md">
                                                    <p className="truncate">{q.question_text}</p>
                                                    {q.category && (
                                                        <span className="text-xs text-muted-foreground">{q.category.name}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{q.subject?.name || '-'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {QUESTION_TYPES.find(t => t.value === q.question_type)?.label || q.question_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={DIFFICULTY_LEVELS.find(d => d.value === q.difficulty_level)?.color}>
                                                        {q.difficulty_level}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">{q.marks}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={q.is_active ? 'default' : 'secondary'}>
                                                        {q.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => openQuestionDialog(q)}>
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon"
                                                            onClick={() => setDeleteDialog({ open: true, type: 'question', item: q })}
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
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="categories" className="mt-4 space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => openCategoryDialog()}>
                            <Plus className="w-4 h-4 mr-2" /> Add Category
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Parent</TableHead>
                                        <TableHead className="w-24">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                                No categories found. Click "Add Category" to create one.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        categories.map(cat => (
                                            <TableRow key={cat.id}>
                                                <TableCell className="font-medium">{cat.name}</TableCell>
                                                <TableCell className="text-muted-foreground">{cat.description || '-'}</TableCell>
                                                <TableCell>
                                                    {cat.parent_id 
                                                        ? categories.find(c => c.id === cat.parent_id)?.name || '-'
                                                        : <Badge variant="outline">Root</Badge>
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => openCategoryDialog(cat)}>
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon"
                                                            onClick={() => setDeleteDialog({ open: true, type: 'category', item: cat })}
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
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Category Dialog */}
            <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
                        <DialogDescription>Create categories to organize your questions</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Category Name *</Label>
                            <Input 
                                value={categoryForm.name}
                                onChange={e => setCategoryForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="e.g., Algebra, Grammar, Chemical Reactions"
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea 
                                value={categoryForm.description}
                                onChange={e => setCategoryForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="Brief description of this category"
                            />
                        </div>
                        <div>
                            <Label>Parent Category</Label>
                            <Select 
                                value={categoryForm.parent_id || '__none'} 
                                onValueChange={v => setCategoryForm(p => ({ ...p, parent_id: v === '__none' ? '' : v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="None (Root Category)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none">None (Root Category)</SelectItem>
                                    {categories
                                        .filter(c => c.id !== editingCategory?.id)
                                        .map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCategoryDialog(false)}>Cancel</Button>
                        <Button onClick={saveCategory} disabled={loading}>
                            {editingCategory ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Question Dialog */}
            <Dialog open={questionDialog} onOpenChange={setQuestionDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Subject *</Label>
                                <Select 
                                    value={questionForm.subject_id} 
                                    onValueChange={v => setQuestionForm(p => ({ ...p, subject_id: v }))}
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
                                <Label>Category</Label>
                                <Select 
                                    value={questionForm.category_id || '__none'} 
                                    onValueChange={v => setQuestionForm(p => ({ ...p, category_id: v === '__none' ? '' : v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none">None</SelectItem>
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Question Type *</Label>
                                <Select 
                                    value={questionForm.question_type} 
                                    onValueChange={v => setQuestionForm(p => ({ ...p, question_type: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {QUESTION_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label>Difficulty</Label>
                                    <Select 
                                        value={questionForm.difficulty_level} 
                                        onValueChange={v => setQuestionForm(p => ({ ...p, difficulty_level: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DIFFICULTY_LEVELS.map(d => (
                                                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Cognitive Level</Label>
                                    <Select 
                                        value={questionForm.cognitive_level} 
                                        onValueChange={v => setQuestionForm(p => ({ ...p, cognitive_level: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COGNITIVE_LEVELS.map(c => (
                                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label>Question Text *</Label>
                            <Textarea 
                                value={questionForm.question_text}
                                onChange={e => setQuestionForm(p => ({ ...p, question_text: e.target.value }))}
                                placeholder="Enter the question..."
                                rows={4}
                            />
                        </div>

                        {(questionForm.question_type === 'MCQ' || questionForm.question_type === 'MATCH') && (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <Label>Options</Label>
                                    <Button variant="ghost" size="sm" onClick={addOption}>
                                        <Plus className="w-4 h-4 mr-1" /> Add Option
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {questionForm.options.map((opt, i) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <span className="w-6 text-sm text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                                            <Input 
                                                value={opt}
                                                onChange={e => updateOption(i, e.target.value)}
                                                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <Label>Correct Answer *</Label>
                            {questionForm.question_type === 'MCQ' ? (
                                <Select 
                                    value={questionForm.correct_answer} 
                                    onValueChange={v => setQuestionForm(p => ({ ...p, correct_answer: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select correct option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {questionForm.options.map((opt, i) => opt.trim() && (
                                            <SelectItem key={i} value={String.fromCharCode(65 + i)}>
                                                {String.fromCharCode(65 + i)}. {opt}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : questionForm.question_type === 'TRUE_FALSE' ? (
                                <Select 
                                    value={questionForm.correct_answer} 
                                    onValueChange={v => setQuestionForm(p => ({ ...p, correct_answer: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select answer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TRUE">True</SelectItem>
                                        <SelectItem value="FALSE">False</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Textarea 
                                    value={questionForm.correct_answer}
                                    onChange={e => setQuestionForm(p => ({ ...p, correct_answer: e.target.value }))}
                                    placeholder="Enter the correct answer..."
                                    rows={2}
                                />
                            )}
                        </div>

                        <div>
                            <Label>Explanation (Optional)</Label>
                            <Textarea 
                                value={questionForm.explanation}
                                onChange={e => setQuestionForm(p => ({ ...p, explanation: e.target.value }))}
                                placeholder="Explain why this is the correct answer..."
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label>Marks</Label>
                                <Input 
                                    type="number"
                                    min="1"
                                    value={questionForm.marks}
                                    onChange={e => setQuestionForm(p => ({ ...p, marks: parseInt(e.target.value) || 1 }))}
                                />
                            </div>
                            <div>
                                <Label>Negative Marks</Label>
                                <Input 
                                    type="number"
                                    min="0"
                                    step="0.25"
                                    value={questionForm.negative_marks}
                                    onChange={e => setQuestionForm(p => ({ ...p, negative_marks: parseFloat(e.target.value) || 0 }))}
                                />
                            </div>
                            <div className="flex items-end">
                                <div className="flex items-center gap-2">
                                    <Switch 
                                        checked={questionForm.is_active}
                                        onCheckedChange={v => setQuestionForm(p => ({ ...p, is_active: v }))}
                                    />
                                    <Label>Active</Label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setQuestionDialog(false)}>Cancel</Button>
                        <Button onClick={saveQuestion} disabled={loading}>
                            {editingQuestion ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialog.open} onOpenChange={open => !open && setDeleteDialog({ open: false, type: '', item: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {deleteDialog.type}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the {deleteDialog.type}
                            {deleteDialog.type === 'category' && ' and may affect related questions'}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        </DashboardLayout>
    );
};

export default QuestionBankPage;
