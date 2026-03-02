// Report Generator Custom Hooks
// Reusable hooks for the unified report system

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import apiClient from '@/lib/apiClient';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatDateTime } from '@/utils/dateUtils';

/**
 * Hook for managing report state
 */
export const useReportState = (options = {}) => {
  const { defaultColumns = [] } = options;
  
  // UI State
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // Template State
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [savedTemplates, setSavedTemplates] = useState([]);
  
  // Report Configuration
  const [selectedColumns, setSelectedColumns] = useState(defaultColumns);
  const [filters, setFilters] = useState({});
  const [groupBy, setGroupBy] = useState([]);
  const [sortBy, setSortBy] = useState([]);
  
  // Data State
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const resetState = useCallback(() => {
    setSelectedColumns(defaultColumns);
    setFilters({});
    setGroupBy([]);
    setSortBy([]);
    setData([]);
    setError(null);
    setSelectedTemplate(null);
  }, [defaultColumns]);

  return {
    // UI State
    showSidebar, setShowSidebar,
    showSaveModal, setShowSaveModal,
    showScheduleModal, setShowScheduleModal,
    
    // Template State
    selectedTemplate, setSelectedTemplate,
    savedTemplates, setSavedTemplates,
    
    // Report Configuration
    selectedColumns, setSelectedColumns,
    filters, setFilters,
    groupBy, setGroupBy,
    sortBy, setSortBy,
    
    // Data State
    data, setData,
    isLoading, setIsLoading,
    error, setError,
    
    // Actions
    resetState
  };
};

/**
 * Hook for fetching report data
 */
export const useFetchReport = (apiEndpoint) => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (params = {}) => {
    if (!selectedBranch?.id) {
      return { data: [], total: 0 };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(apiEndpoint, {
        params: {
          organization_id: organizationId,
          branch_id: selectedBranch.id,
          session_id: currentSessionId,
          ...params
        }
      });

      const responseData = response.data?.data || response.data || [];
      const total = response.data?.total || responseData.length;

      return { data: responseData, total };
    } catch (err) {
      console.error('Report fetch error:', err);
      setError(err.message || 'Failed to fetch report data');
      return { data: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, selectedBranch, currentSessionId, organizationId]);

  return { fetchData, loading, error };
};

/**
 * Hook for export functionality
 */
