/**
 * Examination Report Generator
 * Module 4: 45 Examination Report Templates
 * Categories: Marks & Results, Comparative Analysis, Exam Administration, Parent/Student Reports
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
import { EXAMINATION_TEMPLATES, EXAMINATION_CATEGORIES, getPopularTemplates } from './templates';
import { EXAMINATION_COLUMNS, COLUMN_SETS, getColumnsForSet } from './columns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Award,
  BarChart3,
  BookOpen,
  Filter, 
  RefreshCw,
  GraduationCap,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ExamReportGenerator = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  // Module configuration
  const moduleConfig = REPORT_MODULES['examinations'];
  const moduleColor = moduleConfig?.color || 'orange';

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
    defaultColumns: COLUMN_SETS.student_marksheet?.map(key => 
      EXAMINATION_COLUMNS.find(c => c.key === key)
    ).filter(Boolean) || []
  });

  // Templates for sidebar
  const allTemplates = useMemo(() => EXAMINATION_TEMPLATES, []);

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
        `${API_BASE}/reports/examinations?${queryParams}`,
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
    const category = selectedTemplate?.category || 'marks';
    
    if (category === 'marks') {
      return generateMarksData();
    } else if (category === 'comparative') {
      return generateComparativeData();
    } else if (category === 'admin') {
      return generateAdminData();
    } else {
      return generateParentData();
    }
  };

  // Marks & Results sample data
  const generateMarksData = () => {
    const classes = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    const sections = ['A', 'B', 'C'];
    const subjects = ['English', 'Hindi', 'Mathematics', 'Science', 'Social Studies', 'Computer'];
    const grades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'E'];
    const divisions = ['First', 'Second', 'Third'];
    const names = ['Rahul Sharma', 'Priya Verma', 'Amit Singh', 'Sneha Patel', 'Raj Kumar', 'Anita Gupta', 'Vikram Reddy', 'Pooja Das'];
    
    return Array.from({ length: 50 }, (_, i) => {
      const maxMarks = 100;
      const obtainedMarks = Math.floor(35 + Math.random() * 65);
      const percentage = (obtainedMarks / maxMarks) * 100;
      const gradeIndex = percentage >= 90 ? 0 : percentage >= 80 ? 1 : percentage >= 70 ? 2 : percentage >= 60 ? 3 : percentage >= 50 ? 4 : percentage >= 40 ? 5 : percentage >= 35 ? 6 : 7;
      
      return {
        id: i + 1,
        student_name: names[i % names.length],
        admission_no: `ADM${2024}${String(i + 1).padStart(4, '0')}`,
        roll_no: String((i % 40) + 1),
        class_name: classes[i % 10],
        section_name: sections[i % 3],
        gender: i % 2 === 0 ? 'Male' : 'Female',
        category: ['General', 'OBC', 'SC', 'ST'][i % 4],
        house: ['Red', 'Blue', 'Green', 'Yellow'][i % 4],
        exam_name: 'Annual Examination 2024-25',
        exam_type: ['Unit Test', 'Half Yearly', 'Annual'][i % 3],
        term: ['Term 1', 'Term 2', 'Term 3'][i % 3],
        subject_name: subjects[i % subjects.length],
        max_marks: maxMarks,
        obtained_marks: obtainedMarks,
        theory_marks: Math.floor(obtainedMarks * 0.7),
        practical_marks: Math.floor(obtainedMarks * 0.3),
        percentage: percentage.toFixed(2),
        grade: grades[gradeIndex],
        grade_point: 10 - gradeIndex,
        rank: i + 1,
        class_rank: (i % 10) + 1,
        division: percentage >= 60 ? divisions[0] : percentage >= 45 ? divisions[1] : divisions[2],
        pass_status: percentage >= 35 ? 'Pass' : 'Fail',
        promoted: percentage >= 35,
        total_marks: obtainedMarks,
        cgpa: ((10 - gradeIndex) * 0.9).toFixed(2)
      };
    });
  };

  // Comparative Analysis sample data
  const generateComparativeData = () => {
    const classes = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    const sections = ['A', 'B', 'C'];
    const names = ['Rahul Sharma', 'Priya Verma', 'Amit Singh', 'Sneha Patel', 'Raj Kumar'];
    const teachers = ['Mr. Suresh Kumar', 'Ms. Priya Sharma', 'Mr. Rajesh Verma', 'Ms. Anita Singh'];
    
    return Array.from({ length: 50 }, (_, i) => {
      const term1 = Math.floor(50 + Math.random() * 45);
      const term2 = Math.floor(50 + Math.random() * 45);
      const term3 = Math.floor(50 + Math.random() * 45);
      const avg = ((term1 + term2 + term3) / 3).toFixed(2);
      const lastYear = Math.floor(50 + Math.random() * 40);
      const thisYear = Math.floor(50 + Math.random() * 45);
      
      return {
        id: i + 1,
        student_name: names[i % names.length],
        admission_no: `ADM${2024}${String(i + 1).padStart(4, '0')}`,
        class_name: classes[i % 10],
        section_name: sections[i % 3],
        term_1_percentage: term1,
        term_2_percentage: term2,
        term_3_percentage: term3,
        average_percentage: avg,
        last_year_percentage: lastYear,
        this_year_percentage: thisYear,
        change_percentage: (thisYear - lastYear).toFixed(2),
        improvement_status: thisYear > lastYear ? 'Improved' : thisYear < lastYear ? 'Declined' : 'Same',
        exam_count: 3,
        variance: Math.abs(term1 - term3).toFixed(2),
        is_consistent: Math.abs(term1 - term3) < 10,
        teacher_name: teachers[i % teachers.length],
        subjects_taught: Math.floor(Math.random() * 3) + 1,
        classes_taught: Math.floor(Math.random() * 5) + 1,
        avg_result: (70 + Math.random() * 20).toFixed(2),
        trend: thisYear > lastYear ? 'Up' : 'Down',
        gender: i % 2 === 0 ? 'Male' : 'Female',
        category: ['General', 'OBC', 'SC', 'ST'][i % 4],
        house_name: ['Red House', 'Blue House', 'Green House', 'Yellow House'][i % 4],
        toppers_count: Math.floor(Math.random() * 5),
        best_performer: names[Math.floor(Math.random() * names.length)]
      };
    });
  };

  // Exam Administration sample data
  const generateAdminData = () => {
    const subjects = ['English', 'Hindi', 'Mathematics', 'Science', 'Social Studies', 'Computer'];
    const rooms = ['Room 101', 'Room 102', 'Room 103', 'Room 104', 'Hall A', 'Hall B'];
    const teachers = ['Mr. Suresh Kumar', 'Ms. Priya Sharma', 'Mr. Rajesh Verma', 'Ms. Anita Singh'];
    const names = ['Rahul Sharma', 'Priya Verma', 'Amit Singh', 'Sneha Patel', 'Raj Kumar'];
    const classes = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i % 6],
      exam_name: 'Annual Examination 2024-25',
      subject_name: subjects[i % subjects.length],
      start_time: '09:00 AM',
      end_time: '12:00 PM',
      duration: '3 hours',
      room_no: rooms[i % rooms.length],
      room_name: rooms[i % rooms.length],
      seat_no: `S${String(i + 1).padStart(3, '0')}`,
      seat_capacity: 40,
      seats_occupied: 35 + (i % 5),
      student_name: names[i % names.length],
      admission_no: `ADM${2024}${String(i + 1).padStart(4, '0')}`,
      roll_no: String((i % 40) + 1),
      class_name: classes[i % 10],
      section_name: ['A', 'B', 'C'][i % 3],
      hall_ticket_no: `HT${2024}${String(i + 1).padStart(5, '0')}`,
      generated: true,
      downloaded: i % 3 !== 0,
      printed: i % 4 === 0,
      invigilator_name: teachers[i % teachers.length],
      sheets_issued: 45,
      sheets_used: 40 + (i % 5),
      sheets_spoiled: i % 3,
      marks_entered: i % 3 !== 0,
      marks_pending: i % 3 === 0,
      marks_verified: i % 4 === 0,
      entered_by: teachers[i % teachers.length],
      entry_deadline: `2024-${String((i % 12) + 1).padStart(2, '0')}-15`,
      delay_days: i % 5
    }));
  };

  // Parent/Student Reports sample data
  const generateParentData = () => {
    const subjects = ['English', 'Hindi', 'Mathematics', 'Science', 'Social Studies', 'Computer'];
    const names = ['Rahul Sharma', 'Priya Verma', 'Amit Singh', 'Sneha Patel', 'Raj Kumar'];
    const activities = ['Sports', 'Music', 'Art', 'Dance', 'Drama', 'Debating'];
    const grades = ['A+', 'A', 'B+', 'B', 'C+', 'C'];
    const teachers = ['Mr. Suresh Kumar', 'Ms. Priya Sharma', 'Mr. Rajesh Verma', 'Ms. Anita Singh'];
    
    return Array.from({ length: 50 }, (_, i) => {
      const marks = Math.floor(50 + Math.random() * 45);
      
      return {
        id: i + 1,
        student_name: names[i % names.length],
        admission_no: `ADM${2024}${String(i + 1).padStart(4, '0')}`,
        roll_no: String((i % 40) + 1),
        class_name: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'][i % 10],
        section_name: ['A', 'B', 'C'][i % 3],
        father_name: `${names[i % names.length].split(' ')[1]} (Father)`,
        mother_name: `${names[i % names.length].split(' ')[1]} (Mother)`,
        contact_no: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        exam_name: ['Unit Test 1', 'Half Yearly', 'Unit Test 2', 'Annual'][i % 4],
        subject_name: subjects[i % subjects.length],
        grade: grades[i % grades.length],
        marks_obtained: marks,
        max_marks: 100,
        percentage: marks,
        overall_grade: grades[Math.floor(i / 5) % grades.length],
        cgpa: (7 + Math.random() * 3).toFixed(2),
        rank: (i % 40) + 1,
        total_students: 40,
        rank_suffix: ['st', 'nd', 'rd', 'th'][Math.min((i % 40), 3)],
        exam_1: Math.floor(50 + Math.random() * 45),
        exam_2: Math.floor(50 + Math.random() * 45),
        exam_3: Math.floor(50 + Math.random() * 45),
        exam_4: Math.floor(50 + Math.random() * 45),
        exam_5: Math.floor(50 + Math.random() * 45),
        activity_name: activities[i % activities.length],
        activity_grade: grades[i % grades.length],
        activity_remarks: 'Good participation and improvement shown',
        parameter: ['Punctuality', 'Discipline', 'Behavior', 'Participation'][i % 4],
        behavior_grade: grades[i % grades.length],
        discipline_grade: grades[(i + 1) % grades.length],
        conduct: ['Excellent', 'Good', 'Satisfactory'][i % 3],
        teacher_name: teachers[i % teachers.length],
        teacher_remarks: 'Shows good progress. Keep up the good work!',
        class_teacher_remarks: 'Regular and hardworking student.',
        principal_remarks: 'Well done!',
        meeting_date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String(15 + (i % 10)).padStart(2, '0')}`,
        discussed_points: 'Academic progress, areas of improvement',
        action_items: 'Focus on weak subjects, more practice',
        attendance_percentage: 85 + (i % 15),
        working_days: 220,
        present_days: 190 + (i % 25)
      };
    });
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
    
    const totalStudents = data.length;
    const passCount = data.filter(d => d.pass_status === 'Pass' || d.promoted).length;
    const failCount = totalStudents - passCount;
    const avgPercentage = data.reduce((sum, d) => sum + (parseFloat(d.percentage) || 0), 0) / totalStudents;
    
    return {
      totalStudents,
      passCount,
      failCount,
      passPercentage: ((passCount / totalStudents) * 100).toFixed(1),
      avgPercentage: avgPercentage.toFixed(1)
    };
  }, [data]);

  // Clear data when branch/session changes
  useEffect(() => {
    setData([]);
  }, [selectedBranch?.id, currentSessionId, setData]);

  return (
    <ReportGeneratorLayout
      moduleId="examinations"
      moduleTitle="Examination Reports"
      moduleDescription="45 comprehensive examination report templates for marks analysis, result management, and performance tracking"
      moduleColor={moduleColor}
      icon={FileText}
      templateCount={EXAMINATION_TEMPLATES.length}
      categoryCount={EXAMINATION_CATEGORIES.length}
    >
      <div className="flex h-full">
        {/* Template Sidebar */}
        <TemplateSidebar
          templates={allTemplates}
          categories={EXAMINATION_CATEGORIES}
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
            <div className="bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800 p-3">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-600 dark:text-gray-400">Students:</span>
                  <span className="font-semibold text-purple-700 dark:text-purple-300">{getSummaryStats.totalStudents}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600 dark:text-gray-400">Pass:</span>
                  <span className="font-semibold text-green-700 dark:text-green-300">{getSummaryStats.passCount} ({getSummaryStats.passPercentage}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-gray-600 dark:text-gray-400">Fail:</span>
                  <span className="font-semibold text-red-700 dark:text-red-300">{getSummaryStats.failCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600 dark:text-gray-400">Avg %:</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-300">{getSummaryStats.avgPercentage}%</span>
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
              filterConfig={{
                session: false,
                class: true,
                section: true,
                exam: true,
                subject: true
              }}
              color={moduleColor}
            />
            
            {/* Column & Group Controls */}
            <div className="flex flex-wrap items-center gap-4">
              <ColumnSelector
                allColumns={EXAMINATION_COLUMNS}
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
                templateName={selectedTemplate?.name || 'Examination Report'}
                moduleId="examinations"
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
        moduleId="examinations"
      />
      
      <ScheduleReportModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={(schedule) => {
          console.log('Schedule created:', schedule);
          setShowScheduleModal(false);
        }}
        reportName={selectedTemplate?.name || 'Exam Report'}
      />
    </ReportGeneratorLayout>
  );
};

export default ExamReportGenerator;
