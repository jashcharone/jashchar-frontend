/**
 * 📊 REPORT CENTER - ROUTE CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════════
 * Day 8 - 8-Day Master Plan Complete!
 * All routes for the Report Center in one place
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { lazy, Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Lazy load all report generators for performance
const ReportDashboard = lazy(() => import('./ReportGeneratorShared/ReportDashboard'));
const GlobalReportSearch = lazy(() => import('./ReportGeneratorShared/GlobalReportSearch'));
const ReportScheduleManager = lazy(() => import('./ReportGeneratorShared/ReportScheduleManager'));
const ReportHistory = lazy(() => import('./ReportGeneratorShared/ReportHistory'));

// Module generators
const StudentReportGenerator = lazy(() => import('./student-information/StudentReportGenerator'));
const FeesReportGenerator = lazy(() => import('./fees/FeesReportGenerator'));
const FinanceReportGenerator = lazy(() => import('./finance/FinanceReportGenerator'));
const AttendanceReportGenerator = lazy(() => import('./attendance/AttendanceReportGenerator'));
const HRReportGenerator = lazy(() => import('./hr/HRReportGenerator'));
const ExamReportGenerator = lazy(() => import('./examinations/ExamReportGenerator'));
const OnlineExamReportGenerator = lazy(() => import('./online-exam/OnlineExamReportGenerator'));
const LibraryReportGenerator = lazy(() => import('./library/LibraryReportGenerator'));
const TransportReportGenerator = lazy(() => import('./transport/TransportReportGenerator'));
const HostelReportGenerator = lazy(() => import('./hostel/HostelReportGenerator'));
const HomeworkReportGenerator = lazy(() => import('./homework/HomeworkReportGenerator'));
const HomeworkEvaluationReportGenerator = lazy(() => import('./homework-evaluation/HomeworkEvaluationReportGenerator'));
const CustomReportBuilder = lazy(() => import('./custom-builder/CustomReportBuilder'));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400">Loading Report Generator...</p>
    </div>
  </div>
);

/**
 * Route Configuration for the Report Center
 * Use this in your router setup
 */
export const REPORT_ROUTES = [
  // Main Dashboard
  { path: '', element: <ReportDashboard />, name: 'Dashboard' },
  { path: 'dashboard', element: <ReportDashboard />, name: 'Dashboard' },
  
  // Management Pages
  { path: 'schedules', element: <ReportScheduleManager />, name: 'Scheduled Reports' },
  { path: 'history', element: <ReportHistory />, name: 'Report History' },
  
  // Module Report Generators (12 modules)
  { path: 'student-information/*', element: <StudentReportGenerator />, name: 'Student Reports' },
  { path: 'fees/*', element: <FeesReportGenerator />, name: 'Fee Reports' },
  { path: 'finance/*', element: <FinanceReportGenerator />, name: 'Finance Reports' },
  { path: 'attendance/*', element: <AttendanceReportGenerator />, name: 'Attendance Reports' },
  { path: 'hr/*', element: <HRReportGenerator />, name: 'HR Reports' },
  { path: 'examinations/*', element: <ExamReportGenerator />, name: 'Exam Reports' },
  { path: 'online-exam/*', element: <OnlineExamReportGenerator />, name: 'Online Exam Reports' },
  { path: 'library/*', element: <LibraryReportGenerator />, name: 'Library Reports' },
  { path: 'transport/*', element: <TransportReportGenerator />, name: 'Transport Reports' },
  { path: 'hostel/*', element: <HostelReportGenerator />, name: 'Hostel Reports' },
  { path: 'homework/*', element: <HomeworkReportGenerator />, name: 'Homework Reports' },
  { path: 'homework-evaluation/*', element: <HomeworkEvaluationReportGenerator />, name: 'Homework Evaluation' },
  
  // Custom Builder
  { path: 'custom-builder/*', element: <CustomReportBuilder />, name: 'Custom Builder' },
];

/**
 * ReportCenterRoutes Component
 * Use this component in your main router to render all report routes
 * 
 * Example usage in your router:
 * <Route path="/super-admin/reports/*" element={<ReportCenterRoutes />} />
 */
export const ReportCenterRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {REPORT_ROUTES.map((route, idx) => (
          <Route key={idx} path={route.path} element={route.element} />
        ))}
        {/* Catch-all redirect to dashboard */}
        <Route path="*" element={<Navigate to="/super-admin/reports/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

/**
 * Navigation Links for sidebar/navigation
 */
export const REPORT_NAV_LINKS = [
  { 
    group: 'Management', 
    links: [
      { path: '/super-admin/reports/dashboard', label: 'Dashboard', icon: 'BarChart3' },
      { path: '/super-admin/reports/schedules', label: 'Scheduled Reports', icon: 'Clock' },
      { path: '/super-admin/reports/history', label: 'Report History', icon: 'History' },
    ]
  },
  {
    group: 'Student & Finance',
    links: [
      { path: '/super-admin/reports/student-information', label: 'Student Information', icon: 'Users', count: 50 },
      { path: '/super-admin/reports/fees', label: 'Fees', icon: 'CreditCard', count: 48 },
      { path: '/super-admin/reports/finance', label: 'Finance', icon: 'DollarSign', count: 39 },
    ]
  },
  {
    group: 'Academic',
    links: [
      { path: '/super-admin/reports/attendance', label: 'Attendance', icon: 'Calendar', count: 54 },
      { path: '/super-admin/reports/examinations', label: 'Examinations', icon: 'FileText', count: 56 },
      { path: '/super-admin/reports/online-exam', label: 'Online Exam', icon: 'Monitor', count: 26 },
      { path: '/super-admin/reports/homework', label: 'Homework', icon: 'Edit3', count: 25 },
      { path: '/super-admin/reports/homework-evaluation', label: 'Homework Evaluation', icon: 'CheckSquare', count: 25 },
    ]
  },
  {
    group: 'Operations',
    links: [
      { path: '/super-admin/reports/hr', label: 'Human Resource', icon: 'Briefcase', count: 25 },
      { path: '/super-admin/reports/library', label: 'Library', icon: 'BookOpen', count: 28 },
      { path: '/super-admin/reports/transport', label: 'Transport', icon: 'Bus', count: 30 },
      { path: '/super-admin/reports/hostel', label: 'Hostel', icon: 'Home', count: 32 },
    ]
  },
  {
    group: 'Custom',
    links: [
      { path: '/super-admin/reports/custom-builder', label: 'Custom Builder', icon: 'Wand2', count: '∞' },
    ]
  }
];

export default ReportCenterRoutes;
