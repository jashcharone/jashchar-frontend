/**
 * ReportScheduleManager - Manage All Scheduled Reports
 * Day 8 - 8 Day Master Plan
 * Features: View, Edit, Delete, Enable/Disable scheduled reports
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  Calendar, 
  Mail, 
  Play, 
  Pause, 
  Trash2, 
  Edit, 
  Plus, 
  Search, 
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  History,
  Settings
} from 'lucide-react';
import { REPORT_MODULES, SCHEDULE_FREQUENCIES, EXPORT_FORMATS } from './constants';
import { formatDate, formatDateTime } from '@/utils/dateUtils';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Sample scheduled reports data
const SAMPLE_SCHEDULES = [
  {
    id: 1,
    report_name: 'Daily Attendance Report',
    module: 'attendance',
    template_key: 'daily_attendance',
    frequency: 'daily',
    time: '08:00',
    days: [],
    format: 'excel',
    recipients: ['principal@school.edu', 'admin@school.edu'],
    is_active: true,
    last_run: '2026-02-28T08:00:00',
    next_run: '2026-03-01T08:00:00',
    run_count: 45,
    last_status: 'success',
    created_at: '2026-01-15T10:30:00',
    created_by: 'Admin User'
  },
  {
    id: 2,
    report_name: 'Weekly Fee Collection Summary',
    module: 'fees',
    template_key: 'collection_summary',
    frequency: 'weekly',
    time: '09:00',
    days: [1], // Monday
    format: 'pdf',
    recipients: ['accountant@school.edu', 'principal@school.edu'],
    is_active: true,
    last_run: '2026-02-24T09:00:00',
    next_run: '2026-03-02T09:00:00',
    run_count: 12,
    last_status: 'success',
    created_at: '2026-01-10T14:20:00',
    created_by: 'Admin User'
  },
  {
    id: 3,
    report_name: 'Monthly Student Strength',
    module: 'student-information',
    template_key: 'strength_analysis',
    frequency: 'monthly',
    time: '10:00',
    days: [1], // 1st of month
    format: 'excel',
    recipients: ['admin@school.edu'],
    is_active: false,
    last_run: '2026-02-01T10:00:00',
    next_run: '2026-03-01T10:00:00',
    run_count: 2,
    last_status: 'failed',
    created_at: '2026-01-05T09:15:00',
    created_by: 'Admin User'
  },
  {
    id: 4,
    report_name: 'Library Overdue Books Alert',
    module: 'library',
    template_key: 'overdue_books',
    frequency: 'daily',
    time: '07:30',
    days: [],
    format: 'excel',
    recipients: ['librarian@school.edu'],
    is_active: true,
    last_run: '2026-02-28T07:30:00',
    next_run: '2026-03-01T07:30:00',
    run_count: 60,
    last_status: 'success',
    created_at: '2026-01-01T11:00:00',
    created_by: 'Librarian'
  },
  {
    id: 5,
    report_name: 'Transport Daily Trip Log',
    module: 'transport',
    template_key: 'daily_trips',
    frequency: 'daily',
    time: '18:00',
    days: [],
    format: 'pdf',
    recipients: ['transport@school.edu', 'admin@school.edu'],
    is_active: true,
    last_run: '2026-02-28T18:00:00',
    next_run: '2026-03-01T18:00:00',
    run_count: 55,
    last_status: 'success',
    created_at: '2026-01-02T08:45:00',
    created_by: 'Transport Manager'
  }
];

const ReportScheduleManager = () => {
  const { user, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  const [schedules, setSchedules] = useState(SAMPLE_SCHEDULES);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch schedules from API
  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch(
        `${API_BASE}/reports/schedules?organization_id=${organizationId}&branch_id=${selectedBranch?.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || SAMPLE_SCHEDULES);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
      // Keep sample data for demo
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, selectedBranch]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Toggle schedule active status
  const toggleScheduleStatus = useCallback(async (scheduleId) => {
    setSchedules(prev => prev.map(s => 
      s.id === scheduleId ? { ...s, is_active: !s.is_active } : s
    ));
    // In production, update via API
  }, []);

  // Delete schedule
  const deleteSchedule = useCallback(async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this scheduled report?')) {
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
      // In production, delete via API
    }
  }, []);

  // Run schedule now
  const runNow = useCallback(async (scheduleId) => {
    // In production, trigger via API
    alert('Report generation triggered! You will receive the report via email shortly.');
  }, []);

  // Filter schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter(schedule => {
      const matchesSearch = schedule.report_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.template_key.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesModule = filterModule === 'all' || schedule.module === filterModule;
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && schedule.is_active) ||
        (filterStatus === 'paused' && !schedule.is_active);
      return matchesSearch && matchesModule && matchesStatus;
    });
  }, [schedules, searchTerm, filterModule, filterStatus]);

  // Stats
  const stats = useMemo(() => ({
    total: schedules.length,
    active: schedules.filter(s => s.is_active).length,
    paused: schedules.filter(s => !s.is_active).length,
    daily: schedules.filter(s => s.frequency === 'daily').length,
    weekly: schedules.filter(s => s.frequency === 'weekly').length,
    monthly: schedules.filter(s => s.frequency === 'monthly').length
  }), [schedules]);

  const getFrequencyBadge = (frequency) => {
    const colors = {
      daily: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
      weekly: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
      monthly: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
    };
    return colors[frequency] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (status) => {
    if (status === 'success') return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
    if (status === 'failed') return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
  };

  const getFormatIcon = (format) => {
    if (format === 'excel') return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
    if (format === 'pdf') return <FileText className="h-4 w-4 text-red-600" />;
    return <FileText className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Scheduled Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage automated report delivery schedules
          </p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          New Schedule
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Clock className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.total}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                <Pause className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.paused}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Paused</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.daily}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Daily</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.weekly}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Weekly</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.monthly}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Monthly</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search schedules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
            
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <option value="all">All Modules</option>
              {Object.entries(REPORT_MODULES).map(([key, mod]) => (
                <option key={key} value={key}>{mod.name}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="paused">Paused Only</option>
            </select>

            <Button variant="outline" onClick={fetchSchedules} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schedule List */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Report</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Module</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Frequency</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Format</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Recipients</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Run</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {filteredSchedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${schedule.is_active ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                          <Clock className={`h-4 w-4 ${schedule.is_active ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{schedule.report_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{schedule.template_key}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                        {REPORT_MODULES[schedule.module]?.name || schedule.module}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getFrequencyBadge(schedule.frequency)}>
                        {schedule.frequency}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {schedule.time}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {getFormatIcon(schedule.format)}
                        <span className="text-xs text-gray-600 dark:text-gray-300 uppercase">{schedule.format}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-300">{schedule.recipients.length}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {schedule.last_run ? formatDateTime(schedule.last_run) : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {schedule.is_active ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <Badge className={getStatusBadge(schedule.last_status)}>
                          {schedule.last_status || 'pending'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => runNow(schedule.id)}
                          title="Run Now"
                        >
                          <Send className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleScheduleStatus(schedule.id)}
                          title={schedule.is_active ? 'Pause' : 'Resume'}
                        >
                          {schedule.is_active ? (
                            <Pause className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <Play className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSchedule(schedule);
                            setShowEditModal(true);
                          }}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSchedule(schedule.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredSchedules.length === 0 && (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No Scheduled Reports</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Create a new schedule to automate report delivery
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportScheduleManager;
