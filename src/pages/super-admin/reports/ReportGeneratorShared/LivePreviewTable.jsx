/**
 * LivePreviewTable - Colorful Data Table with Grouping & Totals
 * The main table component that displays report data with:
 * - Colorful headers and totals
 * - Row grouping with subtotals
 * - Grand total row
 * - Responsive design
 * - Column formatting
 */

import React, { useMemo } from 'react';
import { formatDate, formatDateTime, formatTime } from '@/utils/dateUtils';
import { TABLE_COLORS } from './constants';
import { ChevronDown, ChevronRight, Users, Hash, IndianRupee } from 'lucide-react';

const LivePreviewTable = ({
  data = [],                   // Array of data rows
  columns = [],                // Column definitions
  groupBy = [],                // Group by fields
  color = 'blue',              // Theme color
  showRowNumbers = true,       // Show row numbers
  showSubtotals = true,        // Show subtotals for groups
  showGrandTotal = true,       // Show grand total row
  loading = false,             // Loading state
  emptyMessage = 'No data available',
  maxHeight = 'auto',          // Max height for scrolling
  stickyHeader = true,         // Sticky header
  onRowClick,                  // Row click handler
  highlightField,              // Field to highlight certain values
  highlightValues = []         // Values to highlight
}) => {
  const colorScheme = TABLE_COLORS[color] || TABLE_COLORS.blue;

  // Process data with grouping
  const { processedData, totals } = useMemo(() => {
    if (!data.length) return { processedData: [], totals: null };

    // Calculate totals
    const calculateRowTotals = (rows) => {
      const totals = { _count: rows.length, _isTotal: true };
      columns.forEach(col => {
        if (col.type === 'number' || col.type === 'currency') {
          totals[col.key] = rows.reduce((sum, row) => {
            return sum + (Number(getNestedValue(row, col.key)) || 0);
          }, 0);
        }
      });
      return totals;
    };

    if (!groupBy.length) {
      return {
        processedData: data,
        totals: showGrandTotal ? calculateRowTotals(data) : null
      };
    }

    // Group data
    const groups = {};
    data.forEach(row => {
      const groupKey = groupBy.map(field => getNestedValue(row, field) || 'N/A').join(' → ');
      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          label: groupKey,
          rows: [],
          isExpanded: true
        };
      }
      groups[groupKey].rows.push(row);
    });

    // Build result with subtotals
    const result = [];
    Object.values(groups).forEach(group => {
      // Add group header
      result.push({
        _isGroupHeader: true,
        _groupKey: group.key,
        _groupLabel: group.label,
        _groupCount: group.rows.length
      });

      // Add rows
      result.push(...group.rows);

      // Add subtotal
      if (showSubtotals) {
        const subtotal = calculateRowTotals(group.rows);
        subtotal._isSubtotal = true;
        subtotal._groupKey = group.key;
        result.push(subtotal);
      }
    });

    return {
      processedData: result,
      totals: showGrandTotal ? calculateRowTotals(data) : null
    };
  }, [data, columns, groupBy, showSubtotals, showGrandTotal]);

  // Format cell value based on type
  const formatCellValue = (value, column, row) => {
    // Custom render function should run FIRST (for computed columns)
    if (column.render) {
      return column.render(value, row);
    }

    if (value === null || value === undefined) return '-';

    switch (column.type) {
      case 'computed':
        // Computed columns without render function just show the value
        return value !== null && value !== undefined ? String(value) : '-';
      case 'date':
        return formatDate(value);
      case 'datetime':
        return formatDateTime(value);
      case 'time':
        return formatTime(value);
      case 'currency':
        return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
      case 'number':
        return Number(value).toLocaleString('en-IN');
      case 'percentage':
        return `${Number(value).toFixed(1)}%`;
      case 'boolean':
        return value ? '✓' : '✗';
      case 'phone':
        return value ? formatPhone(value) : '-';
      case 'badge':
        return (
          <span className={`px-2 py-0.5 text-xs rounded-full ${getBadgeColor(value)}`}>
            {value}
          </span>
        );
      case 'image':
        return value ? (
          <img src={value} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <Users className="w-4 h-4 text-gray-400" />
          </div>
        );
      default:
        return String(value);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-500 dark:text-gray-400">Loading report data...</span>
      </div>
    );
  }

  // Empty state
  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
        <Users className="w-12 h-12 mb-3" />
        <p className="text-lg font-medium">{emptyMessage}</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  let rowCounter = 0;

  return (
    <div 
      className="overflow-auto" 
      style={{ maxHeight: maxHeight !== 'auto' ? maxHeight : undefined }}
    >
      <table className="w-full border-collapse text-sm">
        {/* Header */}
        <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
          <tr className={`${colorScheme.headerBg} ${colorScheme.headerText}`}>
            {showRowNumbers && (
              <th className="px-3 py-3 text-left font-semibold text-xs uppercase tracking-wider w-12">
                #
              </th>
            )}
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                className={`px-3 py-3 text-left font-semibold text-xs uppercase tracking-wider ${
                  col.type === 'number' || col.type === 'currency' ? 'text-right' : ''
                }`}
                style={{ minWidth: col.width || 'auto' }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {processedData.map((row, rowIdx) => {
            // Group Header Row
            if (row._isGroupHeader) {
              return (
                <tr 
                  key={`group-${rowIdx}-${row._groupKey}`} 
                  className="bg-gray-100 dark:bg-gray-700 border-t-2 border-gray-300 dark:border-gray-600"
                >
                  <td 
                    colSpan={columns.length + (showRowNumbers ? 1 : 0)}
                    className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown className="w-4 h-4" />
                      <span>{row._groupLabel}</span>
                      <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                        {row._groupCount} records
                      </span>
                    </div>
                  </td>
                </tr>
              );
            }

            // Subtotal Row
            if (row._isSubtotal) {
              return (
                <tr 
                  key={`subtotal-${rowIdx}-${row._groupKey}`}
                  className={`${colorScheme.subTotalBg} border-t`}
                >
                  {showRowNumbers && (
                    <td className={`px-3 py-2 ${colorScheme.subTotalText}`}></td>
                  )}
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key || colIdx}
                      className={`px-3 py-2 ${colorScheme.subTotalText} ${
                        col.type === 'number' || col.type === 'currency' ? 'text-right' : ''
                      }`}
                    >
                      {colIdx === 0 ? (
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          Subtotal ({row._count})
                        </span>
                      ) : col.type === 'number' || col.type === 'currency' ? (
                        formatCellValue(row[col.key], col, row)
                      ) : (
                        ''
                      )}
                    </td>
                  ))}
                </tr>
              );
            }

            // Regular Data Row
            rowCounter++;
            const isHighlighted = highlightField && 
              highlightValues.includes(getNestedValue(row, highlightField));

            return (
              <tr
                key={row.id || rowIdx}
                className={`
                  border-b ${colorScheme.border} dark:border-gray-700 transition
                  ${rowIdx % 2 === 0 ? 'bg-white dark:bg-gray-800' : colorScheme.stripeBg + ' dark:bg-gray-800/50'}
                  ${colorScheme.rowHover} dark:hover:bg-gray-700
                  ${isHighlighted ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''}
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
                onClick={() => onRowClick?.(row)}
              >
                {showRowNumbers && (
                  <td className="px-3 py-2 text-gray-400 dark:text-gray-500 text-xs">{rowCounter}</td>
                )}
                {columns.map((col, colIdx) => {
                  const value = getNestedValue(row, col.key);
                  return (
                    <td
                      key={col.key || colIdx}
                      className={`px-3 py-2 ${
                        col.type === 'number' || col.type === 'currency' ? 'text-right font-mono' : ''
                      }`}
                    >
                      {formatCellValue(value, col, row)}
                    </td>
                  );
                })}
              </tr>
            );
          })}

          {/* Grand Total Row */}
          {totals && (
            <tr className={`${colorScheme.grandTotalBg} ${colorScheme.grandTotalText}`}>
              {showRowNumbers && (
                <td className="px-3 py-3"></td>
              )}
              {columns.map((col, colIdx) => (
                <td
                  key={col.key || colIdx}
                  className={`px-3 py-3 ${
                    col.type === 'number' || col.type === 'currency' ? 'text-right font-mono' : ''
                  }`}
                >
                  {colIdx === 0 ? (
                    <span className="flex items-center gap-2">
                      <IndianRupee className="w-4 h-4" />
                      GRAND TOTAL ({totals._count})
                    </span>
                  ) : col.type === 'number' || col.type === 'currency' ? (
                    formatCellValue(totals[col.key], col, totals)
                  ) : (
                    ''
                  )}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>

      {/* Footer with count */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <span>Showing {data.length} records</span>
        {groupBy.length > 0 && (
          <span>Grouped by: {groupBy.join(' → ')}</span>
        )}
      </div>
    </div>
  );
};

// Helper: Get nested value from object using dot notation
const getNestedValue = (obj, path) => {
  if (!path) return undefined;
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Helper: Format phone number
const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return phone;
};

// Helper: Get badge color based on value
const getBadgeColor = (value) => {
  const colorMap = {
    'active': 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    'inactive': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    'left': 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    'tc_issued': 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
    'pending': 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
    'completed': 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    'male': 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    'female': 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300',
    'yes': 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    'no': 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    'present': 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    'absent': 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    'late': 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
    'leave': 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
  };
  return colorMap[String(value).toLowerCase()] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
};

export default LivePreviewTable;
