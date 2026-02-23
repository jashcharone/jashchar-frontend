/**
 * ParentTransport - View child's transport details
 */
import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ChildSelector from '@/components/ChildSelector';
import { useParentChild } from '@/contexts/ParentChildContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Bus, MapPin, Clock, Phone } from 'lucide-react';

const ParentTransport = () => {
  const { selectedChild } = useParentChild();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [routeDetails, setRouteDetails] = useState(null);
  const [pickupPoints, setPickupPoints] = useState([]);

  const fetchTransportDetails = useCallback(async () => {
    if (!selectedChild?.id || !selectedChild?.branch_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: transportData, error: transportError } = await supabase
        .from('student_transport_details')
        .select(`
          transport_route_id,
          transport_pickup_point_id,
          vehicle:transport_vehicles(vehicle_number, driver_name, driver_contact)
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

      const { data: routeData, error: routeError } = await supabase
        .from('transport_routes')
        .select('route_title')
        .eq('id', transportData.transport_route_id)
        .single();
      if (routeError) throw routeError;

      const { data: pointsData, error: pointsError } = await supabase
        .from('route_pickup_point_mappings')
        .select(`
          id, distance, pickup_time, stop_order,
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
      setPickupPoints(pointsData || []);
    } catch (error) {
      console.error('Error fetching transport details:', error);
      toast({ variant: 'destructive', title: 'Failed to fetch transport details', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [selectedChild, toast]);

  useEffect(() => {
    fetchTransportDetails();
  }, [fetchTransportDetails]);

  const childName = selectedChild ? (selectedChild.full_name || `${selectedChild.first_name} ${selectedChild.last_name}`) : '';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bus className="h-6 w-6" />
          Transport Details
        </h1>

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
            {/* Route Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="h-5 w-5" />
                  Route: {routeDetails.route_title}
                </CardTitle>
                <CardDescription>Transport details for {childName}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {routeDetails.vehicle && (
                  <>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Vehicle Number</p>
                      <p className="font-medium">{routeDetails.vehicle.vehicle_number || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Driver Name</p>
                      <p className="font-medium">{routeDetails.vehicle.driver_name || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Driver Contact
                      </p>
                      <p className="font-medium">{routeDetails.vehicle.driver_contact || 'N/A'}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pickup Points */}
            <Card>
              <CardHeader>
                <CardTitle>Pickup Points</CardTitle>
              </CardHeader>
              <CardContent>
                {pickupPoints.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No pickup points defined</p>
                ) : (
                  <div className="space-y-3">
                    {pickupPoints.map((point, idx) => {
                      const isMyStop = point.pickup_point?.id === routeDetails.student_pickup_point_id;
                      return (
                        <div
                          key={point.id}
                          className={`flex items-center gap-4 p-3 rounded-lg border ${
                            isMyStop ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : ''
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            isMyStop ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}>
                            {point.stop_order || idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {point.pickup_point?.name || 'Unknown'}
                              {isMyStop && (
                                <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                  Your Stop
                                </span>
                              )}
                            </p>
                            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                              {point.pickup_time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {point.pickup_time}
                                </span>
                              )}
                              {point.distance && (
                                <span>{point.distance} km</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ParentTransport;
