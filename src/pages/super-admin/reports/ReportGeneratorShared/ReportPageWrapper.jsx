/**
 * ReportPageWrapper - Convenience Wrapper Component
 * Combines all shared components into a single easy-to-use wrapper
 * This simplifies creating new report pages
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import ReportGeneratorLayout from './ReportGeneratorLayout';
import TemplateSidebar from './TemplateSidebar';
import FilterPanel from './FilterPanel';
import ColumnSelector from './ColumnSelector';
import GroupSortPanel from './GroupSortPanel';
import LivePreviewTable from './LivePreviewTable';
import ExportButtons from './ExportButtons';
import SaveTemplateModal from './SaveTemplateModal';
import ScheduleReportModal from './ScheduleReportModal';
import { useFilterOptions } from './hooks';
import { REPORT_MODULES } from './constants';
import { Sheet, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

const ReportPageWrapper = ({
  module,                      // Module key (e.g., 'student-information')
  templates = [],              // Available templates for this module
  allColumns = [],             // All possible columns for this module
  fetchData,                   // Function to fetch report data
  title,                       // Override title
  filterConfig = {},           // Filter configuration
  onError                      // Error callback
}) => {
  // Auth context for DB persistence
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  // State
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [filters, setFilters] = useState({});
  const [groupBy, setGroupBy] = useState([]);
  const [sortBy, setSortBy] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Modals
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get module config
  const moduleConfig = REPORT_MODULES[module] || REPORT_MODULES['student-information'];
  
  // Get filter options
  const { classes, sections, sessions } = useFilterOptions();

  // Apply template
  const applyTemplate = useCallback((template) => {
    setSelectedTemplate(template);
    setSelectedColumns(template.columns?.map(c => c.key || c) || []);
    setFilters(template.defaultFilters || {});
    setGroupBy(template.defaultGroupBy || []);
    setSortBy(template.defaultSortBy || []);
    
    // Auto-fetch data for the template
    handleFetchData(template.defaultFilters || {});
  }, []);

  // Fetch data
  const handleFetchData = useCallback(async (filterOverrides = null) => {
    if (!fetchData) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchData(filterOverrides || filters);
      setData(result.data || result || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch data');
      onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [fetchData, filters, onError]);

  // Get selected column objects
  const selectedColumnObjects = selectedColumns
    .map(key => {
      // If template has column definitions, use those
      if (selectedTemplate?.columns) {
        const tCol = selectedTemplate.columns.find(c => (c.key || c) === key);
        if (tCol && typeof tCol === 'object') return tCol;
      }
      // Otherwise use from allColumns
      return allColumns.find(c => c.key === key);
    })
    .filter(Boolean);

  // Save template handler
  const handleSaveTemplate = async (templateData) => {
    setSaving(true);
    try {
      // TODO: Call API to save template
      console.log('Saving template:', templateData);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API
      setShowSaveModal(false);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Schedule report handler
  const handleScheduleReport = async (scheduleData) => {
    setSaving(true);
    try {
      // TODO: Call API to schedule report
      console.log('Scheduling report:', scheduleData);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API
      setShowScheduleModal(false);
    } catch (err) {
      console.error('Schedule error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Select first template on mount
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplate) {
      applyTemplate(templates[0]);
    }
  }, [templates]);

  return (
    <>
      <ReportGeneratorLayout
        module={module}
        title={title || moduleConfig.name}
        onRefresh={() => handleFetchData()}
        onSaveTemplate={() => setShowSaveModal(true)}
        onSchedule={() => setShowScheduleModal(true)}
        isLoading={loading}
        templateSidebar={
          <TemplateSidebar
            templates={templates}
            selectedTemplate={selectedTemplate?.key}
            onSelectTemplate={applyTemplate}
            color={moduleConfig.color}
          />
        }
        filterPanel={
          <FilterPanel
            filterConfig={filterConfig}
            filters={filters}
            onFiltersChange={setFilters}
            classes={classes}
            sections={sections}
            sessions={sessions}
            onApply={() => handleFetchData()}
            onReset={() => setFilters({})}
            color={moduleConfig.color}
          />
        }
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <ColumnSelector
              availableColumns={allColumns}
              selectedColumns={selectedColumns}
              onColumnsChange={setSelectedColumns}
              color={moduleConfig.color}
            />
            <GroupSortPanel
              columns={selectedColumnObjects}
              groupBy={groupBy}
              sortBy={sortBy}
              onGroupByChange={setGroupBy}
              onSortByChange={setSortBy}
              color={moduleConfig.color}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleFetchData()}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Generate Report
            </button>
            <ExportButtons
              data={data}
              columns={selectedColumnObjects}
              filename={selectedTemplate?.key || module}
              title={selectedTemplate?.name || title || moduleConfig.name}
              color={moduleConfig.color}
              compact
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="m-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <div className="font-medium text-red-700 dark:text-red-400">Error loading report</div>
              <div className="text-sm text-red-600 dark:text-red-300">{error}</div>
            </div>
          </div>
        )}

        {/* Table */}
        <LivePreviewTable
          data={data}
          columns={selectedColumnObjects}
          groupBy={groupBy}
          sortBy={sortBy}
          color={moduleConfig.color}
          showRowNumbers={true}
          showSubtotals={groupBy.length > 0}
          showGrandTotal={true}
          loading={loading}
          maxHeight="calc(100vh - 400px)"
        />
      </ReportGeneratorLayout>

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveTemplate}
        templateConfig={{
          columns: selectedColumns,
          filters,
          groupBy,
          sortBy
        }}
        saving={saving}
        module={module}
        branchId={selectedBranch?.id}
        organizationId={organizationId}
        sessionId={currentSessionId}
        userId={user?.id}
      />

      {/* Schedule Report Modal */}
      <ScheduleReportModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={handleScheduleReport}
        reportName={selectedTemplate?.name || title || moduleConfig.name}
        saving={saving}
      />
    </>
  );
};

export default ReportPageWrapper;
