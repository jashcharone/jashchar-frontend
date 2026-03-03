/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROFIT INTELLIGENCE - Business Analytics Dashboard
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  IndianRupee,
  Users,
  Building2,
  GraduationCap,
  PieChart,
  BarChart3,
  Download,
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import api from '@/services/api';

const ProfitIntelligence = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [profitData, setProfitData] = useState(null);

  // Fetch profit intelligence data
  useEffect(() => {
    const fetchProfitData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/cortex/profit-intelligence?period=${selectedPeriod}`);
        setProfitData(response.data);
      } catch (error) {
        console.error('Failed to fetch profit data:', error);
        // Fallback to demo data
        setProfitData({
          summary: defaultProfitSummary,
          classProfitData: defaultClassProfitData,
          branchData: defaultBranchData,
          teacherROI: defaultTeacherROI
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfitData();
  }, [selectedPeriod, selectedBranch]);

  // Default data for fallback
  const defaultProfitSummary = {
    totalRevenue: 4520000,
    totalExpense: 3180000,
    netProfit: 1340000,
    profitMargin: 29.6,
    changeFromLast: 8.5
  };

  const defaultClassProfitData = [
    { class: 'Class 1', students: 120, revenue: 480000, expense: 320000, profit: 160000, margin: 33.3 },
    { class: 'Class 2', students: 115, revenue: 460000, expense: 310000, profit: 150000, margin: 32.6 },
    { class: 'Class 3', students: 108, revenue: 432000, expense: 295000, profit: 137000, margin: 31.7 },
    { class: 'Class 4', students: 95, revenue: 380000, expense: 270000, profit: 110000, margin: 28.9 },
    { class: 'Class 5', students: 88, revenue: 352000, expense: 255000, profit: 97000, margin: 27.6 }
  ];

  const defaultBranchData = [
    { name: 'Main Campus', revenue: 2500000, expense: 1750000, profit: 750000, students: 650 },
    { name: 'North Branch', revenue: 1200000, expense: 850000, profit: 350000, students: 320 }
  ];

  const defaultTeacherROI = [
    { name: 'Ramesh K.', subject: 'Mathematics', salary: 45000, studentCount: 180, performance: 92, roi: 2.8 },
    { name: 'Sunita P.', subject: 'Science', salary: 42000, studentCount: 165, performance: 88, roi: 2.5 }
  ];

  // Use API data or fallback
  const profitSummary = profitData?.summary || defaultProfitSummary;
  const classProfitData = profitData?.classProfitData || defaultClassProfitData;
  const branchData = profitData?.branchData || defaultBranchData;
  const teacherROI = profitData?.teacherROI || defaultTeacherROI;

  const formatCurrency = (amount) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-purple-600" />
            Profit Intelligence
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Business analytics powered by Cortex AI
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            <option value="all">All Branches</option>
            <option value="main">Main Campus</option>
            <option value="north">North Branch</option>
            <option value="south">South Branch</option>
          </select>
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_quarter">This Quarter</option>
            <option value="this_year">This Year</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Loading profit intelligence...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <IndianRupee className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-4 h-4" />
              +12%
            </span>
          </div>
          <p className="text-green-100 text-sm mb-1">Total Revenue</p>
          <p className="text-3xl font-bold">{formatCurrency(profitSummary.totalRevenue)}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
              <ArrowDownRight className="w-4 h-4" />
              -3%
            </span>
          </div>
          <p className="text-red-100 text-sm mb-1">Total Expenses</p>
          <p className="text-3xl font-bold">{formatCurrency(profitSummary.totalExpense)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-4 h-4" />
              +{profitSummary.changeFromLast}%
            </span>
          </div>
          <p className="text-purple-100 text-sm mb-1">Net Profit</p>
          <p className="text-3xl font-bold">{formatCurrency(profitSummary.netProfit)}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <PieChart className="w-6 h-6" />
            </div>
          </div>
          <p className="text-orange-100 text-sm mb-1">Profit Margin</p>
          <p className="text-3xl font-bold">{profitSummary.profitMargin}%</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Revenue vs Expense Trend
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Chart will be rendered here</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            Expense Breakdown
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Pie chart will be rendered here</p>
          </div>
        </div>
      </div>

      {/* Class-wise Profit */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            Class-wise Profit Analysis
          </h3>
          <button className="text-sm text-purple-600 hover:text-purple-700">
            View Details
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Class</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Students</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Revenue</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Expense</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Profit</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Margin</th>
              </tr>
            </thead>
            <tbody>
              {classProfitData.map((row, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{row.class}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{row.students}</td>
                  <td className="py-3 px-4 text-green-600 font-medium">{formatCurrency(row.revenue)}</td>
                  <td className="py-3 px-4 text-red-600">{formatCurrency(row.expense)}</td>
                  <td className="py-3 px-4 text-purple-600 font-medium">{formatCurrency(row.profit)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                      row.margin >= 30 ? 'bg-green-100 text-green-700' :
                      row.margin >= 25 ? 'bg-blue-100 text-blue-700' :
                      row.margin >= 20 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {row.margin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Branch Comparison & Teacher ROI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Branch Comparison
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {branchData.map((branch, index) => (
              <div key={index} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{branch.name}</h4>
                  <span className="text-sm text-gray-500">{branch.students} students</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Revenue</p>
                    <p className="font-semibold text-green-600">{formatCurrency(branch.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Expense</p>
                    <p className="font-semibold text-red-600">{formatCurrency(branch.expense)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Profit</p>
                    <p className="font-semibold text-purple-600">{formatCurrency(branch.profit)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Teacher ROI */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Teacher ROI Analysis
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {teacherROI.map((teacher, index) => (
              <div key={index} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{teacher.name}</h4>
                    <p className="text-sm text-gray-500">{teacher.subject}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    teacher.roi >= 2.5 ? 'bg-green-100 text-green-700' :
                    teacher.roi >= 2.0 ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    ROI: {teacher.roi}x
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Salary</p>
                    <p className="font-medium">₹{teacher.salary.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Students</p>
                    <p className="font-medium">{teacher.studentCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Performance</p>
                    <p className="font-medium">{teacher.performance}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default ProfitIntelligence;
