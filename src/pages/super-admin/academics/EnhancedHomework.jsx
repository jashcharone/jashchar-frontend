/**
 * ENHANCED HOMEWORK SYSTEM
 * Day 13 - Academic Intelligence Module
 * 
 * Features:
 * - Homework templates
 * - MCQ auto-grading
 * - Submission tracking
 * - Late penalty handling
 * - Analytics dashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { toast } from 'sonner';
import {
  BookOpen, FileText, Clock, Calendar, CheckCircle, AlertCircle, XCircle,
  Plus, Search, Filter, Eye, Edit, Trash2, Send, Download, Upload,
  Users, UserCheck, Star, RefreshCw, ChevronRight, BarChart3,
  ClipboardCheck, FileQuestion, Timer, Zap, Award, AlertTriangle,
  GraduationCap, TrendingUp, TrendingDown, ArrowRight, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import DashboardLayout from '@/components/DashboardLayout';
import { useNavigate } from 'react-router-dom';

const HOMEWORK_TYPES = [
  { value: 'assignment', label: 'Assignment', icon: FileText },
  { value: 'worksheet', label: 'Worksheet', icon: ClipboardCheck },
  { value: 'project', label: 'Project', icon: BookOpen },
  { value: 'quiz', label: 'Quiz/MCQ', icon: FileQuestion },
  { value: 'research', label: 'Research', icon: Search },
  { value: 'revision', label: 'Revision', icon: RefreshCw }
];

const STATUS_COLORS = {
  published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  closed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  archived: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
};

export default function EnhancedHomework() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState('homework');

  // Data states
  const [homework, setHomework] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [submissions, setSubmissions] = useState({ submitted: [], notSubmitted: [], stats: {} });

  // Filter states
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Filters
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // UI states
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSubmissionsDialog, setShowSubmissionsDialog] = useState(false);
  const [showGradeDialog, setShowGradeDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Form states
  const [newHomework, setNewHomework] = useState({
    title: '',
    description: '',
    instructions: '',
    homework_type: 'assignment',
    class_id: '',
    section_id: 'all',
    subject_id: '',
    chapter_id: 'all',
    assigned_date: new Date().toISOString().split('T')[0],
    due_date: '',
    due_time: '23:59',
    total_points: 10,
    allow_late_submission: true,
    late_penalty_percent: 10,
    max_late_days: 3,
    allow_resubmission: false,
    is_auto_gradable: false,
    status: 'published'
  });

  const [gradeForm, setGradeForm] = useState({
    raw_score: '',
    feedback: '',
    grade_letter: ''
  });

  // MCQ Questions for auto-grading
  const [questions, setQuestions] = useState([]);

  // ===========================
  // DATA FETCHING
  // ===========================

  const fetchStats = useCallback(async () => {
    try {
      const params = {};
      if (selectedClass && selectedClass !== 'all') params.class_id = selectedClass;
      if (selectedSubject && selectedSubject !== 'all') params.subject_id = selectedSubject;

      const response = await api.get('/enhanced-homework/analytics/dashboard', { params });
      if (response?.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [selectedClass, selectedSubject]);

  const fetchHomework = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      if (selectedClass && selectedClass !== 'all') params.class_id = selectedClass;
      if (selectedSection) params.section_id = selectedSection;
      if (selectedSubject && selectedSubject !== 'all') params.subject_id = selectedSubject;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const response = await api.get('/enhanced-homework', { params });
      if (response?.success) {
        setHomework(response.data || []);
        if (response.pagination) setPagination(prev => ({ ...prev, ...response.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch homework:', error);
      toast.error('Failed to load homework');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, selectedClass, selectedSection, selectedSubject, statusFilter, searchQuery]);

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await api.get('/enhanced-homework/templates');
      if (response?.success) {
        setTemplates(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await api.get('/academics/classes');
      if (Array.isArray(response)) {
        setClasses(response);
      } else if (response?.success) {
        setClasses(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  }, []);

  const fetchSections = useCallback(async (classId) => {
    try {
      const response = await api.get('/academics/sections', { params: { class_id: classId } });
      if (Array.isArray(response)) {
        setSections(response);
      } else if (response?.success) {
        setSections(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    }
  }, []);

  const fetchSubjects = useCallback(async (classId) => {
    try {
      const response = await api.get('/academics/subjects', { params: { class_id: classId } });
      if (Array.isArray(response)) {
        setSubjects(response);
      } else if (response?.success) {
        setSubjects(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  }, []);

  const fetchChapters = useCallback(async (subjectId) => {
    try {
      const response = await api.get('/curriculum/chapters', { params: { subject_id: subjectId } });
      if (Array.isArray(response)) {
        setChapters(response);
      } else if (response?.success) {
        setChapters(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch chapters:', error);
    }
  }, []);

  const fetchSubmissions = useCallback(async (homeworkId) => {
    try {
      const response = await api.get(`/enhanced-homework/${homeworkId}/submissions`);
      if (response?.success) {
        setSubmissions(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      toast.error('Failed to load submissions');
    }
  }, []);

  // Initial data load
  useEffect(() => {
    if (selectedBranch?.id) {
      fetchStats();
      fetchTemplates();
      fetchClasses();
    }
  }, [selectedBranch?.id, fetchStats, fetchTemplates, fetchClasses]);

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchHomework();
    }
  }, [selectedBranch?.id, selectedClass, selectedSubject, statusFilter, searchQuery, pagination.page, fetchHomework]);

  useEffect(() => {
    if (selectedClass && selectedClass !== 'all') {
      fetchSections(selectedClass);
      fetchSubjects(selectedClass);
    } else {
      setSections([]);
      setSubjects([]);
    }
  }, [selectedClass, fetchSections, fetchSubjects]);

  useEffect(() => {
    if (selectedSubject && selectedSubject !== 'all') {
      fetchChapters(selectedSubject);
    } else {
      setChapters([]);
    }
  }, [selectedSubject, fetchChapters]);

  // ===========================
  // ACTIONS
  // ===========================

  const handleCreateHomework = async () => {
    try {
      if (!newHomework.title || !newHomework.class_id || !newHomework.subject_id || !newHomework.due_date) {
        toast.error('Please fill in required fields');
        return;
      }

      setLoading(true);
      const payload = {
        ...newHomework,
        section_id: newHomework.section_id === 'all' ? null : newHomework.section_id,
        chapter_id: newHomework.chapter_id === 'all' ? null : newHomework.chapter_id,
        questions: questions.length > 0 ? questions : undefined
      };

      const response = await api.post('/enhanced-homework', payload);
      if (response?.success) {
        toast.success('Homework created successfully');
        setShowCreateDialog(false);
        resetForm();
        fetchHomework();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to create homework:', error);
      toast.error('Failed to create homework');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHomework = async (id) => {
    if (!confirm('Are you sure you want to delete this homework?')) return;

    try {
      const response = await api.delete(`/enhanced-homework/${id}`);
      if (response?.success) {
        toast.success(response.message);
        fetchHomework();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete homework:', error);
      toast.error('Failed to delete homework');
    }
  };

  const handleViewSubmissions = async (hw) => {
    setSelectedHomework(hw);
    await fetchSubmissions(hw.id);
    setShowSubmissionsDialog(true);
  };

  const handleGradeSubmission = (submission) => {
    setSelectedSubmission(submission);
    setGradeForm({
      raw_score: submission.raw_score || '',
      feedback: submission.feedback || '',
      grade_letter: submission.grade_letter || ''
    });
    setShowGradeDialog(true);
  };

  const submitGrade = async () => {
    try {
      if (!gradeForm.raw_score) {
        toast.error('Please enter a score');
        return;
      }

      const response = await api.put(`/enhanced-homework/submissions/${selectedSubmission.id}/grade`, gradeForm);
      if (response?.success) {
        toast.success('Submission graded successfully');
        setShowGradeDialog(false);
        fetchSubmissions(selectedHomework.id);
      }
    } catch (error) {
      console.error('Failed to grade submission:', error);
      toast.error('Failed to grade submission');
    }
  };

  const resetForm = () => {
    setNewHomework({
      title: '',
      description: '',
      instructions: '',
      homework_type: 'assignment',
      class_id: '',
      section_id: '',
      subject_id: '',
      chapter_id: '',
      assigned_date: new Date().toISOString().split('T')[0],
      due_date: '',
      due_time: '23:59',
      total_points: 10,
      allow_late_submission: true,
      late_penalty_percent: 10,
      max_late_days: 3,
      allow_resubmission: false,
      is_auto_gradable: false,
      status: 'published'
    });
    setQuestions([]);
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      question_type: 'mcq',
      question_text: '',
      options: [
        { id: 'a', text: '' },
        { id: 'b', text: '' },
        { id: 'c', text: '' },
        { id: 'd', text: '' }
      ],
      correct_answer: '',
      points: 1
    }]);
  };

  const updateQuestion = (index, updates) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // ===========================
  // HELPER FUNCTIONS
  // ===========================

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.name || cls?.class_name || '-';
  };

  const getSubjectName = (subjectId) => {
    const sub = subjects.find(s => s.id === subjectId);
    return sub?.name || sub?.subject_name || '-';
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const getDaysLeft = (dueDate) => {
    const diff = new Date(dueDate) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  // ===========================
  // RENDER COMPONENTS
  // ===========================

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Active Homework</p>
                <p className="text-3xl font-bold text-blue-700">{stats?.active || 0}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600">Overdue</p>
                <p className="text-3xl font-bold text-amber-700">{stats?.overdue || 0}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Pending Grading</p>
                <p className="text-3xl font-bold text-orange-700">{stats?.pendingGrading || 0}</p>
              </div>
              <ClipboardCheck className="w-10 h-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Avg Score (Week)</p>
                <p className="text-3xl font-bold text-green-700">{stats?.weeklyStats?.avgScore || 0}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  const renderFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <Select value={selectedClass} onValueChange={setSelectedClass}>
        <SelectTrigger>
          <SelectValue placeholder="All Classes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Classes</SelectItem>
          {classes.map(cls => (
            <SelectItem key={cls.id} value={cls.id}>
              {cls.name || cls.class_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass}>
        <SelectTrigger>
          <SelectValue placeholder="All Subjects" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Subjects</SelectItem>
          {subjects.map(sub => (
            <SelectItem key={sub.id} value={sub.id}>
              {sub.name || sub.subject_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger>
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="published">Published</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search homework..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Button onClick={() => setShowCreateDialog(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Create Homework
      </Button>
    </div>
  );

  const renderHomeworkList = () => (
    <div className="space-y-4">
      {homework.map((hw) => {
        const daysLeft = getDaysLeft(hw.due_date);
        const overdue = isOverdue(hw.due_date);
        const typeConfig = HOMEWORK_TYPES.find(t => t.value === hw.homework_type);
        const IconComponent = typeConfig?.icon || FileText;

        return (
          <motion.div
            key={hw.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Left - Icon & Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${overdue ? 'bg-red-100' : 'bg-blue-100'}`}>
                      <IconComponent className={`w-6 h-6 ${overdue ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{hw.title}</h3>
                        <Badge className={STATUS_COLORS[hw.status] || 'bg-gray-100'}>
                          {hw.status}
                        </Badge>
                        {hw.is_auto_gradable && (
                          <Badge variant="outline" className="border-purple-300 text-purple-700">
                            <Zap className="w-3 h-3 mr-1" />
                            Auto-Grade
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4" />
                          {hw.class?.name || hw.class?.class_name}
                          {hw.section && ` - ${hw.section.name || hw.section.section_name}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {hw.subject?.name || hw.subject?.subject_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          {hw.total_points} points
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          Due: {formatDate(hw.due_date)}
                        </span>
                        {!overdue && daysLeft >= 0 && (
                          <Badge variant="outline" className={daysLeft <= 1 ? 'border-red-300 text-red-600' : ''}>
                            <Clock className="w-3 h-3 mr-1" />
                            {daysLeft === 0 ? 'Due Today' : `${daysLeft} days left`}
                          </Badge>
                        )}
                        {overdue && (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right - Stats & Actions */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">Submitted</p>
                        <p className="font-semibold text-lg">{hw.submission_count || 0}</p>
                      </div>
                      {hw.avg_score && (
                        <div className="text-center">
                          <p className="text-muted-foreground">Avg Score</p>
                          <p className="font-semibold text-lg">{hw.avg_score.toFixed(1)}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewSubmissions(hw)}>
                        <Users className="w-4 h-4 mr-1" />
                        Submissions
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteHomework(hw.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {homework.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No homework found</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Homework
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderCreateDialog = () => (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Homework Assignment</DialogTitle>
          <DialogDescription>Assign homework to students</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={newHomework.title}
                onChange={(e) => setNewHomework(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Homework title"
              />
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select 
                value={newHomework.homework_type}
                onValueChange={(value) => setNewHomework(prev => ({ 
                  ...prev, 
                  homework_type: value,
                  is_auto_gradable: value === 'quiz'
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOMEWORK_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={newHomework.description}
              onChange={(e) => setNewHomework(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Instructions</Label>
            <Textarea
              value={newHomework.instructions}
              onChange={(e) => setNewHomework(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Detailed instructions for students"
              rows={3}
            />
          </div>

          {/* Class/Subject Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select 
                value={newHomework.class_id}
                onValueChange={(value) => {
                  setNewHomework(prev => ({ ...prev, class_id: value, section_id: '', subject_id: '', chapter_id: '' }));
                  if (value) {
                    fetchSections(value);
                    fetchSubjects(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name || cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section (Optional)</Label>
              <Select 
                value={newHomework.section_id}
                onValueChange={(value) => setNewHomework(prev => ({ ...prev, section_id: value }))}
                disabled={!newHomework.class_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map(sec => (
                    <SelectItem key={sec.id} value={sec.id}>
                      {sec.name || sec.section_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select 
                value={newHomework.subject_id}
                onValueChange={(value) => {
                  setNewHomework(prev => ({ ...prev, subject_id: value, chapter_id: '' }));
                  if (value) fetchChapters(value);
                }}
                disabled={!newHomework.class_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name || sub.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chapter (Optional)</Label>
              <Select 
                value={newHomework.chapter_id}
                onValueChange={(value) => setNewHomework(prev => ({ ...prev, chapter_id: value }))}
                disabled={!newHomework.subject_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Chapter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chapters</SelectItem>
                  {chapters.map(ch => (
                    <SelectItem key={ch.id} value={ch.id}>
                      {ch.name || ch.chapter_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Assigned Date</Label>
              <Input
                type="date"
                value={newHomework.assigned_date}
                onChange={(e) => setNewHomework(prev => ({ ...prev, assigned_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={newHomework.due_date}
                onChange={(e) => setNewHomework(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Due Time</Label>
              <Input
                type="time"
                value={newHomework.due_time}
                onChange={(e) => setNewHomework(prev => ({ ...prev, due_time: e.target.value }))}
              />
            </div>
          </div>

          {/* Points & Settings */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Total Points</Label>
              <Input
                type="number"
                value={newHomework.total_points}
                onChange={(e) => setNewHomework(prev => ({ ...prev, total_points: parseInt(e.target.value) || 10 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Late Penalty (%/day)</Label>
              <Input
                type="number"
                value={newHomework.late_penalty_percent}
                onChange={(e) => setNewHomework(prev => ({ ...prev, late_penalty_percent: parseFloat(e.target.value) || 10 }))}
                disabled={!newHomework.allow_late_submission}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Late Days</Label>
              <Input
                type="number"
                value={newHomework.max_late_days}
                onChange={(e) => setNewHomework(prev => ({ ...prev, max_late_days: parseInt(e.target.value) || 3 }))}
                disabled={!newHomework.allow_late_submission}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={newHomework.allow_late_submission}
                onCheckedChange={(checked) => setNewHomework(prev => ({ ...prev, allow_late_submission: checked }))}
              />
              <Label>Allow Late Submission</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newHomework.allow_resubmission}
                onCheckedChange={(checked) => setNewHomework(prev => ({ ...prev, allow_resubmission: checked }))}
              />
              <Label>Allow Resubmission</Label>
            </div>
            {newHomework.homework_type === 'quiz' && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={newHomework.is_auto_gradable}
                  onCheckedChange={(checked) => setNewHomework(prev => ({ ...prev, is_auto_gradable: checked }))}
                />
                <Label className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-purple-500" />
                  Auto-Grade MCQ
                </Label>
              </div>
            )}
          </div>

          {/* MCQ Questions Section */}
          {newHomework.is_auto_gradable && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileQuestion className="w-5 h-5" />
                  MCQ Questions ({questions.length})
                </h3>
                <Button variant="outline" size="sm" onClick={addQuestion}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Question
                </Button>
              </div>

              {questions.map((q, qIndex) => (
                <Card key={qIndex} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Question {qIndex + 1}</Label>
                      <Button variant="ghost" size="sm" onClick={() => removeQuestion(qIndex)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <Textarea
                      value={q.question_text}
                      onChange={(e) => updateQuestion(qIndex, { question_text: e.target.value })}
                      placeholder="Enter question text"
                      rows={2}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, optIndex) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <span className="font-medium w-6">{opt.id}.</span>
                          <Input
                            value={opt.text}
                            onChange={(e) => {
                              const newOptions = [...q.options];
                              newOptions[optIndex].text = e.target.value;
                              updateQuestion(qIndex, { options: newOptions });
                            }}
                            placeholder={`Option ${opt.id}`}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label>Correct Answer:</Label>
                        <Select
                          value={q.correct_answer}
                          onValueChange={(value) => updateQuestion(qIndex, { correct_answer: value })}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {q.options.map(opt => (
                              <SelectItem key={opt.id} value={opt.id}>{opt.id.toUpperCase()}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label>Points:</Label>
                        <Input
                          type="number"
                          value={q.points}
                          onChange={(e) => updateQuestion(qIndex, { points: parseInt(e.target.value) || 1 })}
                          className="w-20"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
            Cancel
          </Button>
          <Button onClick={handleCreateHomework} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Homework
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderSubmissionsDialog = () => (
    <Dialog open={showSubmissionsDialog} onOpenChange={setShowSubmissionsDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submissions - {selectedHomework?.title}</DialogTitle>
          <DialogDescription>
            {submissions.stats.submitted || 0} of {submissions.stats.total || 0} submitted
          </DialogDescription>
        </DialogHeader>

        {/* Stats Bar */}
        <div className="flex gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{submissions.stats.submitted || 0}</p>
            <p className="text-sm text-muted-foreground">Submitted</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{submissions.stats.graded || 0}</p>
            <p className="text-sm text-muted-foreground">Graded</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{submissions.stats.late || 0}</p>
            <p className="text-sm text-muted-foreground">Late</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{submissions.notSubmitted.length}</p>
            <p className="text-sm text-muted-foreground">Missing</p>
          </div>
        </div>

        <Tabs defaultValue="submitted" className="mt-4">
          <TabsList>
            <TabsTrigger value="submitted">
              Submitted ({submissions.submitted.length})
            </TabsTrigger>
            <TabsTrigger value="missing">
              Missing ({submissions.notSubmitted.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submitted">
            <div className="space-y-2 mt-4">
              {submissions.submitted.map(sub => (
                <Card key={sub.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {sub.student?.photo_url ? (
                          <img src={sub.student.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <Users className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {sub.student?.first_name} {sub.student?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {sub.student?.admission_no} | Roll: {sub.student?.roll_no}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{formatDateTime(sub.submitted_at)}</p>
                        <div className="flex gap-2">
                          {sub.is_late && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              Late ({sub.late_days}d)
                            </Badge>
                          )}
                          {sub.is_graded ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              {sub.final_score}/{selectedHomework?.total_points}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleGradeSubmission(sub)}>
                        <Edit className="w-4 h-4 mr-1" />
                        {sub.is_graded ? 'Edit' : 'Grade'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {submissions.submitted.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No submissions yet</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="missing">
            <div className="grid grid-cols-2 gap-2 mt-4">
              {submissions.notSubmitted.map(student => (
                <Card key={student.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium">{student.first_name} {student.last_name}</p>
                      <p className="text-sm text-muted-foreground">{student.admission_no}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );

  const renderGradeDialog = () => (
    <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grade Submission</DialogTitle>
          <DialogDescription>
            {selectedSubmission?.student?.first_name} {selectedSubmission?.student?.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {selectedSubmission?.is_late && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                ⚠️ Late submission ({selectedSubmission.late_days} days) - 
                {selectedSubmission.late_penalty_applied}% penalty will be applied
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Score (out of {selectedHomework?.total_points})</Label>
            <Input
              type="number"
              value={gradeForm.raw_score}
              onChange={(e) => setGradeForm(prev => ({ ...prev, raw_score: e.target.value }))}
              max={selectedHomework?.total_points}
            />
            {selectedSubmission?.is_late && gradeForm.raw_score && (
              <p className="text-sm text-muted-foreground">
                Final score after penalty: {(gradeForm.raw_score * (1 - (selectedSubmission.late_penalty_applied || 0) / 100)).toFixed(1)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Grade Letter (Optional)</Label>
            <Select
              value={gradeForm.grade_letter}
              onValueChange={(value) => setGradeForm(prev => ({ ...prev, grade_letter: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C+">C+</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
                <SelectItem value="F">F</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Feedback</Label>
            <Textarea
              value={gradeForm.feedback}
              onChange={(e) => setGradeForm(prev => ({ ...prev, feedback: e.target.value }))}
              placeholder="Feedback for student"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowGradeDialog(false)}>Cancel</Button>
          <Button onClick={submitGrade}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Save Grade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ===========================
  // MAIN RENDER
  // ===========================

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="w-7 h-7 text-primary" />
                Enhanced Homework System
              </h1>
              <p className="text-muted-foreground">
                Assign, track, and grade homework with auto-grading support
              </p>
            </div>
          </div>
        </div>

      {/* Stats */}
      {renderStatsCards()}

      {/* Filters */}
      {renderFilters()}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading homework...</p>
        </div>
      ) : (
        renderHomeworkList()
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.page <= 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </Button>
        </div>
      )}

      {/* Dialogs */}
      {renderCreateDialog()}
      {renderSubmissionsDialog()}
      {renderGradeDialog()}
    </div>
    </DashboardLayout>
  );
}