export const useReportExport = () => {
  const [exporting, setExporting] = useState(false);

  const exportToExcel = useCallback((data, columns, filename = 'report') => {
    setExporting(true);
    try {
      // Prepare data for export
      const exportData = data.map(row => {
        const exportRow = {};
        columns.forEach(col => {
          const value = getNestedValue(row, col.key);
          exportRow[col.label] = formatExportValue(value, col.type);
        });
        return exportRow;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');

      // Style header row
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4472C4' } }
        };
      }

      const timestamp = formatDateTime(new Date()).replace(/[/:]/g, '-').replace(' ', '_');
      XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
    } catch (err) {
      console.error('Excel export error:', err);
      throw err;
    } finally {
      setExporting(false);
    }
  }, []);

  const exportToPDF = useCallback((data, columns, filename = 'report', title = 'Report') => {
    setExporting(true);
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');

      // Add title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, 15);

      // Add date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${formatDateTime(new Date())}`, 14, 22);

      // Prepare table data
      const headers = columns.map(col => col.label);
      const rows = data.map(row => 
        columns.map(col => formatExportValue(getNestedValue(row, col.key), col.type))
      );

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 28,
        theme: 'grid',
        headStyles: {
          fillColor: [68, 114, 196],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        }
      });

      const timestamp = formatDateTime(new Date()).replace(/[/:]/g, '-').replace(' ', '_');
      doc.save(`${filename}_${timestamp}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      throw err;
    } finally {
      setExporting(false);
    }
  }, []);

  const exportToCSV = useCallback((data, columns, filename = 'report') => {
    setExporting(true);
    try {
      const headers = columns.map(col => col.label).join(',');
      const rows = data.map(row =>
        columns.map(col => {
          const value = formatExportValue(getNestedValue(row, col.key), col.type);
          // Escape quotes and wrap in quotes if contains comma
          const escaped = String(value).replace(/"/g, '""');
          return escaped.includes(',') ? `"${escaped}"` : escaped;
        }).join(',')
      );

      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      
      const timestamp = formatDateTime(new Date()).replace(/[/:]/g, '-').replace(' ', '_');
      link.download = `${filename}_${timestamp}.csv`;
      link.click();
    } catch (err) {
      console.error('CSV export error:', err);
      throw err;
    } finally {
      setExporting(false);
    }
  }, []);

  const printReport = useCallback((data, columns, title = 'Report') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the report');
      return;
    }

    const tableRows = data.map((row, idx) => `
      <tr class="${idx % 2 === 0 ? 'even' : 'odd'}">
        ${columns.map(col => `<td>${formatExportValue(getNestedValue(row, col.key), col.type)}</td>`).join('')}
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { font-size: 18px; margin-bottom: 5px; }
          .date { font-size: 12px; color: #666; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #4472C4; color: white; padding: 8px; text-align: left; }
          td { padding: 6px 8px; border-bottom: 1px solid #ddd; }
          tr.odd { background: #f9f9f9; }
          @media print {
            body { margin: 0; }
            th { background: #4472C4 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="date">Generated: ${formatDateTime(new Date())}</div>
        <table>
          <thead>
            <tr>${columns.map(col => `<th>${col.label}</th>`).join('')}</tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }, []);

  return { exportToExcel, exportToPDF, exportToCSV, printReport, exporting };
};

/**
 * Hook for grouped data with subtotals
 */
export const useGroupedData = (data, groupByFields = [], sortBy = [], columns = []) => {
  return useMemo(() => {
    if (!data || !data.length) {
      return { groupedData: [], flatData: [], totals: {} };
    }

    // First sort the data
    let sortedData = [...data];
    if (sortBy.length > 0) {
      sortedData.sort((a, b) => {
        for (const sort of sortBy) {
          const aVal = getNestedValue(a, sort.field) || '';
          const bVal = getNestedValue(b, sort.field) || '';
          const comparison = String(aVal).localeCompare(String(bVal));
          if (comparison !== 0) {
            return sort.direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
    }

    // If no grouping, return flat data
    if (!groupByFields || !groupByFields.length) {
      return { 
        groupedData: sortedData, 
        flatData: sortedData,
        totals: calculateTotals(sortedData, columns) 
      };
    }

    // Group data
    const groups = {};
    sortedData.forEach(row => {
      const groupKey = groupByFields.map(field => getNestedValue(row, field) || 'N/A').join('|');
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(row);
    });

    // Build grouped result with subtotals
    const groupedData = [];
    Object.entries(groups).forEach(([key, rows]) => {
      // Add group header
      groupedData.push({
        _isGroupHeader: true,
        _groupKey: key,
        _groupLabel: key.replace(/\|/g, ' / '),
        _groupCount: rows.length
      });
      // Add group rows
      groupedData.push(...rows);
      // Add subtotal row
      const subtotal = calculateTotals(rows, columns);
      subtotal._isSubtotal = true;
      subtotal._groupKey = key;
      subtotal._groupLabel = key.replace(/\|/g, ' / ');
      groupedData.push(subtotal);
    });

    // Calculate grand total
    const totals = calculateTotals(sortedData, columns);
    totals._isGrandTotal = true;

    return { groupedData, flatData: sortedData, totals };
  }, [data, groupByFields, sortBy, columns]);
};

/**
 * Hook for filter options from API
 */
export const useFilterOptions = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Use selected session or fall back to current session
  const effectiveSessionId = selectedSessionId || currentSessionId;

  const fetchFilterOptions = useCallback(async () => {
    // Only need branchId to start - sessions fetch first, then classes/sections
    if (!selectedBranch?.id) {
      console.log('[useFilterOptions] Waiting for branchId');
      return;
    }

    setLoading(true);
    try {
      console.log('[useFilterOptions] Fetching with:', { 
        branchId: selectedBranch.id, 
        currentSessionId,
        selectedSessionId,
        effectiveSessionId,
        organizationId 
      });

      // Fetch sessions first (no session_id needed)
      const sessionsRes = await apiClient.get(`/reports/lookups/sessions?branch_id=${selectedBranch.id}`);
      const sessionsData = sessionsRes?.data?.data || sessionsRes?.data || [];
      console.log('[useFilterOptions] Sessions loaded:', sessionsData.length);
      setSessions(sessionsData);

      // Determine which session to use - priority: selected > current > active from list
      let sessionToUse = effectiveSessionId;
      if (!sessionToUse && sessionsData.length > 0) {
        // Get active session from the sessions list
        const activeSession = sessionsData.find(s => s.is_active);
        sessionToUse = activeSession?.id || sessionsData[0]?.id;
        console.log('[useFilterOptions] Using session from list:', sessionToUse);
      }

      if (!sessionToUse) {
        console.log('[useFilterOptions] No session available, skipping classes/sections');
        return;
      }
      
      // Build classes URL with valid params only
      const classParams = [`branch_id=${selectedBranch.id}`, `session_id=${sessionToUse}`];
      if (organizationId) classParams.push(`organization_id=${organizationId}`);
      
      // Fetch classes with session_id
      const classesRes = await apiClient.get(`/reports/lookups/classes?${classParams.join('&')}`);
      const classesData = classesRes?.data?.data || classesRes?.data || [];
      console.log('[useFilterOptions] Classes loaded:', classesData.length);
      setClasses(classesData);

      // Fetch all sections initially with session_id
      const sectionParams = [`branch_id=${selectedBranch.id}`, `session_id=${sessionToUse}`];
      if (organizationId) sectionParams.push(`organization_id=${organizationId}`);
      
      const sectionsRes = await apiClient.get(`/reports/lookups/sections?${sectionParams.join('&')}`);
      const sectionsData = sectionsRes?.data?.data || sectionsRes?.data || [];
      console.log('[useFilterOptions] Sections loaded:', sectionsData.length);
      setSections(sectionsData);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, organizationId, currentSessionId, selectedSessionId, effectiveSessionId]);

  // Fetch sections by class ID
  const fetchSectionsByClass = useCallback(async (classId) => {
    if (!selectedBranch?.id) return;
    
    // Build params - session_id is required
    const sessionToUse = effectiveSessionId || sessions.find(s => s.is_active)?.id || sessions[0]?.id;
    if (!sessionToUse) {
      console.log('[fetchSectionsByClass] No session available');
      return;
    }
    
    const baseParams = [`branch_id=${selectedBranch.id}`, `session_id=${sessionToUse}`];
    if (organizationId) baseParams.push(`organization_id=${organizationId}`);
    
    if (!classId) {
      // If no classId, fetch all sections
      try {
        const sectionsRes = await apiClient.get(`/reports/lookups/sections?${baseParams.join('&')}`);
        setSections(sectionsRes?.data?.data || sectionsRes?.data || []);
      } catch (err) {
        console.error('Error fetching sections:', err);
      }
      return;
    }

    try {
      // Add classId to params
      baseParams.push(`classId=${classId}`);
      const sectionsRes = await apiClient.get(`/reports/lookups/sections?${baseParams.join('&')}`);
      setSections(sectionsRes?.data?.data || sectionsRes?.data || []);
    } catch (err) {
      console.error('Error fetching sections by class:', err);
    }
  }, [selectedBranch, organizationId, effectiveSessionId, sessions]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  return { 
    classes, 
    sections, 
    sessions, 
    loading, 
    refetch: fetchFilterOptions, 
    fetchSectionsByClass, 
    setSections,
    // Session selection
    selectedSessionId,
    setSelectedSessionId,
    effectiveSessionId
  };
};

// Helper functions
const getNestedValue = (obj, path) => {
  if (!path) return undefined;
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const formatExportValue = (value, type) => {
  if (value === null || value === undefined) return '';
  
  switch (type) {
    case 'date':
      return formatDate(value);
    case 'datetime':
      return formatDateTime(value);
    case 'currency':
      return `₹${Number(value).toLocaleString('en-IN')}`;
    case 'percentage':
      return `${Number(value).toFixed(2)}%`;
    case 'boolean':
      return value ? 'Yes' : 'No';
    default:
      return String(value);
  }
};

const calculateTotals = (data, columns) => {
  const totals = { _count: data.length };
  
  columns.forEach(col => {
    if (col.type === 'number' || col.type === 'currency') {
      totals[col.key] = data.reduce((sum, row) => {
        const val = getNestedValue(row, col.key);
        return sum + (Number(val) || 0);
      }, 0);
    } else if (col.type === 'percentage') {
      const sum = data.reduce((s, row) => s + (Number(getNestedValue(row, col.key)) || 0), 0);
      totals[col.key] = data.length ? (sum / data.length).toFixed(2) : 0;
    }
  });

  return totals;
};

export default {
  useReportState,
  useFetchReport,
  useReportExport,
  useGroupedData,
  useFilterOptions
};
