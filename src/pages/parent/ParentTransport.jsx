/**
 * ParentTransport - Enhanced child transport view with live tracking
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ChildSelector from '@/components/ChildSelector';
import { useParentChild } from '@/contexts/ParentChildContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDateWithMonthName } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Bus, MapPin, Clock, Phone, Navigation, User,
  CheckCircle, XCircle, AlertTriangle, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';

const ParentTransport = () => {
  const { selectedChild } = useParentChild();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [routeDetails, setRouteDetails] = useState(null);
  const [pickupPoints, setPickupPoints] = useState([]);
  const [driverDetails, setDriverDetails] = useState(null);
  const [boardingHistory, setBoardingHistory] = useState([]);
  const [todayBoarding, setTodayBoarding] = useState(null);
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════
  // FETCH TRANSPORT DETAILS
  // ═══════════════════════════════════════════════════════════════
  const fetchTransportDetails = useCallback(async () => {
    if (!selectedChild?.id || !selectedChild?.branch_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get student's transport assignment
      const { data: transportData, error: transportError } = await supabase
        .from('student_transport_details')
        .select(`
          transport_route_id,
          transport_pickup_point_id,
          vehicle_number,
          driver_name,
          driver_contact,
          pickup_time,
          drop_time
        `)
        .eq('student_id', selectedChild.id)
        .eq('branch_id', selectedChild.branch_id)
        .single();

      if (transportError || !transportData) {
        if (transportError && transportError.code !== 'PGRST116') throw transportError;
        setRouteDetails(null);
        setLoading(false);
        return;
      }

      // Get route info
      const { data: routeData, error: routeError } = await supabase
        .from('transport_routes')
        .select('route_title, start_point, end_point, distance_km, estimated_time_minutes')
        .eq('id', transportData.transport_route_id)
        .single();
      if (routeError) throw routeError;

      // Get pickup points
      const { data: pointsData, error: pointsError } = await supabase
        .from('route_pickup_point_mappings')
        .select(`
          id, distance, pickup_time, stop_order,
          pickup_point:transport_pickup_points(id, name, latitude, longitude)
        `)
        .eq('route_id', transportData.transport_route_id)
        .order('stop_order', { ascending: true });
      if (pointsError) throw pointsError;

      // Use driver info from transport_details directly (stored at time of assignment)
      if (transportData.driver_name || transportData.driver_contact) {
        setDriverDetails({
          name: transportData.driver_name,
          phone: transportData.driver_contact
        });
      }

      // Get today's boarding status
      const today = new Date().toISOString().split('T')[0];
      const { data: boardingData } = await supabase
        .from('transport_boarding_attendance')
        .select('*')
        .eq('student_id', selectedChild.id)
        .gte('boarding_time', `${today}T00:00:00`)
        .lte('boarding_time', `${today}T23:59:59`)
        .order('created_at', { ascending: false })
        .limit(1);
      setTodayBoarding(boardingData?.[0] || null);

      // Get boarding history (last 30 records)
      const { data: historyData } = await supabase
        .from('transport_boarding_attendance')
        .select('boarding_time, status, boarding_type')
        .eq('student_id', selectedChild.id)
        .eq('branch_id', selectedChild.branch_id)
        .order('boarding_time', { ascending: false })
        .limit(30);
      setBoardingHistory(historyData || []);

      // Vehicle location - GPS tracking columns not yet implemented in transport_vehicles table
      // Future: Add gps_latitude, gps_longitude, gps_speed, gps_last_update columns
      // For now, live tracking is disabled

      setRouteDetails({
        ...routeData,
        ...transportData,
        student_pickup_point_id: transportData.transport_pickup_point_id
      });
      setPickupPoints(pointsData || []);
    } catch (error) {
      console.error('Error fetching transport details:', error);
      toast({ variant: 'destructive', title: 'Failed to fetch transport details', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [selectedChild, toast]);

  useEffect(() => { fetchTransportDetails(); }, [fetchTransportDetails]);

  // Auto-refresh vehicle location every 15s - DISABLED until GPS tracking columns are added
  // useEffect(() => {
  //   if (autoRefresh && routeDetails?.vehicle_number) {
  //     intervalRef.current = setInterval(async () => {
  //       // GPS tracking query - needs: gps_latitude, gps_longitude, gps_speed, gps_last_update columns
  //     }, 15000);
  //   }
  //   return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // }, [autoRefresh, routeDetails]);

  const childName = selectedChild ? (selectedChild.full_name || `${selectedChild.first_name} ${selectedChild.last_name}`) : '';
  const childClass = selectedChild?.class_name ? `${selectedChild.class_name}${selectedChild.section_name ? `-${selectedChild.section_name}` : ''}` : '';

  // ETA calculation (simple: distance-based)
  const getETA = () => {
    if (!vehicleLocation?.lat || !vehicleLocation?.speed) return null;
    const myStop = pickupPoints.find(p => p.pickup_point?.id === routeDetails?.student_pickup_point_id);
    if (!myStop?.pickup_time) return null;
    return myStop.pickup_time;
  };

  const getMinutesSinceUpdate = () => {
    if (!vehicleLocation?.lastTime) return null;
    return Math.round((Date.now() - new Date(vehicleLocation.lastTime).getTime()) / 60000);
  };

  const minutesSince = getMinutesSinceUpdate();
  const isLive = minutesSince !== null && minutesSince < 10;

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bus className="h-5 w-5 text-blue-600" /> My Child's Transport
          </h1>
          <Button variant="outline" size="sm" onClick={fetchTransportDetails}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <ChildSelector />

        {!selectedChild ? (
          <Card className="p-8 text-center text-muted-foreground">No child selected</Card>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !routeDetails ? (
          <Card className="p-8 text-center">
            <Bus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Transport Assigned</h3>
            <p className="text-muted-foreground">
              {childName} does not have any transport route assigned.
              Contact the school administration for transport enrollment.
            </p>
          </Card>
        ) : (
          <>
            {/* ═══ Child + Route Summary Card ═══ */}
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-lg text-gray-900 dark:text-white">{childName}</p>
                    {childClass && <p className="text-sm text-gray-500">Class: {childClass}</p>}
                  </div>
                  {isLive && (
                    <Badge className="bg-green-100 text-green-700 animate-pulse">
                      🟢 Live
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Navigation className="h-3.5 w-3.5" />
                    Route: <strong>{routeDetails.route_title}</strong>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin className="h-3.5 w-3.5" />
                    Stop: <strong>{pickupPoints.find(p => p.pickup_point?.id === routeDetails.student_pickup_point_id)?.pickup_point?.name || 'N/A'}</strong>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="h-3.5 w-3.5" />
                    Pickup: <strong>{getETA() || 'N/A'}</strong>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Bus className="h-3.5 w-3.5" />
                    Bus: <strong>{routeDetails.vehicle?.vehicle_number || 'N/A'}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ═══ Live Bus Status ═══ */}
            {vehicleLocation?.lat && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold flex items-center gap-1">
                      <Navigation className="h-4 w-4 text-blue-600" /> Bus Location
                    </h3>
                    {minutesSince !== null && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        minutesSince < 5 ? 'bg-green-100 text-green-700' :
                        minutesSince < 15 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {minutesSince < 1 ? 'Just now' : `${minutesSince}m ago`}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xl font-bold">{vehicleLocation.speed?.toFixed(0) || 0}</p>
                      <p className="text-xs text-gray-500">km/h Speed</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xl font-bold">
                        {isLive
                          ? vehicleLocation.speed > 3 ? '🟢' : '🟡'
                          : '⚪'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isLive
                          ? vehicleLocation.speed > 3 ? 'Moving' : 'Stopped'
                          : 'Offline'}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xl font-bold">{routeDetails.vehicle?.capacity || '-'}</p>
                      <p className="text-xs text-gray-500">Seat Capacity</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ═══ Today's Boarding Status ═══ */}
            <Card className={todayBoarding?.boarding_status === 'boarded'
              ? 'border-green-200 bg-green-50/50'
              : todayBoarding?.boarding_status === 'absent'
                ? 'border-red-200 bg-red-50/50'
                : ''
            }>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-2 flex items-center gap-1">
                  {todayBoarding?.boarding_status === 'boarded'
                    ? <CheckCircle className="h-4 w-4 text-green-600" />
                    : todayBoarding?.boarding_status === 'absent'
                      ? <XCircle className="h-4 w-4 text-red-600" />
                      : <Clock className="h-4 w-4 text-gray-400" />
                  }
                  Today's Status
                </h3>
                {todayBoarding ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge className={
                        todayBoarding.boarding_status === 'boarded'
                          ? 'bg-green-100 text-green-700'
                          : todayBoarding.boarding_status === 'absent'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                      }>
                        {todayBoarding.boarding_status === 'boarded' ? '✅ Boarded' : todayBoarding.boarding_status === 'absent' ? '❌ Absent' : todayBoarding.boarding_status}
                      </Badge>
                      <span className="ml-2 text-sm text-gray-500 capitalize">{todayBoarding.trip_type} trip</span>
                    </div>
                    {todayBoarding.boarding_time && (
                      <span className="text-sm font-medium">{todayBoarding.boarding_time}</span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No boarding record today yet</p>
                )}
              </CardContent>
            </Card>

            {/* ═══ Driver Details ═══ */}
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-1">
                  <User className="h-4 w-4" /> Driver Details
                </h3>
                {driverDetails ? (
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                      {driverDetails.photo_url
                        ? <img src={driverDetails.photo_url} className="w-14 h-14 rounded-full object-cover" alt="" />
                        : '👨‍✈️'}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-white">{driverDetails.name}</p>
                      <p className="text-sm text-gray-500">License: {driverDetails.license_number || 'N/A'}</p>
                    </div>
                    {driverDetails.phone && (
                      <a href={`tel:${driverDetails.phone}`}
                        className="p-3 bg-green-100 rounded-full text-green-700 hover:bg-green-200 transition"
                      >
                        <Phone className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                ) : routeDetails.vehicle ? (
                  <p className="text-sm text-gray-500">Driver not assigned to vehicle</p>
                ) : (
                  <p className="text-sm text-gray-500">Vehicle not assigned</p>
                )}
              </CardContent>
            </Card>

            {/* ═══ Route Stops ═══ */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Route Stops</CardTitle>
              </CardHeader>
              <CardContent>
                {pickupPoints.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No pickup points defined</p>
                ) : (
                  <div className="relative">
                    {pickupPoints.map((point, idx) => {
                      const isMyStop = point.pickup_point?.id === routeDetails.student_pickup_point_id;
                      return (
                        <div key={point.id} className="flex gap-3 mb-1">
                          {/* Timeline */}
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                              isMyStop
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-300'
                            }`}>
                              {point.stop_order || idx + 1}
                            </div>
                            {idx < pickupPoints.length - 1 && (
                              <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-700" />
                            )}
                          </div>
                          {/* Stop details */}
                          <div className={`flex-1 pb-3 ${isMyStop ? 'font-semibold' : ''}`}>
                            <p className="text-sm flex items-center gap-1">
                              {point.pickup_point?.name || 'Unknown'}
                              {isMyStop && (
                                <Badge className="ml-1 bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0">
                                  Your Stop
                                </Badge>
                              )}
                            </p>
                            <div className="flex gap-3 text-xs text-gray-500">
                              {point.pickup_time && <span>⏰ {point.pickup_time}</span>}
                              {point.distance && <span>📏 {point.distance} km</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ═══ Boarding History ═══ */}
            {boardingHistory.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <button className="w-full flex items-center justify-between"
                    onClick={() => setShowHistory(!showHistory)}>
                    <h3 className="font-semibold flex items-center gap-1">
                      <Clock className="h-4 w-4" /> Boarding History
                      <Badge variant="secondary" className="ml-1">{boardingHistory.length}</Badge>
                    </h3>
                    {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {showHistory && (
                    <div className="mt-3 space-y-1 max-h-60 overflow-y-auto">
                      {boardingHistory.map((b, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                          <div className="flex items-center gap-2">
                            <span className={
                              b.boarding_status === 'boarded' ? 'text-green-600' :
                              b.boarding_status === 'absent' ? 'text-red-600' : 'text-gray-400'
                            }>
                              {b.boarding_status === 'boarded' ? '✅' : b.boarding_status === 'absent' ? '❌' : '⚪'}
                            </span>
                            <span>{formatDateWithMonthName(b.boarding_date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500 text-xs">
                            <span className="capitalize">{b.trip_type}</span>
                            {b.boarding_time && <span>{b.boarding_time}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ═══ Emergency SOS ═══ */}
            <Card className="border-red-200">
              <CardContent className="pt-4 text-center">
                <a href="tel:112"
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-full font-bold hover:bg-red-700 transition shadow-lg"
                >
                  <AlertTriangle className="h-5 w-5" />
                  🆘 Emergency SOS
                </a>
                <p className="text-xs text-gray-500 mt-2">
                  Tap in case of emergency. This will call emergency services.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ParentTransport;
