/**
 * Online Exam Report Generator
 * Module 12: 30 Online Exam Report Templates
 * Categories: Exam Setup, Attempt & Result, Technical & Analytics
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import {
  ReportGeneratorLayout,
  TemplateSidebar,
  FilterPanel,
  ColumnSelector,
  GroupSortPanel,
  LivePreviewTable,
  ExportButtons,
  SaveTemplateModal,
  ScheduleReportModal,
  useReportState,
  useFetchReport,
  useReportExport,
  useGroupedData,
  useFilterOptions,
  REPORT_MODULES
} from '../ReportGeneratorShared';
import { ONLINE_EXAM_TEMPLATES, ONLINE_EXAM_CATEGORIES, getPopularTemplates } from './templates';
import { ONLINE_EXAM_COLUMNS, COLUMN_SETS, getColumnsForSet } from './columns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Filter, 
  RefreshCw,
  Laptop,
  Wifi,
  AlertTriangle,
  Users,
  BarChart3
} from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const OnlineExamReportGenerator = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  // Module configuration
  const moduleConfig = REPORT_MODULES['online-exam'];
  const moduleColor = moduleConfig?.color || 'teal';

  // Master data for filters (from shared hook)
  const { classes, sections, sessions } = useFilterOptions();
  
  // Report state management
  const {
    showSidebar, setShowSidebar,
    selectedTemplate, setSelectedTemplate,
    selectedColumns, setSelectedColumns,
    filters, setFilters,
    groupBy, setGroupBy,
    sortBy, setSortBy,
    isLoading, setIsLoading,
    data, setData,
    error, setError,
    savedTemplates, setSavedTemplates,
    showSaveModal, setShowSaveModal,
    showScheduleModal, setShowScheduleModal,
    resetState
  } = useReportState({
    defaultColumns: COLUMN_SETS.online_exam_list?.map(key => 
      ONLINE_EXAM_COLUMNS.find(c => c.key === key)
    ).filter(Boolean) || []
  });

  // Templates for sidebar
  const allTemplates = useMemo(() => ONLINE_EXAM_TEMPLATES, []);

  // Handle template selection - receives full template object from TemplateSidebar
  const handleTemplateSelect = useCallback((template) => {
    if (template) {
      setSelectedTemplate(template);
      setSelectedColumns(template.columns);
      setFilters(template.defaultFilters || {});
      setGroupBy(template.defaultGroupBy || []);
      setSortBy(template.defaultSortBy || []);
    }
  }, [setSelectedTemplate, setSelectedColumns, setFilters, setGroupBy, setSortBy]);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    if (!selectedBranch?.id || !currentSessionId || !organizationId) {
      setError('Please select branch and session');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        organization_id: organizationId,
        branch_id: selectedBranch.id,
        session_id: currentSessionId,
        ...filters
      });

      // Get Supabase session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `${API_BASE}/reports/online-exam?${queryParams}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      // For demo, use sample data
      setData(generateSampleData());
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch, currentSessionId, organizationId, filters, setIsLoading, setError, setData]);

  // Generate sample data for demo/preview based on template category
  const generateSampleData = () => {
    const category = selectedTemplate?.category || 'setup';
    
    if (category === 'setup') {
      return generateSetupData();
    } else if (category === 'result') {
      return generateResultData();
    } else {
      return generateTechnicalData();
    }
  };

  // Exam Setup sample data
  const generateSetupData = () => {
    const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science', 'Hindi'];
    const classes = ['6th', '7th', '8th', '9th', '10th'];
    const examTypes = ['Unit Test', 'Mid Term', 'Final', 'Practice'];
    const chapters = ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5'];
    const questionTypes = ['MCQ', 'Fill in Blank', 'Match', 'True/False', 'Short Answer'];
    
    return Array.from({ length: 50 }, (_, i) => {
      const totalQ = 20 + (i % 30);
      const easyQ = Math.floor(totalQ * 0.3);
      const mediumQ = Math.floor(totalQ * 0.5);
      const hardQ = totalQ - easyQ - mediumQ;
      
      return {
        id: i + 1,
        exam_id: `OE${2024}${String(i + 1).padStart(4, '0')}`,
        exam_name: `${subjects[i % subjects.length]} - ${examTypes[i % examTypes.length]} ${(i % 3) + 1}`,
        exam_code: `OE${i + 1}`,
        subject_name: subjects[i % subjects.length],
        class_name: classes[i % classes.length],
        section_name: ['A', 'B', 'C'][i % 3],
        exam_type: examTypes[i % examTypes.length],
        exam_date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        start_time: `${9 + (i % 4)}:00 AM`,
        end_time: `${10 + (i % 4)}:00 AM`,
        duration: `${45 + (i % 4) * 15} mins`,
        duration_minutes: 45 + (i % 4) * 15,
        exam_status: ['Active', 'Upcoming', 'Completed'][i % 3],
        chapter_name: chapters[i % chapters.length],
        total_questions: totalQ,
        questions_used: Math.floor(totalQ * 0.8),
        questions_available: totalQ - Math.floor(totalQ * 0.8),
        question_type: questionTypes[i % questionTypes.length],
        mcq_count: Math.floor(totalQ * 0.6),
        fill_blank_count: Math.floor(totalQ * 0.15),
        match_count: Math.floor(totalQ * 0.1),
        true_false_count: Math.floor(totalQ * 0.1),
        short_answer_count: Math.floor(totalQ * 0.05),
        easy_count: easyQ,
        medium_count: mediumQ,
        hard_count: hardQ,
        easy_percentage: ((easyQ / totalQ) * 100).toFixed(1),
        medium_percentage: ((mediumQ / totalQ) * 100).toFixed(1),
        hard_percentage: ((hardQ / totalQ) * 100).toFixed(1),
        total_marks: totalQ * 2,
        passing_marks: totalQ,
        negative_marking: i % 2 === 0,
        negative_marks: 0.25,
        shuffle_questions: true,
        registered_count: 30 + (i % 20),
        template_name: `Template ${(i % 5) + 1}`,
        times_used: Math.floor(Math.random() * 10) + 1,
        exam_count: Math.floor(Math.random() * 20) + 1,
        avg_attendance: 80 + Math.floor(Math.random() * 15)
      };
    });
  };

  // Attempt & Result sample data
  const generateResultData = () => {
    const names = ['Rahul Sharma', 'Priya Verma', 'Amit Singh', 'Sneha Patel', 'Raj Kumar', 'Anita Gupta', 'Vikram Reddy', 'Pooja Das'];
    const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science'];
    const classes = ['6th', '7th', '8th', '9th', '10th'];
    
    return Array.from({ length: 50 }, (_, i) => {
      const totalQ = 25;
      const attemptedQ = totalQ - (i % 5);
      const correctQ = Math.floor(attemptedQ * (0.5 + Math.random() * 0.4));
      const wrongQ = attemptedQ - correctQ;
      const maxMarks = totalQ * 2;
      const obtainedMarks = correctQ * 2 - (wrongQ * 0.5);
      const percentage = ((obtainedMarks / maxMarks) * 100);
      const timeTaken = 30 + Math.floor(Math.random() * 30);
      
      return {
        id: i + 1,
        student_name: names[i % names.length],
        admission_no: `ADM${2024}${String(i + 1).padStart(4, '0')}`,
        roll_no: String((i % 40) + 1),
        class_name: classes[i % classes.length],
        section_name: ['A', 'B', 'C'][i % 3],
        exam_name: `${subjects[i % subjects.length]} - Unit Test`,
        subject_name: subjects[i % subjects.length],
        exam_date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        registered: true,
        attempted: i % 10 !== 0,
        absent: i % 10 === 0,
        attempt_status: i % 10 === 0 ? 'Absent' : 'Completed',
        total_questions: totalQ,
        attempted_questions: attemptedQ,
        correct_answers: correctQ,
        wrong_answers: wrongQ,
        skipped_questions: totalQ - attemptedQ,
        marks_obtained: obtainedMarks.toFixed(1),
        max_marks: maxMarks,
        negative_marks_deducted: (wrongQ * 0.5).toFixed(1),
        final_marks: obtainedMarks.toFixed(1),
        percentage: percentage.toFixed(1),
        rank: (i % 40) + 1,
        result_status: percentage >= 40 ? 'Pass' : 'Fail',
        time_taken: `${timeTaken} mins`,
        time_taken_minutes: timeTaken,
        avg_time_per_question: `${(timeTaken * 60 / totalQ).toFixed(0)} sec`,
        submitted_early: timeTaken < 45,
        question_no: (i % totalQ) + 1,
        question_type: ['MCQ', 'Fill', 'Match'][i % 3],
        correct_percentage: (60 + Math.random() * 30).toFixed(1),
        wrong_percentage: (10 + Math.random() * 20).toFixed(1),
        skipped_percentage: (5 + Math.random() * 10).toFixed(1),
        attempt_1_marks: Math.floor(30 + Math.random() * 20),
        attempt_2_marks: Math.floor(35 + Math.random() * 20),
        attempt_3_marks: Math.floor(40 + Math.random() * 15),
        best_marks: Math.floor(40 + Math.random() * 15),
        completion_status: i % 8 === 0 ? 'Incomplete' : 'Completed',
        questions_done: i % 8 === 0 ? Math.floor(totalQ * 0.6) : totalQ,
        incomplete_reason: i % 8 === 0 ? ['Network Issue', 'Browser Crash', 'Time Expired'][i % 3] : null,
        student_count: 30 + (i % 15),
        pass_count: 25 + (i % 10),
        pass_percentage: (80 + Math.random() * 15).toFixed(1),
        avg_marks: (60 + Math.random() * 20).toFixed(1),
        highest_marks: Math.floor(85 + Math.random() * 15),
        lowest_marks: Math.floor(25 + Math.random() * 15)
      };
    });
  };

  // Technical & Analytics sample data
  const generateTechnicalData = () => {
    const names = ['Rahul Sharma', 'Priya Verma', 'Amit Singh', 'Sneha Patel', 'Raj Kumar'];
    const devices = ['Desktop', 'Laptop', 'Tablet', 'Mobile'];
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const oses = ['Windows 10', 'Windows 11', 'macOS', 'Android', 'iOS'];
    const issues = ['Connection Lost', 'Browser Freeze', 'Audio Error', 'Video Error', 'Page Not Loading'];
    const violations = ['Tab Switch', 'Multiple Windows', 'Copy Attempt', 'External Device', 'Suspicious Activity'];
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      student_name: names[i % names.length],
      admission_no: `ADM${2024}${String(i + 1).padStart(4, '0')}`,
      class_name: ['6th', '7th', '8th', '9th', '10th'][i % 5],
      exam_name: `Math - Unit Test ${(i % 3) + 1}`,
      exam_date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      device_type: devices[i % devices.length],
      device_name: `${devices[i % devices.length]} ${i + 1}`,
      os_name: oses[i % oses.length],
      os_version: `v${10 + (i % 5)}.${i % 10}`,
      browser_name: browsers[i % browsers.length],
      browser_version: `${100 + (i % 20)}.0`,
      screen_resolution: ['1920x1080', '1366x768', '1440x900', '1280x720'][i % 4],
      device_count: Math.floor(10 + Math.random() * 30),
      issue_type: issues[i % issues.length],
      issue_description: `${issues[i % issues.length]} during exam`,
      issue_time: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} ${9 + (i % 3)}:${String(i % 60).padStart(2, '0')} AM`,
      resolution_status: ['Resolved', 'Pending', 'In Progress'][i % 3],
      issue_count: Math.floor(Math.random() * 5) + 1,
      violation_type: violations[i % violations.length],
      violation_time: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} ${9 + (i % 3)}:${String(i % 60).padStart(2, '0')} AM`,
      violation_action: ['Warning', 'Marked', 'Exam Terminated'][i % 3],
      violation_count: Math.floor(Math.random() * 3),
      tab_switches: Math.floor(Math.random() * 10),
      window_blur_count: Math.floor(Math.random() * 5),
      time_away: `${Math.floor(Math.random() * 5)} min ${Math.floor(Math.random() * 60)} sec`,
      time_away_seconds: Math.floor(Math.random() * 300),
      copy_attempts: Math.floor(Math.random() * 3),
      paste_attempts: Math.floor(Math.random() * 2),
      right_click_attempts: Math.floor(Math.random() * 5),
      attempt_type: ['Copy', 'Paste', 'Right Click'][i % 3],
      ip_address: `192.168.${i % 256}.${(i * 7) % 256}`,
      location: cities[i % cities.length],
      city: cities[i % cities.length],
      country: 'India',
      is_valid_location: i % 5 !== 0,
      ip_flag: i % 5 === 0 ? 'Suspicious' : 'Valid',
      max_concurrent: 150 + Math.floor(Math.random() * 100),
      avg_concurrent: 80 + Math.floor(Math.random() * 50),
      server_response_ms: 50 + Math.floor(Math.random() * 100),
      peak_load_time: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 09:00 AM`,
      avg_data_size_kb: 50 + Math.floor(Math.random() * 100),
      total_data_mb: (5 + Math.random() * 20).toFixed(2),
      peak_bandwidth: `${Math.floor(10 + Math.random() * 20)} Mbps`
    }));
  };

  // Auto-load data when template changes
  useEffect(() => {
    if (selectedTemplate) {
      fetchData();
    }
  }, [selectedTemplate, fetchData]);

  // Get summary stats
  const getSummaryStats = useMemo(() => {
    if (!data.length) return null;
    
    const totalExams = new Set(data.map(d => d.exam_name)).size;
    const totalStudents = new Set(data.map(d => d.student_name)).size;
    const avgPercentage = data.reduce((sum, d) => sum + (parseFloat(d.percentage) || parseFloat(d.pass_percentage) || 0), 0) / data.length;
    const techIssues = data.filter(d => d.issue_type || d.violation_type).length;
    
    return {
      totalExams,
      totalStudents,
      avgPercentage: avgPercentage.toFixed(1),
      techIssues
    };
  }, [data]);

  // Clear data when branch/session changes
  useEffect(() => {
    setData([]);
  }, [selectedBranch?.id, currentSessionId, setData]);

  return (
    <ReportGeneratorLayout
      moduleId="online-exam"
      moduleTitle="Online Exam Reports"
      moduleDescription="30 comprehensive online exam report templates for exam management, results, and analytics"
      moduleColor={moduleColor}
      icon={Monitor}
      templateCount={ONLINE_EXAM_TEMPLATES.length}
      categoryCount={ONLINE_EXAM_CATEGORIES.length}
    >
      <div className="flex h-full">
        {/* Template Sidebar */}
        <TemplateSidebar
          templates={allTemplates}
          categories={ONLINE_EXAM_CATEGORIES}
          selectedTemplate={selectedTemplate}
          onSelectTemplate={handleTemplateSelect}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          moduleColor={moduleColor}
        />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Quick Stats Bar */}
          {getSummaryStats && selectedTemplate && (
            <div className="bg-cyan-50 dark:bg-cyan-900/20 border-b border-cyan-200 dark:border-cyan-800 p-3">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-cyan-600" />
                  <span className="text-gray-600 dark:text-gray-400">Exams:</span>
                  <span className="font-semibold text-cyan-700 dark:text-cyan-300">{getSummaryStats.totalExams}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600 dark:text-gray-400">Students:</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-300">{getSummaryStats.totalStudents}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600 dark:text-gray-400">Avg Score:</span>
                  <span className="font-semibold text-green-700 dark:text-green-300">{getSummaryStats.avgPercentage}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-gray-600 dark:text-gray-400">Issues:</span>
                  <span className="font-semibold text-amber-700 dark:text-amber-300">{getSummaryStats.techIssues}</span>
                </div>
              </div>
            </div>
          )}

          {/* Controls Area */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-4 space-y-4">
            {/* Filter Panel */}
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              onReset={() => setFilters({})}
              classes={classes}
              sections={sections}
              sessions={sessions}
              filterConfig={{
                session: true,
                class: true,
                section: true,
                exam: true,
                dateRange: true
              }}
              color={moduleColor}
            />
            
            {/* Column & Group Controls */}
            <div className="flex flex-wrap items-center gap-4">
              <ColumnSelector
                allColumns={ONLINE_EXAM_COLUMNS}
                selectedColumns={selectedColumns}
                setSelectedColumns={setSelectedColumns}
              />
              
              <GroupSortPanel
                groupBy={groupBy}
                setGroupBy={setGroupBy}
                sortBy={sortBy}
                setSortBy={setSortBy}
                availableColumns={selectedColumns}
              />
              
              <div className="flex-1" />
              
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <ExportButtons
                data={data}
                columns={selectedColumns}
                title={selectedTemplate?.name || 'Online Exam Report'}
                filename="online_exam_report"
              />
            </div>
          </div>
          
          {/* Data Preview Table */}
          <div className="flex-1 overflow-auto p-4">
            <LivePreviewTable
              data={data}
              columns={selectedColumns}
              groupBy={groupBy}
              sortBy={sortBy}
              isLoading={isLoading}
              error={error}
              emptyMessage="Select a template from the sidebar to generate report"
            />
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <SaveTemplateModal
        show={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        templateData={{
          columns: selectedColumns,
          filters,
          groupBy,
          sortBy
        }}
        moduleId="online-exam"
      />
      
      <ScheduleReportModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={(schedule) => {
          console.log('Schedule created:', schedule);
          setShowScheduleModal(false);
        }}
        reportName={selectedTemplate?.name || 'Online Exam Report'}
      />
    </ReportGeneratorLayout>
  );
};

export default OnlineExamReportGenerator;
