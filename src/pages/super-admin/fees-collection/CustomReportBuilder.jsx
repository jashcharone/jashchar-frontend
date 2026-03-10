/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CUSTOM REPORT BUILDER
 * Day 41 Implementation - Fee Collection Phase 4 (Analytics)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Drag-and-drop field selection
 * - Custom column configuration
 * - Filters builder
 * - Save report templates
 * - Live preview
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Columns,
  Filter,
  Save,
  Download,
  Eye,
  Plus,
  Trash2,
  GripVertical,
  ChevronRight,
  FileSpreadsheet,
  Settings2,
  Loader2,
  FolderOpen,
  Copy,
  Play,
  CheckCircle,
  X,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import { exportToCSV, exportToExcel, generatePDFReport } from '@/utils/feeExportEngine';

// Available fields for custom reports
const AVAILABLE_FIELDS = {
  student: {
    label: 'Student Information',
    fields: [
      { key: 'school_code', label: 'School Code', type: 'text' },
      { key: 'full_name', label: 'Student Name', type: 'text' },
      { key: 'father_name', label: 'Father Name', type: 'text' },
      { key: 'mother_name', label: 'Mother Name', type: 'text' },
      { key: 'father_phone', label: 'Father Phone', type: 'phone' },
      { key: 'mother_phone', label: 'Mother Phone', type: 'phone' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'admission_date', label: 'Admission Date', type: 'date' }
    ]
  },
  class: {
    label: 'Class Information',
    fields: [
      { key: 'class_name', label: 'Class', type: 'text' },
      { key: 'section_name', label: 'Section', type: 'text' }
    ]
  },
  fee: {
    label: 'Fee Details',
    fields: [
      { key: 'fee_type', label: 'Fee Type', type: 'text' },
      { key: 'total_amount', label: 'Total Amount', type: 'currency' },
      { key: 'paid_amount', label: 'Paid Amount', type: 'currency' },
      { key: 'balance', label: 'Balance', type: 'currency' },
      { key: 'discount', label: 'Discount', type: 'currency' },
      { key: 'due_date', label: 'Due Date', type: 'date' },
      { key: 'fee_status', label: 'Status', type: 'status' }
    ]
  },
  payment: {
    label: 'Payment Details',
    fields: [
      { key: 'receipt_no', label: 'Receipt No', type: 'text' },
      { key: 'payment_date', label: 'Payment Date', type: 'date' },
      { key: 'payment_mode', label: 'Payment Mode', type: 'text' },
      { key: 'transaction_id', label: 'Transaction ID', type: 'text' },
      { key: 'collected_by', label: 'Collected By', type: 'text' }
    ]
  }
};

// Filter operators
const FILTER_OPERATORS = {
  text: [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' }
  ],
  currency: [
    { value: 'equals', label: 'Equals' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'between', label: 'Between' }
  ],
  date: [
    { value: 'equals', label: 'Equals' },
    { value: 'after', label: 'After' },
    { value: 'before', label: 'Before' },
    { value: 'between', label: 'Between' }
  ],
  status: [
    { value: 'equals', label: 'Is' },
    { value: 'not_equals', label: 'Is not' }
  ]
};

