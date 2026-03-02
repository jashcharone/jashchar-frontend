/**
 * Transport Report Generator
 * Complete transport reporting with 30+ templates
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
import { TRANSPORT_TEMPLATES, TEMPLATE_CATEGORIES } from './templates';
import { TRANSPORT_COLUMNS, getColumns, COLUMN_SETS } from './columns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bus, MapPin, Users, FileText, BarChart3, Download, Filter, RefreshCw, Route, AlertTriangle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TransportReportGenerator = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  // Module configuration
  const moduleConfig = REPORT_MODULES['transport'];
  const moduleColor = moduleConfig?.color || 'teal';

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
    defaultColumns: COLUMN_SETS.route_master  // Store as keys (strings), not objects
  });

  // Convert selected column keys to full column objects for table/export
  const selectedColumnsObjects = useMemo(() => {
    return selectedColumns
      .map(key => TRANSPORT_COLUMNS.find(c => c.key === key))
      .filter(Boolean);
  }, [selectedColumns]);

  // Templates for sidebar
  const allTemplates = useMemo(() => TRANSPORT_TEMPLATES, []);

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
        `${API_BASE}/reports/transport?${queryParams}`,
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
    const routeNames = ['Route A - North', 'Route B - South', 'Route C - East', 'Route D - West', 'Route E - Central'];
    const stopNames = ['Main Gate', 'City Center', 'Bus Stand', 'Railway Station', 'Market', 'Hospital', 'Temple Road', 'School Junction', 'Lake View', 'Garden Area'];
    const vehicleTypes = ['Bus', 'Mini Bus', 'Van', 'Auto'];
    const fuelTypes = ['Diesel', 'Petrol', 'CNG', 'Electric'];
    const statuses = ['Active', 'Active', 'Active', 'Under Maintenance', 'Inactive'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      // Route Info
      route_id: `RT${String(i + 1).padStart(3, '0')}`,
      route_name: routeNames[i % 5],
      route_code: `R${String((i % 5) + 1).padStart(2, '0')}`,
      route_number: (i % 5) + 1,
      route_type: i % 3 === 0 ? 'Morning & Evening' : i % 3 === 1 ? 'Morning Only' : 'Evening Only',
      start_point: 'School Campus',
      end_point: stopNames[i % 10],
      total_distance: 5 + (i % 20),
      total_stops: 3 + (i % 8),
      estimated_time: 20 + (i % 40),
      route_status: statuses[i % 5],
      route_fee: 500 + ((i % 10) * 100),
      
      // Stop Info
      stop_id: `ST${String(i + 1).padStart(3, '0')}`,
      stop_name: stopNames[i % 10],
      stop_sequence: (i % 10) + 1,
      stop_address: `${i + 1}, ${stopNames[i % 10]} Area`,
      pickup_time: `07:${String(30 + (i % 30)).padStart(2, '0')}`,
      drop_time: `16:${String(30 + (i % 30)).padStart(2, '0')}`,
      distance_from_school: 2 + (i % 15),
      stop_fee: 400 + ((i % 8) * 50),
      students_at_stop: 5 + (i % 20),
      
      // Vehicle Info
      vehicle_id: `VH${String(i + 1).padStart(3, '0')}`,
      vehicle_number: `KA-${String(10 + (i % 50)).padStart(2, '0')}-${String(1000 + i).slice(0, 4)}`,
      vehicle_name: `Transport ${i + 1}`,
      vehicle_type: vehicleTypes[i % 4],
      vehicle_model: ['Tata Winger', 'Force Traveller', 'Ashok Leyland', 'Mahindra Supro'][i % 4],
      seating_capacity: 20 + (i % 30),
      current_occupancy: 15 + (i % 20),
      available_seats: 5 + (i % 10),
      occupancy_percent: 60 + (i % 35),
      vehicle_status: statuses[i % 5],
      fuel_type: fuelTypes[i % 4],
      gps_enabled: i % 3 !== 0,
      
      // Driver Info
      driver_id: `DR${String(i + 1).padStart(3, '0')}`,
      driver_name: ['Raju Kumar', 'Prakash Singh', 'Mohan Rao', 'Suresh Verma', 'Ramesh Gupta'][i % 5],
      driver_phone: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      driver_license: `KA${String(2020 + (i % 5))}${String(i + 1).padStart(8, '0')}`,
      license_expiry: `202${6 + (i % 4)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      attendant_name: ['Lakshmi', 'Sunita', 'Meena', 'Kavita', 'Anita'][i % 5],
      attendant_phone: `97${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      
      // Student/User Info
      student_id: `STD${String(i + 1).padStart(4, '0')}`,
      admission_number: `ADM${2024}${String(i + 1).padStart(4, '0')}`,
      student_name: ['Rahul Sharma', 'Priya Verma', 'Amit Singh', 'Sneha Patel', 'Raj Kumar'][i % 5],
      class_name: ['5th', '6th', '7th', '8th', '9th', '10th'][i % 6],
      section_name: ['A', 'B', 'C'][i % 3],
      pickup_stop: stopNames[i % 10],
      drop_stop: stopNames[(i + 1) % 10],
      transport_type: i % 3 === 0 ? 'Both Ways' : i % 3 === 1 ? 'Pickup Only' : 'Drop Only',
      allocation_date: `2024-04-${String((i % 28) + 1).padStart(2, '0')}`,
      user_status: statuses[i % 5],
      
      // Contact Info
      father_name: `${['Rajesh', 'Suresh', 'Mukesh', 'Ramesh', 'Naresh'][i % 5]} ${['Sharma', 'Verma', 'Singh', 'Patel'][i % 4]}`,
      father_phone: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      mother_phone: `97${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      emergency_contact: 'Guardian',
      emergency_phone: `96${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      
      // Fee Info
      transport_fee: 1000 + ((i % 20) * 100),
      annual_fee: 12000 + ((i % 10) * 1000),
      monthly_fee: 1000 + ((i % 10) * 100),
      fee_paid: 800 + ((i % 15) * 100),
      fee_due: i % 5 === 0 ? 500 + ((i % 10) * 100) : 0,
      last_payment_date: `2025-01-${String((i % 28) + 1).padStart(2, '0')}`,
      payment_status: i % 5 === 0 ? 'Overdue' : 'Paid',
      days_overdue: i % 5 === 0 ? i % 30 : 0,
      
      // Trip Info
      trip_id: `TR${String(i + 1).padStart(5, '0')}`,
      trip_date: `2025-02-${String((i % 28) + 1).padStart(2, '0')}`,
      trip_type: i % 2 === 0 ? 'Morning' : 'Evening',
      departure_time: i % 2 === 0 ? '07:00' : '16:00',
      arrival_time: i % 2 === 0 ? '08:30' : '17:30',
      students_boarded: 15 + (i % 20),
      trip_status: ['Completed', 'Completed', 'Completed', 'In Progress', 'Cancelled'][i % 5],
      
      // Statistics
      total_students: 20 + (i % 30),
      active_users: 18 + (i % 25),
      total_trips: 50 + (i % 100),
      on_time_trips: 45 + (i % 90),
      delayed_trips: 5 + (i % 10),
      collection_amount: 50000 + (i * 1000),
      pending_amount: i % 5 === 0 ? 5000 + (i * 100) : 0
    }));
  };

  // Apply grouping and sorting
  const { groupedData, flatData } = useGroupedData(data, groupBy, sortBy, selectedColumnsObjects);

  // Export functionality
  const { exportToExcel, exportToPDF, exportToCSV, printReport } = useReportExport();

  // Handle export
  const handleExport = useCallback((format) => {
    const title = selectedTemplate?.name || 'Transport Report';
    
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
    
    const totalRoutes = [...new Set(data.map(d => d.route_name))].length;
    const totalVehicles = [...new Set(data.map(d => d.vehicle_number))].length;
    const activeUsers = data.filter(d => d.user_status === 'Active').length;
    const pendingFees = data.filter(d => d.fee_due > 0).length;
    
    return { totalRoutes, totalVehicles, activeUsers, pendingFees };
  }, [data]);

  return (
    <ReportGeneratorLayout
      title="Transport Reports"
      subtitle="Generate comprehensive transport reports - Routes, Vehicles, Users & Operations"
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
                  <Route className="h-4 w-4 text-teal-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Routes:</span>
                  <Badge variant="outline" className="font-bold dark:border-gray-600 dark:text-gray-200">{stats.totalRoutes}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Bus className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Vehicles:</span>
                  <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">{stats.totalVehicles}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Active Users:</span>
                  <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">{stats.activeUsers}</Badge>
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
                    <Filter className="h-4 w-4 text-teal-500" />
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
                    availableColumns={TRANSPORT_COLUMNS}
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
              title={selectedTemplate?.name || 'Transport Report'}
              filename="transport_report"
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
        reportName={selectedTemplate?.name || 'Transport Report'}
      />
    </ReportGeneratorLayout>
  );
};

export default TransportReportGenerator;
