/**
 * ParentHostel - View child's hostel details
 */
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ChildSelector from '@/components/ChildSelector';
import { useParentChild } from '@/contexts/ParentChildContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Building, Bed, Hotel, IndianRupee } from 'lucide-react';

const ParentHostel = () => {
  const { selectedChild } = useParentChild();
  const { toast } = useToast();
  const [hostelDetails, setHostelDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHostelDetails = async () => {
      if (!selectedChild?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Query student_hostel_details directly by student_id (avoids RLS issue on student_profiles)
        const { data: hostelData, error: hostelError } = await supabase
          .from('student_hostel_details')
          .select(`
            *,
            hostel:hostels(name),
            room:hostel_rooms!room_id(
              room_number_name, no_of_bed, cost_per_bed,
              room_type:hostel_room_types(name)
            )
          `)
          .eq('student_id', selectedChild.id)
          .maybeSingle();

        if (hostelError) throw hostelError;
        setHostelDetails(hostelData || null);
      } catch (error) {
        console.error('Error fetching hostel details:', error);
        toast({ variant: 'destructive', title: 'Error fetching hostel details', description: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchHostelDetails();
  }, [selectedChild, toast]);

  const childName = selectedChild ? (selectedChild.full_name || `${selectedChild.first_name} ${selectedChild.last_name}`) : '';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building className="h-6 w-6" />
          Hostel Details
        </h1>

        <ChildSelector />

        {!selectedChild ? (
          <Card className="p-8 text-center text-muted-foreground">No child selected</Card>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !hostelDetails ? (
          <Card className="p-8 text-center">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Hostel Assigned</h3>
            <p className="text-muted-foreground">
              {childName} does not have any hostel room assigned.
              Contact the school administration for hostel enrollment.
            </p>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hotel className="h-5 w-5" />
                Room {hostelDetails.room?.room_number_name || hostelDetails.room_number || 'N/A'}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building className="h-3 w-3" /> Hostel
                </p>
                <p className="font-medium">{hostelDetails.hostel?.name || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Bed className="h-3 w-3" /> Room Type
                </p>
                <p className="font-medium">{hostelDetails.room?.room_type?.name || hostelDetails.room_type || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Room Number</p>
                <p className="font-medium">{hostelDetails.room?.room_number_name || hostelDetails.room_number || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Bed Number</p>
                <p className="font-medium">{hostelDetails.bed_number || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Beds</p>
                <p className="font-medium">{hostelDetails.room?.no_of_bed || 'N/A'}</p>
              </div>
              {(hostelDetails.hostel_fee || hostelDetails.room?.cost_per_bed) && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" /> Hostel Fee
                  </p>
                  <p className="font-medium">₹{Number(hostelDetails.hostel_fee || hostelDetails.room?.cost_per_bed).toLocaleString()}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Student</p>
                <p className="font-medium">{childName}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ParentHostel;
