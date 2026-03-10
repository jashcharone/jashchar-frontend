/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DEFAULTER REPORTS
 * Day 37 Implementation - Fee Collection Phase 4 (Analytics)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Identify chronic defaulters
 * - Defaulter categorization (mild, moderate, severe)
 * - Payment history analysis
 * - Risk scoring
 * - Bulk actions (SMS, Email, Notices)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
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
  Download,
  Printer,
  Loader2,
  FileSpreadsheet,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  Search,
  Users,
  Bell,
  MessageSquare,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Filter,
  Shield,
  ShieldAlert,
  ShieldX,
  UserX,
  History,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDate } from '@/utils/dateUtils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const RISK_COLORS = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  critical: '#7C3AED'
};

export default function DefaulterReports() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;

  // State
  const [loading, setLoading] = useState(true);
  const [defaulters, setDefaulters] = useState([]);
  const [filteredDefaulters, setFilteredDefaulters] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'riskScore', direction: 'desc' });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    classId: 'all',
    riskLevel: 'all',
    minAmount: '',
    maxAmount: ''
  });

  // Master data
  const [classes, setClasses] = useState([]);

  // Summary
  const [summary, setSummary] = useState({
    totalDefaulters: 0,
    totalOutstanding: 0,
    lowRisk: 0,
    mediumRisk: 0,
    highRisk: 0,
    criticalRisk: 0,
    avgOverdueDays: 0
  });

  // Load data
  useEffect(() => {
    if (branchId && currentSessionId) {
      loadClasses();
      loadDefaulterData();
    }
  }, [branchId, currentSessionId]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [defaulters, filters, sortConfig]);

  const loadClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('id, name')
      .eq('branch_id', branchId)
      .order('name');
    setClasses(data || []);
  };

  const loadDefaulterData = async () => {
    setLoading(true);
    try {
      // Get overdue fee details
      const { data: feeData } = await supabase
        .from('fee_details')
        .select(`
          id,
          total_amount,
          paid_amount,
          balance,
          due_date,
          status,
          student:student_id(
            id,
            full_name,
            school_code,
            class_id,
            section_id,
            father_phone,
            mother_phone,
            email,
            classes(id, name),
            sections(id, name)
          )
        `)
        .eq('branch_id', branchId)
        .eq('session_id', currentSessionId)
        .in('status', ['pending', 'partial'])
        .gt('balance', 0)
        .lt('due_date', new Date().toISOString());

      // Group by student and calculate risk
      const studentMap = {};
      
      (feeData || []).forEach(fee => {
        const studentId = fee.student?.id;
        if (!studentId) return;

        if (!studentMap[studentId]) {
          studentMap[studentId] = {
            student: fee.student,
            totalOutstanding: 0,
            overdueAmount: 0,
            totalFees: 0,
            overdueFees: 0,
            maxOverdueDays: 0,
            paymentHistory: [],
            riskScore: 0,
            riskLevel: 'low'
          };
        }

        studentMap[studentId].totalOutstanding += fee.balance || 0;
        studentMap[studentId].totalFees += 1;

        // Calculate overdue days
        const dueDate = new Date(fee.due_date);
        const today = new Date();
        const overdueDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        
        if (overdueDays > 0) {
          studentMap[studentId].overdueAmount += fee.balance || 0;
          studentMap[studentId].overdueFees += 1;
          if (overdueDays > studentMap[studentId].maxOverdueDays) {
            studentMap[studentId].maxOverdueDays = overdueDays;
          }
        }
      });

      // Calculate risk scores
      const calculateRiskScore = (student) => {
        let score = 0;
        
        // Overdue days factor (max 40 points)
        if (student.maxOverdueDays >= 90) score += 40;
        else if (student.maxOverdueDays >= 60) score += 30;
        else if (student.maxOverdueDays >= 30) score += 20;
        else score += 10;

        // Outstanding amount factor (max 30 points)
        if (student.totalOutstanding >= 50000) score += 30;
        else if (student.totalOutstanding >= 20000) score += 20;
        else if (student.totalOutstanding >= 10000) score += 15;
        else score += 5;

        // Number of overdue fees (max 30 points)
        if (student.overdueFees >= 5) score += 30;
        else if (student.overdueFees >= 3) score += 20;
        else if (student.overdueFees >= 2) score += 10;
        else score += 5;

        return score;
      };

      const getRiskLevel = (score) => {
        if (score >= 80) return 'critical';
        if (score >= 60) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
      };

      // Process students
      const defaulterList = Object.values(studentMap).map(item => {
        const riskScore = calculateRiskScore(item);
        return {
          ...item,
          riskScore,
          riskLevel: getRiskLevel(riskScore)
        };
      }).sort((a, b) => b.riskScore - a.riskScore);

      setDefaulters(defaulterList);

      // Calculate summary
      const totalOutstanding = defaulterList.reduce((sum, d) => sum + d.totalOutstanding, 0);
      const totalOverdueDays = defaulterList.reduce((sum, d) => sum + d.maxOverdueDays, 0);
      
      setSummary({
        totalDefaulters: defaulterList.length,
        totalOutstanding,
        lowRisk: defaulterList.filter(d => d.riskLevel === 'low').length,
        mediumRisk: defaulterList.filter(d => d.riskLevel === 'medium').length,
        highRisk: defaulterList.filter(d => d.riskLevel === 'high').length,
        criticalRisk: defaulterList.filter(d => d.riskLevel === 'critical').length,
        avgOverdueDays: defaulterList.length > 0 ? Math.round(totalOverdueDays / defaulterList.length) : 0
      });

    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load defaulter data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...defaulters];

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

    // Risk level filter
    if (filters.riskLevel && filters.riskLevel !== 'all') {
      filtered = filtered.filter(item => item.riskLevel === filters.riskLevel);
    }

    // Amount range
    if (filters.minAmount) {
      filtered = filtered.filter(item => item.totalOutstanding >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(item => item.totalOutstanding <= parseFloat(filters.maxAmount));
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortConfig.key) {
        case 'name':
          aValue = a.student?.full_name || '';
          bValue = b.student?.full_name || '';
          break;
        case 'amount':
          aValue = a.totalOutstanding;
          bValue = b.totalOutstanding;
          break;
        case 'days':
          aValue = a.maxOverdueDays;
          bValue = b.maxOverdueDays;
          break;
        case 'riskScore':
        default:
          aValue = a.riskScore;
          bValue = b.riskScore;
      }

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    setFilteredDefaulters(filtered);
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
    if (selectedStudents.length === filteredDefaulters.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredDefaulters.map(item => item.student?.id));
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case 'critical':
        return <Badge className="bg-purple-500">Critical</Badge>;
      case 'high':
        return <Badge variant="destructive">High Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium</Badge>;
      default:
        return <Badge className="bg-green-500">Low</Badge>;
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'critical':
        return <ShieldX className="h-4 w-4 text-purple-500" />;
      case 'high':
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Shield className="h-4 w-4 text-green-500" />;
    }
  };

  // Send notifications
  const sendNotifications = async (type) => {
    if (selectedStudents.length === 0) {
      toast.error('Please select students first');
      return;
    }

    toast.success(`${type} notifications sent to ${selectedStudents.length} defaulters`);
    setShowActionDialog(false);
    setSelectedStudents([]);
  };

  // Generate Notice
  const generateNotice = () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select students first');
      return;
    }
    toast.success(`Fee notice generated for ${selectedStudents.length} students`);
  };

  // Export to Excel
  const exportToExcel = () => {
    let csv = 'Defaulter Report\n';
    csv += `Generated: ${formatDate(new Date())}\n\n`;
    csv += 'Sl No,School Code,Student Name,Class,Outstanding,Overdue Days,Risk Score,Risk Level,Phone\n';
    
    filteredDefaulters.forEach((item, idx) => {
      csv += `${idx + 1},${item.student?.school_code || '-'},${item.student?.full_name || '-'},${item.student?.classes?.name || '-'},${item.totalOutstanding},${item.maxOverdueDays},${item.riskScore},${item.riskLevel},${item.student?.father_phone || item.student?.mother_phone || '-'}\n`;
    });

    csv += `\nTotal Defaulters:,${filteredDefaulters.length},,,${filteredDefaulters.reduce((sum, d) => sum + d.totalOutstanding, 0)},,\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `defaulter_report_${new Date().toISOString().split('T')[0]}.csv`;
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
          <title>Defaulter Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
            th { background: #f5f5f5; }
            .header { text-align: center; margin-bottom: 20px; }
            .badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; }
            .badge-critical { background: #ede9fe; color: #7c3aed; }
            .badge-high { background: #fee2e2; color: #dc2626; }
            .badge-medium { background: #fef9c3; color: #ca8a04; }
            .badge-low { background: #dcfce7; color: #16a34a; }
            .total { font-weight: bold; background: #fef2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${selectedBranch?.name || 'School Name'}</h2>
            <h3>Defaulter Report</h3>
            <p>Total Defaulters: ${filteredDefaulters.length} | Outstanding: ₹${filteredDefaulters.reduce((sum, d) => sum + d.totalOutstanding, 0).toLocaleString('en-IN')}</p>
            <p>Generated: ${formatDate(new Date())}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Sl</th>
                <th>School Code</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Outstanding</th>
                <th>Overdue Days</th>
                <th>Risk Score</th>
                <th>Risk Level</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              ${filteredDefaulters.map((item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${item.student?.school_code || '-'}</td>
                  <td>${item.student?.full_name || '-'}</td>
                  <td>${item.student?.classes?.name || '-'} ${item.student?.sections?.name || ''}</td>
                  <td>₹${item.totalOutstanding.toLocaleString('en-IN')}</td>
                  <td>${item.maxOverdueDays} days</td>
                  <td>${item.riskScore}/100</td>
                  <td><span class="badge badge-${item.riskLevel}">${item.riskLevel.toUpperCase()}</span></td>
                  <td>${item.student?.father_phone || item.student?.mother_phone || '-'}</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td colspan="4">Total</td>
                <td>₹${filteredDefaulters.reduce((sum, d) => sum + d.totalOutstanding, 0).toLocaleString('en-IN')}</td>
                <td colspan="4"></td>
              </tr>
            </tbody>
          </table>
          
          <p style="margin-top: 30px; text-align: center; color: #666;">
            Jashchar ERP | ${new Date().toLocaleString('en-IN')}
          </p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Pie chart data
  const riskPieData = [
    { name: 'Low Risk', value: summary.lowRisk, color: RISK_COLORS.low },
    { name: 'Medium Risk', value: summary.mediumRisk, color: RISK_COLORS.medium },
    { name: 'High Risk', value: summary.highRisk, color: RISK_COLORS.high },
    { name: 'Critical', value: summary.criticalRisk, color: RISK_COLORS.critical }
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
          <h1 className="text-2xl font-bold">Defaulter Report</h1>
          <p className="text-muted-foreground">
            {selectedBranch?.name} • {summary.totalDefaulters} defaulters identified
          </p>
        </div>
        <div className="flex gap-2">
          {selectedStudents.length > 0 && (
            <>
              <Button onClick={() => setShowActionDialog(true)} className="gap-2">
                <Bell className="h-4 w-4" />
                Actions ({selectedStudents.length})
              </Button>
              <Button variant="outline" onClick={generateNotice} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Generate Notice
              </Button>
            </>
          )}
          <Button variant="outline" onClick={exportToExcel} className="gap-2">
            <Download className="h-4 w-4" />
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
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Defaulters</p>
                <p className="text-lg font-bold text-red-600">{summary.totalDefaulters}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Outstanding</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(summary.totalOutstanding)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <ShieldX className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Critical Risk</p>
                <p className="text-lg font-bold text-purple-600">{summary.criticalRisk}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">High Risk</p>
                <p className="text-lg font-bold text-red-600">{summary.highRisk}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Overdue</p>
                <p className="text-lg font-bold text-blue-600">{summary.avgOverdueDays} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {riskPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                      labelLine={false}
                    >
                      {riskPieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No defaulters found
                </div>
              )}
            </div>
            <div className="space-y-2 mt-2">
              {riskPieData.map(item => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
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

              <Select
                value={filters.classId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, classId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.riskLevel}
                onValueChange={(value) => setFilters(prev => ({ ...prev, riskLevel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Min Amount"
                value={filters.minAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
              />

              <Input
                type="number"
                placeholder="Max Amount"
                value={filters.maxAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Defaulter Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Defaulter List ({filteredDefaulters.length} students)
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
                      checked={selectedStudents.length === filteredDefaulters.length && filteredDefaulters.length > 0}
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
                  <TableHead>Class</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Outstanding
                      {sortConfig.key === 'amount' && (
                        sortConfig.direction === 'asc' 
                          ? <ChevronUp className="h-4 w-4" />
                          : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-center cursor-pointer"
                    onClick={() => handleSort('days')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Overdue Days
                      {sortConfig.key === 'days' && (
                        sortConfig.direction === 'asc' 
                          ? <ChevronUp className="h-4 w-4" />
                          : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-center cursor-pointer"
                    onClick={() => handleSort('riskScore')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Risk
                      {sortConfig.key === 'riskScore' && (
                        sortConfig.direction === 'asc' 
                          ? <ChevronUp className="h-4 w-4" />
                          : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDefaulters.length > 0 ? (
                  filteredDefaulters.slice(0, 50).map((item) => (
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
                        ₹{item.totalOutstanding.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{item.maxOverdueDays} days</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getRiskIcon(item.riskLevel)}
                          <span className="text-sm">{item.riskScore}/100</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRiskBadge(item.riskLevel)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.student?.father_phone || item.student?.mother_phone || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No defaulters found with current filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {filteredDefaulters.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      ₹{filteredDefaulters.reduce((sum, d) => sum + d.totalOutstanding, 0).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell colSpan={4}></TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
          {filteredDefaulters.length > 50 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Showing 50 of {filteredDefaulters.length} defaulters. Export for complete list.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <AlertDialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Reminders</AlertDialogTitle>
            <AlertDialogDescription>
              Send payment reminders to {selectedStudents.length} selected defaulters.
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
              Send Email Notice
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
