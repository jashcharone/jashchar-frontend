/**
 * Finance Report Generator
 * Module 2: 40 Finance Report Templates
 * Categories: Collection, Outstanding, Concession & Scholarship, Financial Analysis
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
import { FINANCE_TEMPLATES, FINANCE_CATEGORIES, getPopularTemplates } from './templates';
import { FINANCE_COLUMNS, COLUMN_SETS, getColumnsForSet } from './columns';
import { fetchFinanceDataFromSupabase } from '../ReportGeneratorShared/reportQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  IndianRupee, 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  RefreshCw,
  BarChart3,
  FileText,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';

const FinanceReportGenerator = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  // Module configuration
  const moduleConfig = REPORT_MODULES['finance'];
  const moduleColor = moduleConfig?.color || 'green';
  
  // Master data for filters (from shared hook)
  const { classes, sections, sessions, fetchSectionsByClass, selectedSessionId, setSelectedSessionId } = useFilterOptions();
  
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
    defaultColumns: COLUMN_SETS.daily_collection  // Store as keys (strings), not objects
  });

  // Convert selected column keys to full column objects for table/export
  const selectedColumnsObjects = useMemo(() => {
    return selectedColumns
      .map(key => FINANCE_COLUMNS.find(c => c.key === key))
      .filter(Boolean);
  }, [selectedColumns]);

  // Templates for sidebar
  const allTemplates = useMemo(() => FINANCE_TEMPLATES, []);

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
      const financeData = await fetchFinanceDataFromSupabase({
        branchId: selectedBranch.id,
        organizationId,
        sessionId: selectedSessionId || currentSessionId,
        dateFrom: filters.date_from,
        dateTo: filters.date_to,
        paymentMode: filters.payment_mode,
        classId: filters.class_id,
        sectionId: filters.section_id
      });

      setData(financeData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch, currentSessionId, selectedSessionId, organizationId, filters, setIsLoading, setError, setData]);

  // Generate sample data for demo/preview based on template category
  const generateSampleData = () => {
    const category = selectedTemplate?.category || 'collection';
    
    if (category === 'collection') {
      return generateCollectionData();
    } else if (category === 'outstanding') {
      return generateOutstandingData();
    } else if (category === 'concession') {
      return generateConcessionData();
    } else {
      return generateAnalysisData();
    }
  };

  // Collection sample data
  const generateCollectionData = () => {
    const classes = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    const sections = ['A', 'B', 'C'];
    const paymentModes = ['Cash', 'Online', 'Cheque', 'Card', 'UPI'];
    const feeHeads = ['Tuition Fee', 'Transport Fee', 'Library Fee', 'Lab Fee', 'Exam Fee'];
    const cashiers = ['Mr. Ramesh', 'Ms. Priya', 'Mr. Suresh'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      receipt_no: `RCP${2024}${String(i + 1).padStart(5, '0')}`,
      date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      admission_number: `ADM${2024}${String(i + 1).padStart(4, '0')}`,
      student_name: ['Rahul Sharma', 'Priya Verma', 'Amit Singh', 'Sneha Patel', 'Raj Kumar'][i % 5],
      class_name: classes[i % 10],
      section_name: sections[i % 3],
      fee_head: feeHeads[i % 5],
      amount: Math.round((5000 + Math.random() * 15000) / 100) * 100,
      payment_mode: paymentModes[i % 5],
      cashier_name: cashiers[i % 3],
      collection_hour: `${9 + (i % 8)}:00`,
      transaction_id: paymentModes[i % 5] === 'Online' ? `TXN${Date.now()}${i}` : null,
      bank_name: paymentModes[i % 5] === 'Cheque' ? ['HDFC', 'SBI', 'ICICI'][i % 3] : null,
      cheque_no: paymentModes[i % 5] === 'Cheque' ? `${500000 + i}` : null,
      cheque_date: paymentModes[i % 5] === 'Cheque' ? `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}` : null,
      cheque_status: paymentModes[i % 5] === 'Cheque' ? ['Cleared', 'Pending', 'Bounced'][i % 3] : null,
      remarks: i % 3 === 0 ? 'Paid on time' : ''
    }));
  };

  // Outstanding sample data
  const generateOutstandingData = () => {
    const classes = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    const sections = ['A', 'B', 'C'];
    const categories = ['General', 'OBC', 'SC', 'ST'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      admission_number: `ADM${2024}${String(i + 1).padStart(4, '0')}`,
      student_name: ['Rahul Sharma', 'Priya Verma', 'Amit Singh', 'Sneha Patel', 'Raj Kumar'][i % 5],
      class_name: classes[i % 10],
      section_name: sections[i % 3],
      roll_number: String((i % 40) + 1),
      father_name: ['Rajesh Sharma', 'Suresh Verma', 'Mukesh Singh', 'Ramesh Patel', 'Naresh Kumar'][i % 5],
      phone: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      total_fee: 50000 + Math.round(Math.random() * 30000),
      paid_amount: 20000 + Math.round(Math.random() * 20000),
      due_amount: 10000 + Math.round(Math.random() * 20000),
      due_date: `2024-${String((i % 12) + 1).padStart(2, '0')}-15`,
      overdue_days: Math.floor(Math.random() * 90),
      overdue_category: ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'][i % 5],
      last_payment_date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      follow_up_status: ['Pending', 'Contacted', 'Promised', 'No Response'][i % 4],
      promise_date: i % 2 === 0 ? `2024-${String((i % 12) + 1).padStart(2, '0')}-25` : null,
      follow_up_count: Math.floor(Math.random() * 5),
      student_category: categories[i % 4],
      rte_status: i % 10 === 0 ? 'Yes' : 'No',
      is_new_student: i % 5 === 0
    }));
  };

  // Concession sample data
  const generateConcessionData = () => {
    const classes = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    const sections = ['A', 'B', 'C'];
    const concessionTypes = ['Staff Ward', 'Sibling', 'Merit', 'Sports', 'EWS', 'BPL'];
    const scholarships = ['National Merit', 'State Scholarship', 'Sports Quota', 'School Scholarship'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      admission_number: `ADM${2024}${String(i + 1).padStart(4, '0')}`,
      student_name: ['Rahul Sharma', 'Priya Verma', 'Amit Singh', 'Sneha Patel', 'Raj Kumar'][i % 5],
      class_name: classes[i % 10],
      section_name: sections[i % 3],
      roll_number: String((i % 40) + 1),
      concession_type: concessionTypes[i % 6],
      original_fee: 50000 + Math.round(Math.random() * 30000),
      concession_amount: 5000 + Math.round(Math.random() * 15000),
      concession_percentage: Math.round(10 + Math.random() * 40),
      final_fee: 30000 + Math.round(Math.random() * 20000),
      scholarship_name: scholarships[i % 4],
      scholarship_amount: 5000 + Math.round(Math.random() * 10000),
      scholarship_status: ['Approved', 'Pending', 'Disbursed'][i % 3],
      approved_by: ['Principal', 'Admin', 'Trust'][i % 3],
      approval_date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      waiver_reason: i % 3 === 0 ? 'Financial Hardship' : (i % 3 === 1 ? 'Merit' : 'Special Case'),
      waiver_amount: i % 2 === 0 ? 2000 + Math.round(Math.random() * 5000) : 0,
      staff_name: i % 6 === 0 ? ['Mr. Rajesh', 'Ms. Sunita', 'Mr. Vikram'][i % 3] : null,
      sibling_admission_no: i % 6 === 1 ? `ADM${2024}${String(i + 100).padStart(4, '0')}` : null,
      sibling_discount: i % 6 === 1 ? 10 : 0,
      sport_name: i % 6 === 3 ? ['Cricket', 'Football', 'Basketball', 'Athletics'][i % 4] : null,
      marks_percentage: i % 6 === 2 ? 85 + Math.round(Math.random() * 15) : null,
      economic_category: ['General', 'EWS', 'BPL'][i % 3]
    }));
  };

  // Analysis sample data
  const generateAnalysisData = () => {
    const months = ['Apr 2024', 'May 2024', 'Jun 2024', 'Jul 2024', 'Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dec 2024', 'Jan 2025', 'Feb 2025', 'Mar 2025'];
    const feeHeads = ['Tuition Fee', 'Transport Fee', 'Library Fee', 'Lab Fee', 'Exam Fee'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      month: months[i % 12],
      fee_head: feeHeads[i % 5],
      expected_amount: 500000 + Math.round(Math.random() * 200000),
      collected_amount: 400000 + Math.round(Math.random() * 150000),
      variance: Math.round(-50000 + Math.random() * 100000),
      variance_percentage: Math.round(-10 + Math.random() * 20),
      last_year_amount: 450000 + Math.round(Math.random() * 150000),
      this_year_amount: 480000 + Math.round(Math.random() * 170000),
      growth_percentage: Math.round(-5 + Math.random() * 15),
      class_name: ['1st to 4th', '5th to 7th', '8th to 10th', '11th', '12th'][i % 5],
      fee_amount: 50000 + Math.round(Math.random() * 30000),
      total_expected: 5000000 + Math.round(Math.random() * 2000000),
      student_count: 50 + Math.round(Math.random() * 100),
      refund_amount: i % 5 === 0 ? 5000 + Math.round(Math.random() * 10000) : 0,
      refund_reason: i % 5 === 0 ? ['TC Issued', 'Fee Revision', 'Duplicate Payment'][i % 3] : null,
      refund_date: i % 5 === 0 ? `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}` : null,
      date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      entry_type: ['Receipt', 'Payment', 'Journal'][i % 3],
      debit: i % 3 === 0 ? 10000 + Math.round(Math.random() * 50000) : 0,
      credit: i % 3 === 1 ? 10000 + Math.round(Math.random() * 50000) : 0,
      book_balance: 500000 + Math.round(Math.random() * 200000),
      bank_balance: 480000 + Math.round(Math.random() * 200000),
      taxable_amount: 100000 + Math.round(Math.random() * 50000),
      cgst: Math.round(4500 + Math.random() * 2250),
      sgst: Math.round(4500 + Math.random() * 2250),
      igst: 0,
      total_gst: Math.round(9000 + Math.random() * 4500)
    }));
  };

  // Apply grouping and sorting to data
  const { groupedData, flatData } = useGroupedData(data, groupBy, sortBy, selectedColumnsObjects);

  // Export functionality
  const { exportToExcel, exportToPDF, exportToCSV, printReport } = useReportExport();

  // Handle export
  const handleExport = useCallback((format) => {
    const title = selectedTemplate?.name || 'Finance Report';
    
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

  // Calculate financial stats
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const totalCollection = data.reduce((sum, row) => sum + (row.amount || row.collected_amount || 0), 0);
    const totalDue = data.reduce((sum, row) => sum + (row.due_amount || 0), 0);
    const totalConcession = data.reduce((sum, row) => sum + (row.concession_amount || 0), 0);
    const receiptCount = data.filter(row => row.receipt_no).length;
    
    return { 
      total: data.length, 
      totalCollection,
      totalDue,
      totalConcession,
      receiptCount
    };
  }, [data]);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <ReportGeneratorLayout
      title="Finance Reports"
      subtitle="Generate comprehensive financial reports and analysis"
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
              categories={FINANCE_CATEGORIES}
              selectedTemplate={selectedTemplate?.id}
              onSelectTemplate={handleTemplateSelect}
              recentTemplates={[]}
              favoriteTemplates={[]}
              color={moduleColor}
            />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Financial Stats Bar */}
          {stats && (
            <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Records:</span>
                  <Badge variant="outline" className="font-bold dark:border-gray-600 dark:text-gray-200">{stats.total}</Badge>
                </div>
                {stats.totalCollection > 0 && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Collection:</span>
                    <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                      {formatCurrency(stats.totalCollection)}
                    </Badge>
                  </div>
                )}
                {stats.totalDue > 0 && (
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Due:</span>
                    <Badge className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                      {formatCurrency(stats.totalDue)}
                    </Badge>
                  </div>
                )}
                {stats.totalConcession > 0 && (
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Concession:</span>
                    <Badge className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                      {formatCurrency(stats.totalConcession)}
                    </Badge>
                  </div>
                )}
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
                    <Filter className="h-4 w-4 text-green-500" />
                    <CardTitle className="text-sm dark:text-gray-200">Filters</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <FilterPanel
                    filters={filters}
                    onFiltersChange={setFilters}
                    onReset={() => setFilters({})}
                    onClassChange={fetchSectionsByClass}
                    onSessionChange={(sessionId) => {
                      setSelectedSessionId(sessionId);
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
                      dateRange: true,
                      paymentMode: selectedTemplate?.category === 'collection',
                      feeHead: true,
                      status: selectedTemplate?.category === 'outstanding'
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
                    <FileText className="h-4 w-4 text-blue-500" />
                    <CardTitle className="text-sm dark:text-gray-200">Columns ({selectedColumns.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <ColumnSelector
                    availableColumns={FINANCE_COLUMNS}
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
              title={selectedTemplate?.name || 'Finance Report'}
              filename="finance_report"
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
            id: `custom_${Date.now()}`,
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
        reportName={selectedTemplate?.name || 'Custom Finance Report'}
      />
    </ReportGeneratorLayout>
  );
};

export default FinanceReportGenerator;
