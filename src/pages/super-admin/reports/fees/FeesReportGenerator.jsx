/**
 * Fees Report Generator
 * Module 11: 40 Fee Report Templates
 * Categories: Student Fee Reports, Collection Analysis, Special Fee Reports
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
import { FEES_TEMPLATES, FEES_CATEGORIES, getPopularTemplates } from './templates';
import { FEES_COLUMNS, COLUMN_SETS, getColumns } from './columns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  RefreshCw,
  BarChart3,
  FileText,
  Users,
  AlertTriangle
} from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const FeesReportGenerator = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  // Module configuration
  const moduleConfig = REPORT_MODULES['fees'];
  const moduleColor = moduleConfig?.color || 'green';

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
    defaultColumns: COLUMN_SETS.student_fee_ledger  // Store as keys (strings), not objects
  });

  // Convert selected column keys to full column objects for table/export
  const selectedColumnsObjects = useMemo(() => {
    return selectedColumns
      .map(key => FEES_COLUMNS.find(c => c.key === key))
      .filter(Boolean);
  }, [selectedColumns]);

  // Templates for sidebar
  const allTemplates = useMemo(() => FEES_TEMPLATES, []);

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

      // Get Supabase session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(
        `${API_BASE}/reports/fees?${queryParams}`,
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

  // Generate sample data based on template category
  const generateSampleData = () => {
    const category = selectedTemplate?.category || 'student_fee';
    
    if (category === 'student_fee') {
      return generateStudentFeeData();
    } else if (category === 'collection_analysis') {
      return generateCollectionData();
    } else {
      return generateSpecialFeeData();
    }
  };

  // Student Fee sample data
  const generateStudentFeeData = () => {
    const classes = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    const sections = ['A', 'B', 'C'];
    const feeStructures = ['Regular', 'Scholarship', 'Staff Ward', 'Management Quota'];
    const feeHeads = ['Tuition Fee', 'Transport Fee', 'Library Fee', 'Lab Fee', 'Exam Fee'];
    const paymentStatuses = ['Paid', 'Partial', 'Pending', 'Overdue'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      admission_number: `ADM${2024}${String(i + 1).padStart(4, '0')}`,
      student_name: ['Rahul Sharma', 'Priya Verma', 'Amit Singh', 'Sneha Patel', 'Raj Kumar'][i % 5],
      class_name: classes[i % 10],
      section_name: sections[i % 3],
      roll_number: String((i % 40) + 1),
      father_name: ['Rajesh Sharma', 'Suresh Verma', 'Mukesh Singh', 'Ramesh Patel', 'Naresh Kumar'][i % 5],
      phone: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      fee_structure_name: feeStructures[i % 4],
      fee_head: feeHeads[i % 5],
      total_fee: 50000 + Math.round(Math.random() * 30000),
      annual_fee: 45000 + Math.round(Math.random() * 25000),
      paid_amount: 20000 + Math.round(Math.random() * 25000),
      due_amount: 10000 + Math.round(Math.random() * 15000),
      discount_amount: i % 3 === 0 ? 5000 + Math.round(Math.random() * 5000) : 0,
      discount_type: i % 3 === 0 ? ['Sibling', 'Merit', 'Staff Ward'][i % 3] : '',
      net_payable: 45000 + Math.round(Math.random() * 20000),
      payment_status: paymentStatuses[i % 4],
      installment_no: (i % 4) + 1,
      due_month: ['April', 'July', 'October', 'January'][i % 4],
      due_date: `2024-${['04', '07', '10', '01'][i % 4]}-15`,
      overdue_days: paymentStatuses[i % 4] === 'Overdue' ? 10 + Math.floor(Math.random() * 60) : 0,
      late_fee: paymentStatuses[i % 4] === 'Overdue' ? 500 + Math.floor(Math.random() * 1000) : 0,
      category: ['General', 'OBC', 'SC', 'ST'][i % 4],
      admission_date: `2024-04-${String((i % 28) + 1).padStart(2, '0')}`,
      tuition_fee: 30000 + Math.round(Math.random() * 10000),
      transport_fee: i % 2 === 0 ? 8000 + Math.round(Math.random() * 4000) : 0,
      library_fee: 1000,
      lab_fee: 2000,
      exam_fee: 1500
    }));
  };

  // Collection Analysis sample data
  const generateCollectionData = () => {
    const months = ['Apr 2024', 'May 2024', 'Jun 2024', 'Jul 2024', 'Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dec 2024', 'Jan 2025', 'Feb 2025', 'Mar 2025'];
    const paymentModes = ['Cash', 'Online', 'Cheque', 'Card', 'UPI'];
    const collectors = ['Mr. Ramesh', 'Ms. Priya', 'Mr. Suresh', 'Ms. Anita'];
    const classes = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      receipt_no: `RCP${2024}${String(i + 1).padStart(5, '0')}`,
      receipt_date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      admission_number: `ADM${2024}${String(i + 1).padStart(4, '0')}`,
      student_name: ['Rahul Sharma', 'Priya Verma', 'Amit Singh', 'Sneha Patel', 'Raj Kumar'][i % 5],
      class_name: classes[i % 10],
      fee_head: ['Tuition Fee', 'Transport Fee', 'Library Fee', 'Lab Fee', 'Exam Fee'][i % 5],
      paid_amount: 5000 + Math.round(Math.random() * 15000),
      payment_mode: paymentModes[i % 5],
      transaction_id: paymentModes[i % 5] !== 'Cash' ? `TXN${Date.now()}${i}` : null,
      bank_name: paymentModes[i % 5] === 'Cheque' ? ['HDFC', 'SBI', 'ICICI'][i % 3] : null,
      cheque_no: paymentModes[i % 5] === 'Cheque' ? `${500000 + i}` : null,
      collected_by: collectors[i % 4],
      month: months[i % 12],
      expected_collection: 500000 + Math.round(Math.random() * 200000),
      actual_collection: 400000 + Math.round(Math.random() * 150000),
      variance: Math.round(-50000 + Math.random() * 100000),
      variance_percentage: Math.round(-10 + Math.random() * 20),
      collection_rate: 70 + Math.round(Math.random() * 25),
      student_count: 50 + Math.round(Math.random() * 100),
      defaulter_count: 5 + Math.round(Math.random() * 20),
      day_name: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i % 6],
      transaction_count: 10 + Math.round(Math.random() * 30),
      total_amount: 50000 + Math.round(Math.random() * 100000),
      average_amount: 5000 + Math.round(Math.random() * 5000),
      percentage_share: Math.round(15 + Math.random() * 25),
      receipt_count: 5 + Math.round(Math.random() * 15),
      total_collection: 100000 + Math.round(Math.random() * 200000),
      cash_collection: 30000 + Math.round(Math.random() * 50000),
      online_collection: 50000 + Math.round(Math.random() * 100000),
      cheque_collection: 20000 + Math.round(Math.random() * 50000)
    }));
  };

  // Special Fee sample data
  const generateSpecialFeeData = () => {
    const classes = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    const routes = ['Route 1 - North', 'Route 2 - South', 'Route 3 - East', 'Route 4 - West'];
    const hostels = ['Boys Hostel A', 'Boys Hostel B', 'Girls Hostel A'];
    const sports = ['Cricket', 'Football', 'Basketball', 'Badminton', 'Athletics'];
    const activities = ['Dance', 'Music', 'Art', 'Drama', 'Robotics'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      admission_number: `ADM${2024}${String(i + 1).padStart(4, '0')}`,
      student_name: ['Rahul Sharma', 'Priya Verma', 'Amit Singh', 'Sneha Patel', 'Raj Kumar'][i % 5],
      class_name: classes[i % 10],
      route_name: routes[i % 4],
      stop_name: `Stop ${(i % 10) + 1}`,
      km_distance: 5 + (i % 20),
      transport_fee: 6000 + Math.round((i % 20) * 200),
      hostel_name: hostels[i % 3],
      room_no: `${100 + (i % 50)}`,
      room_type: ['Single', 'Double', 'Triple'][i % 3],
      hostel_fee: 50000 + Math.round(Math.random() * 20000),
      mess_fee: 24000 + Math.round(Math.random() * 6000),
      lab_type: ['Physics', 'Chemistry', 'Biology', 'Computer'][i % 4],
      fee_per_student: 2000 + Math.round(Math.random() * 1000),
      exam_name: ['Unit Test 1', 'Mid-Term', 'Unit Test 2', 'Final Exam'][i % 4],
      exam_fee: 500 + (i % 4) * 250,
      sport_name: sports[i % 5],
      sports_fee: 3000 + Math.round(Math.random() * 2000),
      equipment_fee: 1000 + Math.round(Math.random() * 1000),
      activity_name: activities[i % 5],
      activity_fee: 5000 + Math.round(Math.random() * 5000),
      development_fee: 2000,
      total_expected: 10000 + Math.round(Math.random() * 5000),
      collected_amount: 8000 + Math.round(Math.random() * 4000),
      pending_amount: 2000 + Math.round(Math.random() * 2000),
      paid_amount: 8000 + Math.round(Math.random() * 4000),
      due_amount: 2000 + Math.round(Math.random() * 2000),
      overdue_days: Math.floor(Math.random() * 30),
      late_fee: Math.floor(Math.random() * 500),
      fine_amount: Math.floor(Math.random() * 200),
      payment_status: ['Paid', 'Partial', 'Pending'][i % 3],
      refund_amount: i % 10 === 0 ? 2000 + Math.round(Math.random() * 3000) : 0,
      refund_date: i % 10 === 0 ? `2024-${String((i % 12) + 1).padStart(2, '0')}-15` : null,
      refund_reason: i % 10 === 0 ? ['TC Issued', 'Fee Revision', 'Wrong Entry'][i % 3] : null,
      student_count: 30 + Math.round(Math.random() * 50)
    }));
  };

  // Apply grouping and sorting to data
  const { groupedData, flatData } = useGroupedData(data, groupBy, sortBy, selectedColumnsObjects);

  // Export functionality
  const { exportToExcel, exportToPDF, exportToCSV, printReport } = useReportExport();

  // Handle export
  const handleExport = useCallback((format) => {
    const title = selectedTemplate?.name || 'Fees Report';
    
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

  // Calculate stats
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const totalFee = data.reduce((sum, row) => sum + (row.total_fee || row.total_amount || 0), 0);
    const paidAmount = data.reduce((sum, row) => sum + (row.paid_amount || row.collected_amount || 0), 0);
    const dueAmount = data.reduce((sum, row) => sum + (row.due_amount || row.pending_amount || 0), 0);
    const defaulters = data.filter(row => row.payment_status === 'Overdue' || row.payment_status === 'Pending').length;
    
    return { 
      total: data.length, 
      totalFee,
      paidAmount,
      dueAmount,
      defaulters,
      collectionRate: totalFee > 0 ? Math.round((paidAmount / totalFee) * 100) : 0
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
      title="Fees Reports"
      subtitle="Comprehensive fee collection and analysis reports"
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
              categories={FEES_CATEGORIES}
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
          {/* Stats Bar */}
          {stats && (
            <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Records:</span>
                  <Badge variant="outline" className="font-bold dark:border-gray-600 dark:text-gray-200">{stats.total}</Badge>
                </div>
                {stats.totalFee > 0 && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Fee:</span>
                    <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                      {formatCurrency(stats.totalFee)}
                    </Badge>
                  </div>
                )}
                {stats.paidAmount > 0 && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Collected:</span>
                    <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                      {formatCurrency(stats.paidAmount)}
                    </Badge>
                  </div>
                )}
                {stats.dueAmount > 0 && (
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Due:</span>
                    <Badge className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                      {formatCurrency(stats.dueAmount)}
                    </Badge>
                  </div>
                )}
                {stats.defaulters > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Defaulters:</span>
                    <Badge className="bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300">
                      {stats.defaulters}
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
                    <Filter className="h-4 w-4 text-orange-500" />
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
                      dateRange: true,
                      paymentStatus: true,
                      feeHead: true,
                      paymentMode: selectedTemplate?.category === 'collection_analysis'
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
                    availableColumns={FEES_COLUMNS}
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
              title={selectedTemplate?.name || 'Fees Report'}
              filename="fees_report"
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
        reportName={selectedTemplate?.name || 'Custom Fees Report'}
      />
    </ReportGeneratorLayout>
  );
};

export default FeesReportGenerator;
