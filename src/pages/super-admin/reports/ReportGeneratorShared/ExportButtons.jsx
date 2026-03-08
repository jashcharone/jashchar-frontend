/**
 * ExportButtons - Report Export Actions (ENHANCED)
 * Provides buttons for Excel, PDF, CSV, Print exports
 * Now with: School Header, Grand Total Row, Filter Info, History Logging
 */

import React, { useState } from 'react';
import {
  Download, FileSpreadsheet, FileText, Printer, Mail,
  Share2, ChevronDown, Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import { supabase } from '@/lib/customSupabaseClient';

const ExportButtons = ({
  data = [],                 // Data to export
  columns = [],              // Column definitions
  filename = 'report',       // Export filename (without extension)
  title = 'Report',          // Title for PDF/Print
  enabledFormats = ['excel', 'pdf', 'csv', 'print'],  // Which formats to show
  onExportStart,             // Callback before export
  onExportComplete,          // Callback after export
  onExportError,             // Callback on error
  color = 'blue',
  compact = false,
  // Enhanced props
  schoolInfo = null,         // { name, address, phone, email, logo, district, state, affiliationNo }
  showSchoolHeader = true,   // Toggle school header in print/PDF
  showGrandTotal = true,     // Toggle grand total row
  showFilterInfo = true,     // Show filter info below header
  filterInfo = {},           // { className, sectionName, dateFrom, dateTo, session, etc }
  preparedBy = '',           // Name of person who prepared
  authorizedBy = '',         // Name of authorizer
  customFooter = '',         // Custom footer text
  // History logging props
  saveHistory = true,        // Enable saving export history to DB
  module = '',               // Module name (student-information, fees, etc.)
  templateKey = '',          // Template key used
  branchId = null,           // Branch ID
  organizationId = null,     // Organization ID
  sessionId = null,          // Session ID
  userId = null,             // User ID who exported
}) => {
  const [isExporting, setIsExporting] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Save export history to report_logs table
  const saveExportHistory = async (format, startTime, success, errorMessage = null) => {
    if (!saveHistory || !branchId || !organizationId || !userId) {
      console.log('[ExportButtons] History not saved - missing required props');
      return;
    }

    try {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const historyRecord = {
        organization_id: organizationId,
        branch_id: branchId,
        user_id: userId,
        report_name: title,
        module: module || 'unknown',
        execution_type: 'manual',
        export_format: format,
        record_count: data.length,
        status: success ? 'completed' : 'failed',
        error_message: errorMessage,
        started_at: startTime.toISOString(),
        completed_at: endTime.toISOString(),
        duration_ms: duration
      };

      const { error } = await supabase
        .from('report_logs')
        .insert(historyRecord);

      if (error) {
        console.error('[ExportButtons] Failed to save history:', error.message);
      } else {
        console.log('[ExportButtons] Export history saved successfully');
      }
    } catch (err) {
      console.error('[ExportButtons] Error saving history:', err);
    }
  };

  // Get nested value from object
  const getNestedValue = (obj, path) => {
    if (!path) return undefined;
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Format value for export
  const formatValue = (value, column) => {
    if (value === null || value === undefined) return '';

    switch (column.type) {
      case 'date':
        return formatDate(value);
      case 'datetime':
        return formatDateTime(value);
      case 'currency':
        return Number(value) || 0;
      case 'number':
        return Number(value) || 0;
      case 'percentage':
        return `${Number(value).toFixed(2)}%`;
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  };

  // Prepare data for export
  const prepareExportData = () => {
    return data.map(row => {
      const exportRow = {};
      columns.forEach(col => {
        const value = getNestedValue(row, col.key);
        exportRow[col.label] = formatValue(value, col);
      });
      return exportRow;
    });
  };

  // Calculate grand totals for numeric columns
  const calculateGrandTotals = () => {
    const totals = {};
    columns.forEach(col => {
      if (col.type === 'currency' || col.type === 'number') {
        totals[col.key] = data.reduce((sum, row) => {
          const val = getNestedValue(row, col.key);
          return sum + (Number(val) || 0);
        }, 0);
      } else {
        totals[col.key] = null;
      }
    });
    return totals;
  };

  // Format currency for display
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Build filter info text
  const buildFilterInfoText = () => {
    const parts = [];
    if (filterInfo.session) parts.push(`Session: ${filterInfo.session}`);
    if (filterInfo.className) parts.push(`Class: ${filterInfo.className}`);
    if (filterInfo.sectionName) parts.push(`Section: ${filterInfo.sectionName}`);
    if (filterInfo.dateFrom && filterInfo.dateTo) {
      parts.push(`Period: ${formatDate(filterInfo.dateFrom)} to ${formatDate(filterInfo.dateTo)}`);
    } else if (filterInfo.dateFrom) {
      parts.push(`From: ${formatDate(filterInfo.dateFrom)}`);
    } else if (filterInfo.dateTo) {
      parts.push(`To: ${formatDate(filterInfo.dateTo)}`);
    }
    if (filterInfo.status) parts.push(`Status: ${filterInfo.status}`);
    if (filterInfo.paymentMode) parts.push(`Payment Mode: ${filterInfo.paymentMode}`);
    return parts;
  };

  // Export to Excel (ENHANCED with school header, grand total)
  const exportToExcel = async () => {
    setIsExporting('excel');
    onExportStart?.('excel');
    const startTime = new Date();

    try {
      // Prepare main data
      const exportData = prepareExportData();
      
      // Create array of arrays format for more control
      const wsData = [];

      // Add school header if enabled
      if (showSchoolHeader && schoolInfo) {
        wsData.push([schoolInfo.name || 'School Name']);
        if (schoolInfo.address) wsData.push([schoolInfo.address]);
        const contactParts = [];
        if (schoolInfo.phone) contactParts.push(`Phone: ${schoolInfo.phone}`);
        if (schoolInfo.email) contactParts.push(`Email: ${schoolInfo.email}`);
        if (contactParts.length > 0) wsData.push([contactParts.join(' | ')]);
        if (schoolInfo.affiliationNo) wsData.push([`Affiliation No: ${schoolInfo.affiliationNo}`]);
        wsData.push([]); // Empty row
      }

      // Add report title
      wsData.push([title]);
      wsData.push([`Generated: ${formatDateTime(new Date())} | Total Records: ${data.length}`]);

      // Add filter info if enabled
      if (showFilterInfo && filterInfo && Object.keys(filterInfo).length > 0) {
        const filterParts = [];
        if (filterInfo.session) filterParts.push(`Session: ${filterInfo.session}`);
        if (filterInfo.className) filterParts.push(`Class: ${filterInfo.className}`);
        if (filterInfo.sectionName) filterParts.push(`Section: ${filterInfo.sectionName}`);
        if (filterInfo.dateFrom) filterParts.push(`From: ${formatDate(filterInfo.dateFrom)}`);
        if (filterInfo.dateTo) filterParts.push(`To: ${formatDate(filterInfo.dateTo)}`);
        if (filterParts.length > 0) wsData.push([`Filters: ${filterParts.join(' | ')}`]);
      }
      wsData.push([]); // Empty row before data

      // Add headers
      const headers = columns.map(col => col.label);
      wsData.push(headers);

      // Add data rows
      data.forEach(row => {
        const rowData = columns.map(col => {
          const value = getNestedValue(row, col.key);
          // Keep numbers as numbers for Excel formulas
          if (col.type === 'currency' || col.type === 'number') {
            return Number(value) || 0;
          }
          return formatValue(value, col);
        });
        wsData.push(rowData);
      });

      // Add Grand Total row if enabled
      if (showGrandTotal && data.length > 0) {
        const grandTotals = calculateGrandTotals();
        const grandTotalRow = columns.map((col, index) => {
          if (index === 0) return 'GRAND TOTAL';
          if (grandTotals[col.key] !== undefined) {
            return grandTotals[col.key]; // Keep as number for Excel
          }
          return '';
        });
        wsData.push(grandTotalRow);
      }

      // Create worksheet from array
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');

      // Auto-adjust column widths
      const colWidths = columns.map(col => ({ wch: Math.max(col.label.length + 2, 15) }));
      ws['!cols'] = colWidths;

      const timestamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);

      await saveExportHistory('excel', startTime, true);
      onExportComplete?.('excel');
    } catch (err) {
      console.error('Excel export error:', err);
      await saveExportHistory('excel', startTime, false, err.message);
      onExportError?.('excel', err);
    } finally {
      setIsExporting(null);
    }
  };

  // Export to PDF (ENHANCED with school header, grand total, filter info)
  const exportToPDF = async () => {
    setIsExporting('pdf');
    onExportStart?.('pdf');
    const startTime = new Date();

    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let currentY = 10;

      // School Header (if enabled and schoolInfo provided)
      if (showSchoolHeader && schoolInfo) {
        // School Name (centered, large)
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55); // Dark gray
        doc.text(schoolInfo.name || 'School Name', pageWidth / 2, currentY + 5, { align: 'center' });
        currentY += 8;

        // Address
        if (schoolInfo.address) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(75, 85, 99); // Gray
          doc.text(schoolInfo.address, pageWidth / 2, currentY + 3, { align: 'center' });
          currentY += 5;
        }

        // Contact info line (Phone | Email | District/State)
        const contactParts = [];
        if (schoolInfo.phone) contactParts.push(`Ph: ${schoolInfo.phone}`);
        if (schoolInfo.email) contactParts.push(`Email: ${schoolInfo.email}`);
        if (schoolInfo.district && schoolInfo.state) {
          contactParts.push(`${schoolInfo.district}, ${schoolInfo.state}`);
        }
        if (contactParts.length > 0) {
          doc.setFontSize(9);
          doc.text(contactParts.join('  |  '), pageWidth / 2, currentY + 3, { align: 'center' });
          currentY += 5;
        }

        // Affiliation number
        if (schoolInfo.affiliationNo) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          doc.text(`Affiliation No: ${schoolInfo.affiliationNo}`, pageWidth / 2, currentY + 3, { align: 'center' });
          currentY += 5;
        }

        // Divider line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(14, currentY + 2, pageWidth - 14, currentY + 2);
        currentY += 6;
      }

      // Report Title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text(title, pageWidth / 2, currentY + 3, { align: 'center' });
      currentY += 8;

      // Filter Info (if enabled and provided)
      if (showFilterInfo && filterInfo && Object.keys(filterInfo).length > 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);

        const filterParts = [];
        if (filterInfo.session) filterParts.push(`Session: ${filterInfo.session}`);
        if (filterInfo.className) filterParts.push(`Class: ${filterInfo.className}`);
        if (filterInfo.sectionName) filterParts.push(`Section: ${filterInfo.sectionName}`);
        if (filterInfo.dateFrom) filterParts.push(`From: ${formatDate(filterInfo.dateFrom)}`);
        if (filterInfo.dateTo) filterParts.push(`To: ${formatDate(filterInfo.dateTo)}`);
        if (filterInfo.status) filterParts.push(`Status: ${filterInfo.status}`);
        if (filterInfo.feeType) filterParts.push(`Fee Type: ${filterInfo.feeType}`);
        if (filterInfo.paymentMode) filterParts.push(`Payment Mode: ${filterInfo.paymentMode}`);

        if (filterParts.length > 0) {
          doc.text(`Filters: ${filterParts.join('  |  ')}`, 14, currentY + 2);
          currentY += 5;
        }
      }

      // Generated info
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`Generated: ${formatDateTime(new Date())}  |  Total Records: ${data.length}`, 14, currentY + 2);
      currentY += 6;

      // Prepare table data
      const headers = columns.map(col => col.label);
      const rows = data.map(row =>
        columns.map(col => formatValue(getNestedValue(row, col.key), col))
      );

      // Add Grand Total row if enabled
      if (showGrandTotal && data.length > 0) {
        const grandTotals = calculateGrandTotals();
        const grandTotalRow = columns.map((col, index) => {
          if (index === 0) return 'GRAND TOTAL';
          if (grandTotals[col.key] !== undefined) {
            return col.type === 'currency' 
              ? formatCurrency(grandTotals[col.key])
              : grandTotals[col.key].toLocaleString('en-IN');
          }
          return '';
        });
        rows.push(grandTotalRow);
      }

      // Generate table
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: currentY,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 64, 175], // Blue
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 8,
          cellPadding: 2
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 1.5
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Light gray
        },
        // Style the grand total row if present
        willDrawCell: (data) => {
          if (showGrandTotal && data.row.index === rows.length - 1 && data.section === 'body') {
            data.cell.styles.fillColor = [254, 243, 199]; // Yellow background
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [31, 41, 55];
          }
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (tableData) => {
          // Page number footer
          doc.setFontSize(8);
          doc.setTextColor(107, 114, 128);
          doc.text(
            `Page ${tableData.pageNumber}`,
            pageWidth / 2,
            pageHeight - 8,
            { align: 'center' }
          );
        }
      });

      // Add signature section after table (on last page)
      const finalY = doc.lastAutoTable?.finalY || currentY + 50;
      if (finalY + 30 < pageHeight - 20) {
        const signatureY = finalY + 15;
        doc.setFontSize(9);
        doc.setTextColor(31, 41, 55);
        doc.setFont('helvetica', 'normal');

        // Prepared by (left side)
        doc.text('Prepared by:', 14, signatureY);
        doc.line(14, signatureY + 10, 80, signatureY + 10);
        if (preparedBy) {
          doc.text(preparedBy, 14, signatureY + 15);
        }

        // Authorized by (right side)
        doc.text('Authorized by:', pageWidth - 80, signatureY);
        doc.line(pageWidth - 80, signatureY + 10, pageWidth - 14, signatureY + 10);
        if (authorizedBy) {
          doc.text(authorizedBy, pageWidth - 80, signatureY + 15);
        }
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      doc.save(`${filename}_${timestamp}.pdf`);

      await saveExportHistory('pdf', startTime, true);
      onExportComplete?.('pdf');
    } catch (err) {
      console.error('PDF export error:', err);
      await saveExportHistory('pdf', startTime, false, err.message);
      onExportError?.('pdf', err);
    } finally {
      setIsExporting(null);
    }
  };

  // Export to CSV
  const exportToCSV = async () => {
    setIsExporting('csv');
    onExportStart?.('csv');
    const startTime = new Date();

    try {
      const headers = columns.map(col => `"${col.label}"`).join(',');
      const rows = data.map(row =>
        columns.map(col => {
          const value = formatValue(getNestedValue(row, col.key), col);
          // Escape quotes and wrap in quotes if contains comma
          const escaped = String(value).replace(/"/g, '""');
          return escaped.includes(',') || escaped.includes('"') ? `"${escaped}"` : escaped;
        }).join(',')
      );

      const csv = [headers, ...rows].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);

      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `${filename}_${timestamp}.csv`;
      link.click();

      await saveExportHistory('csv', startTime, true);
      onExportComplete?.('csv');
    } catch (err) {
      console.error('CSV export error:', err);
      await saveExportHistory('csv', startTime, false, err.message);
      onExportError?.('csv', err);
    } finally {
      setIsExporting(null);
    }
  };

  // Print Report (ENHANCED with school header, grand total, etc.)
  const printReport = () => {
    setIsExporting('print');
    onExportStart?.('print');
    const startTime = new Date();

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to print the report');
        setIsExporting(null);
        return;
      }

      // Build data rows
      const tableRows = data.map((row, idx) => `
        <tr class="${idx % 2 === 0 ? 'even' : 'odd'}">
          <td class="row-num">${idx + 1}</td>
          ${columns.map(col => {
            const value = formatValue(getNestedValue(row, col.key), col);
            const isNumeric = col.type === 'currency' || col.type === 'number';
            const displayValue = col.type === 'currency' ? formatCurrency(Number(value) || 0) : value;
            return `<td class="${isNumeric ? 'text-right' : ''}">${displayValue}</td>`;
          }).join('')}
        </tr>
      `).join('');

      // Build grand total row
      const totals = calculateGrandTotals();
      const grandTotalRow = showGrandTotal ? `
        <tr class="grand-total">
          <td class="row-num"></td>
          ${columns.map((col, idx) => {
            if (idx === 0) return `<td><strong>GRAND TOTAL</strong></td>`;
            if (totals[col.key] !== null) {
              const displayValue = col.type === 'currency' 
                ? formatCurrency(totals[col.key]) 
                : totals[col.key].toLocaleString('en-IN');
              return `<td class="text-right"><strong>${displayValue}</strong></td>`;
            }
            return `<td></td>`;
          }).join('')}
        </tr>
      ` : '';

      // Build filter info
      const filterInfoParts = buildFilterInfoText();
      const filterInfoHtml = showFilterInfo && filterInfoParts.length > 0 ? `
        <div class="filter-info">
          ${filterInfoParts.map(part => `<span class="filter-tag">${part}</span>`).join('')}
        </div>
      ` : '';

      // Build school header
      const schoolHeaderHtml = showSchoolHeader && schoolInfo ? `
        <div class="school-header">
          <div class="school-logo">
            ${schoolInfo.logo ? `<img src="${schoolInfo.logo}" alt="Logo" class="logo-img" />` : `
              <div class="logo-placeholder">
                <span>${schoolInfo.name?.charAt(0) || 'S'}</span>
              </div>
            `}
          </div>
          <div class="school-details">
            <h2 class="school-name">${schoolInfo.name || 'School Name'}</h2>
            ${schoolInfo.address ? `<p class="school-address">${schoolInfo.address}</p>` : ''}
            <p class="school-contact">
              ${schoolInfo.district ? `${schoolInfo.district}, ` : ''}${schoolInfo.state || ''}
              ${schoolInfo.phone ? ` | Phone: ${schoolInfo.phone}` : ''}
              ${schoolInfo.email ? ` | Email: ${schoolInfo.email}` : ''}
              ${schoolInfo.affiliationNo ? ` | Affiliation No: ${schoolInfo.affiliationNo}` : ''}
            </p>
          </div>
        </div>
      ` : '';

      // Build signature section
      const signatureHtml = (preparedBy || authorizedBy) ? `
        <div class="signature-section">
          ${preparedBy ? `
            <div class="signature-box">
              <div class="signature-line"></div>
              <p>Prepared By: ${preparedBy}</p>
            </div>
          ` : ''}
          ${authorizedBy ? `
            <div class="signature-box">
              <div class="signature-line"></div>
              <p>Authorized By: ${authorizedBy}</p>
            </div>
          ` : ''}
        </div>
      ` : '';

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              padding: 15px;
              color: #333;
              font-size: 11px;
            }
            
            /* School Header */
            .school-header {
              display: flex;
              align-items: center;
              gap: 15px;
              padding-bottom: 12px;
              border-bottom: 3px double #4472C4;
              margin-bottom: 10px;
            }
            .school-logo {
              flex-shrink: 0;
            }
            .logo-img {
              width: 60px;
              height: 60px;
              object-fit: contain;
            }
            .logo-placeholder {
              width: 60px;
              height: 60px;
              background: linear-gradient(135deg, #4472C4, #6B8DD6);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 24px;
              font-weight: bold;
            }
            .school-details {
              flex: 1;
              text-align: center;
            }
            .school-name {
              font-size: 18px;
              font-weight: 700;
              color: #1a365d;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 3px;
            }
            .school-address {
              font-size: 10px;
              color: #555;
              margin-bottom: 2px;
            }
            .school-contact {
              font-size: 9px;
              color: #666;
            }

            /* Report Header */
            .report-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin: 10px 0;
              padding-bottom: 8px;
              border-bottom: 2px solid #4472C4;
            }
            .report-title { 
              font-size: 16px; 
              font-weight: 700;
              color: #4472C4;
            }
            .meta {
              text-align: right;
              font-size: 10px;
              color: #666;
            }

            /* Filter Info */
            .filter-info {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              margin-bottom: 10px;
              padding: 8px;
              background: #f5f7fa;
              border-radius: 4px;
            }
            .filter-tag {
              background: #e8eef5;
              padding: 3px 8px;
              border-radius: 3px;
              font-size: 9px;
              color: #4472C4;
              border: 1px solid #d0dbe8;
            }

            /* Table */
            table { 
              width: 100%; 
              border-collapse: collapse; 
              font-size: 9px;
              margin-top: 8px;
              border: 1px solid #e0e0e0;
            }
            th { 
              background: #4472C4; 
              color: white; 
              padding: 6px 4px; 
              text-align: left;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 8px;
              border: 1px solid #3a62a8;
            }
            td { 
              padding: 5px 4px; 
              border: 1px solid #e0e0e0;
            }
            tr.odd { background: #f8f9fa; }
            tr.even { background: #fff; }
            .row-num { 
              color: #999; 
              font-size: 8px;
              width: 25px;
              text-align: center;
            }
            .text-right { text-align: right; }

            /* Grand Total Row */
            .grand-total {
              background: #e8f4fc !important;
              font-weight: 700;
            }
            .grand-total td {
              background: #e8f4fc !important;
              border-top: 2px solid #4472C4;
              padding: 8px 4px;
              font-size: 10px;
            }

            /* Summary Section */
            .summary-section {
              margin-top: 15px;
              padding: 10px;
              background: #f8f9fa;
              border-radius: 4px;
              display: flex;
              justify-content: space-between;
              flex-wrap: wrap;
              gap: 15px;
            }
            .summary-item {
              text-align: center;
            }
            .summary-label {
              font-size: 9px;
              color: #666;
              margin-bottom: 2px;
            }
            .summary-value {
              font-size: 14px;
              font-weight: 700;
              color: #4472C4;
            }

            /* Signature Section */
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
              padding-top: 20px;
            }
            .signature-box {
              text-align: center;
              min-width: 150px;
            }
            .signature-line {
              border-bottom: 1px solid #333;
              margin-bottom: 5px;
              height: 30px;
            }
            .signature-box p {
              font-size: 9px;
              color: #666;
            }

            /* Footer */
            .footer {
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px solid #e0e0e0;
              text-align: center;
              font-size: 8px;
              color: #999;
            }

            /* Print Styles */
            @media print {
              body { padding: 10px; }
              th { 
                background: #4472C4 !important; 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
              }
              tr.odd { 
                background: #f8f9fa !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .grand-total td {
                background: #e8f4fc !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .logo-placeholder {
                background: #4472C4 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .filter-info {
                background: #f5f7fa !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${schoolHeaderHtml}
          
          <div class="report-header">
            <div>
              <h1 class="report-title">${title}</h1>
            </div>
            <div class="meta">
              <div>Generated: ${formatDateTime(new Date())}</div>
              <div>Total Records: ${data.length}</div>
            </div>
          </div>
          
          ${filterInfoHtml}
          
          <table>
            <thead>
              <tr>
                <th>#</th>
                ${columns.map(col => `<th>${col.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              ${grandTotalRow}
            </tbody>
          </table>
          
          ${signatureHtml}
          
          <div class="footer">
            ${customFooter || 'Report generated from Jashchar ERP'} | Printed on ${formatDateTime(new Date())}
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();

      saveExportHistory('print', startTime, true);
      onExportComplete?.('print');
    } catch (err) {
      console.error('Print error:', err);
      saveExportHistory('print', startTime, false, err.message);
      onExportError?.('print', err);
    } finally {
      setIsExporting(null);
    }
  };

  // Export handlers map
  const exportHandlers = {
    excel: exportToExcel,
    pdf: exportToPDF,
    csv: exportToCSV,
    print: printReport
  };

  // Button config
  const buttonConfig = {
    excel: { icon: FileSpreadsheet, label: 'Excel', color: 'hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400' },
    pdf: { icon: FileText, label: 'PDF', color: 'hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400' },
    csv: { icon: FileText, label: 'CSV', color: 'hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400' },
    print: { icon: Printer, label: 'Print', color: 'hover:bg-gray-100 dark:hover:bg-gray-700' }
  };

  const filteredFormats = enabledFormats.filter(f => buttonConfig[f]);

  // Compact mode - dropdown
  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          disabled={!data.length}
        >
          <Download className="w-4 h-4" />
          Export
          <ChevronDown className={`w-4 h-4 transition ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-40 py-1 min-w-32">
              {filteredFormats.map(format => {
                const config = buttonConfig[format];
                const Icon = config.icon;
                const isLoading = isExporting === format;

                return (
                  <button
                    key={format}
                    onClick={() => {
                      setShowDropdown(false);
                      exportHandlers[format]();
                    }}
                    disabled={isLoading}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 dark:text-gray-200 ${config.color}`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    {config.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // Full mode - inline buttons
  return (
    <div className="flex items-center gap-2">
      {filteredFormats.map(format => {
        const config = buttonConfig[format];
        const Icon = config.icon;
        const isLoading = isExporting === format;

        return (
          <button
            key={format}
            onClick={() => exportHandlers[format]()}
            disabled={isLoading || !data.length}
            className={`
              flex items-center gap-1.5 px-3 py-2 text-sm border dark:border-gray-600 rounded-lg transition dark:text-gray-200
              ${data.length ? config.color : 'opacity-50 cursor-not-allowed'}
            `}
            title={`Export to ${config.label}`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Icon className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ExportButtons;