export default function CustomReportBuilder() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;

  // State
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('fields');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [reportName, setReportName] = useState('');
  const [savedReports, setSavedReports] = useState([]);

  // Report Configuration
  const [selectedFields, setSelectedFields] = useState([]);
  const [filters, setFilters] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [groupBy, setGroupBy] = useState('');

  // Preview data
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  // Load saved reports
  useEffect(() => {
    if (branchId) {
      loadSavedReports();
    }
  }, [branchId]);

  const loadSavedReports = () => {
    const stored = localStorage.getItem(`customReports_${branchId}`);
    if (stored) {
      setSavedReports(JSON.parse(stored));
    }
  };

  const handleAddField = (field, category) => {
    const fieldId = `${category}_${field.key}`;
    if (!selectedFields.find(f => f.id === fieldId)) {
      setSelectedFields([...selectedFields, {
        id: fieldId,
        key: field.key,
        label: field.label,
        type: field.type,
        category,
        width: 'auto'
      }]);
    }
  };

  const handleRemoveField = (fieldId) => {
    setSelectedFields(selectedFields.filter(f => f.id !== fieldId));
  };

  const handleMoveField = (index, direction) => {
    const newFields = [...selectedFields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newFields.length) {
      [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
      setSelectedFields(newFields);
    }
  };

  const handleAddFilter = () => {
    setFilters([...filters, {
      id: `filter_${Date.now()}`,
      field: '',
      operator: 'equals',
      value: '',
      value2: ''
    }]);
  };

  const handleUpdateFilter = (filterId, field, value) => {
    setFilters(filters.map(f => 
      f.id === filterId ? { ...f, [field]: value } : f
    ));
  };

  const handleRemoveFilter = (filterId) => {
    setFilters(filters.filter(f => f.id !== filterId));
  };

  const getAllFields = () => {
    const allFields = [];
    Object.entries(AVAILABLE_FIELDS).forEach(([category, { fields }]) => {
      fields.forEach(field => {
        allFields.push({
          id: `${category}_${field.key}`,
          ...field,
          category
        });
      });
    });
    return allFields;
  };

  const generatePreview = async () => {
    if (selectedFields.length === 0) {
      toast.error('Please select at least one field');
      return;
    }

    setLoading(true);
    try {
      // Build query based on selected fields
      const needsStudentData = selectedFields.some(f => f.category === 'student' || f.category === 'class');
      const needsFeeData = selectedFields.some(f => f.category === 'fee');
      const needsPaymentData = selectedFields.some(f => f.category === 'payment');

      let query;
      let data = [];

      if (needsPaymentData) {
        // Query from transactions
        const { data: txnData, error } = await supabase
          .from('fee_transactions')
          .select(`
            id,
            receipt_no,
            amount,
            payment_date,
            payment_mode,
            transaction_id,
            collected_by,
            fee_detail:fee_detail_id(
              fee_type:fee_type_id(name),
              total_amount,
              paid_amount,
              balance,
              discount,
              due_date,
              status,
              student:student_id(
                school_code,
                full_name,
                father_name,
                mother_name,
                father_phone,
                mother_phone,
                email,
                address,
                admission_date,
                classes(name),
                sections(name)
              )
            )
          `)
          .eq('branch_id', branchId)
          .eq('session_id', currentSessionId)
          .limit(50);

        if (error) throw error;

        data = (txnData || []).map(t => ({
          receipt_no: t.receipt_no,
          payment_date: t.payment_date,
          payment_mode: t.payment_mode,
          transaction_id: t.transaction_id,
          collected_by: t.collected_by,
          fee_type: t.fee_detail?.fee_type?.name,
          total_amount: t.fee_detail?.total_amount,
          paid_amount: t.amount,
          balance: t.fee_detail?.balance,
          discount: t.fee_detail?.discount,
          due_date: t.fee_detail?.due_date,
          fee_status: t.fee_detail?.status,
          school_code: t.fee_detail?.student?.school_code,
          full_name: t.fee_detail?.student?.full_name,
          father_name: t.fee_detail?.student?.father_name,
          mother_name: t.fee_detail?.student?.mother_name,
          father_phone: t.fee_detail?.student?.father_phone,
          mother_phone: t.fee_detail?.student?.mother_phone,
          email: t.fee_detail?.student?.email,
          address: t.fee_detail?.student?.address,
          admission_date: t.fee_detail?.student?.admission_date,
          class_name: t.fee_detail?.student?.classes?.name,
          section_name: t.fee_detail?.student?.sections?.name
        }));
      } else if (needsFeeData) {
        // Query from fee_details
        const { data: feeData, error } = await supabase
          .from('fee_details')
          .select(`
            id,
            total_amount,
            paid_amount,
            balance,
            discount,
            due_date,
            status,
            fee_type:fee_type_id(name),
            student:student_id(
              school_code,
              full_name,
              father_name,
              mother_name,
              father_phone,
              mother_phone,
              email,
              address,
              admission_date,
              classes(name),
              sections(name)
            )
          `)
          .eq('branch_id', branchId)
          .eq('session_id', currentSessionId)
          .limit(50);

        if (error) throw error;

        data = (feeData || []).map(f => ({
          fee_type: f.fee_type?.name,
          total_amount: f.total_amount,
          paid_amount: f.paid_amount,
          balance: f.balance,
          discount: f.discount,
          due_date: f.due_date,
          fee_status: f.status,
          school_code: f.student?.school_code,
          full_name: f.student?.full_name,
          father_name: f.student?.father_name,
          mother_name: f.student?.mother_name,
          father_phone: f.student?.father_phone,
          mother_phone: f.student?.mother_phone,
          email: f.student?.email,
          address: f.student?.address,
          admission_date: f.student?.admission_date,
          class_name: f.student?.classes?.name,
          section_name: f.student?.sections?.name
        }));
      } else {
        // Query from student_profiles
        const { data: studentData, error } = await supabase
          .from('student_profiles')
          .select(`
            school_code,
            full_name,
            father_name,
            mother_name,
            father_phone,
            mother_phone,
            email,
            address,
            admission_date,
            classes(name),
            sections(name)
          `)
          .eq('branch_id', branchId)
          .eq('session_id', currentSessionId)
          .limit(50);

        if (error) throw error;

        data = (studentData || []).map(s => ({
          ...s,
          class_name: s.classes?.name,
          section_name: s.sections?.name
        }));
      }

      // Apply filters
      let filteredData = data;
      filters.forEach(filter => {
        if (filter.field && filter.value) {
          const fieldKey = filter.field.split('_').slice(1).join('_');
          filteredData = filteredData.filter(item => {
            const value = item[fieldKey];
            const filterValue = filter.value;

            switch (filter.operator) {
              case 'equals':
                return String(value).toLowerCase() === String(filterValue).toLowerCase();
              case 'contains':
                return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
              case 'starts_with':
                return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
              case 'greater_than':
                return Number(value) > Number(filterValue);
              case 'less_than':
                return Number(value) < Number(filterValue);
              case 'after':
                return new Date(value) > new Date(filterValue);
              case 'before':
                return new Date(value) < new Date(filterValue);
              default:
                return true;
            }
          });
        }
      });

      // Apply sorting
      if (sortBy) {
        const sortKey = sortBy.split('_').slice(1).join('_');
        filteredData.sort((a, b) => {
          const aVal = a[sortKey];
          const bVal = b[sortKey];
          if (sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
          }
          return aVal < bVal ? 1 : -1;
        });
      }

      setPreviewData(filteredData);
      setShowPreview(true);
      toast.success(`Preview generated with ${filteredData.length} records`);

    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = () => {
    if (!reportName.trim()) {
      toast.error('Please enter a report name');
      return;
    }

    const reportConfig = {
      id: `report_${Date.now()}`,
      name: reportName,
      fields: selectedFields,
      filters,
      sortBy,
      sortOrder,
      groupBy,
      createdAt: new Date().toISOString()
    };

    const updatedReports = [...savedReports, reportConfig];
    localStorage.setItem(`customReports_${branchId}`, JSON.stringify(updatedReports));
    setSavedReports(updatedReports);
    setShowSaveDialog(false);
    setReportName('');
    toast.success('Report saved successfully');
  };

  const handleLoadReport = (report) => {
    setSelectedFields(report.fields || []);
    setFilters(report.filters || []);
    setSortBy(report.sortBy || '');
    setSortOrder(report.sortOrder || 'asc');
    setGroupBy(report.groupBy || '');
    setShowLoadDialog(false);
    toast.success(`Report "${report.name}" loaded`);
  };

  const handleDeleteSavedReport = (reportId) => {
    const updatedReports = savedReports.filter(r => r.id !== reportId);
    localStorage.setItem(`customReports_${branchId}`, JSON.stringify(updatedReports));
    setSavedReports(updatedReports);
    toast.success('Report deleted');
  };

  const handleExport = (format) => {
    if (previewData.length === 0) {
      toast.error('Please generate preview first');
      return;
    }

    const headers = selectedFields.map(f => f.label);
    const rows = previewData.map(item => 
      selectedFields.map(f => formatCellValue(item[f.key], f.type))
    );

    if (format === 'csv') {
      exportToCSV({
        title: 'Custom Report',
        headers,
        rows,
        filename: `custom_report_${formatDate(new Date()).replace(/-/g, '')}.csv`
      });
    } else if (format === 'pdf') {
      generatePDFReport({
        title: 'Custom Report',
        schoolName: selectedBranch?.name,
        headers,
        rows: rows.map(row => {
          const obj = {};
          headers.forEach((h, i) => obj[h] = row[i]);
          return obj;
        })
      });
    }

    toast.success(`Report exported as ${format.toUpperCase()}`);
  };

  const formatCellValue = (value, type) => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'currency':
        return `₹${Number(value).toLocaleString('en-IN')}`;
      case 'date':
        return formatDate(value);
      case 'status':
        return value?.charAt(0).toUpperCase() + value?.slice(1);
      default:
        return String(value);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Custom Report Builder</h1>
          <p className="text-muted-foreground">
            Build custom reports by selecting fields and filters
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowLoadDialog(true)} className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Load
          </Button>
          <Button variant="outline" onClick={() => setShowSaveDialog(true)} className="gap-2">
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button onClick={generatePreview} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Generate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Field Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Columns className="h-4 w-4" />
              Available Fields
            </CardTitle>
            <CardDescription>Click to add fields to report</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {Object.entries(AVAILABLE_FIELDS).map(([category, { label, fields }]) => (
                <div key={category} className="border-b last:border-b-0">
                  <div className="px-4 py-2 bg-muted/50 font-medium text-sm">
                    {label}
                  </div>
                  <div className="p-2 space-y-1">
                    {fields.map(field => {
                      const isSelected = selectedFields.some(f => f.id === `${category}_${field.key}`);
                      return (
                        <button
                          key={field.key}
                          onClick={() => handleAddField(field, category)}
                          disabled={isSelected}
                          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors
                            ${isSelected 
                              ? 'bg-green-100 text-green-700 cursor-default' 
                              : 'hover:bg-muted cursor-pointer'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{field.label}</span>
                            {isSelected && <CheckCircle className="h-4 w-4" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Middle Panel - Configuration */}
        <Card className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-0">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="fields" className="gap-2">
                  <Columns className="h-4 w-4" />
                  Columns ({selectedFields.length})
                </TabsTrigger>
                <TabsTrigger value="filters" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters ({filters.length})
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-4">
              {/* Selected Fields Tab */}
              <TabsContent value="fields" className="m-0">
                <div className="space-y-2">
                  {selectedFields.length > 0 ? (
                    selectedFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex items-center gap-2 p-2 rounded border bg-white"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <span className="font-medium text-sm">{field.label}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {field.category}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMoveField(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMoveField(index, 'down')}
                          disabled={index === selectedFields.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => handleRemoveField(field.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Columns className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Click on fields from left panel to add</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Filters Tab */}
              <TabsContent value="filters" className="m-0">
                <div className="space-y-3">
                  {filters.map(filter => (
                    <div key={filter.id} className="flex items-center gap-2 p-2 rounded border">
                      <Select
                        value={filter.field}
                        onValueChange={(v) => handleUpdateFilter(filter.id, 'field', v)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Field" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAllFields().map(f => (
                            <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={filter.operator}
                        onValueChange={(v) => handleUpdateFilter(filter.id, 'operator', v)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FILTER_OPERATORS.text.map(op => (
                            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        value={filter.value}
                        onChange={(e) => handleUpdateFilter(filter.id, 'value', e.target.value)}
                        placeholder="Value"
                        className="flex-1"
                      />

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => handleRemoveFilter(filter.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button variant="outline" onClick={handleAddFilter} className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    Add Filter
                  </Button>
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="m-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sort By</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {selectedFields.map(f => (
                            <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Sort Order</Label>
                      <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">Ascending</SelectItem>
                          <SelectItem value="desc">Descending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Group By</Label>
                    <Select value={groupBy} onValueChange={setGroupBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="No grouping" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {selectedFields.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Preview Section */}
      {showPreview && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview ({previewData.length} records)
                </CardTitle>
                <CardDescription>First 50 records</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('csv')} className="gap-2">
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectedFields.map(field => (
                      <TableHead key={field.id}>{field.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 20).map((item, idx) => (
                    <TableRow key={idx}>
                      {selectedFields.map(field => (
                        <TableCell key={field.id}>
                          {formatCellValue(item[field.key], field.type)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {previewData.length > 20 && (
              <p className="text-sm text-muted-foreground text-center mt-3">
                Showing 20 of {previewData.length} records. Export to see all.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Report Template</DialogTitle>
            <DialogDescription>
              Save this configuration for future use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Report Name</Label>
              <Input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="e.g., Monthly Student Fee Report"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>This will save:</p>
              <ul className="list-disc ml-4 mt-2">
                <li>{selectedFields.length} selected fields</li>
                <li>{filters.length} filters</li>
                <li>Sort and group settings</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveReport}>Save Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load Saved Report</DialogTitle>
            <DialogDescription>
              Select a previously saved report template
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {savedReports.length > 0 ? (
              <div className="space-y-2">
                {savedReports.map(report => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 rounded border hover:bg-muted cursor-pointer"
                    onClick={() => handleLoadReport(report)}
                  >
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.fields?.length || 0} fields • Created {formatDate(report.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSavedReport(report.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                No saved reports yet
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
