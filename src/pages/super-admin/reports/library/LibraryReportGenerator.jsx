/**
 * Library Report Generator
 * Complete library reporting with 30+ templates
 * Day 6 - 8 Day Master Plan
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
import { LIBRARY_TEMPLATES, TEMPLATE_CATEGORIES } from './templates';
import { LIBRARY_COLUMNS, getColumns, COLUMN_SETS } from './columns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Library, BookOpen, Users, FileText, BarChart3, Download, Filter, RefreshCw, AlertCircle, BookMarked } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LibraryReportGenerator = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  // Module configuration
  const moduleConfig = REPORT_MODULES['library'];
  const moduleColor = moduleConfig?.color || 'indigo';

  // Master data for filters
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
    defaultColumns: COLUMN_SETS.book_inventory  // Store as keys (strings), not objects
  });

  // Convert selected column keys to full column objects for table/export
  const selectedColumnsObjects = useMemo(() => {
    return selectedColumns
      .map(key => LIBRARY_COLUMNS.find(c => c.key === key))
      .filter(Boolean);
  }, [selectedColumns]);

  // Templates for sidebar
  const allTemplates = useMemo(() => LIBRARY_TEMPLATES, []);

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
        `${API_BASE}/reports/library?${queryParams}`,
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
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch, currentSessionId, organizationId, filters, setIsLoading, setError, setData]);

  // Generate sample data for demo/preview
  const generateSampleData = () => {
    const categories = ['Science', 'Mathematics', 'Literature', 'History', 'Geography', 'Computer Science', 'Arts', 'Sports', 'Reference', 'Fiction'];
    const authors = ['Dr. R.K. Sharma', 'Prof. S. Iyer', 'H.C. Verma', 'R.D. Sharma', 'K. Laxmikant', 'William Shakespeare', 'Premchand', 'Ruskin Bond', 'APJ Kalam', 'Chetan Bhagat'];
    const publishers = ['NCERT', 'S.Chand', 'Arihant', 'Pearson', 'Oxford', 'Cambridge', 'McGraw Hill', 'Tata McGraw', 'PHI Learning', 'Cengage'];
    const locations = ['Rack-A1', 'Rack-A2', 'Rack-B1', 'Rack-B2', 'Rack-C1', 'Rack-C2', 'Rack-D1', 'Rack-D2', 'Shelf-1', 'Shelf-2'];
    const conditions = ['Excellent', 'Good', 'Fair', 'Needs Repair', 'Damaged'];
    const statuses = ['Available', 'Issued', 'Reserved', 'Lost', 'Processing'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      book_id: `BK${String(i + 1).padStart(5, '0')}`,
      accession_number: `ACC${2024}${String(i + 1).padStart(4, '0')}`,
      title: `${['Introduction to', 'Advanced', 'Fundamentals of', 'Modern', 'Classical'][i % 5]} ${categories[i % 10]}`,
      isbn: `978-81-${String(1000 + i).slice(0, 4)}-${String(2000 + i).slice(0, 4)}-${i % 10}`,
      category: categories[i % 10],
      author: authors[i % 10],
      publisher: publishers[i % 10],
      publication_year: 2015 + (i % 10),
      edition: `${(i % 5) + 1}${['st', 'nd', 'rd', 'th', 'th'][i % 5]} Edition`,
      pages: 100 + (i * 20),
      price: 250 + (i * 25),
      book_value: 250 + (i * 25),
      location: locations[i % 10],
      rack_number: `R${(i % 10) + 1}`,
      shelf_number: `S${(i % 5) + 1}`,
      condition: conditions[i % 5],
      status: statuses[i % 5],
      copies_total: Math.floor(Math.random() * 5) + 1,
      copies_available: Math.floor(Math.random() * 3) + 1,
      copies_issued: Math.floor(Math.random() * 2),
      
      // Member info (for issue reports)
      member_id: `LIB${String(i + 1).padStart(4, '0')}`,
      member_name: ['Rahul Sharma', 'Priya Verma', 'Amit Singh', 'Sneha Patel', 'Raj Kumar'][i % 5],
      member_type: ['Student', 'Student', 'Student', 'Teacher', 'Staff'][i % 5],
      class_name: ['5th', '6th', '7th', '8th', '9th', '10th'][i % 6],
      section_name: ['A', 'B', 'C'][i % 3],
      contact_number: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      
      // Issue/Return info
      issue_date: `2025-01-${String((i % 28) + 1).padStart(2, '0')}`,
      due_date: `2025-02-${String((i % 28) + 1).padStart(2, '0')}`,
      return_date: i % 3 === 0 ? `2025-02-${String((i % 20) + 1).padStart(2, '0')}` : null,
      days_overdue: i % 5 === 0 ? i % 15 : 0,
      is_overdue: i % 5 === 0,
      renewal_count: i % 3,
      
      // Fine info
      fine_amount: i % 5 === 0 ? (i % 15) * 5 : 0,
      fine_paid: i % 10 === 0 ? (i % 15) * 5 : 0,
      fine_pending: i % 5 === 0 && i % 10 !== 0 ? (i % 15) * 5 : 0,
      fine_reason: i % 5 === 0 ? 'Overdue' : null,
      
      // Statistics
      issue_count: Math.floor(Math.random() * 50) + 1,
      total_issues: Math.floor(Math.random() * 100) + 1,
      books_borrowed: Math.floor(Math.random() * 20) + 1,
      return_count: Math.floor(Math.random() * 50) + 1,
      
      // Timestamps
      created_at: `2024-04-${String((i % 28) + 1).padStart(2, '0')}`,
      updated_at: `2025-01-${String((i % 28) + 1).padStart(2, '0')}`
    }));
  };

  // Apply grouping and sorting
  const { groupedData, flatData } = useGroupedData(data, groupBy, sortBy, selectedColumnsObjects);

  // Export functionality
  const { exportToExcel, exportToPDF, exportToCSV, printReport } = useReportExport();

  // Handle export
  const handleExport = useCallback((format) => {
    const title = selectedTemplate?.name || 'Library Report';
    
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
    
    const totalBooks = data.length;
    const available = data.filter(b => b.status === 'Available').length;
    const issued = data.filter(b => b.status === 'Issued').length;
    const overdue = data.filter(b => b.is_overdue).length;
    
    return { totalBooks, available, issued, overdue };
  }, [data]);

  return (
    <ReportGeneratorLayout
      title="Library Reports"
      subtitle="Generate comprehensive library reports - Books, Issues, Returns & Fines"
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
                  <Library className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Books:</span>
                  <Badge variant="outline" className="font-bold dark:border-gray-600 dark:text-gray-200">{stats.totalBooks}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Available:</span>
                  <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">{stats.available}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <BookMarked className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Issued:</span>
                  <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">{stats.issued}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Overdue:</span>
                  <Badge className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">{stats.overdue}</Badge>
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
                    <Filter className="h-4 w-4 text-indigo-500" />
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
                    filterConfig={{
                      session: true,
                      class: true,
                      section: true,
                      status: true,
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
                    availableColumns={LIBRARY_COLUMNS}
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
              title={selectedTemplate?.name || 'Library Report'}
              filename="library_report"
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
        reportName={selectedTemplate?.name || 'Library Report'}
      />
    </ReportGeneratorLayout>
  );
};

export default LibraryReportGenerator;
