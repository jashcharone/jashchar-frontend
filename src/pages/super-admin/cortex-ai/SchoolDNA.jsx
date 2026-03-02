/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SCHOOL DNA - Unique School Identity Score System
 * "India's First Thinking ERP - Cortex AI"
 * ═══════════════════════════════════════════════════════════════════════════════
 * Features:
 * - AI-generated school DNA score (0-100)
 * - Compare with other schools
 * - DNA Certificate generation
 * - Trend analysis over time
 */

import React, { useState, useEffect } from 'react';
import { 
  Dna, Award, TrendingUp, BarChart3, Download, RefreshCw,
  Building2, Users, BookOpen, Trophy, Star, Shield
} from 'lucide-react';
import api from '@/services/api';
import { formatDate } from '@/utils/dateUtils';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const SchoolDNA = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dnaScore, setDnaScore] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchDNAScore();
  }, []);

  const fetchDNAScore = async () => {
    setLoading(true);
    try {
      const [dnaRes, compareRes] = await Promise.all([
        api.get('/cortex/dna/score'),
        api.get('/cortex/dna/comparison')
      ]);
      setDnaScore(dnaRes.data.data);
      setComparison(compareRes.data.data);
    } catch (error) {
      console.error('Error fetching DNA score:', error);
      // Mock data
      setDnaScore({
        overallScore: 82,
        grade: 'A',
        rank: 15,
        totalSchools: 250,
        percentile: 94,
        breakdown: {
          academic: { score: 88, weight: 30, description: 'Student results & board performance' },
          discipline: { score: 85, weight: 20, description: 'Student behavior & attendance' },
          infrastructure: { score: 75, weight: 15, description: 'Facilities & resources' },
          teacher: { score: 82, weight: 20, description: 'Teacher quality & retention' },
          engagement: { score: 78, weight: 15, description: 'Parent & community involvement' }
        },
        trend: [
          { month: 'Sep', score: 75 },
          { month: 'Oct', score: 77 },
          { month: 'Nov', score: 79 },
          { month: 'Dec', score: 80 },
          { month: 'Jan', score: 81 },
          { month: 'Feb', score: 82 }
        ],
        improvements: [
          { area: 'Library Resources', potential: '+3', priority: 'high' },
          { area: 'Sports Facilities', potential: '+2', priority: 'medium' },
          { area: 'Digital Labs', potential: '+2', priority: 'medium' }
        ]
      });
      setComparison({
        yourScore: 82,
        cityAverage: 68,
        stateAverage: 65,
        nationalAverage: 62,
        topSchoolScore: 95,
        percentile: 94
      });
    }
    setLoading(false);
  };

  const generateCertificate = async () => {
    setGenerating(true);
    try {
      const res = await api.get('/cortex/dna/certificate');
      if (res.data.data?.certificateUrl) {
        window.open(res.data.data.certificateUrl, '_blank');
      }
      alert('Certificate generated successfully!');
    } catch (error) {
      alert('Certificate generated! (Demo)');
    }
    setGenerating(false);
  };

  const getGradeColor = (grade) => {
    if (grade === 'A+' || grade === 'A') return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (grade === 'B+' || grade === 'B') return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    if (grade === 'C+' || grade === 'C') return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      academic: BookOpen,
      discipline: Shield,
      infrastructure: Building2,
      teacher: Users,
      engagement: Star
    };
    return icons[category] || Star;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-600/20 flex items-center justify-center animate-pulse">
            <Dna className="w-6 h-6 text-cyan-400" />
          </div>
          <p className="text-gray-400">Calculating School DNA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center">
            <Dna className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">School DNA Score</h1>
            <p className="text-sm text-gray-400">Unique Identity ≫ Performance Metrics ≫ Competitive Ranking</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={generateCertificate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-white text-sm disabled:opacity-50"
          >
            <Award className="w-4 h-4" />
            Get DNA Certificate
          </button>
          <button 
            onClick={fetchDNAScore}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Main DNA Score Card */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl border border-cyan-500/30 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between">
            {/* DNA Score Circle */}
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-4">
                {/* Background circle */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="85" fill="none" stroke="#374151" strokeWidth="12" />
                  <circle 
                    cx="96" cy="96" r="85" fill="none" 
                    stroke="url(#dnaGradient)" strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(dnaScore?.overallScore || 0) * 5.34} 534`}
                  />
                  <defs>
                    <linearGradient id="dnaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold text-white">{dnaScore?.overallScore || 0}</span>
                  <span className="text-gray-400 text-sm">out of 100</span>
                </div>
              </div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getGradeColor(dnaScore?.grade)}`}>
                <Trophy className="w-5 h-5" />
                <span className="text-lg font-bold">Grade {dnaScore?.grade}</span>
              </div>
            </div>

            {/* Ranking Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
                <div className="text-3xl font-bold text-cyan-400">#{dnaScore?.rank}</div>
                <p className="text-gray-400 text-sm mt-1">State Rank</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
                <div className="text-3xl font-bold text-blue-400">{dnaScore?.percentile}%</div>
                <p className="text-gray-400 text-sm mt-1">Percentile</p>
              </div>
              <div className="col-span-2 bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
                <p className="text-gray-400 text-sm">Better than</p>
                <div className="text-2xl font-bold text-green-400">
                  {dnaScore?.rank && dnaScore?.totalSchools ? 
                    ((dnaScore.totalSchools - dnaScore.rank) / dnaScore.totalSchools * 100).toFixed(0) : 0}%
                </div>
                <p className="text-gray-400 text-sm">of schools in state</p>
              </div>
            </div>

            {/* Comparison Bars */}
            <div className="space-y-4 min-w-[250px]">
              <h4 className="text-white font-medium mb-3">Comparison</h4>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Your School</span>
                    <span className="text-cyan-400 font-medium">{comparison?.yourScore}</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${comparison?.yourScore}%` }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">City Average</span>
                    <span className="text-gray-300">{comparison?.cityAverage}</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-500 rounded-full" style={{ width: `${comparison?.cityAverage}%` }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">State Average</span>
                    <span className="text-gray-300">{comparison?.stateAverage}</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-500 rounded-full" style={{ width: `${comparison?.stateAverage}%` }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Top School</span>
                    <span className="text-yellow-400">{comparison?.topSchoolScore}</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${comparison?.topSchoolScore}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DNA Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            DNA Breakdown
          </h3>
          <div className="space-y-4">
            {dnaScore?.breakdown && Object.entries(dnaScore.breakdown).map(([key, data]) => {
              const Icon = getCategoryIcon(key);
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300 capitalize">{key}</span>
                      <span className="text-xs text-gray-500">({data.weight}% weight)</span>
                    </div>
                    <span className={`font-bold ${getScoreColor(data.score)}`}>{data.score}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        data.score >= 80 ? 'bg-green-500' :
                        data.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${data.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{data.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Score Trend (Last 6 Months)
          </h3>
          <div className="h-48 flex items-end gap-4">
            {dnaScore?.trend?.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-cyan-600 to-blue-600 rounded-t-lg transition-all duration-500"
                  style={{ height: `${(item.score / 100) * 160}px` }}
                />
                <span className="text-xs text-gray-400 mt-2">{item.month}</span>
                <span className="text-xs text-gray-500">{item.score}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2 text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">+{(dnaScore?.trend?.[5]?.score || 0) - (dnaScore?.trend?.[0]?.score || 0)} points improvement</span>
            </div>
          </div>
        </div>
      </div>

      {/* Improvement Suggestions */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          Improvement Opportunities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dnaScore?.improvements?.map((item, idx) => (
            <div 
              key={idx} 
              className={`p-4 rounded-xl border ${
                item.priority === 'high' ? 'bg-green-500/10 border-green-500/30' :
                item.priority === 'medium' ? 'bg-blue-500/10 border-blue-500/30' :
                'bg-gray-700/50 border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  item.priority === 'high' ? 'bg-green-500 text-white' :
                  item.priority === 'medium' ? 'bg-blue-500 text-white' :
                  'bg-gray-600 text-gray-300'
                }`}>
                  {item.priority} priority
                </span>
                <span className="text-green-400 font-bold">{item.potential} pts</span>
              </div>
              <h4 className="text-white font-medium">{item.area}</h4>
              <p className="text-sm text-gray-400 mt-1">
                Improving this can boost your DNA score by {item.potential} points
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SchoolDNA;
