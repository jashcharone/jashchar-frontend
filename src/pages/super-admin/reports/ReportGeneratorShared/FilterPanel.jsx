/**
 * FilterPanel - Dynamic Filter Builder Component
 * Provides various filter types: select, multi-select, date, text, etc.
 */

import React, { useState, useMemo } from 'react';
import {
  Filter, X, ChevronDown, Calendar, Search,
  RotateCcw, Check, Plus
} from 'lucide-react';
import { formatDateForInput } from '@/utils/dateUtils';
import { FILTER_TYPES } from './constants';

const FilterPanel = ({
  filterConfig = {},        // Filter configuration object
  filters = {},             // Current filter values
  onFiltersChange,          // Callback when filters change
  classes = [],             // Available classes
  sections = [],            // Available sections
  sessions = [],            // Available sessions
  onApply,                  // Apply filters callback
  onReset,                  // Reset filters callback
  onClassChange,            // Callback when class changes (for fetching sections)
  onSessionChange,          // Callback when session changes (for refetching classes/sections)
  selectedSessionId,        // Currently selected session ID (for controlled component)
  color = 'blue',
  compact = false
}) => {
  // Always start expanded to show filters
  const [expanded, setExpanded] = useState(true);

  // Get sections for selected classes - sections passed should already be filtered by parent
  const availableSections = useMemo(() => {
    return sections;
  }, [sections]);

  // Update a single filter
  const updateFilter = (key, value) => {
    const newFilters = { ...filters };
    
    if (value === '' || value === null || (Array.isArray(value) && value.length === 0)) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }

    // Clear dependent filters and trigger class change callback
    if (key === 'class_id' || key === 'classes') {
      delete newFilters.section_id;
      delete newFilters.sections;
      
      // Call the onClassChange callback to fetch sections for new class
      if (onClassChange) {
        const classId = key === 'class_id' ? value : (value?.length > 0 ? value[0] : null);
        onClassChange(classId);
      }
    }

    onFiltersChange(newFilters);
  };

  // Color classes for buttons
  const buttonColors = {
    blue: 'bg-blue-500 hover:bg-blue-600 text-white',
    green: 'bg-green-500 hover:bg-green-600 text-white',
    purple: 'bg-purple-500 hover:bg-purple-600 text-white',
    orange: 'bg-orange-500 hover:bg-orange-600 text-white',
  };
  const btnColor = buttonColors[color] || buttonColors.blue;

  // Count active filters
  const activeFilterCount = Object.keys(filters).filter(k => {
    const val = filters[k];
    return val !== '' && val !== null && !(Array.isArray(val) && val.length === 0);
  }).length;

  return (
    <div className={compact ? "space-y-2" : "p-4"}>
      {/* Header with toggle - hide in compact mode */}
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${btnColor}`}>
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition ${expanded ? 'rotate-180' : ''}`} />
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <RotateCcw className="w-3 h-3" />
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Compact mode header - just Clear All */}
      {compact && activeFilterCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
        </div>
      )}

      {/* Filter Fields */}
      {expanded && (
        <div className={compact ? "grid grid-cols-1 gap-2" : "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3"}>
          {/* Session Filter */}
          {(filterConfig.session !== false) && sessions && sessions.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Session</label>
              <select
                value={selectedSessionId || filters.session_id || ''}
                onChange={(e) => {
                  const newSessionId = e.target.value;
                  updateFilter('session_id', newSessionId);
                  // Call session change callback to refetch classes/sections
                  if (onSessionChange) {
                    onSessionChange(newSessionId);
                  }
                }}
                className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Current Session</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.session_name || session.name} {session.is_active ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Class Filter */}
          {(filterConfig.class !== false) && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Class</label>
              {filterConfig.multiClass ? (
                <MultiSelect
                  value={filters.classes || []}
                  onChange={(val) => updateFilter('classes', val)}
                  options={classes.map(c => ({ value: c.id, label: c.name }))}
                  placeholder="All Classes"
                />
              ) : (
                <select
                  value={filters.class_id || ''}
                  onChange={(e) => updateFilter('class_id', e.target.value)}
                  className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Classes</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Section Filter */}
          {(filterConfig.section !== false) && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Section</label>
              {filterConfig.multiSection ? (
                <MultiSelect
                  value={filters.sections || []}
                  onChange={(val) => updateFilter('sections', val)}
                  options={availableSections.map(s => ({ value: s.id, label: s.name }))}
                  placeholder="All Sections"
                />
              ) : (
                <select
                  value={filters.section_id || ''}
                  onChange={(e) => updateFilter('section_id', e.target.value)}
                  className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                  disabled={!filters.class_id && !filterConfig.independentSection}
                >
                  <option value="">All Sections</option>
                  {availableSections.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Status Filter */}
          {filterConfig.status && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                {(filterConfig.statusOptions || [
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'left', label: 'Left' }
                ]).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Gender Filter */}
          {filterConfig.gender && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Gender</label>
              <select
                value={filters.gender || ''}
                onChange={(e) => updateFilter('gender', e.target.value)}
                className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          {/* Date Range Filter */}
          {filterConfig.dateRange && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.fromDate || ''}
                  onChange={(e) => updateFilter('fromDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.toDate || ''}
                  onChange={(e) => updateFilter('toDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Search Filter */}
          {filterConfig.search !== false && (
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder={filterConfig.searchPlaceholder || "Name, Phone, Enroll ID..."}
                  className="w-full pl-9 pr-4 py-2 text-sm border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Custom Filters from filterConfig */}
          {Object.entries(filterConfig).map(([key, config]) => {
            if (typeof config !== 'object' || !config.type) return null;
            if (['session', 'class', 'section', 'status', 'gender', 'dateRange', 'search'].includes(key)) return null;

            return (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {config.label || key}
                </label>
                
                {config.type === 'select' && (
                  <select
                    value={filters[key] || ''}
                    onChange={(e) => updateFilter(key, e.target.value)}
                    className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{config.placeholder || `All ${config.label}`}</option>
                    {(config.options || []).map(opt => (
                      <option key={opt.value || opt} value={opt.value || opt}>
                        {opt.label || opt}
                      </option>
                    ))}
                  </select>
                )}

                {config.type === 'number' && (
                  <input
                    type="number"
                    value={filters[key] || ''}
                    onChange={(e) => updateFilter(key, e.target.value)}
                    placeholder={config.placeholder}
                    min={config.min}
                    max={config.max}
                    className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                  />
                )}

                {config.type === 'text' && (
                  <input
                    type="text"
                    value={filters[key] || ''}
                    onChange={(e) => updateFilter(key, e.target.value)}
                    placeholder={config.placeholder}
                    className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Buttons */}
      {expanded && onApply && (
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
          >
            Reset
          </button>
          <button
            onClick={onApply}
            className={`px-4 py-2 text-sm rounded-lg ${btnColor}`}
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  );
};

// Multi-Select Component
const MultiSelect = ({ value = [], onChange, options = [], placeholder = 'Select...' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (optValue) => {
    const newValue = value.includes(optValue)
      ? value.filter(v => v !== optValue)
      : [...value, optValue];
    onChange(newValue);
  };

  const selectedLabels = options
    .filter(opt => value.includes(opt.value))
    .map(opt => opt.label)
    .join(', ');

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg text-left flex items-center justify-between bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
      >
        <span className={`truncate ${!selectedLabels ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
          {selectedLabels || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleOption(opt.value)}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 flex items-center gap-2"
              >
                <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                  value.includes(opt.value) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-500'
                }`}>
                  {value.includes(opt.value) && <Check className="w-3 h-3 text-white" />}
                </div>
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FilterPanel;
