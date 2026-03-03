/**
 * ReportDashboard - Main Report Center Dashboard
 * Day 8 - 8 Day Master Plan
 * Features: Module overview, stats, recent reports, quick access
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import {
  BarChart3,
  FileText,
  Users,
  CreditCard,
  Calendar,
  Briefcase,
  BookOpen,
  Bus,
  Home,
  Edit3,
  CheckSquare,
  Monitor,
  DollarSign,
  Plus,
  Search,
  Clock,
  Download,
  TrendingUp,
  Wand2,
  ArrowRight,
  ArrowLeft,
  Star,
  Zap,
  Play,
  Settings,
  Filter,
  ChevronRight,
  Sparkles,
  Award
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { REPORT_MODULES } from './constants';
import GlobalReportSearch from './GlobalReportSearch';

// Module configuration with routes and template counts
const MODULE_CONFIG = {
  'student-information': {
    icon: Users,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-50 to-indigo-50',
    darkBgGradient: 'dark:from-blue-900/20 dark:to-indigo-900/20',
    templateCount: 50,
    route: '/super-admin/reports/student-information',
    description: 'Student data, enrollment, demographics'
  },
  'fees': {
    icon: CreditCard,
    color: 'green',
    gradient: 'from-green-500 to-emerald-600',
    bgGradient: 'from-green-50 to-emerald-50',
    darkBgGradient: 'dark:from-green-900/20 dark:to-emerald-900/20',
    templateCount: 48,
    route: '/super-admin/reports/fees',
    description: 'Fee collection, dues, receipts'
  },
  'finance': {
    icon: DollarSign,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-50 to-teal-50',
    darkBgGradient: 'dark:from-emerald-900/20 dark:to-teal-900/20',
    templateCount: 39,
    route: '/super-admin/reports/finance',
    description: 'Income, expenses, ledger reports'
  },
  'attendance': {
    icon: Calendar,
    color: 'purple',
    gradient: 'from-purple-500 to-violet-600',
    bgGradient: 'from-purple-50 to-violet-50',
    darkBgGradient: 'dark:from-purple-900/20 dark:to-violet-900/20',
    templateCount: 54,
    route: '/super-admin/reports/attendance',
    description: 'Daily, monthly, summary attendance'
  },
  'examinations': {
    icon: FileText,
    color: 'orange',
    gradient: 'from-orange-500 to-amber-600',
    bgGradient: 'from-orange-50 to-amber-50',
    darkBgGradient: 'dark:from-orange-900/20 dark:to-amber-900/20',
    templateCount: 56,
    route: '/super-admin/reports/examinations',
    description: 'Results, mark sheets, analysis'
  },
  'hr': {
    icon: Briefcase,
    color: 'cyan',
    gradient: 'from-cyan-500 to-blue-600',
    bgGradient: 'from-cyan-50 to-blue-50',
    darkBgGradient: 'dark:from-cyan-900/20 dark:to-blue-900/20',
    templateCount: 25,
    route: '/super-admin/reports/hr',
    description: 'Staff, payroll, leaves'
  },
  'library': {
    icon: BookOpen,
    color: 'amber',
    gradient: 'from-amber-500 to-yellow-600',
    bgGradient: 'from-amber-50 to-yellow-50',
    darkBgGradient: 'dark:from-amber-900/20 dark:to-yellow-900/20',
    templateCount: 28,
    route: '/super-admin/reports/library',
    description: 'Books, issues, returns, fines'
  },
  'transport': {
    icon: Bus,
    color: 'indigo',
    gradient: 'from-indigo-500 to-purple-600',
    bgGradient: 'from-indigo-50 to-purple-50',
    darkBgGradient: 'dark:from-indigo-900/20 dark:to-purple-900/20',
    templateCount: 30,
    route: '/super-admin/reports/transport',
    description: 'Routes, vehicles, trip logs'
  },
  'hostel': {
    icon: Home,
    color: 'pink',
    gradient: 'from-pink-500 to-rose-600',
    bgGradient: 'from-pink-50 to-rose-50',
    darkBgGradient: 'dark:from-pink-900/20 dark:to-rose-900/20',
    templateCount: 32,
    route: '/super-admin/reports/hostel',
    description: 'Rooms, allocations, mess, visitors'
  },
  'homework': {
    icon: Edit3,
    color: 'teal',
    gradient: 'from-teal-500 to-cyan-600',
    bgGradient: 'from-teal-50 to-cyan-50',
    darkBgGradient: 'dark:from-teal-900/20 dark:to-cyan-900/20',
    templateCount: 25,
    route: '/super-admin/reports/homework',
    description: 'Assignments, submissions'
  },
  'homework-evaluation': {
    icon: CheckSquare,
    color: 'emerald',
    gradient: 'from-emerald-500 to-green-600',
    bgGradient: 'from-emerald-50 to-green-50',
    darkBgGradient: 'dark:from-emerald-900/20 dark:to-green-900/20',
    templateCount: 25,
    route: '/super-admin/reports/homework-evaluation',
    description: 'Grades, performance, feedback'
  },
  'online-exam': {
    icon: Monitor,
    color: 'rose',
    gradient: 'from-rose-500 to-pink-600',
    bgGradient: 'from-rose-50 to-pink-50',
    darkBgGradient: 'dark:from-rose-900/20 dark:to-pink-900/20',
    templateCount: 26,
    route: '/super-admin/reports/online-exam',
    description: 'CBT results, question banks'
  }
};

// Sample recent reports data
const RECENT_REPORTS = [
  { id: 1, name: 'Daily Attendance Summary', module: 'attendance', generatedAt: '2 mins ago', format: 'PDF' },
  { id: 2, name: 'Fee Collection Today', module: 'fees', generatedAt: '15 mins ago', format: 'Excel' },
  { id: 3, name: 'Class-wise Student List', module: 'student-information', generatedAt: '1 hour ago', format: 'PDF' },
  { id: 4, name: 'Monthly Revenue Summary', module: 'finance', generatedAt: '2 hours ago', format: 'Excel' },
  { id: 5, name: 'Staff Leave Report', module: 'hr', generatedAt: '3 hours ago', format: 'PDF' },
];

// Sample scheduled reports
const SCHEDULED_REPORTS = [
  { id: 1, name: 'Daily Attendance', nextRun: 'Today 6:00 PM', frequency: 'Daily' },
  { id: 2, name: 'Weekly Fee Summary', nextRun: 'Monday 9:00 AM', frequency: 'Weekly' },
  { id: 3, name: 'Monthly Revenue', nextRun: '1st March', frequency: 'Monthly' },
];

const ReportDashboard = () => {
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [view, setView] = useState('grid'); // grid or list

  // Calculate totals
  const totalTemplates = useMemo(() => 
    Object.values(MODULE_CONFIG).reduce((sum, m) => sum + m.templateCount, 0)
  , []);

  const stats = [
    { 
      label: 'Total Templates', 
      value: `${totalTemplates}+`, 
      icon: FileText, 
      color: 'purple',
      gradient: 'from-purple-500 to-indigo-600'
    },
    { 
      label: 'Report Modules', 
      value: Object.keys(MODULE_CONFIG).length, 
      icon: BarChart3, 
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-600'
    },
    { 
      label: 'Reports Generated', 
      value: '1,234', 
      icon: Download, 
      color: 'green',
      gradient: 'from-green-500 to-emerald-600'
    },
    { 
      label: 'Scheduled Reports', 
      value: '12', 
      icon: Clock, 
      color: 'orange',
      gradient: 'from-orange-500 to-amber-600'
    },
  ];

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/super-admin/dashboard')}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                Report Center
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {totalTemplates}+ templates across {Object.keys(MODULE_CONFIG).length} modules
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <Search className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">Search templates...</span>
              <kbd className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-400">⌘K</kbd>
            </button>
            
            <button
              onClick={() => navigate('/super-admin/reports/custom-builder')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition shadow-lg shadow-purple-500/25"
            >
              <Wand2 className="h-4 w-4" />
              Custom Builder
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition overflow-hidden">
              <div className={`h-1 bg-gradient-to-r ${stat.gradient}`} />
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Reports */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                Recent Reports
              </CardTitle>
              <button
                onClick={() => navigate('/super-admin/reports/history')}
                className="text-sm text-purple-500 hover:text-purple-600 flex items-center gap-1"
              >
                View All <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {RECENT_REPORTS.map(report => {
                const moduleConfig = MODULE_CONFIG[report.module];
                const Icon = moduleConfig?.icon || FileText;
                return (
                  <div 
                    key={report.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-gradient-to-br ${moduleConfig?.gradient || 'from-gray-400 to-gray-500'} rounded-lg`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white text-sm">{report.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{report.generatedAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{report.format}</Badge>
                      <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">
                        <Download className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Reports */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                Scheduled
              </CardTitle>
              <button
                onClick={() => navigate('/super-admin/reports/schedules')}
                className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1"
              >
                Manage <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {SCHEDULED_REPORTS.map(schedule => (
                <div 
                  key={schedule.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white text-sm">{schedule.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Next: {schedule.nextRun}</p>
                  </div>
                  <Badge className="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 text-xs">
                    {schedule.frequency}
                  </Badge>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/super-admin/reports/schedules')}
              className="w-full mt-4 flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:border-orange-500 hover:text-orange-500 transition"
            >
              <Plus className="h-4 w-4" />
              Schedule New Report
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Report Modules Grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Report Modules
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg ${view === 'grid' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-lg ${view === 'list' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <FileText className="h-4 w-4" />
            </button>
          </div>
        </div>

        {view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(MODULE_CONFIG).map(([key, module]) => {
              const Icon = module.icon;
              return (
                <button
                  key={key}
                  onClick={() => navigate(module.route)}
                  className={`group relative p-6 bg-gradient-to-br ${module.bgGradient} ${module.darkBgGradient} rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all duration-300 text-left overflow-hidden`}
                >
                  {/* Decorative gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  <div className="relative">
                    <div className={`inline-flex p-3 bg-gradient-to-br ${module.gradient} rounded-xl shadow-lg mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    
                    <h3 className="font-bold text-gray-800 dark:text-white mb-1">
                      {REPORT_MODULES[key]?.name || key}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{module.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <Badge className={`bg-${module.color}-100 dark:bg-${module.color}-900/50 text-${module.color}-600 dark:text-${module.color}-300`}>
                        {module.templateCount} templates
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </button>
              );
            })}
            
            {/* Custom Builder Card */}
            <button
              onClick={() => navigate('/super-admin/reports/custom-builder')}
              className="group relative p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              
              <div className="relative">
                <div className="inline-flex p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg mb-4">
                  <Wand2 className="h-6 w-6 text-white" />
                </div>
                
                <h3 className="font-bold text-gray-800 dark:text-white mb-1">Custom Builder</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Build your own custom reports</p>
                
                <div className="flex items-center justify-between">
                  <Badge className="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300">
                    Unlimited
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-300 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </button>
          </div>
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              <div className="divide-y dark:divide-gray-800">
                {Object.entries(MODULE_CONFIG).map(([key, module]) => {
                  const Icon = module.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => navigate(module.route)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 bg-gradient-to-br ${module.gradient} rounded-xl`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800 dark:text-white">
                            {REPORT_MODULES[key]?.name || key}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{module.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{module.templateCount} templates</Badge>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pro Tips */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white mb-2">Pro Tips</h3>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <li>• Use <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">⌘K</kbd> to quickly search across all {totalTemplates}+ templates</li>
                <li>• Schedule reports for automatic delivery via Email or WhatsApp</li>
                <li>• Export to Excel for further analysis or PDF for printing</li>
                <li>• Use Custom Builder to create unique reports with any columns</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Search Modal */}
      <GlobalReportSearch 
        isOpen={showSearch} 
        onClose={() => setShowSearch(false)} 
      />
    </div>
    </DashboardLayout>
  );
};

export default ReportDashboard;
