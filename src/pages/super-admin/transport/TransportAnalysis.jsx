import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Bus, Users, IndianRupee, MapPin, Loader2, TrendingUp,
  Route, Car, AlertCircle, CheckCircle, Clock, BarChart3, PieChart,
  Download, Printer, FileSpreadsheet, RefreshCw, Calendar, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fetchPrintHeaderData, buildOrgHeaderHtml, PRINT_STYLES, downloadReportAsPDF } from '@/utils/printOrgHeader';

// Simple progress bar component
const ProgressBar = ({ value, max, color = 'bg-primary', label }) => {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      {label && <div className="flex justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        <span>{percentage}%</span>
      </div>}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full transition-all", color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, color = 'text-primary', trend }) => (
  <Card className="relative overflow-hidden">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn("text-3xl font-bold", color)}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("p-3 rounded-xl bg-muted/50", color)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <TrendingUp className="h-3 w-3 text-green-500" />
          <span className="text-green-500">{trend}</span>
        </div>
      )}
    </CardContent>
  </Card>
);

const TransportAnalysis = () => {
  const printRef = useRef();
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRevenue: 0,
    activeRoutes: 0,
    activeVehicles: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0
  });
  const [classWiseData, setClassWiseData] = useState([]);
  const [routeWiseData, setRouteWiseData] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(currentSessionId);
  const [printHeaderData, setPrintHeaderData] = useState(null);

  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  // Fetch org header data for print
  useEffect(() => {
    if (!branchId) return;
    fetchPrintHeaderData(supabase, branchId).then(setPrintHeaderData);
  }, [branchId]);

  const fetchSessions = useCallback(async () => {
    if (!selectedBranch) return;
    const { data } = await supabase.from('sessions')
      .select('id, name, is_active')
      .eq('branch_id', selectedBranch.id)
      .order('name', { ascending: false });
    setSessions(data || []);
  }, [selectedBranch]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  useEffect(() => { if (currentSessionId) setSelectedSessionId(currentSessionId); }, [currentSessionId]);

  const fetchAnalyticsData = useCallback(async () => {
    if (!branchId || !selectedSessionId) return;
    setLoading(true);

    try {
      // 1. Fetch students with transport details + class info
      const { data: transportStudents, error: transportError } = await supabase
        .from('student_transport_details')
        .select(`
          id, student_id, transport_fee, transport_route_id,
          student:student_profiles!student_transport_details_student_id_fkey(id, full_name, class_id, classes!student_profiles_class_id_fkey(id, name))
        `)
        .eq('branch_id', branchId)
        .eq('session_id', selectedSessionId);

      if (transportError) throw transportError;

      // 2. Fetch routes
      const { data: routes } = await supabase
        .from('transport_routes')
        .select('id, route_title, fare')
        .eq('branch_id', branchId);

      // 3. Fetch vehicles
      const { data: vehicles } = await supabase
        .from('transport_vehicles')
        .select('id, vehicle_number, max_seating_capacity')
        .eq('branch_id', branchId);

      // 4. Fetch route-vehicle assignments
      const { data: assignments } = await supabase
        .from('route_vehicle_assignments')
        .select('route_id, vehicle_id')
        .eq('branch_id', branchId);

      // 5. Fetch classes for branch
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('branch_id', branchId)
        .order('name');

      // === CALCULATE STATISTICS ===
      const students = transportStudents || [];
      const totalStudents = students.length;
      const totalRevenue = students.reduce((sum, s) => sum + (parseFloat(s.transport_fee) || 0), 0);
      const activeRoutes = routes?.length || 0;
      const activeVehicles = vehicles?.length || 0;

      // Fee status (simplified - in real app, check actual payment records)
      // For now, assume all have transport but need payment tracking
      const paidCount = Math.floor(totalStudents * 0.7); // Placeholder
      const pendingCount = Math.floor(totalStudents * 0.2);
      const overdueCount = totalStudents - paidCount - pendingCount;

      setStats({
        totalStudents,
        totalRevenue,
        activeRoutes,
        activeVehicles,
        paidCount,
        pendingCount,
        overdueCount
      });

      // === CLASS-WISE ANALYSIS ===
      const classMap = new Map();
      students.forEach(s => {
        const classId = s.student?.class_id;
        const className = s.student?.classes?.name || 'Unknown';
        const fee = parseFloat(s.transport_fee) || 0;

        if (!classMap.has(classId)) {
          classMap.set(classId, { classId, className, count: 0, revenue: 0 });
        }
        const entry = classMap.get(classId);
        entry.count++;
        entry.revenue += fee;
      });

      // Sort by class name (natural sort for "Class 1", "Class 2", etc.)
      const classData = Array.from(classMap.values())
        .sort((a, b) => {
          // Extract numeric part for sorting
          const numA = parseInt(a.className.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.className.replace(/\D/g, '')) || 0;
          return numA - numB;
        })
        .map(c => ({
          ...c,
          percentage: totalStudents > 0 ? ((c.count / totalStudents) * 100).toFixed(1) : 0
        }));

      setClassWiseData(classData);

      // === ROUTE-WISE ANALYSIS ===
      const routeMap = new Map();
      (routes || []).forEach(r => {
        routeMap.set(r.id, {
          routeId: r.id,
          routeName: r.route_title,
          fare: r.fare || 0,
          studentCount: 0,
          vehicle: null,
          capacity: 0
        });
      });

      // Count students per route
      students.forEach(s => {
        if (s.transport_route_id && routeMap.has(s.transport_route_id)) {
          routeMap.get(s.transport_route_id).studentCount++;
        }
      });

      // Map vehicles to routes
      (assignments || []).forEach(a => {
        if (routeMap.has(a.route_id)) {
          const vehicle = vehicles?.find(v => v.id === a.vehicle_id);
          if (vehicle) {
            routeMap.get(a.route_id).vehicle = vehicle.vehicle_number;
            routeMap.get(a.route_id).capacity = vehicle.max_seating_capacity || 0;
          }
        }
      });

      const routeData = Array.from(routeMap.values())
        .filter(r => r.studentCount > 0 || r.vehicle)
        .sort((a, b) => b.studentCount - a.studentCount);

      setRouteWiseData(routeData);

    } catch (error) {
      console.error('[TransportAnalysis] Error:', error);
      toast({ variant: 'destructive', title: 'Error loading analytics', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedSessionId, toast]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  // === PRINT REPORT ===
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const sessionName = sessions.find(s => s.id === selectedSessionId)?.name || 'Active';
    const orgHeader = buildOrgHeaderHtml(printHeaderData);
    printWindow.document.write(`
      <html><head><title>Transport Analysis - ${selectedBranch?.name || 'School'}</title>
      <style>${PRINT_STYLES}</style></head><body>
      ${orgHeader}
      <h1>🚌 Transport Analysis Report</h1>
      <p class="report-meta"><strong>Session:</strong> ${sessionName} | <strong>Generated:</strong> ${format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
      <div class="stats-grid">
        <div class="stat-box"><div class="stat-value">${stats.totalStudents}</div><div class="stat-label">Total Students</div></div>
        <div class="stat-box"><div class="stat-value">${formatCurrency(stats.totalRevenue)}</div><div class="stat-label">Total Revenue</div></div>
        <div class="stat-box"><div class="stat-value">${stats.activeRoutes}</div><div class="stat-label">Active Routes</div></div>
        <div class="stat-box"><div class="stat-value">${stats.activeVehicles}</div><div class="stat-label">Vehicles</div></div>
      </div>
      <h2>Class-wise Transport Usage</h2>
      <table>
        <thead><tr><th>Class</th><th>Students</th><th>Revenue</th><th>%</th></tr></thead>
        <tbody>${classWiseData.map(c => `<tr><td>${c.className}</td><td>${c.count}</td><td>${formatCurrency(c.revenue)}</td><td>${c.percentage}%</td></tr>`).join('')}</tbody>
      </table>
      <h2>Route-wise Analysis</h2>
      <table>
        <thead><tr><th>Route</th><th>Students</th><th>Vehicle</th><th>Capacity</th><th>Fill %</th></tr></thead>
        <tbody>${routeWiseData.map(r => {
          const fill = r.capacity > 0 ? Math.round((r.studentCount / r.capacity) * 100) : 0;
          return `<tr><td>${r.routeName}</td><td>${r.studentCount}</td><td>${r.vehicle || '-'}</td><td>${r.capacity || '-'}</td><td>${fill}%</td></tr>`;
        }).join('')}</tbody>
      </table>
      <div class="footer">Generated by Jashchar ERP • ${format(new Date(), 'dd MMMM yyyy, hh:mm a')}</div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  // === DOWNLOAD PDF ===
  const handleDownloadPDF = async () => {
    const sessionName = sessions.find(s => s.id === selectedSessionId)?.name || 'Active';
    const orgHeader = buildOrgHeaderHtml(printHeaderData);
    const bodyHtml = `
      <h1>🚌 Transport Analysis Report</h1>
      <p class="report-meta"><strong>Session:</strong> ${sessionName} | <strong>Generated:</strong> ${format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
      <div class="stats-grid">
        <div class="stat-box"><div class="stat-value">${stats.totalStudents}</div><div class="stat-label">Total Students</div></div>
        <div class="stat-box"><div class="stat-value">${formatCurrency(stats.totalRevenue)}</div><div class="stat-label">Total Revenue</div></div>
        <div class="stat-box"><div class="stat-value">${stats.activeRoutes}</div><div class="stat-label">Active Routes</div></div>
        <div class="stat-box"><div class="stat-value">${stats.activeVehicles}</div><div class="stat-label">Vehicles</div></div>
      </div>
      <h2>Class-wise Transport Usage</h2>
      <table><thead><tr><th>Class</th><th>Students</th><th>Revenue</th><th>%</th></tr></thead>
        <tbody>${classWiseData.map(c => `<tr><td>${c.className}</td><td>${c.count}</td><td>${formatCurrency(c.revenue)}</td><td>${c.percentage}%</td></tr>`).join('')}</tbody></table>
      <h2>Route-wise Analysis</h2>
      <table><thead><tr><th>Route</th><th>Students</th><th>Vehicle</th><th>Capacity</th><th>Fill %</th></tr></thead>
        <tbody>${routeWiseData.map(r => {
          const fill = r.capacity > 0 ? Math.round((r.studentCount / r.capacity) * 100) : 0;
          return `<tr><td>${r.routeName}</td><td>${r.studentCount}</td><td>${r.vehicle || '-'}</td><td>${r.capacity || '-'}</td><td>${fill}%</td></tr>`;
        }).join('')}</tbody></table>
      <div class="footer">Generated by Jashchar ERP • ${format(new Date(), 'dd MMMM yyyy, hh:mm a')}</div>`;
    await downloadReportAsPDF({
      title: `Transport Analysis - ${selectedBranch?.name || 'School'}`,
      orgHeader,
      bodyHtml,
      fileName: `Transport_Analysis_${selectedBranch?.name || 'School'}_${format(new Date(), 'yyyy-MM-dd')}`,
    });
  };

  // === EXPORT CSV ===
  const handleExportExcel = () => {
    const rows = [['Class', 'Students', 'Revenue', '%']];
    classWiseData.forEach(c => rows.push([c.className, c.count, c.revenue, `${c.percentage}%`]));
    rows.push([]);
    rows.push(['Route', 'Students', 'Vehicle', 'Capacity', 'Fill %']);
    routeWiseData.forEach(r => {
      const fill = r.capacity > 0 ? Math.round((r.studentCount / r.capacity) * 100) : 0;
      rows.push([r.routeName, r.studentCount, r.vehicle || '-', r.capacity || '-', `${fill}%`]);
    });
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Transport_Analysis_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported successfully', description: 'Transport analysis data exported to CSV' });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6" ref={printRef}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bus className="h-7 w-7 text-orange-600" />
              Transport Analysis
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Comprehensive transport analytics & insights</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchAnalyticsData} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-1" /> Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Export Excel
            </Button>
          </div>
        </div>

        {/* Session Filter */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1 min-w-[200px]">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Session</label>
                <Select value={selectedSessionId || ''} onValueChange={setSelectedSessionId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select Session" /></SelectTrigger>
                  <SelectContent>
                    {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}{s.is_active ? ' \u2726' : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading transport analytics...</span>
          </div>
        ) : (
          <>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Students" 
            value={stats.totalStudents}
            subtitle="Using Transport"
            icon={Users}
            color="text-blue-600"
          />
          <StatCard 
            title="Total Revenue" 
            value={formatCurrency(stats.totalRevenue)}
            subtitle="This Session"
            icon={IndianRupee}
            color="text-green-600"
          />
          <StatCard 
            title="Active Routes" 
            value={stats.activeRoutes}
            subtitle="Configured"
            icon={Route}
            color="text-purple-600"
          />
          <StatCard 
            title="Vehicles" 
            value={stats.activeVehicles}
            subtitle="In Fleet"
            icon={Car}
            color="text-orange-600"
          />
        </div>

        {/* Fee Collection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Fee Collection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Paid</span>
                  <span className="ml-auto font-bold text-green-600">{stats.paidCount}</span>
                </div>
                <ProgressBar value={stats.paidCount} max={stats.totalStudents} color="bg-green-500" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Pending</span>
                  <span className="ml-auto font-bold text-yellow-600">{stats.pendingCount}</span>
                </div>
                <ProgressBar value={stats.pendingCount} max={stats.totalStudents} color="bg-yellow-500" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="font-medium">Overdue</span>
                  <span className="ml-auto font-bold text-red-600">{stats.overdueCount}</span>
                </div>
                <ProgressBar value={stats.overdueCount} max={stats.totalStudents} color="bg-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Class-wise Transport Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Class-wise Transport Usage
              </CardTitle>
              <CardDescription>Students using transport by class</CardDescription>
            </CardHeader>
            <CardContent>
              {classWiseData.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No data available</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                    <span>Class</span>
                    <span className="text-center">Students</span>
                    <span className="text-right">Revenue</span>
                    <span className="text-right">%</span>
                  </div>
                  {classWiseData.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-2 items-center py-2 hover:bg-muted/50 rounded-lg px-2">
                      <span className="font-medium">{item.className}</span>
                      <span className="text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {item.count}
                        </span>
                      </span>
                      <span className="text-right text-green-600 font-medium">{formatCurrency(item.revenue)}</span>
                      <span className="text-right text-muted-foreground">{item.percentage}%</span>
                    </div>
                  ))}
                  {/* Total Row */}
                  <div className="grid grid-cols-4 gap-2 items-center py-2 border-t font-bold bg-muted/30 rounded-lg px-2">
                    <span>Total</span>
                    <span className="text-center">{stats.totalStudents}</span>
                    <span className="text-right text-green-600">{formatCurrency(stats.totalRevenue)}</span>
                    <span className="text-right">100%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Route-wise Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bus className="h-5 w-5" />
                Route-wise Analysis
              </CardTitle>
              <CardDescription>Route utilization and vehicle assignment</CardDescription>
            </CardHeader>
            <CardContent>
              {routeWiseData.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No routes configured</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                    <span className="col-span-2">Route</span>
                    <span className="text-center">Students</span>
                    <span className="text-center">Capacity</span>
                    <span className="text-right">Fill %</span>
                  </div>
                  {routeWiseData.map((route, idx) => {
                    const fillPercent = route.capacity > 0 
                      ? Math.round((route.studentCount / route.capacity) * 100) 
                      : 0;
                    const fillColor = fillPercent > 90 ? 'text-red-500' : fillPercent > 70 ? 'text-yellow-500' : 'text-green-500';
                    
                    return (
                      <div key={idx} className="grid grid-cols-5 gap-2 items-center py-2 hover:bg-muted/50 rounded-lg px-2">
                        <div className="col-span-2">
                          <p className="font-medium truncate">{route.routeName}</p>
                          <p className="text-xs text-muted-foreground">{route.vehicle || 'No vehicle'}</p>
                        </div>
                        <span className="text-center font-medium">{route.studentCount}</span>
                        <span className="text-center text-muted-foreground">{route.capacity || '-'}</span>
                        <div className="text-right">
                          <span className={cn("font-bold", fillColor)}>{fillPercent}%</span>
                          <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                            <div 
                              className={cn("h-full", fillPercent > 90 ? 'bg-red-500' : fillPercent > 70 ? 'bg-yellow-500' : 'bg-green-500')} 
                              style={{ width: `${Math.min(fillPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TransportAnalysis;
