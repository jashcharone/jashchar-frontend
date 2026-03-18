/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI EVALUATION ANALYTICS
 * Analytics and insights from AI paper evaluation
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Brain,
  Users,
  Clock,
  Target,
  Award,
  AlertCircle,
  FileText,
  Loader2,
  Calendar,
  Filter
} from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';

const AIEvaluationAnalytics = () => {
  const [searchParams] = useSearchParams();
  const { currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  // Fetch analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedBranch?.id) return;
      
      try {
        setLoading(true);
        const params = new URLSearchParams({ time_range: timeRange, branch_id: selectedBranch.id });
        const response = await api.get(`/ai-evaluation/analytics/dashboard?${params.toString()}`);
        
        if (response?.success) {
          setAnalytics(response.data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
        // Use mock data for demo
        setAnalytics({
          summary: {
            totalSessions: 12,
            totalPapers: 456,
            avgProcessingTime: 4.2, // minutes per paper
            avgConfidence: 87,
            timeSaved: 38 // hours
          },
          accuracy: {
            aiAccuracy: 94.2,
            teacherAgreement: 89.5,
            modificationRate: 10.5,
            perfectMatches: 78
          },
          trends: {
            sessions: [5, 8, 12, 15, 18, 12],
            papers: [120, 180, 220, 300, 350, 456],
            accuracy: [88, 90, 91, 93, 94, 94.2]
          },
          topSubjects: [
            { name: 'Mathematics', papers: 120, accuracy: 96 },
            { name: 'Science', papers: 98, accuracy: 93 },
            { name: 'English', papers: 85, accuracy: 91 },
            { name: 'Social Studies', papers: 78, accuracy: 89 },
            { name: 'Hindi', papers: 75, accuracy: 92 }
          ],
          recentSessions: [
            { name: '10th Math Final', papers: 45, accuracy: 95, date: '2026-02-18' },
            { name: '9th Science Mid-Term', papers: 42, accuracy: 92, date: '2026-02-15' },
            { name: '8th English Unit Test', papers: 38, accuracy: 88, date: '2026-02-12' }
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [selectedBranch?.id, timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-blue-400" />
            AI Evaluation Analytics
          </h1>
          <p className="text-gray-400 mt-1">Insights and performance metrics from AI paper evaluation</p>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 3 Months</option>
          <option value="1y">This Year</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{analytics?.summary?.totalSessions || 0}</p>
              <p className="text-sm text-gray-400">Sessions</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{analytics?.summary?.totalPapers || 0}</p>
              <p className="text-sm text-gray-400">Papers</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{analytics?.accuracy?.aiAccuracy || 0}%</p>
              <p className="text-sm text-gray-400">AI Accuracy</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{analytics?.summary?.avgConfidence || 0}%</p>
              <p className="text-sm text-gray-400">Confidence</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-cyan-400">{analytics?.summary?.timeSaved || 0}h</p>
              <p className="text-sm text-gray-400">Time Saved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Accuracy Breakdown */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            Accuracy Breakdown
          </h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">AI Accuracy</span>
                <span className="text-white font-medium">{analytics?.accuracy?.aiAccuracy || 0}%</span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${analytics?.accuracy?.aiAccuracy || 0}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Teacher Agreement</span>
                <span className="text-white font-medium">{analytics?.accuracy?.teacherAgreement || 0}%</span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${analytics?.accuracy?.teacherAgreement || 0}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Perfect Matches</span>
                <span className="text-white font-medium">{analytics?.accuracy?.perfectMatches || 0}%</span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all"
                  style={{ width: `${analytics?.accuracy?.perfectMatches || 0}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Modification Rate</span>
                <span className="text-white font-medium">{analytics?.accuracy?.modificationRate || 0}%</span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 transition-all"
                  style={{ width: `${analytics?.accuracy?.modificationRate || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Subjects */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Top Subjects by Performance
          </h2>
          
          <div className="space-y-3">
            {analytics?.topSubjects?.map((subject, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{subject.name}</p>
                  <p className="text-sm text-gray-400">{subject.papers} papers evaluated</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">{subject.accuracy}%</p>
                  <p className="text-xs text-gray-500">accuracy</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          Recent Evaluation Sessions
        </h2>
        
        <div className="grid grid-cols-3 gap-4">
          {analytics?.recentSessions?.map((session, index) => (
            <div key={index} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
              <h3 className="font-medium text-white mb-2">{session.name}</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{session.papers} papers</span>
                <span className="text-green-400 font-medium">{session.accuracy}% accuracy</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">{session.date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-400" />
          AI Insights
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <p className="text-white font-medium">Improving Accuracy</p>
              <p className="text-sm text-gray-400">AI accuracy has improved by 6% over the last month as it learns from teacher corrections.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg">
            <Clock className="w-5 h-5 text-cyan-400 mt-0.5" />
            <div>
              <p className="text-white font-medium">Time Efficiency</p>
              <p className="text-sm text-gray-400">Average evaluation time reduced from 5 mins to 2 mins per paper with AI assistance.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg">
            <Target className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-white font-medium">High Confidence</p>
              <p className="text-sm text-gray-400">87% of evaluations have confidence score above 85%, indicating reliable assessments.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <p className="text-white font-medium">Review Recommendation</p>
              <p className="text-sm text-gray-400">Consider reviewing essays and long answers more carefully - they have higher modification rates.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIEvaluationAnalytics;
