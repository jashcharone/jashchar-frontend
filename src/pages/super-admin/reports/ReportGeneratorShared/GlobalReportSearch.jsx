/**
 * GlobalReportSearch - Search across all 420+ report templates
 * Day 8 - 8 Day Master Plan
 * Features: Real-time search, category filtering, quick navigation
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  Star, 
  Clock, 
  Users, 
  DollarSign, 
  Calendar, 
  FileText, 
  Briefcase, 
  BookOpen, 
  Bus, 
  Home, 
  Edit3, 
  CheckSquare, 
  Monitor,
  CreditCard,
  ArrowRight,
  Wand2,
  TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { REPORT_MODULES } from './constants';

// Import all templates from all modules
import { STUDENT_TEMPLATES } from '../student-information/templates';
import { FEES_TEMPLATES } from '../fees/templates';
import { ATTENDANCE_TEMPLATES } from '../attendance/templates';
import { HR_TEMPLATES } from '../hr/templates';
import { EXAMINATION_TEMPLATES } from '../examinations/templates';
import { ONLINE_EXAM_TEMPLATES } from '../online-exam/templates';
import { LIBRARY_TEMPLATES } from '../library/templates';
import { TRANSPORT_TEMPLATES } from '../transport/templates';
import { HOSTEL_TEMPLATES } from '../hostel/templates';
import { HOMEWORK_TEMPLATES } from '../homework/templates';
import { HOMEWORK_EVAL_TEMPLATES } from '../homework-evaluation/templates';

// Module icon map
const MODULE_ICONS = {
  'student-information': Users,
  'fees': CreditCard,
  'finance': DollarSign,
  'attendance': Calendar,
  'examinations': FileText,
  'human-resource': Briefcase,
  'hr': Briefcase,
  'library': BookOpen,
  'transport': Bus,
  'hostel': Home,
  'homework': Edit3,
  'homework-evaluation': CheckSquare,
  'online-exam': Monitor,
  'custom': Wand2
};

// Module routes
const MODULE_ROUTES = {
  'student-information': '/super-admin/reports/student-information',
  'fees': '/super-admin/reports/fees',
  'finance': '/super-admin/reports/finance',
  'attendance': '/super-admin/reports/attendance',
  'examinations': '/super-admin/reports/examinations',
  'human-resource': '/super-admin/reports/hr',
  'hr': '/super-admin/reports/hr',
  'library': '/super-admin/reports/library',
  'transport': '/super-admin/reports/transport',
  'hostel': '/super-admin/reports/hostel',
  'homework': '/super-admin/reports/homework',
  'homework-evaluation': '/super-admin/reports/homework-evaluation',
  'online-exam': '/super-admin/reports/online-exam',
  'custom': '/super-admin/reports/custom-builder'
};

// Combine all templates
const getAllTemplates = () => {
  const addModule = (templates, moduleName) => 
    (templates || []).map(t => ({ ...t, module: moduleName }));
  
  return [
    ...addModule(STUDENT_TEMPLATES, 'student-information'),
    ...addModule(FEES_TEMPLATES, 'fees'),
    ...addModule(ATTENDANCE_TEMPLATES, 'attendance'),
    ...addModule(HR_TEMPLATES, 'hr'),
    ...addModule(EXAMINATION_TEMPLATES, 'examinations'),
    ...addModule(ONLINE_EXAM_TEMPLATES, 'online-exam'),
    ...addModule(LIBRARY_TEMPLATES, 'library'),
    ...addModule(TRANSPORT_TEMPLATES, 'transport'),
    ...addModule(HOSTEL_TEMPLATES, 'hostel'),
    ...addModule(HOMEWORK_TEMPLATES, 'homework'),
    ...addModule(HOMEWORK_EVAL_TEMPLATES, 'homework-evaluation'),
  ];
};

const GlobalReportSearch = ({ 
  isOpen = false, 
  onClose, 
  onSelectTemplate,
  showAsModal = true 
}) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [recentSearches, setRecentSearches] = useState([]);
  const [favoriteTemplates, setFavoriteTemplates] = useState([]);
  
  // Get all templates
  const allTemplates = useMemo(() => getAllTemplates(), []);
  
  // Filter templates based on search
  const filteredTemplates = useMemo(() => {
    let results = allTemplates;
    
    // Filter by module
    if (selectedModule !== 'all') {
      results = results.filter(t => t.module === selectedModule);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      results = results.filter(t => 
        t.name?.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term) ||
        t.key?.toLowerCase().includes(term) ||
        t.category?.toLowerCase().includes(term)
      );
    }
    
    return results.slice(0, 20); // Limit results
  }, [allTemplates, searchTerm, selectedModule]);

  // Popular templates (shown when no search)
  const popularTemplates = useMemo(() => {
    return allTemplates.filter(t => t.popular).slice(0, 10);
  }, [allTemplates]);

  // Handle template selection
  const handleSelectTemplate = useCallback((template) => {
    // Add to recent searches
    setRecentSearches(prev => {
      const filtered = prev.filter(t => t.key !== template.key);
      return [template, ...filtered].slice(0, 5);
    });
    
    if (onSelectTemplate) {
      onSelectTemplate(template);
    } else {
      // Navigate to the module
      const route = MODULE_ROUTES[template.module];
      if (route) {
        navigate(`${route}?template=${template.key}`);
      }
    }
    
    if (onClose) onClose();
  }, [navigate, onClose, onSelectTemplate]);

  // Toggle favorite
  const toggleFavorite = useCallback((template, e) => {
    e.stopPropagation();
    setFavoriteTemplates(prev => {
      const exists = prev.find(t => t.key === template.key);
      if (exists) {
        return prev.filter(t => t.key !== template.key);
      }
      return [...prev, template];
    });
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const getModuleColor = (module) => {
    const colors = {
      'student-information': 'blue',
      'fees': 'green',
      'finance': 'green',
      'attendance': 'purple',
      'examinations': 'orange',
      'hr': 'cyan',
      'human-resource': 'cyan',
      'library': 'amber',
      'transport': 'indigo',
      'hostel': 'pink',
      'homework': 'teal',
      'homework-evaluation': 'emerald',
      'online-exam': 'rose'
    };
    return colors[module] || 'gray';
  };

  if (!isOpen && showAsModal) return null;

  const content = (
    <div className={`${showAsModal ? 'fixed inset-0 z-50 flex items-start justify-center pt-20' : ''}`}>
      {/* Backdrop */}
      {showAsModal && (
        <div 
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
      )}
      
      {/* Search Panel */}
      <div className={`${showAsModal ? 'relative w-full max-w-2xl mx-4' : 'w-full'} bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden`}>
        {/* Search Header */}
        <div className="p-4 border-b dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search 420+ report templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-10 py-3 text-lg bg-gray-50 dark:bg-gray-900 border-0 rounded-xl focus:ring-2 focus:ring-purple-500 dark:text-gray-100"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
          
          {/* Module Quick Filters */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => setSelectedModule('all')}
              className={`px-3 py-1 text-xs rounded-full transition ${
                selectedModule === 'all'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All Modules
            </button>
            {Object.entries(REPORT_MODULES).slice(0, 8).map(([key, mod]) => (
              <button
                key={key}
                onClick={() => setSelectedModule(key)}
                className={`px-3 py-1 text-xs rounded-full transition ${
                  selectedModule === key
                    ? `bg-${mod.color}-500 text-white`
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {mod.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {/* Recent Searches */}
          {!searchTerm && recentSearches.length > 0 && (
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Recent Searches
              </h3>
              <div className="space-y-1">
                {recentSearches.map(template => {
                  const Icon = MODULE_ICONS[template.module] || FileText;
                  return (
                    <button
                      key={template.key}
                      onClick={() => handleSelectTemplate(template)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-left"
                    >
                      <Icon className={`h-4 w-4 text-${getModuleColor(template.module)}-500`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{template.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{REPORT_MODULES[template.module]?.name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Popular Templates (when no search) */}
          {!searchTerm && popularTemplates.length > 0 && (
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                Popular Templates
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {popularTemplates.map(template => {
                  const Icon = MODULE_ICONS[template.module] || FileText;
                  const color = getModuleColor(template.module);
                  return (
                    <button
                      key={template.key}
                      onClick={() => handleSelectTemplate(template)}
                      className={`flex items-center gap-2 p-3 bg-${color}-50 dark:bg-${color}-900/20 hover:bg-${color}-100 dark:hover:bg-${color}-900/30 rounded-lg text-left transition`}
                    >
                      <Icon className={`h-4 w-4 text-${color}-500`} />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{template.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchTerm && (
            <div className="p-4">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                {filteredTemplates.length} Results
              </h3>
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No templates found for "{searchTerm}"</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try different keywords</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredTemplates.map(template => {
                    const Icon = MODULE_ICONS[template.module] || FileText;
                    const isFavorite = favoriteTemplates.some(t => t.key === template.key);
                    const color = getModuleColor(template.module);
                    
                    return (
                      <button
                        key={template.key}
                        onClick={() => handleSelectTemplate(template)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-left group"
                      >
                        <div className={`p-2 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg`}>
                          <Icon className={`h-4 w-4 text-${color}-500`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{template.name}</p>
                            {template.popular && (
                              <Badge className="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 text-xs">Popular</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{template.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs bg-${color}-50 dark:bg-${color}-900/30 border-${color}-200 dark:border-${color}-700 text-${color}-700 dark:text-${color}-300`}>
                            {REPORT_MODULES[template.module]?.name || template.module}
                          </Badge>
                          <button
                            onClick={(e) => toggleFavorite(template, e)}
                            className="p-1 opacity-0 group-hover:opacity-100 transition"
                          >
                            <Star className={`h-4 w-4 ${isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                          </button>
                          <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Custom Builder CTA */}
          {!searchTerm && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
              <button
                onClick={() => {
                  navigate('/super-admin/reports/custom-builder');
                  if (onClose) onClose();
                }}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg">
                    <Wand2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800 dark:text-gray-200">Custom Report Builder</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Build your own report with any columns</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Total: {allTemplates.length} templates across {Object.keys(REPORT_MODULES).length} modules</span>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">ESC</kbd>
              <span>to close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return showAsModal ? content : <div className="relative">{content}</div>;
};

export default GlobalReportSearch;
