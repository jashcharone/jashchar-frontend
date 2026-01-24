import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Hotel, Bed, IndianRupee, Building } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const StudentHostelRooms = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [hostelDetails, setHostelDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHostelDetails = async () => {
            if (!user || !user.profile || !user.profile.id || !user.profile.hostel_details_id) {
                setLoading(false);
                return;
            }

            try {
                const { data: hostelData, error: hostelError } = await supabase
                    .from('student_hostel_details')
                    .select(`
                        *,
                        room:hostel_rooms(
                            *,
                            hostel:hostels(name),
                            room_type:hostel_room_types(name)
                        )
                    `)
                    .eq('id', user.profile.hostel_details_id)
                    .single();

                if (hostelError) throw hostelError;

                if (!hostelData || !hostelData.room) {
                    setHostelDetails(null);
                } else {
                    setHostelDetails(hostelData);
                }

            } catch (error) {
                console.error("Error fetching hostel details:", error);
                toast({
                    variant: 'destructive',
                    title: 'Error fetching hostel details',
                    description: error.message,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchHostelDetails();
    }, [user, toast]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-6">My Hostel Room</h1>
            {hostelDetails && hostelDetails.room ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Hotel className="h-6 w-6" /> Room {hostelDetails.room.room_number_name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-center text-lg">
                            <Hotel className="mr-3 h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Hostel</p>
                                <p className="font-semibold">{hostelDetails.room.hostel?.name || 'N/A'}</p>
                            </div>
                        </div>
                         <div className="flex items-center text-lg">
                            <Building className="mr-3 h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Room Type</p>
                                <p className="font-semibold">{hostelDetails.room.room_type?.name || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center text-lg">
                            <Bed className="mr-3 h-5 w-5 text-muted-foreground" />
                             <div>
                                <p className="text-sm text-muted-foreground">Bed Number</p>
                                <p className="font-semibold">{hostelDetails.bed_number || 'Not Assigned'}</p>
                            </div>
                        </div>
                        <div className="flex items-center text-lg">
                            <IndianRupee className="mr-3 h-5 w-5 text-muted-foreground" />
                             <div>
                                <p className="text-sm text-muted-foreground">Cost per Bed</p>
                                <p className="font-semibold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(hostelDetails.room.cost_per_bed || 0)}</p>
                            </div>
                        </div>
                         <div className="md:col-span-2">
                            <p className="text-sm text-muted-foreground">Description</p>
                            <p>{hostelDetails.room.description || 'No description provided.'}</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <p>You are not assigned to any hostel room.</p>
                </div>
            )}
        </DashboardLayout>
    );
};

export default StudentHostelRooms;
