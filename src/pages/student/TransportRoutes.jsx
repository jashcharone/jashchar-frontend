import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, MapPin, Bus, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Import the Button component

const StudentTransportRoutes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [routeDetails, setRouteDetails] = useState(null);
  const [pickupPoints, setPickupPoints] = useState([]);

  const studentId = user?.id;
  const branchId = user?.profile?.branch_id;

  const fetchTransportDetails = useCallback(async () => {
    if (!studentId || !branchId) return;
    setLoading(true);

    try {
      // 1. Get the student's transport details
      const { data: transportData, error: transportError } = await supabase
        .from('student_transport_details')
        .select(`
          transport_route_id,
          transport_pickup_point_id,
          vehicle:transport_vehicles(vehicle_number, driver_name, driver_contact)
        `)
        .eq('student_id', studentId)
        .eq('branch_id', branchId)
        .single();

      if (transportError || !transportData) {
        if (transportError && transportError.code !== 'PGRST116') throw transportError;
        setRouteDetails(null); // No transport assigned
        setLoading(false);
        return;
      }
      
      // 2. Get the full route details
      const { data: routeData, error: routeError } = await supabase
        .from('transport_routes')
        .select('route_title')
        .eq('id', transportData.transport_route_id)
        .single();
      if(routeError) throw routeError;

      // 3. Get all pickup points for that route, ordered
      const { data: pointsData, error: pointsError } = await supabase
        .from('route_pickup_point_mappings')
        .select(`
          id,
          distance,
          pickup_time,
          stop_order,
          pickup_point:transport_pickup_points(id, name, latitude, longitude)
        `)
        .eq('route_id', transportData.transport_route_id)
        .order('stop_order', { ascending: true });

      if (pointsError) throw pointsError;

      setRouteDetails({
        ...routeData,
        ...transportData,
        student_pickup_point_id: transportData.transport_pickup_point_id
      });
      setPickupPoints(pointsData);

    } catch (error) {
      console.error('Error fetching transport details:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to fetch transport details',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [studentId, branchId, toast]);

  useEffect(() => {
    fetchTransportDetails();
  }, [fetchTransportDetails]);

  const openMap = (lat, lon) => {
    if (lat && lon) {
      window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`, '_blank');
    } else {
      toast({ variant: 'destructive', title: 'Coordinates not available.' });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!routeDetails) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold">No Transport Assigned</h2>
          <p className="text-muted-foreground mt-2">
            You are not currently assigned to a transport route. Please contact the school administration.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">My Transport Route</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Route</CardTitle></CardHeader>
          <CardContent className="text-lg font-semibold">{routeDetails.route_title}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Vehicle Number</CardTitle></CardHeader>
          <CardContent className="text-lg font-semibold">{routeDetails.vehicle?.vehicle_number || 'N/A'}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Driver</CardTitle></CardHeader>
          <CardContent>
            <p className="font-semibold">{routeDetails.vehicle?.driver_name || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">{routeDetails.vehicle?.driver_contact || 'N/A'}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Route Stops</CardTitle>
          <CardDescription>List of all stops on your assigned route.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 h-full w-0.5 bg-border" aria-hidden="true" />
            <ul className="space-y-4">
              {pickupPoints.map((point) => (
                <li key={point.id} className="relative pl-12">
                  <div className={`absolute left-0 top-1.5 flex h-8 w-8 items-center justify-center rounded-full ${point.pickup_point.id === routeDetails.student_pickup_point_id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Bus className="h-4 w-4" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className={`font-semibold ${point.pickup_point.id === routeDetails.student_pickup_point_id ? 'text-primary' : ''}`}>
                        {point.pickup_point.name}
                        {point.pickup_point.id === routeDetails.student_pickup_point_id && " (Your Stop)"}
                      </p>
                      <div className="text-sm text-muted-foreground flex items-center gap-4">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {point.pickup_time || 'N/A'}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {point.distance || 'N/A'} km</span>
                      </div>
                    </div>
                    {point.pickup_point.latitude && point.pickup_point.longitude && (
                      <Button variant="ghost" size="sm" onClick={() => openMap(point.pickup_point.latitude, point.pickup_point.longitude)}>
                        View on Map <MapPin className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default StudentTransportRoutes;
