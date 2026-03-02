/**
 * ColumnSelector - Drag & Drop Column Selection
 * Allows users to select, reorder, and configure columns for the report
 */

import React, { useState, useCallback } from 'react';
import {
  Columns, GripVertical, Eye, EyeOff, Check, X,
  ChevronDown, ChevronUp, Settings, ArrowUp, ArrowDown
} from 'lucide-react';

const ColumnSelector = ({
  availableColumns = [],      // All possible columns
  selectedColumns = [],       // Currently selected column keys
  onColumnsChange,           // Callback when selection changes
  onColumnReorder,           // Callback when columns are reordered
  color = 'blue'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Filter columns by search
  const filteredColumns = searchTerm
    ? availableColumns.filter(col =>
        col.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.key?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableColumns;

  // Toggle column selection
  const toggleColumn = useCallback((columnKey) => {
    const newSelected = selectedColumns.includes(columnKey)
      ? selectedColumns.filter(k => k !== columnKey)
      : [...selectedColumns, columnKey];
    onColumnsChange(newSelected);
  }, [selectedColumns, onColumnsChange]);

  // Select all visible columns
  const selectAll = useCallback(() => {
    const allKeys = filteredColumns.map(col => col.key);
    onColumnsChange([...new Set([...selectedColumns, ...allKeys])]);
  }, [filteredColumns, selectedColumns, onColumnsChange]);

  // Clear all selections
  const clearAll = useCallback(() => {
    onColumnsChange([]);
  }, [onColumnsChange]);

  // Move column up in order
  const moveColumnUp = useCallback((index) => {
    if (index === 0) return;
    const newOrder = [...selectedColumns];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onColumnsChange(newOrder);
  }, [selectedColumns, onColumnsChange]);

  // Move column down in order
  const moveColumnDown = useCallback((index) => {
    if (index === selectedColumns.length - 1) return;
    const newOrder = [...selectedColumns];
    [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    onColumnsChange(newOrder);
  }, [selectedColumns, onColumnsChange]);

  // Drag handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === index) return;

    const newOrder = [...selectedColumns];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    onColumnsChange(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Get selected columns with full info
  const selectedColumnsList = selectedColumns
    .map(key => availableColumns.find(col => col.key === key))
    .filter(Boolean);

  // Color classes
  const colorClasses = {
    blue: { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', light: 'bg-blue-100 text-blue-700' },
    green: { bg: 'bg-green-500', hover: 'hover:bg-green-600', light: 'bg-green-100 text-green-700' },
    purple: { bg: 'bg-purple-500', hover: 'hover:bg-purple-600', light: 'bg-purple-100 text-purple-700' },
  };
  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 transition"
      >
        <Columns className="w-4 h-4 text-gray-500" />
        <span className="hidden sm:inline">Columns</span>
        <span className={`px-1.5 py-0.5 text-xs rounded ${colors.light}`}>
          {selectedColumns.length}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700 z-40">
            {/* Header */}
            <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-xl">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Select Columns</h3>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <button
                    onClick={clearAll}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Search */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search columns..."
                className="w-full px-3 py-1.5 text-sm border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
              />
            </div>

            <div className="flex">
              {/* Available Columns */}
              <div className="w-1/2 border-r dark:border-gray-700 max-h-64 overflow-y-auto">
                <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  Available ({filteredColumns.length})
                </div>
                {filteredColumns.map(column => {
                  const isSelected = selectedColumns.includes(column.key);
                  return (
                    <button
                      key={column.key}
                      onClick={() => toggleColumn(column.key)}
                      className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="truncate flex-1">{column.label}</span>
                      <span className="text-xs text-gray-400">{column.type}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Columns (Reorderable) */}
              <div className="w-1/2 max-h-64 overflow-y-auto">
                <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  Selected ({selectedColumns.length}) - Drag to reorder
                </div>
                {selectedColumnsList.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-sm">
                    No columns selected
                  </div>
                ) : (
                  selectedColumnsList.map((column, index) => (
                    <div
                      key={column.key}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-1 px-2 py-1.5 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-move dark:text-gray-200 ${
                        draggedIndex === index ? 'bg-blue-50 dark:bg-blue-900/30 opacity-50' : ''
                      }`}
                    >
                      <GripVertical className="w-3 h-3 text-gray-300 dark:text-gray-500" />
                      <span className="text-xs text-gray-400 w-4">{index + 1}</span>
                      <span className="text-sm truncate flex-1">{column.label}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveColumnUp(index)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          disabled={index === 0}
                        >
                          <ArrowUp className={`w-3 h-3 ${index === 0 ? 'text-gray-200 dark:text-gray-600' : 'text-gray-400'}`} />
                        </button>
                        <button
                          onClick={() => moveColumnDown(index)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          disabled={index === selectedColumns.length - 1}
                        >
                          <ArrowDown className={`w-3 h-3 ${index === selectedColumns.length - 1 ? 'text-gray-200 dark:text-gray-600' : 'text-gray-400'}`} />
                        </button>
                        <button
                          onClick={() => toggleColumn(column.key)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-gray-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className={`px-4 py-1.5 text-sm text-white rounded-lg ${colors.bg} ${colors.hover}`}
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ColumnSelector;
