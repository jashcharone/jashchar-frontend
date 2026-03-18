/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DRIVER DASHBOARD (REBUILT)
 * Functional driver portal with live trip data, student lists, attendance, SOS
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Bus, MapPin, Users, Clock, Navigation,
    AlertTriangle, CheckCircle, Play, Square,
    Phone, Route, ChevronRight, Calendar,
    FileText, Loader2, UserCheck, UserX
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/services/api';
import { toast } from 'sonner';

const DriverDashboard = () => {
    const { user, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const [loading, setLoading] = useState(true);
    const [driverInfo, setDriverInfo] = useState(null);
    const [todayTrips, setTodayTrips] = useState([]);
    const [activeTrip, setActiveTrip] = useState(null);
    const [tripStudents, setTripStudents] = useState([]);
    const [routeStops, setRouteStops] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [sosLoading, setSosLoading] = useState(false);
    const [incidentDesc, setIncidentDesc] = useState('');

    // ═══════════════════════════════════════════════════════════════
    // FETCH DRIVER DATA
    // ═══════════════════════════════════════════════════════════════
    const fetchDriverData = useCallback(async () => {
        if (!branchId || !user?.id) return;
        setLoading(true);
        try {
            // Get driver profile linked to this user
            const driverRes = await api.get('/transport/drivers', {
                params: { branchId, organizationId }
            });
            const drivers = driverRes.data?.data || [];
            const myDriver = drivers.find(d =>
                d.user_id === user.id || d.phone === user.profile?.phone
            );

            if (myDriver) {
                setDriverInfo(myDriver);

                // Get today's trips for this driver
                const tripsRes = await api.get('/transport/trips', {
                    params: { branchId, organizationId }
                });
                const allTrips = tripsRes.data?.data || [];
                const today = new Date().toISOString().split('T')[0];
                const myTrips = allTrips.filter(t =>
                    t.driver_id === myDriver.id &&
                    t.trip_date === today
                );
                setTodayTrips(myTrips);

                // Find active (in_progress) trip
                const active = myTrips.find(t => t.status === 'in_progress');
                setActiveTrip(active || null);

                // Get route stops if driver has assigned route
                if (myDriver.assigned_route_id) {
                    try {
                        const routeRes = await api.get(`/transport/routes/${myDriver.assigned_route_id}`, {
                            params: { branchId, organizationId }
                        });
                        if (routeRes.data?.data?.pickup_points) {
                            setRouteStops(routeRes.data.data.pickup_points);
                        }
                    } catch {}
                }

                // Get students on active trip for boarding
                if (active) {
                    try {
                        const boardRes = await api.get(`/transport/trips/${active.id}/boarding`, {
                            params: { branchId, organizationId }
                        });
                        setTripStudents(boardRes.data?.data || []);
                    } catch {}
                }
            }
        } catch (err) {
            console.error('Driver data fetch error:', err);
            toast.error('Failed to load driver data');
        } finally { setLoading(false); }
    }, [branchId, organizationId, user]);

    useEffect(() => { fetchDriverData(); }, [fetchDriverData]);

    // ═══════════════════════════════════════════════════════════════
    // TRIP ACTIONS
    // ═══════════════════════════════════════════════════════════════
    const handleStartTrip = async (tripId) => {
        try {
            await api.put(`/transport/trips/${tripId}/start`, { branchId, organizationId });
            toast.success('Trip started!');
            fetchDriverData();
        } catch { toast.error('Failed to start trip'); }
    };

    const handleEndTrip = async (tripId) => {
        try {
            await api.put(`/transport/trips/${tripId}/end`, { branchId, organizationId });
            toast.success('Trip completed!');
            fetchDriverData();
        } catch { toast.error('Failed to end trip'); }
    };

    // ═══════════════════════════════════════════════════════════════
    // BOARDING MARK
    // ═══════════════════════════════════════════════════════════════
    const handleMarkBoarding = async (studentId, status) => {
        if (!activeTrip) return;
        try {
            await api.post(`/transport/trips/${activeTrip.id}/boarding`, {
                student_id: studentId,
                boarding_status: status,
                boarding_time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                branchId, organizationId
            });
            toast.success(`Student marked ${status}`);
            // Refresh student list
            const boardRes = await api.get(`/transport/trips/${activeTrip.id}/boarding`, {
                params: { branchId, organizationId }
            });
            setTripStudents(boardRes.data?.data || []);
        } catch { toast.error('Failed to mark boarding'); }
    };

    // ═══════════════════════════════════════════════════════════════
    // SOS
    // ═══════════════════════════════════════════════════════════════
    const handleSOS = async () => {
        setSosLoading(true);
        try {
            // Try to get current GPS location
            let lat = null, lng = null;
            try {
                const pos = await new Promise((resolve, reject) =>
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
                );
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
            } catch {}

            await api.post('/transport/sos', {
                vehicle_id: driverInfo?.assigned_vehicle_id,
                trip_id: activeTrip?.id,
                triggered_by: user?.id,
                trigger_type: 'driver',
                latitude: lat,
                longitude: lng,
                description: 'Emergency SOS triggered by driver',
                branchId, organizationId
            });
            toast.success('🆘 SOS Alert sent to admin!');
        } catch { toast.error('Failed to send SOS'); }
        finally { setSosLoading(false); }
    };

    // ═══════════════════════════════════════════════════════════════
    // INCIDENT REPORT
    // ═══════════════════════════════════════════════════════════════
    const handleReportIncident = async () => {
        if (!incidentDesc.trim()) return toast.error('Enter description');
        try {
            await api.post('/transport/incidents', {
                vehicle_id: driverInfo?.assigned_vehicle_id,
                trip_id: activeTrip?.id,
                reported_by: user?.id,
                incident_type: 'other',
                severity: 'medium',
                description: incidentDesc,
                branchId, organizationId
            });
            toast.success('Incident reported');
            setIncidentDesc('');
        } catch { toast.error('Failed to report'); }
    };

    // Stats
    const completedTrips = todayTrips.filter(t => t.status === 'completed').length;
    const boardedCount = tripStudents.filter(s => s.boarding_status === 'boarded').length;
    const totalStudents = tripStudents.length;

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-4 space-y-4 max-w-4xl mx-auto">
                {/* ═══════ HEADER ═══════ */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Bus className="h-5 w-5 text-blue-600" />
                            Driver Dashboard
                        </h1>
                        <p className="text-sm text-gray-500">
                            Welcome, {driverInfo?.name || user?.profile?.full_name || 'Driver'}
                        </p>
                    </div>
                    {/* SOS BUTTON */}
                    <Button
                        variant="destructive"
                        size="lg"
                        className="rounded-full shadow-lg font-bold"
                        onClick={handleSOS}
                        disabled={sosLoading}
                    >
                        <AlertTriangle className="h-5 w-5 mr-1" />
                        {sosLoading ? 'Sending...' : '🆘 SOS'}
                    </Button>
                </div>

                {/* ═══════ VEHICLE INFO BANNER ═══════ */}
                {driverInfo && (
                    <Card className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200">
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-full bg-blue-500/20">
                                        <Bus className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">
                                            {driverInfo.assigned_vehicle?.vehicle_number || 'No Vehicle Assigned'}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            License: {driverInfo.license_number || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {activeTrip && (
                                        <Badge className="bg-green-100 text-green-700 animate-pulse">
                                            🟢 Trip Active
                                        </Badge>
                                    )}
                                    <Badge variant="outline">
                                        {completedTrips}/{todayTrips.length} Trips Done
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ═══════ STATS ═══════ */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: "Today's Trips", value: todayTrips.length, icon: Route, color: 'text-blue-600 bg-blue-50' },
                        { label: 'Completed', value: completedTrips, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
                        { label: 'Students', value: totalStudents, icon: Users, color: 'text-purple-600 bg-purple-50' },
                        { label: 'Boarded', value: boardedCount, icon: UserCheck, color: 'text-indigo-600 bg-indigo-50' }
                    ].map((s, i) => (
                        <Card key={i} className="shadow-sm">
                            <CardContent className="pt-3 pb-3 flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${s.color}`}><s.icon className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                                    <p className="text-xs text-gray-500">{s.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ═══════ TABS ═══════ */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    {[
                        { key: 'overview', label: '📋 Trips' },
                        { key: 'students', label: '👥 Students' },
                        { key: 'route', label: '🗺️ Route Stops' },
                        { key: 'report', label: '📝 Report' }
                    ].map(t => (
                        <button key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                                activeTab === t.key
                                    ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white'
                                    : 'text-gray-500'
                            }`}
                        >{t.label}</button>
                    ))}
                </div>

                {/* ═══════ TRIPS TAB ═══════ */}
                {activeTab === 'overview' && (
                    <div className="space-y-3">
                        {todayTrips.length === 0 ? (
                            <Card className="p-8 text-center">
                                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500">No trips scheduled for today</p>
                            </Card>
                        ) : (
                            todayTrips.map(trip => (
                                <Card key={trip.id} className={`shadow-sm ${
                                    trip.status === 'in_progress' ? 'border-green-300 ring-2 ring-green-100' : ''
                                }`}>
                                    <CardContent className="py-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-gray-900 dark:text-white capitalize">
                                                        {trip.trip_type} Trip
                                                    </h4>
                                                    <Badge className={
                                                        trip.status === 'in_progress' ? 'bg-green-100 text-green-700' :
                                                        trip.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                        trip.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }>
                                                        {trip.status?.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {trip.start_time && `${trip.start_time}`}
                                                    {trip.end_time && ` → ${trip.end_time}`}
                                                    {trip.transport_routes?.route_title && ` • ${trip.transport_routes.route_title}`}
                                                </p>
                                            </div>
                                            <div>
                                                {trip.status === 'scheduled' && (
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleStartTrip(trip.id)}
                                                    >
                                                        <Play className="h-4 w-4 mr-1" /> Start
                                                    </Button>
                                                )}
                                                {trip.status === 'in_progress' && (
                                                    <Button size="sm" variant="outline"
                                                        onClick={() => handleEndTrip(trip.id)}
                                                    >
                                                        <Square className="h-4 w-4 mr-1" /> End Trip
                                                    </Button>
                                                )}
                                                {trip.status === 'completed' && (
                                                    <CheckCircle className="h-6 w-6 text-green-500" />
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {/* ═══════ STUDENTS TAB (Boarding) ═══════ */}
                {activeTab === 'students' && (
                    <div className="space-y-2">
                        {!activeTrip ? (
                            <Card className="p-8 text-center">
                                <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500">Start a trip to see student list and mark attendance</p>
                            </Card>
                        ) : tripStudents.length === 0 ? (
                            <Card className="p-6 text-center text-gray-500">No students assigned</Card>
                        ) : (
                            tripStudents.map(student => (
                                <Card key={student.id} className="shadow-sm">
                                    <CardContent className="py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                                student.boarding_status === 'boarded'
                                                    ? 'bg-green-100 text-green-700'
                                                    : student.boarding_status === 'absent'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {student.boarding_status === 'boarded' ? '✅' :
                                                 student.boarding_status === 'absent' ? '❌' : '⚪'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-gray-900 dark:text-white">
                                                    {student.students?.full_name || student.students?.first_name || 'Student'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {student.students?.class_name || ''}
                                                    {student.boarding_time && ` • ${student.boarding_time}`}
                                                </p>
                                            </div>
                                        </div>
                                        {student.boarding_status !== 'boarded' && (
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="outline"
                                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                                    onClick={() => handleMarkBoarding(student.student_id, 'boarded')}
                                                >
                                                    <UserCheck className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="outline"
                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                    onClick={() => handleMarkBoarding(student.student_id, 'absent')}
                                                >
                                                    <UserX className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {/* ═══════ ROUTE STOPS TAB ═══════ */}
                {activeTab === 'route' && (
                    <Card>
                        <CardContent className="pt-4">
                            {routeStops.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                    <p>No route stops data available</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    {routeStops.map((stop, idx) => (
                                        <div key={stop.id || idx} className="flex gap-3 mb-1">
                                            <div className="flex flex-col items-center">
                                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                                    {stop.stop_order || idx + 1}
                                                </div>
                                                {idx < routeStops.length - 1 && (
                                                    <div className="w-0.5 h-8 bg-gray-200" />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-2">
                                                <p className="font-medium text-sm text-gray-900 dark:text-white">
                                                    {stop.pickup_point?.name || stop.name || 'Stop'}
                                                </p>
                                                <div className="flex gap-3 text-xs text-gray-500">
                                                    {stop.pickup_time && <span>⏰ {stop.pickup_time}</span>}
                                                    {stop.distance && <span>📏 {stop.distance} km</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* ═══════ REPORT TAB ═══════ */}
                {activeTab === 'report' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Report an Incident
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Textarea
                                placeholder="Describe the incident (breakdown, accident, delay, etc.)..."
                                value={incidentDesc}
                                onChange={e => setIncidentDesc(e.target.value)}
                                rows={4}
                            />
                            <Button onClick={handleReportIncident} className="w-full">
                                <AlertTriangle className="h-4 w-4 mr-1" /> Submit Report
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* ═══════ ADMIN CONTACT ═══════ */}
                <Card>
                    <CardContent className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">Contact Admin</span>
                        </div>
                        <a href="tel:+919876543210"
                            className="text-blue-600 text-sm font-medium hover:underline"
                        >
                            📞 Call Admin Office
                        </a>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default DriverDashboard;
