/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * EVALUATION SESSIONS LIST
 * View and manage all AI evaluation sessions
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  FileText,
  Clock,
  Brain,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  Upload,
  RefreshCw
} from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { formatDate } from '@/utils/dateUtils';

const EvaluationSessions = () => {
  const navigate = useNavigate();
  const { currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();
  
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    if (!selectedBranch?.id) return;
    
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append('session_id', currentSessionId);
      params.append('branch_id', selectedBranch.id);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      const response = await api.get(`/ai-evaluation/sessions?${params.toString()}`);
      
      if (response.data?.success) {
        setSessions(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination
        }));
      }
    } catch (error) {
      console.error('[Evaluation Sessions] Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch?.id, currentSessionId, statusFilter, pagination.page]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Status badge
  const StatusBadge = ({ status }) => {
    const configs = {
      draft: { color: 'bg-gray-500/20 text-gray-400', label: 'Draft' },
      in_progress: { color: 'bg-blue-500/20 text-blue-400', label: 'In Progress' },
      evaluated: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Evaluated' },
      reviewed: { color: 'bg-purple-500/20 text-purple-400', label: 'Reviewed' },
      finalized: { color: 'bg-green-500/20 text-green-400', label: 'Finalized' },
      cancelled: { color: 'bg-red-500/20 text-red-400', label: 'Cancelled' }
    };
    const config = configs[status] || configs.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Filter sessions by search
  const filteredSessions = sessions.filter(session =>
    session.session_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.exam_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FolderOpen className="w-7 h-7 text-blue-400" />
            Evaluation Sessions
          </h1>
          <p className="text-gray-400 mt-1">Manage all AI paper evaluation sessions</p>
        </div>
        <button
          onClick={() => navigate('/super-admin/ai-evaluation/sessions/create')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Session
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="in_progress">In Progress</option>
          <option value="evaluated">Evaluated</option>
          <option value="reviewed">Reviewed</option>
          <option value="finalized">Finalized</option>
        </select>
        <button
          onClick={fetchSessions}
          className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sessions Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-400">Loading sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-8 text-center">
            <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">No evaluation sessions found</p>
            <button
              onClick={() => navigate('/super-admin/ai-evaluation/sessions/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Create Your First Session
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Session Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Exam</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Class</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Papers</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filteredSessions.map((session) => (
                <tr 
                  key={session.id} 
                  className="hover:bg-gray-800/50 cursor-pointer"
                  onClick={() => navigate(`/super-admin/ai-evaluation/sessions/${session.id}`)}
                >
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{session.session_name}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{session.exam_name || '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{session.classes?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{session.subjects?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="text-white">{session.evaluated_papers || 0}</span>
                    <span className="text-gray-500">/{session.total_papers || 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={session.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{formatDate(session.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/super-admin/ai-evaluation/sessions/${session.id}`);
                        }}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/super-admin/ai-evaluation/sessions/${session.id}/upload`);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                        title="Upload Papers"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} sessions)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationSessions;
