import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { usePermissions } from '@/contexts/PermissionContext';
import { useToast } from '@/components/ui/use-toast';
import { ROUTES } from '@/registry/routeRegistry';
import { 
  Loader2, Building2, Users, GraduationCap, BookOpen, 
  IndianRupee, RefreshCw, TrendingUp, School, Layers
} from 'lucide-react';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

const BranchReport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canView } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    if (!canView('multi_branch.branch_list')) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to view branch reports.",
        variant: "destructive"
      });
      navigate(ROUTES.SUPER_ADMIN.DASHBOARD);
      return;
    }
    fetchReport();
  }, [canView, navigate, toast]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await api.get('/branches/report');
      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      toast({
        title: "Error",
        description: "Failed to load branch report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const getInitials = (name) => (name || 'B').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const branches = reportData?.branches || [];
  const summary = reportData?.summary || {};

  // Chart data
  const studentChartData = branches.map(b => ({
    name: b.name?.split(' - ')[1] || b.name?.split(' ').slice(0, 2).join(' ') || 'Branch',
    students: b.students,
    staff: b.staff,
    classes: b.classes
  }));

  const feeChartData = branches
    .filter(b => b.total_fee > 0 || b.fee_collected > 0)
    .map(b => ({
      name: b.name?.split(' - ')[1] || b.name?.split(' ').slice(0, 2).join(' ') || 'Branch',
      collected: b.fee_collected,
      pending: b.fee_pending
    }));

  const branchDistribution = branches.map((b, i) => ({
    name: b.name?.split(' - ')[1] || b.name?.split(' ').slice(0, 2).join(' ') || 'Branch',
    value: b.students || 1,
    color: COLORS[i % COLORS.length]
  }));

  const hasAnyData = summary.total_students > 0 || summary.total_staff > 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              Branch Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              Overview across all {summary.total_branches || 0} branches
            </p>
          </div>
          <Button variant="outline" onClick={fetchReport}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 border-indigo-200 dark:border-indigo-800">
            <CardContent className="p-4 text-center">
              <Building2 className="h-6 w-6 mx-auto mb-1 text-indigo-600 dark:text-indigo-400" />
              <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{summary.total_branches || 0}</p>
              <p className="text-xs text-muted-foreground">Branches</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardContent className="p-4 text-center">
              <GraduationCap className="h-6 w-6 mx-auto mb-1 text-green-600 dark:text-green-400" />
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{summary.total_students || 0}</p>
              <p className="text-xs text-muted-foreground">Students</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{summary.total_staff || 0}</p>
              <p className="text-xs text-muted-foreground">Staff</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4 text-center">
              <BookOpen className="h-6 w-6 mx-auto mb-1 text-purple-600 dark:text-purple-400" />
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{summary.total_classes || 0}</p>
              <p className="text-xs text-muted-foreground">Classes</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4 text-center">
              <IndianRupee className="h-6 w-6 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(summary.total_fee_collected)}</p>
              <p className="text-xs text-muted-foreground">Collected</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardContent className="p-4 text-center">
              <IndianRupee className="h-6 w-6 mx-auto mb-1 text-orange-600 dark:text-orange-400" />
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{formatCurrency(summary.total_fee_pending)}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        {hasAnyData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student & Staff Distribution Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Student & Staff Distribution
                </CardTitle>
                <CardDescription>Per-branch comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={studentChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="students" fill="#6366f1" name="Students" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="staff" fill="#22c55e" name="Staff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Fee Collection Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Fee Collection Status
                </CardTitle>
                <CardDescription>Collected vs Pending per branch</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {feeChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={feeChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `?${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => [`?${value.toLocaleString('en-IN')}`, '']} />
                        <Legend />
                        <Bar dataKey="collected" fill="#22c55e" name="Collected" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="pending" fill="#ef4444" name="Pending" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <IndianRupee className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p>No fee data available yet</p>
                        <p className="text-sm">Fee data will appear once fees are configured</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // No data state with branch distribution pie chart
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Branch Overview
                </CardTitle>
                <CardDescription>Organization structure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={branchDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name }) => name}
                      >
                        {branchDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="flex items-center justify-center">
              <CardContent className="text-center py-12">
                <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="text-lg font-semibold mb-2">No Student/Staff Data Yet</h3>
                <p className="text-muted-foreground text-sm max-w-[300px] mx-auto">
                  Once students and staff are added to the branches, detailed charts and statistics will appear here automatically.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Branch Details Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Branch-wise Details
            </CardTitle>
            <CardDescription>Detailed statistics for each branch</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Board</TableHead>
                  <TableHead className="text-center">Students</TableHead>
                  <TableHead className="text-center">Staff</TableHead>
                  <TableHead className="text-center">Classes</TableHead>
                  <TableHead className="text-center">Sections</TableHead>
                  <TableHead className="text-right">Fee Collected</TableHead>
                  <TableHead className="text-right">Fee Pending</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={branch.logo_url} alt={branch.name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(branch.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{branch.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {branch.city || ''} {branch.is_primary && '• Primary'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={branch.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                        {branch.status || 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm">{branch.board || '-'}</TableCell>
                    <TableCell className="text-center font-medium">{branch.students}</TableCell>
                    <TableCell className="text-center font-medium">{branch.staff}</TableCell>
                    <TableCell className="text-center font-medium">{branch.classes}</TableCell>
                    <TableCell className="text-center font-medium">{branch.sections || 0}</TableCell>
                    <TableCell className="text-right text-sm text-green-600 dark:text-green-400">
                      {branch.fee_collected > 0 ? formatCurrency(branch.fee_collected) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-sm text-red-500">
                      {branch.fee_pending > 0 ? formatCurrency(branch.fee_pending) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals Row */}
                {branches.length > 1 && (
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>
                      <span className="font-bold">Total</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">{summary.active_branches} Active</Badge>
                    </TableCell>
                    <TableCell />
                    <TableCell className="text-center font-bold">{summary.total_students}</TableCell>
                    <TableCell className="text-center font-bold">{summary.total_staff}</TableCell>
                    <TableCell className="text-center font-bold">{summary.total_classes}</TableCell>
                    <TableCell className="text-center font-bold">{summary.total_sections || 0}</TableCell>
                    <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                      {summary.total_fee_collected > 0 ? formatCurrency(summary.total_fee_collected) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-500">
                      {summary.total_fee_pending > 0 ? formatCurrency(summary.total_fee_pending) : '-'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BranchReport;
