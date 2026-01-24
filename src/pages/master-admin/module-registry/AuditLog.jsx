/**
 * AUDIT LOG PAGE
 * View all module registry activities
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  User,
  Plus,
  Edit,
  Trash2,
  RefreshCcw,
  Zap,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  ShieldAlert,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import moduleRegistryApiService from '@/services/moduleRegistryApiService';
import DashboardLayout from '@/components/DashboardLayout';

const ACTION_ICONS = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  sync: RefreshCcw,
  rollback: RefreshCcw,
  bulk_sync: Zap
};

const ACTION_STYLES = {
  create: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  sync: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  rollback: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  bulk_sync: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
};

const AuditLog = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    action: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [pagination.page, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      const res = await moduleRegistryApiService.getAuditLog(params);
      setLogs(res.data?.logs || res.data || []);
      
      if (res.data?.pagination) {
        setPagination(prev => ({
          ...prev,
          total: res.data.pagination.total,
          totalPages: res.data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error loading audit log:', error);
      toast({ title: 'Failed to load Audit Log', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      search: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const exportToCSV = () => {
    if (logs.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    const headers = ['Date', 'Action', 'Module', 'User', 'Details'];
    const rows = logs.map(log => [
      formatDate(log.created_at),
      log.action,
      log.module_slug || '-',
      log.performed_by || 'System',
      JSON.stringify(log.changes || {})
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `module_audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: 'Export downloaded successfully' });
  };

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-slate-50/50 dark:bg-black/20 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <button
               onClick={() => navigate('/master-admin/module-registry')}
               className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-2 transition-colors"
            >
               <ArrowLeft className="w-4 h-4" />
               <span>Back to Registry</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              Security Audit Log
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
               Comprehensive trail of all modifications, syncs, and access events in the Module Registry.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="relative group">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2.5 border rounded-xl flex items-center gap-2 transition-all ${
                     showFilters 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300' 
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters</span>
                  {(filters.action || filters.search) && (
                     <span className="flex h-2 w-2 rounded-full bg-indigo-600"></span>
                  )}
                </button>
             </div>

            <button
              onClick={exportToCSV}
              className="px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 animate-in slide-in-from-top-2 duration-200">
             <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Filter Activity</h3>
                <button onClick={clearFilters} className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">Reset All</button>
             </div>
             
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               {/* Search */}
               <div className="relative col-span-1 md:col-span-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                     type="text"
                     placeholder="Search module name, user, or details..."
                     value={filters.search}
                     onChange={(e) => handleFilterChange('search', e.target.value)}
                     className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
               </div>

               {/* Action Type */}
               <div>
                  <select
                     value={filters.action}
                     onChange={(e) => handleFilterChange('action', e.target.value)}
                     className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
                  >
                     <option value="">All Actions</option>
                     <option value="create">Create</option>
                     <option value="update">Update</option>
                     <option value="delete">Delete</option>
                     <option value="sync">Sync</option>
                     <option value="bulk_sync">Bulk Sync</option>
                     <option value="rollback">Rollback</option>
                  </select>
               </div>

               {/* Date Range Placeholders (Simplified for UI) */}
               <div className="flex gap-2">
                   <input 
                     type="date" 
                     className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                     value={filters.dateFrom}
                     onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                   />
               </div>
            </div>
          </div>
        )}

        {/* Logs Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
           {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                 <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mb-2" />
                 <p className="text-gray-500 text-sm">Loading records...</p>
              </div>
           ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                 <FileText className="w-12 h-12 mb-3 opacity-20" />
                 <p>No audit records found matching your filters</p>
              </div>
           ) : (
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                   <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 font-medium">
                      <tr>
                         <th className="px-6 py-4">Timestamp</th>
                         <th className="px-6 py-4">Action</th>
                         <th className="px-6 py-4">Module / Entity</th>
                         <th className="px-6 py-4">Performed By</th>
                         <th className="px-6 py-4">Details</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {logs.map((log) => {
                         const Icon = ACTION_ICONS[log.action] || FileText;
                         const style = ACTION_STYLES[log.action] || 'bg-gray-100 text-gray-700 border-gray-200';
                         
                         return (
                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                               <td className="px-6 py-4 text-gray-500 whitespace-nowrap font-mono text-xs">
                                  {formatDate(log.created_at)}
                               </td>
                               <td className="px-6 py-4">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style} bg-opacity-50`}>
                                     <Icon className="w-3 h-3" />
                                     <span className="capitalize">{log.action?.replace('_', ' ')}</span>
                                  </span>
                               </td>
                               <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                  {log.module_slug || <span className="text-gray-400 italic">System</span>}
                               </td>
                               <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                  <div className="flex items-center gap-2">
                                     <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                                        {(log.performed_by || 'S').charAt(0).toUpperCase()}
                                     </div>
                                     <span>{log.performed_by || 'System'}</span>
                                  </div>
                               </td>
                               <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                                   <span title={JSON.stringify(log.changes)}>
                                       {JSON.stringify(log.changes || {})}
                                   </span>
                               </td>
                            </tr>
                         );
                      })}
                   </tbody>
                </table>
             </div>
           )}
           
           {/* Pagination */}
           {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                 <span className="text-xs text-gray-500">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                 </span>
                 <div className="flex gap-2">
                    <button
                       onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                       disabled={pagination.page === 1}
                       className="p-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                       <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                       onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                       disabled={pagination.page >= pagination.totalPages}
                       className="p-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                       <ChevronRight className="w-4 h-4" />
                    </button>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default AuditLog;
