/**
 * Homework Report Generator
 * Complete homework reporting with 25 templates
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
import { HOMEWORK_TEMPLATES, TEMPLATE_CATEGORIES } from './templates';
import { HOMEWORK_COLUMNS, getColumns, COLUMN_SETS } from './columns';
import { fetchHomeworkDataFromSupabase } from '../ReportGeneratorShared/reportQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, 
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
  Calendar 
} from 'lucide-react';

const HomeworkReportGenerator = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  // Module configuration
  const moduleConfig = REPORT_MODULES['homework'];
  const moduleColor = moduleConfig?.color || 'cyan';

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
    defaultColumns: COLUMN_SETS.all_assignments  // Store as keys (strings), not objects
  });

  // Convert selected column keys to full column objects for table/export
  const selectedColumnsObjects = useMemo(() => {
    return selectedColumns
      .map(key => HOMEWORK_COLUMNS.find(c => c.key === key))
      .filter(Boolean);
  }, [selectedColumns]);

  // Templates for sidebar
  const allTemplates = useMemo(() => HOMEWORK_TEMPLATES, []);

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

  // Fetch data directly from Supabase (no backend required)
  const fetchData = useCallback(async () => {
    if (!selectedBranch?.id || !currentSessionId || !organizationId) {
      setError('Please select branch and session');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const homeworkData = await fetchHomeworkDataFromSupabase({
        branchId: selectedBranch.id,
        organizationId,
        sessionId: currentSessionId,
        dateFrom: filters.date_from,
        dateTo: filters.date_to,
        classId: filters.class_id,
        subjectId: filters.subject_id,
        status: filters.status
      });

      setData(homeworkData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      setData([]);
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
    const students = ['Rahul Sharma', 'Priya Verma', 'Amit Singh', 'Sneha Patel', 'Raj Kumar', 'Kavya Reddy', 'Arjun Nair', 'Meera Iyer'];
    const homeworkTypes = ['Written', 'Practical', 'Project', 'Research', 'Reading'];
    const submissionTypes = ['Digital', 'Physical', 'Both'];
    const submissionStatuses = ['Submitted', 'Late', 'Pending', 'Not Submitted'];
    
    return Array.from({ length: 60 }, (_, i) => {
      const classIndex = i % 6;
      const sectionIndex = i % 3;
      const subjectIndex = i % 8;
      const teacherIndex = i % 6;
      const studentIndex = i % 8;
      const isSubmitted = i % 4 !== 3;
      const isLate = i % 5 === 0;
      const daysOverdue = !isSubmitted && i % 3 === 0 ? (i % 10) + 1 : 0;
      
      // Calculate dates
      const today = new Date();
      const assignedDate = new Date(today);
      assignedDate.setDate(today.getDate() - (i % 30));
      const dueDate = new Date(assignedDate);
      dueDate.setDate(assignedDate.getDate() + 3);
      const submittedDate = isSubmitted ? new Date(dueDate) : null;
      if (submittedDate && isLate) {
        submittedDate.setDate(dueDate.getDate() + (i % 3) + 1);
      }
      
      const formatDate = (d) => d ? d.toISOString().split('T')[0] : null;
      
      // Calculate statistics
      const totalStudents = 30 + (i % 10);
      const submittedCount = Math.floor(totalStudents * (0.6 + Math.random() * 0.35));
      const pendingCount = totalStudents - submittedCount;
      const lateCount = Math.floor(submittedCount * 0.15);
      const onTimeCount = submittedCount - lateCount;
      
      return {
        id: i + 1,
        homework_id: `HW${String(i + 1).padStart(5, '0')}`,
        
        // Assignment Info
        homework_title: `${subjects[subjectIndex]} - ${['Chapter', 'Unit', 'Exercise', 'Worksheet'][i % 4]} ${(i % 20) + 1}`,
        homework_description: `Complete ${homeworkTypes[i % 5].toLowerCase()} assignment for ${subjects[subjectIndex]}`,
        homework_type: homeworkTypes[i % 5],
        subject_name: subjects[subjectIndex],
        subject_code: subjects[subjectIndex].substring(0, 3).toUpperCase(),
        subject_group: ['Core', 'Elective', 'Language', 'Co-curricular'][i % 4],
        chapter_name: `Chapter ${(i % 15) + 1}`,
        max_marks: [10, 20, 25, 50][i % 4],
        weightage: [5, 10, 15, 20][i % 4],
        
        // Class Info
        class_id: classIndex + 1,
        class_name: classes[classIndex],
        section_id: sectionIndex + 1,
        section_name: sections[sectionIndex],
        class_strength: totalStudents,
        
        // Dates
        assigned_date: formatDate(assignedDate),
        due_date: formatDate(dueDate),
        submission_date: formatDate(submittedDate),
        days_to_submit: 3,
        days_overdue: daysOverdue,
        is_overdue: daysOverdue > 0,
        
        // Teacher Info
        teacher_id: teacherIndex + 1,
        teacher_name: teachers[teacherIndex],
        teacher_employee_code: `EMP${String(teacherIndex + 1).padStart(4, '0')}`,
        department: ['Science', 'Mathematics', 'Languages', 'Social Science'][teacherIndex % 4],
        
        // Student Info
        student_id: studentIndex + 1,
        student_name: students[studentIndex],
        admission_no: `ADM${2024}${String(studentIndex + 1).padStart(4, '0')}`,
        roll_number: studentIndex + 1,
        student_contact: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        parent_name: `Mr. ${students[studentIndex].split(' ')[1]}`,
        parent_contact: `97${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        
        // Submission Info
        is_submitted: isSubmitted,
        submission_status: isSubmitted ? (isLate ? 'Late' : 'Submitted') : (daysOverdue > 0 ? 'Overdue' : 'Pending'),
        submitted_on: formatDate(submittedDate),
        submission_type: submissionTypes[i % 3],
        file_attached: i % 3 === 0,
        attachment_url: i % 3 === 0 ? `/uploads/homework/${i + 1}.pdf` : null,
        remarks: ['Good work!', 'Complete with more examples', 'Well presented', 'Need improvement', ''][i % 5],
        
        // Statistics
        total_students: totalStudents,
        submitted_count: submittedCount,
        pending_count: pendingCount,
        late_count: lateCount,
        on_time_count: onTimeCount,
        submission_rate: Number(((submittedCount / totalStudents) * 100).toFixed(1)),
        on_time_rate: Number(((onTimeCount / totalStudents) * 100).toFixed(1)),
        
        // Student-level submission stats
        total_homework_given: 20 + (i % 10),
        student_submitted_count: 15 + (i % 10),
        student_pending_count: (i % 5),
        submission_percentage: Number((((15 + (i % 10)) / (20 + (i % 10))) * 100).toFixed(1)),
        submission_streak: i % 15,
        late_by_days: isLate ? (i % 3) + 1 : 0,
        
        // Communication
        notification_sent: i % 2 === 0,
        notification_date: i % 2 === 0 ? formatDate(assignedDate) : null,
        sms_sent: i % 3 === 0,
        app_notified: i % 2 === 0,
        parent_viewed: i % 4 !== 0,
        parent_viewed_at: i % 4 !== 0 ? formatDate(assignedDate) : null,
        parent_acknowledged: i % 5 !== 0,
        parent_signed: i % 6 !== 0,
        
        // Daily Statistics
        date: formatDate(assignedDate),
        homework_count: (i % 5) + 1,
        subjects_covered: (i % 3) + 1,
        
        // Re-assignment
        is_reassigned: i % 10 === 0,
        reassign_reason: i % 10 === 0 ? ['Holiday', 'Schedule Change', 'Syllabus Update'][i % 3] : null,
        original_due_date: i % 10 === 0 ? formatDate(dueDate) : null,
        reassign_date: i % 10 === 0 ? formatDate(new Date(dueDate.getTime() + 86400000)) : null,
        
        // Audit
        created_at: formatDate(assignedDate),
        updated_at: formatDate(new Date()),
        created_by: teachers[teacherIndex],
        
        // Week number for trends
        week_number: Math.floor(i / 7) + 1,
        
        // Acknowledgement
        acknowledge_date: i % 5 !== 0 ? formatDate(new Date(assignedDate.getTime() + 86400000)) : null,
      };
    });
  };

  // Apply grouping and sorting
  const { groupedData, flatData } = useGroupedData(data, groupBy, sortBy, selectedColumnsObjects);

  // Export functionality
  const { exportToExcel, exportToPDF, exportToCSV, printReport } = useReportExport();

  // Handle export
  const handleExport = useCallback((format) => {
    const title = selectedTemplate?.name || 'Homework Report';
    
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
    
    const totalAssignments = data.length;
    const submitted = data.filter(h => h.is_submitted).length;
    const pending = data.filter(h => !h.is_submitted && !h.is_overdue).length;
    const overdue = data.filter(h => h.is_overdue).length;
    
    // Calculate average submission rate
    const avgSubmissionRate = data.length > 0 
      ? Number((data.reduce((sum, h) => sum + (h.submission_rate || 0), 0) / data.length).toFixed(1))
      : 0;
    
    return { totalAssignments, submitted, pending, overdue, avgSubmissionRate };
  }, [data]);

  return (
    <ReportGeneratorLayout
      title="Homework Reports"
      subtitle="Generate comprehensive homework reports - Assignments, Submissions & Parent Communication"
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
                  <ClipboardList className="h-4 w-4 text-cyan-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Assignments:</span>
                  <Badge variant="outline" className="font-bold dark:border-gray-600 dark:text-gray-200">{stats.totalAssignments}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Submitted:</span>
                  <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">{stats.submitted}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Pending:</span>
                  <Badge className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300">{stats.pending}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Overdue:</span>
                  <Badge className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">{stats.overdue}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Avg Rate:</span>
                  <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">{stats.avgSubmissionRate}%</Badge>
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
                    <Filter className="h-4 w-4 text-cyan-500" />
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
                      status: selectedTemplate?.defaultFilterConfig?.status,
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
                    availableColumns={HOMEWORK_COLUMNS}
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
              title={selectedTemplate?.name || 'Homework Report'}
              filename="homework_report"
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
        onSave={(templateData) => {
          const newTemplate = {
            key: `custom_${Date.now()}`,
            name: templateData.name,
            description: templateData.description,
            columns: selectedColumnsObjects,
            filters,
            groupBy,
            sortBy,
            isFavorite: templateData.is_favorite,
            createdAt: new Date().toISOString()
          };
          setSavedTemplates([...savedTemplates, newTemplate]);
          setShowSaveModal(false);
        }}
        templateConfig={{ columns: selectedColumnsObjects, filters, groupBy, sortBy }}
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
        reportName={selectedTemplate?.name || 'Homework Report'}
      />
    </ReportGeneratorLayout>
  );
};

export default HomeworkReportGenerator;
