/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FEE EXPORT ENGINE
 * Day 39 Implementation - Fee Collection Phase 4 (Analytics)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Export to CSV/Excel
 * - PDF generation
 * - Multiple report templates
 * - Bulk export
 * - Email delivery
 */

import { formatDate, formatDateTime } from '@/utils/dateUtils';

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

export const REPORT_TEMPLATES = {
  DAILY_COLLECTION: {
    id: 'daily_collection',
    name: 'Daily Collection Report',
    description: 'Summary of fees collected on a specific date',
    columns: ['receipt_no', 'student_name', 'class', 'fee_type', 'amount', 'payment_mode', 'collected_by', 'time']
  },
  OUTSTANDING_FEES: {
    id: 'outstanding_fees',
    name: 'Outstanding Fees Report',
    description: 'List of pending fee payments',
    columns: ['enrollment_id', 'student_name', 'class', 'fee_type', 'total_amount', 'paid', 'balance', 'due_date', 'days_overdue']
  },
  CLASS_WISE: {
    id: 'class_wise',
    name: 'Class-wise Collection Report',
    description: 'Collection summary by class and section',
    columns: ['class', 'section', 'total_students', 'total_fees', 'collected', 'pending', 'collection_percentage']
  },
  STUDENT_LEDGER: {
    id: 'student_ledger',
    name: 'Student Fee Ledger',
    description: 'Complete fee history of a student',
    columns: ['date', 'fee_type', 'description', 'debit', 'credit', 'balance']
  },
  DEFAULTER_LIST: {
    id: 'defaulter_list',
    name: 'Defaulter List',
    description: 'Students with overdue fees',
    columns: ['enrollment_id', 'student_name', 'class', 'outstanding', 'overdue_days', 'risk_level', 'phone']
  },
  FEE_STRUCTURE: {
    id: 'fee_structure',
    name: 'Fee Structure Report',
    description: 'Fee types and amounts by class',
    columns: ['class', 'fee_type', 'amount', 'due_date', 'installment']
  },
  MONTHLY_SUMMARY: {
    id: 'monthly_summary',
    name: 'Monthly Summary Report',
    description: 'Month-wise collection summary',
    columns: ['month', 'total_collected', 'cash', 'online', 'upi', 'transactions', 'avg_transaction']
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CSV EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Export data to CSV format
 * @param {Object} options - Export options
 * @param {string} options.title - Report title
 * @param {Array} options.headers - Column headers
 * @param {Array} options.rows - Data rows
 * @param {Object} options.metadata - Additional metadata
 * @param {string} options.filename - Output filename
 */
export const exportToCSV = ({ title, headers, rows, metadata = {}, filename }) => {
  let csv = '';
  
  // Add title
  if (title) {
    csv += `${title}\n`;
    csv += `Generated: ${formatDateTime(new Date())}\n`;
    
    // Add metadata
    Object.entries(metadata).forEach(([key, value]) => {
      csv += `${key}: ${value}\n`;
    });
    csv += '\n';
  }
  
  // Add headers
  if (headers && headers.length > 0) {
    csv += headers.join(',') + '\n';
  }
  
  // Add rows
  rows.forEach(row => {
    const values = Array.isArray(row) 
      ? row 
      : headers.map(h => row[h.toLowerCase().replace(/ /g, '_')] || row[h] || '');
    
    // Escape values with commas or quotes
    const escapedValues = values.map(val => {
      const strVal = String(val ?? '');
      if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    });
    
    csv += escapedValues.join(',') + '\n';
  });
  
  // Download file
  downloadFile(csv, filename || 'export.csv', 'text/csv');
  
  return csv;
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXCEL EXPORT (Using CSV with excel-compatible format)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Export data to Excel-compatible format
 * @param {Object} options - Export options
 */
export const exportToExcel = ({ title, sheets = [], filename }) => {
  // For now, we use CSV format with UTF-8 BOM for Excel compatibility
  // In production, you might want to use a library like xlsx
  
  let content = '\uFEFF'; // UTF-8 BOM for Excel
  
  sheets.forEach((sheet, idx) => {
    if (idx > 0) content += '\n\n';
    
    // Sheet name
    content += `=== ${sheet.name || `Sheet ${idx + 1}`} ===\n\n`;
    
    // Title
    if (sheet.title) {
      content += `${sheet.title}\n`;
      content += `Generated: ${formatDateTime(new Date())}\n\n`;
    }
    
    // Headers
    if (sheet.headers) {
      content += sheet.headers.join('\t') + '\n';
    }
    
    // Data rows
    (sheet.rows || []).forEach(row => {
      const values = Array.isArray(row)
        ? row
        : sheet.headers.map(h => row[h.toLowerCase().replace(/ /g, '_')] || '');
      content += values.join('\t') + '\n';
    });
    
    // Summary
    if (sheet.summary) {
      content += '\n';
      Object.entries(sheet.summary).forEach(([key, value]) => {
        content += `${key}\t${value}\n`;
      });
    }
  });
  
  downloadFile(content, filename || 'export.xlsx', 'application/vnd.ms-excel');
  
  return content;
};

// ═══════════════════════════════════════════════════════════════════════════════
// PDF EXPORT (HTML-based print)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate printable PDF-style report
 * @param {Object} options - PDF options
 */
export const generatePDFReport = ({
  title,
  subtitle,
  schoolName,
  headers,
  rows,
  summary = {},
  metadata = {},
  orientation = 'portrait'
}) => {
  const printWindow = window.open('', '', 'width=900,height=700');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title || 'Report'}</title>
      <style>
        @page {
          size: A4 ${orientation};
          margin: 15mm;
        }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 11px;
          line-height: 1.4;
          color: #333;
          padding: 0;
          margin: 0;
        }
        .container {
          max-width: 100%;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .school-name {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          margin: 0;
        }
        .report-title {
          font-size: 16px;
          font-weight: bold;
          margin: 10px 0 5px;
        }
        .subtitle {
          font-size: 12px;
          color: #666;
        }
        .metadata {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 15px;
          padding: 10px;
          background: #f8fafc;
          border-radius: 4px;
        }
        .metadata-item {
          font-size: 10px;
        }
        .metadata-label {
          color: #666;
        }
        .metadata-value {
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        th {
          background: #1e40af;
          color: white;
          font-weight: 600;
          text-align: left;
          padding: 10px 8px;
          font-size: 10px;
          text-transform: uppercase;
        }
        td {
          padding: 8px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 10px;
        }
        tr:nth-child(even) {
          background: #f8fafc;
        }
        tr:hover {
          background: #e8f4fd;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .amount {
          font-family: 'Consolas', monospace;
          font-weight: bold;
        }
        .amount-positive {
          color: #16a34a;
        }
        .amount-negative {
          color: #dc2626;
        }
        .summary {
          margin-top: 20px;
          padding: 15px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 4px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px dashed #cbd5e1;
        }
        .summary-row:last-child {
          border-bottom: none;
          font-weight: bold;
          font-size: 12px;
          padding-top: 10px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #666;
        }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: bold;
        }
        .badge-success { background: #dcfce7; color: #16a34a; }
        .badge-warning { background: #fef9c3; color: #ca8a04; }
        .badge-danger { background: #fee2e2; color: #dc2626; }
        .badge-info { background: #dbeafe; color: #2563eb; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="school-name">${schoolName || 'School Name'}</h1>
          <h2 class="report-title">${title || 'Report'}</h2>
          ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
        </div>
        
        ${Object.keys(metadata).length > 0 ? `
          <div class="metadata">
            ${Object.entries(metadata).map(([key, value]) => `
              <div class="metadata-item">
                <span class="metadata-label">${key}:</span>
                <span class="metadata-value">${value}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${(Array.isArray(row) ? row : Object.values(row)).map(cell => `
                  <td>${cell}</td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${Object.keys(summary).length > 0 ? `
          <div class="summary">
            ${Object.entries(summary).map(([key, value]) => `
              <div class="summary-row">
                <span>${key}</span>
                <span class="amount">${value}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="footer">
          <span>Generated by Jashchar ERP</span>
          <span>${formatDateTime(new Date())}</span>
        </div>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  return printWindow;
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE-BASED EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Export using predefined template
 * @param {string} templateId - Template ID from REPORT_TEMPLATES
 * @param {Array} data - Data to export
 * @param {Object} options - Additional options
 */
export const exportWithTemplate = (templateId, data, options = {}) => {
  const template = REPORT_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Unknown template: ${templateId}`);
  }
  
  const {
    format = 'csv',
    schoolName,
    dateRange,
    filters = {}
  } = options;
  
  const metadata = {
    'Report': template.name,
    ...(dateRange && { 'Period': dateRange }),
    ...Object.entries(filters).reduce((acc, [k, v]) => {
      if (v && v !== 'all') acc[k] = v;
      return acc;
    }, {})
  };
  
  // Convert column keys to headers
  const headers = template.columns.map(col => 
    col.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  );
  
  // Prepare rows based on template
  const rows = data.map(item => {
    return template.columns.map(col => formatCellValue(item[col], col));
  });
  
  // Calculate summary based on template
  const summary = calculateTemplateSummary(template.id, data);
  
  const filename = `${template.id}_${formatDate(new Date()).replace(/-/g, '')}.${format}`;
  
  if (format === 'csv') {
    return exportToCSV({
      title: template.name,
      headers,
      rows,
      metadata,
      filename
    });
  } else if (format === 'pdf') {
    return generatePDFReport({
      title: template.name,
      schoolName,
      headers,
      rows,
      summary,
      metadata
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// BULK EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Export multiple reports at once
 * @param {Array} reports - Array of report configurations
 */
export const bulkExport = async (reports, options = {}) => {
  const { onProgress } = options;
  const results = [];
  
  for (let i = 0; i < reports.length; i++) {
    const report = reports[i];
    
    try {
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: reports.length,
          report: report.name
        });
      }
      
      // Add small delay to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await exportWithTemplate(
        report.templateId,
        report.data,
        report.options
      );
      
      results.push({ success: true, name: report.name, result });
    } catch (error) {
      results.push({ success: false, name: report.name, error: error.message });
    }
  }
  
  return results;
};

// ═══════════════════════════════════════════════════════════════════════════════
// RECEIPTS EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate fee receipt for printing
 * @param {Object} receipt - Receipt data
 */
export const generateFeeReceipt = (receipt, schoolInfo = {}) => {
  const printWindow = window.open('', '', 'width=600,height=700');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Fee Receipt - ${receipt.receipt_no}</title>
      <style>
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 12px;
          padding: 20px;
          max-width: 400px;
          margin: 0 auto;
        }
        .receipt-header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .school-name {
          font-size: 16px;
          font-weight: bold;
          margin: 0;
        }
        .receipt-no {
          background: #f0f0f0;
          padding: 5px 10px;
          border-radius: 4px;
          display: inline-block;
          margin: 10px 0;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 100px 1fr;
          gap: 5px;
          margin-bottom: 15px;
        }
        .label {
          font-weight: bold;
          color: #666;
        }
        .fee-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        .fee-table th, .fee-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .fee-table th {
          background: #f5f5f5;
        }
        .total-row {
          font-weight: bold;
          background: #e8f4fd;
        }
        .amount-words {
          font-style: italic;
          padding: 10px;
          background: #f9f9f9;
          border-radius: 4px;
          margin: 10px 0;
        }
        .footer {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
        }
        .signature {
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid #333;
          width: 120px;
          margin-top: 40px;
          padding-top: 5px;
        }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-header">
        <h1 class="school-name">${schoolInfo.name || 'School Name'}</h1>
        <p>${schoolInfo.address || ''}</p>
        <p>Phone: ${schoolInfo.phone || ''}</p>
        <div class="receipt-no">Receipt No: <strong>${receipt.receipt_no}</strong></div>
        <p>Date: ${formatDate(receipt.payment_date)}</p>
      </div>
      
      <div class="info-grid">
        <span class="label">Student:</span>
        <span>${receipt.student_name || '-'}</span>
        
        <span class="label">School Code:</span>
        <span>${receipt.enrollment_id || '-'}</span>
        
        <span class="label">Class:</span>
        <span>${receipt.class_name || '-'} ${receipt.section_name || ''}</span>
        
        <span class="label">Payment Mode:</span>
        <span>${receipt.payment_mode || '-'}</span>
      </div>
      
      <table class="fee-table">
        <thead>
          <tr>
            <th>Fee Type</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${(receipt.fee_items || []).map(item => `
            <tr>
              <td>${item.fee_type}</td>
              <td style="text-align: right;">₹${(item.amount || 0).toLocaleString('en-IN')}</td>
            </tr>
          `).join('')}
          ${receipt.discount > 0 ? `
            <tr>
              <td>Discount</td>
              <td style="text-align: right; color: green;">-₹${receipt.discount.toLocaleString('en-IN')}</td>
            </tr>
          ` : ''}
          <tr class="total-row">
            <td>Total</td>
            <td style="text-align: right;">₹${(receipt.total_amount || 0).toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="amount-words">
        Amount in words: <strong>${numberToWords(receipt.total_amount || 0)} Rupees Only</strong>
      </div>
      
      <div class="footer">
        <div class="signature">
          <div class="signature-line">Parent/Guardian</div>
        </div>
        <div class="signature">
          <div class="signature-line">Authorized Signatory</div>
        </div>
      </div>
      
      <p style="text-align: center; margin-top: 20px; font-size: 10px; color: #666;">
        This is a computer-generated receipt.
      </p>
      
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  return printWindow;
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Download file with given content
 */
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Format cell value based on column type
 */
const formatCellValue = (value, columnKey) => {
  if (value === null || value === undefined) return '-';
  
  // Amount columns
  if (columnKey.includes('amount') || columnKey.includes('balance') || 
      columnKey.includes('paid') || columnKey.includes('collected')) {
    return `₹${Number(value).toLocaleString('en-IN')}`;
  }
  
  // Date columns
  if (columnKey.includes('date') || columnKey.includes('time')) {
    return formatDate(value);
  }
  
  // Percentage
  if (columnKey.includes('percentage')) {
    return `${value}%`;
  }
  
  return String(value);
};

/**
 * Calculate summary based on template
 */
const calculateTemplateSummary = (templateId, data) => {
  const summary = {};
  
  switch (templateId) {
    case 'daily_collection':
      summary['Total Collection'] = `₹${data.reduce((sum, r) => sum + (r.amount || 0), 0).toLocaleString('en-IN')}`;
      summary['Total Transactions'] = data.length;
      break;
      
    case 'outstanding_fees':
      summary['Total Outstanding'] = `₹${data.reduce((sum, r) => sum + (r.balance || 0), 0).toLocaleString('en-IN')}`;
      summary['Students Count'] = data.length;
      break;
      
    case 'class_wise':
      summary['Total Collection'] = `₹${data.reduce((sum, r) => sum + (r.collected || 0), 0).toLocaleString('en-IN')}`;
      summary['Total Pending'] = `₹${data.reduce((sum, r) => sum + (r.pending || 0), 0).toLocaleString('en-IN')}`;
      break;
      
    case 'defaulter_list':
      summary['Total Defaulters'] = data.length;
      summary['Total Outstanding'] = `₹${data.reduce((sum, r) => sum + (r.outstanding || 0), 0).toLocaleString('en-IN')}`;
      break;
  }
  
  return summary;
};

/**
 * Convert number to words
 */
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convertHundreds = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertHundreds(n % 100) : '');
  };
  
  if (num === 0) return 'Zero';
  
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = num % 1000;
  
  let result = '';
  if (crore) result += convertHundreds(crore) + ' Crore ';
  if (lakh) result += convertHundreds(lakh) + ' Lakh ';
  if (thousand) result += convertHundreds(thousand) + ' Thousand ';
  if (remainder) result += convertHundreds(remainder);
  
  return result.trim();
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULED REPORT GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Queue report for scheduled generation
 * @param {Object} config - Report configuration
 */
export const queueScheduledReport = async (config) => {
  // This would typically save to database for backend processing
  // For now, we'll store in localStorage as placeholder
  
  const scheduledReports = JSON.parse(localStorage.getItem('scheduledReports') || '[]');
  
  const newReport = {
    id: `report_${Date.now()}`,
    ...config,
    createdAt: new Date().toISOString(),
    status: 'scheduled'
  };
  
  scheduledReports.push(newReport);
  localStorage.setItem('scheduledReports', JSON.stringify(scheduledReports));
  
  return newReport;
};

/**
 * Get scheduled reports
 */
export const getScheduledReports = () => {
  return JSON.parse(localStorage.getItem('scheduledReports') || '[]');
};

/**
 * Cancel scheduled report
 */
export const cancelScheduledReport = (reportId) => {
  const reports = getScheduledReports();
  const filtered = reports.filter(r => r.id !== reportId);
  localStorage.setItem('scheduledReports', JSON.stringify(filtered));
};

export default {
  REPORT_TEMPLATES,
  exportToCSV,
  exportToExcel,
  generatePDFReport,
  exportWithTemplate,
  bulkExport,
  generateFeeReceipt,
  queueScheduledReport,
  getScheduledReports,
  cancelScheduledReport
};
