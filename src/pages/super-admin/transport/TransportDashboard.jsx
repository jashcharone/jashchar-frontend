import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { formatDate, getMonthShortName } from '@/utils/dateUtils';
import { ROUTES } from '@/registry/routeRegistry';
import {
  Loader2, Bus, Route, Users, UserCheck, AlertTriangle, Wrench, Fuel, Clock,
  CheckCircle, Play, ArrowRight, IndianRupee, TrendingUp, Calendar, Shield
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const TransportDashboard = () => {
  const navigate = useNavigate();
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    vehicles: [], routes: [], drivers: [], students: [],
    trips: [], maintenance: [], fuelLogs: [], incidents: []
  });

  const today = new Date().toISOString().split('T')[0];

  const fetchAll = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);

    const [vehiclesRes, routesRes, driversRes, studentsRes, tripsRes, maintenanceRes, fuelRes, incidentsRes] = await Promise.all([
      supabase.from('transport_vehicles').select('id, vehicle_number, vehicle_type, capacity, status').eq('branch_id', branchId),
      supabase.from('transport_routes').select('id, route_title, is_active').eq('branch_id', branchId),
      supabase.from('transport_drivers').select('id, driver_name, is_active').eq('branch_id', branchId),
      supabase.from('student_transport_details').select('id, student_id, route_id, is_active').eq('branch_id', branchId).eq('session_id', currentSessionId),
      supabase.from('transport_trips').select('id, trip_date, trip_type, status, vehicle_id, total_students, boarded_students').eq('branch_id', branchId).eq('session_id', currentSessionId),
      supabase.from('transport_vehicle_maintenance').select('id, vehicle_id, status, scheduled_date, cost').eq('branch_id', branchId),
      supabase.from('transport_fuel_logs').select('id, vehicle_id, fuel_date, total_cost, quantity_liters').eq('branch_id', branchId),
      supabase.from('transport_incidents').select('id, incident_type, severity, status, incident_date').eq('branch_id', branchId)
    ]);

    setData({
      vehicles: vehiclesRes.data || [],
      routes: routesRes.data || [],
      drivers: driversRes.data || [],
      students: studentsRes.data || [],
      trips: tripsRes.data || [],
      maintenance: maintenanceRes.data || [],
      fuelLogs: fuelRes.data || [],
      incidents: incidentsRes.data || []
    });
    setLoading(false);
  }, [branchId, currentSessionId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Quick Stats
  const quickStats = useMemo(() => {
    const activeVehicles = data.vehicles.filter(v => v.status === 'active').length;
    const totalVehicles = data.vehicles.length;
    const activeRoutes = data.routes.filter(r => r.is_active !== false).length;
    const totalStudents = data.students.filter(s => s.is_active !== false).length;
    const activeDrivers = data.drivers.filter(d => d.is_active).length;

    const todayTrips = data.trips.filter(t => t.trip_date === today);
    const tripsCompleted = todayTrips.filter(t => t.status === 'completed').length;
    const tripsInProgress = todayTrips.filter(t => t.status === 'in_progress').length;
    const tripsScheduled = todayTrips.filter(t => t.status === 'scheduled').length;

    const openIncidents = data.incidents.filter(i => i.status === 'reported' || i.status === 'investigating').length;

    return {
      activeVehicles, totalVehicles, activeRoutes, totalStudents, activeDrivers,
      todayTrips: todayTrips.length, tripsCompleted, tripsInProgress, tripsScheduled, openIncidents
    };
  }, [data, today]);

  // Alerts
  const alerts = useMemo(() => {
    const alertList = [];

    // Overdue maintenance
    const overdueMaint = data.maintenance.filter(m => m.status === 'scheduled' && m.scheduled_date < today);
    overdueMaint.forEach(m => alertList.push({ type: 'warning', icon: '🔧', message: `Maintenance overdue`, id: m.id }));

    // Critical incidents
    const criticalIncidents = data.incidents.filter(i => i.severity === 'critical' && i.status !== 'closed' && i.status !== 'resolved');
    criticalIncidents.forEach(i => alertList.push({ type: 'danger', icon: '🔴', message: `Critical incident open`, id: i.id }));

    // Inactive vehicles with students assigned
    const inactiveVehicles = data.vehicles.filter(v => v.status !== 'active');
    inactiveVehicles.forEach(v => alertList.push({ type: 'info', icon: '🚗', message: `${v.vehicle_number} is ${v.status}`, id: v.id }));

    return alertList.slice(0, 8);
  }, [data, today]);

  // Route-wise student distribution (Pie chart)
  const routeDistribution = useMemo(() => {
    const routeMap = {};
    data.students.forEach(s => {
      if (s.route_id) {
        const route = data.routes.find(r => r.id === s.route_id);
        const name = route?.route_title || 'Unknown';
        routeMap[name] = (routeMap[name] || 0) + 1;
      }
    });
    return Object.entries(routeMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [data]);

  // Monthly fuel cost (Bar chart)
  const monthlyFuelCost = useMemo(() => {
    const monthMap = {};
    data.fuelLogs.forEach(l => {
      const month = l.fuel_date?.substring(0, 7);
      if (month) {
        if (!monthMap[month]) monthMap[month] = 0;
        monthMap[month] += parseFloat(l.total_cost) || 0;
      }
    });
    return Object.entries(monthMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, cost]) => ({
        month: getMonthShortName(month + '-01'),
        cost: Math.round(cost)
      }));
  }, [data]);

  // Monthly maintenance cost
  const monthlyMaintenanceCost = useMemo(() => {
    const monthMap = {};
    data.maintenance.filter(m => m.status === 'completed' && m.cost).forEach(m => {
      const month = m.scheduled_date?.substring(0, 7);
      if (month) {
        if (!monthMap[month]) monthMap[month] = 0;
        monthMap[month] += parseFloat(m.cost) || 0;
      }
    });
    return Object.entries(monthMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, cost]) => ({
        month: getMonthShortName(month + '-01'),
        cost: Math.round(cost)
      }));
  }, [data]);

  // Today's trips breakdown
  const todayTrips = useMemo(() => {
    return data.trips.filter(t => t.trip_date === today);
  }, [data, today]);

  const morningTrips = todayTrips.filter(t => t.trip_type === 'morning_pickup');
  const eveningTrips = todayTrips.filter(t => t.trip_type === 'afternoon_drop' || t.trip_type === 'evening_drop');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">🚍 Transport Intelligence Dashboard</h1>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard icon={<Bus className="h-5 w-5 text-blue-500" />} label="Vehicles" value={`${quickStats.activeVehicles}/${quickStats.totalVehicles}`} sub="Active" onClick={() => navigate(ROUTES.SUPER_ADMIN.TRANSPORT_VEHICLES)} />
          <StatCard icon={<Route className="h-5 w-5 text-green-500" />} label="Routes" value={quickStats.activeRoutes} sub="Active" onClick={() => navigate(ROUTES.SUPER_ADMIN.TRANSPORT_ROUTES)} />
          <StatCard icon={<Users className="h-5 w-5 text-purple-500" />} label="Students" value={quickStats.totalStudents} sub="Transport" onClick={() => navigate(ROUTES.SUPER_ADMIN.STUDENT_TRANSPORT_FEES)} />
          <StatCard icon={<UserCheck className="h-5 w-5 text-indigo-500" />} label="Drivers" value={quickStats.activeDrivers} sub="On Duty" onClick={() => navigate(ROUTES.SUPER_ADMIN.TRANSPORT_DRIVERS)} />
          <StatCard icon={<Calendar className="h-5 w-5 text-orange-500" />} label="Today's Trips" value={quickStats.todayTrips} sub={`✅${quickStats.tripsCompleted} 🟡${quickStats.tripsInProgress} ⏳${quickStats.tripsScheduled}`} onClick={() => navigate(ROUTES.SUPER_ADMIN.TRANSPORT_TRIPS)} />
          <StatCard icon={<AlertTriangle className="h-5 w-5 text-red-500" />} label="Open Alerts" value={quickStats.openIncidents} sub="Incidents" highlight={quickStats.openIncidents > 0} onClick={() => navigate(ROUTES.SUPER_ADMIN.TRANSPORT_INCIDENTS)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Today's Operations */}
          <div className="bg-card rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Clock className="h-4 w-4" /> Today's Operations</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-2">🌅 Morning Pickup</p>
                {morningTrips.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No morning trips scheduled</p>
                ) : (
                  <div className="space-y-1">
                    {morningTrips.map(t => (
                      <div key={t.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50">
                        <span>Trip #{t.id.substring(0, 6)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          t.status === 'completed' ? 'bg-green-100 text-green-800' :
                          t.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {t.status === 'completed' ? '✅' : t.status === 'in_progress' ? '🟡' : '⏳'} {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-2">🌇 Drop</p>
                {eveningTrips.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No drop trips scheduled</p>
                ) : (
                  <div className="space-y-1">
                    {eveningTrips.map(t => (
                      <div key={t.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50">
                        <span>Trip #{t.id.substring(0, 6)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          t.status === 'completed' ? 'bg-green-100 text-green-800' :
                          t.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {t.status === 'completed' ? '✅' : t.status === 'in_progress' ? '🟡' : '⏳'} {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => navigate(ROUTES.SUPER_ADMIN.TRANSPORT_TRIPS)}>
                View All Trips <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Alerts Panel */}
          <div className="bg-card rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /> Active Alerts</h3>
            {alerts.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">All clear! No active alerts.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {alerts.map((alert, idx) => (
                  <div key={idx} className={`flex items-center gap-2 text-xs p-2 rounded ${
                    alert.type === 'danger' ? 'bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-400' :
                    alert.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-400' :
                    'bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-400'
                  }`}>
                    <span>{alert.icon}</span>
                    <span>{alert.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Play className="h-4 w-4" /> Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1" onClick={() => navigate(ROUTES.SUPER_ADMIN.TRANSPORT_TRIPS)}>
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Schedule Trip</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1" onClick={() => navigate(ROUTES.SUPER_ADMIN.TRANSPORT_INCIDENTS)}>
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs">Report Incident</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1" onClick={() => navigate(ROUTES.SUPER_ADMIN.TRANSPORT_MAINTENANCE)}>
                <Wrench className="h-4 w-4" />
                <span className="text-xs">Maintenance</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1" onClick={() => navigate(ROUTES.SUPER_ADMIN.TRANSPORT_FUEL)}>
                <Fuel className="h-4 w-4" />
                <span className="text-xs">Fuel Log</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1" onClick={() => navigate(ROUTES.SUPER_ADMIN.TRANSPORT_BOARDING)}>
                <UserCheck className="h-4 w-4" />
                <span className="text-xs">Attendance</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto py-3 flex-col gap-1" onClick={() => navigate(ROUTES.SUPER_ADMIN.STUDENT_TRANSPORT_FEES)}>
                <Users className="h-4 w-4" />
                <span className="text-xs">Allocate Student</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Route-wise Student Distribution */}
          <div className="bg-card rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-semibold mb-4">📊 Route-wise Student Distribution</h3>
            {routeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={routeDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {routeDistribution.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-8">No data available</p>}
          </div>

          {/* Monthly Fuel Cost */}
          <div className="bg-card rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-semibold mb-4">⛽ Monthly Fuel Cost</h3>
            {monthlyFuelCost.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyFuelCost}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                  <Bar dataKey="cost" fill="#f59e0b" name="Cost (₹)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-8">No fuel data yet</p>}
          </div>
        </div>

        {/* Maintenance Cost Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-semibold mb-4">🔧 Monthly Maintenance Cost</h3>
            {monthlyMaintenanceCost.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyMaintenanceCost}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                  <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} name="Cost (₹)" />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-8">No maintenance data yet</p>}
          </div>

          {/* Vehicle Utilization */}
          <div className="bg-card rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-semibold mb-4">🚗 Vehicle Status</h3>
            <div className="space-y-2">
              {data.vehicles.map(v => {
                const studentsOnVehicle = data.students.filter(s => {
                  const trip = data.trips.find(t => t.vehicle_id === v.id && t.trip_date === today);
                  return trip;
                }).length;
                return (
                  <div key={v.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${v.status === 'active' ? 'bg-green-500' : v.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                      <span className="font-medium">{v.vehicle_number}</span>
                      <span className="text-xs text-muted-foreground">{v.vehicle_type}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      v.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400'
                    }`}>{v.status}</span>
                  </div>
                );
              })}
              {data.vehicles.length === 0 && <p className="text-center text-muted-foreground text-xs py-4">No vehicles registered</p>}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, sub, highlight, onClick }) => (
  <div className={`bg-card rounded-xl shadow p-4 cursor-pointer hover:shadow-md transition-shadow ${
    highlight ? 'border-l-4 border-red-500 animate-pulse' : 'border-l-4 border-transparent'
  }`} onClick={onClick}>
    <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{sub}</p>
  </div>
);

export default TransportDashboard;
