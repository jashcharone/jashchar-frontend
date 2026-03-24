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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Calendar, Clock, BookOpen, Save, Plus, Trash2, Edit2, 
  RefreshCw, Loader2, CheckCircle2, AlertCircle, Wand2, CalendarDays,
  Sun, Coffee, Utensils, GraduationCap
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const WORKING_DAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const HOLIDAY_TYPES = [
  { value: 'public', label: 'Public Holiday' },
  { value: 'national', label: 'National Holiday' },
  { value: 'religious', label: 'Religious Holiday' },
  { value: 'school_event', label: 'School Event' },
  { value: 'vacation', label: 'Vacation' },
];

const TERM_TYPES = [
  { value: 'term', label: 'Term' },
  { value: 'semester', label: 'Semester' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'trimester', label: 'Trimester' },
];

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const AcademicSetup = () => {
  const { toast } = useToast();
  const { user, currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();
  
  const [activeTab, setActiveTab] = useState('settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    max_periods_per_day: 8,
    period_duration_minutes: 45,
    break_after_period: 4,
    break_duration_minutes: 30,
    lunch_after_period: 6,
    lunch_duration_minutes: 45,
    school_start_time: '08:30',
    school_end_time: '16:00',
    assembly_duration_minutes: 15,
    grading_system: 'percentage',
    pass_percentage: 35,
    academic_year_start_month: 4,
    academic_year_end_month: 3,
    attendance_lock_days: 7,
    result_lock_enabled: false,
    auto_promote_pass_students: false
  });

  // Terms State
  const [terms, setTerms] = useState([]);
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);

  // Holidays State
  const [holidays, setHolidays] = useState([]);
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);

  // Period Timings State
  const [periodTimings, setPeriodTimings] = useState([]);
  const [generatingPeriods, setGeneratingPeriods] = useState(false);

  const branchId = selectedBranch?.id;

  // Fetch all data
  useEffect(() => {
    if (branchId) {
      fetchAllData();
    }
  }, [branchId, currentSessionId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [settingsRes, termsRes, holidaysRes, periodsRes] = await Promise.all([
        api.get(`/academics/settings?branchId=${branchId}&sessionId=${currentSessionId}`),
        api.get(`/academics/terms?branchId=${branchId}&sessionId=${currentSessionId}`),
        api.get(`/academics/holidays?branchId=${branchId}&sessionId=${currentSessionId}`),
        api.get(`/academics/period-timings?branchId=${branchId}`)
      ]);

      if (settingsRes.data && Object.keys(settingsRes.data).length > 0) {
        setSettings(prev => ({
          ...prev,
          ...settingsRes.data,
          school_start_time: settingsRes.data.school_start_time?.slice(0, 5) || '08:30',
          school_end_time: settingsRes.data.school_end_time?.slice(0, 5) || '16:00'
        }));
      }
      setTerms(termsRes.data || []);
      setHolidays(holidaysRes.data || []);
      setPeriodTimings(periodsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to load academic settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.post('/academics/settings', {
        ...settings,
        branch_id: branchId,
        session_id: currentSessionId,
        organization_id: selectedBranch?.organization_id
      });
      toast({ title: 'Success', description: 'Academic settings saved successfully' });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Term CRUD
  const handleSaveTerm = async (termData) => {
    try {
      await api.post('/academics/terms', {
        ...termData,
        id: editingTerm?.id,
        branch_id: branchId,
        session_id: currentSessionId,
        organization_id: selectedBranch?.organization_id
      });
      toast({ title: 'Success', description: 'Term saved successfully' });
      setTermDialogOpen(false);
      setEditingTerm(null);
      fetchAllData();
    } catch (error) {
      console.error('Error saving term:', error);
      toast({ title: 'Error', description: 'Failed to save term', variant: 'destructive' });
    }
  };

  const handleDeleteTerm = async (termId) => {
    try {
      await api.delete(`/academics/terms/${termId}?branchId=${branchId}`);
      toast({ title: 'Success', description: 'Term deleted successfully' });
      fetchAllData();
    } catch (error) {
      console.error('Error deleting term:', error);
      toast({ title: 'Error', description: 'Failed to delete term', variant: 'destructive' });
    }
  };

  // Holiday CRUD
  const handleSaveHoliday = async (holidayData) => {
    try {
      await api.post('/academics/holidays', {
        ...holidayData,
        id: editingHoliday?.id,
        branch_id: branchId,
        session_id: currentSessionId,
        organization_id: selectedBranch?.organization_id
      });
      toast({ title: 'Success', description: 'Holiday saved successfully' });
      setHolidayDialogOpen(false);
      setEditingHoliday(null);
      fetchAllData();
    } catch (error) {
      console.error('Error saving holiday:', error);
      toast({ title: 'Error', description: 'Failed to save holiday', variant: 'destructive' });
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    try {
      await api.delete(`/academics/holidays/${holidayId}?branchId=${branchId}`);
      toast({ title: 'Success', description: 'Holiday deleted successfully' });
      fetchAllData();
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast({ title: 'Error', description: 'Failed to delete holiday', variant: 'destructive' });
    }
  };

  // Generate Period Timings
  const handleGeneratePeriods = async () => {
    setGeneratingPeriods(true);
    try {
      const response = await api.post('/academics/period-timings/generate', {
        branch_id: branchId,
        session_id: currentSessionId,
        organization_id: selectedBranch?.organization_id
      });
      setPeriodTimings(response.data.periods || []);
      toast({ title: 'Success', description: 'Period timings generated based on settings' });
    } catch (error) {
      console.error('Error generating periods:', error);
      toast({ title: 'Error', description: 'Failed to generate periods', variant: 'destructive' });
    } finally {
      setGeneratingPeriods(false);
    }
  };

  // Save Period Timings
  const handleSavePeriodTimings = async () => {
    setSaving(true);
    try {
      await api.post('/academics/period-timings', {
        branch_id: branchId,
        session_id: currentSessionId,
        organization_id: selectedBranch?.organization_id,
        periods: periodTimings
      });
      toast({ title: 'Success', description: 'Period timings saved successfully' });
    } catch (error) {
      console.error('Error saving period timings:', error);
      toast({ title: 'Error', description: 'Failed to save period timings', variant: 'destructive' });
    } finally {
      setSaving(false);
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
              <Settings className="h-8 w-8 text-primary" />
              Academic Setup
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure academic year settings, terms, holidays, and period timings
            </p>
          </div>
          <Button variant="outline" onClick={fetchAllData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="terms" className="gap-2">
              <Calendar className="h-4 w-4" />
              Terms
            </TabsTrigger>
            <TabsTrigger value="holidays" className="gap-2">
              <Sun className="h-4 w-4" />
              Holidays
            </TabsTrigger>
            <TabsTrigger value="periods" className="gap-2">
              <Clock className="h-4 w-4" />
              Period Timings
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid gap-6">
              {/* Working Days */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Working Days
                  </CardTitle>
                  <CardDescription>Select which days the school operates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    {WORKING_DAYS.map(day => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={day.value}
                          checked={settings.working_days?.includes(day.value)}
                          onCheckedChange={(checked) => {
                            setSettings(prev => ({
                              ...prev,
                              working_days: checked
                                ? [...(prev.working_days || []), day.value]
                                : (prev.working_days || []).filter(d => d !== day.value)
                            }));
                          }}
                        />
                        <Label htmlFor={day.value}>{day.label}</Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* School Timings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    School Timings
                  </CardTitle>
                  <CardDescription>Configure school hours and period settings</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>School Start Time</Label>
                    <Input
                      type="time"
                      value={settings.school_start_time}
                      onChange={(e) => setSettings(prev => ({ ...prev, school_start_time: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>School End Time</Label>
                    <Input
                      type="time"
                      value={settings.school_end_time}
                      onChange={(e) => setSettings(prev => ({ ...prev, school_end_time: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Assembly Duration (mins)</Label>
                    <Input
                      type="number"
                      value={settings.assembly_duration_minutes}
                      onChange={(e) => setSettings(prev => ({ ...prev, assembly_duration_minutes: parseInt(e.target.value) || 15 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Periods Per Day</Label>
                    <Input
                      type="number"
                      value={settings.max_periods_per_day}
                      onChange={(e) => setSettings(prev => ({ ...prev, max_periods_per_day: parseInt(e.target.value) || 8 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Period Duration (mins)</Label>
                    <Input
                      type="number"
                      value={settings.period_duration_minutes}
                      onChange={(e) => setSettings(prev => ({ ...prev, period_duration_minutes: parseInt(e.target.value) || 45 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Break After Period</Label>
                    <Input
                      type="number"
                      value={settings.break_after_period}
                      onChange={(e) => setSettings(prev => ({ ...prev, break_after_period: parseInt(e.target.value) || 4 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Break Duration (mins)</Label>
                    <Input
                      type="number"
                      value={settings.break_duration_minutes}
                      onChange={(e) => setSettings(prev => ({ ...prev, break_duration_minutes: parseInt(e.target.value) || 30 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lunch After Period</Label>
                    <Input
                      type="number"
                      value={settings.lunch_after_period}
                      onChange={(e) => setSettings(prev => ({ ...prev, lunch_after_period: parseInt(e.target.value) || 6 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lunch Duration (mins)</Label>
                    <Input
                      type="number"
                      value={settings.lunch_duration_minutes}
                      onChange={(e) => setSettings(prev => ({ ...prev, lunch_duration_minutes: parseInt(e.target.value) || 45 }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Academic Year */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Academic Year Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Academic Year Start Month</Label>
                    <Select
                      value={String(settings.academic_year_start_month)}
                      onValueChange={(v) => setSettings(prev => ({ ...prev, academic_year_start_month: parseInt(v) }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONTHS.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Academic Year End Month</Label>
                    <Select
                      value={String(settings.academic_year_end_month)}
                      onValueChange={(v) => setSettings(prev => ({ ...prev, academic_year_end_month: parseInt(v) }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONTHS.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Grading System</Label>
                    <Select
                      value={settings.grading_system}
                      onValueChange={(v) => setSettings(prev => ({ ...prev, grading_system: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="grade_points">Grade Points (CGPA)</SelectItem>
                        <SelectItem value="marks">Marks Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pass Percentage</Label>
                    <Input
                      type="number"
                      value={settings.pass_percentage}
                      onChange={(e) => setSettings(prev => ({ ...prev, pass_percentage: parseFloat(e.target.value) || 35 }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Additional Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Attendance Lock Days</Label>
                      <p className="text-sm text-muted-foreground">Lock attendance after N days</p>
                    </div>
                    <Input
                      type="number"
                      className="w-24"
                      value={settings.attendance_lock_days}
                      onChange={(e) => setSettings(prev => ({ ...prev, attendance_lock_days: parseInt(e.target.value) || 7 }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Result Lock</Label>
                      <p className="text-sm text-muted-foreground">Prevent result modifications after publishing</p>
                    </div>
                    <Switch
                      checked={settings.result_lock_enabled}
                      onCheckedChange={(v) => setSettings(prev => ({ ...prev, result_lock_enabled: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-Promote Pass Students</Label>
                      <p className="text-sm text-muted-foreground">Automatically promote passing students</p>
                    </div>
                    <Switch
                      checked={settings.auto_promote_pass_students}
                      onCheckedChange={(v) => setSettings(prev => ({ ...prev, auto_promote_pass_students: v }))}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Settings
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Terms Tab */}
          <TabsContent value="terms">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Academic Terms
                  </CardTitle>
                  <CardDescription>Configure terms, semesters, or quarters for the academic year</CardDescription>
                </div>
                <Button onClick={() => { setEditingTerm(null); setTermDialogOpen(true); }} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Term
                </Button>
              </CardHeader>
              <CardContent>
                {terms.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Term Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Weightage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {terms.map(term => (
                        <TableRow key={term.id}>
                          <TableCell className="font-medium">{term.term_name}</TableCell>
                          <TableCell><Badge variant="outline">{term.term_type}</Badge></TableCell>
                          <TableCell>{formatDate(term.start_date)}</TableCell>
                          <TableCell>{formatDate(term.end_date)}</TableCell>
                          <TableCell>{term.term_weightage}%</TableCell>
                          <TableCell>
                            <Badge variant={term.is_active ? 'default' : 'secondary'}>
                              {term.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setEditingTerm(term); setTermDialogOpen(true); }}
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
                                    <AlertDialogTitle>Delete Term?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the term "{term.term_name}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteTerm(term.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No terms configured. Add your first term to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Holidays Tab */}
          <TabsContent value="holidays">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="h-5 w-5" />
                    Academic Holidays
                  </CardTitle>
                  <CardDescription>Manage holidays, vacations, and non-working days</CardDescription>
                </div>
                <Button onClick={() => { setEditingHoliday(null); setHolidayDialogOpen(true); }} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Holiday
                </Button>
              </CardHeader>
              <CardContent>
                {holidays.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Holiday Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>For</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {holidays.map(holiday => (
                        <TableRow key={holiday.id}>
                          <TableCell className="font-medium">{holiday.holiday_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{HOLIDAY_TYPES.find(t => t.value === holiday.holiday_type)?.label || holiday.holiday_type}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(holiday.start_date)}</TableCell>
                          <TableCell>{formatDate(holiday.end_date)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {holiday.applies_to_staff && <Badge variant="secondary" className="text-xs">Staff</Badge>}
                              {holiday.applies_to_students && <Badge variant="secondary" className="text-xs">Students</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setEditingHoliday(holiday); setHolidayDialogOpen(true); }}
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
                                    <AlertDialogTitle>Delete Holiday?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete "{holiday.holiday_name}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteHoliday(holiday.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sun className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No holidays configured. Add holidays to mark non-working days.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Period Timings Tab */}
          <TabsContent value="periods">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Period Timings
                  </CardTitle>
                  <CardDescription>Configure daily period schedule with breaks</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleGeneratePeriods} disabled={generatingPeriods} className="gap-2">
                    {generatingPeriods ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    Auto-Generate
                  </Button>
                  <Button onClick={handleSavePeriodTimings} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Timings
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {periodTimings.length > 0 ? (
                  <div className="space-y-3">
                    {periodTimings.map((period, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          period.period_type === 'break' ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' :
                          period.period_type === 'lunch' ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800' :
                          period.period_type === 'assembly' ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' :
                          'bg-card border-border'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-[140px]">
                          {period.period_type === 'break' && <Coffee className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                          {period.period_type === 'lunch' && <Utensils className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
                          {period.period_type === 'assembly' && <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                          {period.period_type === 'class' && <BookOpen className="h-5 w-5 text-primary" />}
                          <span className="font-medium">{period.period_name}</span>
                        </div>
                        <Badge variant="outline">{period.period_type}</Badge>
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={period.start_time?.slice(0, 5)}
                            onChange={(e) => {
                              const updated = [...periodTimings];
                              updated[index].start_time = e.target.value;
                              setPeriodTimings(updated);
                            }}
                            className="w-32"
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={period.end_time?.slice(0, 5)}
                            onChange={(e) => {
                              const updated = [...periodTimings];
                              updated[index].end_time = e.target.value;
                              setPeriodTimings(updated);
                            }}
                            className="w-32"
                          />
                        </div>
                        <Badge variant="secondary">{period.duration_minutes} mins</Badge>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No period timings configured.</p>
                    <Button variant="outline" onClick={handleGeneratePeriods} className="mt-4 gap-2">
                      <Wand2 className="h-4 w-4" />
                      Auto-Generate from Settings
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Term Dialog */}
        <TermDialog
          open={termDialogOpen}
          onOpenChange={setTermDialogOpen}
          term={editingTerm}
          onSave={handleSaveTerm}
        />

        {/* Holiday Dialog */}
        <HolidayDialog
          open={holidayDialogOpen}
          onOpenChange={setHolidayDialogOpen}
          holiday={editingHoliday}
          onSave={handleSaveHoliday}
        />
      </div>
    </DashboardLayout>
  );
};

// Term Dialog Component
const TermDialog = ({ open, onOpenChange, term, onSave }) => {
  const [formData, setFormData] = useState({
    term_name: '',
    term_type: 'term',
    term_number: 1,
    start_date: '',
    end_date: '',
    has_unit_test: true,
    has_half_yearly: false,
    has_final_exam: false,
    term_weightage: 25,
    is_active: true
  });

  useEffect(() => {
    if (term) {
      setFormData({
        ...term,
        start_date: term.start_date?.split('T')[0] || '',
        end_date: term.end_date?.split('T')[0] || ''
      });
    } else {
      setFormData({
        term_name: '',
        term_type: 'term',
        term_number: 1,
        start_date: '',
        end_date: '',
        has_unit_test: true,
        has_half_yearly: false,
        has_final_exam: false,
        term_weightage: 25,
        is_active: true
      });
    }
  }, [term, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{term ? 'Edit Term' : 'Add New Term'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Term Name *</Label>
              <Input
                value={formData.term_name}
                onChange={(e) => setFormData(prev => ({ ...prev, term_name: e.target.value }))}
                placeholder="First Term"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Term Type</Label>
              <Select
                value={formData.term_type}
                onValueChange={(v) => setFormData(prev => ({ ...prev, term_type: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TERM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Term Number</Label>
              <Input
                type="number"
                value={formData.term_number}
                onChange={(e) => setFormData(prev => ({ ...prev, term_number: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Weightage (%)</Label>
              <Input
                type="number"
                value={formData.term_weightage}
                onChange={(e) => setFormData(prev => ({ ...prev, term_weightage: parseFloat(e.target.value) || 25 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_unit_test"
                checked={formData.has_unit_test}
                onCheckedChange={(c) => setFormData(prev => ({ ...prev, has_unit_test: c }))}
              />
              <Label htmlFor="has_unit_test">Has Unit Test</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_half_yearly"
                checked={formData.has_half_yearly}
                onCheckedChange={(c) => setFormData(prev => ({ ...prev, has_half_yearly: c }))}
              />
              <Label htmlFor="has_half_yearly">Has Half Yearly</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_final_exam"
                checked={formData.has_final_exam}
                onCheckedChange={(c) => setFormData(prev => ({ ...prev, has_final_exam: c }))}
              />
              <Label htmlFor="has_final_exam">Has Final Exam</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(c) => setFormData(prev => ({ ...prev, is_active: c }))}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save Term</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Holiday Dialog Component
const HolidayDialog = ({ open, onOpenChange, holiday, onSave }) => {
  const [formData, setFormData] = useState({
    holiday_name: '',
    holiday_type: 'public',
    start_date: '',
    end_date: '',
    is_recurring: false,
    applies_to_staff: true,
    applies_to_students: true,
    description: ''
  });

  useEffect(() => {
    if (holiday) {
      setFormData({
        ...holiday,
        start_date: holiday.start_date?.split('T')[0] || '',
        end_date: holiday.end_date?.split('T')[0] || ''
      });
    } else {
      setFormData({
        holiday_name: '',
        holiday_type: 'public',
        start_date: '',
        end_date: '',
        is_recurring: false,
        applies_to_staff: true,
        applies_to_students: true,
        description: ''
      });
    }
  }, [holiday, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{holiday ? 'Edit Holiday' : 'Add New Holiday'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Holiday Name *</Label>
            <Input
              value={formData.holiday_name}
              onChange={(e) => setFormData(prev => ({ ...prev, holiday_name: e.target.value }))}
              placeholder="Independence Day"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Holiday Type</Label>
              <Select
                value={formData.holiday_type}
                onValueChange={(v) => setFormData(prev => ({ ...prev, holiday_type: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HOLIDAY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                checked={formData.is_recurring}
                onCheckedChange={(c) => setFormData(prev => ({ ...prev, is_recurring: c }))}
              />
              <Label>Recurring Yearly</Label>
            </div>
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="applies_staff"
                checked={formData.applies_to_staff}
                onCheckedChange={(c) => setFormData(prev => ({ ...prev, applies_to_staff: c }))}
              />
              <Label htmlFor="applies_staff">Applies to Staff</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="applies_students"
                checked={formData.applies_to_students}
                onCheckedChange={(c) => setFormData(prev => ({ ...prev, applies_to_students: c }))}
              />
              <Label htmlFor="applies_students">Applies to Students</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description..."
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save Holiday</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AcademicSetup;
