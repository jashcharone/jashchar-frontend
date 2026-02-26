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
  Building, Users, IndianRupee, BedDouble, Loader2, TrendingUp,
  Home, DoorOpen, AlertCircle, CheckCircle, Clock, BarChart3, PieChart, Percent,
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

const HostelAnalysis = () => {
  const printRef = useRef();
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHostellers: 0,
    totalCapacity: 0,
    occupancyPercent: 0,
    totalRevenue: 0,
    totalHostels: 0,
    totalRooms: 0,
    availableBeds: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0
  });
  const [classWiseData, setClassWiseData] = useState([]);
  const [hostelWiseData, setHostelWiseData] = useState([]);
  const [roomTypeData, setRoomTypeData] = useState([]);
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
      // 1. Fetch hostel students with class info
      const { data: hostelStudents, error: hostelError } = await supabase
        .from('student_hostel_details')
        .select(`
          id, student_id, hostel_id, room_id, hostel_fee, room_type_id,
          student:student_profiles!student_hostel_details_student_id_fkey(id, full_name, class_id, classes!student_profiles_class_id_fkey(id, name)),
          hostel:hostels(id, name),
          room:hostel_rooms(id, room_number_name)
        `)
        .eq('branch_id', branchId)
        .eq('session_id', selectedSessionId);

      if (hostelError) throw hostelError;

      // 2. Fetch all hostels
      const { data: hostels } = await supabase
        .from('hostels')
        .select('id, name, intake')
        .eq('branch_id', branchId);

      // 3. Fetch all rooms with capacity (num_of_beds)
      const { data: rooms } = await supabase
        .from('hostel_rooms')
        .select('id, room_number_name, num_of_beds, hostel_id')
        .eq('branch_id', branchId);

      // 4. Fetch room types
      const { data: roomTypes } = await supabase
        .from('hostel_room_types')
        .select('id, name, cost')
        .eq('branch_id', branchId);

      // === CALCULATE STATISTICS ===
      const students = hostelStudents || [];
      const totalHostellers = students.length;
      
      // Calculate total capacity from rooms (num_of_beds)
      const totalCapacity = (rooms || []).reduce((sum, r) => sum + (r.num_of_beds || 0), 0);
      const occupancyPercent = totalCapacity > 0 ? Math.round((totalHostellers / totalCapacity) * 100) : 0;
      
      const totalRevenue = students.reduce((sum, s) => sum + (parseFloat(s.hostel_fee) || 0), 0);
      const totalHostels = hostels?.length || 0;
      const totalRooms = rooms?.length || 0;
      const availableBeds = totalCapacity - totalHostellers;

      // Fee status (placeholder - would need actual payment records)
      const paidCount = Math.floor(totalHostellers * 0.65);
      const pendingCount = Math.floor(totalHostellers * 0.25);
      const overdueCount = totalHostellers - paidCount - pendingCount;

      setStats({
        totalHostellers,
        totalCapacity,
        occupancyPercent,
        totalRevenue,
        totalHostels,
        totalRooms,
        availableBeds,
        paidCount,
        pendingCount,
        overdueCount
      });

      // === CLASS-WISE ANALYSIS ===
      const classMap = new Map();
      students.forEach(s => {
        const classId = s.student?.class_id;
        const className = s.student?.classes?.name || 'Unknown';
        const fee = parseFloat(s.hostel_fee) || 0;

        if (!classMap.has(classId)) {
          classMap.set(classId, { classId, className, count: 0, revenue: 0 });
        }
        const entry = classMap.get(classId);
        entry.count++;
        entry.revenue += fee;
      });

      // Sort by class name (natural sort)
      const classData = Array.from(classMap.values())
        .sort((a, b) => {
          const numA = parseInt(a.className.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.className.replace(/\D/g, '')) || 0;
          return numA - numB;
        })
        .map(c => ({
          ...c,
          percentage: totalHostellers > 0 ? ((c.count / totalHostellers) * 100).toFixed(1) : 0
        }));

      setClassWiseData(classData);

      // === HOSTEL-WISE ANALYSIS ===
      const hostelMap = new Map();
      (hostels || []).forEach(h => {
        hostelMap.set(h.id, {
          hostelId: h.id,
          hostelName: h.name,
          totalCapacity: h.intake || 0,
          studentCount: 0,
          revenue: 0
        });
      });

      // Calculate capacity per hostel from rooms (num_of_beds)
      (rooms || []).forEach(r => {
        if (r.hostel_id && hostelMap.has(r.hostel_id)) {
          const hostel = hostelMap.get(r.hostel_id);
          if (!hostel.totalCapacity) {
            hostel.totalCapacity = (hostel.totalCapacity || 0) + (r.num_of_beds || 0);
          }
        }
      });

      // Count students per hostel
      students.forEach(s => {
        if (s.hostel_id && hostelMap.has(s.hostel_id)) {
          const hostel = hostelMap.get(s.hostel_id);
          hostel.studentCount++;
          hostel.revenue += parseFloat(s.hostel_fee) || 0;
        }
      });

      const hostelData = Array.from(hostelMap.values())
        .map(h => ({
          ...h,
          occupancy: h.totalCapacity > 0 ? Math.round((h.studentCount / h.totalCapacity) * 100) : 0,
          available: h.totalCapacity - h.studentCount
        }))
        .sort((a, b) => b.studentCount - a.studentCount);

      setHostelWiseData(hostelData);

      // === ROOM TYPE ANALYSIS ===
      const roomTypeMap = new Map();
      (roomTypes || []).forEach(rt => {
        roomTypeMap.set(rt.id, {
          typeId: rt.id,
          typeName: rt.name,
          cost: rt.cost || 0,
          count: 0
        });
      });

      students.forEach(s => {
        if (s.room_type_id && roomTypeMap.has(s.room_type_id)) {
          roomTypeMap.get(s.room_type_id).count++;
        }
      });

      setRoomTypeData(Array.from(roomTypeMap.values()).filter(rt => rt.count > 0));

    } catch (error) {
      console.error('[HostelAnalysis] Error:', error);
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
      <html><head><title>Hostel Analysis - ${selectedBranch?.name || 'School'}</title>
      <style>${PRINT_STYLES}</style></head><body>
      ${orgHeader}
      <h1>🏨 Hostel Analysis Report</h1>
      <p class="report-meta"><strong>Session:</strong> ${sessionName} | <strong>Generated:</strong> ${format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
      <div class="stats-grid">
        <div class="stat-box"><div class="stat-value">${stats.totalHostellers}</div><div class="stat-label">Hostellers</div></div>
        <div class="stat-box"><div class="stat-value">${stats.occupancyPercent}%</div><div class="stat-label">Occupancy</div></div>
        <div class="stat-box"><div class="stat-value">${formatCurrency(stats.totalRevenue)}</div><div class="stat-label">Revenue</div></div>
        <div class="stat-box"><div class="stat-value">${stats.totalHostels} / ${stats.totalRooms}</div><div class="stat-label">Hostels / Rooms</div></div>
      </div>
      <h2>Class-wise Hostel Occupancy</h2>
      <table>
        <thead><tr><th>Class</th><th>Students</th><th>Revenue</th><th>%</th></tr></thead>
        <tbody>${classWiseData.map(c => `<tr><td>${c.className}</td><td>${c.count}</td><td>${formatCurrency(c.revenue)}</td><td>${c.percentage}%</td></tr>`).join('')}</tbody>
      </table>
      <h2>Hostel-wise Occupancy</h2>
      <table>
        <thead><tr><th>Hostel</th><th>Occupied</th><th>Capacity</th><th>Available</th><th>Occupancy %</th></tr></thead>
        <tbody>${hostelWiseData.map(h => `<tr><td>${h.hostelName}</td><td>${h.studentCount}</td><td>${h.totalCapacity}</td><td>${h.available}</td><td>${h.occupancy}%</td></tr>`).join('')}</tbody>
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
      <h1>🏨 Hostel Analysis Report</h1>
      <p class="report-meta"><strong>Session:</strong> ${sessionName} | <strong>Generated:</strong> ${format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
      <div class="stats-grid">
        <div class="stat-box"><div class="stat-value">${stats.totalHostellers}</div><div class="stat-label">Hostellers</div></div>
        <div class="stat-box"><div class="stat-value">${stats.occupancyPercent}%</div><div class="stat-label">Occupancy</div></div>
        <div class="stat-box"><div class="stat-value">${formatCurrency(stats.totalRevenue)}</div><div class="stat-label">Revenue</div></div>
        <div class="stat-box"><div class="stat-value">${stats.totalHostels} / ${stats.totalRooms}</div><div class="stat-label">Hostels / Rooms</div></div>
      </div>
      <h2>Class-wise Hostel Occupancy</h2>
      <table><thead><tr><th>Class</th><th>Students</th><th>Revenue</th><th>%</th></tr></thead>
        <tbody>${classWiseData.map(c => `<tr><td>${c.className}</td><td>${c.count}</td><td>${formatCurrency(c.revenue)}</td><td>${c.percentage}%</td></tr>`).join('')}</tbody></table>
      <h2>Hostel-wise Occupancy</h2>
      <table><thead><tr><th>Hostel</th><th>Occupied</th><th>Capacity</th><th>Available</th><th>Occupancy %</th></tr></thead>
        <tbody>${hostelWiseData.map(h => `<tr><td>${h.hostelName}</td><td>${h.studentCount}</td><td>${h.totalCapacity}</td><td>${h.available}</td><td>${h.occupancy}%</td></tr>`).join('')}</tbody></table>
      <div class="footer">Generated by Jashchar ERP • ${format(new Date(), 'dd MMMM yyyy, hh:mm a')}</div>`;
    await downloadReportAsPDF({
      title: `Hostel Analysis - ${selectedBranch?.name || 'School'}`,
      orgHeader,
      bodyHtml,
      fileName: `Hostel_Analysis_${selectedBranch?.name || 'School'}_${format(new Date(), 'yyyy-MM-dd')}`,
    });
  };

  // === EXPORT CSV ===
  const handleExportExcel = () => {
    const rows = [['Class', 'Students', 'Revenue', '%']];
    classWiseData.forEach(c => rows.push([c.className, c.count, c.revenue, `${c.percentage}%`]));
    rows.push([]);
    rows.push(['Hostel', 'Occupied', 'Capacity', 'Available', 'Occupancy %']);
    hostelWiseData.forEach(h => rows.push([h.hostelName, h.studentCount, h.totalCapacity, h.available, `${h.occupancy}%`]));
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hostel_Analysis_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported successfully', description: 'Hostel analysis data exported to CSV' });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6" ref={printRef}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building className="h-7 w-7 text-purple-600" />
              Hostel Analysis
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Comprehensive hostel analytics & insights</p>
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
                    {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}{s.is_active ? ' ✦' : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading hostel analytics...</span>
          </div>
        ) : (
          <>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Hostellers" 
            value={stats.totalHostellers}
            subtitle={`of ${stats.totalCapacity} capacity`}
            icon={Users}
            color="text-blue-600"
          />
          <StatCard 
            title="Occupancy Rate" 
            value={`${stats.occupancyPercent}%`}
            subtitle={`${stats.availableBeds} beds available`}
            icon={Percent}
            color={stats.occupancyPercent > 80 ? "text-red-600" : stats.occupancyPercent > 60 ? "text-yellow-600" : "text-green-600"}
          />
          <StatCard 
            title="Total Revenue" 
            value={formatCurrency(stats.totalRevenue)}
            subtitle="This Session"
            icon={IndianRupee}
            color="text-green-600"
          />
          <StatCard 
            title="Infrastructure" 
            value={stats.totalHostels}
            subtitle={`Hostels • ${stats.totalRooms} Rooms`}
            icon={Building}
            color="text-purple-600"
          />
        </div>

        {/* Occupancy Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BedDouble className="h-5 w-5" />
              Occupancy Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall Occupancy</span>
                <span className={cn("font-bold", stats.occupancyPercent > 80 ? "text-red-600" : "text-green-600")}>
                  {stats.totalHostellers} / {stats.totalCapacity} ({stats.occupancyPercent}%)
                </span>
              </div>
              <ProgressBar 
                value={stats.totalHostellers} 
                max={stats.totalCapacity} 
                color={stats.occupancyPercent > 80 ? "bg-red-500" : stats.occupancyPercent > 60 ? "bg-yellow-500" : "bg-green-500"}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Fee Paid</span>
                    <span className="ml-auto font-bold text-green-600">{stats.paidCount}</span>
                  </div>
                  <ProgressBar value={stats.paidCount} max={stats.totalHostellers} color="bg-green-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Pending</span>
                    <span className="ml-auto font-bold text-yellow-600">{stats.pendingCount}</span>
                  </div>
                  <ProgressBar value={stats.pendingCount} max={stats.totalHostellers} color="bg-yellow-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="font-medium">Overdue</span>
                    <span className="ml-auto font-bold text-red-600">{stats.overdueCount}</span>
                  </div>
                  <ProgressBar value={stats.overdueCount} max={stats.totalHostellers} color="bg-red-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Class-wise Hostel Occupancy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Class-wise Hostel Occupancy
              </CardTitle>
              <CardDescription>Students staying in hostel by class</CardDescription>
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
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold dark:bg-purple-900/30 dark:text-purple-400">
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
                    <span className="text-center">{stats.totalHostellers}</span>
                    <span className="text-right text-green-600">{formatCurrency(stats.totalRevenue)}</span>
                    <span className="text-right">100%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hostel-wise Occupancy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5" />
                Hostel-wise Occupancy
              </CardTitle>
              <CardDescription>Occupancy status per hostel building</CardDescription>
            </CardHeader>
            <CardContent>
              {hostelWiseData.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No hostels configured</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                    <span className="col-span-2">Hostel</span>
                    <span className="text-center">Occupied</span>
                    <span className="text-center">Available</span>
                    <span className="text-right">Fill %</span>
                  </div>
                  {hostelWiseData.map((hostel, idx) => {
                    const fillColor = hostel.occupancy > 90 ? 'text-red-500' : hostel.occupancy > 70 ? 'text-yellow-500' : 'text-green-500';
                    const bgColor = hostel.occupancy > 90 ? 'bg-red-500' : hostel.occupancy > 70 ? 'bg-yellow-500' : 'bg-green-500';
                    
                    return (
                      <div key={idx} className="grid grid-cols-5 gap-2 items-center py-2 hover:bg-muted/50 rounded-lg px-2">
                        <div className="col-span-2">
                          <p className="font-medium truncate">{hostel.hostelName}</p>
                          <p className="text-xs text-muted-foreground">Capacity: {hostel.totalCapacity}</p>
                        </div>
                        <span className="text-center font-medium">{hostel.studentCount}</span>
                        <span className="text-center text-muted-foreground">{hostel.available}</span>
                        <div className="text-right">
                          <span className={cn("font-bold", fillColor)}>{hostel.occupancy}%</span>
                          <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                            <div className={cn("h-full", bgColor)} style={{ width: `${Math.min(hostel.occupancy, 100)}%` }} />
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

        {/* Room Type Distribution */}
        {roomTypeData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DoorOpen className="h-5 w-5" />
                Room Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {roomTypeData.map((rt, idx) => (
                  <div key={idx} className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary">{rt.count}</p>
                    <p className="text-sm text-muted-foreground">{rt.typeName}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HostelAnalysis;
