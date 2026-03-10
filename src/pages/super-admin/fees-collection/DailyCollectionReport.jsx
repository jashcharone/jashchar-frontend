/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DAILY COLLECTION REPORT
 * Day 32 Implementation - Fee Collection Phase 4 (Analytics)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Day-wise collection summary
 * - Cashier/collector-wise breakdown
 * - Payment method distribution
 * - Hourly collection pattern
 * - Export to Excel/PDF
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  IndianRupee, 
  Calendar,
  Download,
  Printer,
  Search,
  Loader2,
  FileSpreadsheet,
  FileText,
  Clock,
  Users,
  Receipt,
  Banknote,
  QrCode,
  CreditCard,
  Wallet,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDate, formatDateForInput } from '@/utils/dateUtils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

export default function DailyCollectionReport() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;

  // State
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(formatDateForInput(new Date()));
  const [activeTab, setActiveTab] = useState('summary');
  
  // Data
  const [summary, setSummary] = useState({
    totalCollection: 0,
    cashCollection: 0,
    upiCollection: 0,
    cardCollection: 0,
    onlineCollection: 0,
    transactionCount: 0,
    studentCount: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [collectorWise, setCollectorWise] = useState([]);
  const [feeTypeWise, setFeeTypeWise] = useState([]);
  const [paymentMethodData, setPaymentMethodData] = useState([]);

  // Comparison with previous day
  const [comparison, setComparison] = useState({
    percentChange: 0,
    isIncrease: true
  });

  // Load data on date change
  useEffect(() => {
    if (branchId && currentSessionId && selectedDate) {
      loadDailyReport();
    }
  }, [branchId, currentSessionId, selectedDate]);

  const loadDailyReport = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSummary(),
        loadTransactions(),
        loadHourlyPattern(),
        loadCollectorWise(),
        loadFeeTypeWise(),
        loadComparison()
      ]);
    } catch (error) {
      console.error('Report load error:', error);
      toast.error('Failed to load daily report');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('fee_transactions')
      .select('amount, payment_method, student_id')
      .eq('branch_id', branchId)
      .eq('session_id', currentSessionId)
      .eq('status', 'success')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    if (!data) {
      setSummary({
        totalCollection: 0,
        cashCollection: 0,
        upiCollection: 0,
        cardCollection: 0,
        onlineCollection: 0,
        transactionCount: 0,
        studentCount: 0
      });
      setPaymentMethodData([]);
      return;
    }

    const totalCollection = data.reduce((sum, t) => sum + (t.amount || 0), 0);
    const cashCollection = data.filter(t => t.payment_method === 'cash').reduce((sum, t) => sum + (t.amount || 0), 0);
    const upiCollection = data.filter(t => t.payment_method === 'upi').reduce((sum, t) => sum + (t.amount || 0), 0);
    const cardCollection = data.filter(t => t.payment_method === 'card').reduce((sum, t) => sum + (t.amount || 0), 0);
    const onlineCollection = data.filter(t => t.payment_method === 'online').reduce((sum, t) => sum + (t.amount || 0), 0);
    const uniqueStudents = new Set(data.map(t => t.student_id)).size;

    setSummary({
      totalCollection,
      cashCollection,
      upiCollection,
      cardCollection,
      onlineCollection,
      transactionCount: data.length,
      studentCount: uniqueStudents
    });

    // Payment method pie chart data
    const methodData = [
      { name: 'Cash', value: cashCollection, color: '#10B981' },
      { name: 'UPI', value: upiCollection, color: '#7C3AED' },
      { name: 'Card', value: cardCollection, color: '#3B82F6' },
      { name: 'Online', value: onlineCollection, color: '#F59E0B' }
    ].filter(d => d.value > 0);

    setPaymentMethodData(methodData);
  };

  const loadTransactions = async () => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('fee_transactions')
      .select(`
        id,
        transaction_id,
        receipt_no,
        amount,
        payment_method,
        created_at,
        created_by,
        student:student_id(full_name, school_code, classes(name), sections(name))
      `)
      .eq('branch_id', branchId)
      .eq('session_id', currentSessionId)
      .eq('status', 'success')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: true });

    setTransactions(data || []);
  };

  const loadHourlyPattern = async () => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('fee_transactions')
      .select('amount, created_at')
      .eq('branch_id', branchId)
      .eq('session_id', currentSessionId)
      .eq('status', 'success')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    // Group by hour
    const hourlyGroups = {};
    for (let i = 0; i < 24; i++) {
      hourlyGroups[i] = 0;
    }

    (data || []).forEach(txn => {
      const hour = new Date(txn.created_at).getHours();
      hourlyGroups[hour] += txn.amount || 0;
    });

    const hourlyChart = Object.entries(hourlyGroups)
      .filter(([hour]) => parseInt(hour) >= 8 && parseInt(hour) <= 18) // 8 AM to 6 PM
      .map(([hour, amount]) => ({
        hour: `${hour}:00`,
        amount: Math.round(amount)
      }));

    setHourlyData(hourlyChart);
  };

  const loadCollectorWise = async () => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('fee_transactions')
      .select(`
        amount,
        created_by,
        collector:created_by(email, user_metadata)
      `)
      .eq('branch_id', branchId)
      .eq('session_id', currentSessionId)
      .eq('status', 'success')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    // Group by collector
    const grouped = {};
    (data || []).forEach(txn => {
      const collectorName = txn.collector?.user_metadata?.full_name || 
                           txn.collector?.email || 
                           'Unknown';
      if (!grouped[collectorName]) {
        grouped[collectorName] = { amount: 0, count: 0 };
      }
      grouped[collectorName].amount += txn.amount || 0;
      grouped[collectorName].count += 1;
    });

    const collectorData = Object.entries(grouped).map(([name, data]) => ({
      name: name.length > 20 ? name.slice(0, 20) + '...' : name,
      amount: data.amount,
      count: data.count
    }));

    setCollectorWise(collectorData);
  };

  const loadFeeTypeWise = async () => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get transaction details with fee types
    const { data } = await supabase
      .from('fee_transaction_details')
      .select(`
        amount,
        fee_detail:fee_detail_id(
          fee_structure:fee_structure_id(
            fee_type:fee_type_id(name)
          )
        ),
        fee_transaction:fee_transaction_id(
          created_at,
          status
        )
      `)
      .eq('branch_id', branchId)
      .eq('session_id', currentSessionId);

    // Filter by date and success status
    const filteredData = (data || []).filter(txn => {
      if (!txn.fee_transaction?.created_at) return false;
      if (txn.fee_transaction?.status !== 'success') return false;
      const txnDate = new Date(txn.fee_transaction.created_at);
      return txnDate >= startOfDay && txnDate <= endOfDay;
    });

    // Group by fee type
    const grouped = {};
    filteredData.forEach(txn => {
      const typeName = txn.fee_detail?.fee_structure?.fee_type?.name || 'Other';
      grouped[typeName] = (grouped[typeName] || 0) + (txn.amount || 0);
    });

    const typeData = Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => ({
        name: name.length > 20 ? name.slice(0, 20) + '...' : name,
        amount: Math.round(amount)
      }));

    setFeeTypeWise(typeData);
  };

  const loadComparison = async () => {
    const currentDate = new Date(selectedDate);
    const previousDate = new Date(currentDate);
    previousDate.setDate(previousDate.getDate() - 1);

    const prevStart = new Date(previousDate);
    prevStart.setHours(0, 0, 0, 0);
    const prevEnd = new Date(previousDate);
    prevEnd.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('fee_transactions')
      .select('amount')
      .eq('branch_id', branchId)
      .eq('session_id', currentSessionId)
      .eq('status', 'success')
      .gte('created_at', prevStart.toISOString())
      .lte('created_at', prevEnd.toISOString());

    const prevTotal = (data || []).reduce((sum, t) => sum + (t.amount || 0), 0);
    
    if (prevTotal > 0) {
      const percentChange = ((summary.totalCollection - prevTotal) / prevTotal) * 100;
      setComparison({
        percentChange: Math.abs(Math.round(percentChange)),
        isIncrease: percentChange >= 0
      });
    } else {
      setComparison({ percentChange: 0, isIncrease: true });
    }
  };

  // Navigation
  const navigateDate = (direction) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    setSelectedDate(formatDateForInput(current));
  };

  // Export functions
  const exportToExcel = () => {
    // Create CSV content
    let csv = 'Daily Collection Report - ' + formatDate(selectedDate) + '\n\n';
    csv += 'Sl No,Receipt No,Student Name,School Code,Class,Amount,Payment Method,Time\n';
    
    transactions.forEach((txn, index) => {
      csv += `${index + 1},${txn.receipt_no || '-'},${txn.student?.full_name || '-'},${txn.student?.school_code || '-'},${txn.student?.classes?.name || '-'},${txn.amount},${txn.payment_method},${new Date(txn.created_at).toLocaleTimeString('en-IN')}\n`;
    });
    
    csv += `\nTotal,,,,${summary.totalCollection},,\n`;

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily_collection_${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Report exported to Excel');
  };

  const printReport = () => {
    const printContent = document.getElementById('print-section');
    const printWindow = window.open('', '', 'width=900,height=700');
    printWindow.document.write(`
      <html>
        <head>
          <title>Daily Collection Report - ${formatDate(selectedDate)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { display: flex; gap: 20px; margin-bottom: 20px; }
            .summary-card { padding: 15px; border: 1px solid #ddd; border-radius: 8px; flex: 1; }
            .total { font-weight: bold; background: #f0f9ff; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${selectedBranch?.name || 'School Name'}</h2>
            <h3>Daily Collection Report</h3>
            <p>Date: ${formatDate(selectedDate)}</p>
          </div>
          
          <div class="summary">
            <div class="summary-card">
              <strong>Total Collection</strong><br/>
              ₹${summary.totalCollection.toLocaleString('en-IN')}
            </div>
            <div class="summary-card">
              <strong>Transactions</strong><br/>
              ${summary.transactionCount}
            </div>
            <div class="summary-card">
              <strong>Students</strong><br/>
              ${summary.studentCount}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Sl No</th>
                <th>Receipt No</th>
                <th>Student Name</th>
                <th>School Code</th>
                <th>Class</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map((txn, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${txn.receipt_no || '-'}</td>
                  <td>${txn.student?.full_name || '-'}</td>
                  <td>${txn.student?.school_code || '-'}</td>
                  <td>${txn.student?.classes?.name || '-'}</td>
                  <td>₹${txn.amount?.toLocaleString('en-IN')}</td>
                  <td>${txn.payment_method}</td>
                  <td>${new Date(txn.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td colspan="5">Total</td>
                <td colspan="3">₹${summary.totalCollection.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
          
          <p style="margin-top: 30px; text-align: center; color: #666;">
            Generated on ${new Date().toLocaleString('en-IN')} | Jashchar ERP
          </p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Get payment icon
  const getPaymentIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'cash': return <Banknote className="h-4 w-4 text-green-600" />;
      case 'upi': return <QrCode className="h-4 w-4 text-purple-600" />;
      case 'card': return <CreditCard className="h-4 w-4 text-blue-600" />;
      default: return <Wallet className="h-4 w-4 text-gray-600" />;
    }
  };

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
          <h1 className="text-2xl font-bold">Daily Collection Report</h1>
          <p className="text-muted-foreground">
            {selectedBranch?.name} • {formatDate(selectedDate)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={printReport} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Date Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigateDate(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={formatDateForInput(new Date())}
                className="w-[180px]"
              />
            </div>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigateDate(1)}
              disabled={selectedDate >= formatDateForInput(new Date())}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Collection</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{summary.totalCollection.toLocaleString('en-IN')}
                </p>
                {comparison.percentChange > 0 && (
                  <p className={`text-xs flex items-center gap-1 ${comparison.isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                    {comparison.isIncrease ? 
                      <TrendingUp className="h-3 w-3" /> : 
                      <TrendingDown className="h-3 w-3" />
                    }
                    {comparison.percentChange}% vs yesterday
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold text-blue-600">
                  {summary.transactionCount}
                </p>
                <p className="text-xs text-muted-foreground">receipts generated</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Students Paid</p>
                <p className="text-2xl font-bold text-purple-600">
                  {summary.studentCount}
                </p>
                <p className="text-xs text-muted-foreground">unique students</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Collection</p>
                <p className="text-2xl font-bold text-orange-600">
                  ₹{summary.transactionCount > 0 
                    ? Math.round(summary.totalCollection / summary.transactionCount).toLocaleString('en-IN')
                    : 0
                  }
                </p>
                <p className="text-xs text-muted-foreground">per transaction</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Banknote className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-green-700">Cash</p>
              <p className="font-bold text-green-800">₹{summary.cashCollection.toLocaleString('en-IN')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="p-4 flex items-center gap-3">
            <QrCode className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-purple-700">UPI</p>
              <p className="font-bold text-purple-800">₹{summary.upiCollection.toLocaleString('en-IN')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4 flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-700">Card</p>
              <p className="font-bold text-blue-800">₹{summary.cardCollection.toLocaleString('en-IN')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-orange-700">Online</p>
              <p className="font-bold text-orange-800">₹{summary.onlineCollection.toLocaleString('en-IN')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Collection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Hourly Collection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" fontSize={12} />
                      <YAxis tickFormatter={(v) => `₹${v/1000}K`} fontSize={12} />
                      <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                      <Bar dataKey="amount" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Method Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  {paymentMethodData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethodData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {paymentMethodData.map((entry, index) => (
                            <Cell key={index} fill={entry.color || COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Fee Type Wise */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Collection by Fee Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  {feeTypeWise.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={feeTypeWise} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(v) => `₹${v/1000}K`} />
                        <YAxis dataKey="name" type="category" width={100} fontSize={11} />
                        <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                        <Bar dataKey="amount" fill="#10B981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Collector Wise */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Collection by Cashier</CardTitle>
              </CardHeader>
              <CardContent>
                {collectorWise.length > 0 ? (
                  <div className="space-y-3">
                    {collectorWise.map((collector, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium">{collector.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{collector.name}</p>
                            <p className="text-xs text-muted-foreground">{collector.count} transactions</p>
                          </div>
                        </div>
                        <p className="font-semibold text-green-600">
                          ₹{collector.amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transaction Details</CardTitle>
              <CardDescription>{transactions.length} transactions on {formatDate(selectedDate)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Sl</TableHead>
                      <TableHead>Receipt No</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length > 0 ? (
                      transactions.map((txn, idx) => (
                        <TableRow key={txn.id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {txn.receipt_no || '-'}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{txn.student?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{txn.student?.school_code}</p>
                            </div>
                          </TableCell>
                          <TableCell>{txn.student?.classes?.name || '-'}</TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{txn.amount?.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getPaymentIcon(txn.payment_method)}
                              <span className="capitalize">{txn.payment_method}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(txn.created_at).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No transactions on this date
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  {transactions.length > 0 && (
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={4} className="font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          ₹{summary.totalCollection.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-sm text-muted-foreground">Peak Collection Hour</p>
                <p className="text-2xl font-bold text-primary">
                  {hourlyData.length > 0 
                    ? hourlyData.reduce((max, h) => h.amount > max.amount ? h : max, hourlyData[0])?.hour || '-'
                    : '-'
                  }
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-sm text-muted-foreground">Most Used Method</p>
                <p className="text-2xl font-bold text-primary capitalize">
                  {paymentMethodData.length > 0
                    ? paymentMethodData.reduce((max, m) => m.value > max.value ? m : max, paymentMethodData[0])?.name || '-'
                    : '-'
                  }
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-sm text-muted-foreground">Collection Rate</p>
                <p className="text-2xl font-bold text-primary">
                  {summary.transactionCount > 0 
                    ? `${Math.round(summary.totalCollection / summary.transactionCount / 1000)}K/txn`
                    : '-'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
