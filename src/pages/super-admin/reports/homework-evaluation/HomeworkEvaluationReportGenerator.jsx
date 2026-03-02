/**
 * Homework Evaluation Report Generator
 * Complete homework evaluation reporting with 25 templates
 * Day 7 - 8 Day Master Plan
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
import { HOMEWORK_EVAL_TEMPLATES, TEMPLATE_CATEGORIES } from './templates';
import { HOMEWORK_EVAL_COLUMNS, getColumns, COLUMN_SETS } from './columns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardCheck, 
  BookOpen, 
  Users, 
  FileText, 
  BarChart3, 
  Download, 
  Filter, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Award,
  TrendingUp
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const HomeworkEvaluationReportGenerator = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  // Module configuration
  const moduleConfig = REPORT_MODULES['homework-evaluation'];
  const moduleColor = moduleConfig?.color || 'emerald';

  // Master data for filters
  const { classes, sections, sessions, subjects, teachers } = useFilterOptions();
  
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
    defaultColumns: COLUMN_SETS.pending_evaluation  // Store as keys (strings), not objects
  });

  // Convert selected column keys to full column objects for table/export
  const selectedColumnsObjects = useMemo(() => {
    return selectedColumns
      .map(key => HOMEWORK_EVAL_COLUMNS.find(c => c.key === key))
      .filter(Boolean);
  }, [selectedColumns]);

  // Templates for sidebar
  const allTemplates = useMemo(() => HOMEWORK_EVAL_TEMPLATES, []);

  // Handle template selection - receives full template object from TemplateSidebar
  const handleTemplateSelect = useCallback((template) => {
    if (template) {
      setSelectedTemplate(template);
      setSelectedColumns(template.columns.map(c => c.key));
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

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `${API_BASE}/reports/homework-evaluation?${queryParams}`,
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

  // Generate sample data for demo/preview
  const generateSampleData = () => {
    const subjects = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer Science', 'Sanskrit', 'Physical Education'];
    const classes = ['5th', '6th', '7th', '8th', '9th', '10th'];
    const sections = ['A', 'B', 'C'];
    const teachers = ['Mr. Sharma', 'Mrs. Verma', 'Mr. Singh', 'Mrs. Patel', 'Mr. Kumar', 'Mrs. Reddy'];
    const students = ['Rahul Sharma', 'Priya Verma', 'Amit Singh', 'Sneha Patel', 'Raj Kumar', 'Kavya Reddy', 'Arjun Nair', 'Meera Iyer', 'Vikram Rao', 'Ananya Das'];
    const homeworkTypes = ['Written', 'Practical', 'Project', 'Research', 'Reading'];
    const evaluationStatuses = ['Evaluated', 'Pending', 'Partial', 'Not Started'];
    const grades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];
    const trends = ['Improving', 'Stable', 'Declining'];
    
    return Array.from({ length: 70 }, (_, i) => {
      const classIndex = i % 6;
      const sectionIndex = i % 3;
      const subjectIndex = i % 8;
      const teacherIndex = i % 6;
      const studentIndex = i % 10;
      const isEvaluated = i % 4 !== 3;
      const gradeIndex = i % 8;
      
      // Calculate dates
      const today = new Date();
      const assignedDate = new Date(today);
      assignedDate.setDate(today.getDate() - (i % 30) - 10);
      const dueDate = new Date(assignedDate);
      dueDate.setDate(assignedDate.getDate() + 3);
      const submissionDate = new Date(dueDate);
      submissionDate.setDate(dueDate.getDate() - (i % 2));
      const evaluationDate = isEvaluated ? new Date(submissionDate) : null;
      if (evaluationDate) {
        evaluationDate.setDate(submissionDate.getDate() + (i % 3) + 1);
      }
      
      const formatDate = (d) => d ? d.toISOString().split('T')[0] : null;
      
      // Calculate marks and grades
      const maxMarks = [10, 20, 25, 50][i % 4];
      const marksObtained = isEvaluated ? Math.floor(maxMarks * (0.3 + Math.random() * 0.65)) : null;
      const marksPercentage = marksObtained ? Number(((marksObtained / maxMarks) * 100).toFixed(1)) : null;
      
      // Calculate statistics
      const totalSubmissions = 25 + (i % 10);
      const evaluatedCount = isEvaluated ? Math.floor(totalSubmissions * (0.6 + Math.random() * 0.35)) : Math.floor(totalSubmissions * 0.3);
      const pendingEvaluation = totalSubmissions - evaluatedCount;
      const classAverage = 60 + (i % 25);
      const classHighest = 85 + (i % 15);
      const classLowest = 35 + (i % 20);
      const passCount = Math.floor(totalSubmissions * 0.75);
      const failCount = totalSubmissions - passCount;
      
      // Grade distribution
      const totalStudentsInClass = 30;
      const gradeAPlusCount = Math.floor(totalStudentsInClass * 0.1);
      const gradeACount = Math.floor(totalStudentsInClass * 0.15);
      const gradeBPlusCount = Math.floor(totalStudentsInClass * 0.15);
      const gradeBCount = Math.floor(totalStudentsInClass * 0.2);
      const gradeCPlusCount = Math.floor(totalStudentsInClass * 0.15);
      const gradeCCount = Math.floor(totalStudentsInClass * 0.1);
      const gradeDCount = Math.floor(totalStudentsInClass * 0.1);
      const gradeFCount = totalStudentsInClass - gradeAPlusCount - gradeACount - gradeBPlusCount - gradeBCount - gradeCPlusCount - gradeCCount - gradeDCount;
      
      return {
        id: i + 1,
        evaluation_id: `EVAL${String(i + 1).padStart(5, '0')}`,
        homework_id: `HW${String(i + 1).padStart(5, '0')}`,
        
        // Homework Info
        homework_title: `${subjects[subjectIndex]} - ${['Chapter', 'Unit', 'Exercise', 'Worksheet'][i % 4]} ${(i % 20) + 1}`,
        homework_type: homeworkTypes[i % 5],
        subject_name: subjects[subjectIndex],
        subject_code: subjects[subjectIndex].substring(0, 3).toUpperCase(),
        chapter_name: `Chapter ${(i % 15) + 1}`,
        max_marks: maxMarks,
        weightage: [5, 10, 15, 20][i % 4],
        
        // Evaluation Info
        evaluation_status: isEvaluated ? 'Evaluated' : evaluationStatuses[i % 4],
        is_evaluated: isEvaluated,
        evaluation_type: ['Manual', 'Auto', 'Rubric-based'][i % 3],
        grading_scale: ['Grade', 'Marks', 'Pass/Fail'][i % 3],
        rubric_used: i % 3 === 2,
        rubric_name: i % 3 === 2 ? `Rubric ${i % 5 + 1}` : null,
        
        // Class Info
        class_id: classIndex + 1,
        class_name: classes[classIndex],
        section_id: sectionIndex + 1,
        section_name: sections[sectionIndex],
        class_strength: totalStudentsInClass,
        
        // Student Info
        student_id: studentIndex + 1,
        student_name: students[studentIndex],
        admission_no: `ADM${2024}${String(studentIndex + 1).padStart(4, '0')}`,
        roll_number: studentIndex + 1,
        
        // Teacher Info
        teacher_id: teacherIndex + 1,
        teacher_name: teachers[teacherIndex],
        evaluator_name: teachers[(teacherIndex + 1) % 6],
        evaluator_employee_code: `EMP${String((teacherIndex + 1) % 6 + 1).padStart(4, '0')}`,
        
        // Dates
        assigned_date: formatDate(assignedDate),
        due_date: formatDate(dueDate),
        submission_date: formatDate(submissionDate),
        evaluation_date: formatDate(evaluationDate),
        evaluation_start_date: isEvaluated ? formatDate(new Date(submissionDate.getTime() + 86400000)) : null,
        evaluation_end_date: formatDate(evaluationDate),
        days_to_evaluate: isEvaluated ? (i % 3) + 1 : null,
        evaluation_delayed_by: i % 5 === 0 ? (i % 3) + 1 : 0,
        
        // Marks & Grades
        marks_obtained: marksObtained,
        marks_percentage: marksPercentage,
        grade: isEvaluated ? grades[gradeIndex] : null,
        grade_points: isEvaluated ? [10, 9, 8, 7, 6, 5, 4, 0][gradeIndex] : null,
        quality_score: isEvaluated ? Math.floor(Math.random() * 30) + 70 : null,
        presentation_marks: isEvaluated ? Math.floor(maxMarks * 0.2 * Math.random()) + Math.floor(maxMarks * 0.15) : null,
        accuracy_marks: isEvaluated ? Math.floor(maxMarks * 0.3 * Math.random()) + Math.floor(maxMarks * 0.2) : null,
        completeness_marks: isEvaluated ? Math.floor(maxMarks * 0.25 * Math.random()) + Math.floor(maxMarks * 0.15) : null,
        creativity_marks: isEvaluated ? Math.floor(maxMarks * 0.15 * Math.random()) + Math.floor(maxMarks * 0.05) : null,
        effort_marks: isEvaluated ? Math.floor(maxMarks * 0.1 * Math.random()) + Math.floor(maxMarks * 0.05) : null,
        
        // Feedback
        feedback_comment: isEvaluated ? ['Good work!', 'Excellent effort', 'Keep improving', 'Needs more practice', 'Well done'][i % 5] : null,
        feedback_rating: isEvaluated ? Math.floor(Math.random() * 2) + 3 : null,
        teacher_remarks: isEvaluated ? ['Satisfactory', 'Impressive', 'Could do better', 'Outstanding', 'Average'][i % 5] : null,
        improvement_areas: isEvaluated && marksPercentage < 70 ? ['Accuracy', 'Presentation', 'Completeness'][i % 3] : null,
        strengths: isEvaluated && marksPercentage >= 70 ? ['Creativity', 'Neatness', 'Understanding'][i % 3] : null,
        parent_feedback: i % 8 === 0 ? 'Thank you for the feedback' : null,
        feedback_sent: isEvaluated && i % 2 === 0,
        feedback_sent_date: isEvaluated && i % 2 === 0 ? formatDate(evaluationDate) : null,
        feedback_acknowledged: isEvaluated && i % 4 === 0,
        
        // Statistics - Class Level
        total_submissions: totalSubmissions,
        evaluated_count: evaluatedCount,
        pending_evaluation: pendingEvaluation,
        evaluation_percentage: Number(((evaluatedCount / totalSubmissions) * 100).toFixed(1)),
        class_average: classAverage,
        class_highest: classHighest,
        class_lowest: classLowest,
        pass_count: passCount,
        fail_count: failCount,
        pass_percentage: Number(((passCount / totalSubmissions) * 100).toFixed(1)),
        
        // Statistics - Student Level
        student_average: isEvaluated ? 60 + (i % 30) : null,
        student_highest: isEvaluated ? 85 + (i % 15) : null,
        student_lowest: isEvaluated ? 40 + (i % 20) : null,
        total_homework_evaluated: 15 + (i % 10),
        total_marks_scored: 500 + (i * 15),
        total_max_marks: 750,
        overall_percentage: Number((((500 + (i * 15)) / 750) * 100).toFixed(1)),
        rank_in_class: (i % 30) + 1,
        trend: trends[i % 3],
        
        // Grade Distribution
        grade_a_plus: gradeAPlusCount,
        grade_a: gradeACount,
        grade_b_plus: gradeBPlusCount,
        grade_b: gradeBCount,
        grade_c_plus: gradeCPlusCount,
        grade_c: gradeCCount,
        grade_d: gradeDCount,
        grade_f: gradeFCount,
        
        // Comparison & Analysis
        above_average: marksPercentage > classAverage,
        below_average: marksPercentage < classAverage,
        deviation_from_avg: marksPercentage ? Number((marksPercentage - classAverage).toFixed(1)) : null,
        percentile: isEvaluated ? 100 - ((i % 30) + 1) * 3 : null,
        previous_score: isEvaluated ? marksPercentage - ((i % 20) - 10) : null,
        score_change: isEvaluated ? (i % 20) - 10 : null,
        score_change_percent: isEvaluated ? Number((((i % 20) - 10) / 100 * 100).toFixed(1)) : null,
        
        // Communication
        result_shared: isEvaluated && i % 2 === 0,
        result_shared_date: isEvaluated && i % 2 === 0 ? formatDate(evaluationDate) : null,
        parent_notified: isEvaluated && i % 3 === 0,
        notification_method: isEvaluated && i % 3 === 0 ? ['SMS', 'App', 'Email'][i % 3] : null,
        parent_viewed_result: isEvaluated && i % 4 === 0,
        parent_viewed_date: isEvaluated && i % 4 === 0 ? formatDate(new Date(evaluationDate?.getTime() + 86400000 * 2)) : null,
        revaluation_requested: i % 20 === 0,
        revaluation_status: i % 20 === 0 ? ['Pending', 'Approved', 'Rejected'][i % 3] : null,
        
        // Audit
        created_at: formatDate(assignedDate),
        updated_at: formatDate(new Date()),
        evaluated_by: isEvaluated ? teachers[(teacherIndex + 1) % 6] : null,
      };
    });
  };

  // Apply grouping and sorting
  const { groupedData, flatData } = useGroupedData(data, groupBy, sortBy, selectedColumnsObjects);

  // Export functionality
  const { exportToExcel, exportToPDF, exportToCSV, printReport } = useReportExport();

  // Handle export
  const handleExport = useCallback((format) => {
    const title = selectedTemplate?.name || 'Homework Evaluation Report';
    
    switch (format) {
      case 'excel':
        exportToExcel(flatData, selectedColumnsObjects, title);
        break;
      case 'pdf':
        exportToPDF(flatData, selectedColumnsObjects, title, moduleColor);
        break;
      case 'csv':
        exportToCSV(flatData, selectedColumnsObjects, title);
        break;
      case 'print':
        printReport(flatData, selectedColumnsObjects, title);
        break;
      default:
        break;
    }
  }, [flatData, selectedColumns, selectedTemplate, moduleColor, exportToExcel, exportToPDF, exportToCSV, printReport]);

  // Initial data load
  useEffect(() => {
    if (selectedBranch?.id && currentSessionId) {
      fetchData();
    }
  }, [selectedBranch?.id, currentSessionId, fetchData]);

  // Handle filter reset
  const handleResetFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);

  // Quick stats
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const totalEvaluations = data.length;
    const evaluated = data.filter(h => h.is_evaluated).length;
    const pending = data.filter(h => !h.is_evaluated).length;
    
    // Calculate average marks
    const evaluatedRecords = data.filter(h => h.marks_percentage);
    const avgMarks = evaluatedRecords.length > 0 
      ? Number((evaluatedRecords.reduce((sum, h) => sum + h.marks_percentage, 0) / evaluatedRecords.length).toFixed(1))
      : 0;
    
    // Calculate pass rate
    const passRecords = evaluatedRecords.filter(h => h.marks_percentage >= 40);
    const passRate = evaluatedRecords.length > 0
      ? Number(((passRecords.length / evaluatedRecords.length) * 100).toFixed(1))
      : 0;
    
    return { totalEvaluations, evaluated, pending, avgMarks, passRate };
  }, [data]);

  return (
    <ReportGeneratorLayout
      title="Homework Evaluation Reports"
      subtitle="Generate comprehensive evaluation reports - Grades, Analysis & Feedback"
      moduleColor={moduleColor}
      showSidebar={showSidebar}
      onToggleSidebar={() => setShowSidebar(!showSidebar)}
      onSave={() => setShowSaveModal(true)}
      onSchedule={() => setShowScheduleModal(true)}
    >
      <div className="flex h-full">
        {/* Template Sidebar */}
        {showSidebar && (
          <div className="w-80 border-r dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50 overflow-hidden flex-shrink-0">
            <TemplateSidebar
              templates={allTemplates}
              selectedTemplate={selectedTemplate?.key}
              onSelectTemplate={handleTemplateSelect}
              recentTemplates={[]}
              favoriteTemplates={[]}
              color={moduleColor}
            />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Quick Stats Bar */}
          {stats && (
            <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Records:</span>
                  <Badge variant="outline" className="font-bold dark:border-gray-600 dark:text-gray-200">{stats.totalEvaluations}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Evaluated:</span>
                  <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">{stats.evaluated}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Pending:</span>
                  <Badge className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300">{stats.pending}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Avg Marks:</span>
                  <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">{stats.avgMarks}%</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Pass Rate:</span>
                  <Badge className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">{stats.passRate}%</Badge>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchData}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Panels */}
          <div className="p-4 border-b dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Filters */}
              <Card className="shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-emerald-500" />
                    <CardTitle className="text-sm dark:text-gray-200">Filters</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <FilterPanel
                    filters={filters}
                    onFiltersChange={setFilters}
                    onReset={handleResetFilters}
                    classes={classes}
                    sections={sections}
                    sessions={sessions}
                    subjects={subjects}
                    teachers={teachers}
                    filterConfig={{
                      session: true,
                      class: true,
                      section: true,
                      subject: true,
                      teacher: selectedTemplate?.defaultFilterConfig?.teacher,
                      status: true,
                      dateRange: selectedTemplate?.defaultFilterConfig?.dateRange,
                      month: selectedTemplate?.defaultFilterConfig?.month,
                      student: selectedTemplate?.defaultFilterConfig?.student
                    }}
                    color={moduleColor}
                    compact
                  />
                </CardContent>
              </Card>

              {/* Columns */}
              <Card className="shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-500" />
                    <CardTitle className="text-sm dark:text-gray-200">Columns ({selectedColumns.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <ColumnSelector
                    availableColumns={HOMEWORK_EVAL_COLUMNS}
                    selectedColumns={selectedColumns}
                    onColumnsChange={setSelectedColumns}
                    moduleColor={moduleColor}
                    compact
                  />
                </CardContent>
              </Card>

              {/* Group & Sort */}
              <Card className="shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-purple-500" />
                    <CardTitle className="text-sm dark:text-gray-200">Group & Sort</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <GroupSortPanel
                    columns={selectedColumnsObjects}
                    groupBy={groupBy}
                    sortBy={sortBy}
                    onGroupByChange={setGroupBy}
                    onSortByChange={setSortBy}
                    moduleColor={moduleColor}
                    compact
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Export Bar */}
          <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedTemplate ? (
                  <>
                    <span className="font-medium text-gray-700 dark:text-gray-200">{selectedTemplate.name}</span>
                    <span className="mx-2">•</span>
                  </>
                ) : null}
                {flatData.length} records
              </span>
            </div>
            <ExportButtons
              data={flatData}
              columns={selectedColumnsObjects}
              title={selectedTemplate?.name || 'Homework Evaluation Report'}
              filename="homework_evaluation_report"
              color={moduleColor}
            />
          </div>

          {/* Data Table */}
          <div className="flex-1 overflow-auto p-4 bg-white dark:bg-gray-800">
            <LivePreviewTable
              data={groupedData}
              columns={selectedColumnsObjects}
              groupBy={groupBy}
              isLoading={isLoading}
              error={error}
              moduleColor={moduleColor}
              showGroupTotals={groupBy.length > 0}
            />
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={(name, description, isFavorite) => {
          const newTemplate = {
            key: `custom_${Date.now()}`,
            name,
            description,
            columns: selectedColumnsObjects,
            filters,
            groupBy,
            sortBy,
            isFavorite,
            createdAt: new Date().toISOString()
          };
          setSavedTemplates([...savedTemplates, newTemplate]);
          setShowSaveModal(false);
        }}
        config={{ columns: selectedColumnsObjects, filters, groupBy, sortBy }}
        moduleColor={moduleColor}
      />

      {/* Schedule Report Modal */}
      <ScheduleReportModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={(schedule) => {
          console.log('Schedule created:', schedule);
          setShowScheduleModal(false);
        }}
        reportName={selectedTemplate?.name || 'Homework Evaluation Report'}
      />
    </ReportGeneratorLayout>
  );
};

export default HomeworkEvaluationReportGenerator;
