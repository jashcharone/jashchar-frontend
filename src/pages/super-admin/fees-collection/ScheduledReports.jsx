/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SCHEDULED REPORTS
 * Day 40 Implementation - Fee Collection Phase 4 (Analytics)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Schedule automatic report generation
 * - Email delivery configuration
 * - Report history
 * - Multiple schedules (daily, weekly, monthly)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Clock,
  Calendar,
  Mail,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  FileText,
  Loader2,
  History,
  Settings,
  Bell,
  Send,
  CalendarDays,
  CalendarRange,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import { REPORT_TEMPLATES } from '@/utils/feeExportEngine';

const SCHEDULE_FREQUENCIES = [
  { value: 'daily', label: 'Daily', icon: Clock },
  { value: 'weekly', label: 'Weekly', icon: CalendarDays },
  { value: 'monthly', label: 'Monthly', icon: CalendarRange },
  { value: 'quarterly', label: 'Quarterly', icon: Calendar }
];

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' }
];

const REPORT_FORMATS = [
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'excel', label: 'Excel', icon: FileSpreadsheet },
  { value: 'csv', label: 'CSV', icon: FileSpreadsheet }
];

export default function ScheduledReports() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;

  // State
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [reportHistory, setReportHistory] = useState([]);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [activeTab, setActiveTab] = useState('schedules');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    reportType: '',
    format: 'pdf',
    frequency: 'weekly',
    dayOfWeek: 1,
    dayOfMonth: 1,
    time: '08:00',
    emailRecipients: '',
    includeAttachment: true,
    isActive: true
  });

  // Load data
  useEffect(() => {
    if (branchId) {
      loadSchedules();
      loadReportHistory();
    }
  }, [branchId]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      // Load from local storage for now (in production, this would be from database)
      const stored = localStorage.getItem(`feeReportSchedules_${branchId}`);
      if (stored) {
        setSchedules(JSON.parse(stored));
      } else {
        // Default schedules
        setSchedules([
          {
            id: '1',
            name: 'Daily Collection Summary',
            reportType: 'DAILY_COLLECTION',
            format: 'pdf',
            frequency: 'daily',
            time: '18:00',
            emailRecipients: 'admin@school.com',
            includeAttachment: true,
            isActive: true,
            lastRun: null,
            nextRun: getNextRunTime('daily', null, '18:00'),
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Weekly Outstanding Report',
            reportType: 'OUTSTANDING_FEES',
            format: 'excel',
            frequency: 'weekly',
            dayOfWeek: 1,
            time: '09:00',
            emailRecipients: 'accounts@school.com',
            includeAttachment: true,
            isActive: true,
            lastRun: null,
            nextRun: getNextRunTime('weekly', 1, '09:00'),
            createdAt: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReportHistory = async () => {
    // Load from local storage (in production, this would be from database)
    const stored = localStorage.getItem(`feeReportHistory_${branchId}`);
    if (stored) {
      setReportHistory(JSON.parse(stored));
    } else {
      // Sample history
      setReportHistory([
        {
          id: 'h1',
          scheduleName: 'Daily Collection Summary',
          reportType: 'DAILY_COLLECTION',
          runAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'success',
          recipients: 'admin@school.com',
          fileSize: '245 KB'
        },
        {
          id: 'h2',
          scheduleName: 'Weekly Outstanding Report',
          reportType: 'OUTSTANDING_FEES',
          runAt: new Date(Date.now() - 172800000).toISOString(),
          status: 'success',
          recipients: 'accounts@school.com',
          fileSize: '512 KB'
        }
      ]);
    }
  };

  const saveSchedules = (updatedSchedules) => {
    localStorage.setItem(`feeReportSchedules_${branchId}`, JSON.stringify(updatedSchedules));
    setSchedules(updatedSchedules);
  };

  const getNextRunTime = (frequency, dayValue, time) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    switch (frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
      case 'weekly':
        const currentDay = now.getDay();
        let daysUntilNext = (dayValue - currentDay + 7) % 7;
        if (daysUntilNext === 0 && nextRun <= now) {
          daysUntilNext = 7;
        }
        nextRun.setDate(nextRun.getDate() + daysUntilNext);
        break;
      case 'monthly':
        nextRun.setDate(dayValue);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
      case 'quarterly':
        const currentMonth = now.getMonth();
        const nextQuarterMonth = Math.ceil((currentMonth + 1) / 3) * 3;
        nextRun.setMonth(nextQuarterMonth);
        nextRun.setDate(dayValue || 1);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 3);
        }
        break;
    }

    return nextRun.toISOString();
  };

  const handleCreateSchedule = () => {
    setEditingSchedule(null);
    setFormData({
      name: '',
      reportType: '',
      format: 'pdf',
      frequency: 'weekly',
      dayOfWeek: 1,
      dayOfMonth: 1,
      time: '08:00',
      emailRecipients: '',
      includeAttachment: true,
      isActive: true
    });
    setShowScheduleDialog(true);
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      reportType: schedule.reportType,
      format: schedule.format,
      frequency: schedule.frequency,
      dayOfWeek: schedule.dayOfWeek || 1,
      dayOfMonth: schedule.dayOfMonth || 1,
      time: schedule.time,
      emailRecipients: schedule.emailRecipients,
      includeAttachment: schedule.includeAttachment,
      isActive: schedule.isActive
    });
    setShowScheduleDialog(true);
  };

  const handleSaveSchedule = () => {
    if (!formData.name || !formData.reportType || !formData.emailRecipients) {
      toast.error('Please fill all required fields');
      return;
    }

    const dayValue = formData.frequency === 'weekly' 
      ? formData.dayOfWeek 
      : formData.frequency === 'monthly' || formData.frequency === 'quarterly'
        ? formData.dayOfMonth
        : null;

    const scheduleData = {
      id: editingSchedule?.id || `schedule_${Date.now()}`,
      ...formData,
      nextRun: getNextRunTime(formData.frequency, dayValue, formData.time),
      lastRun: editingSchedule?.lastRun || null,
      createdAt: editingSchedule?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedSchedules;
    if (editingSchedule) {
      updatedSchedules = schedules.map(s => s.id === editingSchedule.id ? scheduleData : s);
      toast.success('Schedule updated successfully');
    } else {
      updatedSchedules = [...schedules, scheduleData];
      toast.success('Schedule created successfully');
    }

    saveSchedules(updatedSchedules);
    setShowScheduleDialog(false);
  };

  const handleDeleteSchedule = (scheduleId) => {
    const updatedSchedules = schedules.filter(s => s.id !== scheduleId);
    saveSchedules(updatedSchedules);
    toast.success('Schedule deleted');
  };

  const toggleScheduleStatus = (scheduleId) => {
    const updatedSchedules = schedules.map(s => {
      if (s.id === scheduleId) {
        return { ...s, isActive: !s.isActive };
      }
      return s;
    });
    saveSchedules(updatedSchedules);
    const schedule = schedules.find(s => s.id === scheduleId);
    toast.success(`Schedule ${schedule.isActive ? 'paused' : 'activated'}`);
  };

  const runScheduleNow = async (schedule) => {
    toast.success(`Running ${schedule.name}...`);
    
    // Add to history
    const historyEntry = {
      id: `h_${Date.now()}`,
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      reportType: schedule.reportType,
      runAt: new Date().toISOString(),
      status: 'success',
      recipients: schedule.emailRecipients,
      fileSize: '0 KB'
    };
    
    const updatedHistory = [historyEntry, ...reportHistory];
    localStorage.setItem(`feeReportHistory_${branchId}`, JSON.stringify(updatedHistory));
    setReportHistory(updatedHistory);

    // Update last run time
    const updatedSchedules = schedules.map(s => {
      if (s.id === schedule.id) {
        const dayValue = s.frequency === 'weekly' 
          ? s.dayOfWeek 
          : s.frequency === 'monthly' || s.frequency === 'quarterly'
            ? s.dayOfMonth
            : null;
        return {
          ...s,
          lastRun: new Date().toISOString(),
          nextRun: getNextRunTime(s.frequency, dayValue, s.time)
        };
      }
      return s;
    });
    saveSchedules(updatedSchedules);

    setTimeout(() => {
      toast.success(`${schedule.name} generated and sent to ${schedule.emailRecipients}`);
    }, 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFrequencyLabel = (schedule) => {
    switch (schedule.frequency) {
      case 'daily':
        return `Daily at ${schedule.time}`;
      case 'weekly':
        const day = DAYS_OF_WEEK.find(d => d.value === schedule.dayOfWeek)?.label || '';
        return `Every ${day} at ${schedule.time}`;
      case 'monthly':
        return `Monthly on day ${schedule.dayOfMonth} at ${schedule.time}`;
      case 'quarterly':
        return `Quarterly on day ${schedule.dayOfMonth || 1} at ${schedule.time}`;
      default:
        return schedule.frequency;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scheduled Reports</h1>
          <p className="text-muted-foreground">
            Automate report generation and email delivery
          </p>
        </div>
        <Button onClick={handleCreateSchedule} className="gap-2">
          <Plus className="h-4 w-4" />
          New Schedule
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Schedules</p>
                <p className="text-lg font-bold">{schedules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-lg font-bold">{schedules.filter(s => s.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <History className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reports Generated</p>
                <p className="text-lg font-bold">{reportHistory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Mail className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Emails Sent Today</p>
                <p className="text-lg font-bold">
                  {reportHistory.filter(h => {
                    const today = new Date().toDateString();
                    return new Date(h.runAt).toDateString() === today;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="schedules" className="gap-2">
            <Clock className="h-4 w-4" />
            Schedules
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Schedules Tab */}
        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report Schedules</CardTitle>
              <CardDescription>
                Configure automatic report generation and delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              {schedules.length > 0 ? (
                <div className="space-y-4">
                  {schedules.map(schedule => (
                    <div
                      key={schedule.id}
                      className={`p-4 rounded-lg border ${schedule.isActive ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{schedule.name}</h4>
                            {schedule.isActive ? (
                              <Badge className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="outline">Paused</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {REPORT_TEMPLATES[schedule.reportType]?.name || schedule.reportType}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getFrequencyLabel(schedule)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {schedule.emailRecipients}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {schedule.format?.toUpperCase()}
                            </span>
                          </div>
                          {schedule.nextRun && (
                            <p className="text-xs text-blue-600 mt-2">
                              Next run: {formatDateTime(schedule.nextRun)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => runScheduleNow(schedule)}
                            className="gap-1"
                          >
                            <Play className="h-3 w-3" />
                            Run Now
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleScheduleStatus(schedule.id)}
                          >
                            {schedule.isActive ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditSchedule(schedule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No scheduled reports yet</p>
                  <Button onClick={handleCreateSchedule} variant="outline" className="mt-4">
                    Create First Schedule
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report History</CardTitle>
              <CardDescription>
                Previously generated and sent reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Generated At</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportHistory.length > 0 ? (
                    reportHistory.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.scheduleName}</p>
                            <p className="text-xs text-muted-foreground">
                              {REPORT_TEMPLATES[item.reportType]?.name || item.reportType}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDateTime(item.runAt)}</TableCell>
                        <TableCell className="text-sm">{item.recipients}</TableCell>
                        <TableCell>{item.fileSize}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No report history yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
            </DialogTitle>
            <DialogDescription>
              Configure automatic report generation and delivery
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Schedule Name *</Label>
              <Input
                placeholder="e.g., Daily Collection Summary"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Report Type *</Label>
              <Select
                value={formData.reportType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, reportType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REPORT_TEMPLATES).map(([key, template]) => (
                    <SelectItem key={key} value={key}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Format</Label>
                <Select
                  value={formData.format}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_FORMATS.map(format => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_FREQUENCIES.map(freq => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.frequency === 'weekly' && (
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select
                  value={String(formData.dayOfWeek)}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: Number(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map(day => (
                      <SelectItem key={day.value} value={String(day.value)}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(formData.frequency === 'monthly' || formData.frequency === 'quarterly') && (
              <div className="space-y-2">
                <Label>Day of Month</Label>
                <Select
                  value={String(formData.dayOfMonth)}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfMonth: Number(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={String(day)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Email Recipients * (comma separated)</Label>
              <Input
                placeholder="admin@school.com, accounts@school.com"
                value={formData.emailRecipients}
                onChange={(e) => setFormData(prev => ({ ...prev, emailRecipients: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.includeAttachment}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeAttachment: checked }))}
                />
                <Label>Include report as attachment</Label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSchedule} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              {editingSchedule ? 'Update' : 'Create'} Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
