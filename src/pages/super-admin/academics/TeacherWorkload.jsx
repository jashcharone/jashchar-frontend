import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/utils/dateUtils';
import { motion } from 'framer-motion';
import {
  Users, Plus, Trash2, Edit2, Save, RefreshCw, Loader2,
  BarChart3, Calendar as CalendarIcon, Clock, Settings,
  UserCheck, UserX, AlertTriangle, CheckCircle2, ArrowRightLeft,
  Briefcase
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

const STATUS_COLORS = {
  optimal: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  underloaded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  overloaded: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
};

const getTeacherName = (t) => t?.full_name || [t?.first_name, t?.last_name].filter(Boolean).join(' ') || 'Unknown';
const getDesignation = (t) => (typeof t?.designation === 'object' ? t?.designation?.name : t?.designation) || '-';

const TeacherWorkload = () => {
  const { toast } = useToast();
  const { user, currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Data
  const [teachers, setTeachers] = useState([]);
  const [workloadSummary, setWorkloadSummary] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [duties, setDuties] = useState([]);
  const [substitutions, setSubstitutions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // Dialogs
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [dutyDialogOpen, setDutyDialogOpen] = useState(false);
  const [substitutionDialogOpen, setSubstitutionDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  
  const branchId = selectedBranch?.id;

  useEffect(() => {
    if (branchId && currentSessionId) {
      fetchData();
    }
  }, [branchId, currentSessionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, statsRes, settingsRes, classesRes, subjectsRes, teachersRes] = await Promise.all([
        api.get(`/teacher-workload/summary?branchId=${branchId}&sessionId=${currentSessionId}`),
        api.get(`/teacher-workload/stats?branchId=${branchId}&sessionId=${currentSessionId}`),
        api.get(`/teacher-workload/settings?branchId=${branchId}&sessionId=${currentSessionId}`),
        api.get(`/academics/classes?branchId=${branchId}`),
        api.get(`/academics/subjects?branchId=${branchId}`),
        api.get(`/staff?branchId=${branchId}&isTeachingStaff=true`)
      ]);
      setWorkloadSummary(summaryRes.data || []);
      setStats(statsRes.data);
      setSettings(settingsRes.data);
      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
      setTeachers(teachersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to load workload data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllocations = async (teacherId = null) => {
    try {
      const params = new URLSearchParams({
        branchId,
        sessionId: currentSessionId,
        ...(teacherId && { teacherId })
      });
      const { data } = await api.get(`/teacher-workload/allocations?${params}`);
      setAllocations(data || []);
    } catch (error) {
      console.error('Error fetching allocations:', error);
    }
  };

  const fetchDuties = async (teacherId = null) => {
    try {
      const params = new URLSearchParams({
        branchId,
        sessionId: currentSessionId,
        ...(teacherId && { teacherId })
      });
      const { data } = await api.get(`/teacher-workload/duties?${params}`);
      setDuties(data || []);
    } catch (error) {
      console.error('Error fetching duties:', error);
    }
  };

  const fetchSubstitutions = async () => {
    try {
      const { data } = await api.get(`/teacher-workload/substitutions?branchId=${branchId}&sessionId=${currentSessionId}`);
      setSubstitutions(data || []);
    } catch (error) {
      console.error('Error fetching substitutions:', error);
    }
  };

  const handleSaveSettings = async (settingsData) => {
    try {
      await api.post('/teacher-workload/settings', {
        ...settingsData,
        branchId,
        sessionId: currentSessionId
      });
      toast({ title: 'Success', description: 'Settings saved' });
      setSettingsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    }
  };

  const handleSaveAllocation = async (allocation) => {
    try {
      await api.post('/teacher-workload/allocations', {
        ...allocation,
        branchId,
        sessionId: currentSessionId
      });
      toast({ title: 'Success', description: 'Allocation saved' });
      setAllocationDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving allocation:', error);
      toast({ title: 'Error', description: 'Failed to save allocation', variant: 'destructive' });
    }
  };

  const handleSaveDuty = async (duty) => {
    try {
      await api.post('/teacher-workload/duties', {
        ...duty,
        branchId,
        sessionId: currentSessionId
      });
      toast({ title: 'Success', description: 'Duty assigned' });
      setDutyDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving duty:', error);
      toast({ title: 'Error', description: 'Failed to assign duty', variant: 'destructive' });
    }
  };

  const handleCreateSubstitution = async (substitution) => {
    try {
      await api.post('/teacher-workload/substitutions', {
        ...substitution,
        branchId,
        sessionId: currentSessionId
      });
      toast({ title: 'Success', description: 'Substitution created' });
      setSubstitutionDialogOpen(false);
      fetchSubstitutions();
    } catch (error) {
      console.error('Error creating substitution:', error);
      toast({ title: 'Error', description: 'Failed to create substitution', variant: 'destructive' });
    }
  };

  const handleDeleteAllocation = async (id) => {
    try {
      await api.delete(`/teacher-workload/allocations/${id}?branchId=${branchId}`);
      toast({ title: 'Success', description: 'Allocation removed' });
      fetchData();
    } catch (error) {
      console.error('Error deleting allocation:', error);
      toast({ title: 'Error', description: 'Failed to delete allocation', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-64" />
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
              <Users className="h-8 w-8 text-primary" />
              Teacher Workload Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage teaching allocations, duties, and substitutions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSettingsDialogOpen(true)} className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button onClick={() => setAllocationDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Allocation
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Teachers</p>
                  <h3 className="text-xl font-bold">{stats?.total_teachers || 0}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Optimal Load</p>
                  <h3 className="text-xl font-bold">{stats?.optimal_count || 0}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Underloaded</p>
                  <h3 className="text-xl font-bold">{stats?.underloaded_count || 0}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Overloaded</p>
                  <h3 className="text-xl font-bold">{stats?.overloaded_count || 0}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Load/Week</p>
                  <h3 className="text-xl font-bold">{stats?.average_workload || 0}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="allocations">Allocations</TabsTrigger>
            <TabsTrigger value="duties">Additional Duties</TabsTrigger>
            <TabsTrigger value="substitutions">Substitutions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Workload Summary</CardTitle>
                <CardDescription>
                  Weekly workload distribution ({settings?.min_periods_per_week || 18}-{settings?.max_periods_per_week || 30} periods/week is ideal)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead className="text-center">Teaching</TableHead>
                      <TableHead className="text-center">Duties</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Classes</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Workload</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workloadSummary.length > 0 ? workloadSummary.map((teacher, idx) => (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">
                          {getTeacherName(teacher)}
                          {teacher.is_class_teacher && (
                            <Badge variant="outline" className="ml-2 text-xs">CT</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {getDesignation(teacher)}
                        </TableCell>
                        <TableCell className="text-center">{teacher.teaching_periods}</TableCell>
                        <TableCell className="text-center">{teacher.duty_periods}</TableCell>
                        <TableCell className="text-center font-semibold">{teacher.total_periods}</TableCell>
                        <TableCell className="text-center">{teacher.class_count}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={STATUS_COLORS[teacher.status]}>
                            {teacher.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-32">
                          <Progress
                            value={(teacher.total_periods / (teacher.max_periods || 30)) * 100}
                            className={`h-2 ${teacher.status === 'overloaded' ? 'bg-red-200' : teacher.status === 'underloaded' ? 'bg-yellow-200' : 'bg-green-200'}`}
                          />
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No workload data available. Start by adding allocations.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Allocations Tab */}
          <TabsContent value="allocations" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Subject-Class Allocations</h3>
              <Button onClick={() => { setSelectedTeacher(null); setAllocationDialogOpen(true); }} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Allocation
              </Button>
            </div>
            <Card>
              <CardContent className="pt-4">
                {workloadSummary.map((teacher) => (
                  <div key={teacher.id} className="border-b last:border-0 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getTeacherName(teacher)}</span>
                        <Badge variant="outline">{teacher.total_periods} periods/week</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedTeacher(teacher); setAllocationDialogOpen(true); }}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {teacher.allocation_count} subject-class allocations • {teacher.duty_count} additional duties
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Duties Tab */}
          <TabsContent value="duties" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Additional Duties</h3>
              <Button onClick={() => setDutyDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Assign Duty
              </Button>
            </div>
            <Card>
              <CardContent className="pt-4">
                <p className="text-muted-foreground text-center py-8">
                  Additional duties like exam supervision, club coordination, etc. can be assigned here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Substitutions Tab */}
          <TabsContent value="substitutions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Teacher Substitutions</h3>
              <Button onClick={() => setSubstitutionDialogOpen(true)} className="gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                New Substitution
              </Button>
            </div>
            <Card>
              <CardContent className="pt-4">
                <p className="text-muted-foreground text-center py-8">
                  Track and manage teacher substitutions when teachers are absent.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Allocation Dialog */}
        <AllocationDialog
          open={allocationDialogOpen}
          onOpenChange={setAllocationDialogOpen}
          teachers={teachers}
          classes={classes}
          subjects={subjects}
          selectedTeacher={selectedTeacher}
          onSave={handleSaveAllocation}
        />

        {/* Settings Dialog */}
        <SettingsDialog
          open={settingsDialogOpen}
          onOpenChange={setSettingsDialogOpen}
          settings={settings}
          onSave={handleSaveSettings}
        />

        {/* Duty Dialog */}
        <DutyDialog
          open={dutyDialogOpen}
          onOpenChange={setDutyDialogOpen}
          teachers={teachers}
          onSave={handleSaveDuty}
        />

        {/* Substitution Dialog */}
        <SubstitutionDialog
          open={substitutionDialogOpen}
          onOpenChange={setSubstitutionDialogOpen}
          teachers={teachers}
          classes={classes}
          subjects={subjects}
          onSave={handleCreateSubstitution}
        />
      </div>
    </DashboardLayout>
  );
};

// Allocation Dialog Component
const AllocationDialog = ({ open, onOpenChange, teachers, classes, subjects, selectedTeacher, onSave }) => {
  const [formData, setFormData] = useState({
    teacher_id: '',
    class_id: '',
    section_id: '',
    subject_id: '',
    periods_per_week: 4,
    is_class_teacher: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedTeacher) {
      setFormData(prev => ({ ...prev, teacher_id: selectedTeacher.id }));
    } else {
      setFormData({
        teacher_id: '',
        class_id: '',
        section_id: '',
        subject_id: '',
        periods_per_week: 4,
        is_class_teacher: false
      });
    }
  }, [selectedTeacher, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Subject-Class Allocation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Teacher *</Label>
            <Select value={formData.teacher_id} onValueChange={(v) => setFormData(p => ({ ...p, teacher_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
              <SelectContent>
                {teachers.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {getTeacherName(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Class *</Label>
            <Select value={formData.class_id} onValueChange={(v) => setFormData(p => ({ ...p, class_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subject *</Label>
            <Select value={formData.subject_id} onValueChange={(v) => setFormData(p => ({ ...p, subject_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Periods per Week *</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={formData.periods_per_week}
              onChange={(e) => setFormData(p => ({ ...p, periods_per_week: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isClassTeacher"
              checked={formData.is_class_teacher}
              onChange={(e) => setFormData(p => ({ ...p, is_class_teacher: e.target.checked }))}
              className="h-4 w-4"
            />
            <Label htmlFor="isClassTeacher">Is Class Teacher</Label>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Allocation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Settings Dialog Component
const SettingsDialog = ({ open, onOpenChange, settings, onSave }) => {
  const [formData, setFormData] = useState({
    min_periods_per_week: 18,
    max_periods_per_week: 30,
    ideal_periods_per_week: 24,
    max_classes_per_teacher: 6,
    max_sections_per_subject: 4,
    min_free_periods_per_day: 1,
    max_consecutive_periods: 3,
    max_substitutions_per_week: 3
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings, open]);

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
          <DialogTitle>Workload Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Min Periods/Week</Label>
              <Input
                type="number"
                value={formData.min_periods_per_week}
                onChange={(e) => setFormData(p => ({ ...p, min_periods_per_week: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Ideal Periods/Week</Label>
              <Input
                type="number"
                value={formData.ideal_periods_per_week}
                onChange={(e) => setFormData(p => ({ ...p, ideal_periods_per_week: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Periods/Week</Label>
              <Input
                type="number"
                value={formData.max_periods_per_week}
                onChange={(e) => setFormData(p => ({ ...p, max_periods_per_week: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Classes/Teacher</Label>
              <Input
                type="number"
                value={formData.max_classes_per_teacher}
                onChange={(e) => setFormData(p => ({ ...p, max_classes_per_teacher: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Consecutive Periods</Label>
              <Input
                type="number"
                value={formData.max_consecutive_periods}
                onChange={(e) => setFormData(p => ({ ...p, max_consecutive_periods: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Free Periods/Day</Label>
              <Input
                type="number"
                value={formData.min_free_periods_per_day}
                onChange={(e) => setFormData(p => ({ ...p, min_free_periods_per_day: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Substitutions/Week</Label>
              <Input
                type="number"
                value={formData.max_substitutions_per_week}
                onChange={(e) => setFormData(p => ({ ...p, max_substitutions_per_week: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Duty Dialog Component
const DutyDialog = ({ open, onOpenChange, teachers, onSave }) => {
  const [formData, setFormData] = useState({
    teacher_id: '',
    duty_type: '',
    duty_name: '',
    period_equivalent: 1,
    effective_from: new Date().toISOString().split('T')[0]
  });
  const [saving, setSaving] = useState(false);

  const DUTY_TYPES = [
    { value: 'exam_supervision', label: 'Exam Supervision' },
    { value: 'sports_incharge', label: 'Sports In-charge' },
    { value: 'club_coordinator', label: 'Club Coordinator' },
    { value: 'library_duty', label: 'Library Duty' },
    { value: 'bus_duty', label: 'Bus Duty' },
    { value: 'assembly_duty', label: 'Assembly Duty' },
    { value: 'lab_incharge', label: 'Lab In-charge' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
    setFormData({
      teacher_id: '',
      duty_type: '',
      duty_name: '',
      period_equivalent: 1,
      effective_from: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Additional Duty</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Teacher *</Label>
            <Select value={formData.teacher_id} onValueChange={(v) => setFormData(p => ({ ...p, teacher_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
              <SelectContent>
                {teachers.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {getTeacherName(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Duty Type *</Label>
            <Select value={formData.duty_type} onValueChange={(v) => setFormData(p => ({ ...p, duty_type: v }))}>
              <SelectTrigger><SelectValue placeholder="Select duty type" /></SelectTrigger>
              <SelectContent>
                {DUTY_TYPES.map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Duty Name *</Label>
            <Input
              value={formData.duty_name}
              onChange={(e) => setFormData(p => ({ ...p, duty_name: e.target.value }))}
              placeholder="e.g., Science Club Coordinator"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Period Equivalent</Label>
              <Input
                type="number"
                min={1}
                value={formData.period_equivalent}
                onChange={(e) => setFormData(p => ({ ...p, period_equivalent: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Effective From *</Label>
              <Input
                type="date"
                value={formData.effective_from}
                onChange={(e) => setFormData(p => ({ ...p, effective_from: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Assign Duty
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Substitution Dialog Component
const SubstitutionDialog = ({ open, onOpenChange, teachers, classes, subjects, onSave }) => {
  const [formData, setFormData] = useState({
    absent_teacher_id: '',
    substitute_teacher_id: '',
    substitution_date: new Date().toISOString().split('T')[0],
    period_number: 1,
    class_id: '',
    subject_id: '',
    absence_reason: 'leave'
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
    setFormData({
      absent_teacher_id: '',
      substitute_teacher_id: '',
      substitution_date: new Date().toISOString().split('T')[0],
      period_number: 1,
      class_id: '',
      subject_id: '',
      absence_reason: 'leave'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Substitution</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Absent Teacher *</Label>
            <Select value={formData.absent_teacher_id} onValueChange={(v) => setFormData(p => ({ ...p, absent_teacher_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select absent teacher" /></SelectTrigger>
              <SelectContent>
                {teachers.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {getTeacherName(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Substitute Teacher *</Label>
            <Select value={formData.substitute_teacher_id} onValueChange={(v) => setFormData(p => ({ ...p, substitute_teacher_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select substitute" /></SelectTrigger>
              <SelectContent>
                {teachers.filter(t => t.id !== formData.absent_teacher_id).map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {getTeacherName(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={formData.substitution_date}
                onChange={(e) => setFormData(p => ({ ...p, substitution_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Period Number *</Label>
              <Input
                type="number"
                minvalue={1}
                max={10}
                value={formData.period_number}
                onChange={(e) => setFormData(p => ({ ...p, period_number: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select value={formData.class_id} onValueChange={(v) => setFormData(p => ({ ...p, class_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select value={formData.subject_id} onValueChange={(v) => setFormData(p => ({ ...p, subject_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={formData.absence_reason} onValueChange={(v) => setFormData(p => ({ ...p, absence_reason: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="leave">Leave</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Substitution
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherWorkload;
