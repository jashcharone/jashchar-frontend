/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TEACHER REVIEW - Enhanced Day 6 Version
 * Review and approve AI-evaluated papers with bulk operations
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Filter,
  Search,
  FileText,
  Brain,
  Users,
  AlertTriangle,
  Loader2,
  ChevronRight,
  CheckSquare,
  Square,
  RefreshCw,
  Download,
  Zap,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { useBranch } from '@/contexts/BranchContext';
import { formatDate } from '@/utils/dateUtils';
import BulkApprovalModal from './components/BulkApprovalModal';

const TeacherReview = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { selectedBranch } = useBranch();
  
  const [papers, setPapers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    session_id: searchParams.get('session') || '',
    status: searchParams.get('status') || 'pending',
    search: ''
  });

  // Enhanced state for bulk operations
  const [selectedPapers, setSelectedPapers] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch sessions for filter
  useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedBranch?.id) return;
      try {
        const params = new URLSearchParams({ status: 'review,processing', branch_id: selectedBranch.id });
        const response = await api.get(`/ai-evaluation/sessions?${params.toString()}`);
        if (response?.success) {
          setSessions(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };
    
    fetchSessions();
  }, [selectedBranch?.id]);

  // Fetch papers for review
  useEffect(() => {
    const fetchPapers = async () => {
      if (!selectedBranch?.id) return;
      try {
        setLoading(true);
        const params = new URLSearchParams({ ...filters, branch_id: selectedBranch.id });
        const response = await api.get(`/ai-evaluation/review/papers?${params.toString()}`);
        if (response?.success) {
          setPapers(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching papers:', error);
        toast({ variant: 'destructive', title: 'Failed to load papers for review' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPapers();
  }, [filters, selectedBranch?.id]);

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pending Review' },
      approved: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Approved' },
      modified: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Modified' },
      rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Rejected' }
    };
    
    const badge = badges[status] || badges.pending;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  // Stats
  const stats = {
    total: papers.length,
    pending: papers.filter(p => p.review_status === 'pending').length,
    approved: papers.filter(p => p.review_status === 'approved').length,
    modified: papers.filter(p => p.review_status === 'modified').length
  };

  // Advanced stats with confidence breakdown
  const advancedStats = useMemo(() => {
    const highConfidence = papers.filter(p => (p.ai_confidence || 0) >= 85);
    const mediumConfidence = papers.filter(p => (p.ai_confidence || 0) >= 60 && (p.ai_confidence || 0) < 85);
    const lowConfidence = papers.filter(p => (p.ai_confidence || 0) < 60);
    const avgConfidence = papers.length > 0
      ? Math.round(papers.reduce((sum, p) => sum + (p.ai_confidence || 0), 0) / papers.length)
      : 0;
    
    return { highConfidence, mediumConfidence, lowConfidence, avgConfidence };
  }, [papers]);

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedPapers.length === papers.length) {
      setSelectedPapers([]);
    } else {
      setSelectedPapers(papers.map(p => p.id));
    }
  };

  const toggleSelectPaper = (paperId) => {
    setSelectedPapers(prev =>
      prev.includes(paperId)
        ? prev.filter(id => id !== paperId)
        : [...prev, paperId]
    );
  };

  // Refresh papers
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/ai-evaluation/review/papers?${params.toString()}`);
      if (response?.success) {
        setPapers(response.data || []);
        setSelectedPapers([]);
        toast({ title: 'Papers refreshed' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to refresh' });
    } finally {
      setRefreshing(false);
    }
  };

  // Export selected papers
  const handleExportSelected = () => {
    const selectedData = papers.filter(p => selectedPapers.includes(p.id));
    const csvContent = [
      ['Student Name', 'Roll Number', 'AI Score', 'Max Marks', 'Confidence', 'Status'].join(','),
      ...selectedData.map(p => [
        p.student_name || 'Unknown',
        p.roll_number || '-',
        p.ai_total_marks || 0,
        p.max_marks || 100,
        `${p.ai_confidence || 0}%`,
        p.review_status || 'pending'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `review_papers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported to CSV' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Eye className="w-7 h-7 text-purple-400" />
            Teacher Review
          </h1>
          <p className="text-gray-400 mt-1">Review and approve AI-evaluated answer papers</p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          {selectedPapers.length > 0 && (
            <>
              <button
                onClick={handleExportSelected}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm"
              >
                <Download className="w-4 h-4" />
                Export ({selectedPapers.length})
              </button>
              
              <button
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-medium"
              >
                <Zap className="w-4 h-4" />
                Bulk Approve ({selectedPapers.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-gray-400">Total Papers</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-xl font-bold text-yellow-400">{stats.pending}</p>
              <p className="text-sm text-gray-400">Pending</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-xl font-bold text-green-400">{stats.approved}</p>
              <p className="text-sm text-gray-400">Approved</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-xl font-bold text-blue-400">{stats.modified}</p>
              <p className="text-sm text-gray-400">Modified</p>
            </div>
          </div>
        </div>
      </div>

      {/* Confidence Distribution */}
      {papers.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            AI Confidence Distribution
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex h-4 rounded-full overflow-hidden bg-gray-700">
                <div
                  className="bg-green-500 transition-all"
                  style={{ width: `${(advancedStats.highConfidence.length / papers.length) * 100}%` }}
                  title={`High (≥85%): ${advancedStats.highConfidence.length}`}
                />
                <div
                  className="bg-yellow-500 transition-all"
                  style={{ width: `${(advancedStats.mediumConfidence.length / papers.length) * 100}%` }}
                  title={`Medium (60-84%): ${advancedStats.mediumConfidence.length}`}
                />
                <div
                  className="bg-red-500 transition-all"
                  style={{ width: `${(advancedStats.lowConfidence.length / papers.length) * 100}%` }}
                  title={`Low (<60%): ${advancedStats.lowConfidence.length}`}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-gray-400">High: {advancedStats.highConfidence.length}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="text-gray-400">Medium: {advancedStats.mediumConfidence.length}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-gray-400">Low: {advancedStats.lowConfidence.length}</span>
              </span>
              <span className="text-purple-400 font-medium">
                Avg: {advancedStats.avgConfidence}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search by student name or roll number..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
          
          <select
            value={filters.session_id}
            onChange={(e) => setFilters({ ...filters, session_id: e.target.value })}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Sessions</option>
            {sessions.map(session => (
              <option key={session.id} value={session.id}>{session.evaluation_name}</option>
            ))}
          </select>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Status</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="modified">Modified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Papers List */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : papers.length === 0 ? (
          <div className="text-center py-12">
            <Eye className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Papers for Review</h3>
            <p className="text-gray-400">All papers have been reviewed or no papers match your filters.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700/50">
                <th className="text-left px-4 py-3">
                  <button
                    onClick={toggleSelectAll}
                    className="text-gray-400 hover:text-white"
                  >
                    {selectedPapers.length === papers.length && papers.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Student</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Session</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">AI Score</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Confidence</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {papers.map(paper => (
                <tr key={paper.id} className={`hover:bg-gray-700/30 transition-colors ${selectedPapers.includes(paper.id) ? 'bg-blue-500/10' : ''}`}>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleSelectPaper(paper.id)}
                      className="text-gray-400 hover:text-white"
                    >
                      {selectedPapers.includes(paper.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{paper.student_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-400">{paper.roll_number || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white text-sm">{paper.evaluation_name || '-'}</p>
                    <p className="text-gray-400 text-xs">{formatDate(paper.evaluated_at)}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xl font-bold text-white">
                      {paper.ai_total_marks || 0}
                    </span>
                    <span className="text-gray-400 text-sm">/{paper.max_marks || 100}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            paper.ai_confidence >= 80 ? 'bg-green-500' :
                            paper.ai_confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${paper.ai_confidence || 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400">{paper.ai_confidence || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(paper.review_status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/super-admin/ai-evaluation/review/${paper.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Review
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bulk Approval Modal */}
      <BulkApprovalModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        papers={papers.filter(p => selectedPapers.includes(p.id))}
        sessionId={filters.session_id}
        onSuccess={() => {
          handleRefresh();
          setSelectedPapers([]);
        }}
      />
    </div>
  );
};

export default TeacherReview;
