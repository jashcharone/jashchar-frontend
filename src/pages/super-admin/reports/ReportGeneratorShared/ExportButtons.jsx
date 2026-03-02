/**
 * ExportButtons - Report Export Actions
 * Provides buttons for Excel, PDF, CSV, Print exports
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
  compact = false
}) => {
  const [isExporting, setIsExporting] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

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

  // Export to Excel
  const exportToExcel = async () => {
    setIsExporting('excel');
    onExportStart?.('excel');

    try {
      const exportData = prepareExportData();
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');

      // Auto-adjust column widths
      const colWidths = columns.map(col => ({ wch: Math.max(col.label.length + 2, 15) }));
      ws['!cols'] = colWidths;

      const timestamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);

      onExportComplete?.('excel');
    } catch (err) {
      console.error('Excel export error:', err);
      onExportError?.('excel', err);
    } finally {
      setIsExporting(null);
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    setIsExporting('pdf');
    onExportStart?.('pdf');

    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');

      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, 15);

      // Generated date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${formatDateTime(new Date())}`, 14, 22);
      doc.text(`Total Records: ${data.length}`, 14, 27);

      // Table
      const headers = columns.map(col => col.label);
      const rows = data.map(row =>
        columns.map(col => formatValue(getNestedValue(row, col.key), col))
      );

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 32,
        theme: 'striped',
        headStyles: {
          fillColor: [68, 114, 196],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 8
        },
        bodyStyles: {
          fontSize: 7
        },
        alternateRowStyles: {
          fillColor: [240, 240, 250]
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Footer
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }
      });

      const timestamp = new Date().toISOString().slice(0, 10);
      doc.save(`${filename}_${timestamp}.pdf`);

      onExportComplete?.('pdf');
    } catch (err) {
      console.error('PDF export error:', err);
      onExportError?.('pdf', err);
    } finally {
      setIsExporting(null);
    }
  };

  // Export to CSV
  const exportToCSV = async () => {
    setIsExporting('csv');
    onExportStart?.('csv');

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

      onExportComplete?.('csv');
    } catch (err) {
      console.error('CSV export error:', err);
      onExportError?.('csv', err);
    } finally {
      setIsExporting(null);
    }
  };

  // Print Report
  const printReport = () => {
    setIsExporting('print');
    onExportStart?.('print');

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to print the report');
        setIsExporting(null);
        return;
      }

      const tableRows = data.map((row, idx) => `
        <tr class="${idx % 2 === 0 ? 'even' : 'odd'}">
          <td class="row-num">${idx + 1}</td>
          ${columns.map(col => `<td>${formatValue(getNestedValue(row, col.key), col)}</td>`).join('')}
        </tr>
      `).join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              margin: 0; 
              padding: 20px;
              color: #333;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
              border-bottom: 2px solid #4472C4;
              padding-bottom: 10px;
            }
            h1 { 
              font-size: 20px; 
              margin: 0;
              color: #4472C4;
            }
            .meta {
              text-align: right;
              font-size: 11px;
              color: #666;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              font-size: 10px;
              margin-top: 10px;
            }
            th { 
              background: #4472C4; 
              color: white; 
              padding: 8px 6px; 
              text-align: left;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 9px;
            }
            td { 
              padding: 6px; 
              border-bottom: 1px solid #e0e0e0;
            }
            tr.odd { background: #f8f9fa; }
            tr:hover { background: #e8f4fc; }
            .row-num { 
              color: #999; 
              font-size: 9px;
              width: 30px;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 9px;
              color: #999;
            }
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
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${title}</h1>
            </div>
            <div class="meta">
              <div>Generated: ${formatDateTime(new Date())}</div>
              <div>Total Records: ${data.length}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                ${columns.map(col => `<th>${col.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="footer">
            Report generated from Jashchar ERP
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

      onExportComplete?.('print');
    } catch (err) {
      console.error('Print error:', err);
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
