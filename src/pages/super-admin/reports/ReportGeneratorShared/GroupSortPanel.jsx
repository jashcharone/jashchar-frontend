/**
 * GroupSortPanel - Group By & Sort By Controls
 * Allows configuring how data is grouped and sorted
 */

import React, { useState } from 'react';
import {
  Layers, SortDesc, SortAsc, X, Plus, ChevronDown,
  ArrowDownAZ, ArrowUpZA, ArrowDown01, ArrowUp10
} from 'lucide-react';

const GroupSortPanel = ({
  columns = [],              // Available columns for grouping/sorting
  groupBy = [],              // Current group by fields
  sortBy = [],               // Current sort configuration [{field, direction}]
  onGroupByChange,           // Callback for group by change
  onSortByChange,            // Callback for sort change
  maxGroupBy = 3,            // Maximum grouping levels
  maxSortBy = 3,             // Maximum sort levels
  color = 'blue'
}) => {
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [showSortPanel, setShowSortPanel] = useState(false);

  // Get groupable columns (text fields mostly)
  const groupableColumns = columns.filter(col => 
    ['string', 'badge', 'select'].includes(col.type) || col.groupable
  );

  // Add group by field
  const addGroupBy = (field) => {
    if (!groupBy.includes(field) && groupBy.length < maxGroupBy) {
      onGroupByChange([...groupBy, field]);
    }
  };

  // Remove group by field
  const removeGroupBy = (field) => {
    onGroupByChange(groupBy.filter(f => f !== field));
  };

  // Add sort field
  const addSort = (field) => {
    if (sortBy.find(s => s.field === field)) return;
    if (sortBy.length >= maxSortBy) return;
    onSortByChange([...sortBy, { field, direction: 'asc' }]);
  };

  // Remove sort field
  const removeSort = (field) => {
    onSortByChange(sortBy.filter(s => s.field !== field));
  };

  // Toggle sort direction
  const toggleSortDirection = (field) => {
    onSortByChange(
      sortBy.map(s => 
        s.field === field 
          ? { ...s, direction: s.direction === 'asc' ? 'desc' : 'asc' }
          : s
      )
    );
  };

  // Get column label by key
  const getColumnLabel = (key) => {
    const col = columns.find(c => c.key === key);
    return col?.label || key;
  };

  // Color classes
  const colorClasses = {
    blue: { btn: 'bg-blue-500 hover:bg-blue-600', light: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
    green: { btn: 'bg-green-500 hover:bg-green-600', light: 'bg-green-100 text-green-700', border: 'border-green-200' },
    purple: { btn: 'bg-purple-500 hover:bg-purple-600', light: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
  };
  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="flex items-center gap-2">
      {/* Group By Button */}
      <div className="relative">
        <button
          onClick={() => { setShowGroupPanel(!showGroupPanel); setShowSortPanel(false); }}
          className="flex items-center gap-2 px-3 py-2 text-sm border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 transition"
        >
          <Layers className="w-4 h-4 text-gray-500" />
          <span className="hidden sm:inline">Group By</span>
          {groupBy.length > 0 && (
            <span className={`px-1.5 py-0.5 text-xs rounded ${colors.light}`}>
              {groupBy.length}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition ${showGroupPanel ? 'rotate-180' : ''}`} />
        </button>

        {/* Group By Panel */}
        {showGroupPanel && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowGroupPanel(false)} />
            <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700 z-40">
              <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Group By</h3>
                  {groupBy.length > 0 && (
                    <button
                      onClick={() => onGroupByChange([])}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Group data by up to {maxGroupBy} fields</p>
              </div>

              {/* Selected Groups */}
              {groupBy.length > 0 && (
                <div className="p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Active Grouping:</div>
                  <div className="flex flex-wrap gap-1">
                    {groupBy.map((field, index) => (
                      <span
                        key={field}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${colors.light}`}
                      >
                        <span className="font-medium">{index + 1}.</span>
                        {getColumnLabel(field)}
                        <button
                          onClick={() => removeGroupBy(field)}
                          className="hover:bg-gray-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Fields */}
              <div className="max-h-48 overflow-y-auto">
                {groupableColumns.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-sm">
                    No groupable columns available
                  </div>
                ) : (
                  groupableColumns.map(col => {
                    const isSelected = groupBy.includes(col.key);
                    const canAdd = !isSelected && groupBy.length < maxGroupBy;
                    
                    return (
                      <button
                        key={col.key}
                        onClick={() => canAdd && addGroupBy(col.key)}
                        disabled={!canAdd}
                        className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 dark:text-gray-200
                          ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : canAdd ? 'hover:bg-gray-50 dark:hover:bg-gray-700' : 'opacity-50'}
                        `}
                      >
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                            {groupBy.indexOf(col.key) + 1}
                          </div>
                        ) : (
                          <Plus className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="flex-1">{col.label}</span>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
                <button
                  onClick={() => setShowGroupPanel(false)}
                  className={`w-full py-1.5 text-sm text-white rounded-lg ${colors.btn}`}
                >
                  Done
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sort By Button */}
      <div className="relative">
        <button
          onClick={() => { setShowSortPanel(!showSortPanel); setShowGroupPanel(false); }}
          className="flex items-center gap-2 px-3 py-2 text-sm border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 transition"
        >
          <SortDesc className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="hidden sm:inline">Sort By</span>
          {sortBy.length > 0 && (
            <span className={`px-1.5 py-0.5 text-xs rounded ${colors.light}`}>
              {sortBy.length}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition ${showSortPanel ? 'rotate-180' : ''}`} />
        </button>

        {/* Sort By Panel */}
        {showSortPanel && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowSortPanel(false)} />
            <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700 z-40">
              <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Sort By</h3>
                  {sortBy.length > 0 && (
                    <button
                      onClick={() => onSortByChange([])}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sort data by up to {maxSortBy} fields</p>
              </div>

              {/* Selected Sorts */}
              {sortBy.length > 0 && (
                <div className="p-2 border-b dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Active Sorting:</div>
                  <div className="space-y-1">
                    {sortBy.map((sort, index) => (
                      <div
                        key={sort.field}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${colors.light}`}
                      >
                        <span className="text-xs font-medium">{index + 1}.</span>
                        <span className="flex-1 text-sm">{getColumnLabel(sort.field)}</span>
                        <button
                          onClick={() => toggleSortDirection(sort.field)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title={sort.direction === 'asc' ? 'Ascending' : 'Descending'}
                        >
                          {sort.direction === 'asc' ? (
                            <ArrowDownAZ className="w-4 h-4" />
                          ) : (
                            <ArrowUpZA className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => removeSort(sort.field)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Fields */}
              <div className="max-h-48 overflow-y-auto">
                {columns.map(col => {
                  const existingSort = sortBy.find(s => s.field === col.key);
                  const canAdd = !existingSort && sortBy.length < maxSortBy;
                  
                  return (
                    <button
                      key={col.key}
                      onClick={() => canAdd && addSort(col.key)}
                      disabled={!canAdd}
                      className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 dark:text-gray-200
                        ${existingSort ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : canAdd ? 'hover:bg-gray-50 dark:hover:bg-gray-700' : 'opacity-50'}
                      `}
                    >
                      {existingSort ? (
                        existingSort.direction === 'asc' ? (
                          <ArrowDownAZ className="w-4 h-4" />
                        ) : (
                          <ArrowUpZA className="w-4 h-4" />
                        )
                      ) : (
                        <Plus className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="flex-1">{col.label}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{col.type}</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
                <button
                  onClick={() => setShowSortPanel(false)}
                  className={`w-full py-1.5 text-sm text-white rounded-lg ${colors.btn}`}
                >
                  Done
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GroupSortPanel;
