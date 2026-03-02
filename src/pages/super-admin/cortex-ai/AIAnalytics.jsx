/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI ANALYTICS - Smart Analytics & Reports
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  GraduationCap,
  IndianRupee,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import api from '@/services/api';

const AIAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Icon mapping from string to component
  const iconMap = {
    Users,
    TrendingUp,
    IndianRupee,
    GraduationCap
  };

  // Fetch analytics data from API
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/cortex/analytics?period=${selectedPeriod}`);
        setAnalyticsData(response.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        // Fallback to demo data
        setAnalyticsData({
          analytics: defaultAnalytics,
          trends: { enrollment: [], fees: [] },
          summary: {}
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedPeriod]);

  // Default analytics data for fallback
  const defaultAnalytics = [
    {
      title: 'Dropout Risk Analysis',
      description: 'AI-predicted students at risk of dropping out',
      value: '12',
      change: '-3',
      changeType: 'positive',
      icon: 'Users',
      color: 'red'
    },
    {
      title: 'Growth Trend',
      description: 'Student enrollment growth prediction',
      value: '+8.5%',
      change: '+2.1%',
      changeType: 'positive',
      icon: 'TrendingUp',
      color: 'green'
    },
    {
      title: 'Fee Collection Forecast',
      description: 'Predicted collection for next month',
      value: '₹12.5L',
      change: '+5%',
      changeType: 'positive',
      icon: 'IndianRupee',
      color: 'blue'
    },
    {
      title: 'Academic Performance',
      description: 'Overall pass rate prediction',
      value: '94%',
      change: '+2%',
      changeType: 'positive',
      icon: 'GraduationCap',
      color: 'purple'
    }
  ];

  const colorClasses = {
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-purple-600" />
            AI Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Smart insights and predictions powered by Cortex AI
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="this_quarter">This Quarter</option>
            <option value="this_year">This Year</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button 
            onClick={() => setSelectedPeriod(selectedPeriod)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Loading analytics...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(analyticsData?.analytics || defaultAnalytics).map((card, index) => {
              const Icon = typeof card.icon === 'string' ? iconMap[card.icon] : card.icon;
              return (
                <div 
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[card.color]}`}>
                      {Icon && <Icon className="w-6 h-6" />}
                    </div>
                    <span className={`flex items-center gap-1 text-sm font-medium ${
                      card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.changeType === 'positive' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {card.change}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {card.value}
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {card.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {card.description}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Charts Section - Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Attendance Trend Analysis
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              Chart will be rendered here
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Fee Collection Forecast
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              Chart will be rendered here
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Tables */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Branch Performance Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Branch</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Students</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Attendance</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Fee Collection</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">AI Score</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Main Campus', students: 1250, attendance: '94%', fees: '89%', score: 85 },
                { name: 'North Branch', students: 890, attendance: '91%', fees: '85%', score: 78 },
                { name: 'South Branch', students: 650, attendance: '88%', fees: '82%', score: 72 }
              ].map((branch, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50">
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{branch.name}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{branch.students}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{branch.attendance}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{branch.fees}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                      branch.score >= 80 ? 'bg-green-100 text-green-700' :
                      branch.score >= 70 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {branch.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AIAnalytics;
