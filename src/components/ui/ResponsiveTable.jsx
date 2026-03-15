// ═══════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - Responsive Table Component
// Automatically switches between table and card view based on screen size
// Supports: 320px Mobile S to 4K Ultra-wide (2560px+)
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useResponsive, useTableDisplayMode } from '@/hooks/useResponsive';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Responsive Table - Switches between table and card view based on screen size
 * 
 * @param {Object} props
 * @param {Array} props.data - Data array to display
 * @param {Array} props.columns - Column definitions [{ key, label, render, className, priority?, cardHidden? }]
 * @param {string} props.className - Additional classes
 * @param {Function} props.onRowClick - Row click handler (receives row data)
 * @param {string} props.emptyMessage - Message when no data
 * @param {boolean} props.striped - Striped rows (default: true)
 * @param {boolean} props.hoverable - Hover effect (default: true)
 * @param {boolean} props.compact - Compact mode (default: false)
 * @param {string} props.cardKeyField - Field to use as card title in mobile view
 * @param {string} props.sortField - Current sort field
 * @param {string} props.sortDirection - 'asc' | 'desc'
 * @param {Function} props.onSort - Sort handler (field) => void
 */
export function ResponsiveTable({
  data = [],
  columns = [],
  className,
  onRowClick,
  emptyMessage = 'No data available',
  striped = true,
  hoverable = true,
  compact = false,
  cardKeyField,
  sortField,
  sortDirection = 'asc',
  onSort,
}) {
  const { showCards, showCompactTable, mode } = useTableDisplayMode();
  const { isMobile, isTablet, is4K, breakpoint } = useResponsive();

  // Filter columns based on priority for compact table view
  const visibleColumns = useMemo(() => {
    if (showCompactTable) {
      // Show only high priority columns in compact view
      return columns.filter(col => col.priority !== 'low');
    }
    return columns;
  }, [columns, showCompactTable]);

  // Card view columns (exclude cardHidden columns)
  const cardColumns = useMemo(() => {
    return columns.filter(col => !col.cardHidden);
  }, [columns]);

  if (data.length === 0) {
    return (
      <div className={cn(
        'text-center py-12 text-muted-foreground',
        'bg-card/50 rounded-lg border border-dashed border-border',
        className
      )}>
        <p className="text-sm sm:text-base">{emptyMessage}</p>
      </div>
    );
  }

  // Mobile Card View
  if (showCards) {
    return (
      <div className={cn('space-y-3', className)}>
        <AnimatePresence>
          {data.map((row, index) => (
            <motion.div
              key={row.id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.02 }}
              className={cn(
                'bg-card rounded-lg border border-border/50 p-4',
                'shadow-sm hover:shadow-md transition-all',
                onRowClick && 'cursor-pointer active:scale-[0.99]'
              )}
              onClick={() => onRowClick?.(row)}
            >
              {/* Card Header - use cardKeyField or first column */}
              {cardKeyField && row[cardKeyField] && (
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/30">
                  <span className="font-semibold text-foreground">
                    {row[cardKeyField]}
                  </span>
                  {onRowClick && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              )}
              
              {/* Card Content */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {cardColumns.map((col, colIndex) => {
                  if (col.key === cardKeyField) return null;
                  const value = col.render 
                    ? col.render(row[col.key], row) 
                    : row[col.key];
                  
                  return (
                    <div key={col.key || colIndex} className="min-w-0">
                      <span className="text-xs text-muted-foreground block truncate">
                        {col.label}
                      </span>
                      <span className="text-sm font-medium text-foreground block truncate">
                        {value ?? '-'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  // Table View (Compact or Full)
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className={cn(
        'w-full text-left',
        'responsive-table',
        compact && 'text-sm'
      )}>
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {visibleColumns.map((col, index) => (
              <th
                key={col.key || index}
                className={cn(
                  'font-semibold text-muted-foreground',
                  compact ? 'px-3 py-2' : 'px-4 py-3',
                  'text-xs sm:text-sm uppercase tracking-wider',
                  onSort && col.sortable !== false && 'cursor-pointer hover:text-foreground select-none',
                  col.className
                )}
                onClick={() => onSort && col.sortable !== false && onSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  <span className="truncate">{col.label}</span>
                  {onSort && col.sortable !== false && sortField === col.key && (
                    sortDirection === 'asc' 
                      ? <ChevronUp className="w-3 h-3" />
                      : <ChevronDown className="w-3 h-3" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              className={cn(
                'border-b border-border/50 transition-colors',
                striped && rowIndex % 2 === 1 && 'bg-muted/30',
                hoverable && 'hover:bg-muted/50',
                onRowClick && 'cursor-pointer'
              )}
              onClick={() => onRowClick?.(row)}
            >
              {visibleColumns.map((col, colIndex) => {
                const value = col.render 
                  ? col.render(row[col.key], row) 
                  : row[col.key];
                
                return (
                  <td
                    key={col.key || colIndex}
                    className={cn(
                      compact ? 'px-3 py-2' : 'px-4 py-3',
                      'text-sm text-foreground',
                      col.className
                    )}
                  >
                    {value ?? '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Table Container - Wrapper with responsive padding and shadow
 */
export function TableContainer({ children, title, action, className }) {
  return (
    <div className={cn(
      'bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden',
      className
    )}>
      {(title || action) && (
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-border/50">
          {title && (
            <h3 className="font-semibold text-foreground text-sm sm:text-base">
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-0 sm:p-2">
        {children}
      </div>
    </div>
  );
}

/**
 * Table Header with Search and Filters
 */
export function TableHeader({ 
  title, 
  searchValue, 
  onSearchChange, 
  searchPlaceholder = 'Search...',
  filters, 
  actions,
  className 
}) {
  const { isMobile } = useResponsive();

  return (
    <div className={cn(
      'flex flex-wrap items-center gap-3 mb-4',
      isMobile ? 'flex-col items-stretch' : 'flex-row justify-between',
      className
    )}>
      {/* Left side: Title */}
      {title && (
        <h2 className="font-semibold text-lg sm:text-xl text-foreground">
          {title}
        </h2>
      )}
      
      {/* Right side: Search, Filters, Actions */}
      <div className={cn(
        'flex items-center gap-2 flex-wrap',
        isMobile && 'w-full'
      )}>
        {/* Search */}
        {onSearchChange && (
          <input
            type="text"
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              'px-3 py-2 text-sm rounded-lg border border-border bg-background',
              'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
              'placeholder:text-muted-foreground',
              isMobile ? 'w-full' : 'w-48 sm:w-64'
            )}
          />
        )}
        
        {/* Filters */}
        {filters}
        
        {/* Actions */}
        {actions}
      </div>
    </div>
  );
}

/**
 * Pagination Component
 */
export function TablePagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  className,
}) {
  const { isMobile } = useResponsive();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1) return null;

  return (
    <div className={cn(
      'flex items-center justify-between gap-4 mt-4 pt-4 border-t border-border/50',
      isMobile && 'flex-col',
      className
    )}>
      {/* Items info */}
      <span className="text-xs sm:text-sm text-muted-foreground">
        Showing {startItem}-{endItem} of {totalItems}
      </span>
      
      {/* Page buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'px-3 py-1.5 text-sm rounded-md transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'hover:bg-muted'
          )}
        >
          Previous
        </button>
        
        {/* Page numbers (simplified for mobile) */}
        {!isMobile && (
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    'w-8 h-8 text-sm rounded-md transition-colors',
                    currentPage === pageNum
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
        )}
        
        {isMobile && (
          <span className="px-3 py-1.5 text-sm">
            {currentPage} / {totalPages}
          </span>
        )}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'px-3 py-1.5 text-sm rounded-md transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'hover:bg-muted'
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default ResponsiveTable;
