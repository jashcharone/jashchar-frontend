/**
 * TemplateSidebar - Template Browser Component
 * Shows categorized list of report templates with search
 */

import React, { useState, useMemo } from 'react';
import {
  Search, ChevronDown, ChevronRight, FileText, Star, Clock,
  Check, Folder, FolderOpen
} from 'lucide-react';

const TemplateSidebar = ({
  templates = [],           // Array of template objects with category
  selectedTemplate,         // Currently selected template key
  onSelectTemplate,         // Callback when template is selected
  recentTemplates = [],     // Recently used template keys
  favoriteTemplates = [],   // Favorite template keys
  color = 'blue'            // Theme color
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set(['All']));

  // Group templates by category
  const categorizedTemplates = useMemo(() => {
    const categories = {};
    
    templates.forEach(template => {
      const category = template.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(template);
    });

    return categories;
  }, [templates]);

  // Filter templates by search
  const filteredTemplates = useMemo(() => {
    if (!searchTerm.trim()) return categorizedTemplates;

    const term = searchTerm.toLowerCase();
    const filtered = {};

    Object.entries(categorizedTemplates).forEach(([category, categoryTemplates]) => {
      const matchingTemplates = categoryTemplates.filter(t =>
        t.name?.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term) ||
        t.key?.toLowerCase().includes(term)
      );
      if (matchingTemplates.length > 0) {
        filtered[category] = matchingTemplates;
      }
    });

    return filtered;
  }, [categorizedTemplates, searchTerm]);

  // Toggle category expansion
  const toggleCategory = (category) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Color classes - with dark mode support
  const colorClasses = {
    blue: { selected: 'bg-blue-100 dark:bg-blue-900/50 border-blue-500 text-blue-700 dark:text-blue-300', hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/30' },
    green: { selected: 'bg-green-100 dark:bg-green-900/50 border-green-500 text-green-700 dark:text-green-300', hover: 'hover:bg-green-50 dark:hover:bg-green-900/30' },
    purple: { selected: 'bg-purple-100 dark:bg-purple-900/50 border-purple-500 text-purple-700 dark:text-purple-300', hover: 'hover:bg-purple-50 dark:hover:bg-purple-900/30' },
    orange: { selected: 'bg-orange-100 dark:bg-orange-900/50 border-orange-500 text-orange-700 dark:text-orange-300', hover: 'hover:bg-orange-50 dark:hover:bg-orange-900/30' },
    cyan: { selected: 'bg-cyan-100 dark:bg-cyan-900/50 border-cyan-500 text-cyan-700 dark:text-cyan-300', hover: 'hover:bg-cyan-50 dark:hover:bg-cyan-900/30' },
    amber: { selected: 'bg-amber-100 dark:bg-amber-900/50 border-amber-500 text-amber-700 dark:text-amber-300', hover: 'hover:bg-amber-50 dark:hover:bg-amber-900/30' },
    pink: { selected: 'bg-pink-100 dark:bg-pink-900/50 border-pink-500 text-pink-700 dark:text-pink-300', hover: 'hover:bg-pink-50 dark:hover:bg-pink-900/30' },
    teal: { selected: 'bg-teal-100 dark:bg-teal-900/50 border-teal-500 text-teal-700 dark:text-teal-300', hover: 'hover:bg-teal-50 dark:hover:bg-teal-900/30' },
    indigo: { selected: 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-500 text-indigo-700 dark:text-indigo-300', hover: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/30' },
  };
  
  const colors = colorClasses[color] || colorClasses.blue;

  const totalTemplates = templates.length;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Search Box */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${totalTemplates} templates...`}
            className="w-full pl-9 pr-4 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      </div>

      {/* Quick Access */}
      {(recentTemplates.length > 0 || favoriteTemplates.length > 0) && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 text-xs">
            {favoriteTemplates.length > 0 && (
              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" /> {favoriteTemplates.length} Favorites
              </span>
            )}
            {recentTemplates.length > 0 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" /> Recent
              </span>
            )}
          </div>
        </div>
      )}

      {/* Category List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {Object.entries(filteredTemplates).map(([category, categoryTemplates]) => (
          <div key={category} className="mb-2">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center gap-2 px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              {expandedCategories.has(category) ? (
                <>
                  <FolderOpen className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </>
              ) : (
                <>
                  <Folder className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </>
              )}
              <span className="flex-1 text-left truncate">{category}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{categoryTemplates.length}</span>
            </button>

            {/* Template List */}
            {expandedCategories.has(category) && (
              <div className="ml-6 space-y-1">
                {categoryTemplates.map((template) => {
                  const isSelected = selectedTemplate === template.key;
                  const isFavorite = favoriteTemplates.includes(template.key);
                  const isRecent = recentTemplates.includes(template.key);

                  return (
                    <button
                      key={template.key}
                      onClick={() => onSelectTemplate(template)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg border dark:border-gray-700 transition
                        ${isSelected 
                          ? `${colors.selected} border-l-4` 
                          : `border-transparent ${colors.hover} text-gray-700 dark:text-gray-300`
                        }
                      `}
                    >
                      <FileText className={`w-4 h-4 ${isSelected ? '' : 'text-gray-400 dark:text-gray-500'}`} />
                      <span className="flex-1 text-left truncate">{template.name}</span>
                      
                      <div className="flex items-center gap-1">
                        {isFavorite && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                        {isRecent && !isFavorite && <Clock className="w-3 h-3 text-gray-400" />}
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* No Results */}
        {Object.keys(filteredTemplates).length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Search className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-sm">No templates found</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try a different search term</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 text-center">
        {totalTemplates} templates available
      </div>
    </div>
  );
};

export default TemplateSidebar;
