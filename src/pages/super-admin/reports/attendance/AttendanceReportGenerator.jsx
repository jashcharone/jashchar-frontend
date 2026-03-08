/**
 * Attendance Report Generator
 * Main page component for generating attendance reports
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
  useSavedTemplates,
  REPORT_MODULES
} from '../ReportGeneratorShared';
import { ATTENDANCE_TEMPLATES, TEMPLATE_CATEGORIES } from './templates';
import { ATTENDANCE_COLUMNS, getColumns, COLUMN_SETS } from './columns';
import { fetchAttendanceDataFromSupabase } from '../ReportGeneratorShared/reportQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Filter } from 'lucide-react';

const AttendanceReportGenerator = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  // Module configuration
  const moduleConfig = REPORT_MODULES['attendance'];
  const moduleColor = moduleConfig?.color || 'purple';

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
    defaultColumns: COLUMN_SETS.daily_basic  // Store as keys (strings), not objects
  });

  // Fetch saved templates from DB
  const { 
    savedTemplates: dbSavedTemplates, 
    refetch: refetchSavedTemplates,
    deleteTemplate,
    toggleFavorite
  } = useSavedTemplates('attendance');

  // Merge DB saved templates into local state on load
  useEffect(() => {
    if (dbSavedTemplates.length > 0) {
      setSavedTemplates(dbSavedTemplates);
    }
  }, [dbSavedTemplates, setSavedTemplates]);

  // Convert selected column keys to full column objects for table/export
  const selectedColumnsObjects = useMemo(() => {
    return selectedColumns
      .map(key => ATTENDANCE_COLUMNS.find(c => c.key === key))
      .filter(Boolean);
  }, [selectedColumns]);

  // Templates for sidebar - merge built-in templates with saved templates
  const allTemplates = useMemo(() => {
    const customTemplates = savedTemplates.map(t => ({
      ...t,
      category: 'Custom Templates',
      isCustom: true
    }));
    return [...ATTENDANCE_TEMPLATES, ...customTemplates];
  }, [savedTemplates]);

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
      const attendanceData = await fetchAttendanceDataFromSupabase({
        branchId: selectedBranch.id,
        organizationId,
        sessionId: currentSessionId,
        dateFrom: filters.date_from,
        dateTo: filters.date_to,
        classId: filters.class_id,
        sectionId: filters.section_id,
        status: filters.status
      });

      setData(attendanceData);
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
    const classes = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    const sections = ['A', 'B', 'C'];
    const statuses = ['present', 'present', 'present', 'present', 'absent', 'late'];
    const subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Computer'];
    const today = new Date().toISOString().split('T')[0];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      admission_number: `ADM${2024}${String(i + 1).padStart(4, '0')}`,
      first_name: ['Rahul', 'Priya', 'Amit', 'Sneha', 'Raj', 'Anita', 'Vikram', 'Meena', 'Arun', 'Kavya'][i % 10],
      last_name: ['Sharma', 'Verma', 'Singh', 'Patel', 'Kumar', 'Gupta', 'Rao', 'Reddy', 'Joshi', 'Nair'][i % 10],
      roll_number: String((i % 40) + 1),
      class: { name: classes[i % 10], id: i % 10 + 1 },
      section: { name: sections[i % 3], id: i % 3 + 1 },
      gender: i % 2 === 0 ? 'Male' : 'Female',
      attendance_date: today,
      status: statuses[i % 6],
      check_in_time: `08:${String(30 + (i % 30)).padStart(2, '0')}`,
      check_out_time: `03:${String(30 + (i % 30)).padStart(2, '0')}`,
      late_minutes: statuses[i % 6] === 'late' ? (i % 20) + 5 : 0,
      remarks: statuses[i % 6] === 'absent' ? 'Not informed' : '',
      marked_by: ['Mrs. Sharma', 'Mr. Verma', 'Ms. Singh'][i % 3],
      period_number: (i % 8) + 1,
      subject: { name: subjects[i % 6], code: subjects[i % 6].substring(0, 3).toUpperCase() },
      teacher: { name: ['Mrs. Sharma', 'Mr. Verma', 'Ms. Singh', 'Mr. Kumar'][i % 4] },
      period_status: statuses[i % 6],
      working_days: 22,
      days_present: 20 - (i % 5),
      days_absent: i % 5,
      days_late: i % 3,
      attendance_percentage: ((20 - (i % 5)) / 22 * 100),
      consecutive_absent: statuses[i % 6] === 'absent' ? (i % 4) + 1 : 0,
      last_absent_date: statuses[i % 6] === 'absent' ? today : null,
      father_name: `${['Rajesh', 'Suresh', 'Mukesh', 'Ramesh'][i % 4]} ${['Sharma', 'Verma'][i % 2]}`,
      father_phone: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      parent_notified: i % 3 === 0 ? 'Yes' : 'No'
    }));
  };

  // Initial data load
  useEffect(() => {
    if (selectedBranch?.id && currentSessionId && organizationId) {
      fetchData();
    }
  }, [selectedBranch?.id, currentSessionId, organizationId]);

  // Calculate stats from data
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const present = data.filter(d => d.status === 'present').length;
    const absent = data.filter(d => d.status === 'absent').length;
    const late = data.filter(d => d.status === 'late').length;
    const total = data.length;
    
    return {
      total,
      present,
      absent,
      late,
      percentage: total > 0 ? ((present / total) * 100).toFixed(1) : 0
    };
  }, [data]);

  // Group and sort data
  const { groupedData, flatData } = useGroupedData(data, groupBy, sortBy, selectedColumnsObjects);

  return (
    <ReportGeneratorLayout
      title="Attendance Reports"
      subtitle="Report Generator"
      moduleColor={moduleColor}
      showSidebar={showSidebar}
      onToggleSidebar={() => setShowSidebar(!showSidebar)}
      onSave={() => setShowSaveModal(true)}
      onSchedule={() => setShowScheduleModal(true)}
    >
      <div className="flex h-full">
        {/* Template Sidebar */}
        {showSidebar && (
          <div className="w-56 border-r dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50 overflow-hidden flex-shrink-0">
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
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total:</span>
                  <Badge variant="outline" className="font-bold dark:border-gray-600 dark:text-gray-200">{stats.total}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Present:</span>
                  <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">{stats.present}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Absent:</span>
                  <Badge className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">{stats.absent}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Late:</span>
                  <Badge className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300">{stats.late}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Attendance:</span>
                  <Badge className={`${parseFloat(stats.percentage) >= 75 ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'}`}>
                    {stats.percentage}%
                  </Badge>
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
          <div className="p-3 border-b dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* Filters */}
              <Card className="shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-green-500" />
                    <CardTitle className="text-sm dark:text-gray-200">Filters</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
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
                      status: true,
                      dateRange: true,
                      month: selectedTemplate?.defaultFilterConfig?.month
                    }}
                    color={moduleColor}
                    compact
                  />
                </CardContent>
              </Card>

              {/* Column Selector */}
              <Card className="shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm dark:text-gray-200 flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-500 rounded" />
                    Columns ({selectedColumns.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <ColumnSelector
                    availableColumns={ATTENDANCE_COLUMNS}
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
                  <CardTitle className="text-sm dark:text-gray-200 flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-500 rounded" />
                    Group & Sort
                  </CardTitle>
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

          {/* Data Preview Section */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Record Count & Export */}
            <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {flatData.length} records
              </span>
              <ExportButtons
                data={flatData}
                columns={selectedColumnsObjects}
                filename="attendance_report"
                title={selectedTemplate?.name || 'Attendance Report'}
                color={moduleColor}
                // Enhanced props for school header & grand total
                schoolInfo={selectedBranch ? {
                  name: selectedBranch.name,
                  address: selectedBranch.address,
                  phone: selectedBranch.phone,
                  email: selectedBranch.email,
                  logo: selectedBranch.logo_url,
                  district: selectedBranch.district,
                  state: selectedBranch.state,
                  affiliationNo: selectedBranch.affiliation_no
                } : null}
                showSchoolHeader={true}
                showGrandTotal={false}
                showFilterInfo={true}
                filterInfo={{
                  session: sessions?.find(s => s.id === currentSessionId)?.name || '',
                  className: classes?.find(c => c.id === filters?.classId)?.name || '',
                  sectionName: sections?.find(s => s.id === filters?.sectionId)?.name || '',
                  dateFrom: filters?.dateFrom || '',
                  dateTo: filters?.dateTo || ''
                }}
                preparedBy=""
                authorizedBy=""
                // History logging props
                saveHistory={true}
                module="attendance"
                templateKey={selectedTemplate?.key || ''}
                branchId={selectedBranch?.id}
                organizationId={organizationId}
                sessionId={currentSessionId}
                userId={user?.id}
              />
            </div>

            {/* Live Preview Table */}
            <div className="flex-1 overflow-auto">
              <LivePreviewTable
                data={groupedData}
                columns={selectedColumnsObjects}
                groupBy={groupBy}
                isLoading={isLoading}
                error={error}
                moduleColor={moduleColor}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={(templateData) => {
          // Refresh saved templates from DB to include the new template
          refetchSavedTemplates();
          setShowSaveModal(false);
        }}
        templateConfig={{ columns: selectedColumnsObjects, filters, groupBy, sortBy }}
        module="attendance"
        branchId={selectedBranch?.id}
        organizationId={organizationId}
        sessionId={currentSessionId}
        userId={user?.id}
      />

      {/* Schedule Report Modal */}
      <ScheduleReportModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={(schedule) => {
          console.log('Schedule created:', schedule);
          setShowScheduleModal(false);
        }}
        reportName={selectedTemplate?.name || 'Attendance Report'}
      />
    </ReportGeneratorLayout>
  );
};

export default AttendanceReportGenerator;
