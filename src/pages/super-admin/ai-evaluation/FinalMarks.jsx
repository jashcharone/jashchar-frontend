/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FINAL MARKS
 * View and export final marks after review
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Award,
  Download,
  Search,
  Filter,
  Check,
  AlertCircle,
  FileText,
  Users,
  BarChart3,
  Loader2,
  Upload,
  Printer
} from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { useBranch } from '@/contexts/BranchContext';
import { formatDate } from '@/utils/dateUtils';

const FinalMarks = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { selectedBranch } = useBranch();
  
  const [marks, setMarks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(searchParams.get('session') || '');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedBranch?.id) return;
      try {
        const params = new URLSearchParams({ status: 'completed', branch_id: selectedBranch.id });
        const response = await api.get(`/ai-evaluation/sessions?${params.toString()}`);
        if (response.data?.success) {
          setSessions(response.data.data || []);
          
          // Auto-select first session if none selected
          if (!selectedSession && response.data.data?.length > 0) {
            setSelectedSession(response.data.data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };
    
    fetchSessions();
  }, [selectedBranch?.id]);

  // Fetch final marks
  useEffect(() => {
    const fetchMarks = async () => {
      if (!selectedSession) {
        setMarks([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await api.get(`/ai-evaluation/sessions/${selectedSession}/final-marks`);
        if (response.data?.success) {
          setMarks(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching marks:', error);
        toast({ variant: 'destructive', title: 'Failed to load final marks' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMarks();
  }, [selectedSession]);

  // Export to Excel
  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await api.get(`/ai-evaluation/sessions/${selectedSession}/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `marks_${selectedSession}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({ title: 'Marks exported successfully!' });
    } catch (error) {
      console.error('Export error:', error);
      toast({ variant: 'destructive', title: 'Failed to export marks' });
    } finally {
      setExporting(false);
    }
  };

  // Sync to Exam Module
  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await api.post(`/ai-evaluation/sessions/${selectedSession}/sync-to-exam`);
      
      if (response.data?.success) {
        toast({ title: `${response.data.data.synced} marks synced to exam module!` });
      } else {
        throw new Error(response.data?.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({ variant: 'destructive', title: 'Failed to sync marks to exam module' });
    } finally {
      setSyncing(false);
    }
  };

  // Get session info
  const currentSession = sessions.find(s => s.id === selectedSession);

  // Filter marks
  const filteredMarks = marks.filter(m => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      m.student_name?.toLowerCase().includes(searchLower) ||
      m.roll_number?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate stats
  const stats = marks.length > 0 ? {
    total: marks.length,
    passed: marks.filter(m => m.final_marks >= (currentSession?.passing_marks || 33)).length,
    highest: Math.max(...marks.map(m => m.final_marks)),
    average: (marks.reduce((sum, m) => sum + m.final_marks, 0) / marks.length).toFixed(1)
  } : { total: 0, passed: 0, highest: 0, average: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Award className="w-7 h-7 text-yellow-400" />
            Final Marks
          </h1>
          <p className="text-gray-400 mt-1">View and export finalized marks after teacher review</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting || marks.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export Excel
          </button>
          
          <button
            onClick={handleSync}
            disabled={syncing || marks.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Sync to Exams
          </button>
        </div>
      </div>

      {/* Session Selector */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">Select Session</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">-- Select Evaluation Session --</option>
              {sessions.map(session => (
                <option key={session.id} value={session.id}>
                  {session.evaluation_name} ({formatDate(session.created_at)})
                </option>
              ))}
            </select>
          </div>
          
          {currentSession && (
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Session Info</label>
              <div className="px-4 py-2 bg-gray-700/50 rounded-lg">
                <p className="text-white">{currentSession.class_name} - {currentSession.subject_name}</p>
                <p className="text-sm text-gray-400">Total: {currentSession.total_marks} | Pass: {currentSession.passing_marks}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {marks.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-gray-400">Total Students</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-xl font-bold text-green-400">{stats.passed}</p>
                <p className="text-sm text-gray-400">Passed ({((stats.passed/stats.total)*100).toFixed(0)}%)</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-xl font-bold text-yellow-400">{stats.highest}</p>
                <p className="text-sm text-gray-400">Highest Score</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-xl font-bold text-purple-400">{stats.average}</p>
                <p className="text-sm text-gray-400">Average Score</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name or roll number..."
          className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>

      {/* Marks Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : !selectedSession ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Select a Session</h3>
            <p className="text-gray-400">Choose an evaluation session to view final marks.</p>
          </div>
        ) : filteredMarks.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Marks Found</h3>
            <p className="text-gray-400">No finalized marks available for this session.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Student</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">AI Marks</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Teacher Marks</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Final</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredMarks.map((mark, index) => (
                <tr key={mark.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-white">{mark.student_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-400">{mark.roll_number || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-blue-400 font-medium">{mark.ai_marks || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-purple-400 font-medium">
                      {mark.teacher_marks !== null ? mark.teacher_marks : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xl font-bold text-white">{mark.final_marks || 0}</span>
                    <span className="text-gray-400 text-sm">/{currentSession?.total_marks || 100}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {mark.final_marks >= (currentSession?.passing_marks || 33) ? (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Pass</span>
                    ) : (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">Fail</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FinalMarks;
