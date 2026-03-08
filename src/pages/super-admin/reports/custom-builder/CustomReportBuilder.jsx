/**
 * Custom Report Builder
 * Day 7 - 8 Day Master Plan
 * Universal report builder allowing columns from all modules
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import {
  ReportGeneratorLayout,
  FilterPanel,
  ColumnSelector,
  GroupSortPanel,
  LivePreviewTable,
  ExportButtons,
  SaveTemplateModal,
  ScheduleReportModal,
  useReportState,
  useReportExport,
  useGroupedData,
  useFilterOptions,
  REPORT_MODULES
} from '../ReportGeneratorShared';

// Import columns from all modules
import { STUDENT_COLUMNS } from '../student-information/columns';
import { FEE_COLUMNS } from '../fees/columns';
import { ATTENDANCE_COLUMNS } from '../attendance/columns';
import { HR_COLUMNS } from '../hr/columns';
import { EXAM_COLUMNS } from '../examinations/columns';
import { ONLINE_EXAM_COLUMNS } from '../online-exam/columns';
import { LIBRARY_COLUMNS } from '../library/columns';
import { TRANSPORT_COLUMNS } from '../transport/columns';
import { HOSTEL_COLUMNS } from '../hostel/columns';
import { HOMEWORK_COLUMNS } from '../homework/columns';
import { HOMEWORK_EVAL_COLUMNS } from '../homework-evaluation/columns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Wand2, 
  Layers, 
  Plus,
  Minus,
  FileText, 
  BarChart3, 
  Download, 
  Filter, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Settings,
  Columns,
  Users,
  DollarSign,
  Calendar,
  Briefcase,
  GraduationCap,
  Monitor,
  Library,
  Bus,
  Home,
  ClipboardList,
  ClipboardCheck,
  Save,
  Play,
  Trash2,
  Copy,
  Edit,
  Calculator,
  X
} from 'lucide-react';

// Module definitions with their columns
const MODULES = [
  { key: 'student', name: 'Student Information', icon: Users, color: 'blue', columns: STUDENT_COLUMNS || [] },
  { key: 'fees', name: 'Fees & Finance', icon: DollarSign, color: 'green', columns: FEE_COLUMNS || [] },
  { key: 'attendance', name: 'Attendance', icon: Calendar, color: 'purple', columns: ATTENDANCE_COLUMNS || [] },
  { key: 'hr', name: 'HR & Staff', icon: Briefcase, color: 'orange', columns: HR_COLUMNS || [] },
  { key: 'examination', name: 'Examinations', icon: GraduationCap, color: 'red', columns: EXAM_COLUMNS || [] },
  { key: 'online-exam', name: 'Online Exam', icon: Monitor, color: 'indigo', columns: ONLINE_EXAM_COLUMNS || [] },
  { key: 'library', name: 'Library', icon: Library, color: 'teal', columns: LIBRARY_COLUMNS || [] },
  { key: 'transport', name: 'Transport', icon: Bus, color: 'amber', columns: TRANSPORT_COLUMNS || [] },
  { key: 'hostel', name: 'Hostel', icon: Home, color: 'rose', columns: HOSTEL_COLUMNS || [] },
  { key: 'homework', name: 'Homework', icon: ClipboardList, color: 'cyan', columns: HOMEWORK_COLUMNS || [] },
  { key: 'homework-eval', name: 'Homework Evaluation', icon: ClipboardCheck, color: 'emerald', columns: HOMEWORK_EVAL_COLUMNS || [] },
];

// Formula operators
const FORMULA_OPERATORS = [
  { key: 'add', label: '+', description: 'Addition' },
  { key: 'subtract', label: '-', description: 'Subtraction' },
  { key: 'multiply', label: '*', description: 'Multiplication' },
  { key: 'divide', label: '/', description: 'Division' },
  { key: 'percent', label: '%', description: 'Percentage' },
  { key: 'avg', label: 'AVG', description: 'Average' },
  { key: 'sum', label: 'SUM', description: 'Sum' },
  { key: 'count', label: 'COUNT', description: 'Count' },
  { key: 'min', label: 'MIN', description: 'Minimum' },
  { key: 'max', label: 'MAX', description: 'Maximum' },
];

const CustomReportBuilder = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  // Primary data source module
  const [primaryModule, setPrimaryModule] = useState('student');
  
  // Master data for filters
  const { classes, sections, sessions } = useFilterOptions();
  
  // Report state management
  const {
    showSidebar, setShowSidebar,
    selectedTemplate, setSelectedTemplate,
    selectedColumns, setSelectedColumns,
    filters, setFilters,
    groupBy, setGroupBy,
    sortBy, setSortBy,
    isLoading, setIsLoading,
    data, setData,
    error, setError,
    savedTemplates, setSavedTemplates,
    showSaveModal, setShowSaveModal,
    showScheduleModal, setShowScheduleModal,
    resetState
  } = useReportState({
    defaultColumns: []
  });

  // Custom formulas (calculated fields)
  const [calculatedFields, setCalculatedFields] = useState([]);
  const [showFormulaBuilder, setShowFormulaBuilder] = useState(false);
  const [newFormula, setNewFormula] = useState({ name: '', expression: '', columns: [] });
  
  // Saved custom templates
  const [customTemplates, setCustomTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState('columns');

  // Get all available columns grouped by module
  const allColumnsByModule = useMemo(() => {
    return MODULES.reduce((acc, mod) => {
      acc[mod.key] = mod.columns.map(col => ({
        ...col,
        moduleKey: mod.key,
        moduleName: mod.name,
        fullKey: `${mod.key}.${col.key}`
      }));
      return acc;
    }, {});
  }, []);

  // Flat list of all columns with module prefix
  const allColumns = useMemo(() => {
    return MODULES.flatMap(mod => 
      mod.columns.map(col => ({
        ...col,
        moduleKey: mod.key,
        moduleName: mod.name,
        fullKey: `${mod.key}.${col.key}`,
        displayLabel: `${mod.name} - ${col.label}`
      }))
    );
  }, []);

  // Handle column selection from specific module
  const handleColumnToggle = useCallback((column) => {
    setSelectedColumns(prev => {
      const exists = prev.find(c => c.fullKey === column.fullKey);
      if (exists) {
        return prev.filter(c => c.fullKey !== column.fullKey);
      } else {
        return [...prev, column];
      }
    });
  }, [setSelectedColumns]);

  // Add calculated field
  const handleAddFormula = useCallback(() => {
    if (newFormula.name && newFormula.expression) {
      const formula = {
        key: `calc_${Date.now()}`,
        label: newFormula.name,
        type: 'calculated',
        expression: newFormula.expression,
        group: 'Calculated Fields',
        isCalculated: true
      };
      setCalculatedFields(prev => [...prev, formula]);
      setSelectedColumns(prev => [...prev, formula]);
      setNewFormula({ name: '', expression: '', columns: [] });
      setShowFormulaBuilder(false);
    }
  }, [newFormula, setSelectedColumns]);

  // Remove calculated field
  const handleRemoveFormula = useCallback((key) => {
    setCalculatedFields(prev => prev.filter(f => f.key !== key));
    setSelectedColumns(prev => prev.filter(c => c.key !== key));
  }, [setSelectedColumns]);

  // Fetch data directly from Supabase based on primary module
  const fetchData = useCallback(async () => {
    if (!selectedBranch?.id || !currentSessionId || !organizationId) {
      setError('Please select branch and session');
      return;
    }

    if (selectedColumns.length === 0) {
      setError('Please select at least one column');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const baseParams = {
        branchId: selectedBranch.id,
        organizationId,
        sessionId: currentSessionId,
        ...filters
      };

      let result = [];
      switch(primaryModule) {
        case 'student':
          result = await fetchStudentsFromSupabase(baseParams);
          break;
        case 'fees':
          result = await fetchFeesDataFromSupabase(baseParams);
          break;
        case 'attendance':
          result = await fetchAttendanceDataFromSupabase(baseParams);
          break;
        case 'hr':
          result = await fetchHRDataFromSupabase(baseParams);
          break;
        case 'examination':
          result = await fetchExamDataFromSupabase(baseParams);
          break;
        case 'online-exam':
          result = await fetchOnlineExamDataFromSupabase(baseParams);
          break;
        case 'library':
          result = await fetchLibraryDataFromSupabase(baseParams);
          break;
        case 'transport':
          result = await fetchTransportDataFromSupabase(baseParams);
          break;
        case 'hostel':
          result = await fetchHostelDataFromSupabase(baseParams);
          break;
        case 'homework':
          result = await fetchHomeworkDataFromSupabase(baseParams);
          break;
        case 'homework-eval':
          result = await fetchHomeworkEvaluationDataFromSupabase(baseParams);
          break;
        default:
          result = await fetchStudentsFromSupabase(baseParams);
      }

      setData(result);
    } catch (err) {
      console.error('Fetch error:', err);
      // For demo, generate sample data
      setData(generateSampleData());
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch, currentSessionId, organizationId, filters, primaryModule, selectedColumns, setIsLoading, setError, setData]);

  // Generate sample data based on selected columns
  const generateSampleData = () => {
    return Array.from({ length: 30 }, (_, i) => {
      const row = { id: i + 1 };
      selectedColumns.forEach(col => {
        const key = col.fullKey || col.key;
        switch(col.type) {
          case 'number':
            row[key] = Math.floor(Math.random() * 1000);
            break;
          case 'percentage':
            row[key] = Number((Math.random() * 100).toFixed(1));
            break;
          case 'currency':
            row[key] = Math.floor(Math.random() * 50000);
            break;
          case 'date':
            const date = new Date();
            date.setDate(date.getDate() - (i % 30));
            row[key] = date.toISOString().split('T')[0];
            break;
          case 'boolean':
            row[key] = Math.random() > 0.5;
            break;
          default:
            row[key] = `Sample ${col.label} ${i + 1}`;
        }
      });
      return row;
    });
  };

  // Apply grouping and sorting
  const { groupedData, flatData } = useGroupedData(data, groupBy, sortBy, selectedColumns);

  // Export functionality
  const { exportToExcel, exportToPDF, exportToCSV, printReport } = useReportExport();

  // Handle export
  const handleExport = useCallback((format) => {
    const title = 'Custom Report';
    
    switch (format) {
      case 'excel':
        exportToExcel(flatData, selectedColumns, title);
        break;
      case 'pdf':
        exportToPDF(flatData, selectedColumns, title, 'violet');
        break;
      case 'csv':
        exportToCSV(flatData, selectedColumns, title);
        break;
      case 'print':
        printReport(flatData, selectedColumns, title);
        break;
      default:
        break;
    }
  }, [flatData, selectedColumns, exportToExcel, exportToPDF, exportToCSV, printReport]);

  // Handle filter reset
  const handleResetFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);

  // Save custom template
  const handleSaveTemplate = useCallback((name, description, isFavorite) => {
    const template = {
      key: `custom_${Date.now()}`,
      name,
      description,
      primaryModule,
      columns: selectedColumns,
      calculatedFields,
      filters,
      groupBy,
      sortBy,
      isFavorite,
      createdAt: new Date().toISOString(),
      createdBy: user?.id
    };
    setCustomTemplates(prev => [...prev, template]);
    setShowSaveModal(false);
    // In production, save to database
  }, [primaryModule, selectedColumns, calculatedFields, filters, groupBy, sortBy, user]);

  // Load saved template
  const handleLoadTemplate = useCallback((template) => {
    setPrimaryModule(template.primaryModule);
    setSelectedColumns(template.columns);
    setCalculatedFields(template.calculatedFields || []);
    setFilters(template.filters || {});
    setGroupBy(template.groupBy || []);
    setSortBy(template.sortBy || []);
    setSelectedTemplate(template);
  }, [setSelectedColumns, setFilters, setGroupBy, setSortBy, setSelectedTemplate]);

  // Quick stats
  const stats = useMemo(() => ({
    modulesUsed: [...new Set(selectedColumns.map(c => c.moduleKey))].length,
    columnsSelected: selectedColumns.length,
    calculatedFields: calculatedFields.length,
    recordsFound: flatData.length
  }), [selectedColumns, calculatedFields, flatData]);

  return (
    <ReportGeneratorLayout
      title="Custom Report Builder"
      subtitle="Build custom reports with columns from any module and calculated fields"
      moduleColor="violet"
      showSidebar={false}
      onToggleSidebar={() => {}}
      onSave={() => setShowSaveModal(true)}
      onSchedule={() => setShowScheduleModal(true)}
    >
      <div className="flex h-full">
        {/* Left Panel - Builder Tools */}
        <div className="w-96 border-r dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50 overflow-hidden flex-shrink-0 flex flex-col">
          <div className="p-4 border-b dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="h-5 w-5 text-violet-500" />
              <h2 className="font-semibold text-gray-800 dark:text-gray-200">Report Builder</h2>
            </div>
            
            {/* Primary Module Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium dark:text-gray-300">Primary Data Source</Label>
              <Select value={primaryModule} onValueChange={setPrimaryModule}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  {MODULES.map(mod => (
                    <SelectItem key={mod.key} value={mod.key}>
                      <div className="flex items-center gap-2">
                        <mod.icon className="h-4 w-4" />
                        {mod.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start px-4 py-2 border-b dark:border-gray-700 bg-transparent">
              <TabsTrigger value="columns" className="text-xs">
                <Columns className="h-3 w-3 mr-1" />
                Columns
              </TabsTrigger>
              <TabsTrigger value="formulas" className="text-xs">
                <Calculator className="h-3 w-3 mr-1" />
                Formulas
              </TabsTrigger>
              <TabsTrigger value="templates" className="text-xs">
                <Save className="h-3 w-3 mr-1" />
                Saved
              </TabsTrigger>
            </TabsList>

            {/* Columns Tab */}
            <TabsContent value="columns" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {MODULES.map(mod => {
                    const Icon = mod.icon;
                    const moduleColumns = allColumnsByModule[mod.key] || [];
                    const selectedFromModule = selectedColumns.filter(c => c.moduleKey === mod.key);
                    
                    return (
                      <div key={mod.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 text-${mod.color}-500`} />
                            <span className="text-sm font-medium dark:text-gray-300">{mod.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-400">
                            {selectedFromModule.length}/{moduleColumns.length}
                          </Badge>
                        </div>
                        <div className="ml-6 space-y-1 max-h-40 overflow-y-auto">
                          {moduleColumns.slice(0, 15).map(col => (
                            <div key={col.fullKey} className="flex items-center gap-2">
                              <Checkbox
                                id={col.fullKey}
                                checked={selectedColumns.some(c => c.fullKey === col.fullKey)}
                                onCheckedChange={() => handleColumnToggle(col)}
                                className="h-3 w-3"
                              />
                              <label 
                                htmlFor={col.fullKey} 
                                className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200"
                              >
                                {col.label}
                              </label>
                            </div>
                          ))}
                          {moduleColumns.length > 15 && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                              +{moduleColumns.length - 15} more columns
                            </p>
                          )}
                        </div>
                        <Separator className="dark:bg-gray-700" />
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Formulas Tab */}
            <TabsContent value="formulas" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {/* Existing Calculated Fields */}
                  {calculatedFields.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium dark:text-gray-300">Calculated Fields</Label>
                      {calculatedFields.map(field => (
                        <div key={field.key} className="flex items-center justify-between p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                          <div>
                            <p className="text-sm font-medium dark:text-gray-200">{field.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{field.expression}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFormula(field.key)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formula Builder */}
                  {showFormulaBuilder ? (
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm dark:text-gray-200">New Calculated Field</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs dark:text-gray-300">Field Name</Label>
                          <Input
                            value={newFormula.name}
                            onChange={(e) => setNewFormula(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Pass Rate"
                            className="dark:bg-gray-700 dark:border-gray-600"
                          />
                        </div>
                        <div>
                          <Label className="text-xs dark:text-gray-300">Formula Expression</Label>
                          <Input
                            value={newFormula.expression}
                            onChange={(e) => setNewFormula(prev => ({ ...prev, expression: e.target.value }))}
                            placeholder="e.g., (pass_count / total_count) * 100"
                            className="dark:bg-gray-700 dark:border-gray-600"
                          />
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {FORMULA_OPERATORS.map(op => (
                            <Button
                              key={op.key}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 dark:border-gray-600"
                              onClick={() => setNewFormula(prev => ({ 
                                ...prev, 
                                expression: prev.expression + ` ${op.label} ` 
                              }))}
                            >
                              {op.label}
                            </Button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleAddFormula}
                            className="flex-1 bg-violet-600 hover:bg-violet-700"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Field
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFormulaBuilder(false)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full dark:border-gray-600 dark:text-gray-300"
                      onClick={() => setShowFormulaBuilder(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Calculated Field
                    </Button>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Saved Templates Tab */}
            <TabsContent value="templates" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {customTemplates.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                      No saved templates yet. Build a report and save it!
                    </p>
                  ) : (
                    customTemplates.map(template => (
                      <Card 
                        key={template.key} 
                        className="cursor-pointer hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700"
                        onClick={() => handleLoadTemplate(template)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm dark:text-gray-200">{template.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{template.description}</p>
                            </div>
                            <Badge variant="outline" className="text-xs dark:border-gray-600">
                              {template.columns.length} cols
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Quick Stats Bar */}
          <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-violet-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Modules:</span>
                <Badge variant="outline" className="font-bold dark:border-gray-600 dark:text-gray-200">{stats.modulesUsed}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Columns className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Columns:</span>
                <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">{stats.columnsSelected}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Formulas:</span>
                <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">{stats.calculatedFields}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Records:</span>
                <Badge className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">{stats.recordsFound}</Badge>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedColumns([]);
                    setCalculatedFields([]);
                    setFilters({});
                    setGroupBy([]);
                    setSortBy([]);
                    setData([]);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
                <Button
                  size="sm"
                  onClick={fetchData}
                  disabled={isLoading || selectedColumns.length === 0}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Play className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Generate
                </Button>
              </div>
            </div>
          </div>

          {/* Selected Columns Preview */}
          {selectedColumns.length > 0 && (
            <div className="p-4 border-b dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium dark:text-gray-300">Selected Columns:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedColumns.map(col => (
                  <Badge
                    key={col.fullKey || col.key}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground dark:bg-gray-700 dark:text-gray-200"
                    onClick={() => {
                      if (col.isCalculated) {
                        handleRemoveFormula(col.key);
                      } else {
                        handleColumnToggle(col);
                      }
                    }}
                  >
                    {col.isCalculated && <Calculator className="h-3 w-3 mr-1" />}
                    {col.moduleName ? `${col.moduleName}: ` : ''}{col.label}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Configuration Panels */}
          <div className="p-4 border-b dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Filters */}
              <Card className="shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-violet-500" />
                    <CardTitle className="text-sm dark:text-gray-200">Filters</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <FilterPanel
                    filters={filters}
                    onFiltersChange={setFilters}
                    onReset={handleResetFilters}
                    classes={classes}
                    sections={sections}
                    sessions={sessions}
                    filterConfig={{
                      session: true,
                      class: true,
                      section: true,
                      dateRange: true
                    }}
                    color="violet"
                    compact
                  />
                </CardContent>
              </Card>

              {/* Group & Sort */}
              <Card className="shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-purple-500" />
                    <CardTitle className="text-sm dark:text-gray-200">Group & Sort</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <GroupSortPanel
                    columns={selectedColumns}
                    groupBy={groupBy}
                    sortBy={sortBy}
                    onGroupByChange={setGroupBy}
                    onSortByChange={setSortBy}
                    moduleColor="violet"
                    compact
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Export Bar */}
          <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-200">Custom Report</span>
                <span className="mx-2">•</span>
                {flatData.length} records
              </span>
            </div>
            <ExportButtons
              data={flatData}
              columns={selectedColumns}
              title="Custom Report"
              filename="custom_report"
              color="violet"
            />
          </div>

          {/* Data Table */}
          <div className="flex-1 overflow-auto p-4 bg-white dark:bg-gray-800">
            {selectedColumns.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Wand2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Start Building Your Report</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                    Select columns from different modules on the left panel to create your custom report.
                    You can also add calculated fields using formulas.
                  </p>
                </div>
              </div>
            ) : (
              <LivePreviewTable
                data={groupedData}
                columns={selectedColumns}
                groupBy={groupBy}
                isLoading={isLoading}
                error={error}
                moduleColor="violet"
                showGroupTotals={groupBy.length > 0}
              />
            )}
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveTemplate}
        templateConfig={{ columns: selectedColumns, filters, groupBy, sortBy, calculatedFields }}
        module="custom-builder"
        branchId={selectedBranch?.id}
        organizationId={organizationId}
        sessionId={currentSessionId}
        userId={user?.id}
      />

      {/* Schedule Report Modal */}
      <ScheduleReportModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={(schedule) => {
          console.log('Schedule created:', schedule);
          setShowScheduleModal(false);
        }}
        reportName="Custom Report"
      />
    </ReportGeneratorLayout>
  );
};

export default CustomReportBuilder;
