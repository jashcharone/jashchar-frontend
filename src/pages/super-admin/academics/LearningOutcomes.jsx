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
import { Switch } from '@/components/ui/switch';
import { formatDate } from '@/utils/dateUtils';
import { motion } from 'framer-motion';
import {
  Target, Plus, Trash2, Edit2, Save, CheckCircle2, Circle,
  RefreshCw, Loader2, Search, GraduationCap, BookOpen,
  Award, Users, BarChart3, Lightbulb, Brain, Sparkles, 
  FileText, Filter
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
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const ACHIEVEMENT_LEVELS = [
  { value: 'not_started', label: 'Not Started', color: '#9CA3AF' },
  { value: 'beginning', label: 'Beginning', color: '#EF4444' },
  { value: 'developing', label: 'Developing', color: '#F59E0B' },
  { value: 'proficient', label: 'Proficient', color: '#10B981' },
  { value: 'advanced', label: 'Advanced', color: '#6366F1' }
];

const LearningOutcomes = () => {
  const { toast } = useToast();
  const { user, currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();
  
  const [activeTab, setActiveTab] = useState('outcomes');
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // Data
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  const [bloomLevels, setBloomLevels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Dialogs
  const [outcomeDialogOpen, setOutcomeDialogOpen] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState(null);
  
  const branchId = selectedBranch?.id;

  useEffect(() => {
    if (branchId) {
      fetchPrerequisites();
    }
  }, [branchId]);

  useEffect(() => {
    if (branchId && selectedClass && selectedSubject) {
      fetchOutcomes();
    }
  }, [branchId, selectedClass, selectedSubject, currentSessionId]);

  useEffect(() => {
    if (branchId) {
      fetchStats();
    }
  }, [branchId, currentSessionId]);

  const fetchPrerequisites = async () => {
    try {
      const [classesRes, subjectsRes, bloomRes, categoriesRes] = await Promise.all([
        api.get(`/academics/classes?branchId=${branchId}`),
        api.get(`/academics/subjects?branchId=${branchId}`),
        api.get(`/learning-outcomes/bloom-levels`),
        api.get(`/learning-outcomes/categories`)
      ]);
      
      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
      setBloomLevels(bloomRes.data || []);
      setCategories(categoriesRes.data || []);
      
      // Initialize bloom levels if empty
      if (!bloomRes.data || bloomRes.data.length === 0) {
        await api.post('/learning-outcomes/bloom-levels/initialize');
        const { data } = await api.get(`/learning-outcomes/bloom-levels`);
        setBloomLevels(data || []);
      }
    } catch (error) {
      console.error('Error fetching prerequisites:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOutcomes = async () => {
    try {
      const params = new URLSearchParams({
        branchId,
        sessionId: currentSessionId,
        classId: selectedClass,
        subjectId: selectedSubject
      });
      const { data } = await api.get(`/learning-outcomes/outcomes?${params}`);
      setOutcomes(data || []);
    } catch (error) {
      console.error('Error fetching outcomes:', error);
      toast({ title: 'Error', description: 'Failed to load outcomes', variant: 'destructive' });
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
      const { data } = await api.get(`/learning-outcomes/stats?${params}`);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSaveOutcome = async (outcomeData) => {
    try {
      await api.post('/learning-outcomes/outcomes', {
        ...outcomeData,
        id: editingOutcome?.id,
        branch_id: branchId,
        session_id: currentSessionId,
        organization_id: selectedBranch?.organization_id,
        class_id: selectedClass,
        subject_id: selectedSubject
      });
      toast({ title: 'Success', description: 'Learning outcome saved successfully' });
      setOutcomeDialogOpen(false);
      setEditingOutcome(null);
      fetchOutcomes();
      fetchStats();
    } catch (error) {
      console.error('Error saving outcome:', error);
      toast({ title: 'Error', description: 'Failed to save outcome', variant: 'destructive' });
    }
  };

  const handleDeleteOutcome = async (outcomeId) => {
    try {
      await api.delete(`/learning-outcomes/outcomes/${outcomeId}?branchId=${branchId}`);
      toast({ title: 'Success', description: 'Outcome deleted successfully' });
      fetchOutcomes();
      fetchStats();
    } catch (error) {
      console.error('Error deleting outcome:', error);
      toast({ title: 'Error', description: 'Failed to delete outcome', variant: 'destructive' });
    }
  };

  // Prepare chart data
  const achievementChartData = stats?.achievementDistribution 
    ? Object.entries(stats.achievementDistribution).map(([key, value]) => ({
        name: ACHIEVEMENT_LEVELS.find(l => l.value === key)?.label || key,
        value,
        fill: ACHIEVEMENT_LEVELS.find(l => l.value === key)?.color || '#9CA3AF'
      }))
    : [];

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
              <Target className="h-8 w-8 text-primary" />
              Learning Outcomes
            </h1>
            <p className="text-muted-foreground mt-1">
              Define and track competencies with Bloom's taxonomy classification
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="outcomes" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Outcomes
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="bloom" className="gap-2">
              <Brain className="h-4 w-4" />
              Bloom's Levels
            </TabsTrigger>
          </TabsList>

          {/* Outcomes Tab */}
          <TabsContent value="outcomes">
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
                        onClick={() => { setEditingOutcome(null); setOutcomeDialogOpen(true); }}
                        disabled={!selectedClass || !selectedSubject}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Outcome
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-100">
                        <Target className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Outcomes</p>
                        <h3 className="text-2xl font-bold">{stats?.totalOutcomes || 0}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-green-100">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Assessments Done</p>
                        <h3 className="text-2xl font-bold">{stats?.totalAssessments || 0}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-purple-100">
                        <Award className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Proficient+</p>
                        <h3 className="text-2xl font-bold">
                          {(stats?.achievementDistribution?.proficient || 0) + (stats?.achievementDistribution?.advanced || 0)}
                        </h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-orange-100">
                        <Lightbulb className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bloom Levels</p>
                        <h3 className="text-2xl font-bold">{bloomLevels.length}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Outcomes List */}
              {selectedClass && selectedSubject ? (
                <div className="space-y-3">
                  {outcomes.length > 0 ? (
                    outcomes.map((outcome, index) => (
                      <motion.div
                        key={outcome.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {outcome.outcome_code && (
                                    <Badge variant="outline">{outcome.outcome_code}</Badge>
                                  )}
                                  {outcome.bloom_level && (
                                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                      L{outcome.bloom_level.level_number}: {outcome.bloom_level.level_name}
                                    </Badge>
                                  )}
                                  {outcome.is_mandatory && (
                                    <Badge variant="secondary">Mandatory</Badge>
                                  )}
                                  {outcome.is_exam_relevant && (
                                    <Badge variant="secondary">Exam</Badge>
                                  )}
                                </div>
                                <h3 className="font-medium text-lg">{outcome.outcome_name}</h3>
                                {outcome.outcome_description && (
                                  <p className="text-sm text-muted-foreground mt-1">{outcome.outcome_description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  {outcome.category && <span>{outcome.category.category_name}</span>}
                                  {outcome.expected_hours && <span>{outcome.expected_hours} hrs expected</span>}
                                  {outcome.weightage_percentage > 0 && <span>{outcome.weightage_percentage}% weightage</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => { setEditingOutcome(outcome); setOutcomeDialogOpen(true); }}
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
                                      <AlertDialogTitle>Delete Learning Outcome?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete this learning outcome and all related assessments.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteOutcome(outcome.id)}>
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
                        <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">
                          No learning outcomes found for this class and subject.
                        </p>
                        <Button
                          onClick={() => { setEditingOutcome(null); setOutcomeDialogOpen(true); }}
                          className="mt-4 gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add First Outcome
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
                      Select a class and subject to manage learning outcomes
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Achievement Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Achievement Distribution</CardTitle>
                  <CardDescription>Student performance across all outcomes</CardDescription>
                </CardHeader>
                <CardContent>
                  {achievementChartData.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={achievementChartData.filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {achievementChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No assessment data available yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Achievement Levels Legend */}
              <Card>
                <CardHeader>
                  <CardTitle>Achievement Levels</CardTitle>
                  <CardDescription>Understanding the proficiency scale</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ACHIEVEMENT_LEVELS.map(level => (
                      <div key={level.value} className="flex items-center gap-4">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: level.color }}
                        />
                        <div>
                          <p className="font-medium">{level.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {level.value === 'not_started' && 'Outcome not yet attempted'}
                            {level.value === 'beginning' && 'Shows limited understanding'}
                            {level.value === 'developing' && 'Demonstrates partial understanding'}
                            {level.value === 'proficient' && 'Meets expected standards'}
                            {level.value === 'advanced' && 'Exceeds expectations'}
                          </p>
                        </div>
                        <div className="ml-auto">
                          <Badge variant="outline">
                            {stats?.achievementDistribution?.[level.value] || 0}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bloom's Taxonomy Tab */}
          <TabsContent value="bloom">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Bloom's Taxonomy Levels
                </CardTitle>
                <CardDescription>
                  Cognitive domains for classifying learning outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {bloomLevels.map((level, index) => (
                    <Card key={level.id} className="border-l-4" style={{ borderLeftColor: ['#EF4444', '#F59E0B', '#10B981', '#0EA5E9', '#8B5CF6', '#EC4899'][index % 6] }}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="text-lg px-3">L{level.level_number}</Badge>
                          <h3 className="font-semibold">{level.level_name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{level.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {level.action_verbs?.slice(0, 5).map((verb, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {verb}
                            </Badge>
                          ))}
                          {level.action_verbs?.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{level.action_verbs.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Outcome Dialog */}
        <OutcomeDialog
          open={outcomeDialogOpen}
          onOpenChange={setOutcomeDialogOpen}
          outcome={editingOutcome}
          bloomLevels={bloomLevels}
          categories={categories}
          onSave={handleSaveOutcome}
        />
      </div>
    </DashboardLayout>
  );
};

// Outcome Dialog Component
const OutcomeDialog = ({ open, onOpenChange, outcome, bloomLevels, categories, onSave }) => {
  const [formData, setFormData] = useState({
    outcome_code: '',
    outcome_name: '',
    outcome_description: '',
    bloom_level_id: '',
    category_id: '',
    weightage_percentage: 0,
    minimum_passing_criteria: 60,
    is_mandatory: false,
    is_exam_relevant: true,
    expected_hours: 1
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (outcome) {
      setFormData({ ...outcome });
    } else {
      setFormData({
        outcome_code: '',
        outcome_name: '',
        outcome_description: '',
        bloom_level_id: '',
        category_id: '',
        weightage_percentage: 0,
        minimum_passing_criteria: 60,
        is_mandatory: false,
        is_exam_relevant: true,
        expected_hours: 1
      });
    }
  }, [outcome, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{outcome ? 'Edit Learning Outcome' : 'Add Learning Outcome'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Outcome Code</Label>
              <Input
                value={formData.outcome_code}
                onChange={(e) => setFormData(prev => ({ ...prev, outcome_code: e.target.value }))}
                placeholder="e.g., LO-MAT-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Expected Hours</Label>
              <Input
                type="number"
                step="0.5"
                value={formData.expected_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, expected_hours: parseFloat(e.target.value) || 1 }))}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Outcome Name *</Label>
            <Textarea
              value={formData.outcome_name}
              onChange={(e) => setFormData(prev => ({ ...prev, outcome_name: e.target.value }))}
              placeholder="e.g., Students will be able to solve linear equations in one variable"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.outcome_description}
              onChange={(e) => setFormData(prev => ({ ...prev, outcome_description: e.target.value }))}
              placeholder="Detailed description of the learning outcome..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bloom's Level</Label>
              <Select
                value={formData.bloom_level_id || ''}
                onValueChange={(v) => setFormData(prev => ({ ...prev, bloom_level_id: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  {bloomLevels.map(level => (
                    <SelectItem key={level.id} value={level.id}>
                      L{level.level_number}: {level.level_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category_id || ''}
                onValueChange={(v) => setFormData(prev => ({ ...prev, category_id: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.category_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Weightage %</Label>
              <Input
                type="number"
                value={formData.weightage_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, weightage_percentage: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Min Passing %</Label>
              <Input
                type="number"
                value={formData.minimum_passing_criteria}
                onChange={(e) => setFormData(prev => ({ ...prev, minimum_passing_criteria: parseFloat(e.target.value) || 60 }))}
              />
            </div>
          </div>
          
          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_mandatory}
                onCheckedChange={(c) => setFormData(prev => ({ ...prev, is_mandatory: c }))}
              />
              <Label>Mandatory</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_exam_relevant}
                onCheckedChange={(c) => setFormData(prev => ({ ...prev, is_exam_relevant: c }))}
              />
              <Label>Exam Relevant</Label>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Outcome
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LearningOutcomes;
