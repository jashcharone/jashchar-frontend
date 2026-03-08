/**
 * ReportHistory - View Report Generation History & Logs
 * Day 8 - 8 Day Master Plan
 * Features: View all generated reports, download, status tracking
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  History, 
  Search, 
  Download, 
  Eye, 
  RefreshCw,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Calendar,
  User,
  Filter,
  Trash2,
  MoreVertical,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { REPORT_MODULES } from './constants';
import { formatDate, formatDateTime, getRelativeDate } from '@/utils/dateUtils';

// Sample history data
const SAMPLE_HISTORY = [
  {
    id: 1,
    report_name: 'Student List - Complete',
    module: 'student-information',
    template_key: 'student_list_complete',
    generated_at: '2026-03-01T09:45:00',
    generated_by: 'Admin User',
    status: 'success',
    format: 'excel',
    file_size: '245 KB',
    records_count: 850,
    filters_applied: { class: '10th', section: 'A' },
    download_url: '/reports/downloads/report_1.xlsx',
    execution_time: '2.3s'
  },
  {
    id: 2,
    report_name: 'Fee Collection Summary',
    module: 'fees',
    template_key: 'collection_summary',
    generated_at: '2026-03-01T09:30:00',
    generated_by: 'Accountant',
    status: 'success',
    format: 'pdf',
    file_size: '128 KB',
    records_count: 125,
    filters_applied: { month: 'February', category: 'Tuition' },
    download_url: '/reports/downloads/report_2.pdf',
    execution_time: '1.8s'
  },
  {
    id: 3,
    report_name: 'Daily Attendance Report',
    module: 'attendance',
    template_key: 'daily_attendance',
    generated_at: '2026-03-01T08:00:00',
    generated_by: 'System (Scheduled)',
    status: 'success',
    format: 'excel',
    file_size: '456 KB',
    records_count: 1250,
    filters_applied: { date: '2026-02-28' },
    download_url: '/reports/downloads/report_3.xlsx',
    execution_time: '3.5s'
  },
  {
    id: 4,
    report_name: 'Exam Results Analysis',
    module: 'examinations',
    template_key: 'result_analysis',
    generated_at: '2026-02-28T16:20:00',
    generated_by: 'Principal',
    status: 'failed',
    format: 'pdf',
    file_size: null,
    records_count: 0,
    filters_applied: { exam: 'Quarterly' },
    download_url: null,
    execution_time: null,
    error_message: 'Database connection timeout'
  },
  {
    id: 5,
    report_name: 'Library Overdue Books',
    module: 'library',
    template_key: 'overdue_books',
    generated_at: '2026-02-28T15:45:00',
    generated_by: 'Librarian',
    status: 'success',
    format: 'excel',
    file_size: '89 KB',
    records_count: 45,
    filters_applied: {},
    download_url: '/reports/downloads/report_5.xlsx',
    execution_time: '1.2s'
  },
  {
    id: 6,
    report_name: 'Transport Route Summary',
    module: 'transport',
    template_key: 'route_summary',
    generated_at: '2026-02-28T14:30:00',
    generated_by: 'Transport Manager',
    status: 'success',
    format: 'pdf',
    file_size: '156 KB',
    records_count: 12,
    filters_applied: { route: 'All Routes' },
    download_url: '/reports/downloads/report_6.pdf',
    execution_time: '1.5s'
  },
  {
    id: 7,
    report_name: 'HR Staff Directory',
    module: 'human-resource',
    template_key: 'staff_directory',
    generated_at: '2026-02-28T11:00:00',
    generated_by: 'HR Manager',
    status: 'success',
    format: 'excel',
    file_size: '312 KB',
    records_count: 85,
    filters_applied: { department: 'All' },
    download_url: '/reports/downloads/report_7.xlsx',
    execution_time: '2.1s'
  },
  {
    id: 8,
    report_name: 'Hostel Occupancy Report',
    module: 'hostel',
    template_key: 'occupancy_report',
    generated_at: '2026-02-27T17:30:00',
    generated_by: 'Warden',
    status: 'processing',
    format: 'pdf',
    file_size: null,
    records_count: null,
    filters_applied: { hostel: 'Boys Hostel' },
    download_url: null,
    execution_time: null
  },
  {
    id: 9,
    report_name: 'Custom Report - Fee + Student',
    module: 'custom',
    template_key: 'custom_1709305245',
    generated_at: '2026-02-27T15:00:00',
    generated_by: 'Admin User',
    status: 'success',
    format: 'excel',
    file_size: '1.2 MB',
    records_count: 2500,
    filters_applied: { class: 'All', session: '2025-26' },
    download_url: '/reports/downloads/report_9.xlsx',
    execution_time: '8.5s'
  },
  {
    id: 10,
    report_name: 'Homework Submission Status',
    module: 'homework',
    template_key: 'submission_status',
    generated_at: '2026-02-27T10:15:00',
    generated_by: 'Class Teacher',
    status: 'success',
    format: 'pdf',
    file_size: '78 KB',
    records_count: 35,
    filters_applied: { class: '8th', section: 'B' },
    download_url: '/reports/downloads/report_10.pdf',
    execution_time: '1.0s'
  }
];

const ReportHistory = () => {
  const navigate = useNavigate();
  const { user, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');

  // Fetch history from report_logs table in Supabase
  const fetchHistory = useCallback(async () => {
    // Guard: Don't fetch if organizationId or branchId is missing
    if (!organizationId || !selectedBranch?.id) {
      console.log('[ReportHistory] Waiting for context...', { organizationId, branchId: selectedBranch?.id });
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('[ReportHistory] Fetching from report_logs...');
      const { data, error } = await supabase
        .from('report_logs')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('branch_id', selectedBranch.id)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) {
        console.error('[ReportHistory] DB Error:', error);
        return;
      }
      
      if (data?.length > 0) {
        // Transform DB records to component format
        const transformedData = data.map(record => ({
          id: record.id,
          report_name: record.report_name || record.module + ' Report',
          module: record.module,
          template_key: record.template_id,
          generated_at: record.started_at || record.created_at,
          generated_by: record.user_id || 'Unknown',
          status: record.status === 'completed' ? 'success' : (record.status === 'failed' ? 'failed' : record.status),
          format: record.export_format,
          file_size: record.file_size_bytes ? `${(record.file_size_bytes / 1024).toFixed(0)} KB` : 'N/A',
          records_count: record.record_count || 0,
          filters_applied: {},
          download_url: null,
          execution_time: record.duration_ms ? `${(record.duration_ms / 1000).toFixed(1)}s` : null,
          error_message: record.error_message
        }));
        
        console.log(`✅ [ReportHistory] Loaded ${transformedData.length} records from DB`);
        setHistory(transformedData);
      } else {
        console.log('[ReportHistory] No records found in DB');
        setHistory([]);
      }
    } catch (err) {
      console.error('[ReportHistory] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, selectedBranch]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Download report
  const downloadReport = useCallback((report) => {
    if (report.download_url) {
      // Check if it's a real URL (starts with http) or sample data
      if (report.download_url.startsWith('http')) {
        // Real URL - open in new tab to download
        window.open(report.download_url, '_blank');
      } else {
        // Demo/sample data - show informative message
        alert(`ℹ️ Demo Mode\n\nThis is sample data for demonstration.\nReport: ${report.report_name}\nFormat: ${report.format.toUpperCase()}\n\nIn production, actual reports will be downloaded here.`);
      }
    } else {
      alert('Download URL not available for this report.');
    }
  }, []);

  // Delete history entry from database
  const deleteHistory = useCallback(async (historyId) => {
    if (window.confirm('Are you sure you want to delete this history entry?')) {
      try {
        const { error } = await supabase
          .from('report_logs')
          .delete()
          .eq('id', historyId);
        
        if (error) {
          console.error('Error deleting history:', error);
          alert('Failed to delete history entry');
          return;
        }
        
        setHistory(prev => prev.filter(h => h.id !== historyId));
        console.log('✅ History entry deleted:', historyId);
      } catch (err) {
        console.error('Delete error:', err);
        alert('An error occurred while deleting');
      }
    }
  }, []);

  // Filter history
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = item.report_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.generated_by.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesModule = filterModule === 'all' || item.module === filterModule;
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      
      // Date range filter
      let matchesDate = true;
      if (filterDateRange !== 'all') {
        const itemDate = new Date(item.generated_at);
        const today = new Date();
        const daysDiff = Math.floor((today - itemDate) / (1000 * 60 * 60 * 24));
        
        if (filterDateRange === 'today') matchesDate = daysDiff < 1;
        else if (filterDateRange === 'week') matchesDate = daysDiff < 7;
        else if (filterDateRange === 'month') matchesDate = daysDiff < 30;
      }
      
      return matchesSearch && matchesModule && matchesStatus && matchesDate;
    });
  }, [history, searchTerm, filterModule, filterStatus, filterDateRange]);

  // Stats
  const stats = useMemo(() => ({
    total: history.length,
    success: history.filter(h => h.status === 'success').length,
    failed: history.filter(h => h.status === 'failed').length,
    processing: history.filter(h => h.status === 'processing').length,
    today: history.filter(h => {
      const d = new Date(h.generated_at);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }).length
  }), [history]);

  const getStatusIcon = (status) => {
    if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'failed') return <XCircle className="h-4 w-4 text-red-500" />;
    if (status === 'processing') return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
    return <AlertCircle className="h-4 w-4 text-gray-500" />;
  };

  const getStatusBadge = (status) => {
    const colors = {
      success: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
      processing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/super-admin/dashboard')}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Report History</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View and download previously generated reports
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchHistory} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <History className="h-5 w-5 text-gray-600 dark:text-gray-300" />
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
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.success}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Success</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.processing}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Processing</p>
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
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.today}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Today</p>
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
                  placeholder="Search reports or users..."
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
              <option value="custom">Custom Reports</option>
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
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="processing">Processing</option>
            </select>

            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Report</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Module</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Generated</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Format</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Records</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {getFormatIcon(item.format)}
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{item.report_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.template_key}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                        {item.module === 'custom' ? 'Custom' : REPORT_MODULES[item.module]?.name || item.module}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{formatDateTime(item.generated_at)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{getRelativeDate(item.generated_at)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{item.generated_by}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600 dark:text-gray-300 uppercase font-medium">{item.format}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {item.records_count !== null ? item.records_count.toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {item.file_size || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <Badge className={getStatusBadge(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {item.status === 'success' && item.download_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadReport(item)}
                            title="Download"
                          >
                            <Download className="h-4 w-4 text-blue-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteHistory(item.id)}
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

            {filteredHistory.length === 0 && (
              <div className="text-center py-12">
                <History className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No Report History</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Generated reports will appear here
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportHistory;
