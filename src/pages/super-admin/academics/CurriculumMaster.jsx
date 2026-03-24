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
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { formatDate } from '@/utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, Trash2, Edit2, Save, CheckCircle2, Circle, 
  ChevronDown, ChevronRight, RefreshCw, Loader2, Search,
  GraduationCap, Target, Clock, Award, BookMarked, Layers,
  FileText, ArrowRight, Wand2, BarChart3
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'hard', label: 'Hard', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
];

const CurriculumMaster = () => {
  const { toast } = useToast();
  const { user, currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // Data
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [stats, setStats] = useState(null);
  const [subjectProgress, setSubjectProgress] = useState([]);
  
  // Dialogs
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [editingTopic, setEditingTopic] = useState(null);
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  
  // Expanded chapters
  const [expandedChapters, setExpandedChapters] = useState({});

  const branchId = selectedBranch?.id;

  // Fetch prerequisites
  useEffect(() => {
    if (branchId) {
      fetchPrerequisites();
    }
  }, [branchId]);

  // Fetch chapters when filters change
  useEffect(() => {
    if (branchId && selectedClass && selectedSubject) {
      fetchChapters();
    }
    // Always fetch stats (aggregates when no class/subject selected)
    if (branchId) {
      fetchStats();
    }
  }, [branchId, selectedClass, selectedSubject, currentSessionId]);

  // Fetch subject progress for overview
  useEffect(() => {
    if (branchId) {
      fetchSubjectProgress();
      fetchStats();
    }
  }, [branchId, currentSessionId]);

  const fetchPrerequisites = async () => {
    try {
      const [classesRes, subjectsRes] = await Promise.all([
        api.get(`/academics/classes?branchId=${branchId}`),
        api.get(`/academics/subjects?branchId=${branchId}`)
      ]);
      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (error) {
      console.error('Error fetching prerequisites:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async () => {
    try {
      const response = await api.get(`/curriculum/chapters?branchId=${branchId}&classId=${selectedClass}&subjectId=${selectedSubject}&sessionId=${currentSessionId}`);
      setChapters(response.data || []);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      toast({ title: 'Error', description: 'Failed to load chapters', variant: 'destructive' });
    }
  };

  const fetchTopics = async (chapterId) => {
    try {
      const response = await api.get(`/curriculum/topics?branchId=${branchId}&chapterId=${chapterId}`);
      setTopics(prev => ({ ...prev, [chapterId]: response.data || [] }));
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams({
        branchId,
        sessionId: currentSessionId,
        ...(selectedClass && { classId: selectedClass }),
        ...(selectedSubject && { subjectId: selectedSubject })
      });
      const response = await api.get(`/curriculum/stats?${params}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSubjectProgress = async () => {
    try {
      const response = await api.get(`/curriculum/subject-progress?branchId=${branchId}&sessionId=${currentSessionId}`);
      setSubjectProgress(response.data || []);
    } catch (error) {
      console.error('Error fetching subject progress:', error);
    }
  };

  // Toggle chapter expansion
  const toggleChapter = (chapterId) => {
    setExpandedChapters(prev => {
      const newState = { ...prev, [chapterId]: !prev[chapterId] };
      if (newState[chapterId] && !topics[chapterId]) {
        fetchTopics(chapterId);
      }
      return newState;
    });
  };

  // Save Chapter
  const handleSaveChapter = async (chapterData) => {
    try {
      await api.post('/curriculum/chapters', {
        ...chapterData,
        id: editingChapter?.id,
        branch_id: branchId,
        session_id: currentSessionId,
        organization_id: selectedBranch?.organization_id,
        class_id: selectedClass,
        subject_id: selectedSubject
      });
      toast({ title: 'Success', description: 'Chapter saved successfully' });
      setChapterDialogOpen(false);
      setEditingChapter(null);
      fetchChapters();
      fetchStats();
    } catch (error) {
      console.error('Error saving chapter:', error);
      toast({ title: 'Error', description: 'Failed to save chapter', variant: 'destructive' });
    }
  };

  // Delete Chapter
  const handleDeleteChapter = async (chapterId) => {
    try {
      await api.delete(`/curriculum/chapters/${chapterId}?branchId=${branchId}`);
      toast({ title: 'Success', description: 'Chapter deleted successfully' });
      fetchChapters();
      fetchStats();
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast({ title: 'Error', description: 'Failed to delete chapter', variant: 'destructive' });
    }
  };

  // Mark Chapter Complete
  const handleMarkChapterComplete = async (chapterId, isCompleted) => {
    try {
      await api.post(`/curriculum/chapters/${chapterId}/complete`, {
        branch_id: branchId,
        is_completed: isCompleted
      });
      toast({ title: 'Success', description: isCompleted ? 'Chapter marked as complete' : 'Chapter marked as incomplete' });
      fetchChapters();
      fetchStats();
    } catch (error) {
      console.error('Error updating chapter:', error);
      toast({ title: 'Error', description: 'Failed to update chapter', variant: 'destructive' });
    }
  };

  // Save Topic
  const handleSaveTopic = async (topicData) => {
    try {
      await api.post('/curriculum/topics', {
        ...topicData,
        id: editingTopic?.id,
        branch_id: branchId,
        session_id: currentSessionId,
        organization_id: selectedBranch?.organization_id,
        chapter_id: selectedChapterId
      });
      toast({ title: 'Success', description: 'Topic saved successfully' });
      setTopicDialogOpen(false);
      setEditingTopic(null);
      fetchTopics(selectedChapterId);
      fetchChapters(); // Refresh to update completion percentage
      fetchStats();
    } catch (error) {
      console.error('Error saving topic:', error);
      toast({ title: 'Error', description: 'Failed to save topic', variant: 'destructive' });
    }
  };

  // Delete Topic
  const handleDeleteTopic = async (topicId, chapterId) => {
    try {
      await api.delete(`/curriculum/topics/${topicId}?branchId=${branchId}`);
      toast({ title: 'Success', description: 'Topic deleted successfully' });
      fetchTopics(chapterId);
      fetchChapters();
      fetchStats();
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast({ title: 'Error', description: 'Failed to delete topic', variant: 'destructive' });
    }
  };

  // Mark Topic Complete
  const handleMarkTopicComplete = async (topicId, chapterId, isCompleted) => {
    try {
      await api.post(`/curriculum/topics/${topicId}/complete`, {
        branch_id: branchId,
        is_completed: isCompleted
      });
      toast({ title: 'Success', description: isCompleted ? 'Topic completed' : 'Topic marked as incomplete' });
      fetchTopics(chapterId);
      fetchChapters();
      fetchStats();
    } catch (error) {
      console.error('Error updating topic:', error);
      toast({ title: 'Error', description: 'Failed to update topic', variant: 'destructive' });
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
              <BookOpen className="h-8 w-8 text-primary" />
              Curriculum Master
            </h1>
            <p className="text-muted-foreground mt-1">
              Design and manage subject curriculum with chapters, topics, and learning objectives
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="curriculum" className="gap-2">
              <Layers className="h-4 w-4" />
              Curriculum
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2">
              <Target className="h-4 w-4" />
              Progress
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid gap-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/40">
                        <BookMarked className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Chapters</p>
                        <h3 className="text-2xl font-bold">{stats?.totalChapters || 0}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/40">
                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Completed</p>
                        <h3 className="text-2xl font-bold">{stats?.completedChapters || 0}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/40">
                        <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Topics</p>
                        <h3 className="text-2xl font-bold">{stats?.totalTopics || 0}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/40">
                        <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Periods Used</p>
                        <h3 className="text-2xl font-bold">{stats?.totalActualPeriods || 0}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Subject-wise Progress Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Subject-wise Progress</CardTitle>
                  <CardDescription>Curriculum completion across all subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  {subjectProgress.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={subjectProgress}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                        <XAxis dataKey="subject_name" fontSize={12} tick={{ fill: 'currentColor', opacity: 0.7 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: 'currentColor', opacity: 0.7 }} />
                        <Tooltip 
                          formatter={(value) => `${value}%`}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                        />
                        <Bar dataKey="progress_percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Progress %" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No curriculum data available. Add chapters and topics to see progress.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Curriculum Tab */}
          <TabsContent value="curriculum">
            <div className="grid gap-6">
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Select Class *</Label>
                      <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map(cls => (
                            <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Select Subject *</Label>
                      <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map(subj => (
                            <SelectItem key={subj.id} value={subj.id}>{subj.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={() => { setEditingChapter(null); setChapterDialogOpen(true); }}
                        disabled={!selectedClass || !selectedSubject}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Chapter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chapters List */}
              {selectedClass && selectedSubject ? (
                <div className="space-y-4">
                  {chapters.length > 0 ? (
                    chapters.map((chapter, index) => (
                      <motion.div
                        key={chapter.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={chapter.is_completed ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30' : ''}>
                          <Collapsible
                            open={expandedChapters[chapter.id]}
                            onOpenChange={() => toggleChapter(chapter.id)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="p-1">
                                      {expandedChapters[chapter.id] ? (
                                        <ChevronDown className="h-5 w-5" />
                                      ) : (
                                        <ChevronRight className="h-5 w-5" />
                                      )}
                                    </Button>
                                  </CollapsibleTrigger>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">Ch {chapter.chapter_number}</Badge>
                                      <CardTitle className="text-lg">{chapter.chapter_name}</CardTitle>
                                      {chapter.is_completed && (
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                      <span>{chapter.topics_count || 0} Topics</span>
                                      <span>{chapter.estimated_periods} Periods</span>
                                      <Badge className={DIFFICULTY_LEVELS.find(d => d.value === chapter.difficulty_level)?.color}>
                                        {chapter.difficulty_level}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-right mr-4">
                                    <p className="text-sm font-medium">{chapter.calculated_completion || 0}%</p>
                                    <Progress value={chapter.calculated_completion || 0} className="w-24 h-2" />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setEditingChapter(chapter); setChapterDialogOpen(true); }}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkChapterComplete(chapter.id, !chapter.is_completed)}
                                  >
                                    {chapter.is_completed ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <Circle className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Chapter?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete "{chapter.chapter_name}" and all its topics.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteChapter(chapter.id)}>
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </CardHeader>

                            <CollapsibleContent>
                              <CardContent className="pt-0">
                                <div className="ml-8 space-y-2">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-sm">Topics</h4>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedChapterId(chapter.id);
                                        setEditingTopic(null);
                                        setTopicDialogOpen(true);
                                      }}
                                      className="gap-1"
                                    >
                                      <Plus className="h-3 w-3" />
                                      Add Topic
                                    </Button>
                                  </div>

                                  {topics[chapter.id]?.length > 0 ? (
                                    <div className="space-y-2">
                                      {topics[chapter.id].map((topic, tIndex) => (
                                        <div
                                          key={topic.id}
                                          className={`flex items-center justify-between p-3 rounded-lg border ${
                                            topic.is_completed ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' : 'bg-background'
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <button
                                              onClick={() => handleMarkTopicComplete(topic.id, chapter.id, !topic.is_completed)}
                                              className="flex-shrink-0"
                                            >
                                              {topic.is_completed ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                              ) : (
                                                <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                                              )}
                                            </button>
                                            <div>
                                              <p className={`font-medium ${topic.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                                                {topic.topic_number}. {topic.topic_name}
                                              </p>
                                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                {topic.estimated_periods} period(s)
                                                {topic.is_important && <Badge variant="secondary" className="ml-2 text-xs">Important</Badge>}
                                                {topic.is_exam_focused && <Badge variant="secondary" className="ml-1 text-xs">Exam</Badge>}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                setSelectedChapterId(chapter.id);
                                                setEditingTopic(topic);
                                                setTopicDialogOpen(true);
                                              }}
                                            >
                                              <Edit2 className="h-3 w-3" />
                                            </Button>
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="text-destructive">
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle>Delete Topic?</AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                    This will permanently delete this topic.
                                                  </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                  <AlertDialogAction onClick={() => handleDeleteTopic(topic.id, chapter.id)}>
                                                    Delete
                                                  </AlertDialogAction>
                                                </AlertDialogFooter>
                                              </AlertDialogContent>
                                            </AlertDialog>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 text-sm text-muted-foreground bg-muted/50 rounded-lg">
                                      No topics added yet. Click "Add Topic" to start.
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">
                          No chapters found for this class and subject.
                        </p>
                        <Button
                          onClick={() => { setEditingChapter(null); setChapterDialogOpen(true); }}
                          className="mt-4 gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add First Chapter
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      Select a class and subject to manage curriculum
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Syllabus Progress Overview</CardTitle>
                <CardDescription>Track curriculum completion across all subjects</CardDescription>
              </CardHeader>
              <CardContent>
                {subjectProgress.length > 0 ? (
                  <div className="space-y-4">
                    {subjectProgress.map((subject, index) => (
                      <div key={subject.subject_id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{subject.subject_name}</span>
                          <span className="text-sm text-muted-foreground">
                            {subject.completed_chapters}/{subject.total_chapters} chapters ({subject.progress_percentage}%)
                          </span>
                        </div>
                        <Progress value={subject.progress_percentage} className="h-3" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No curriculum data yet. Start by adding chapters and topics.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Chapter Dialog */}
        <ChapterDialog
          open={chapterDialogOpen}
          onOpenChange={setChapterDialogOpen}
          chapter={editingChapter}
          chaptersCount={chapters.length}
          onSave={handleSaveChapter}
        />

        {/* Topic Dialog */}
        <TopicDialog
          open={topicDialogOpen}
          onOpenChange={setTopicDialogOpen}
          topic={editingTopic}
          topicsCount={topics[selectedChapterId]?.length || 0}
          onSave={handleSaveTopic}
        />
      </div>
    </DashboardLayout>
  );
};

// Chapter Dialog Component
const ChapterDialog = ({ open, onOpenChange, chapter, chaptersCount, onSave }) => {
  const [formData, setFormData] = useState({
    chapter_number: 1,
    chapter_name: '',
    chapter_description: '',
    estimated_periods: 10,
    weightage_percentage: 0,
    difficulty_level: 'medium',
    is_practical: false,
    has_lab_component: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (chapter) {
      setFormData({ ...chapter });
    } else {
      setFormData({
        chapter_number: chaptersCount + 1,
        chapter_name: '',
        chapter_description: '',
        estimated_periods: 10,
        weightage_percentage: 0,
        difficulty_level: 'medium',
        is_practical: false,
        has_lab_component: false
      });
    }
  }, [chapter, open, chaptersCount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{chapter ? 'Edit Chapter' : 'Add New Chapter'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Chapter Number *</Label>
              <Input
                type="number"
                value={formData.chapter_number}
                onChange={(e) => setFormData(prev => ({ ...prev, chapter_number: parseInt(e.target.value) || 1 }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Estimated Periods</Label>
              <Input
                type="number"
                value={formData.estimated_periods}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_periods: parseInt(e.target.value) || 10 }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Chapter Name *</Label>
            <Input
              value={formData.chapter_name}
              onChange={(e) => setFormData(prev => ({ ...prev, chapter_name: e.target.value }))}
              placeholder="e.g., Introduction to Algebra"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.chapter_description}
              onChange={(e) => setFormData(prev => ({ ...prev, chapter_description: e.target.value }))}
              placeholder="Brief description of the chapter..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Difficulty Level</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(v) => setFormData(prev => ({ ...prev, difficulty_level: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Weightage %</Label>
              <Input
                type="number"
                value={formData.weightage_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, weightage_percentage: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_practical}
                onCheckedChange={(c) => setFormData(prev => ({ ...prev, is_practical: c }))}
              />
              <Label>Practical Chapter</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.has_lab_component}
                onCheckedChange={(c) => setFormData(prev => ({ ...prev, has_lab_component: c }))}
              />
              <Label>Has Lab Component</Label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Chapter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Topic Dialog Component
const TopicDialog = ({ open, onOpenChange, topic, topicsCount, onSave }) => {
  const [formData, setFormData] = useState({
    topic_number: 1,
    topic_name: '',
    topic_description: '',
    estimated_periods: 1,
    textbook_reference: '',
    is_important: false,
    is_exam_focused: false,
    learning_objectives: [],
    key_concepts: []
  });
  const [saving, setSaving] = useState(false);
  const [newObjective, setNewObjective] = useState('');
  const [newConcept, setNewConcept] = useState('');

  useEffect(() => {
    if (topic) {
      setFormData({ ...topic });
    } else {
      setFormData({
        topic_number: topicsCount + 1,
        topic_name: '',
        topic_description: '',
        estimated_periods: 1,
        textbook_reference: '',
        is_important: false,
        is_exam_focused: false,
        learning_objectives: [],
        key_concepts: []
      });
    }
  }, [topic, open, topicsCount]);

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

  const addConcept = () => {
    if (newConcept.trim()) {
      setFormData(prev => ({
        ...prev,
        key_concepts: [...(prev.key_concepts || []), newConcept.trim()]
      }));
      setNewConcept('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{topic ? 'Edit Topic' : 'Add New Topic'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Topic Number *</Label>
              <Input
                type="number"
                value={formData.topic_number}
                onChange={(e) => setFormData(prev => ({ ...prev, topic_number: parseInt(e.target.value) || 1 }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Estimated Periods</Label>
              <Input
                type="number"
                step="0.5"
                value={formData.estimated_periods}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_periods: parseFloat(e.target.value) || 1 }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Topic Name *</Label>
            <Input
              value={formData.topic_name}
              onChange={(e) => setFormData(prev => ({ ...prev, topic_name: e.target.value }))}
              placeholder="e.g., Linear Equations in One Variable"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.topic_description}
              onChange={(e) => setFormData(prev => ({ ...prev, topic_description: e.target.value }))}
              placeholder="Brief description..."
            />
          </div>
          <div className="space-y-2">
            <Label>Textbook Reference</Label>
            <Input
              value={formData.textbook_reference}
              onChange={(e) => setFormData(prev => ({ ...prev, textbook_reference: e.target.value }))}
              placeholder="e.g., Pages 45-52"
            />
          </div>
          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_important}
                onCheckedChange={(c) => setFormData(prev => ({ ...prev, is_important: c }))}
              />
              <Label>Important Topic</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_exam_focused}
                onCheckedChange={(c) => setFormData(prev => ({ ...prev, is_exam_focused: c }))}
              />
              <Label>Exam Focused</Label>
            </div>
          </div>

          {/* Learning Objectives */}
          <div className="space-y-2">
            <Label>Learning Objectives</Label>
            <div className="flex gap-2">
              <Input
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                placeholder="Add learning objective..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
              />
              <Button type="button" variant="outline" onClick={addObjective}>Add</Button>
            </div>
            {formData.learning_objectives?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.learning_objectives.map((obj, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {obj}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        learning_objectives: prev.learning_objectives.filter((_, idx) => idx !== i)
                      }))}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Key Concepts */}
          <div className="space-y-2">
            <Label>Key Concepts</Label>
            <div className="flex gap-2">
              <Input
                value={newConcept}
                onChange={(e) => setNewConcept(e.target.value)}
                placeholder="Add key concept..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addConcept())}
              />
              <Button type="button" variant="outline" onClick={addConcept}>Add</Button>
            </div>
            {formData.key_concepts?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.key_concepts.map((concept, i) => (
                  <Badge key={i} variant="outline" className="gap-1">
                    {concept}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        key_concepts: prev.key_concepts.filter((_, idx) => idx !== i)
                      }))}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Topic
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CurriculumMaster;
