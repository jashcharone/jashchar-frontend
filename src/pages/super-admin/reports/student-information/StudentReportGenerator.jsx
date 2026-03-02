/**
 * Student Information Report Generator
 * Main page component for generating student reports
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
import { STUDENT_TEMPLATES, TEMPLATE_CATEGORIES } from './templates';
import { STUDENT_COLUMNS, getColumns, COLUMN_SETS } from './columns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, BarChart3, Download, Filter, RefreshCw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const StudentReportGenerator = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  // Module configuration
  const moduleConfig = REPORT_MODULES['student-information'];
  const moduleColor = moduleConfig?.color || 'blue';

  // Master data for filters (from shared hook)
  const { 
    classes, 
    sections, 
    sessions, 
    fetchSectionsByClass,
    selectedSessionId,
    setSelectedSessionId,
    effectiveSessionId,
    refetch: refetchFilterOptions 
  } = useFilterOptions();
  
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
    defaultColumns: COLUMN_SETS.basic  // Store as keys (strings), not objects
  });

  // Convert selected column keys to full column objects for table/export
  const selectedColumnsObjects = useMemo(() => {
    return selectedColumns
      .map(key => STUDENT_COLUMNS.find(c => c.key === key))
      .filter(Boolean);
  }, [selectedColumns]);

  // Templates for sidebar - direct array with category property
  const allTemplates = useMemo(() => STUDENT_TEMPLATES, []);

  // Handle template selection - receives full template object from TemplateSidebar
  const handleTemplateSelect = useCallback((template) => {
    if (template) {
      setSelectedTemplate(template);
      // Store column keys, not full objects
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

      // Get Supabase session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `${API_BASE}/reports/students?${queryParams}`,
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
    const classes = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    const sections = ['A', 'B', 'C'];
    const statuses = ['active', 'active', 'active', 'left', 'tc_issued'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      admission_number: `ADM${2024}${String(i + 1).padStart(4, '0')}`,
      first_name: ['Rahul', 'Priya', 'Amit', 'Sneha', 'Raj', 'Anita', 'Vikram', 'Meena', 'Arun', 'Kavya'][i % 10],
      last_name: ['Sharma', 'Verma', 'Singh', 'Patel', 'Kumar', 'Gupta', 'Rao', 'Reddy', 'Joshi', 'Nair'][i % 10],
      class: { name: classes[i % 10], id: i % 10 + 1 },
      section: { name: sections[i % 3], id: i % 3 + 1 },
      roll_number: String((i % 40) + 1),
      gender: i % 2 === 0 ? 'Male' : 'Female',
      date_of_birth: `${2010 + (i % 10)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      father_name: `${['Rajesh', 'Suresh', 'Mukesh', 'Ramesh', 'Naresh'][i % 5]} ${['Sharma', 'Verma', 'Singh', 'Patel', 'Kumar'][i % 5]}`,
      mother_name: `${['Sunita', 'Anita', 'Kavita', 'Savita', 'Rita'][i % 5]} ${['Sharma', 'Verma', 'Singh', 'Patel', 'Kumar'][i % 5]}`,
      phone: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      email: `student${i + 1}@school.com`,
      address: `${i + 1}, Sample Street, Sample City`,
      city: ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad'][i % 5],
      state: ['Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Telangana'][i % 5],
      pincode: `5${String(60000 + (i * 10))}`,
      admission_date: `2024-04-${String((i % 28) + 1).padStart(2, '0')}`,
      category: ['General', 'OBC', 'SC', 'ST'][i % 4],
      religion: ['Hindu', 'Muslim', 'Christian', 'Sikh'][i % 4],
      blood_group: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-'][i % 7],
      status: statuses[i % 5],
      photo_url: null
    }));
  };

  // Apply grouping and sorting to data
  const { groupedData, flatData: rawFlatData } = useGroupedData(data, groupBy, sortBy, selectedColumnsObjects);

  // Debug log raw data
  useEffect(() => {
    if (data.length > 0) {
      console.log('[Report Debug] Raw data sample:', data[0]);
      console.log('[Report Debug] Total data count:', data.length);
      const genders = [...new Set(data.map(s => s.gender))];
      console.log('[Report Debug] Unique genders in data:', genders);
    }
  }, [data]);

  // Debug: Log template changes
  useEffect(() => {
    console.log('[Report Debug] Template changed:', {
      key: selectedTemplate?.key,
      isStrengthReport: selectedTemplate?.isStrengthReport,
      columns: selectedTemplate?.columns?.map(c => c.key)
    });
  }, [selectedTemplate]);

  // Aggregate data for strength reports
  const aggregatedStrengthData = useMemo(() => {
    console.log('[Report Debug] aggregatedStrengthData useMemo running:', {
      templateKey: selectedTemplate?.key,
      isStrengthReport: selectedTemplate?.isStrengthReport,
      dataLength: data?.length || 0
    });

    if (!selectedTemplate?.isStrengthReport || !data || data.length === 0) {
      console.log('[Report Debug] Returning null from aggregatedStrengthData:', {
        notStrengthReport: !selectedTemplate?.isStrengthReport,
        noData: !data,
        emptyData: data?.length === 0
      });
      return null;
    }

    // Helper: case-insensitive gender check
    const isMale = (g) => g?.toLowerCase() === 'male';
    const isFemale = (g) => g?.toLowerCase() === 'female';

    const templateKey = selectedTemplate.key;
    
    // Class-wise strength
    if (templateKey === 'class_wise_strength') {
      const classMap = new Map();
      data.forEach(student => {
        const className = student.class?.name || 'Unknown';
        if (!classMap.has(className)) {
          classMap.set(className, { boys: 0, girls: 0 });
        }
        const counts = classMap.get(className);
        if (isMale(student.gender)) counts.boys++;
        else if (isFemale(student.gender)) counts.girls++;
      });
      return Array.from(classMap.entries()).map(([className, counts]) => ({
        class_name: className,
        boys_count: counts.boys,
        girls_count: counts.girls,
        total_count: counts.boys + counts.girls
      })).sort((a, b) => a.class_name.localeCompare(b.class_name));
    }
    
    // Section-wise strength
    if (templateKey === 'section_wise_strength') {
      const sectionMap = new Map();
      data.forEach(student => {
        const className = student.class?.name || 'Unknown';
        const sectionName = student.section?.name || 'Unknown';
        const key = `${className}|${sectionName}`;
        if (!sectionMap.has(key)) {
          sectionMap.set(key, { className, sectionName, boys: 0, girls: 0 });
        }
        const counts = sectionMap.get(key);
        if (isMale(student.gender)) counts.boys++;
        else if (isFemale(student.gender)) counts.girls++;
      });
      return Array.from(sectionMap.values()).map(item => ({
        class_name: item.className,
        section_name: item.sectionName,
        boys_count: item.boys,
        girls_count: item.girls,
        total_count: item.boys + item.girls
      })).sort((a, b) => a.class_name.localeCompare(b.class_name) || a.section_name.localeCompare(b.section_name));
    }

    // Gender ratio analysis
    if (templateKey === 'gender_ratio') {
      const classMap = new Map();
      data.forEach(student => {
        const className = student.class?.name || 'Unknown';
        if (!classMap.has(className)) {
          classMap.set(className, { boys: 0, girls: 0 });
        }
        const counts = classMap.get(className);
        if (isMale(student.gender)) counts.boys++;
        else if (isFemale(student.gender)) counts.girls++;
      });
      return Array.from(classMap.entries()).map(([className, counts]) => {
        const total = counts.boys + counts.girls;
        const ratio = counts.girls > 0 ? (counts.boys / counts.girls).toFixed(2) : 'N/A';
        return {
          class_name: className,
          boys_count: counts.boys,
          girls_count: counts.girls,
          total_count: total,
          ratio: ratio,
          boys_percent: total > 0 ? ((counts.boys / total) * 100).toFixed(1) + '%' : '0%',
          girls_percent: total > 0 ? ((counts.girls / total) * 100).toFixed(1) + '%' : '0%'
        };
      }).sort((a, b) => a.class_name.localeCompare(b.class_name));
    }

    // Age-wise distribution
    if (templateKey === 'age_wise_distribution') {
      const ageMap = new Map();
      const currentYear = new Date().getFullYear();
      data.forEach(student => {
        const dob = student.date_of_birth;
        let age = 'Unknown';
        if (dob) {
          const birthYear = new Date(dob).getFullYear();
          age = currentYear - birthYear;
        }
        if (!ageMap.has(age)) {
          ageMap.set(age, { boys: 0, girls: 0 });
        }
        const counts = ageMap.get(age);
        if (isMale(student.gender)) counts.boys++;
        else if (isFemale(student.gender)) counts.girls++;
      });
      return Array.from(ageMap.entries()).map(([age, counts]) => ({
        age: age,
        boys_count: counts.boys,
        girls_count: counts.girls,
        total_count: counts.boys + counts.girls
      })).sort((a, b) => (typeof a.age === 'number' ? a.age : 999) - (typeof b.age === 'number' ? b.age : 999));
    }

    // Category-wise strength
    if (templateKey === 'category_wise_strength') {
      const categoryMap = new Map();
      data.forEach(student => {
        const category = student.category || 'General';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { boys: 0, girls: 0 });
        }
        const counts = categoryMap.get(category);
        if (isMale(student.gender)) counts.boys++;
        else if (isFemale(student.gender)) counts.girls++;
      });
      return Array.from(categoryMap.entries()).map(([category, counts]) => ({
        category: category,
        boys_count: counts.boys,
        girls_count: counts.girls,
        total_count: counts.boys + counts.girls
      })).sort((a, b) => a.category.localeCompare(b.category));
    }

    // Default fallback for other strength reports - aggregate by class
    const classMap = new Map();
    data.forEach(student => {
      const className = student.class?.name || 'Unknown';
      if (!classMap.has(className)) {
        classMap.set(className, { boys: 0, girls: 0 });
      }
      const counts = classMap.get(className);
      if (isMale(student.gender)) counts.boys++;
      else if (isFemale(student.gender)) counts.girls++;
    });
    return Array.from(classMap.entries()).map(([className, counts]) => ({
      class_name: className,
      boys_count: counts.boys,
      girls_count: counts.girls,
      total_count: counts.boys + counts.girls
    })).sort((a, b) => a.class_name.localeCompare(b.class_name));
  }, [data, selectedTemplate]);

  // Debug log aggregated data
  useEffect(() => {
    if (selectedTemplate?.isStrengthReport) {
      console.log('[Report Debug] Selected template:', selectedTemplate.key);
      console.log('[Report Debug] Template columns:', selectedTemplate.columns);
      console.log('[Report Debug] Aggregated data:', aggregatedStrengthData);
    }
  }, [selectedTemplate, aggregatedStrengthData]);

  // Use aggregated data for strength reports, otherwise use raw data
  const flatData = selectedTemplate?.isStrengthReport && aggregatedStrengthData 
    ? aggregatedStrengthData 
    : rawFlatData;

  // Debug log final data for table
  useEffect(() => {
    const isUsingAggregated = selectedTemplate?.isStrengthReport && aggregatedStrengthData;
    console.log('[Report Debug] flatData decision:', {
      isStrengthReport: selectedTemplate?.isStrengthReport,
      hasAggregatedData: !!aggregatedStrengthData,
      aggregatedLength: aggregatedStrengthData?.length,
      rawFlatDataLength: rawFlatData?.length,
      isUsingAggregated,
      finalFlatDataLength: flatData?.length
    });
    console.log('[Report Debug] flatData sample:', flatData?.[0]);
  }, [flatData, selectedTemplate, aggregatedStrengthData, rawFlatData]);

  // Export functionality
  const { exportToExcel, exportToPDF, exportToCSV, printReport } = useReportExport();

  // Handle export
  // Get columns for export/display - use template columns for strength reports, otherwise use selected columns
  const displayColumns = useMemo(() => {
    return selectedTemplate?.isStrengthReport ? selectedTemplate.columns : selectedColumnsObjects;
  }, [selectedTemplate, selectedColumnsObjects]);

  const handleExport = useCallback((format) => {
    const title = selectedTemplate?.name || 'Student Report';
    const columnsToUse = displayColumns;
    
    switch (format) {
      case 'excel':
        exportToExcel(flatData, columnsToUse, title);
        break;
      case 'pdf':
        exportToPDF(flatData, columnsToUse, title, moduleColor);
        break;
      case 'csv':
        exportToCSV(flatData, columnsToUse, title);
        break;
      case 'print':
        printReport(flatData, columnsToUse, title);
        break;
      default:
        break;
    }
  }, [flatData, displayColumns, selectedTemplate, moduleColor, exportToExcel, exportToPDF, exportToCSV, printReport]);

  // Initial data load
  useEffect(() => {
    if (selectedBranch?.id && currentSessionId) {
      fetchData();
    }
  // Note: fetchData changes when filters change, which triggers refetch
  }, [selectedBranch?.id, currentSessionId, fetchData]);

  // Handle filter reset
  const handleResetFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);

  // Quick stats
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const active = data.filter(s => s.status?.toLowerCase() === 'active').length;
    const boys = data.filter(s => s.gender?.toLowerCase() === 'male').length;
    const girls = data.filter(s => s.gender?.toLowerCase() === 'female').length;
    
    return { total: data.length, active, boys, girls };
  }, [data]);

  return (
    <ReportGeneratorLayout
      title="Student Information Reports"
      subtitle="Generate and export comprehensive student data reports"
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
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total:</span>
                  <Badge variant="outline" className="font-bold dark:border-gray-600 dark:text-gray-200">{stats.total}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Active:</span>
                  <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">{stats.active}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Boys:</span>
                  <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">{stats.boys}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Girls:</span>
                  <Badge className="bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300">{stats.girls}</Badge>
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
                    <Filter className="h-4 w-4 text-blue-500" />
                    <CardTitle className="text-sm">Filters</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <FilterPanel
                    filters={filters}
                    onFiltersChange={setFilters}
                    onReset={handleResetFilters}
                    onClassChange={fetchSectionsByClass}
                    onSessionChange={(sessionId) => {
                      setSelectedSessionId(sessionId);
                      // Clear class/section when session changes
                      setFilters(prev => ({ ...prev, class_id: '', section_id: '' }));
                    }}
                    classes={classes}
                    sections={sections}
                    sessions={sessions}
                    selectedSessionId={selectedSessionId || currentSessionId}
                    filterConfig={{
                      session: true,
                      class: true,
                      section: true,
                      status: true,
                      gender: true,
                      dateRange: selectedTemplate?.defaultFilterConfig?.dateRange,
                      month: selectedTemplate?.defaultFilterConfig?.month
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
                    availableColumns={STUDENT_COLUMNS}
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
              columns={displayColumns}
              title={selectedTemplate?.name || 'Student Report'}
              filename="student_report"
              color={moduleColor}
            />
          </div>

          {/* Data Table */}
          <div className="flex-1 overflow-auto p-4 bg-white dark:bg-gray-800">
            <LivePreviewTable
              data={selectedTemplate?.isStrengthReport ? flatData : groupedData}
              columns={displayColumns}
              groupBy={selectedTemplate?.isStrengthReport ? [] : groupBy}
              loading={isLoading}
              color={moduleColor}
              showSubtotals={!selectedTemplate?.isStrengthReport && groupBy.length > 0}
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
            columns: selectedColumnsObjects,  // Save as objects so template loading works
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
        reportName={selectedTemplate?.name || 'Custom Report'}
      />
    </ReportGeneratorLayout>
  );
};

export default StudentReportGenerator;
