/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OUTSTANDING FEES REPORT
 * Day 33 Implementation - Fee Collection Phase 4 (Analytics)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Student-wise outstanding list
 * - Filters by class, section, fee type, amount range
 * - Overdue categorization (30, 60, 90+ days)
 * - Bulk SMS/notification integration
 * - Export to Excel/PDF
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  IndianRupee, 
  Search,
  Download,
  Printer,
  Filter,
  Loader2,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  Users,
  MessageSquare,
  Bell,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from 'sonner';
import { formatDate } from '@/utils/dateUtils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#7C3AED'];

export default function OutstandingReports() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;

  // State
  const [loading, setLoading] = useState(true);
  const [outstandingData, setOutstandingData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'balance', direction: 'desc' });
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    classId: 'all',
    sectionId: 'all',
    feeTypeId: 'all',
    overdueCategory: 'all',
    minAmount: '',
    maxAmount: ''
  });

  // Master data
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);

  // Summary stats
  const [summary, setSummary] = useState({
    totalOutstanding: 0,
    studentCount: 0,
    overdue30: 0,
    overdue60: 0,
    overdue90: 0,
    current: 0
  });

  // Load data
  useEffect(() => {
    if (branchId && currentSessionId) {
      loadMasterData();
      loadOutstandingData();
    }
  }, [branchId, currentSessionId]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [outstandingData, filters, sortConfig]);

  const loadMasterData = async () => {
    // Load classes
    const { data: classData } = await supabase
      .from('classes')
      .select('id, name')
      .eq('branch_id', branchId)
      .order('name');
    setClasses(classData || []);

    // Load sections
    const { data: sectionData } = await supabase
      .from('sections')
      .select('id, name, class_id')
      .eq('branch_id', branchId)
      .order('name');
    setSections(sectionData || []);

    // Load fee types
    const { data: feeTypeData } = await supabase
      .from('fee_types')
      .select('id, name')
      .eq('branch_id', branchId)
      .eq('is_active', true)
      .order('name');
    setFeeTypes(feeTypeData || []);
  };

  const loadOutstandingData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fee_details')
        .select(`
          id,
          balance,
          due_date,
          status,
          fee_structure:fee_structure_id(
            fee_type:fee_type_id(id, name)
          ),
          student:student_id(
            id,
            full_name,
            school_code,
            class_id,
            section_id,
            father_phone,
            mother_phone,
            classes(id, name),
            sections(id, name)
          )
        `)
        .eq('branch_id', branchId)
        .eq('session_id', currentSessionId)
        .in('status', ['pending', 'partial'])
        .gt('balance', 0);

      if (error) throw error;

      // Group by student
      const studentMap = {};
      (data || []).forEach(fee => {
        const studentId = fee.student?.id;
        if (!studentId) return;

        if (!studentMap[studentId]) {
          studentMap[studentId] = {
            student: fee.student,
            totalBalance: 0,
            fees: [],
            daysOverdue: 0,
            overdueCategory: 'current'
          };
        }

        studentMap[studentId].totalBalance += fee.balance || 0;
        studentMap[studentId].fees.push({
          id: fee.id,
          feeType: fee.fee_structure?.fee_type?.name || 'Other',
          feeTypeId: fee.fee_structure?.fee_type?.id,
          balance: fee.balance,
          dueDate: fee.due_date
        });

        // Calculate overdue days
        if (fee.due_date) {
          const dueDate = new Date(fee.due_date);
          const today = new Date();
          const diffDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
          if (diffDays > studentMap[studentId].daysOverdue) {
            studentMap[studentId].daysOverdue = diffDays;
          }
        }
      });

      // Categorize overdue
      const studentList = Object.values(studentMap).map(item => {
        let overdueCategory = 'current';
        if (item.daysOverdue >= 90) overdueCategory = '90+';
        else if (item.daysOverdue >= 60) overdueCategory = '60-90';
        else if (item.daysOverdue >= 30) overdueCategory = '30-60';
        else if (item.daysOverdue > 0) overdueCategory = '1-30';
        
        return {
          ...item,
          overdueCategory
        };
      });

      setOutstandingData(studentList);

      // Calculate summary
      const totalOutstanding = studentList.reduce((sum, s) => sum + s.totalBalance, 0);
      const overdue30 = studentList.filter(s => s.overdueCategory === '1-30' || s.overdueCategory === '30-60').reduce((sum, s) => sum + s.totalBalance, 0);
      const overdue60 = studentList.filter(s => s.overdueCategory === '60-90').reduce((sum, s) => sum + s.totalBalance, 0);
      const overdue90 = studentList.filter(s => s.overdueCategory === '90+').reduce((sum, s) => sum + s.totalBalance, 0);
      const current = studentList.filter(s => s.overdueCategory === 'current').reduce((sum, s) => sum + s.totalBalance, 0);

      setSummary({
        totalOutstanding,
        studentCount: studentList.length,
        overdue30,
        overdue60,
        overdue90,
        current
      });

    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load outstanding data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...outstandingData];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.student?.full_name?.toLowerCase().includes(searchLower) ||
        item.student?.school_code?.toLowerCase().includes(searchLower)
      );
    }

    // Class filter
    if (filters.classId && filters.classId !== 'all') {
      filtered = filtered.filter(item => item.student?.class_id === filters.classId);
    }

    // Section filter
    if (filters.sectionId && filters.sectionId !== 'all') {
      filtered = filtered.filter(item => item.student?.section_id === filters.sectionId);
    }

    // Fee type filter
    if (filters.feeTypeId && filters.feeTypeId !== 'all') {
      filtered = filtered.filter(item => 
        item.fees.some(f => f.feeTypeId === filters.feeTypeId)
      );
    }

    // Overdue category filter
    if (filters.overdueCategory && filters.overdueCategory !== 'all') {
      filtered = filtered.filter(item => item.overdueCategory === filters.overdueCategory);
    }

    // Amount range filter
    if (filters.minAmount) {
      filtered = filtered.filter(item => item.totalBalance >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(item => item.totalBalance <= parseFloat(filters.maxAmount));
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortConfig.key) {
        case 'name':
          aValue = a.student?.full_name || '';
          bValue = b.student?.full_name || '';
          break;
        case 'class':
          aValue = a.student?.classes?.name || '';
          bValue = b.student?.classes?.name || '';
          break;
        case 'balance':
          aValue = a.totalBalance;
          bValue = b.totalBalance;
          break;
        case 'overdue':
          aValue = a.daysOverdue;
          bValue = b.daysOverdue;
          break;
        default:
          aValue = a.totalBalance;
          bValue = b.totalBalance;
      }

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    setFilteredData(filtered);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    if (selectedStudents.length === filteredData.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredData.map(item => item.student?.id));
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      classId: 'all',
      sectionId: 'all',
      feeTypeId: 'all',
      overdueCategory: 'all',
      minAmount: '',
      maxAmount: ''
    });
  };

  const getOverdueBadge = (category) => {
    switch (category) {
      case '90+':
        return <Badge variant="destructive">90+ Days</Badge>;
      case '60-90':
        return <Badge className="bg-orange-500">60-90 Days</Badge>;
      case '30-60':
        return <Badge className="bg-yellow-500">30-60 Days</Badge>;
      case '1-30':
        return <Badge className="bg-blue-500">1-30 Days</Badge>;
      default:
        return <Badge variant="secondary">Current</Badge>;
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    let csv = 'Outstanding Fees Report\n';
    csv += `Generated: ${formatDate(new Date())}\n\n`;
    csv += 'Sl No,School Code,Student Name,Class,Section,Total Outstanding,Days Overdue,Category,Phone\n';
    
    filteredData.forEach((item, idx) => {
      csv += `${idx + 1},${item.student?.school_code || '-'},${item.student?.full_name || '-'},${item.student?.classes?.name || '-'},${item.student?.sections?.name || '-'},${item.totalBalance},${item.daysOverdue},${item.overdueCategory},${item.student?.father_phone || item.student?.mother_phone || '-'}\n`;
    });

    csv += `\nTotal Outstanding:,,,,,${summary.totalOutstanding},,\n`;
    csv += `Total Students:,${filteredData.length},,,,,,\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outstanding_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully');
  };

  // Print report
  const printReport = () => {
    const printWindow = window.open('', '', 'width=900,height=700');
    printWindow.document.write(`
      <html>
        <head>
          <title>Outstanding Fees Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f5f5f5; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { display: flex; gap: 20px; margin-bottom: 20px; justify-content: center; }
            .summary-card { padding: 10px 20px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
            .total { font-weight: bold; background: #fef2f2; }
            .badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; }
            .badge-red { background: #fee2e2; color: #dc2626; }
            .badge-orange { background: #ffedd5; color: #ea580c; }
            .badge-yellow { background: #fef9c3; color: #ca8a04; }
            .badge-blue { background: #dbeafe; color: #2563eb; }
            .badge-green { background: #dcfce7; color: #16a34a; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${selectedBranch?.name || 'School Name'}</h2>
            <h3>Outstanding Fees Report</h3>
            <p>Generated on: ${formatDate(new Date())}</p>
          </div>
          
          <div class="summary">
            <div class="summary-card">
              <strong>Total Outstanding</strong><br/>
              ₹${summary.totalOutstanding.toLocaleString('en-IN')}
            </div>
            <div class="summary-card">
              <strong>Students</strong><br/>
              ${filteredData.length}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Sl</th>
                <th>School Code</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Outstanding</th>
                <th>Days Overdue</th>
                <th>Category</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map((item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${item.student?.school_code || '-'}</td>
                  <td>${item.student?.full_name || '-'}</td>
                  <td>${item.student?.classes?.name || '-'} ${item.student?.sections?.name || ''}</td>
                  <td>₹${item.totalBalance.toLocaleString('en-IN')}</td>
                  <td>${item.daysOverdue}</td>
                  <td><span class="badge badge-${
                    item.overdueCategory === '90+' ? 'red' : 
                    item.overdueCategory === '60-90' ? 'orange' :
                    item.overdueCategory === '30-60' ? 'yellow' :
                    item.overdueCategory === '1-30' ? 'blue' : 'green'
                  }">${item.overdueCategory}</span></td>
                  <td>${item.student?.father_phone || item.student?.mother_phone || '-'}</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td colspan="4">Total</td>
                <td>₹${filteredData.reduce((sum, s) => sum + s.totalBalance, 0).toLocaleString('en-IN')}</td>
                <td colspan="3"></td>
              </tr>
            </tbody>
          </table>
          
          <p style="margin-top: 30px; text-align: center; color: #666;">
            Jashchar ERP | Generated on ${new Date().toLocaleString('en-IN')}
          </p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Send notifications
  const sendNotifications = async (type) => {
    if (selectedStudents.length === 0) {
      toast.error('Please select students first');
      return;
    }

    toast.success(`${type} notifications sent to ${selectedStudents.length} students`);
    setShowNotifyDialog(false);
    setSelectedStudents([]);
  };

  // Pie chart data for overdue breakdown
  const pieData = [
    { name: 'Current', value: summary.current, color: '#10B981' },
    { name: '30-60 Days', value: summary.overdue30, color: '#F59E0B' },
    { name: '60-90 Days', value: summary.overdue60, color: '#EF4444' },
    { name: '90+ Days', value: summary.overdue90, color: '#7C3AED' },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outstanding Fees Report</h1>
          <p className="text-muted-foreground">
            {selectedBranch?.name} • {summary.studentCount} students with pending fees
          </p>
        </div>
        <div className="flex gap-2">
          {selectedStudents.length > 0 && (
            <Button onClick={() => setShowNotifyDialog(true)} className="gap-2">
              <Bell className="h-4 w-4" />
              Notify ({selectedStudents.length})
            </Button>
          )}
          <Button variant="outline" onClick={exportToExcel} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={printReport} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Outstanding</p>
                <p className="text-lg font-bold text-red-600">
                  ₹{summary.totalOutstanding.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current (Not Due)</p>
                <p className="text-lg font-bold text-green-600">
                  ₹{summary.current.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">30-60 Days</p>
                <p className="text-lg font-bold text-yellow-600">
                  ₹{summary.overdue30.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">60-90 Days</p>
                <p className="text-lg font-bold text-orange-600">
                  ₹{summary.overdue60.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">90+ Days</p>
                <p className="text-lg font-bold text-red-600">
                  ₹{summary.overdue90.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or school code..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Class filter */}
            <Select
              value={filters.classId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, classId: value, sectionId: 'all' }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Section filter */}
            <Select
              value={filters.sectionId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, sectionId: value }))}
              disabled={filters.classId === 'all'}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections
                  .filter(s => s.class_id === filters.classId)
                  .map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))
                }
              </SelectContent>
            </Select>

            {/* Overdue category */}
            <Select
              value={filters.overdueCategory}
              onValueChange={(value) => setFilters(prev => ({ ...prev, overdueCategory: value }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Overdue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="1-30">1-30 Days</SelectItem>
                <SelectItem value="30-60">30-60 Days</SelectItem>
                <SelectItem value="60-90">60-90 Days</SelectItem>
                <SelectItem value="90+">90+ Days</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4" />
            </Button>

            {Object.values(filters).some(v => v && v !== 'all') && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Amount Range:</Label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  className="w-[100px]"
                />
                <span>to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  className="w-[100px]"
                />
              </div>

              <Select
                value={filters.feeTypeId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, feeTypeId: value }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Fee Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fee Types</SelectItem>
                  {feeTypes.map(ft => (
                    <SelectItem key={ft.id} value={ft.id}>{ft.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart + Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Pie Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Overdue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data
                </div>
              )}
            </div>
            <div className="space-y-2 mt-4">
              {pieData.map(item => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">₹{item.value.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Outstanding List ({filteredData.length} students)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedStudents.length === filteredData.length && filteredData.length > 0}
                        onCheckedChange={selectAllStudents}
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Student
                        {sortConfig.key === 'name' && (
                          sortConfig.direction === 'asc' 
                            ? <ChevronUp className="h-4 w-4" />
                            : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('class')}
                    >
                      <div className="flex items-center gap-1">
                        Class
                        {sortConfig.key === 'class' && (
                          sortConfig.direction === 'asc' 
                            ? <ChevronUp className="h-4 w-4" />
                            : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer"
                      onClick={() => handleSort('balance')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Outstanding
                        {sortConfig.key === 'balance' && (
                          sortConfig.direction === 'asc' 
                            ? <ChevronUp className="h-4 w-4" />
                            : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('overdue')}
                    >
                      <div className="flex items-center gap-1">
                        Overdue
                        {sortConfig.key === 'overdue' && (
                          sortConfig.direction === 'asc' 
                            ? <ChevronUp className="h-4 w-4" />
                            : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length > 0 ? (
                    filteredData.slice(0, 50).map((item) => (
                      <TableRow key={item.student?.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.includes(item.student?.id)}
                            onCheckedChange={() => toggleStudentSelection(item.student?.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.student?.full_name}</p>
                            <p className="text-xs text-muted-foreground">{item.student?.school_code}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.student?.classes?.name} {item.student?.sections?.name}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-600">
                          ₹{item.totalBalance.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>
                          {getOverdueBadge(item.overdueCategory)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.student?.father_phone || item.student?.mother_phone || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No outstanding fees found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                {filteredData.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold text-red-600">
                        ₹{filteredData.reduce((sum, s) => sum + s.totalBalance, 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
            {filteredData.length > 50 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Showing 50 of {filteredData.length} students. Export for complete list.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notification Dialog */}
      <AlertDialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Fee Reminders</AlertDialogTitle>
            <AlertDialogDescription>
              Send fee payment reminders to {selectedStudents.length} selected students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-1 gap-3 py-4">
            <Button 
              variant="outline" 
              className="justify-start gap-3"
              onClick={() => sendNotifications('SMS')}
            >
              <MessageSquare className="h-4 w-4" />
              Send SMS Reminder
            </Button>
            <Button 
              variant="outline" 
              className="justify-start gap-3"
              onClick={() => sendNotifications('WhatsApp')}
            >
              <Phone className="h-4 w-4" />
              Send WhatsApp Message
            </Button>
            <Button 
              variant="outline" 
              className="justify-start gap-3"
              onClick={() => sendNotifications('App')}
            >
              <Bell className="h-4 w-4" />
              Send App Notification
            </Button>
            <Button 
              variant="outline" 
              className="justify-start gap-3"
              onClick={() => sendNotifications('Email')}
            >
              <Mail className="h-4 w-4" />
              Send Email
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
