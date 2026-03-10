/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FEE TYPE ANALYSIS REPORT
 * Day 35 Implementation - Fee Collection Phase 4 (Analytics)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Fee type wise collection breakdown
 * - Revenue contribution by fee type
 * - Comparison with previous periods
 * - Trend analysis per fee type
 * - Top/Bottom performing fee types
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Download,
  Printer,
  Loader2,
  FileSpreadsheet,
  PieChart as PieChartIcon,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus,
  BookOpen,
  Bus,
  Home,
  FlaskConical,
  Laptop,
  Utensils,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDate, formatDateForInput } from '@/utils/dateUtils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6', '#F97316'];

// Fee type icons mapping
const feeTypeIcons = {
  'tuition': BookOpen,
  'admission': DollarSign,
  'transport': Bus,
  'hostel': Home,
  'lab': FlaskConical,
  'computer': Laptop,
  'library': BookOpen,
  'mess': Utensils,
  'default': DollarSign
};

const getFeeIcon = (feeTypeName) => {
  const lowerName = feeTypeName?.toLowerCase() || '';
  for (const [key, Icon] of Object.entries(feeTypeIcons)) {
    if (lowerName.includes(key)) return Icon;
  }
  return feeTypeIcons.default;
};

export default function FeeTypeAnalysis() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;

  // State
  const [loading, setLoading] = useState(true);
  const [feeTypeData, setFeeTypeData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('all');
  
  // Summary
  const [totalSummary, setTotalSummary] = useState({
    totalExpected: 0,
    totalCollected: 0,
    totalPending: 0,
    totalFeeTypes: 0,
    avgCollection: 0
  });

  // Chart data
  const [pieData, setPieData] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);

  // Available months
  const months = [
    { value: 'all', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Load data
  useEffect(() => {
    if (branchId && currentSessionId) {
      loadFeeTypeData();
    }
  }, [branchId, currentSessionId, selectedMonth]);

  const loadFeeTypeData = async () => {
    setLoading(true);
    try {
      // Get all fee types
      const { data: feeTypes } = await supabase
        .from('fee_types')
        .select('id, name, description')
        .eq('branch_id', branchId)
        .eq('is_active', true);

      // Get fee details with fee type info
      const { data: feeDetails } = await supabase
        .from('fee_details')
        .select(`
          id,
          total_amount,
          paid_amount,
          balance,
          status,
          created_at,
          fee_structure:fee_structure_id(
            fee_type:fee_type_id(id, name)
          )
        `)
        .eq('branch_id', branchId)
        .eq('session_id', currentSessionId);

      // Aggregate by fee type
      const feeTypeMap = {};
      
      (feeTypes || []).forEach(ft => {
        feeTypeMap[ft.id] = {
          id: ft.id,
          name: ft.name,
          description: ft.description,
          totalExpected: 0,
          totalCollected: 0,
          totalPending: 0,
          studentCount: new Set(),
          paidStudentCount: new Set(),
          monthlyData: {}
        };
      });

      // Process fee details
      (feeDetails || []).forEach(fee => {
        const feeTypeId = fee.fee_structure?.fee_type?.id;
        if (!feeTypeId || !feeTypeMap[feeTypeId]) return;

        // Filter by month if selected
        if (selectedMonth !== 'all') {
          const feeMonth = new Date(fee.created_at).getMonth() + 1;
          if (feeMonth !== parseInt(selectedMonth)) return;
        }

        feeTypeMap[feeTypeId].totalExpected += fee.total_amount || 0;
        feeTypeMap[feeTypeId].totalCollected += fee.paid_amount || 0;
        feeTypeMap[feeTypeId].totalPending += fee.balance || 0;

        // Track monthly data
        const monthKey = new Date(fee.created_at).toLocaleString('en-IN', { month: 'short' });
        if (!feeTypeMap[feeTypeId].monthlyData[monthKey]) {
          feeTypeMap[feeTypeId].monthlyData[monthKey] = { collected: 0, expected: 0 };
        }
        feeTypeMap[feeTypeId].monthlyData[monthKey].collected += fee.paid_amount || 0;
        feeTypeMap[feeTypeId].monthlyData[monthKey].expected += fee.total_amount || 0;
      });

      // Convert to array with percentages
      const feeTypeArray = Object.values(feeTypeMap)
        .filter(ft => ft.totalExpected > 0)
        .map(ft => ({
          ...ft,
          collectionRate: ft.totalExpected > 0 
            ? Math.round((ft.totalCollected / ft.totalExpected) * 100) 
            : 0,
          contribution: 0 // Will calculate after total
        }))
        .sort((a, b) => b.totalCollected - a.totalCollected);

      // Calculate contribution percentage
      const totalCollected = feeTypeArray.reduce((sum, ft) => sum + ft.totalCollected, 0);
      feeTypeArray.forEach(ft => {
        ft.contribution = totalCollected > 0 
          ? Math.round((ft.totalCollected / totalCollected) * 100) 
          : 0;
      });

      setFeeTypeData(feeTypeArray);

      // Summary
      const totalExpected = feeTypeArray.reduce((sum, ft) => sum + ft.totalExpected, 0);
      const totalPending = feeTypeArray.reduce((sum, ft) => sum + ft.totalPending, 0);
      
      setTotalSummary({
        totalExpected,
        totalCollected,
        totalPending,
        totalFeeTypes: feeTypeArray.length,
        avgCollection: feeTypeArray.length > 0 ? Math.round(totalCollected / feeTypeArray.length) : 0
      });

      // Pie chart data
      const chartData = feeTypeArray.slice(0, 8).map((ft, idx) => ({
        name: ft.name.length > 15 ? ft.name.slice(0, 15) + '...' : ft.name,
        value: ft.totalCollected,
        color: COLORS[idx % COLORS.length]
      }));
      setPieData(chartData);

      // Monthly trend data
      const allMonths = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
      const trendData = allMonths.map(month => {
        const monthData = { month };
        feeTypeArray.slice(0, 4).forEach(ft => {
          monthData[ft.name] = ft.monthlyData[month]?.collected || 0;
        });
        return monthData;
      });
      setMonthlyTrend(trendData);

    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load fee type data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (rate) => {
    if (rate >= 80) return <Badge className="bg-green-500">Excellent</Badge>;
    if (rate >= 60) return <Badge className="bg-blue-500">Good</Badge>;
    if (rate >= 40) return <Badge className="bg-yellow-500">Average</Badge>;
    return <Badge variant="destructive">Low</Badge>;
  };

  const getTrendIcon = (rate) => {
    if (rate >= 80) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (rate >= 50) return <Minus className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  // Export to Excel
  const exportToExcel = () => {
    let csv = 'Fee Type Analysis Report\n';
    csv += `Generated: ${formatDate(new Date())}\n\n`;
    csv += 'Fee Type,Expected,Collected,Pending,Collection %,Contribution %\n';
    
    feeTypeData.forEach(ft => {
      csv += `${ft.name},${ft.totalExpected},${ft.totalCollected},${ft.totalPending},${ft.collectionRate}%,${ft.contribution}%\n`;
    });

    csv += `\nTotal,${totalSummary.totalExpected},${totalSummary.totalCollected},${totalSummary.totalPending},,100%\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee_type_analysis_${new Date().toISOString().split('T')[0]}.csv`;
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
          <title>Fee Type Analysis Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .header { text-align: center; margin-bottom: 20px; }
            .total { font-weight: bold; background: #f0f9ff; }
            .badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; }
            .badge-green { background: #dcfce7; color: #16a34a; }
            .badge-blue { background: #dbeafe; color: #2563eb; }
            .badge-yellow { background: #fef9c3; color: #ca8a04; }
            .badge-red { background: #fee2e2; color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${selectedBranch?.name || 'School Name'}</h2>
            <h3>Fee Type Analysis Report</h3>
            <p>Academic Year: 2025-26 | Generated: ${formatDate(new Date())}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Fee Type</th>
                <th>Expected</th>
                <th>Collected</th>
                <th>Pending</th>
                <th>Collection %</th>
                <th>Contribution</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${feeTypeData.map(ft => `
                <tr>
                  <td>${ft.name}</td>
                  <td>₹${ft.totalExpected.toLocaleString('en-IN')}</td>
                  <td>₹${ft.totalCollected.toLocaleString('en-IN')}</td>
                  <td>₹${ft.totalPending.toLocaleString('en-IN')}</td>
                  <td>${ft.collectionRate}%</td>
                  <td>${ft.contribution}%</td>
                  <td><span class="badge badge-${
                    ft.collectionRate >= 80 ? 'green' : 
                    ft.collectionRate >= 60 ? 'blue' :
                    ft.collectionRate >= 40 ? 'yellow' : 'red'
                  }">${ft.collectionRate >= 80 ? 'Excellent' : ft.collectionRate >= 60 ? 'Good' : ft.collectionRate >= 40 ? 'Average' : 'Low'}</span></td>
                </tr>
              `).join('')}
              <tr class="total">
                <td>Total</td>
                <td>₹${totalSummary.totalExpected.toLocaleString('en-IN')}</td>
                <td>₹${totalSummary.totalCollected.toLocaleString('en-IN')}</td>
                <td>₹${totalSummary.totalPending.toLocaleString('en-IN')}</td>
                <td>${totalSummary.totalExpected > 0 ? Math.round((totalSummary.totalCollected / totalSummary.totalExpected) * 100) : 0}%</td>
                <td>100%</td>
                <td>-</td>
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
          <h1 className="text-2xl font-bold">Fee Type Analysis</h1>
          <p className="text-muted-foreground">
            {selectedBranch?.name} • {feeTypeData.length} active fee types
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <PieChartIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fee Types</p>
                <p className="text-lg font-bold">{totalSummary.totalFeeTypes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Collected</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(totalSummary.totalCollected)}
                </p>
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
                <p className="text-xs text-muted-foreground">Total Pending</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(totalSummary.totalPending)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg per Type</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(totalSummary.avgCollection)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Revenue Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Distribution</CardTitle>
            <CardDescription>Collection share by fee type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      dataKey="value"
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
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart - Collected vs Pending */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Collected vs Pending</CardTitle>
            <CardDescription>By fee type comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={feeTypeData.slice(0, 8)} 
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `₹${v/1000}K`} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    fontSize={11}
                    tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + '...' : v}
                  />
                  <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                  <Legend />
                  <Bar dataKey="totalCollected" fill="#10B981" name="Collected" />
                  <Bar dataKey="totalPending" fill="#F59E0B" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Type Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {feeTypeData.map((ft, idx) => {
          const Icon = getFeeIcon(ft.name);
          return (
            <Card key={ft.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${COLORS[idx % COLORS.length]}20` }}
                    >
                      <Icon 
                        className="h-5 w-5" 
                        style={{ color: COLORS[idx % COLORS.length] }}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{ft.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ft.contribution}% contribution
                      </p>
                    </div>
                  </div>
                  {getTrendIcon(ft.collectionRate)}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Collected</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(ft.totalCollected)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-medium text-orange-600">
                      {formatCurrency(ft.totalPending)}
                    </span>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Collection Rate</span>
                      <span className="font-medium">{ft.collectionRate}%</span>
                    </div>
                    <Progress 
                      value={ft.collectionRate} 
                      className="h-2"
                    />
                  </div>

                  <div className="pt-2 border-t">
                    {getStatusBadge(ft.collectionRate)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detailed Fee Type Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fee Type</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Collected</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-center">Collection %</TableHead>
                  <TableHead className="text-center">Contribution</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeTypeData.map((ft, idx) => {
                  const Icon = getFeeIcon(ft.name);
                  return (
                    <TableRow key={ft.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-8 w-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${COLORS[idx % COLORS.length]}20` }}
                          >
                            <Icon 
                              className="h-4 w-4" 
                              style={{ color: COLORS[idx % COLORS.length] }}
                            />
                          </div>
                          <span className="font-medium">{ft.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(ft.totalExpected)}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {formatCurrency(ft.totalCollected)}
                      </TableCell>
                      <TableCell className="text-right text-orange-600 font-medium">
                        {formatCurrency(ft.totalPending)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={ft.collectionRate} className="w-16 h-2" />
                          <span className="text-sm">{ft.collectionRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{ft.contribution}%</Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(ft.collectionRate)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totalSummary.totalExpected)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600">
                    {formatCurrency(totalSummary.totalCollected)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-orange-600">
                    {formatCurrency(totalSummary.totalPending)}
                  </TableCell>
                  <TableCell className="text-center font-bold">
                    {totalSummary.totalExpected > 0 
                      ? Math.round((totalSummary.totalCollected / totalSummary.totalExpected) * 100)
                      : 0
                    }%
                  </TableCell>
                  <TableCell className="text-center font-bold">100%</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ArrowUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-green-700">Top Revenue</p>
                <p className="font-bold text-green-800">
                  {feeTypeData.length > 0 ? feeTypeData[0].name : '-'}
                </p>
                <p className="text-xs text-green-600">
                  {feeTypeData.length > 0 
                    ? `${formatCurrency(feeTypeData[0].totalCollected)} (${feeTypeData[0].contribution}%)`
                    : ''
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-700">Best Collection Rate</p>
                <p className="font-bold text-blue-800">
                  {feeTypeData.length > 0 
                    ? feeTypeData.reduce((max, ft) => ft.collectionRate > max.collectionRate ? ft : max, feeTypeData[0]).name
                    : '-'
                  }
                </p>
                <p className="text-xs text-blue-600">
                  {feeTypeData.length > 0 
                    ? `${feeTypeData.reduce((max, ft) => ft.collectionRate > max.collectionRate ? ft : max, feeTypeData[0]).collectionRate}% collected`
                    : ''
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ArrowDown className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-red-700">Highest Pending</p>
                <p className="font-bold text-red-800">
                  {feeTypeData.length > 0 
                    ? feeTypeData.reduce((max, ft) => ft.totalPending > max.totalPending ? ft : max, feeTypeData[0]).name
                    : '-'
                  }
                </p>
                <p className="text-xs text-red-600">
                  {feeTypeData.length > 0 
                    ? formatCurrency(feeTypeData.reduce((max, ft) => ft.totalPending > max.totalPending ? ft : max, feeTypeData[0]).totalPending)
                    : ''
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
