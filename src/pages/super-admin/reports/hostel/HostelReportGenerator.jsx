/**
 * Hostel Report Generator
 * Complete hostel reporting with 30+ templates
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
import { HOSTEL_TEMPLATES, TEMPLATE_CATEGORIES } from './templates';
import { HOSTEL_COLUMNS, getColumns, COLUMN_SETS } from './columns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Bed, Users, FileText, BarChart3, Download, Filter, RefreshCw, DoorOpen, AlertTriangle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const HostelReportGenerator = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  // Module configuration
  const moduleConfig = REPORT_MODULES['hostel'];
  const moduleColor = moduleConfig?.color || 'pink';

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
    defaultColumns: COLUMN_SETS.room_inventory  // Store as keys (strings), not objects
  });

  // Convert selected column keys to full column objects for table/export
  const selectedColumnsObjects = useMemo(() => {
    return selectedColumns
      .map(key => HOSTEL_COLUMNS.find(c => c.key === key))
      .filter(Boolean);
  }, [selectedColumns]);

  // Templates for sidebar
  const allTemplates = useMemo(() => HOSTEL_TEMPLATES, []);

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
        `${API_BASE}/reports/hostel?${queryParams}`,
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
    const hostelNames = ['Boys Hostel A', 'Boys Hostel B', 'Girls Hostel A', 'Girls Hostel B'];
    const roomTypes = ['Single', 'Double', 'Triple', 'Dormitory'];
    const roomConditions = ['Excellent', 'Good', 'Fair', 'Needs Repair'];
    const statuses = ['Active', 'Active', 'Active', 'On Leave', 'Checked Out'];
    const messTypes = ['Veg', 'Non-Veg', 'Veg Only'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      // Hostel Info
      hostel_id: `HS${String((i % 4) + 1).padStart(2, '0')}`,
      hostel_name: hostelNames[i % 4],
      hostel_code: `H${(i % 4) + 1}`,
      hostel_type: i % 3 === 0 ? 'Premium' : 'Standard',
      hostel_gender: i % 2 === 0 ? 'Boys' : 'Girls',
      total_floors: 3 + (i % 3),
      total_rooms: 30 + (i % 20),
      total_beds: 60 + (i % 40),
      warden_name: ['Mr. Sharma', 'Mrs. Verma', 'Mr. Singh', 'Mrs. Patel'][i % 4],
      warden_phone: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      
      // Floor Info
      floor_id: `FL${String(i + 1).padStart(3, '0')}`,
      floor_number: (i % 4) + 1,
      floor_name: `Floor ${(i % 4) + 1}`,
      floor_rooms: 8 + (i % 5),
      floor_beds: 16 + (i % 10),
      floor_occupancy: 14 + (i % 8),
      
      // Room Info
      room_id: `RM${String(i + 1).padStart(4, '0')}`,
      room_number: `${(i % 4) + 1}${String((i % 20) + 1).padStart(2, '0')}`,
      room_name: `Room ${(i % 4) + 1}${String((i % 20) + 1).padStart(2, '0')}`,
      room_type: roomTypes[i % 4],
      bed_capacity: i % 4 === 0 ? 1 : i % 4 === 1 ? 2 : i % 4 === 2 ? 3 : 6,
      occupied_beds: i % 4 === 0 ? 1 : i % 4 === 1 ? 2 : i % 4 === 2 ? 2 : 5,
      vacant_beds: i % 4 === 0 ? 0 : i % 4 === 1 ? 0 : i % 4 === 2 ? 1 : 1,
      occupancy_percent: 80 + (i % 20),
      room_fee: 5000 + ((i % 10) * 500),
      room_status: i % 10 === 0 ? 'Under Maintenance' : 'Active',
      room_condition: roomConditions[i % 4],
      has_ac: i % 3 === 0,
      has_attached_bath: i % 2 === 0,
      
      // Bed Info
      bed_id: `BD${String(i + 1).padStart(4, '0')}`,
      bed_number: `B${(i % 6) + 1}`,
      bed_type: i % 2 === 0 ? 'Single' : 'Bunk',
      bed_status: statuses[i % 5],
      bed_fee: 2500 + ((i % 5) * 250),
      
      // Student Info
      student_id: `STD${String(i + 1).padStart(4, '0')}`,
      admission_number: `ADM${2024}${String(i + 1).padStart(4, '0')}`,
      student_name: ['Rahul Sharma', 'Priya Verma', 'Amit Singh', 'Sneha Patel', 'Raj Kumar'][i % 5],
      class_name: ['6th', '7th', '8th', '9th', '10th', '11th', '12th'][i % 7],
      section_name: ['A', 'B', 'C'][i % 3],
      roll_number: String((i % 40) + 1),
      gender: i % 2 === 0 ? 'Male' : 'Female',
      blood_group: ['A+', 'B+', 'O+', 'AB+'][i % 4],
      student_phone: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      
      // Allocation Info
      allocation_id: `AL${String(i + 1).padStart(5, '0')}`,
      allocation_date: `2024-04-${String((i % 28) + 1).padStart(2, '0')}`,
      check_in_date: `2024-04-${String((i % 28) + 1).padStart(2, '0')}`,
      allocation_status: statuses[i % 5],
      days_stayed: 100 + (i % 200),
      
      // Guardian Info
      father_name: `${['Rajesh', 'Suresh', 'Mukesh', 'Ramesh', 'Naresh'][i % 5]} ${['Sharma', 'Verma', 'Singh', 'Patel'][i % 4]}`,
      father_phone: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      mother_name: `${['Sunita', 'Anita', 'Kavita', 'Savita'][i % 4]} ${['Sharma', 'Verma', 'Singh', 'Patel'][i % 4]}`,
      mother_phone: `97${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      emergency_contact: 'Uncle',
      emergency_phone: `96${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      local_guardian_name: `Mr. ${['Sharma', 'Verma', 'Singh', 'Patel', 'Kumar'][i % 5]}`,
      local_guardian_phone: `95${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      
      // Attendance Info
      attendance_date: `2025-02-${String((i % 28) + 1).padStart(2, '0')}`,
      attendance_status: i % 10 === 0 ? 'Absent' : 'Present',
      present_days: 80 + (i % 20),
      absent_days: 5 + (i % 10),
      attendance_percent: 85 + (i % 15),
      
      // Fee Info
      hostel_fee: 30000 + ((i % 10) * 5000),
      mess_fee: 15000 + ((i % 5) * 2000),
      total_fee: 45000 + ((i % 10) * 7000),
      fee_paid: 40000 + ((i % 8) * 5000),
      fee_due: i % 5 === 0 ? 5000 + ((i % 10) * 1000) : 0,
      last_payment_date: `2025-01-${String((i % 28) + 1).padStart(2, '0')}`,
      payment_status: i % 5 === 0 ? 'Overdue' : 'Paid',
      days_overdue: i % 5 === 0 ? i % 30 : 0,
      
      // Mess Info
      mess_name: `Mess ${(i % 2) + 1}`,
      mess_type: messTypes[i % 3],
      diet_preference: i % 3 === 0 ? 'Veg' : i % 3 === 1 ? 'Non-Veg' : 'Egg',
      meal_plan: 'Full Board',
      mess_status: 'Active',
      
      // Statistics
      total_students: 40 + (i % 20),
      active_residents: 38 + (i % 15),
      collection_amount: 500000 + (i * 10000),
      pending_amount: i % 5 === 0 ? 50000 + (i * 1000) : 0,
      total_revenue: 600000 + (i * 15000)
    }));
  };

  // Apply grouping and sorting
  const { groupedData, flatData } = useGroupedData(data, groupBy, sortBy, selectedColumnsObjects);

  // Export functionality
  const { exportToExcel, exportToPDF, exportToCSV, printReport } = useReportExport();

  // Handle export
  const handleExport = useCallback((format) => {
    const title = selectedTemplate?.name || 'Hostel Report';
    
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
    
    const totalRooms = [...new Set(data.map(d => d.room_number))].length;
    const totalBeds = data.reduce((sum, d) => sum + (d.bed_capacity || 0), 0) / data.length * totalRooms;
    const activeResidents = data.filter(d => d.allocation_status === 'Active').length;
    const pendingFees = data.filter(d => d.fee_due > 0).length;
    
    return { totalRooms, totalBeds: Math.round(totalBeds), activeResidents, pendingFees };
  }, [data]);

  return (
    <ReportGeneratorLayout
      title="Hostel Reports"
      subtitle="Generate comprehensive hostel reports - Rooms, Students, Fees & Mess"
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
                  <DoorOpen className="h-4 w-4 text-pink-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Rooms:</span>
                  <Badge variant="outline" className="font-bold dark:border-gray-600 dark:text-gray-200">{stats.totalRooms}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Beds:</span>
                  <Badge className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">{stats.totalBeds}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Active Residents:</span>
                  <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">{stats.activeResidents}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Pending Fees:</span>
                  <Badge className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300">{stats.pendingFees}</Badge>
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
                    <Filter className="h-4 w-4 text-pink-500" />
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
                    availableColumns={HOSTEL_COLUMNS}
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
              title={selectedTemplate?.name || 'Hostel Report'}
              filename="hostel_report"
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
        reportName={selectedTemplate?.name || 'Hostel Report'}
      />
    </ReportGeneratorLayout>
  );
};

export default HostelReportGenerator;
