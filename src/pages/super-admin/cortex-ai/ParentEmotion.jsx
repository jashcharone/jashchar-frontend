/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PARENT EMOTION DASHBOARD - Parent Sentiment Analysis
 * "India's First Thinking ERP - Cortex AI"
 * ═══════════════════════════════════════════════════════════════════════════════
 * Features:
 * - Parent satisfaction analysis
 * - TC risk indicator detection
 * - Complaint sentiment analysis
 * - Parent engagement tracking
 */

import React, { useState, useEffect } from 'react';
import { 
  Heart, AlertTriangle, TrendingUp, TrendingDown, Users,
  MessageCircle, ThumbsUp, ThumbsDown, AlertCircle, RefreshCw,
  Phone, Mail, Calendar, Search, Filter
} from 'lucide-react';
import api from '@/services/api';
import { formatDate } from '@/utils/dateUtils';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ParentEmotion = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [emotionData, setEmotionData] = useState(null);
  const [riskParents, setRiskParents] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30days');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEmotionData();
  }, [selectedTimeRange]);

  const fetchEmotionData = async () => {
    setLoading(true);
    try {
      const [overviewRes, riskRes] = await Promise.all([
        api.get(`/cortex/emotion/overview?period=${selectedTimeRange}`),
        api.get('/cortex/emotion/risk')
      ]);
      setEmotionData(overviewRes.data.data);
      setRiskParents(riskRes.data.data || []);
    } catch (error) {
      console.error('Error fetching emotion data:', error);
      // Mock data
      setEmotionData({
        avgSatisfaction: 78,
        totalParents: 450,
        satisfiedCount: 320,
        neutralCount: 90,
        dissatisfiedCount: 40,
        trend: 5,
        riskCount: 12,
        complaintSentiment: {
          positive: 65,
          neutral: 25,
          negative: 10
        },
        engagementRate: 72,
        recentFeedback: [
          { parent: 'Parent A', sentiment: 'positive', feedback: 'Excellent teaching quality', date: '2026-03-01' },
          { parent: 'Parent B', sentiment: 'negative', feedback: 'Fee structure concern', date: '2026-03-01' },
          { parent: 'Parent C', sentiment: 'neutral', feedback: 'Average facilities', date: '2026-02-28' }
        ]
      });
      setRiskParents([
        { id: 1, parentName: 'Rajesh Kumar', studentName: 'Arjun K', class: '8th A', riskScore: 85, indicators: ['Multiple fee delays', 'TC inquiry'], lastContact: '2026-02-20' },
        { id: 2, parentName: 'Priya Sharma', studentName: 'Sneha S', class: '5th B', riskScore: 72, indicators: ['3 complaints this month', 'Low engagement'], lastContact: '2026-02-25' },
        { id: 3, parentName: 'Mohammed Ali', studentName: 'Ayesha A', class: '10th A', riskScore: 68, indicators: ['Attendance discussion', 'Transport complaint'], lastContact: '2026-02-28' }
      ]);
    }
    setLoading(false);
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment === 'positive') return 'text-green-500 bg-green-500/10';
    if (sentiment === 'negative') return 'text-red-500 bg-red-500/10';
    return 'text-yellow-500 bg-yellow-500/10';
  };

  const getRiskColor = (score) => {
    if (score >= 80) return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (score >= 60) return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
  };

  const filteredRiskParents = riskParents.filter(p => 
    p.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-pink-600/20 flex items-center justify-center animate-pulse">
            <Heart className="w-6 h-6 text-pink-400" />
          </div>
          <p className="text-gray-400">Analyzing parent sentiments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-red-600 rounded-xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Parent Emotion Dashboard</h1>
            <p className="text-sm text-gray-400">Sentiment Analysis ≫ Risk Detection ≫ Engagement Tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 3 months</option>
          </select>
          <button 
            onClick={fetchEmotionData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Satisfaction Score */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30">
          <div className="flex items-center justify-between mb-4">
            <ThumbsUp className="w-8 h-8 text-green-500" />
            <div className="flex items-center gap-1">
              <span className="text-3xl font-bold text-green-400">{emotionData?.avgSatisfaction || 0}%</span>
              {emotionData?.trend > 0 && <TrendingUp className="w-5 h-5 text-green-400" />}
            </div>
          </div>
          <h3 className="text-gray-900 dark:text-white font-medium">Avg Satisfaction</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {emotionData?.trend > 0 ? `+${emotionData.trend}%` : `${emotionData?.trend}%`} from last month
          </p>
        </div>

        {/* Total Parents */}
        <div className="p-6 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-400" />
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{emotionData?.totalParents || 0}</span>
          </div>
          <h3 className="text-gray-900 dark:text-white font-medium">Active Parents</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Engaged in communication</p>
        </div>

        {/* Risk Alerts */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-500/30">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <span className="text-3xl font-bold text-red-400">{emotionData?.riskCount || 0}</span>
          </div>
          <h3 className="text-gray-900 dark:text-white font-medium">TC Risk Alerts</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Require immediate attention</p>
        </div>

        {/* Engagement Rate */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <MessageCircle className="w-8 h-8 text-purple-400" />
            <span className="text-3xl font-bold text-purple-400">{emotionData?.engagementRate || 0}%</span>
          </div>
          <h3 className="text-gray-900 dark:text-white font-medium">Engagement Rate</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Response & participation</p>
        </div>
      </div>

      {/* Sentiment Distribution & Complaint Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" />
            Parent Sentiment Distribution
          </h3>
          
          <div className="space-y-4">
            {/* Satisfied */}
            <div className="flex items-center gap-4">
              <div className="w-24 text-right">
                <span className="text-green-400 font-medium">Satisfied</span>
              </div>
              <div className="flex-1 h-8 bg-gray-700 rounded-lg overflow-hidden">
                <div 
                  className="h-full bg-green-500 flex items-center justify-end pr-2"
                  style={{ width: `${(emotionData?.satisfiedCount / emotionData?.totalParents * 100) || 0}%` }}
                >
                  <span className="text-sm font-medium text-white">{emotionData?.satisfiedCount || 0}</span>
                </div>
              </div>
            </div>
            
            {/* Neutral */}
            <div className="flex items-center gap-4">
              <div className="w-24 text-right">
                <span className="text-yellow-400 font-medium">Neutral</span>
              </div>
              <div className="flex-1 h-8 bg-gray-700 rounded-lg overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 flex items-center justify-end pr-2"
                  style={{ width: `${(emotionData?.neutralCount / emotionData?.totalParents * 100) || 0}%` }}
                >
                  <span className="text-sm font-medium text-white">{emotionData?.neutralCount || 0}</span>
                </div>
              </div>
            </div>
            
            {/* Dissatisfied */}
            <div className="flex items-center gap-4">
              <div className="w-24 text-right">
                <span className="text-red-400 font-medium">Dissatisfied</span>
              </div>
              <div className="flex-1 h-8 bg-gray-700 rounded-lg overflow-hidden">
                <div 
                  className="h-full bg-red-500 flex items-center justify-end pr-2"
                  style={{ width: `${(emotionData?.dissatisfiedCount / emotionData?.totalParents * 100) || 0}%` }}
                >
                  <span className="text-sm font-medium text-white">{emotionData?.dissatisfiedCount || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Complaint Sentiment */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Complaint Response Sentiment</h4>
            <div className="flex gap-2">
              <div className="flex-1 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                <span className="text-2xl font-bold text-green-400">{emotionData?.complaintSentiment?.positive || 0}%</span>
                <p className="text-xs text-gray-400 mt-1">Positive</p>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
                <span className="text-2xl font-bold text-yellow-400">{emotionData?.complaintSentiment?.neutral || 0}%</span>
                <p className="text-xs text-gray-400 mt-1">Neutral</p>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                <span className="text-2xl font-bold text-red-400">{emotionData?.complaintSentiment?.negative || 0}%</span>
                <p className="text-xs text-gray-400 mt-1">Negative</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Feedback */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            Recent Parent Feedback
          </h3>
          <div className="space-y-3">
            {emotionData?.recentFeedback?.map((feedback, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-gray-900/50 border border-gray-700">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-white">{feedback.parent}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSentimentColor(feedback.sentiment)}`}>
                    {feedback.sentiment}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{feedback.feedback}</p>
                <p className="text-xs text-gray-500 mt-2">{formatDate(feedback.date)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Parents Table */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            TC Risk Indicator Parents
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search parent or student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Parent</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Student</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Class</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Risk Score</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Indicators</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Last Contact</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRiskParents.map((parent) => (
                <tr key={parent.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-3 px-4">
                    <span className="text-white font-medium">{parent.parentName}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{parent.studentName}</td>
                  <td className="py-3 px-4 text-gray-300">{parent.class}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(parent.riskScore)}`}>
                      {parent.riskScore}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {parent.indicators.map((ind, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">
                          {ind}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {formatDate(parent.lastContact)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors">
                        <Phone className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400 transition-colors">
                        <Calendar className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRiskParents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-600" />
            <p>No risk indicators found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentEmotion;
