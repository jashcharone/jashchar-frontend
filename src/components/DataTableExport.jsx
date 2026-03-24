import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { formatDate as formatDateUtil } from '@/utils/dateUtils';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Sheet, FileDown, FileText, Printer, Columns, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * DataTableExport Component
 * Provides export functionality for tables: Copy, Excel, CSV, PDF, Print, Column Toggle
 * 
 * @param {Object} props
 * @param {Array} props.data - Array of objects containing table data
 * @param {Array} props.columns - Array of column definitions [{key: string, label: string, visible?: boolean}]
 * @param {string} props.fileName - Base filename for exports (without extension)
 * @param {string} props.title - Title for PDF header (optional)
 * @param {React.RefObject} props.printRef - Ref for print area (optional, will use internal ref if not provided)
 * @param {Function} props.onColumnsChange - Callback when column visibility changes (optional)
 * @param {string} props.className - Additional CSS classes (optional)
 */
const DataTableExport = ({ 
  data = [], 
  columns = [], 
  fileName = 'export',
  title = '',
  printRef: externalPrintRef,
  onColumnsChange,
  className = ''
}) => {
  const { toast } = useToast();
  const internalPrintRef = useRef();
  const printRef = externalPrintRef || internalPrintRef;
  
  // Initialize column visibility
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const visibility = {};
    columns.forEach(col => {
      visibility[col.key] = col.visible !== false;
    });
    return visibility;
  });

  // Get visible columns
  const visibleColumns = columns.filter(col => columnVisibility[col.key]);

  // Toggle column visibility
  const toggleColumn = (columnKey) => {
    const newVisibility = {
      ...columnVisibility,
      [columnKey]: !columnVisibility[columnKey]
    };
    setColumnVisibility(newVisibility);
    onColumnsChange?.(newVisibility);
  };

  // Format data for export (only visible columns)
  const getExportData = useCallback(() => {
    return data.map(row => {
      const exportRow = {};
      visibleColumns.forEach(col => {
        exportRow[col.label] = row[col.key] ?? '';
      });
      return exportRow;
    });
  }, [data, visibleColumns]);

  // Copy to Clipboard
  const handleCopy = async () => {
    try {
      const exportData = getExportData();
      const headers = visibleColumns.map(col => col.label).join('\t');
      const rows = exportData.map(row => 
        visibleColumns.map(col => row[col.label]).join('\t')
      ).join('\n');
      const text = `${headers}\n${rows}`;
      
      await navigator.clipboard.writeText(text);
      toast({
        title: '✓ Copied!',
        description: `${data.length} rows copied to clipboard`,
        className: 'bg-green-600 text-white border-green-700'
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Unable to copy to clipboard'
      });
    }
  };

  // Export to Excel
  const handleExcel = () => {
    try {
      const exportData = getExportData();
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      
      // Auto-size columns
      const colWidths = visibleColumns.map(col => ({
        wch: Math.max(col.label.length, ...data.map(row => 
          String(row[col.key] ?? '').length
        ).slice(0, 100)) + 2
      }));
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `${fileName}.xlsx`);
      toast({
        title: '✓ Excel Downloaded!',
        description: `${fileName}.xlsx saved successfully`,
        className: 'bg-green-600 text-white border-green-700'
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Excel Export Failed',
        description: err.message
      });
    }
  };

  // Export to CSV
  const handleCSV = () => {
    try {
      const exportData = getExportData();
      const headers = visibleColumns.map(col => `"${col.label}"`).join(',');
      const rows = exportData.map(row => 
        visibleColumns.map(col => {
          const value = String(row[col.label] ?? '').replace(/"/g, '""');
          return `"${value}"`;
        }).join(',')
      ).join('\n');
      
      const csvContent = `${headers}\n${rows}`;
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${fileName}.csv`);
      
      toast({
        title: '✓ CSV Downloaded!',
        description: `${fileName}.csv saved successfully`,
        className: 'bg-green-600 text-white border-green-700'
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'CSV Export Failed',
        description: err.message
      });
    }
  };

  // Export to PDF
  const handlePDF = () => {
    try {
      const doc = new jsPDF({
        orientation: visibleColumns.length > 6 ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add title
      if (title) {
        doc.setFontSize(16);
        doc.setTextColor(33, 37, 41);
        doc.text(title, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
      }

      // Add date
      doc.setFontSize(10);
      doc.setTextColor(108, 117, 125);
      doc.text(`Generated: ${formatDateUtil(new Date())}`, doc.internal.pageSize.getWidth() / 2, title ? 22 : 15, { align: 'center' });

      // Prepare table data
      const headers = visibleColumns.map(col => col.label);
      const tableData = data.map(row => 
        visibleColumns.map(col => String(row[col.key] ?? ''))
      );

      // Add table
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: title ? 28 : 20,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { top: 10, right: 10, bottom: 10, left: 10 }
      });

      // Add page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`${fileName}.pdf`);
      toast({
        title: '✓ PDF Downloaded!',
        description: `${fileName}.pdf saved successfully`,
        className: 'bg-green-600 text-white border-green-700'
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'PDF Export Failed',
        description: err.message
      });
    }
  };

  // Print
  const handlePrint = () => {
    if (!printRef?.current) {
      // Fallback: Print using browser
      window.print();
      return;
    }

    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        variant: 'destructive',
        title: 'Print Failed',
        description: 'Please allow popups for printing'
      });
      return;
    }

    const printContent = printRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title || fileName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #3b82f6; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8fafc; }
            h1, h2 { text-align: center; color: #1f2937; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            tfoot tr { font-weight: bold; background-color: #e5e7eb; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              button, .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    toast({
      title: '✓ Print Dialog Opened',
      description: 'Select your printer to continue',
      className: 'bg-blue-600 text-white border-blue-700'
    });
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        {/* Copy Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              disabled={data.length === 0}
              className="h-8 w-8 border-border bg-background hover:bg-muted"
            >
              <Copy className="h-4 w-4 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-popover text-popover-foreground">
            <p>Copy to Clipboard</p>
          </TooltipContent>
        </Tooltip>

        {/* Excel Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleExcel}
              disabled={data.length === 0}
              className="h-8 w-8 border-green-500/50 bg-green-500/10 hover:bg-green-500/20 dark:border-green-500/30 dark:bg-green-500/10 dark:hover:bg-green-500/20"
            >
              <Sheet className="h-4 w-4 text-green-600 dark:text-green-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-popover text-popover-foreground">
            <p>Export to Excel</p>
          </TooltipContent>
        </Tooltip>

        {/* CSV Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCSV}
              disabled={data.length === 0}
              className="h-8 w-8 border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20 dark:border-blue-500/30 dark:bg-blue-500/10 dark:hover:bg-blue-500/20"
            >
              <FileDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-popover text-popover-foreground">
            <p>Export to CSV</p>
          </TooltipContent>
        </Tooltip>

        {/* PDF Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handlePDF}
              disabled={data.length === 0}
              className="h-8 w-8 border-red-500/50 bg-red-500/10 hover:bg-red-500/20 dark:border-red-500/30 dark:bg-red-500/10 dark:hover:bg-red-500/20"
            >
              <FileText className="h-4 w-4 text-red-600 dark:text-red-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-popover text-popover-foreground">
            <p>Export to PDF</p>
          </TooltipContent>
        </Tooltip>

        {/* Print Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrint}
              disabled={data.length === 0}
              className="h-8 w-8 border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 dark:border-purple-500/30 dark:bg-purple-500/10 dark:hover:bg-purple-500/20"
            >
              <Printer className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-popover text-popover-foreground">
            <p>Print Report</p>
          </TooltipContent>
        </Tooltip>

        {/* Columns Dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 dark:border-amber-500/30 dark:bg-amber-500/10 dark:hover:bg-amber-500/20"
                >
                  <Columns className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-popover text-popover-foreground">
              <p>Toggle Columns</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Toggle column visibility
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.key}
                checked={columnVisibility[column.key]}
                onCheckedChange={() => toggleColumn(column.key)}
                className="cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {columnVisibility[column.key] && <Check className="h-3 w-3 text-green-600" />}
                  {column.label}
                </span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
};

export default DataTableExport;
