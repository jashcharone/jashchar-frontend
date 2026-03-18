/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI EVALUATION AUDIT LOGS
 * View audit trail for AI evaluation sessions and paper changes
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Shield,
  ArrowLeft,
  Clock,
  User,
  FileText,
  Eye,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '@/services/api';
import { useBranch } from '@/contexts/BranchContext';
import { formatDateTime } from '@/utils/dateUtils';

const ACTION_ICONS = {
  session_created: FileText,
  papers_uploaded: Upload,
  ocr_started: Eye,
  ocr_completed: CheckCircle,
  ai_evaluation_started: Eye,
  ai_evaluation_completed: CheckCircle,
  question_reviewed: CheckCircle,
  marks_modified: AlertTriangle,
  marks_approved: CheckCircle,
  marks_submitted: CheckCircle,
  session_finalized: Shield,
  session_cancelled: XCircle
};

const ACTION_COLORS = {
  session_created: 'text-blue-400 bg-blue-500/10',
  papers_uploaded: 'text-green-400 bg-green-500/10',
  ocr_started: 'text-yellow-400 bg-yellow-500/10',
  ocr_completed: 'text-green-400 bg-green-500/10',
  ai_evaluation_started: 'text-purple-400 bg-purple-500/10',
  ai_evaluation_completed: 'text-green-400 bg-green-500/10',
  question_reviewed: 'text-blue-400 bg-blue-500/10',
  marks_modified: 'text-orange-400 bg-orange-500/10',
  marks_approved: 'text-green-400 bg-green-500/10',
  marks_submitted: 'text-emerald-400 bg-emerald-500/10',
  session_finalized: 'text-green-400 bg-green-500/10',
  session_cancelled: 'text-red-400 bg-red-500/10'
};

const AuditLogs = () => {
  const { sessionId } = useParams();
  const { selectedBranch } = useBranch();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      if (!selectedBranch?.id || !sessionId) return;
      
      try {
        setLoading(true);
        const params = new URLSearchParams({
          branch_id: selectedBranch.id,
          page: pagination.page,
          limit: 50
        });
        if (filterAction) params.append('action', filterAction);

        const response = await api.get(`/ai-evaluation/sessions/${sessionId}/audit-logs?${params.toString()}`);
        
        if (response?.success) {
          setLogs(response.data || []);
          if (response.pagination) {
            setPagination(prev => ({ ...prev, ...response.pagination }));
          }
        }
      } catch (error) {
        console.error('Error fetching audit logs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, [selectedBranch?.id, sessionId, pagination.page, filterAction]);

  const uniqueActions = [...new Set(logs.map(l => l.action_type))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link 
            to={`/super-admin/ai-evaluation/sessions/${sessionId}`}
            className="flex items-center gap-1 text-gray-400 hover:text-white mb-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Session
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="w-7 h-7 text-blue-400" />
            Audit Logs
          </h1>
          <p className="text-gray-400 mt-1">Complete audit trail for this evaluation session</p>
        </div>

        {/* Filter */}
        <select
          value={filterAction}
          onChange={(e) => {
            setFilterAction(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Actions</option>
          {uniqueActions.map(action => (
            <option key={action} value={action}>
              {action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {/* Logs */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 border border-gray-700 rounded-xl">
          <Shield className="w-12 h-12 mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">No audit logs found</p>
        </div>
      ) : (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-700/50">
            {logs.map((log) => {
              const Icon = ACTION_ICONS[log.action_type] || Clock;
              const colorClass = ACTION_COLORS[log.action_type] || 'text-gray-400 bg-gray-500/10';

              return (
                <div key={log.id} className="p-4 hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-white font-medium">
                          {log.action_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </p>
                        <span className="text-gray-500 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(log.performed_at)}
                        </span>
                      </div>
                      {log.action_description && (
                        <p className="text-gray-400 text-sm mt-1">{log.action_description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {(log.user || log.performed_by_name) && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.user ? `${log.user.first_name} ${log.user.last_name}` : log.performed_by_name}
                          </span>
                        )}
                        {log.user_role && (
                          <span className="px-2 py-0.5 bg-gray-700 rounded text-gray-400">{log.user_role}</span>
                        )}
                        {log.paper_id && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Paper: {log.paper_id.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-700">
              <span className="text-sm text-gray-400">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page <= 1}
                  className="p-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
