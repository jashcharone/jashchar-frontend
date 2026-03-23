import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDate, formatDateForInput } from '@/utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  FileText, Plus, Trash2, Edit2, Save, CheckCircle2, Circle,
  RefreshCw, Loader2, Calendar as CalendarIcon, Clock,
  GraduationCap, BookOpen, Target, Copy, Play, CheckCheck,
  Eye, BarChart3, Layers, Brain, Settings, ChevronRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  planned: { label: 'Planned', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
};

const LessonPlans = () => {
  const { toast } = useToast();
  const { user, currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();
  
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  
  // Data
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [lessonPlans, setLessonPlans] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Dialogs
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [viewPlanId, setViewPlanId] = useState(null);
  
  const branchId = selectedBranch?.id;

  useEffect(() => {
    if (branchId) {
      fetchPrerequisites();
      fetchStats();
    }
  }, [branchId]);

  useEffect(() => {
    if (branchId) {
      fetchLessonPlans();
    }
  }, [branchId, currentSessionId, selectedClass, selectedSubject, statusFilter]);

  const fetchPrerequisites = async () => {
    try {
      const [classesRes, subjectsRes, templatesRes] = await Promise.all([
        api.get(`/academics/classes?branchId=${branchId}`),
        api.get(`/academics/subjects?branchId=${branchId}`),
        api.get(`/lesson-plans/templates`)
      ]);
      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
      setTemplates(templatesRes.data || []);
    } catch (error) {
      console.error('Error fetching prerequisites:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonPlans = async () => {
    try {
      const params = new URLSearchParams({
        branchId,
        sessionId: currentSessionId,
        ...(selectedClass && { classId: selectedClass }),
        ...(selectedSubject && { subjectId: selectedSubject }),
        ...(statusFilter && { status: statusFilter })
      });
      const { data } = await api.get(`/lesson-plans?${params}`);
      setLessonPlans(data || []);
    } catch (error) {
      console.error('Error fetching lesson plans:', error);
      toast({ title: 'Error', description: 'Failed to load lesson plans', variant: 'destructive' });
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get(`/lesson-plans/stats/summary?branchId=${branchId}&sessionId=${currentSessionId}`);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchChapters = async (classId, subjectId) => {
    try {
      const { data } = await api.get(`/curriculum/chapters?branchId=${branchId}&classId=${classId}&subjectId=${subjectId}&sessionId=${currentSessionId}`);
      setChapters(data || []);
    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  const fetchTopics = async (chapterId) => {
    try {
      const { data } = await api.get(`/curriculum/topics?branchId=${branchId}&chapterId=${chapterId}`);
      setTopics(data || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const handleSavePlan = async (planData) => {
    try {
      await api.post('/lesson-plans', {
        ...planData,
        id: editingPlan?.id,
        branch_id: branchId,
        session_id: currentSessionId,
        organization_id: selectedBranch?.organization_id
      });
      toast({ title: 'Success', description: 'Lesson plan saved successfully' });
      setPlanDialogOpen(false);
      setEditingPlan(null);
      fetchLessonPlans();
      fetchStats();
    } catch (error) {
      console.error('Error saving lesson plan:', error);
      toast({ title: 'Error', description: 'Failed to save lesson plan', variant: 'destructive' });
    }
  };

  const handleDeletePlan = async (planId) => {
    try {
      await api.delete(`/lesson-plans/${planId}?branchId=${branchId}`);
      toast({ title: 'Success', description: 'Lesson plan deleted' });
      fetchLessonPlans();
      fetchStats();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({ title: 'Error', description: 'Failed to delete lesson plan', variant: 'destructive' });
    }
  };

  const handleClonePlan = async (planId) => {
    try {
      await api.post(`/lesson-plans/${planId}/clone`, { branchId });
      toast({ title: 'Success', description: 'Lesson plan cloned' });
      fetchLessonPlans();
    } catch (error) {
      console.error('Error cloning plan:', error);
      toast({ title: 'Error', description: 'Failed to clone lesson plan', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (planId, newStatus) => {
    try {
      await api.post(`/lesson-plans/${planId}/status?branchId=${branchId}`, { status: newStatus });
      toast({ title: 'Success', description: 'Status updated' });
      fetchLessonPlans();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Lesson Plans
            </h1>
            <p className="text-muted-foreground mt-1">
              Create, manage, and track lesson plans with 5E model support
            </p>
          </div>
          <Button onClick={() => { setEditingPlan(null); setPlanDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            New Lesson Plan
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <h3 className="text-xl font-bold">{stats?.total || 0}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Edit2 className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Draft</p>
                  <h3 className="text-xl font-bold">{stats?.draft || 0}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Planned</p>
                  <h3 className="text-xl font-bold">{stats?.planned || 0}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <h3 className="text-xl font-bold">{stats?.completed || 0}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Completion</p>
                  <h3 className="text-xl font-bold">{stats?.avgCompletion || 0}%</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedClass || '__all__'} onValueChange={(v) => setSelectedClass(v === '__all__' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Classes</SelectItem>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={selectedSubject || '__all__'} onValueChange={(v) => setSelectedSubject(v === '__all__' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Subjects</SelectItem>
                    {subjects.map(subj => (
                      <SelectItem key={subj.id} value={subj.id}>{subj.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter || '__all__'} onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Statuses</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={() => { setSelectedClass(''); setSelectedSubject(''); setStatusFilter(''); }}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lesson Plans List */}
        <div className="space-y-3">
          {lessonPlans.length > 0 ? (
            lessonPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={STATUS_CONFIG[plan.status]?.color}>
                            {STATUS_CONFIG[plan.status]?.label}
                          </Badge>
                          <Badge variant="outline">{formatDate(plan.plan_date)}</Badge>
                          {plan.period_number && (
                            <Badge variant="secondary">Period {plan.period_number}</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg">{plan.plan_title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{plan.class?.name}</span>
                          <span>•</span>
                          <span>{plan.subject?.name}</span>
                          {plan.chapter && (
                            <>
                              <span>•</span>
                              <span>Ch {plan.chapter.chapter_number}: {plan.chapter.chapter_name}</span>
                            </>
                          )}
                        </div>
                        {plan.learning_objectives?.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">Learning Objectives:</p>
                            <p className="text-sm">{plan.learning_objectives.slice(0, 2).join(', ')}
                              {plan.learning_objectives.length > 2 && ` +${plan.learning_objectives.length - 2} more`}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {plan.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(plan.id, 'planned')}
                            title="Mark as Planned"
                          >
                            <CalendarIcon className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        {plan.status === 'planned' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(plan.id, 'in_progress')}
                            title="Start Lesson"
                          >
                            <Play className="h-4 w-4 text-yellow-600" />
                          </Button>
                        )}
                        {plan.status === 'in_progress' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(plan.id, 'completed')}
                            title="Mark Complete"
                          >
                            <CheckCheck className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClonePlan(plan.id)}
                          title="Clone"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditingPlan(plan); setPlanDialogOpen(true); }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Lesson Plan?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this lesson plan and all related resources.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePlan(plan.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">
                  No lesson plans found. Start planning your lessons!
                </p>
                <Button onClick={() => { setEditingPlan(null); setPlanDialogOpen(true); }} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Lesson Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Lesson Plan Dialog */}
        <LessonPlanDialog
          open={planDialogOpen}
          onOpenChange={setPlanDialogOpen}
          plan={editingPlan}
          classes={classes}
          subjects={subjects}
          templates={templates}
          branchId={branchId}
          sessionId={currentSessionId}
          onSave={handleSavePlan}
          onFetchChapters={fetchChapters}
          onFetchTopics={fetchTopics}
          chapters={chapters}
          topics={topics}
        />
      </div>
    </DashboardLayout>
  );
};

// Lesson Plan Dialog Component
const LessonPlanDialog = ({ open, onOpenChange, plan, classes, subjects, templates, branchId, sessionId, onSave, onFetchChapters, onFetchTopics, chapters, topics }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    plan_title: '',
    plan_date: new Date().toISOString().split('T')[0],
    class_id: '',
    section_id: '',
    subject_id: '',
    chapter_id: '',
    topic_id: '',
    template_id: '',
    period_number: '',
    duration_minutes: 40,
    learning_objectives: [],
    engage_activities: '',
    explore_activities: '',
    explain_activities: '',
    elaborate_activities: '',
    evaluate_activities: '',
    introduction: '',
    main_content: '',
    activities: '',
    assessment: '',
    closure: '',
    required_materials: [],
    differentiation_strategies: '',
    homework_assignment: '',
    status: 'draft'
  });
  const [saving, setSaving] = useState(false);
  const [newObjective, setNewObjective] = useState('');
  const [newMaterial, setNewMaterial] = useState('');

  useEffect(() => {
    if (plan) {
      setFormData({ ...plan });
      if (plan.class_id && plan.subject_id) {
        onFetchChapters(plan.class_id, plan.subject_id);
      }
      if (plan.chapter_id) {
        onFetchTopics(plan.chapter_id);
      }
    } else {
      setFormData({
        plan_title: '',
        plan_date: new Date().toISOString().split('T')[0],
        class_id: '',
        section_id: '',
        subject_id: '',
        chapter_id: '',
        topic_id: '',
        template_id: '',
        period_number: '',
        duration_minutes: 40,
        learning_objectives: [],
        engage_activities: '',
        explore_activities: '',
        explain_activities: '',
        elaborate_activities: '',
        evaluate_activities: '',
        introduction: '',
        main_content: '',
        activities: '',
        assessment: '',
        closure: '',
        required_materials: [],
        differentiation_strategies: '',
        homework_assignment: '',
        status: 'draft'
      });
    }
    setActiveTab('basic');
  }, [plan, open]);

  const handleClassChange = (classId) => {
    setFormData(prev => ({ ...prev, class_id: classId, chapter_id: '', topic_id: '' }));
    if (classId && formData.subject_id) {
      onFetchChapters(classId, formData.subject_id);
    }
  };

  const handleSubjectChange = (subjectId) => {
    setFormData(prev => ({ ...prev, subject_id: subjectId, chapter_id: '', topic_id: '' }));
    if (formData.class_id && subjectId) {
      onFetchChapters(formData.class_id, subjectId);
    }
  };

  const handleChapterChange = (chapterId) => {
    setFormData(prev => ({ ...prev, chapter_id: chapterId, topic_id: '' }));
    if (chapterId) {
      onFetchTopics(chapterId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      setFormData(prev => ({
        ...prev,
        learning_objectives: [...(prev.learning_objectives || []), newObjective.trim()]
      }));
      setNewObjective('');
    }
  };

  const addMaterial = () => {
    if (newMaterial.trim()) {
      setFormData(prev => ({
        ...prev,
        required_materials: [...(prev.required_materials || []), newMaterial.trim()]
      }));
      setNewMaterial('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? 'Edit Lesson Plan' : 'Create Lesson Plan'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="5e">5E Model</TabsTrigger>
              <TabsTrigger value="standard">Standard</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>
            
            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label>Plan Title *</Label>
                <Input
                  value={formData.plan_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, plan_title: e.target.value }))}
                  placeholder="e.g., Introduction to Quadratic Equations"
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Plan Date *</Label>
                  <Input
                    type="date"
                    value={formData.plan_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, plan_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Period Number</Label>
                  <Input
                    type="number"
                    value={formData.period_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, period_number: parseInt(e.target.value) || '' }))}
                    placeholder="e.g., 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (mins)</Label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 40 }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select value={formData.class_id} onValueChange={handleClassChange}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select value={formData.subject_id} onValueChange={handleSubjectChange}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map(subj => (
                        <SelectItem key={subj.id} value={subj.id}>{subj.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Chapter</Label>
                  <Select value={formData.chapter_id || '__none__'} onValueChange={(v) => handleChapterChange(v === '__none__' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Select chapter" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No chapter</SelectItem>
                      {chapters.map(ch => (
                        <SelectItem key={ch.id} value={ch.id}>Ch {ch.chapter_number}: {ch.chapter_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Select value={formData.topic_id || '__none__'} onValueChange={(v) => setFormData(prev => ({ ...prev, topic_id: v === '__none__' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No topic</SelectItem>
                      {topics.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.topic_number}. {t.topic_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Learning Objectives */}
              <div className="space-y-2">
                <Label>Learning Objectives</Label>
                <div className="flex gap-2">
                  <Input
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    placeholder="Students will be able to..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                  />
                  <Button type="button" variant="outline" onClick={addObjective}>Add</Button>
                </div>
                {formData.learning_objectives?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {formData.learning_objectives.map((obj, i) => (
                      <div key={i} className="flex items-center gap-2 bg-muted p-2 rounded text-sm">
                        <Target className="h-3 w-3" />
                        <span className="flex-1">{obj}</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            learning_objectives: prev.learning_objectives.filter((_, idx) => idx !== i)
                          }))}
                          className="text-destructive"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* 5E Model Tab */}
            <TabsContent value="5e" className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                5E Instructional Model: Engage → Explore → Explain → Elaborate → Evaluate
              </p>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs">1</span>
                  Engage (Hook/Opening)
                </Label>
                <Textarea
                  value={formData.engage_activities}
                  onChange={(e) => setFormData(prev => ({ ...prev, engage_activities: e.target.value }))}
                  placeholder="How will you capture students' attention and activate prior knowledge?"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs">2</span>
                  Explore (Guided Discovery)
                </Label>
                <Textarea
                  value={formData.explore_activities}
                  onChange={(e) => setFormData(prev => ({ ...prev, explore_activities: e.target.value }))}
                  placeholder="What hands-on activities will students do to explore the concept?"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs">3</span>
                  Explain (Direct Instruction)
                </Label>
                <Textarea
                  value={formData.explain_activities}
                  onChange={(e) => setFormData(prev => ({ ...prev, explain_activities: e.target.value }))}
                  placeholder="How will you explain the concept and clarify misconceptions?"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">4</span>
                  Elaborate (Independent Practice)
                </Label>
                <Textarea
                  value={formData.elaborate_activities}
                  onChange={(e) => setFormData(prev => ({ ...prev, elaborate_activities: e.target.value }))}
                  placeholder="How will students extend and apply what they learned?"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">5</span>
                  Evaluate (Assessment)
                </Label>
                <Textarea
                  value={formData.evaluate_activities}
                  onChange={(e) => setFormData(prev => ({ ...prev, evaluate_activities: e.target.value }))}
                  placeholder="How will you assess student understanding?"
                  rows={2}
                />
              </div>
            </TabsContent>
            
            {/* Standard Tab */}
            <TabsContent value="standard" className="space-y-4">
              <div className="space-y-2">
                <Label>Introduction</Label>
                <Textarea
                  value={formData.introduction}
                  onChange={(e) => setFormData(prev => ({ ...prev, introduction: e.target.value }))}
                  placeholder="Opening activities, warm-up, review..."
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Main Content</Label>
                <Textarea
                  value={formData.main_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, main_content: e.target.value }))}
                  placeholder="Core teaching content and concepts..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Activities</Label>
                <Textarea
                  value={formData.activities}
                  onChange={(e) => setFormData(prev => ({ ...prev, activities: e.target.value }))}
                  placeholder="Student activities and exercises..."
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Assessment</Label>
                <Textarea
                  value={formData.assessment}
                  onChange={(e) => setFormData(prev => ({ ...prev, assessment: e.target.value }))}
                  placeholder="How will you check for understanding?"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Closure</Label>
                <Textarea
                  value={formData.closure}
                  onChange={(e) => setFormData(prev => ({ ...prev, closure: e.target.value }))}
                  placeholder="Summary, exit ticket, preview of next lesson..."
                  rows={2}
                />
              </div>
            </TabsContent>
            
            {/* Resources Tab */}
            <TabsContent value="resources" className="space-y-4">
              <div className="space-y-2">
                <Label>Required Materials</Label>
                <div className="flex gap-2">
                  <Input
                    value={newMaterial}
                    onChange={(e) => setNewMaterial(e.target.value)}
                    placeholder="e.g., Whiteboard, Markers, Worksheet"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                  />
                  <Button type="button" variant="outline" onClick={addMaterial}>Add</Button>
                </div>
                {formData.required_materials?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.required_materials.map((mat, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {mat}
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            required_materials: prev.required_materials.filter((_, idx) => idx !== i)
                          }))}
                        >×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Differentiation Strategies</Label>
                <Textarea
                  value={formData.differentiation_strategies}
                  onChange={(e) => setFormData(prev => ({ ...prev, differentiation_strategies: e.target.value }))}
                  placeholder="How will you accommodate different learning levels?"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Homework Assignment</Label>
                <Textarea
                  value={formData.homework_assignment}
                  onChange={(e) => setFormData(prev => ({ ...prev, homework_assignment: e.target.value }))}
                  placeholder="What will students do after class?"
                  rows={2}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Lesson Plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LessonPlans;
